'use client';

import { useEffect, useRef } from 'react';

const VerticalAdRight = () => {
  const adRef = useRef<HTMLDivElement>(null);
  const isLoaded = useRef(false);

  useEffect(() => {
    if (isLoaded.current) return;
    if (window.innerWidth < 1024) return;

    const container = adRef.current;
    if (!container) return;

    isLoaded.current = true;

    (window as any).atOptions = {
      key: 'd5b2c8197221ffdb860070525179812e', // 160x600 ID (you can change this if needed)
      format: 'iframe',
      width: 160,
      height: 600,
      params: {},
    };

    const script = document.createElement('script');
    script.src =
      'https://www.highperformanceformat.com/d5b2c8197221ffdb860070525179812e/invoke.js';
    script.async = true;

    container.appendChild(script);
  }, []);

  if (typeof window !== 'undefined' && window.innerWidth < 1024) return null;

  return (
    <div style={{ width: 160, height: 600, position: 'sticky', top: 20 }}>
      <div ref={adRef} style={{ width: 160, height: 600 }} />
    </div>
  );
};

export default VerticalAdRight;
