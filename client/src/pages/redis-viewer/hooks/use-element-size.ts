import { useState, useEffect } from 'react';

type Size = {
  width: number;
  height: number;
};

const useElementSize = (id: string): Size => {
  const [size, setSize] = useState<Size>({ width: 0, height: 0 });

  useEffect(() => {
    const element = document.getElementById(id);

    if (!element) {
      setSize({ width: 0, height: 0 });
      return;
    }

    const observer = new ResizeObserver(entries => {
      const entry = entries[0];
      if (entry) {
        setSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });

    observer.observe(element);

    setSize({
      width: element.offsetWidth,
      height: element.offsetHeight,
    });

    return () => {
      observer.disconnect();
    };
  }, [id]);

  return size;
};

export default useElementSize;
