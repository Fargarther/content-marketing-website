// src/components/Home/Spotlight/InteractiveBulletinDecorations.jsx
import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef, useCallback } from 'react';
import styled from 'styled-components';
import Stickers from './decorations/Stickers';
import { SeasonalStickers } from './decorations/stickerData.jsx';
import PostItNotes from './decorations/PostItNotes';
import { postItMessages } from './decorations/postItMessages';
import { useDragProxy } from './useDragProxy';

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

const InteractiveBulletinDecorations = forwardRef(({ boardRef }, ref) => {
  const [stickers, setStickers] = useState(() => {
    const saved = localStorage.getItem('bulletinStickers');
    return saved ? JSON.parse(saved) : [];
  });

  const [postIts, setPostIts] = useState(() => {
    // Always start fresh with new wisdom notes on page load
    return [];
  });

  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showStickerMenu, setShowStickerMenu] = useState(false);
  const containerRef = useRef(null);
  const saveTimeoutRef = useRef(null);

  // Handle drag commit from proxy system
  const onCommit = useCallback(({ kind, id, x, y }) => {
    if (kind === "sticker") {
      setStickers((prev) =>
        prev.map((s) => (String(s.id) === String(id) ? { ...s, x, y } : s))
      );
      return;
    }
    if (kind === "postit") {
      // For post-its: update position and trigger fall animation
      setPostIts((prev) =>
        prev.map((p) =>
          String(p.id) === String(id)
            ? {
                ...p,
                x,
                y,
                falling: true,
                throwX: 0,
                throwY: 50,
                spinAmount: (Math.random() - 0.5) * 20,
                fallDuration: 1.2,
              }
            : p
        )
      );
    }
  }, []);

  const { onPointerDownCapture } = useDragProxy({
    boardRef: containerRef,
    onCommit,
    enableThrow: true,
  });
  
  // Expose clear methods to parent component
  useImperativeHandle(ref, () => ({
    clearAll: () => {
      setStickers([]);
      setPostIts([]);
      localStorage.removeItem('bulletinStickers');
      setShowAddMenu(false);
      setShowStickerMenu(false);
    }
  }), []);
  
  // Initialize post-its after board is ready with exactly 5 wisdom notes
  useEffect(() => {
    if (boardRef?.current && postIts.length === 0) {
      // Get board dimensions
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
      
      setPostIts(initialPostIts);
    }
  }, [boardRef, postIts.length]);
  
  // Save to localStorage when items change
  useEffect(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      localStorage.setItem('bulletinStickers', JSON.stringify(stickers));
    }, 250);
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [stickers]);

  const handleDiscardComplete = useCallback((postItId) => {
    setPostIts(prev => prev.filter(p => p.id !== postItId));
  }, []);

  // Add specific sticker type
  const addSticker = (stickerType) => {
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
    
    setStickers([...stickers, newSticker]);
  };
  
  // Add new post-it
  const addPostIt = () => {
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
    
    setPostIts([...postIts, newPostIt]);
  };
  
  // Delete sticker
  const deleteSticker = (id) => {
    setStickers(stickers.filter(s => s.id !== id));
  };
  
  return (
    <div
      ref={containerRef}
      onPointerDownCapture={onPointerDownCapture}
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'auto',
      }}
    >
      {/* Render Stickers */}
      <Stickers
        stickers={stickers}
        onDoubleClick={deleteSticker}
      />

      {/* Render Post-its */}
      <PostItNotes
        postIts={postIts}
        onDiscardComplete={handleDiscardComplete}
      />

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
          Choose Sticker →
        </MenuButton>
        <MenuButton onClick={addPostIt}>Add Wisdom Note</MenuButton>
      </AddMenu>
      
      {/* Sticker Selection Menu */}
      <AddMenu $show={showStickerMenu}>
        <MenuButton onClick={() => setShowStickerMenu(false)}>
          ← Back
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
    </div>
  );
});

InteractiveBulletinDecorations.displayName = 'InteractiveBulletinDecorations';

export default InteractiveBulletinDecorations;
