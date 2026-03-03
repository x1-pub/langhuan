import { useCallback, useLayoutEffect, useRef, useState } from 'react';

const TABLE_BODY_MIN_HEIGHT = 1;
const TABLE_BODY_RESERVED_SPACE = 8;
const TABLE_HEIGHT_DIFF_TOLERANCE = 1;

const getElementHeight = (element: Element | null): number => {
  if (!(element instanceof HTMLElement)) {
    return 0;
  }

  return element.offsetHeight;
};

const useTableScrollY = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState(TABLE_BODY_MIN_HEIGHT);

  const recalcScrollY = useCallback(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const containerHeight = container.clientHeight;
    if (containerHeight <= 0) {
      return;
    }

    const headerHeight =
      getElementHeight(container.querySelector('.langhuan-table-header')) ||
      getElementHeight(container.querySelector('.ant-table-header')) ||
      getElementHeight(container.querySelector('.langhuan-table-thead')) ||
      getElementHeight(container.querySelector('.ant-table-thead'));
    const paginationHeight =
      getElementHeight(container.querySelector('.langhuan-pagination')) ||
      getElementHeight(container.querySelector('.ant-pagination'));
    const titleHeight =
      getElementHeight(container.querySelector('.langhuan-table-title')) ||
      getElementHeight(container.querySelector('.ant-table-title'));
    const footerHeight =
      getElementHeight(container.querySelector('.langhuan-table-footer')) ||
      getElementHeight(container.querySelector('.ant-table-footer'));

    const nextScrollY = Math.max(
      TABLE_BODY_MIN_HEIGHT,
      containerHeight -
        headerHeight -
        paginationHeight -
        titleHeight -
        footerHeight -
        TABLE_BODY_RESERVED_SPACE,
    );

    setScrollY(previous => {
      if (Math.abs(previous - nextScrollY) < TABLE_HEIGHT_DIFF_TOLERANCE) {
        return previous;
      }

      return nextScrollY;
    });
  }, []);

  useLayoutEffect(() => {
    recalcScrollY();

    const container = containerRef.current;
    if (!container || typeof ResizeObserver === 'undefined') {
      return;
    }

    const observer = new ResizeObserver(() => {
      recalcScrollY();
    });

    observer.observe(container);

    const tableRoot =
      container.querySelector<HTMLElement>('.langhuan-table') ||
      container.querySelector<HTMLElement>('.ant-table');

    if (tableRoot) {
      observer.observe(tableRoot);
    }

    return () => {
      observer.disconnect();
    };
  }, [recalcScrollY]);

  return {
    containerRef,
    scrollY,
    recalcScrollY,
  };
};

export default useTableScrollY;
