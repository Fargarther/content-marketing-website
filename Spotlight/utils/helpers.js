// src/components/Home/Spotlight/utils/helpers.js
import { PIN_COLORS, BOARD_DIMENSIONS, CARD_DIMENSIONS, FLIP_SOUND_DATA } from './constants';

export const getRandomRotation = () => {
  return (Math.random() * 10) - 5; // -5 to 5 degrees
};

export const getPinColor = () => {
  return PIN_COLORS[Math.floor(Math.random() * PIN_COLORS.length)];
};

export const getRotatedBoundingBox = (width, height, rotation) => {
  const rad = (rotation * Math.PI) / 180;
  const cos = Math.abs(Math.cos(rad));
  const sin = Math.abs(Math.sin(rad));
  
  const newWidth = width * cos + height * sin;
  const newHeight = width * sin + height * cos;
  
  return { width: newWidth, height: newHeight };
};

export const getRandomPosition = (boardWidth, boardHeight, cardWidth = CARD_DIMENSIONS.width, cardHeight = CARD_DIMENSIONS.height) => {
  // The bulletin board container has padding that affects positioning
  // Let's use simple values that work visually
  
  // For horizontal positioning
  const minX = 10; // 10px from left edge
  const maxX = boardWidth - cardWidth - 80; // Account for padding and card width
  
  // For vertical positioning - allow cards to go higher at top, more space at bottom
  const minY = 0; // Allow cards to start at the very top of the content area
  const maxY = boardHeight - cardHeight - 100; // Leave more space at bottom
  
  // Ensure we have valid ranges
  const safeMaxX = Math.max(minX + 10, maxX);
  const safeMaxY = Math.max(minY + 10, maxY);
  
  return {
    x: minX + Math.random() * (safeMaxX - minX),
    y: minY + Math.random() * (safeMaxY - minY)
  };
};

export const playFlipSound = () => {
  try {
    const flipSound = new Audio(FLIP_SOUND_DATA);
    flipSound.volume = 0.2;
    flipSound.play();
  } catch (e) {
    // Audio not supported
  }
};