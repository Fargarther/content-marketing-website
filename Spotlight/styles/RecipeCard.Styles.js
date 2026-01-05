// src/components/Home/Spotlight/styles/RecipeCard.styles.js
import styled from 'styled-components';

// Paper texture for the aged look
const paperTexture = `
  background-image: 
    repeating-linear-gradient(
      120deg, 
      rgba(255,250,240,0.05), 
      rgba(255,250,240,0.05) 1px, 
      transparent 1px, 
      transparent 2px
    ),
    radial-gradient(
      rgba(255,237,203,0.5) 25%, 
      rgba(255,244,222,0.5) 100%
    );
`;

export const CardContainer = styled.div`
  position: absolute;
  width: ${props => props.$isExpanded ? '455px' : '325px'}; 
  height: ${props => props.$isExpanded ? 'auto' : '195px'};
  min-height: ${props => props.$isExpanded ? '390px' : '195px'};
  left: ${props => props.$x}px;
  top: ${props => props.$y}px;
  transform: ${props => `rotate(${props.$rotate}deg)`};
  transform-origin: center center;
  transition: ${props => props.$isDragging ? 'none' : 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'};
  z-index: ${props => props.$isExpanded ? 1000 : props.$isDragging ? 100 : props.$zIndex};
  perspective: 1500px;
  cursor: ${props => props.$isPinned ? 'not-allowed' : props.$isDragging ? 'grabbing' : 'grab'};
  opacity: ${props => props.$isPinned ? 0.98 : 1};
  
  /* Account for buttons extending beyond card boundaries */
  margin-left: 13px; /* Half the button width that extends left */
  
  &.new-card {
    animation: cardPulse 0.6s ease-out;
  }
  
  @keyframes cardPulse {
    0% {
      transform: scale(0) rotate(${props => props.$rotate}deg);
      opacity: 0;
    }
    50% {
      transform: scale(1.1) rotate(${props => props.$rotate}deg);
    }
    100% {
      transform: scale(1) rotate(${props => props.$rotate}deg);
      opacity: 1;
    }
  }
`;

export const RecipeCardWrapper = styled.div`
  position: relative; /* IMPORTANT: This was missing and causing the flip issue */
  width: 100%;
  height: ${props => props.$isExpanded ? 'auto' : '100%'};
  transform-style: preserve-3d;
  transition: transform 0.6s cubic-bezier(0.455, 0.03, 0.515, 1.55);
  transform: ${props => props.$isFlipped ? 'rotateY(180deg)' : 'rotateY(0)'};
  will-change: transform;
`;

export const PinButton = styled.button`
  position: absolute;
  width: 26px;
  height: 26px;
  background: ${props => props.$isPinned 
    ? 'radial-gradient(circle at 30% 30%, #2fa99c, #2a9d8f)' 
    : `radial-gradient(circle at 30% 30%, ${props.$pinColor || '#b54b35'}, ${props.$pinColor || '#b54b35'})`};
  border-radius: 50%;
  top: ${props => props.$pinTop || '12px'};
  left: ${props => props.$pinLeft || '50%'};
  transform: ${props => props.$isPinned 
    ? 'translateX(-50%) translateY(3px) scale(0.95)' 
    : 'translateX(-50%) translateY(0) scale(1)'};
  box-shadow: ${props => props.$isPinned 
    ? 'inset 0 3px 5px rgba(0, 0, 0, 0.6), inset 0 -1px 2px rgba(255, 255, 255, 0.2), 0 1px 2px rgba(0, 0, 0, 0.3)' 
    : '0 4px 8px rgba(0, 0, 0, 0.4), 0 2px 4px rgba(0, 0, 0, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.3)'};
  z-index: 10;
  border: ${props => props.$isPinned 
    ? '1px solid rgba(0, 0, 0, 0.3)' 
    : '1px solid rgba(255, 255, 255, 0.2)'};
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  
  &:before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: ${props => props.$isPinned ? '12px' : '10px'};
    height: ${props => props.$isPinned ? '12px' : '10px'};
    background: ${props => props.$isPinned 
      ? 'radial-gradient(circle at 40% 40%, #ffffff, #e0e0e0)' 
      : 'radial-gradient(circle at 40% 40%, rgba(255, 255, 255, 0.6), rgba(255, 255, 255, 0.3))'};
    border-radius: 50%;
    box-shadow: ${props => props.$isPinned 
      ? 'inset 0 -1px 2px rgba(0, 0, 0, 0.2)' 
      : '0 1px 2px rgba(0, 0, 0, 0.2)'};
  }
  
  &:after {
    content: '';
    position: absolute;
    bottom: -5px;
    left: 50%;
    transform: translateX(-50%);
    width: 4px;
    height: 10px;
    background: ${props => props.$isPinned 
      ? 'transparent' 
      : `linear-gradient(to bottom, ${props.$pinColor || '#b54b35'}, rgba(0, 0, 0, 0.5))`};
    opacity: ${props => props.$isPinned ? 0 : 0.8};
    transition: opacity 0.2s;
    border-radius: 0 0 2px 2px;
    box-shadow: ${props => props.$isPinned 
      ? 'none' 
      : '0 2px 3px rgba(0, 0, 0, 0.3)'};
  }
  
  &:hover {
    transform: ${props => props.$isPinned 
      ? 'translateX(-50%) translateY(3px) scale(1.05)' 
      : 'translateX(-50%) translateY(-1px) scale(1.1)'};
    background: ${props => props.$isPinned 
      ? 'radial-gradient(circle at 30% 30%, #2eb5a7, #238b7f)' 
      : `radial-gradient(circle at 30% 30%, ${props.$pinColor ? '#c05040' : '#c05040'}, #a04030)`};
    box-shadow: ${props => props.$isPinned 
      ? 'inset 0 3px 6px rgba(0, 0, 0, 0.7), inset 0 -1px 2px rgba(255, 255, 255, 0.2), 0 1px 3px rgba(0, 0, 0, 0.4)' 
      : '0 5px 10px rgba(0, 0, 0, 0.4), 0 3px 5px rgba(0, 0, 0, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.3)'};
  }
  
  &:active {
    transform: ${props => props.$isPinned 
      ? 'translateX(-50%) translateY(4px) scale(0.92)' 
      : 'translateX(-50%) translateY(2px) scale(0.95)'};
    box-shadow: ${props => props.$isPinned 
      ? 'inset 0 4px 7px rgba(0, 0, 0, 0.8), 0 0 1px rgba(0, 0, 0, 0.5)' 
      : 'inset 0 2px 4px rgba(0, 0, 0, 0.5), 0 1px 2px rgba(0, 0, 0, 0.3)'};
  }
