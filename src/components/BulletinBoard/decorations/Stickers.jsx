// src/components/Home/Spotlight/decorations/Stickers.jsx
import React from 'react';
import styled from 'styled-components';
import { SeasonalStickers } from './stickerData.jsx';


// Sticker Component
const Sticker = styled.div`
  position: absolute;
  width: ${props => props.$size}px;
  height: ${props => props.$size}px;
  left: 0;
  top: 0;
  transform: translate3d(var(--x), var(--y), 0) rotate(var(--r));
  cursor: move;
  user-select: none;
  touch-action: auto;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.15));
  opacity: 0.85;
  transition: transform 0.2s, opacity 0.2s;
  z-index: 4;
  will-change: transform;

  &:hover {
    opacity: 1;
    transform: translate3d(var(--x), var(--y), 0) rotate(var(--r)) scale(1.1);
  }

  svg {
    width: 100%;
    height: 100%;
  }
`;

const Stickers = ({ stickers, onDoubleClick }) => {
  return (
    <>
      {stickers.map(sticker => (
        <Sticker
          key={sticker.id}
          data-bb-draggable="1"
          data-bb-kind="sticker"
          data-bb-id={sticker.id}
          $size={sticker.size}
          style={{ '--x': `${sticker.x}px`, '--y': `${sticker.y}px`, '--r': `${sticker.rotate}deg` }}
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
