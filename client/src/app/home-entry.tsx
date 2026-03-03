import { useEffect } from 'react';

import Welcome from '@/pages/welcome';

type TConnectionInfo = {
  saveData?: boolean;
  effectiveType?: string;
};

type TRuntimeInfo = Navigator & {
  connection?: TConnectionInfo;
  deviceMemory?: number;
  hardwareConcurrency?: number;
};

const getConnectionInfo = () =>
  (navigator as Navigator & { connection?: TConnectionInfo }).connection;

const preloadStudioResources = async () => {
  await import('./studio-entry');
};

const preloadModulesSequentially = (loaders: Array<() => Promise<unknown>>) => {
  void (async () => {
    for (const load of loaders) {
      try {
        await load();
      } catch {
        // Ignore preload errors so main navigation keeps working.
      }
    }
  })();
};

const preloadCoreViews = () => {
  preloadModulesSequentially([
    () => import('@/components/header-layout'),
    () => import('@/components/menu-layout'),
    () => import('@/pages/not-selected'),
    () => import('@/pages/shell'),
  ]);
};

const preloadDocumentStores = () => {
  preloadModulesSequentially([
    () => import('@/pages/redis-database-viewer'),
    () => import('@/pages/mongodb-collection-viewer'),
  ]);
};

const preloadRelationalViewers = () => {
  preloadModulesSequentially([
    () => import('@/pages/mysql-viewer'),
    () => import('@/pages/pgsql-viewer'),
  ]);
};

const shouldSkipBackgroundPreload = () => {
  const connection = getConnectionInfo();
  if (!connection) {
    return false;
  }

  if (connection.saveData) {
    return true;
  }

  return connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g';
};

const isConstrainedDevice = () => {
  const runtimeInfo = navigator as TRuntimeInfo;
  const hasLowMemory =
    typeof runtimeInfo.deviceMemory === 'number' && runtimeInfo.deviceMemory <= 2;
  const hasLowCpu =
    typeof runtimeInfo.hardwareConcurrency === 'number' && runtimeInfo.hardwareConcurrency <= 4;

  return hasLowMemory || hasLowCpu;
};

const shouldDelayHeavyPreload = () => {
  const connection = getConnectionInfo();
  if (connection?.effectiveType === '3g') {
    return true;
  }

  return isConstrainedDevice();
};

const scheduleIdleTask = (
  callback: () => void,
  options: { fallbackDelay: number; timeout: number },
) => {
  const win = window as Window & {
    requestIdleCallback?: (cb: IdleRequestCallback, idleOptions?: IdleRequestOptions) => number;
    cancelIdleCallback?: (handle: number) => void;
  };

  let timerId: number | undefined;
  let idleId: number | undefined;

  if (typeof win.requestIdleCallback === 'function') {
    idleId = win.requestIdleCallback(() => callback(), { timeout: options.timeout });
  } else {
    timerId = window.setTimeout(callback, options.fallbackDelay);
  }

  return () => {
    if (timerId !== undefined) {
      window.clearTimeout(timerId);
    }
    if (idleId !== undefined && typeof win.cancelIdleCallback === 'function') {
      win.cancelIdleCallback(idleId);
    }
  };
};

const scheduleUserIntentTask = (callback: () => void, fallbackDelay: number) => {
  const events: Array<keyof WindowEventMap> = ['pointerdown', 'keydown', 'touchstart', 'mousemove'];

  let triggered = false;

  const run = () => {
    if (triggered) {
      return;
    }
    triggered = true;
    events.forEach(eventName => window.removeEventListener(eventName, run));
    window.clearTimeout(timerId);
    callback();
  };

  events.forEach(eventName => {
    window.addEventListener(eventName, run, { once: true, passive: true });
  });
  const timerId = window.setTimeout(run, fallbackDelay);

  return () => {
    events.forEach(eventName => window.removeEventListener(eventName, run));
    window.clearTimeout(timerId);
  };
};

const HomeEntry = () => {
  useEffect(() => {
    if (shouldSkipBackgroundPreload()) {
      return;
    }

    let cancelled = false;
    const disposers: Array<() => void> = [];

    const runPreload = () => {
      if (cancelled) {
        return;
      }

      void preloadStudioResources().then(() => {
        if (cancelled) {
          return;
        }

        const disposeCore = scheduleIdleTask(
          () => {
            if (!cancelled) {
              preloadCoreViews();
            }
          },
          { fallbackDelay: 2200, timeout: 4200 },
        );
        disposers.push(disposeCore);

        if (shouldDelayHeavyPreload()) {
          const disposeOnIntent = scheduleUserIntentTask(() => {
            if (!cancelled) {
              preloadDocumentStores();
              preloadRelationalViewers();
            }
          }, 12000);
          disposers.push(disposeOnIntent);
          return;
        }

        const disposeDocumentStores = scheduleIdleTask(
          () => {
            if (!cancelled) {
              preloadDocumentStores();
            }
          },
          { fallbackDelay: 4400, timeout: 6800 },
        );
        disposers.push(disposeDocumentStores);

        const disposeRelational = scheduleIdleTask(
          () => {
            if (!cancelled) {
              preloadRelationalViewers();
            }
          },
          { fallbackDelay: 7600, timeout: 11000 },
        );
        disposers.push(disposeRelational);
      });
    };

    const schedule = () => {
      const disposePrimary = scheduleIdleTask(runPreload, {
        fallbackDelay: 1200,
        timeout: 2200,
      });
      disposers.push(disposePrimary);
    };

    if (document.readyState === 'complete') {
      schedule();
    } else {
      window.addEventListener('load', schedule, { once: true });
    }

    return () => {
      cancelled = true;
      window.removeEventListener('load', schedule);
      disposers.forEach(dispose => dispose());
    };
  }, []);

  return <Welcome />;
};

export default HomeEntry;
