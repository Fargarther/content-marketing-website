/**
 * InteractiveBulletinDecorationsV2
 *
 * Main controller for bulletin board decorations (stickers + post-its)
 * Uses Figma-style proxy drag architecture for 60fps performance
 */

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useImperativeHandle,
  forwardRef,
} from 'react';
import { useDragEngine } from './useDragEngine';
import Stickers from './Stickers';
import PostItNotes from './PostItNotes';
import {
  BoardContainer,
  AddButton,
  ButtonIcon,
  AddMenu,
  MenuButton,
  StickerGrid,
  StickerOption,
  StickerLabel,
} from './styles';
import { SeasonalStickers } from '../BulletinBoard/decorations/stickerData.jsx';
import { postItMessages } from '../BulletinBoard/decorations/postItMessages';

// Z-index counter for bringing items to front
let globalZIndex = 10;

const InteractiveBulletinDecorationsV2 = forwardRef(({ boardRef }, ref) => {
  // ============ STATE ============
  const [stickers, setStickers] = useState(() => {
    const saved = localStorage.getItem('bulletinStickers');
    return saved ? JSON.parse(saved) : [];
  });

  const [postIts, setPostIts] = useState([]);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showStickerMenu, setShowStickerMenu] = useState(false);

  const containerRef = useRef(null);
  const saveTimeoutRef = useRef(null);

  // ============ IMPERATIVE HANDLE ============
  useImperativeHandle(ref, () => ({
    clearAll: () => {
      setStickers([]);
      setPostIts([]);
      localStorage.removeItem('bulletinStickers');
      setShowAddMenu(false);
      setShowStickerMenu(false);
    },
  }), []);

  // ============ BOUNDS CALCULATOR ============
  const getBounds = useCallback(() => {
    const container = containerRef.current;
    if (!container) {
      return {
        minX: 0,
        maxX: 800,
        minY: 0,
        maxY: 600,
        boardLeft: 0,
        boardTop: 0,
        boardWidth: 800,
        boardHeight: 600,
      };
    }

    const rect = container.getBoundingClientRect();
    return {
      minX: rect.left,
      maxX: rect.right,
      minY: rect.top,
      maxY: rect.bottom,
      boardLeft: rect.left,
      boardTop: rect.top,
      boardWidth: rect.width,
      boardHeight: rect.height,
    };
  }, []);

  // ============ POSITION COMMIT HANDLER ============
  const onPositionCommit = useCallback(({ id, type, x, y }) => {
    // Bring to front
    globalZIndex += 1;
    const newZIndex = globalZIndex;

    if (type === 'sticker') {
      setStickers(prev =>
        prev.map(s =>
          s.id === id ? { ...s, x, y, zIndex: newZIndex } : s
        )
      );
    } else if (type === 'postit') {
      // For post-its: trigger fall animation after drag
      setPostIts(prev =>
        prev.map(p =>
          p.id === id
            ? {
                ...p,
                x,
                y,
                zIndex: newZIndex,
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

  // ============ DRAG ENGINE ============
  const { handlePointerDown } = useDragEngine({
    containerRef,
    getBounds,
    onPositionCommit,
  });

  // ============ POST-IT DISCARD ============
  const handlePostItDiscard = useCallback((postItId) => {
    setPostIts(prev => prev.filter(p => p.id !== postItId));
  }, []);

  // ============ STICKER DELETE ============
  const handleStickerDelete = useCallback((stickerId) => {
    setStickers(prev => prev.filter(s => s.id !== stickerId));
  }, []);

  // ============ INITIALIZE POST-ITS ============
  useEffect(() => {
    if (boardRef?.current && postIts.length === 0) {
      const boardRect = boardRef.current.getBoundingClientRect();
      const boardWidth = boardRect.width;
      const boardHeight = boardRect.height;

      const colors = ['#ffeb3b', '#ffc0cb', '#b8e6b8', '#b3d9ff', '#dda0dd'];
      const initialPostIts = [];

      for (let i = 0; i < 5; i++) {
        const message = postItMessages[Math.floor(Math.random() * postItMessages.length)];
        const noteWidth = 100 + Math.floor(Math.random() * 40);
        const noteHeight = 80 + Math.floor(Math.random() * 40);

        const padding = 50;
        const maxX = boardWidth - noteWidth - padding;
        const maxY = boardHeight - noteHeight - padding;

        globalZIndex += 1;

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
          fallDuration: 1.2,
          zIndex: globalZIndex,
        });
      }

      setPostIts(initialPostIts);
    }
  }, [boardRef, postIts.length]);

  // ============ SAVE STICKERS ============
  useEffect(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      localStorage.setItem('bulletinStickers', JSON.stringify(stickers));
    }, 250);
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [stickers]);

  // ============ ADD STICKER ============
  const addSticker = useCallback((stickerType) => {
    if (!boardRef?.current) return;

    const boardRect = boardRef.current.getBoundingClientRect();
    const boardWidth = boardRect.width;
    const boardHeight = boardRect.height;
    const stickerSize = 45 + Math.floor(Math.random() * 15);

    const padding = 50;
    const maxX = boardWidth - stickerSize - padding;
    const maxY = boardHeight - stickerSize - padding;

    globalZIndex += 1;

    const newSticker = {
      id: `sticker-${Date.now()}`,
      type: stickerType,
      x: padding + Math.random() * Math.max(maxX - padding, 100),
      y: padding + Math.random() * Math.max(maxY - padding, 100),
      size: stickerSize,
      rotate: -15 + Math.random() * 30,
      zIndex: globalZIndex,
    };

    setStickers(prev => [...prev, newSticker]);
    setShowStickerMenu(false);
    setShowAddMenu(false);
  }, [boardRef]);

  // ============ ADD POST-IT ============
  const addPostIt = useCallback(() => {
    if (!boardRef?.current) return;

    const boardRect = boardRef.current.getBoundingClientRect();
    const boardWidth = boardRect.width;
    const boardHeight = boardRect.height;

    const colors = ['#ffeb3b', '#ffc0cb', '#b8e6b8', '#b3d9ff', '#dda0dd', '#ffcc99', '#ffb3b3', '#c8e6c9'];
    const message = postItMessages[Math.floor(Math.random() * postItMessages.length)];

    const noteWidth = 110 + Math.floor(Math.random() * 40);
    const noteHeight = 90 + Math.floor(Math.random() * 40);

    const padding = 50;
    const maxX = boardWidth - noteWidth - padding;
    const maxY = boardHeight - noteHeight - padding;

    globalZIndex += 1;

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
      fallDuration: 1.8,
      zIndex: globalZIndex,
    };

    setPostIts(prev => [...prev, newPostIt]);
    setShowAddMenu(false);
  }, [boardRef]);

  // ============ RENDER ============
  return (
    <BoardContainer ref={containerRef}>
      {/* Stickers */}
      <Stickers
        stickers={stickers}
        onPointerDown={handlePointerDown}
        onDoubleClick={handleStickerDelete}
      />

      {/* Post-its */}
      <PostItNotes
        postIts={postIts}
        onPointerDown={handlePointerDown}
        onAnimationEnd={handlePostItDiscard}
      />

      {/* Add Button */}
      <AddButton
        onClick={() => {
          setShowAddMenu(!showAddMenu);
          setShowStickerMenu(false);
        }}
        title={showAddMenu ? 'Close menu' : 'Add decoration'}
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
    </BoardContainer>
  );
});

InteractiveBulletinDecorationsV2.displayName = 'InteractiveBulletinDecorationsV2';

export default InteractiveBulletinDecorationsV2;
