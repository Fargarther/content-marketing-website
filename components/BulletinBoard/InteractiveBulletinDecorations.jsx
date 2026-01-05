// src/components/Home/Spotlight/InteractiveBulletinDecorations.jsx
'use client';
import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef, useCallback } from 'react';
import styled from 'styled-components';
import Stickers from './decorations/Stickers';
import { SeasonalStickers } from './decorations/stickerData.jsx';
import PostItNotes from './decorations/PostItNotes';
import { postItMessages } from './decorations/postItMessages';

// Add New Item Button with animated icon
const AddButton = styled.button`
  position: absolute;
  bottom: 20px;
  right: 20px;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: ${props => props.$isOpen ? '#e76f51' : 'var(--accent)'};
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  box-shadow: 0 4px 8px rgba(0,0,0,0.2);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 100;
  overflow: hidden;
  
  &:hover {
    background: ${props => props.$isOpen ? '#c85a48' : 'var(--accent-dark)'};
    transform: scale(1.1);
    box-shadow: 0 6px 12px rgba(0,0,0,0.3);
  }
  
  &:active {
    transform: scale(0.95);
  }
`;

// Animated icon inside the button
const ButtonIcon = styled.span`
  display: inline-block;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  transform: ${props => props.$isOpen ? 'rotate(45deg)' : 'rotate(0deg)'};
  font-size: ${props => props.$isOpen ? '28px' : '24px'};
`;

// Menu for adding items
const AddMenu = styled.div`
  position: absolute;
  bottom: 80px;
  right: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  padding: 10px;
  display: ${props => props.$show ? 'flex' : 'none'};
  flex-direction: column;
  gap: 10px;
  z-index: 101;
  max-height: 400px;
  overflow-y: auto;
`;

const MenuButton = styled.button`
  background: transparent;
  border: 1px solid var(--accent);
  color: var(--accent);
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  transition: all 0.2s;
  white-space: nowrap;
  
  &:hover {
    background: var(--accent);
    color: white;
  }
`;

const StickerGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-top: 10px;
`;

const StickerOption = styled.button`
  width: 60px;
  height: 60px;
  padding: 8px;
  border: 2px solid transparent;
  background: rgba(0,0,0,0.02);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    border-color: var(--accent);
    background: rgba(166, 124, 82, 0.1);
    transform: scale(1.05);
  }
  
  svg {
    width: 100%;
    height: 100%;
  }
`;

const StickerLabel = styled.div`
  font-size: 10px;
  color: var(--text-medium);
  margin-top: 4px;
  text-align: center;
`;

const DecorationsLayer = styled.div`
  position: absolute;
  inset: 0;
  overflow: hidden;
