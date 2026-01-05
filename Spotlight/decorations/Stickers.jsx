// src/components/Home/Spotlight/decorations/Stickers.jsx
import React from 'react';
import styled from 'styled-components';
import { SeasonalStickers } from './stickerData.jsx';


// Sticker Component
const Sticker = styled.div`
  position: absolute;
  width: ${props => props.$size}px;
  height: ${props => props.$size}px;
  left: ${props => props.$x}px;
  top: ${props => props.$y}px;
  transform: rotate(${props => props.$rotate}deg);
  cursor: move;
  user-select: none;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.15));
  opacity: 0.85;
  transition: transform 0.2s, opacity 0.2s;
  z-index: ${props => props.$isDragging ? 50 : 4};
  
  &:hover {
    opacity: 1;
    transform: rotate(${props => props.$rotate}deg) scale(1.1);
  }
  
  svg {
    width: 100%;
    height: 100%;
  }
`;

const Stickers = ({ stickers, onMouseDown, onDoubleClick, draggedItem }) => {
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

export default Stickers;