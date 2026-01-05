// src/components/Home/Spotlight/hooks/useDragAndDrop.js
'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { CARD_DIMENSIONS } from '../utils/constants';
import { getRandomPosition, getRotatedBoundingBox } from '../utils/helpers';

const useDragAndDrop = (cards, setCards, boardRef) => {
  const [activeCard, setActiveCard] = useState(null);
  const [cardPositionsState, setCardPositionsState] = useState({});

  const positionsRef = useRef({});
  const cardsRef = useRef(cards);
  const activeCardRef = useRef(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const pendingPointRef = useRef(null);
  const rafRef = useRef(null);

  const cardElementsRef = useRef(new Map());
  const cardRefCallbacks = useRef(new Map());

  useEffect(() => {
    cardsRef.current = cards;
  }, [cards]);

  const setCardPositions = useCallback((updater) => {
    setCardPositionsState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      positionsRef.current = next;
      return next;
    });
  }, []);

  useEffect(() => {
    positionsRef.current = cardPositionsState;
  }, [cardPositionsState]);

  const getCardRef = useCallback((cardId) => {
    if (!cardRefCallbacks.current.has(cardId)) {
      cardRefCallbacks.current.set(cardId, (node) => {
        if (node) {
          cardElementsRef.current.set(cardId, node);
        } else {
          cardElementsRef.current.delete(cardId);
        }
      });
    }
    return cardRefCallbacks.current.get(cardId);
  }, []);

  // Initialize positions for new cards with better spacing
  useEffect(() => {
    if (!boardRef.current || cards.length === 0) return;

    const boardWidth = boardRef.current.offsetWidth;
    const boardHeight = boardRef.current.offsetHeight;

    const newPositions = {};
    let positionsAssigned = 0;

    cards.forEach((card, index) => {
      if (!positionsRef.current[card.id]) {
        const rotatedBox = getRotatedBoundingBox(
          CARD_DIMENSIONS.width,
          CARD_DIMENSIONS.height,
          card.rotate
        );

        // For initial 3 cards, space them out evenly
        if (cards.length <= 3 && positionsAssigned < 3) {
          const sectionWidth = (boardWidth - 100) / 3;
          const baseX = 50 + (index * sectionWidth);

          const randomOffsetX = (Math.random() - 0.5) * (sectionWidth * 0.5);
          const randomOffsetY = Math.random() * (boardHeight * 0.4);

          newPositions[card.id] = {
            x: Math.max(10, Math.min(baseX + randomOffsetX, boardWidth - rotatedBox.width - 80)),
            y: Math.max(0, 50 + randomOffsetY)
          };
          positionsAssigned += 1;
        } else {
          newPositions[card.id] = getRandomPosition(
            boardWidth,
            boardHeight,
            rotatedBox.width,
            rotatedBox.height
          );
        }
      }
    });

    if (Object.keys(newPositions).length > 0) {
      setCardPositions(prev => ({ ...prev, ...newPositions }));
    }
  }, [boardRef, cards, setCardPositions]);

  const getPointerPosition = (event) => {
    if (event.touches && event.touches[0]) {
      return { x: event.touches[0].clientX, y: event.touches[0].clientY };
    }
    if (event.changedTouches && event.changedTouches[0]) {
      return { x: event.changedTouches[0].clientX, y: event.changedTouches[0].clientY };
    }
    return { x: event.clientX, y: event.clientY };
  };

  const handleCardMouseDown = useCallback((event, cardId) => {
    event.preventDefault();

    if (event.target.classList.contains('star') ||
        event.target.classList.contains('flip-indicator') ||
        event.target.classList.contains('expand-button') ||
        event.target.classList.contains('comments-button') ||
        event.target.classList.contains('pin-button') ||
        event.target.closest('.pin-button')) {
      return;
    }

    setCards(prevCards =>
      prevCards.map(card => ({
        ...card,
        zIndex: card.id === cardId
          ? Math.max(...prevCards.map(c => c.zIndex)) + 1
          : card.zIndex
      }))
    );

    const { x: clientX, y: clientY } = getPointerPosition(event);

    const board = boardRef.current;
    if (!board) return;
    const boardRect = board.getBoundingClientRect();

    const currentPos = positionsRef.current[cardId] || { x: 0, y: 0 };

    const offsetX = clientX - boardRect.left - currentPos.x - 13;
    const offsetY = clientY - boardRect.top - currentPos.y;

    dragStartRef.current = { x: offsetX, y: offsetY };
    activeCardRef.current = cardId;
    setActiveCard(cardId);
  }, [setCards, boardRef]);

  const updateDragPosition = useCallback(() => {
    rafRef.current = null;

    const cardId = activeCardRef.current;
    if (cardId === null || !boardRef.current) return;

    const point = pendingPointRef.current;
    if (!point) return;

    const board = boardRef.current;
    const boardRect = board.getBoundingClientRect();
    const activeCardData = cardsRef.current.find(card => card.id === cardId);
    if (!activeCardData) return;

    const cardWidth = CARD_DIMENSIONS.width;
    const cardHeight = CARD_DIMENSIONS.height;
    const rotatedBox = getRotatedBoundingBox(cardWidth, cardHeight, activeCardData.rotate);

    const widthDiff = (rotatedBox.width - cardWidth) / 2;
    const heightDiff = (rotatedBox.height - cardHeight) / 2;

    let x = point.x - boardRect.left - dragStartRef.current.x - 13;
    let y = point.y - boardRect.top - dragStartRef.current.y;

    const boardWidth = board.offsetWidth;
    const boardHeight = board.offsetHeight;

    const minX = 10 + widthDiff;
    const minY = 0 + heightDiff;
    const maxX = boardWidth - cardWidth - 80 - widthDiff;
    const maxY = boardHeight - cardHeight - 100 - heightDiff;

    x = Math.max(minX, Math.min(x, maxX));
    y = Math.max(minY, Math.min(y, maxY));

    positionsRef.current[cardId] = { x, y };

    const element = cardElementsRef.current.get(cardId);
    if (element) {
      element.style.setProperty('--x', `${x}px`);
      element.style.setProperty('--y', `${y}px`);
    }
  }, [boardRef]);

  const handleMouseMove = useCallback((event) => {
    if (activeCardRef.current === null) return;
    if (event.cancelable) {
      event.preventDefault();
    }

    const point = getPointerPosition(event);
    pendingPointRef.current = point;

    if (!rafRef.current) {
      rafRef.current = requestAnimationFrame(updateDragPosition);
    }
  }, [updateDragPosition]);

  const handleMouseUp = useCallback(() => {
    const cardId = activeCardRef.current;
    if (cardId === null) return;

    if (pendingPointRef.current && boardRef.current) {
      const boardRect = boardRef.current.getBoundingClientRect();
      const activeCardData = cardsRef.current.find(card => card.id === cardId);
      if (activeCardData) {
        const cardWidth = CARD_DIMENSIONS.width;
        const cardHeight = CARD_DIMENSIONS.height;
        const rotatedBox = getRotatedBoundingBox(cardWidth, cardHeight, activeCardData.rotate);

        const widthDiff = (rotatedBox.width - cardWidth) / 2;
        const heightDiff = (rotatedBox.height - cardHeight) / 2;

        let x = pendingPointRef.current.x - boardRect.left - dragStartRef.current.x - 13;
        let y = pendingPointRef.current.y - boardRect.top - dragStartRef.current.y;

        const boardWidth = boardRef.current.offsetWidth;
        const boardHeight = boardRef.current.offsetHeight;

        const minX = 10 + widthDiff;
        const minY = 0 + heightDiff;
        const maxX = boardWidth - cardWidth - 80 - widthDiff;
        const maxY = boardHeight - cardHeight - 100 - heightDiff;

        x = Math.max(minX, Math.min(x, maxX));
        y = Math.max(minY, Math.min(y, maxY));

        positionsRef.current[cardId] = { x, y };
      }
    }

    const finalPosition = positionsRef.current[cardId];
    if (finalPosition) {
      setCardPositions(prev => ({ ...prev, [cardId]: finalPosition }));
    }

    activeCardRef.current = null;
    setActiveCard(null);
    pendingPointRef.current = null;
  }, [boardRef, setCardPositions]);

  useEffect(() => {
    if (activeCard === null) return;
    if (typeof document === 'undefined') return;

    const handleGlobalMove = (event) => handleMouseMove(event);
    const handleGlobalUp = () => handleMouseUp();

    document.addEventListener('mousemove', handleGlobalMove);
    document.addEventListener('mouseup', handleGlobalUp);
    document.addEventListener('touchmove', handleGlobalMove, { passive: false });
    document.addEventListener('touchend', handleGlobalUp);

    return () => {
      document.removeEventListener('mousemove', handleGlobalMove);
      document.removeEventListener('mouseup', handleGlobalUp);
      document.removeEventListener('touchmove', handleGlobalMove);
      document.removeEventListener('touchend', handleGlobalUp);
    };
  }, [activeCard, handleMouseMove, handleMouseUp]);

  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

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
    cardPositions: cardPositionsState,
    setCardPositions,
    activeCard,
    handleCardMouseDown,
    shufflePositions,
    getCardRef
  };
};

export default useDragAndDrop;
