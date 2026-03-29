import { useEffect, useRef, useState } from 'react';

// Advanced 3D-like visual effects for feed items
export default function HolographicFeedLayer({ children, enabled = true }) {
  const containerRef = useRef(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!enabled) return;

    const handleMouseMove = (e) => {
      if (!containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      
      setMousePos({ x, y });
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
      return () => container.removeEventListener('mousemove', handleMouseMove);
    }
  }, [enabled]);

  if (!enabled) return children;

  return (
    <div 
      ref={containerRef}
      className="relative"
      style={{
        transform: `perspective(1000px) rotateX(${(mousePos.y - 0.5) * 2}deg) rotateY(${(mousePos.x - 0.5) * 2}deg)`,
        transition: 'transform 0.1s ease-out'
      }}
    >
      {/* Holographic shimmer overlay */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          background: `radial-gradient(circle at ${mousePos.x * 100}% ${mousePos.y * 100}%, rgba(0,255,136,0.3) 0%, transparent 50%)`
        }}
      />
      
      {children}
    </div>
  );
}

// Parallax effect component
export function ParallaxPost({ children, depth = 1 }) {
  const ref = useRef(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!ref.current) return;
      
      const rect = ref.current.getBoundingClientRect();
      const scrolled = window.scrollY;
      const elementTop = rect.top + scrolled;
      const viewportHeight = window.innerHeight;
      
      const parallaxOffset = ((scrolled - elementTop + viewportHeight) / viewportHeight) * 20 * depth;
      setOffset(parallaxOffset);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, [depth]);

  return (
    <div ref={ref} style={{ transform: `translateY(${offset}px)` }}>
      {children}
    </div>
  );
}