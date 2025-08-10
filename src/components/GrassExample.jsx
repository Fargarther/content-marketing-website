import React from 'react';
import { spriteUrl, hasSprite } from '../sprites/grass';

/**
 * Example component showing safe sprite usage
 */
export function GrassBlade({ name, className, alt }) {
  const url = spriteUrl(name); // e.g., 'blade_green_01' or 'blade_green_01.png'
  
  // Fail gracefully - render nothing if sprite is missing
  if (!url) {
    return null;
  }
  
  return (
    <img 
      src={url} 
      alt={alt || name} 
      className={className}
      draggable={false}
    />
  );
}

/**
 * Example component rendering multiple grass sprites
 */
export function GrassMeadow() {
  // Define the sprites we want to render
  const bladeNames = [
    'blade_green_01',
    'blade_green_02',
    'blade_green_03',
    'blade_green_left_01',
    'blade_green_left_02',
    'blade_green_straight_01',
    'blade_green_straight_02',
    'blade_green_straigh_03', // Note: typo in actual filename
    'seed_head_01',
    'seed_head_02'
  ];
  
  return (
    <div className="grass-meadow" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
      {bladeNames.map(name => {
        // Only render if sprite exists
        if (!hasSprite(name)) {
          console.warn(`Skipping missing sprite: ${name}`);
          return null;
        }
        
        return (
          <div key={name} style={{ textAlign: 'center' }}>
            <GrassBlade 
              name={name}
              className="grass-sprite"
              alt={`Grass sprite: ${name}`}
            />
            <small>{name}</small>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Example showing conditional rendering based on sprite availability
 */
export function SafeGrassComponent({ spriteName, fallbackContent }) {
  const url = spriteUrl(spriteName);
  
  if (url) {
    return <img src={url} alt={spriteName} style={{ maxHeight: '100px' }} />;
  }
  
  // Render fallback content if sprite is missing
  if (fallbackContent) {
    return fallbackContent;
  }
  
  // Default fallback
  return (
    <div style={{ 
      width: '50px', 
      height: '100px', 
      background: '#6b7d5f',
      borderRadius: '2px'
    }} />
  );
}

export default GrassMeadow;