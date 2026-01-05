'use client';
import React, { useMemo, useState, useCallback } from 'react';
import styled from 'styled-components';
import { recipeTrayCategories, recipeTrayData } from './utils/recipeTrayData';

const TrayShell = styled.section`
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  height: var(--recipe-tray-height, 220px);
  background: linear-gradient(180deg, #fff8ed 0%, #f6ebdc 100%);
  border-top: 1px solid rgba(140, 102, 64, 0.35);
  box-shadow: 0 -10px 24px rgba(0, 0, 0, 0.16);
  z-index: 200;
`;

const TrayInner = styled.div`
  height: 100%;
  max-width: 1120px;
  margin: 0 auto;
  padding: 16px 20px calc(18px + env(safe-area-inset-bottom, 0px));
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const TrayHeader = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
`;

const TrayTitle = styled.h3`
  margin: 0;
  font-family: 'Courier New', monospace;
  font-size: 18px;
  color: #5a3f24;
`;

const TrayHint = styled.p`
  margin: 0;
  font-size: 12px;
  color: rgba(90, 63, 36, 0.7);
  letter-spacing: 0.6px;
  text-transform: uppercase;
`;

const CategoryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(5, minmax(160px, 1fr));
  gap: 16px;
  overflow-x: auto;
  padding-bottom: 6px;
`;

const CategoryColumn = styled.div`
  min-width: 160px;
  display: grid;
  gap: 8px;
`;

const CategoryTitle = styled.div`
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: rgba(90, 63, 36, 0.7);
`;

const RecipeList = styled.div`
  display: grid;
  gap: 8px;
  max-height: 140px;
  overflow-y: auto;
  padding-right: 4px;
`;

const RecipeItem = styled.div`
  background: #fffaf2;
  border: 1px solid rgba(140, 102, 64, 0.25);
  border-radius: 10px;
  padding: 10px 12px;
  display: grid;
  gap: 6px;
  cursor: grab;
  box-shadow: 0 6px 12px rgba(90, 63, 36, 0.08);
  transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;

  &[data-dragging='true'] {
    opacity: 0.55;
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(90, 63, 36, 0.14);
  }

  &:active {
    cursor: grabbing;
  }
`;

const RecipeRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
`;

const RecipeTitle = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #4f3822;
`;

const RecipeMeta = styled.div`
  font-size: 11px;
  color: rgba(90, 63, 36, 0.7);
`;

const RecipeText = styled.div`
  font-size: 12px;
  color: rgba(75, 55, 34, 0.85);
  line-height: 1.3;
`;

const TrayAddButton = styled.button`
  border: 1px solid rgba(90, 63, 36, 0.4);
  background: rgba(255, 248, 235, 0.9);
  color: #5a3f24;
  border-radius: 999px;
  padding: 2px 10px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 10px rgba(90, 63, 36, 0.15);
  }
`;

const RecipeTray = () => {
  const [draggingId, setDraggingId] = useState(null);

  const groupedCategories = useMemo(() => {
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

  const dispatchQuickAdd = useCallback((recipe) => {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent('portfolio-recipe-drag', { detail: { recipe } }));
  }, []);

  const handleDragStart = useCallback((event, recipe) => {
    const payload = JSON.stringify(recipe);
    event.dataTransfer.effectAllowed = 'copy';
    event.dataTransfer.setData('application/json', payload);
    event.dataTransfer.setData('text/plain', payload);
    setDraggingId(recipe.id);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggingId(null);
  }, []);

  const handleKeyAdd = useCallback((event, recipe) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      dispatchQuickAdd(recipe);
    }
  }, [dispatchQuickAdd]);

  return (
    <TrayShell aria-label="Recipe tray">
      <TrayInner>
        <TrayHeader>
          <TrayTitle>Recipe Holder</TrayTitle>
          <TrayHint>Drag recipes onto the board</TrayHint>
        </TrayHeader>
        <CategoryGrid>
          {groupedCategories.map(category => (
            <CategoryColumn key={category.key}>
              <CategoryTitle>{category.label}</CategoryTitle>
              <RecipeList>
                {category.recipes.map(recipe => (
                  <RecipeItem
                    key={recipe.id}
                    draggable
                    data-dragging={draggingId === recipe.id ? 'true' : 'false'}
                    tabIndex={0}
                    role="button"
                    aria-label={`Drag ${recipe.title} onto the board`}
                    onKeyDown={(event) => handleKeyAdd(event, recipe)}
                    onDragStart={(event) => handleDragStart(event, recipe)}
                    onDragEnd={handleDragEnd}
                  >
                    <RecipeRow>
                      <div>
                        <RecipeTitle>{recipe.title}</RecipeTitle>
                        <RecipeMeta>{recipe.time}</RecipeMeta>
                      </div>
                      <TrayAddButton
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          dispatchQuickAdd(recipe);
                        }}
                      >
                        Add
                      </TrayAddButton>
                    </RecipeRow>
                    <RecipeText>{recipe.text}</RecipeText>
                  </RecipeItem>
                ))}
              </RecipeList>
            </CategoryColumn>
          ))}
        </CategoryGrid>
      </TrayInner>
    </TrayShell>
  );
};

export default RecipeTray;
