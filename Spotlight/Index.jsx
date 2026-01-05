// src/components/Home/Spotlight/Index.jsx
import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import BulletinBoard from './BulletinBoard';
import RecipeCard from './RecipeCard/Index';
import ControlBar from './ControlBar';
import InteractiveBulletinDecorations from './InteractiveBulletinDecorations';
import useDragAndDrop from './hooks/useDragAndDrop';
import useCardManagement from './hooks/useCardManagement';
import { recipeData } from '../../../data/recipes';
import { getRandomPosition, getRotatedBoundingBox } from './utils/helpers';
import { CARD_DIMENSIONS } from './utils/constants';

const SpotlightSection = styled.section`
  &[data-observe] {
    opacity: 0;
    transform: translateY(30px);
    transition: opacity 0.9s, transform 0.9s;
  }
  
  &.visible {
    opacity: 1;
    transform: translateY(0);
  }
`;

// Add shake animation styles
const style = document.createElement('style');
style.textContent = `
  @keyframes pinnedShake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-2px); }
    75% { transform: translateX(2px); }
  }
`;
document.head.appendChild(style);

function Spotlight() {
  const boardRef = useRef(null);
  const decorationsRef = useRef(null);
  const [boardWidth, setBoardWidth] = useState(0);
  const [newCardIds, setNewCardIds] = useState(new Set());
  const [expandedCards, setExpandedCards] = useState(new Set());
  const [pinnedCards, setPinnedCards] = useState(() => {
    // Load pinned cards from localStorage
    const saved = localStorage.getItem('pinnedCards');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });
  const [isDragOver, setIsDragOver] = useState(false);
  
  // Update board width on resize
  useEffect(() => {
    const updateBoardWidth = () => {
      if (boardRef.current) {
        setBoardWidth(boardRef.current.offsetWidth);
      }
    };
    
    updateBoardWidth();
    window.addEventListener('resize', updateBoardWidth);
    return () => window.removeEventListener('resize', updateBoardWidth);
  }, []);
  
  // Save pinned cards to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('pinnedCards', JSON.stringify([...pinnedCards]));
  }, [pinnedCards]);
  
  // Use custom hooks
  const {
    cards,
    setCards,
    ratings,
    comments,
    handleRating,
    handleAddComment,
    addNewCard,
    clearAllCards,
    updateCardRotations,
    addRecipeFromData
  } = useCardManagement(recipeData);
  
  const {
    cardPositions,
    activeCard,
    handleCardMouseDown,
    setCardPositions
  } = useDragAndDrop(cards, setCards, boardRef);
  
  // Listen for portfolio drag events
  useEffect(() => {
    const handlePortfolioDrag = (event) => {
      const recipe = event.detail.recipe;
      if (recipe && boardRef.current) {
        // Add the recipe to the board
        const newCard = addRecipeFromData(recipe);
        if (newCard) {
          const boardWidth = boardRef.current.offsetWidth;
          const boardHeight = boardRef.current.offsetHeight;
          const rotatedBox = getRotatedBoundingBox(CARD_DIMENSIONS.width, CARD_DIMENSIONS.height, newCard.rotate);
          
          // Position in the center of the board
          const pos = {
            x: (boardWidth - rotatedBox.width) / 2,
            y: (boardHeight - rotatedBox.height) / 2
          };
          
          setCardPositions(prev => ({
            ...prev,
            [newCard.id]: pos
          }));
          
          // Animation
          setNewCardIds(prev => new Set([...prev, newCard.id]));
          setTimeout(() => {
            setNewCardIds(prev => {
              const newSet = new Set(prev);
              newSet.delete(newCard.id);
              return newSet;
            });
          }, 600);
        }
      }
    };
    
    window.addEventListener('portfolio-recipe-drag', handlePortfolioDrag);
    return () => window.removeEventListener('portfolio-recipe-drag', handlePortfolioDrag);
  }, [addRecipeFromData, setCardPositions]);
  
  // Handle drag over bulletin board
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };
  
  const handleDragLeave = (e) => {
    if (e.target === boardRef.current) {
      setIsDragOver(false);
    }
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    // The recipe data is handled via the custom event system
    // This is just to provide visual feedback
  };
  
  // Handle card expansion state
  const handleCardExpand = (cardId, isExpanded) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (isExpanded) {
        newSet.add(cardId);
      } else {
        newSet.delete(cardId);
      }
      return newSet;
    });
  };
  
  // Handle comments toggle
  
  // Handle pin toggle
  const handlePinToggle = (cardId) => {
    setPinnedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cardId)) {
        newSet.delete(cardId);
      } else {
        newSet.add(cardId);
      }
      return newSet;
    });
  };
  
  // Modified mouse down handler to check if card is pinned
  const handlePinnedCardMouseDown = (e, cardId) => {
    // Check if clicking on the pin button itself
    if (e.target.classList.contains('pin-button') || e.target.closest('.pin-button')) {
      return; // Let the pin button handle its own click
    }
    
    if (pinnedCards.has(cardId)) {
      // Card is pinned, don't allow dragging
      e.preventDefault();
      e.stopPropagation();
      
      // Add shake animation to indicate card is pinned
      const cardElement = e.currentTarget;
      cardElement.style.animation = 'pinnedShake 0.3s';
      setTimeout(() => {
        cardElement.style.animation = '';
      }, 300);
      
      return;
    }
    // Card is not pinned, allow normal dragging
    handleCardMouseDown(e, cardId);
  };
  
  // Handle adding a new card
  const handleAddCard = () => {
    const newCard = addNewCard();
    if (newCard && boardRef.current) {
      const boardWidth = boardRef.current.offsetWidth;
      const boardHeight = boardRef.current.offsetHeight;
      const rotatedBox = getRotatedBoundingBox(CARD_DIMENSIONS.width, CARD_DIMENSIONS.height, newCard.rotate);
      const pos = getRandomPosition(boardWidth, boardHeight, rotatedBox.width, rotatedBox.height);
      
      setCardPositions(prev => ({
        ...prev,
        [newCard.id]: { x: pos.x, y: pos.y }
      }));
      
      // Animation
      setNewCardIds(prev => new Set([...prev, newCard.id]));
      setTimeout(() => {
        setNewCardIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(newCard.id);
          return newSet;
        });
      }, 600);
    }
  };
  
  // Handle shuffle - only shuffle unpinned cards
  const handleShuffle = () => {
    updateCardRotations();
    
    if (!boardRef.current) return;
    
    const boardWidth = boardRef.current.offsetWidth;
    const boardHeight = boardRef.current.offsetHeight;
    
    const newPositions = { ...cardPositions };
    
    cards.forEach(card => {
      // Skip pinned cards
      if (!pinnedCards.has(card.id)) {
        const rotatedBox = getRotatedBoundingBox(CARD_DIMENSIONS.width, CARD_DIMENSIONS.height, card.rotate);
        const pos = getRandomPosition(boardWidth, boardHeight, rotatedBox.width, rotatedBox.height);
        newPositions[card.id] = pos;
      }
    });
    
    setCardPositions(newPositions);
  };
  
  // Handle clear with cleanup - now also clears decorations
  const handleClear = () => {
    // Clear recipe cards
    clearAllCards();
    setNewCardIds(new Set());
    setExpandedCards(new Set());
    setPinnedCards(new Set());
    
    // Clear decorations (stickers and post-it notes)
    if (decorationsRef.current) {
      decorationsRef.current.clearAll();
    }
  };
  
  return (
    <SpotlightSection id="spotlight" data-observe>
      <h2>Recipe Collection</h2>
      
      <ControlBar
        onAddCard={handleAddCard}
        onShuffleCards={handleShuffle}
        onClearCards={handleClear}
      />
      
      <BulletinBoard 
        ref={boardRef} 
        hasExpandedCard={expandedCards.size > 0}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          border: isDragOver ? '3px dashed #a67c52' : 'none',
          transition: 'border 0.2s'
        }}
      >
        <InteractiveBulletinDecorations 
          ref={decorationsRef}
          boardRef={boardRef} 
        />
        {cards.map(card => (
          <RecipeCard
            key={card.id}
            card={card}
            position={cardPositions[card.id] || { x: 0, y: 0 }}
            isDragging={activeCard === card.id}
            isNew={newCardIds.has(card.id)}
            isPinned={pinnedCards.has(card.id)}
            rating={ratings[card.id] || 0}
            comments={comments[card.id] || []}
            boardWidth={boardWidth}
            onMouseDown={(e) => handlePinnedCardMouseDown(e, card.id)}
            onRatingChange={(value) => handleRating(card.id, card.recipeId, value)}
            onAddComment={(comment) => handleAddComment(card.id, card.recipeId, comment)}
            onExpand={(isExpanded) => handleCardExpand(card.id, isExpanded)}
            onPinToggle={handlePinToggle}
          />
        ))}
      </BulletinBoard>
    </SpotlightSection>
  );
}

export default Spotlight;