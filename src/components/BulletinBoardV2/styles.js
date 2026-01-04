/**
 * BulletinBoardV2 Styles
 * Preserves all original visual styling for stickers and post-its
 */

import styled, { keyframes } from 'styled-components';

// ============ STICKER STYLES ============

export const StickerWrapper = styled.div`
  position: absolute;
  left: 0;
  top: 0;
  width: ${props => props.$size}px;
  height: ${props => props.$size}px;
  transform: translate3d(var(--x, 0), var(--y, 0), 0) rotate(var(--r, 0deg));
  cursor: grab;
  user-select: none;
  touch-action: none;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.15));
  opacity: 0.85;
  transition: opacity 0.2s, filter 0.2s;
  z-index: ${props => props.$zIndex || 4};
  will-change: transform;

  &:hover {
    opacity: 1;
    filter: drop-shadow(0 3px 6px rgba(0, 0, 0, 0.2));
  }

  &:active {
    cursor: grabbing;
  }

  svg {
    width: 100%;
    height: 100%;
    pointer-events: none;
  }
`;

// ============ POST-IT STYLES ============

const fallAnimation = keyframes`
  from {
    transform: translate3d(var(--x), var(--y), 0) rotate(var(--r));
    opacity: 1;
  }
  15% {
    transform: translate3d(
      calc(var(--x) + var(--throwX) * 0.2),
      calc(var(--y) + var(--throwY) * 0.15),
      0
    ) rotate(calc(var(--r) + var(--spinAmount) * 0.1));
    opacity: 1;
  }
  80% {
    opacity: 0.8;
  }
  to {
    transform: translate3d(
      calc(var(--x) + var(--throwX) * 1.2),
      calc(var(--y) + 100vh + var(--throwY)),
      0
    ) rotate(calc(var(--r) + var(--spinAmount)));
    opacity: 0;
  }
`;

export const PostItWrapper = styled.div`
  --throwX: ${props => props.$throwX || 0}px;
  --throwY: ${props => props.$throwY || 0}px;
  --spinAmount: ${props => props.$spinAmount || 0}deg;

  position: absolute;
  left: 0;
  top: 0;
  width: ${props => props.$width}px;
  min-height: ${props => props.$height}px;
  transform: translate3d(var(--x, 0), var(--y, 0), 0) rotate(var(--r, 0deg));
  background-color: ${props => props.$color};
  padding: 20px 15px 15px;
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.1);
  cursor: grab;
  user-select: none;
  touch-action: none;
  z-index: ${props => props.$falling ? 61 : props.$zIndex || 5};
  transition: ${props => props.$falling ? 'none' : 'box-shadow 0.2s'};
  animation: ${props => props.$falling ? fallAnimation : 'none'}
             ${props => props.$fallDuration || 1.2}s
             cubic-bezier(0.45, 0, 0.55, 1) forwards;
  pointer-events: ${props => props.$falling ? 'none' : 'auto'};
  will-change: transform, opacity;

  &:hover {
    box-shadow: ${props => props.$falling ? 'none' : '0 4px 8px rgba(0, 0, 0, 0.15)'};
  }

  &:active {
    cursor: grabbing;
  }

  /* Tape effect */
  &::before {
    content: '';
    display: block;
    position: absolute;
    top: -8px;
    left: 50%;
    transform: translateX(-50%);
    width: 50px;
    height: 20px;
    background: rgba(255, 255, 255, 0.6);
    border: 1px solid rgba(0, 0, 0, 0.1);
  }

  /* Curl effect */
  &::after {
    content: '';
    display: block;
    position: absolute;
    bottom: 0;
    right: 0;
    width: 25px;
    height: 25px;
    background: linear-gradient(135deg, transparent 50%, ${props => props.$color} 50%);
    box-shadow: -2px -2px 3px rgba(0, 0, 0, 0.1);
  }
`;

export const PostItText = styled.div`
  font-family: ${props => props.$font || 'Georgia, serif'};
  font-style: ${props => props.$style || 'normal'};
  font-weight: ${props => props.$weight || 'normal'};
  font-size: ${props => props.$fontSize || 14}px;
  color: #2c2c2c;
  white-space: pre-line;
  text-align: center;
  line-height: 1.3;
  transform: rotate(${props => props.$textRotate || 0}deg);
  pointer-events: none;
`;

// ============ CONTAINER STYLES ============

export const BoardContainer = styled.div`
  position: absolute;
  inset: 0;
  touch-action: none;
  overflow: visible;
`;

// ============ ADD MENU STYLES ============

export const AddButton = styled.button`
  position: absolute;
  bottom: 20px;
  right: 20px;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: ${props => props.$isOpen ? '#e76f51' : 'var(--accent, #a67c52)'};
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 100;
  overflow: hidden;

  &:hover {
    background: ${props => props.$isOpen ? '#c85a48' : 'var(--accent-dark, #8a6642)'};
    transform: scale(1.1);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.3);
  }

  &:active {
    transform: scale(0.95);
  }
`;

export const ButtonIcon = styled.span`
  display: inline-block;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  transform: ${props => props.$isOpen ? 'rotate(45deg)' : 'rotate(0deg)'};
  font-size: ${props => props.$isOpen ? '28px' : '24px'};
`;

export const AddMenu = styled.div`
  position: absolute;
  bottom: 80px;
  right: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  padding: 10px;
  display: ${props => props.$show ? 'flex' : 'none'};
  flex-direction: column;
  gap: 10px;
  z-index: 101;
  max-height: 400px;
  overflow-y: auto;
`;

export const MenuButton = styled.button`
  background: transparent;
  border: 1px solid var(--accent, #a67c52);
  color: var(--accent, #a67c52);
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  transition: all 0.2s;
  white-space: nowrap;

  &:hover {
    background: var(--accent, #a67c52);
    color: white;
  }
`;

export const StickerGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-top: 10px;
`;

export const StickerOption = styled.button`
  width: 60px;
  height: 60px;
  padding: 8px;
  border: 2px solid transparent;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    border-color: var(--accent, #a67c52);
    background: rgba(166, 124, 82, 0.1);
    transform: scale(1.05);
  }

  svg {
    width: 100%;
    height: 100%;
  }
`;

export const StickerLabel = styled.div`
  font-size: 10px;
  color: var(--text-medium, #666);
  margin-top: 4px;
  text-align: center;
`;
