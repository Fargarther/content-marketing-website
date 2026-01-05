// src/components/Home/Spotlight/decorations/Stickers.jsx
'use client';
import React from 'react';
import styled from 'styled-components';
import { SeasonalStickers } from './stickerData.jsx';


// Sticker Component
const Sticker = styled.div`
  --x: ${props => props.$x}px;
  --y: ${props => props.$y}px;
  --rotate: ${props => props.$rotate}deg;
  position: absolute;
  width: ${props => props.$size}px;
  height: ${props => props.$size}px;
  left: 0;
  top: 0;
  transform: translate3d(var(--x), var(--y), 0) rotate(var(--rotate));
  cursor: move;
  user-select: none;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.15));
  opacity: 0.85;
  transition: ${props => props.$isDragging ? 'none' : 'transform 0.2s, opacity 0.2s'};
  z-index: ${props => props.$isDragging ? 50 : 4};
  contain: layout style;
  will-change: ${props => props.$isDragging ? 'transform' : 'auto'};
  
  &:hover {
    opacity: 1;
    transform: translate3d(var(--x), var(--y), 0) rotate(var(--rotate)) scale(1.1);
  }
  
  svg {
    width: 100%;
    height: 100%;
  }
`;

const Stickers = ({ stickers, onMouseDown, onDoubleClick, draggedItem, getStickerRef }) => {
  return (
    <>
      {stickers.map(sticker => (
        <Sticker
          key={sticker.id}
          $size={sticker.size}
          $x={sticker.x}
          $y={sticker.y}
          $rotate={sticker.rotate}
          $isDragging={draggedItem?.id === sticker.id}
          ref={getStickerRef ? getStickerRef(sticker.id) : undefined}
          style={{
            '--x': `${sticker.x}px`,
            '--y': `${sticker.y}px`,
          }}
          onMouseDown={(e) => onMouseDown(e, sticker.id, 'sticker')}
          onDoubleClick={() => onDoubleClick(sticker.id)}
          title="Drag to move, double-click to delete"
        >
          {SeasonalStickers[sticker.type]?.svg}
        </Sticker>
      ))}
    </>
  );
};

const areEqual = (prevProps, nextProps) => {
  if (prevProps.stickers !== nextProps.stickers) return false;
  if (prevProps.draggedItem?.id !== nextProps.draggedItem?.id) return false;
  if (prevProps.draggedItem?.type !== nextProps.draggedItem?.type) return false;
  return true;
};

export default React.memo(Stickers, areEqual);
