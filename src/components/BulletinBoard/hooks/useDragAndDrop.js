// src/components/Home/Spotlight/hooks/useDragAndDrop.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { CARD_DIMENSIONS } from '../utils/constants';
import { getRandomPosition, getRotatedBoundingBox } from '../utils/helpers';

const useDragAndDrop = (cards, setCards, boardRef) => {
  const [activeCard, setActiveCard] = useState(null);
  const [cardPositions, setCardPositionsState] = useState({});
  const positionsRef = useRef({});
  const pendingPosRef = useRef(null);
  const rafRef = useRef(null);
  const activeCardRef = useRef(null);
  const boardRectRef = useRef(null);
  const boardSizeRef = useRef({ width: 0, height: 0 });
  const dragMetaRef = useRef({
    widthDiff: 0,
    heightDiff: 0,
    cardWidth: CARD_DIMENSIONS.width,
    cardHeight: CARD_DIMENSIONS.height
  });
  const dragStartPosRef = useRef({ x: 0, y: 0 });

  const setCardPositions = useCallback((updater) => {
    setCardPositionsState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      positionsRef.current = next;
      return next;
    });
  }, []);

  // Initialize positions for new cards with better spacing
  useEffect(() => {
    if (!boardRef.current || cards.length === 0) return;
    
    const boardWidth = boardRef.current.offsetWidth;
    const boardHeight = boardRef.current.offsetHeight;
    boardSizeRef.current = { width: boardWidth, height: boardHeight };
    
    const newPositions = {};
    let positionsAssigned = 0;
    
    cards.forEach((card, index) => {
      if (!positionsRef.current[card.id]) {
        const rotatedBox = getRotatedBoundingBox(CARD_DIMENSIONS.width, CARD_DIMENSIONS.height, card.rotate);
        
        // For initial 3 cards, space them out evenly
        if (cards.length <= 3 && positionsAssigned < 3) {
          // Divide board into 3 sections horizontally
          const sectionWidth = (boardWidth - 100) / 3;
          const baseX = 50 + (index * sectionWidth);
          
          // Add some randomness within the section
          const randomOffsetX = (Math.random() - 0.5) * (sectionWidth * 0.5);
          const randomOffsetY = Math.random() * (boardHeight * 0.4);
          
          newPositions[card.id] = {
            x: Math.max(10, Math.min(baseX + randomOffsetX, boardWidth - rotatedBox.width - 80)),
            y: Math.max(0, 50 + randomOffsetY)
          };
          positionsAssigned++;
        } else {
          // For additional cards, use random positioning
          newPositions[card.id] = getRandomPosition(boardWidth, boardHeight, rotatedBox.width, rotatedBox.height);
        }
      }
    });
    
    if (Object.keys(newPositions).length > 0) {
      setCardPositions(prev => ({ ...prev, ...newPositions }));
    }
  }, [boardRef, cards, setCardPositions]);

  // FULLY IMPERATIVE drag handlers - NO React state updates during drag!
  const handleMouseMoveImperative = (e) => {
    if (!activeCardRef.current || !boardRef.current) return;

    e.preventDefault();

    const boardRect = boardRectRef.current;
    if (!boardRect) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const { widthDiff, heightDiff, cardWidth, cardHeight } = dragMetaRef.current;

    // Calculate new position relative to the board
    let x = clientX - boardRect.left - dragStartPosRef.current.x - 13;
    let y = clientY - boardRect.top - dragStartPosRef.current.y;

    // Apply boundary constraints
    const boardWidth = boardSizeRef.current.width;
    const boardHeight = boardSizeRef.current.height;

    const minX = 10 + widthDiff;
    const minY = 0 + heightDiff;
    const maxX = boardWidth - cardWidth - 80 - widthDiff;
    const maxY = boardHeight - cardHeight - 100 - heightDiff;

    x = Math.max(minX, Math.min(x, maxX));
    y = Math.max(minY, Math.min(y, maxY));

    pendingPosRef.current = { x, y };

    // Direct DOM update - bypasses React completely
    const cardElement = document.querySelector(`[data-card-id="${activeCardRef.current}"]`);
    if (cardElement) {
      cardElement.style.setProperty('--card-x', `${x}px`);
      cardElement.style.setProperty('--card-y', `${y}px`);
    }
  };

  const handleMouseUpImperative = () => {
    const cardId = activeCardRef.current;

    // Remove event listeners FIRST
    document.removeEventListener('mousemove', handleMouseMoveImperative);
    document.removeEventListener('mouseup', handleMouseUpImperative);
    document.removeEventListener('touchmove', handleMouseMoveImperative);
    document.removeEventListener('touchend', handleMouseUpImperative);

    // Remove dragging class
    const cardElement = document.querySelector(`[data-card-id="${cardId}"]`);
    if (cardElement) {
      cardElement.style.cursor = 'grab';
    }

    // Sync final position to React state (only update that matters)
    if (cardId && pendingPosRef.current) {
      const nextPos = pendingPosRef.current;
      setCardPositions(prevPositions => ({
        ...prevPositions,
        [cardId]: nextPos
      }));
    }

    pendingPosRef.current = null;
    activeCardRef.current = null;
    setActiveCard(null);
  };

  const handleCardMouseDown = useCallback((e, cardId) => {
    e.preventDefault();

    // Don't initiate drag if clicking on interactive elements
    if (e.target.classList.contains('star') ||
        e.target.classList.contains('flip-indicator') ||
        e.target.classList.contains('expand-button') ||
        e.target.classList.contains('comments-button') ||
        e.target.classList.contains('pin-button') ||
        e.target.closest('.pin-button')) {
      return;
    }

    // Get card element immediately
    const cardElement = document.querySelector(`[data-card-id="${cardId}"]`);
    if (!cardElement) return;

    // Set dragging cursor immediately via DOM
    cardElement.style.cursor = 'grabbing';

    // Bring card to front via DOM (instant visual feedback)
    const maxZ = Math.max(...cards.map(c => c.zIndex), 0) + 1;
    cardElement.style.zIndex = maxZ;

    // Update React state for z-index (non-blocking, happens in background)
    setCards(prevCards =>
      prevCards.map(card => ({
        ...card,
        zIndex: card.id === cardId ? maxZ : card.zIndex
      }))
    );

    // Record starting position
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    // Get board rect for calculations
    const board = boardRef.current;
    const boardRect = board.getBoundingClientRect();
    boardRectRef.current = boardRect;
    boardSizeRef.current = { width: board.offsetWidth, height: board.offsetHeight };

    // Get current card position
    const currentPos = positionsRef.current[cardId] || { x: 0, y: 0 };
    const activeCardData = cards.find(card => card.id === cardId);
    if (!activeCardData) return;

    const rotatedBox = getRotatedBoundingBox(CARD_DIMENSIONS.width, CARD_DIMENSIONS.height, activeCardData.rotate);
    dragMetaRef.current = {
      widthDiff: (rotatedBox.width - CARD_DIMENSIONS.width) / 2,
      heightDiff: (rotatedBox.height - CARD_DIMENSIONS.height) / 2,
      cardWidth: CARD_DIMENSIONS.width,
      cardHeight: CARD_DIMENSIONS.height
    };

    const offsetX = clientX - boardRect.left - currentPos.x - 13;
    const offsetY = clientY - boardRect.top - currentPos.y;

    dragStartPosRef.current = { x: offsetX, y: offsetY };
    activeCardRef.current = cardId;

    // Add event listeners IMPERATIVELY - no React state change!
    document.addEventListener('mousemove', handleMouseMoveImperative);
    document.addEventListener('mouseup', handleMouseUpImperative);
    document.addEventListener('touchmove', handleMouseMoveImperative, { passive: false });
    document.addEventListener('touchend', handleMouseUpImperative);

    // Set activeCard for isDragging prop (deferred, non-critical)
    setActiveCard(cardId);
  }, [setCards, boardRef, cards, setCardPositions]);

  // Shuffle all card positions considering rotation
  const shufflePositions = useCallback(() => {
    if (!boardRef.current) return;
    
    const boardWidth = boardRef.current.offsetWidth;
    const boardHeight = boardRef.current.offsetHeight;
    
    const newPositions = {};
    cards.forEach(card => {
      const rotatedBox = getRotatedBoundingBox(CARD_DIMENSIONS.width, CARD_DIMENSIONS.height, card.rotate);
      newPositions[card.id] = getRandomPosition(boardWidth, boardHeight, rotatedBox.width, rotatedBox.height);
    });
    
    setCardPositions(newPositions);
  }, [cards, boardRef, setCardPositions]);

  return {
    cardPositions,
    setCardPositions,
    activeCard,
    handleCardMouseDown,
    shufflePositions
  };
};

export default useDragAndDrop;
