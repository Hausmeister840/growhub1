import React from 'react';
import { motion } from 'framer-motion';

/**
 * 📐 RESPONSIVE GRID - Intelligentes Grid-System
 */

export default function ResponsiveGrid({ 
  children, 
  columns = { xs: 1, sm: 2, md: 3, lg: 4 },
  gap = 4,
  className = ''
}) {
  const colClasses = `
    grid-cols-${columns.xs} 
    sm:grid-cols-${columns.sm} 
    md:grid-cols-${columns.md} 
    lg:grid-cols-${columns.lg}
  `;

  const gapClass = `gap-${gap}`;

  return (
    <div className={`grid ${colClasses} ${gapClass} ${className}`}>
      {React.Children.map(children, (child, index) => (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          {child}
        </motion.div>
      ))}
    </div>
  );
}

// ✅ Masonry Grid (Pinterest-Style)
export function MasonryGrid({ children, columns = { xs: 1, sm: 2, md: 3 }, gap = 4 }) {
  const getColumnClass = () => {
    return `
      columns-${columns.xs}
      sm:columns-${columns.sm}
      md:columns-${columns.md}
    `;
  };

  return (
    <div className={`${getColumnClass()} gap-${gap}`}>
      {React.Children.map(children, (child, index) => (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.05 }}
          className="break-inside-avoid mb-4"
        >
          {child}
        </motion.div>
      ))}
    </div>
  );
}

// ✅ Auto Grid (automatische Spalten basierend auf Item-Größe)
export function AutoGrid({ 
  children, 
  minItemWidth = 250,
  gap = 4,
  className = ''
}) {
  return (
    <div 
      className={`grid gap-${gap} ${className}`}
      style={{
        gridTemplateColumns: `repeat(auto-fill, minmax(${minItemWidth}px, 1fr))`
      }}
    >
      {React.Children.map(children, (child, index) => (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          {child}
        </motion.div>
      ))}
    </div>
  );
}