import React from 'react';
import './SvgGrass.css';

export default function SvgGrass() {
  const tufts = Array.from({ length: 20 });
  return (
    <div className="svg-grass" aria-hidden="true">
      <svg viewBox="0 0 100 20" preserveAspectRatio="none">
        {tufts.map((_, i) => {
          const x = (i + 0.5) * (100 / tufts.length);
          return (
            <path
              key={i}
              className="tuft"
              d={`M${x - 1},20 L${x},0 L${x + 1},20`}
            />
          );
        })}
      </svg>
    </div>
  );
}