`;

const InteractiveBulletinDecorations = forwardRef(({ boardRef }, ref) => {
  const [stickers, setStickers] = useState([]);
  const [postIts, setPostIts] = useState([]);
  const [draggedItem, setDraggedItem] = useState(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showStickerMenu, setShowStickerMenu] = useState(false);

  const stickersRef = useRef([]);
  const postItsRef = useRef([]);
  const draggedItemRef = useRef(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const dragPositionRef = useRef({ x: 0, y: 0 });
  const pendingPointRef = useRef(null);
  const rafRef = useRef(null);

  const velocityRef = useRef({ x: 0, y: 0 });
  const lastPosRef = useRef({ x: 0, y: 0, time: 0 });

  const stickerElementsRef = useRef(new Map());
  const postItElementsRef = useRef(new Map());
  const stickerRefCallbacks = useRef(new Map());
  const postItRefCallbacks = useRef(new Map());
  const postItsInitializedRef = useRef(false);

  const getStickerRef = useCallback((id) => {
    if (!stickerRefCallbacks.current.has(id)) {
      stickerRefCallbacks.current.set(id, (node) => {
        if (node) {
          stickerElementsRef.current.set(id, node);
        } else {
          stickerElementsRef.current.delete(id);
        }
      });
    }
    return stickerRefCallbacks.current.get(id);
  }, []);

  const getPostItRef = useCallback((id) => {
    if (!postItRefCallbacks.current.has(id)) {
      postItRefCallbacks.current.set(id, (node) => {
        if (node) {
          postItElementsRef.current.set(id, node);
        } else {
          postItElementsRef.current.delete(id);
        }
      });
    }
    return postItRefCallbacks.current.get(id);
  }, []);

  useEffect(() => {
    stickersRef.current = stickers;
  }, [stickers]);

  useEffect(() => {
    postItsRef.current = postIts;
  }, [postIts]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = window.localStorage.getItem('bulletinStickers');
    if (!saved) return;
    try {
      setStickers(JSON.parse(saved));
    } catch (error) {
      setStickers([]);
    }
  }, []);

  // Expose clear methods to parent component
  useImperativeHandle(ref, () => ({
    clearAll: () => {
      setStickers([]);
      setPostIts([]);
      postItsInitializedRef.current = true;
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem('bulletinStickers');
      }
      setShowAddMenu(false);
      setShowStickerMenu(false);
    }
  }), []);

  // Initialize post-its after board is ready with exactly 5 wisdom notes
  useEffect(() => {
    if (postItsInitializedRef.current) return;
    if (!boardRef?.current || postIts.length > 0) return;
    const boardRect = boardRef.current.getBoundingClientRect();
    const boardWidth = boardRect.width;
    const boardHeight = boardRect.height;

    // Generate exactly 5 initial post-its within board boundaries
    const colors = ['#ffeb3b', '#ffc0cb', '#b8e6b8', '#b3d9ff', '#dda0dd'];
    const initialPostIts = [];

    for (let i = 0; i < 5; i++) {
      const message = postItMessages[Math.floor(Math.random() * postItMessages.length)];
      const noteWidth = 100 + Math.floor(Math.random() * 40);
      const noteHeight = 80 + Math.floor(Math.random() * 40);

      // Calculate safe spawn area (with padding from edges)
      const padding = 50;
      const maxX = boardWidth - noteWidth - padding;
      const maxY = boardHeight - noteHeight - padding;

      initialPostIts.push({
        id: `postit-init-${Date.now()}-${i}`,
        x: padding + Math.random() * Math.max(maxX - padding, 100),
        y: padding + Math.random() * Math.max(maxY - padding, 100),
        width: noteWidth,
        height: noteHeight,
        rotate: -12 + Math.random() * 24,
        textRotate: -3 + Math.random() * 6,
        color: colors[i % colors.length],
        text: message.text,
        font: message.font,
        style: message.style || 'normal',
        weight: message.weight || 'normal',
        fontSize: 13 + Math.floor(Math.random() * 5),
        falling: false,
        throwX: 0,
        throwY: 0,
        spinAmount: 0,
        fallDuration: 1.2
      });
    }

    postItsInitializedRef.current = true;
    setPostIts(initialPostIts);
  }, [boardRef, postIts.length]);

  // Save to localStorage when items change
  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('bulletinStickers', JSON.stringify(stickers));
  }, [stickers]);

  const getPointerPosition = useCallback((event) => {
    if (event.touches && event.touches[0]) {
      return { x: event.touches[0].clientX, y: event.touches[0].clientY };
    }
    if (event.changedTouches && event.changedTouches[0]) {
      return { x: event.changedTouches[0].clientX, y: event.changedTouches[0].clientY };
    }
    return { x: event.clientX, y: event.clientY };
  }, []);

  // Handle mouse down for dragging
  const handleMouseDown = useCallback((event, itemId, itemType) => {
    event.preventDefault();
    event.stopPropagation();

    const items = itemType === 'sticker' ? stickersRef.current : postItsRef.current;
    const item = items.find((entry) => entry.id === itemId);
    if (!item) return;

    const { x: clientX, y: clientY } = getPointerPosition(event);

    dragOffsetRef.current = {
      x: clientX - item.x,
      y: clientY - item.y
    };

    dragPositionRef.current = { x: item.x, y: item.y };
    draggedItemRef.current = { id: itemId, type: itemType };
    setDraggedItem({ id: itemId, type: itemType });

    // Reset velocity tracking
    velocityRef.current = { x: 0, y: 0 };
    lastPosRef.current = { x: clientX, y: clientY, time: Date.now() };
  }, [getPointerPosition]);

  const updateDragPosition = useCallback(() => {
    rafRef.current = null;
    const dragItem = draggedItemRef.current;
    const point = pendingPointRef.current;
    if (!dragItem || !point) return;

    const newX = point.x - dragOffsetRef.current.x;
    const newY = point.y - dragOffsetRef.current.y;

    dragPositionRef.current = { x: newX, y: newY };

    const element = dragItem.type === 'sticker'
      ? stickerElementsRef.current.get(dragItem.id)
      : postItElementsRef.current.get(dragItem.id);

    if (element) {
      element.style.setProperty('--x', `${newX}px`);
      element.style.setProperty('--y', `${newY}px`);
    }
  }, []);

  // Handle mouse move
  const handleMouseMove = useCallback((event) => {
    if (!draggedItemRef.current) return;
    if (event.cancelable) {
      event.preventDefault();
    }

    const { x: clientX, y: clientY } = getPointerPosition(event);
    pendingPointRef.current = { x: clientX, y: clientY };

    const currentTime = Date.now();
    const timeDiff = currentTime - lastPosRef.current.time;
    if (timeDiff > 8) {
      const vx = (clientX - lastPosRef.current.x) / timeDiff;
      const vy = (clientY - lastPosRef.current.y) / timeDiff;

      // Smooth velocity with averaging (more weight on current velocity for responsiveness)
      velocityRef.current.x = velocityRef.current.x * 0.2 + vx * 0.8;
      velocityRef.current.y = velocityRef.current.y * 0.2 + vy * 0.8;
    }

    lastPosRef.current = { x: clientX, y: clientY, time: currentTime };

    if (!rafRef.current) {
      rafRef.current = requestAnimationFrame(updateDragPosition);
    }
  }, [getPointerPosition, updateDragPosition]);

  // Handle mouse up - post-its fall when released
  const handleMouseUp = useCallback(() => {
    const dragItem = draggedItemRef.current;
    if (!dragItem) return;

    let finalPosition = dragPositionRef.current;
    if (pendingPointRef.current) {
      finalPosition = {
        x: pendingPointRef.current.x - dragOffsetRef.current.x,
        y: pendingPointRef.current.y - dragOffsetRef.current.y
      };
      dragPositionRef.current = finalPosition;
    }

    if (dragItem.type === 'sticker') {
      setStickers(prev => prev.map(sticker =>
        sticker.id === dragItem.id ? { ...sticker, x: finalPosition.x, y: finalPosition.y } : sticker
      ));
    } else {
      const vx = velocityRef.current.x;
      const vy = velocityRef.current.y;

      // Calculate throw power ONCE
      const calculatedThrowPower = Math.sqrt(vx * vx + vy * vy);

      // Calculate throw distance based on velocity
      const throwX = vx * 350; // Slightly reduced for more control
      const throwY = Math.max(vy * 200, -100); // Reduced vertical movement

      // Add slight downward bias for gentle releases
      const adjustedThrowY = calculatedThrowPower < 0.5 ? throwY + 50 : throwY;

      // Calculate spin based on horizontal velocity (only spin if moving fast enough)
      const spinThreshold = 0.2; // Lowered for more responsive spinning
      let spinAmount = 0;

      if (Math.abs(vx) > spinThreshold) {
        // Fast movement - calculated spin (direction based on throw direction)
        // More spin for really fast throws
        const spinMultiplier = Math.abs(vx) > 1 ? 200 : 150;
        spinAmount = (30 + Math.abs(vx) * spinMultiplier) * (vx > 0 ? 1 : -1);
      } else {
        // Gentle release - very subtle wobble for natural look (2-8 degrees)
        const wobble = 2 + Math.random() * 6;
        spinAmount = Math.random() > 0.5 ? wobble : -wobble;
      }

      // Calculate duration based on throw power (faster fall time)
      const fallDuration = 1.2 + Math.min(calculatedThrowPower * 0.3, 0.5);

      // Update the post-it with fall animation immediately
      setPostIts(prev => prev.map(postIt =>
        postIt.id === dragItem.id
          ? {
              ...postIt,
              x: finalPosition.x,
              y: finalPosition.y,
              falling: true,
              throwX,
              throwY: adjustedThrowY,
              spinAmount,
              fallDuration
            }
          : postIt
      ));

      // Remove it after animation completes
      setTimeout(() => {
        setPostIts(prev => prev.filter(postIt => postIt.id !== dragItem.id));
      }, (fallDuration * 1000) + 100);
    }

    draggedItemRef.current = null;
    setDraggedItem(null);
    velocityRef.current = { x: 0, y: 0 };
    pendingPointRef.current = null;
  }, []);

  // Add mouse event listeners
  useEffect(() => {
    if (!draggedItem) return;
    if (typeof document === 'undefined') return;

    const handleMove = (event) => handleMouseMove(event);
    const handleUp = () => handleMouseUp();

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
    document.addEventListener('touchmove', handleMove, { passive: false });
    document.addEventListener('touchend', handleUp);

    return () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleUp);
    };
  }, [draggedItem, handleMouseMove, handleMouseUp]);

  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  // Add specific sticker type
  const addSticker = useCallback((stickerType) => {
    if (!boardRef?.current) return;

    const boardRect = boardRef.current.getBoundingClientRect();
    const boardWidth = boardRect.width;
    const boardHeight = boardRect.height;
    const stickerSize = 45 + Math.floor(Math.random() * 15);

    // Calculate safe spawn area
    const padding = 50;
    const maxX = boardWidth - stickerSize - padding;
    const maxY = boardHeight - stickerSize - padding;

    const newSticker = {
      id: `sticker-${Date.now()}`,
      type: stickerType,
      x: padding + Math.random() * Math.max(maxX - padding, 100),
      y: padding + Math.random() * Math.max(maxY - padding, 100),
      size: stickerSize,
      rotate: -15 + Math.random() * 30
    };

    setStickers(prev => [...prev, newSticker]);
  }, [boardRef]);

  // Add new post-it
  const addPostIt = useCallback(() => {
    if (!boardRef?.current) return;

    const boardRect = boardRef.current.getBoundingClientRect();
    const boardWidth = boardRect.width;
    const boardHeight = boardRect.height;

    const colors = ['#ffeb3b', '#ffc0cb', '#b8e6b8', '#b3d9ff', '#dda0dd', '#ffcc99', '#ffb3b3', '#c8e6c9'];
    const message = postItMessages[Math.floor(Math.random() * postItMessages.length)];

    const noteWidth = 110 + Math.floor(Math.random() * 40);
    const noteHeight = 90 + Math.floor(Math.random() * 40);

    // Calculate safe spawn area
    const padding = 50;
    const maxX = boardWidth - noteWidth - padding;
    const maxY = boardHeight - noteHeight - padding;

    const newPostIt = {
      id: `postit-${Date.now()}`,
      x: padding + Math.random() * Math.max(maxX - padding, 100),
      y: padding + Math.random() * Math.max(maxY - padding, 100),
      width: noteWidth,
      height: noteHeight,
      rotate: -10 + Math.random() * 20,
      textRotate: -3 + Math.random() * 6,
      color: colors[Math.floor(Math.random() * colors.length)],
      text: message.text,
      font: message.font,
      style: message.style || 'normal',
      weight: message.weight || 'normal',
      fontSize: 13 + Math.floor(Math.random() * 5),
      falling: false,
      throwX: 0,
      throwY: 0,
      spinAmount: 0,
      fallDuration: 1.8
    };

    setPostIts(prev => [...prev, newPostIt]);
  }, [boardRef]);

  // Delete sticker
  const deleteSticker = useCallback((id) => {
    setStickers(prev => prev.filter(sticker => sticker.id !== id));
  }, []);

  return (
    <>
      <DecorationsLayer>
        {/* Render Stickers */}
        <Stickers 
          stickers={stickers}
          onMouseDown={handleMouseDown}
          onDoubleClick={deleteSticker}
          draggedItem={draggedItem}
          getStickerRef={getStickerRef}
        />
        
        {/* Render Post-its */}
        <PostItNotes
          postIts={postIts}
          onMouseDown={handleMouseDown}
          draggedItem={draggedItem}
          getPostItRef={getPostItRef}
        />
      </DecorationsLayer>
      
      {/* Add Button */}
      <AddButton 
        onClick={() => {
          setShowAddMenu(!showAddMenu);
          setShowStickerMenu(false);
        }}
        title={showAddMenu ? "Close menu" : "Add decoration"}
        $isOpen={showAddMenu}
      >
        <ButtonIcon $isOpen={showAddMenu}>+</ButtonIcon>
      </AddButton>
      
      {/* Main Menu */}
      <AddMenu $show={showAddMenu && !showStickerMenu}>
        <MenuButton onClick={() => setShowStickerMenu(true)}>
          Choose Sticker +
        </MenuButton>
        <MenuButton onClick={addPostIt}>Add Wisdom Note</MenuButton>
      </AddMenu>
      
      {/* Sticker Selection Menu */}
      <AddMenu $show={showStickerMenu}>
        <MenuButton onClick={() => setShowStickerMenu(false)}>
          Back
        </MenuButton>
        <StickerGrid>
          {Object.entries(SeasonalStickers).map(([key, sticker]) => (
            <div key={key}>
              <StickerOption onClick={() => addSticker(key)}>
                {sticker.svg}
              </StickerOption>
              <StickerLabel>{sticker.name}</StickerLabel>
            </div>
          ))}
        </StickerGrid>
      </AddMenu>
    </>
  );
});

InteractiveBulletinDecorations.displayName = 'InteractiveBulletinDecorations';

export default InteractiveBulletinDecorations;
