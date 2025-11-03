'use client'

import { useEffect, useState } from 'react';

const AdBanner = () => {
  const [size, setSize] = useState({ width: 468, height: 60 });

  useEffect(() => {
    // Function to determine banner size based on screen width
    const updateSize = () => {
      const width = window.innerWidth;
      if (width < 400) {
        setSize({ width: 300, height: 50 }); // small mobile
      } else if (width < 768) {
        setSize({ width: 320, height: 50 }); // tablet / large mobile
      } else {
        setSize({ width: 468, height: 60 }); // desktop
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  useEffect(() => {
    const container = document.getElementById('ad-container');
    if (!container) return;

    container.innerHTML = ''; // clear any previous ad before reloading

    // Define ad options globally
    (window as any).atOptions = {
      key: '3928b3bde7117bfc8aa4314b3eee29d4',
      format: 'iframe',
      height: size.height,
      width: size.width,
      params: {}
    };

    // Inject the ad script
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = '//www.highperformanceformat.com/3928b3bde7117bfc8aa4314b3eee29d4/invoke.js';
    script.async = true;

    container.appendChild(script);

    // Cleanup
    return () => {
      container.innerHTML = '';
    };
  }, [size]);

  return (
    <div
      id="ad-container"
      style={{
        width: `${size.width}px`,
        height: `${size.height}px`,
        margin: '0 auto',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: '10px',
      }}
    />
  );
};

export default AdBanner;
