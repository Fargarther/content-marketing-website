// src/components/Home/Spotlight/decorations/PostItNotes.jsx
'use client';
import React from 'react';
import styled, { keyframes } from 'styled-components';

// Post-it wisdom and quotes

// Falling animation with directional movement - starts immediately
const fallAnimation = keyframes`
  from {
    transform: translate3d(var(--x), var(--y), 0) rotate(var(--rotate));
    opacity: 1;
  }
  15% {
    transform: translate3d(calc(var(--x) + (var(--throwX) * 0.2)), calc(var(--y) + (var(--throwY) * 0.15)), 0) rotate(calc(var(--rotate) + (var(--spinAmount) * 0.1)));
    opacity: 1;
  }
  80% {
    opacity: 0.8;
  }
  to {
    transform: translate3d(calc(var(--x) + (var(--throwX) * 1.2)), calc(var(--y) + 100vh + var(--throwY)), 0) rotate(calc(var(--rotate) + var(--spinAmount)));
    opacity: 0;
  }
`;

// Post-it Note
const PostItNote = styled.div`
  --x: ${props => props.$x}px;
  --y: ${props => props.$y}px;
  --rotate: ${props => props.$rotate}deg;
  --throwX: ${props => props.$throwX || 0}px;
  --throwY: ${props => props.$throwY || 0}px;
  --spinAmount: ${props => props.$spinAmount || 0}deg;
  position: absolute;
  width: ${props => props.$width}px;
  min-height: ${props => props.$height}px;
  left: 0;
  top: 0;
  transform: translate3d(var(--x), var(--y), 0) rotate(var(--rotate));
  background-color: ${props => props.$color};
  padding: 20px 15px 15px;
  box-shadow: 0 3px 6px rgba(0,0,0,0.1);
  cursor: ${props => props.$isDragging ? 'grabbing' : 'grab'};
  z-index: ${props => props.$falling ? 61 : props.$isDragging ? 60 : 5};
  transition: ${props => props.$falling || props.$isDragging ? 'none' : 'box-shadow 0.2s'};
  animation: ${props => props.$falling ? fallAnimation : 'none'} ${props => props.$fallDuration || 1.2}s cubic-bezier(0.45, 0, 0.55, 1) forwards;
  contain: layout style;
  will-change: ${props => (props.$falling || props.$isDragging) ? 'transform' : 'auto'};
  
  &:hover {
    box-shadow: ${props => props.$falling ? '0 3px 6px rgba(0,0,0,0.1)' : '0 4px 8px rgba(0,0,0,0.15)'};
    transform: ${props => props.$falling
      ? 'translate3d(var(--x), var(--y), 0) rotate(var(--rotate))'
      : 'translate3d(var(--x), calc(var(--y) - 2px), 0) rotate(var(--rotate))'};
  }
  
  /* Tape effect */
  &:before {
    content: '';
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
  &:after {
    content: '';
    position: absolute;
    bottom: 0;
    right: 0;
    width: 25px;
    height: 25px;
    background: linear-gradient(135deg, transparent 50%, ${props => props.$color} 50%);
    box-shadow: -2px -2px 3px rgba(0, 0, 0, 0.1);
  }
`;

const PostItText = styled.div`
  font-family: ${props => props.$font};
  font-style: ${props => props.$style};
  font-weight: ${props => props.$weight};
  font-size: ${props => props.$fontSize}px;
  color: #2c2c2c;
  white-space: pre-line;
  text-align: center;
  line-height: 1.3;
  transform: rotate(${props => props.$textRotate}deg);
`;

const PostItNotes = ({ postIts, onMouseDown, draggedItem, getPostItRef }) => {
  return (
    <>
      {postIts.map(postIt => (
        <PostItNote
          key={postIt.id}
          $width={postIt.width}
          $height={postIt.height}
          $x={postIt.x}
          $y={postIt.y}
          $rotate={postIt.rotate}
          $color={postIt.color}
          $isDragging={draggedItem?.id === postIt.id}
          $falling={postIt.falling}
          $throwX={postIt.throwX}
          $throwY={postIt.throwY}
          $spinAmount={postIt.spinAmount}
          $fallDuration={postIt.fallDuration}
          ref={getPostItRef ? getPostItRef(postIt.id) : undefined}
          style={{
            '--x': `${postIt.x}px`,
            '--y': `${postIt.y}px`,
          }}
          onMouseDown={(e) => onMouseDown(e, postIt.id, 'postit')}
        >
          <PostItText
            $font={postIt.font}
            $style={postIt.style}
            $weight={postIt.weight}
            $fontSize={postIt.fontSize}
            $textRotate={postIt.textRotate}
          >
            {postIt.text}
          </PostItText>
        </PostItNote>
      ))}
    </>
  );
};

const areEqual = (prevProps, nextProps) => {
  if (prevProps.postIts !== nextProps.postIts) return false;
  if (prevProps.draggedItem?.id !== nextProps.draggedItem?.id) return false;
  if (prevProps.draggedItem?.type !== nextProps.draggedItem?.type) return false;
  return true;
};

export default React.memo(PostItNotes, areEqual);
