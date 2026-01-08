// src/components/BulletinBoard/BulletinBoardSection.jsx
'use client';
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import styled from 'styled-components';
import BulletinBoard from './BulletinBoard';
import RecipeCard from './RecipeCard/Index';
import ControlBar from './ControlBar';
import InteractiveBulletinDecorations from './InteractiveBulletinDecorations';
import useDragAndDrop from './hooks/useDragAndDrop';
import useCardManagement from './hooks/useCardManagement';
import useIsMobile from '../../src/hooks/useIsMobile';
import { recipeData } from '../../src/data/recipes';
import { getRandomPosition, getRotatedBoundingBox } from './utils/helpers';
import { CARD_DIMENSIONS } from './utils/constants';
import { recipeTrayCategories, recipeTrayData } from './utils/recipeTrayData';

const clampValue = (value, min, max) => Math.min(Math.max(value, min), max);

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

function BulletinBoardSection() {
  const isMobile = useIsMobile();
  const boardRef = useRef(null);
  const decorationsRef = useRef(null);
  const pinnedCardsRef = useRef(new Set());
  const shakeTimeoutRef = useRef(null);

  const [boardWidth, setBoardWidth] = useState(0);
  const [newCardIds, setNewCardIds] = useState(new Set());
  const [expandedCards, setExpandedCards] = useState(new Set());
  const [pinnedCards, setPinnedCards] = useState(new Set());
  const [isDragOver, setIsDragOver] = useState(false);
  const [shakeCardId, setShakeCardId] = useState(null);

  useEffect(() => {
    pinnedCardsRef.current = pinnedCards;
  }, [pinnedCards]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = window.localStorage.getItem('pinnedCards');
    setPinnedCards(saved ? new Set(JSON.parse(saved)) : new Set());
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('pinnedCards', JSON.stringify([...pinnedCards]));
  }, [pinnedCards]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const updateBoardWidth = () => {
      if (boardRef.current) {
        setBoardWidth(boardRef.current.offsetWidth);
      }
    };

    updateBoardWidth();
    window.addEventListener('resize', updateBoardWidth);
    return () => window.removeEventListener('resize', updateBoardWidth);
  }, []);

  useEffect(() => {
    return () => {
      if (shakeTimeoutRef.current) {
        clearTimeout(shakeTimeoutRef.current);
      }
    };
  }, []);

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
    setCardPositions,
    getCardRef
  } = useDragAndDrop(cards, setCards, boardRef);

  const handlePortfolioDrag = useCallback((event) => {
    const recipe = event.detail.recipe;
    if (!recipe || !boardRef.current) return;

    const newCard = addRecipeFromData(recipe);
    if (!newCard) return;

    const boardWidth = boardRef.current.offsetWidth;
    const boardHeight = boardRef.current.offsetHeight;
    const rotatedBox = getRotatedBoundingBox(CARD_DIMENSIONS.width, CARD_DIMENSIONS.height, newCard.rotate);

    const pos = {
      x: (boardWidth - rotatedBox.width) / 2,
      y: (boardHeight - rotatedBox.height) / 2
    };

    setCardPositions(prev => ({
      ...prev,
      [newCard.id]: pos
    }));

    setNewCardIds(prev => new Set([...prev, newCard.id]));
    setTimeout(() => {
      setNewCardIds(prev => {
        const next = new Set(prev);
        next.delete(newCard.id);
        return next;
      });
    }, 600);
  }, [addRecipeFromData, setCardPositions]);

  const mobileRecipeGroups = useMemo(() => {
    const buckets = new Map();
    recipeTrayCategories.forEach(category => {
      buckets.set(category.key, []);
    });

    recipeTrayData.forEach(recipe => {
      const key = (recipe.category || '').toLowerCase();
      if (buckets.has(key)) {
        buckets.get(key).push(recipe);
      }
    });

    return recipeTrayCategories.map(category => ({
      ...category,
      recipes: buckets.get(category.key) || []
    }));
  }, []);

  const handleMobileAdd = useCallback((recipe) => {
    handlePortfolioDrag({ detail: { recipe } });
  }, [handlePortfolioDrag]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.addEventListener('portfolio-recipe-drag', handlePortfolioDrag);
    return () => window.removeEventListener('portfolio-recipe-drag', handlePortfolioDrag);
  }, [handlePortfolioDrag]);

  const handleDragOver = useCallback((event) => {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy';
    }
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((event) => {
    if (event.target === boardRef.current) {
      setIsDragOver(false);
    }
  }, []);

  const handleDrop = useCallback((event) => {
    event.preventDefault();
    setIsDragOver(false);

    const raw = event.dataTransfer?.getData('application/json') || event.dataTransfer?.getData('text/plain');
    if (!raw) return;

    let recipe = null;
    try {
      recipe = JSON.parse(raw);
    } catch (error) {
      return;
    }

    if (!recipe || !boardRef.current) return;
    const newCard = addRecipeFromData(recipe);
    if (!newCard) return;

    const boardRect = boardRef.current.getBoundingClientRect();
    const boardWidth = boardRef.current.offsetWidth;
    const boardHeight = boardRef.current.offsetHeight;
    const rotatedBox = getRotatedBoundingBox(CARD_DIMENSIONS.width, CARD_DIMENSIONS.height, newCard.rotate);
    const widthDiff = (rotatedBox.width - CARD_DIMENSIONS.width) / 2;
    const heightDiff = (rotatedBox.height - CARD_DIMENSIONS.height) / 2;

    let x = event.clientX - boardRect.left - (CARD_DIMENSIONS.width / 2);
    let y = event.clientY - boardRect.top - (CARD_DIMENSIONS.height / 2);

    const minX = 10 + widthDiff;
    const minY = 0 + heightDiff;
    const maxX = boardWidth - CARD_DIMENSIONS.width - 80 - widthDiff;
    const maxY = boardHeight - CARD_DIMENSIONS.height - 100 - heightDiff;

    x = clampValue(x, minX, maxX);
    y = clampValue(y, minY, maxY);

    setCardPositions(prev => ({
      ...prev,
      [newCard.id]: { x, y }
    }));

    setNewCardIds(prev => new Set([...prev, newCard.id]));
    setTimeout(() => {
      setNewCardIds(prev => {
        const next = new Set(prev);
        next.delete(newCard.id);
        return next;
      });
    }, 600);
  }, [addRecipeFromData, setCardPositions]);

  const handleCardExpand = useCallback((cardId, isExpanded) => {
    setExpandedCards(prev => {
      const next = new Set(prev);
      if (isExpanded) {
        next.add(cardId);
      } else {
        next.delete(cardId);
      }
      return next;
    });
  }, []);

  const handlePinToggle = useCallback((cardId) => {
    setPinnedCards(prev => {
      const next = new Set(prev);
      if (next.has(cardId)) {
        next.delete(cardId);
      } else {
        next.add(cardId);
      }
      return next;
    });
  }, []);

  const triggerPinnedShake = useCallback((cardId) => {
    setShakeCardId(cardId);
    if (shakeTimeoutRef.current) {
      clearTimeout(shakeTimeoutRef.current);
    }
    shakeTimeoutRef.current = setTimeout(() => {
      setShakeCardId((current) => (current === cardId ? null : current));
    }, 300);
  }, []);

  const handlePinnedCardMouseDown = useCallback((event, cardId) => {
    if (event.target.classList.contains('pin-button') || event.target.closest('.pin-button')) {
      return;
    }

    if (pinnedCardsRef.current.has(cardId)) {
      event.preventDefault();
      event.stopPropagation();
      triggerPinnedShake(cardId);
      return;
    }

    handleCardMouseDown(event, cardId);
  }, [handleCardMouseDown, triggerPinnedShake]);

  const handleAddCard = useCallback(() => {
    const newCard = addNewCard();
    if (!newCard || !boardRef.current) return;

    const boardWidth = boardRef.current.offsetWidth;
    const boardHeight = boardRef.current.offsetHeight;
    const rotatedBox = getRotatedBoundingBox(CARD_DIMENSIONS.width, CARD_DIMENSIONS.height, newCard.rotate);
    const pos = getRandomPosition(boardWidth, boardHeight, rotatedBox.width, rotatedBox.height);

    setCardPositions(prev => ({
      ...prev,
      [newCard.id]: { x: pos.x, y: pos.y }
    }));

    setNewCardIds(prev => new Set([...prev, newCard.id]));
    setTimeout(() => {
      setNewCardIds(prev => {
        const next = new Set(prev);
        next.delete(newCard.id);
        return next;
      });
    }, 600);
  }, [addNewCard, setCardPositions]);

  const handleShuffle = useCallback(() => {
    updateCardRotations();

    if (!boardRef.current) return;

    const boardWidth = boardRef.current.offsetWidth;
    const boardHeight = boardRef.current.offsetHeight;

    const newPositions = { ...cardPositions };

    cards.forEach(card => {
      if (!pinnedCardsRef.current.has(card.id)) {
        const rotatedBox = getRotatedBoundingBox(CARD_DIMENSIONS.width, CARD_DIMENSIONS.height, card.rotate);
        newPositions[card.id] = getRandomPosition(boardWidth, boardHeight, rotatedBox.width, rotatedBox.height);
      }
    });

    setCardPositions(newPositions);
  }, [cards, cardPositions, setCardPositions, updateCardRotations]);

  const handleClear = useCallback(() => {
    clearAllCards();
    setNewCardIds(new Set());
    setExpandedCards(new Set());
    setPinnedCards(new Set());
    setCardPositions({});

    if (decorationsRef.current) {
      decorationsRef.current.clearAll();
    }
  }, [clearAllCards, setCardPositions]);

  const hasExpandedCard = useMemo(() => expandedCards.size > 0, [expandedCards]);

  return (
    <SpotlightSection id="spotlight">
      <h2>Recipe Collection</h2>
      
      <ControlBar
        onAddCard={handleAddCard}
        onShuffleCards={handleShuffle}
        onClearCards={handleClear}
      />
      
      <BulletinBoard 
        ref={boardRef} 
        hasExpandedCard={hasExpandedCard}
        onDragOver={isMobile ? undefined : handleDragOver}
        onDragLeave={isMobile ? undefined : handleDragLeave}
        onDrop={isMobile ? undefined : handleDrop}
        style={{
          border: !isMobile && isDragOver ? '3px dashed #a67c52' : 'none',
          transition: !isMobile ? 'border 0.2s' : 'none'
        }}
      >
        {!isMobile && (
          <InteractiveBulletinDecorations 
            ref={decorationsRef}
            boardRef={boardRef} 
          />
        )}
        {cards.map(card => (
          <RecipeCard
            key={card.id}
            card={card}
            position={cardPositions[card.id] || { x: 0, y: 0 }}
            isDragging={activeCard === card.id}
            isNew={newCardIds.has(card.id)}
            isPinned={pinnedCards.has(card.id)}
            isShaking={shakeCardId === card.id}
            rating={ratings[card.id] || 0}
            comments={comments[card.id] || []}
            boardWidth={boardWidth}
            onMouseDown={isMobile ? undefined : handlePinnedCardMouseDown}
            onRatingChange={handleRating}
            onAddComment={handleAddComment}
            onExpand={handleCardExpand}
            onPinToggle={handlePinToggle}
            cardRef={getCardRef(card.id)}
          />
        ))}
      </BulletinBoard>

      {isMobile && (
        <section className="mobile-recipe-tray" aria-label="Recipe tray">
          <div className="mobile-recipe-tray-header">
            <h3>Recipe Shelf</h3>
            <p className="mobile-recipe-tray-hint">Tap Add to place a recipe on the board.</p>
          </div>
          {mobileRecipeGroups.map((group, index) => (
            <details
              key={group.key}
              className="mobile-recipe-group"
              open={index === 0}
            >
              <summary>{group.label}</summary>
              <div className="mobile-recipe-list">
                {group.recipes.map(recipe => (
                  <article key={recipe.id} className="mobile-recipe-card">
                    <div className="mobile-recipe-card-header">
                      <div>
                        <h4 className="mobile-recipe-card-title">{recipe.title}</h4>
                        <p className="mobile-recipe-card-meta">{recipe.time}</p>
                      </div>
                      <button
                        type="button"
                        className="mobile-recipe-add"
                        onClick={() => handleMobileAdd(recipe)}
                      >
                        Add
                      </button>
                    </div>
                    <p className="mobile-recipe-card-text">{recipe.text}</p>
                  </article>
                ))}
              </div>
            </details>
          ))}
        </section>
      )}
    </SpotlightSection>
  );
}

export default BulletinBoardSection;