`;

export const CardSide = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  background-color: ${props => props.$back ? '#f0e8d0' : '#f5f0dc'};
  ${paperTexture}
  border-radius: 4px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  padding: 16px 16px 16px 36px;
  transform: ${props => props.$back ? 'rotateY(180deg)' : 'rotateY(0deg)'};
  overflow-y: ${props => props.$back ? 'auto' : 'visible'};
  will-change: transform;
  pointer-events: auto;

  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border: 1px solid rgba(210, 190, 150, 0.8);
    border-radius: 4px;
    box-shadow: inset 0 0 30px rgba(200, 180, 120, 0.15);
    pointer-events: none;
  }
  
  /* Custom scrollbar for back side */
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(210, 190, 150, 0.2);
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background-color: rgba(166, 124, 82, 0.5);
    border-radius: 3px;
  }
`;

export const FlipIndicator = styled.div`
  position: absolute;
  bottom: 10px;
  right: 10px;
  width: 39px;
  height: 39px;
  border-radius: 20px;
  background-color: rgba(200, 180, 120, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: #8a7248;
  cursor: pointer;
  border: 1px solid rgba(200, 180, 120, 0.5);
  z-index: 10;
  transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  
  &:hover {
    background-color: rgba(200, 180, 120, 0.3);
    transform: scale(1.1);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  &:active {
    transform: scale(0.95);
  }
  
  svg {
    width: 20px;
    height: 20px;
  }
`;

export const ExpandButton = styled.button`
  position: absolute;
  left: -13px;
  top: 97.5px;
  transform: translateY(-50%);
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: ${props => props.$isExpanded ? '#8a7248' : 'rgba(200, 180, 120, 0.8)'};
  color: ${props => props.$isExpanded ? '#fff' : '#59483b'};
  border: 2px solid #8a7248;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  cursor: pointer;
  z-index: 11;
  transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  
  &:hover {
    background-color: #8a7248;
    color: #fff;
    transform: translateY(-50%) scale(1.1);
  }
  
  &:active {
    transform: translateY(-50%) scale(0.95);
  }
`;

export const CommentsButton = styled.button`
  position: absolute;
  left: -13px;
  top: 145px;
  transform: translateY(-50%);
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: ${props => props.$hasComments ? '#b38c42' : 'rgba(200, 180, 120, 0.8)'};
  color: ${props => props.$hasComments ? '#fff' : '#59483b'};
  border: 2px solid #b38c42;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  cursor: pointer;
  z-index: 11;
  transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  position: relative;
  
  span {
    position: absolute;
    top: -8px;
    right: -8px;
    background: #e76f51;
    color: white;
    font-size: 11px;
    font-weight: bold;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }
  
  &:hover {
    background-color: #b38c42;
    color: #fff;
    transform: translateY(-50%) scale(1.1);
  }
  
  &:active {
    transform: translateY(-50%) scale(0.95);
  }
`;

export const CommentsSection = styled.div`
  position: absolute;
  top: 0;
  ${props => props.$position === 'left' 
    ? 'right: calc(100% + 20px);' 
    : 'left: calc(100% + 20px);'}
  width: 280px;
  background-color: #fffef5;
  border: 1px solid rgba(200, 180, 120, 0.5);
  border-radius: 4px;
  z-index: 1001;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  min-height: 200px;
  max-height: 400px;
  pointer-events: all;
`;

export const ExpandedContent = styled.div`
  width: 100%;
  background-color: #f5f0dc;
  ${paperTexture}
  border-radius: 4px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  padding: 21px 21px 21px 41px;
  position: relative;
  
  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border: 1px solid rgba(210, 190, 150, 0.8);
    border-radius: 4px;
    box-shadow: inset 0 0 30px rgba(200, 180, 120, 0.15);
    pointer-events: none;
  }
`;

export const ExpandedSection = styled.div`
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba(200, 180, 120, 0.3);
  
  h4 {
    font-family: 'Courier New', monospace;
    font-size: 12px;
    color: #59483b;
    margin: 0 0 10px 0;
    text-transform: uppercase;
    letter-spacing: 1px;
  }
`;