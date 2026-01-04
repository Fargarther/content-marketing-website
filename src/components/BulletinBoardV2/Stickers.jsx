/**
 * Stickers component - Renders draggable sticker decorations
 */

import React from 'react';
import { StickerWrapper } from './styles';
import { SeasonalStickers } from '../BulletinBoard/decorations/stickerData.jsx';

function Stickers({ stickers, onPointerDown, onDoubleClick }) {
  return (
    <>
      {stickers.map(sticker => (
        <StickerWrapper
          key={sticker.id}
          $size={sticker.size}
          $zIndex={sticker.zIndex || 4}
          style={{
            '--x': `${sticker.x}px`,
            '--y': `${sticker.y}px`,
            '--r': `${sticker.rotate}deg`,
          }}
          onPointerDown={(e) => onPointerDown(e, sticker.id, 'sticker')}
          onDoubleClick={() => onDoubleClick?.(sticker.id)}
          title="Drag to move, double-click to delete"
        >
          {SeasonalStickers[sticker.type]?.svg}
        </StickerWrapper>
      ))}
    </>
  );
}

export default React.memo(Stickers);
