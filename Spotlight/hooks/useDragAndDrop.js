// src/components/Home/Spotlight/hooks/useDragAndDrop.js
import { useState, useEffect, useCallback } from 'react';
import { BOARD_DIMENSIONS, CARD_DIMENSIONS } from '../utils/constants';
import { getRandomPosition, getRotatedBoundingBox } from '../utils/helpers';

const useDragAndDrop = (cards, setCards, boardRef) => {
  const [activeCard, setActiveCard] = useState(null);
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
  const [cardPositions, setCardPositions] = useState({});

  // Initialize positions for new cards with better spacing
  useEffect(() => {
    if (!boardRef.current || cards.length === 0) return;
    
    const boardWidth = boardRef.current.offsetWidth;
    const boardHeight = boardRef.current.offsetHeight;
    
    const newPositions = {};
    let positionsAssigned = 0;
    
    cards.forEach((card, index) => {
      if (!cardPositions[card.id]) {
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
  }, [boardRef, cards, cardPositions]);

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
    
    // Bring card to front
    setCards(prevCards => 
      prevCards.map(card => ({
        ...card,
        zIndex: card.id === cardId 
          ? Math.max(...prevCards.map(c => c.zIndex)) + 1 
          : card.zIndex
      }))
    );
    
    // Record starting position
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    // Get board rect for calculations
    const board = boardRef.current;
    const boardRect = board.getBoundingClientRect();
    
    // Get current card position (accounting for the margin-left)
    const currentPos = cardPositions[cardId] || { x: 0, y: 0 };
    
    // Calculate cursor position relative to card's top-left corner
    // Add 13px to account for the margin-left on CardContainer
    const offsetX = clientX - boardRect.left - currentPos.x - 13;
    const offsetY = clientY - boardRect.top - currentPos.y;
    
    setDragStartPos({ x: offsetX, y: offsetY });
    setActiveCard(cardId);
  }, [setCards, cardPositions, boardRef]);

  const handleMouseMove = useCallback((e) => {
    if (activeCard === null || !boardRef.current) return;
    
    e.preventDefault();
    
    const board = boardRef.current;
    const boardRect = board.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    // Find the active card to get its rotation
    const activeCardData = cards.find(card => card.id === activeCard);
    if (!activeCardData) return;
    
    // Calculate the rotated bounding box
    const cardWidth = CARD_DIMENSIONS.width;
    const cardHeight = CARD_DIMENSIONS.height;
    const rotatedBox = getRotatedBoundingBox(cardWidth, cardHeight, activeCardData.rotate);
    
    // Calculate offset to center (difference between rotated and original box)
    const widthDiff = (rotatedBox.width - cardWidth) / 2;
    const heightDiff = (rotatedBox.height - cardHeight) / 2;
    
    // Calculate new position relative to the board
    // Subtract 13px to account for the margin-left offset
    let x = clientX - boardRect.left - dragStartPos.x - 13;
    let y = clientY - boardRect.top - dragStartPos.y;
    
    // Apply boundary constraints
    const boardWidth = board.offsetWidth;
    const boardHeight = board.offsetHeight;
    
    // Simple boundaries that match getRandomPosition
    const minX = 10 + widthDiff;
    const minY = 0 + heightDiff;
    const maxX = boardWidth - cardWidth - 80 - widthDiff;
    const maxY = boardHeight - cardHeight - 100 - heightDiff;
    
    // Constrain positions to the boundary area
    x = Math.max(minX, Math.min(x, maxX));
    y = Math.max(minY, Math.min(y, maxY));
    
    // Update card position
    setCardPositions(prevPositions => ({
      ...prevPositions,
      [activeCard]: { x, y }
    }));
  }, [activeCard, dragStartPos, boardRef, cards]);

  const handleMouseUp = useCallback(() => {
    setActiveCard(null);
  }, []);

  // Register global mouse events for better drag experience
  useEffect(() => {
    if (activeCard !== null) {
      const handleGlobalMove = (e) => handleMouseMove(e);
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
    }
  }, [activeCard, handleMouseMove, handleMouseUp]);

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
  }, [cards, boardRef]);

  return {
    cardPositions,
    setCardPositions,
    activeCard,
    handleCardMouseDown,
    shufflePositions
  };
};

export default useDragAndDrop;