'use client';
import React, { useMemo, useState, useCallback } from 'react';
import styled from 'styled-components';
import { recipeTrayCategories, recipeTrayData } from './utils/recipeTrayData';

const PortfolioContainer = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: ${props => props.$expanded ? '340px' : '80px'};
  background: #f5f0dc;
  background-image:
    repeating-linear-gradient(
      90deg,
      transparent,
      transparent 2px,
      rgba(210, 190, 150, 0.1) 2px,
      rgba(210, 190, 150, 0.1) 4px
    ),
    radial-gradient(
      ellipse at top,
      rgba(255, 250, 240, 0.9),
      rgba(245, 240, 220, 0.95)
    );
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
  transition: height 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 200;
  border-top: 2px solid #d2be96;

  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(166, 124, 82, 0.3) 20%,
      rgba(166, 124, 82, 0.3) 80%,
      transparent 100%
    );
  }
`;

const PortfolioHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 30px;
  cursor: pointer;
  user-select: none;
  position: relative;
  z-index: 210;
  background: transparent;

  &:hover .handle-container {
    transform: translateY(-2px);
  }
`;

const HandleContainer = styled.div`
  position: relative;
  width: 60px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s;
`;

const Handle = styled.div`
  width: 60px;
  height: 4px;
  background: #a67c52;
  border-radius: 2px;
  opacity: 0.6;
  transition: all 0.2s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: relative;

  &:before,
  &:after {
    content: '';
    position: absolute;
    background: #a67c52;
    border-radius: 2px;
    opacity: 0.4;
    left: 50%;
    transform: translateX(-50%);
  }

  &:before {
    width: 40px;
    height: 3px;
    top: -8px;
  }

  &:after {
    width: 40px;
    height: 3px;
    bottom: -8px;
  }
`;

const CategoryTabs = styled.div`
  display: flex;
  height: 50px;
  padding: 0;
  gap: 0;
  align-items: flex-end;
  width: 100%;
`;

const CategoryTab = styled.button`
  flex: 1;
  height: ${props => props.$active ? '45px' : '40px'};
  background: ${props => props.$color};
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Courier New', monospace;
  font-weight: 600;
  font-size: 13px;
  color: ${props => props.$active ? '#fff' : 'rgba(255, 255, 255, 0.9)'};
  cursor: pointer;
  position: relative;
  transition: all 0.2s;
  border: none;
  border-right: 1px solid rgba(0, 0, 0, 0.1);

  &:last-child {
    border-right: none;
  }

  &:hover {
    height: 45px;
    transform: translateY(-2px);
    color: #fff;
    z-index: 1;
    box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
  }

  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 100%;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.15) 0%, transparent 50%);
    pointer-events: none;
  }
`;

const RecipeCardsContainer = styled.div`
  display: ${props => props.$expanded ? 'flex' : 'none'};
  height: ${props => props.$expanded ? '260px' : '0'};
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: rgba(255, 255, 255, 0.05);
  position: relative;
  flex-direction: column;
`;

const SearchFilterBar = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 20px;
  height: 40px;
  border-bottom: 1px solid rgba(210, 190, 150, 0.3);
  background: rgba(255, 254, 245, 0.35);
  flex-shrink: 0;
`;

const SearchInput = styled.input`
  flex: 1;
  max-width: 320px;
  padding: 6px 12px;
  border: 1px solid rgba(210, 190, 150, 0.6);
  border-radius: 4px;
  background: rgba(255, 254, 245, 0.9);
  font-family: 'Courier New', monospace;
  font-size: 13px;
  color: #59483b;

  &:focus {
    outline: none;
    border-color: #a67c52;
    box-shadow: 0 0 0 2px rgba(166, 124, 82, 0.1);
  }
`;

const ClearButton = styled.button`
  border: 1px solid rgba(166, 124, 82, 0.6);
  background: rgba(255, 254, 245, 0.8);
  color: #8a7248;
  padding: 4px 10px;
  border-radius: 12px;
  font-family: 'Courier New', monospace;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(166, 124, 82, 0.12);
    border-color: #a67c52;
    color: #59483b;
  }
`;

const ResultCount = styled.div`
  margin-left: auto;
  font-family: 'Courier New', monospace;
  font-size: 11px;
  color: rgba(90, 63, 36, 0.7);
`;

const FilterRow = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 6px 20px 8px;
  background: rgba(255, 254, 245, 0.25);
  border-bottom: 1px solid rgba(210, 190, 150, 0.25);
  flex-wrap: wrap;
  flex-shrink: 0;
`;

const FilterGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  font-family: 'Courier New', monospace;
  font-size: 11px;
  color: #8a7248;
`;

const FilterLabel = styled.span`
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.6px;
`;

const FilterChip = styled.button`
  border: 1px solid ${props => props.$active ? '#a67c52' : 'rgba(210, 190, 150, 0.6)'};
  background: ${props => props.$active ? '#a67c52' : 'rgba(255, 254, 245, 0.7)'};
  color: ${props => props.$active ? '#fff' : '#59483b'};
  border-radius: 14px;
  padding: 3px 10px;
  font-family: 'Courier New', monospace;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.$active ? '#8c6a46' : 'rgba(166, 124, 82, 0.12)'};
    border-color: #a67c52;
  }
`;

const ClearFiltersButton = styled.button`
  margin-left: auto;
  border: 1px solid #e76f51;
  background: transparent;
  color: #e76f51;
  border-radius: 12px;
  padding: 3px 10px;
  font-family: 'Courier New', monospace;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #e76f51;
    color: #fff;
  }
`;

const DeckStage = styled.div`
  position: relative;
  flex: 1;
  min-height: 170px;
  overflow: visible;
  display: flex;
  align-items: center;
  justify-content: center;
  padding-bottom: 12px;
`;

const DeckCard = styled.div`
  --x: ${props => props.$x}px;
  --y: ${props => props.$y}px;
  --rotate: ${props => props.$rotate}deg;
  position: absolute;
  left: 50%;
  top: 24px;
  width: 190px;
  height: 110px;
  border-radius: 8px;
  background: #fffef5;
  border: 1px solid rgba(210, 190, 150, 0.6);
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.12);
  padding: 10px 12px;
  cursor: grab;
  display: flex;
  flex-direction: column;
  gap: 6px;
  justify-content: center;
  align-items: center;
  transform: translate3d(calc(-50% + var(--x)), var(--y), 0) rotate(var(--rotate));
  transition: transform 0.2s ease, box-shadow 0.2s ease, z-index 0.2s ease;
  z-index: ${props => props.$zIndex};
  user-select: none;

  &:hover {
    z-index: 60;
    transform: translate3d(calc(-50% + var(--x)), calc(var(--y) - 14px), 0) rotate(var(--rotate)) scale(1.04);
    box-shadow: 0 10px 18px rgba(0, 0, 0, 0.2);
  }

  &:active {
    cursor: grabbing;
  }
`;

const DeckTitle = styled.div`
  font-family: 'Courier New', monospace;
  font-size: 14px;
  font-weight: 700;
  color: #59483b;
  text-align: center;
`;

const DeckMeta = styled.div`
  font-family: 'Courier New', monospace;
  font-size: 11px;
  color: rgba(90, 63, 36, 0.7);
  text-align: center;
`;

const DeckTags = styled.div`
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  justify-content: center;
`;

const DeckTag = styled.span`
  font-family: 'Courier New', monospace;
  font-size: 9px;
  color: #8a7248;
  background: rgba(210, 190, 150, 0.25);
  padding: 2px 6px;
  border-radius: 10px;
`;

const EmptyMessage = styled.div`
  font-family: 'Courier New', monospace;
  font-size: 14px;
  color: #8a7248;
  font-style: italic;
  padding: 20px;
  text-align: center;
`;

const categoryColors = {
  breads: '#b89c6b',
  salads: '#9cb89c',
  soups: '#c4a37a',
  sweets: '#c8a8b8',
  savory: '#8fa5b8'
};

const dietaryOptions = ['vegetarian', 'vegan', 'gluten-free', 'dairy-free'];

const formatDietaryTag = (tag) =>
  tag.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');

const parseMinutes = (timeValue) => {
  if (!timeValue) return null;
  const text = String(timeValue).toLowerCase();
  const hrMatch = text.match(/(\d+)\s*hr/);
  const minMatch = text.match(/(\d+)\s*min/);
  let minutes = 0;

  if (hrMatch) {
    minutes += parseInt(hrMatch[1], 10) * 60;
  }
  if (minMatch) {
    minutes += parseInt(minMatch[1], 10);
  }
  if (!hrMatch && !minMatch) {
    const numeric = parseInt(text, 10);
    if (!Number.isNaN(numeric)) {
      minutes = numeric;
    }
  }

  return minutes > 0 ? minutes : null;
};

const RecipePortfolio = () => {
  const [expanded, setExpanded] = useState(false);
  const [activeCategory, setActiveCategory] = useState(recipeTrayCategories[0]?.key || 'sides');
  const [draggingId, setDraggingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [timeFilter, setTimeFilter] = useState('all');
  const [dietaryFilters, setDietaryFilters] = useState([]);

  const recipesByCategory = useMemo(() => {
    const buckets = {};
    recipeTrayCategories.forEach(category => {
      buckets[category.key] = [];
    });

    recipeTrayData.forEach(recipe => {
      const key = (recipe.category || '').toLowerCase();
      if (buckets[key]) {
        buckets[key].push(recipe);
      }
    });

    return buckets;
  }, []);

  const handleDragStart = useCallback((event, recipe) => {
    const payload = JSON.stringify(recipe);
    event.dataTransfer.effectAllowed = 'copy';
    event.dataTransfer.setData('application/json', payload);
    event.dataTransfer.setData('text/plain', payload);
    setDraggingId(recipe.id);

    if (typeof document === 'undefined') return;
    const ghostElement = document.createElement('div');
    ghostElement.style.width = '220px';
    ghostElement.style.height = '120px';
    ghostElement.style.background = '#f5f0dc';
    ghostElement.style.border = '1px solid #d2be96';
    ghostElement.style.borderRadius = '6px';
    ghostElement.style.padding = '12px';
    ghostElement.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
    ghostElement.style.transform = 'rotate(-2deg)';
    ghostElement.innerHTML = `
      <div style="font-family: 'Courier New', monospace; font-size: 14px; color: #59483b; font-weight: bold;">${recipe.title}</div>
      <div style="font-family: 'Courier New', monospace; font-size: 11px; color: #8a7248; margin-top: 4px;">${recipe.category} - ${recipe.time}</div>
    `;

    document.body.appendChild(ghostElement);
    event.dataTransfer.setDragImage(ghostElement, 110, 60);
    setTimeout(() => {
      if (ghostElement.parentNode) {
        ghostElement.parentNode.removeChild(ghostElement);
      }
    }, 0);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggingId(null);
  }, []);

  const toggleDietaryFilter = useCallback((filter) => {
    setDietaryFilters(prev =>
      prev.includes(filter)
        ? prev.filter(entry => entry !== filter)
        : [...prev, filter]
    );
  }, []);

  const clearAllFilters = useCallback(() => {
    setSearchQuery('');
    setTimeFilter('all');
    setDietaryFilters([]);
  }, []);

  const deckRecipes = useMemo(() => {
    const base = recipesByCategory[activeCategory] || [];
    const query = searchQuery.trim().toLowerCase();

    return base.filter(recipe => {
      if (query) {
        const haystack = [
          recipe.title,
          recipe.text,
          recipe.time,
          recipe.category,
          Array.isArray(recipe.dietary) ? recipe.dietary.join(' ') : ''
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(query)) {
          return false;
        }
      }

      if (timeFilter !== 'all') {
        const minutes = parseMinutes(recipe.time);
        if (minutes === null) {
          return false;
        }
        if (timeFilter === 'quick' && minutes >= 30) return false;
        if (timeFilter === 'medium' && (minutes < 30 || minutes > 60)) return false;
        if (timeFilter === 'long' && minutes <= 60) return false;
      }

      if (dietaryFilters.length > 0) {
        const tags = Array.isArray(recipe.dietary) ? recipe.dietary : [];
        const matchesDietary = dietaryFilters.every(filter => tags.includes(filter));
        if (!matchesDietary) return false;
      }

      return true;
    });
  }, [activeCategory, recipesByCategory, searchQuery, timeFilter, dietaryFilters]);

  const hasActiveFilters = searchQuery.trim() || timeFilter !== 'all' || dietaryFilters.length > 0;

  const deckPositions = useMemo(() => {
    const count = deckRecipes.length;
    if (count === 0) return [];

    const mid = (count - 1) / 2;
    const maxSpread = 280;
    const step = count > 1 ? Math.min(70, maxSpread / (count - 1)) : 0;
    const angleStep = count > 1 ? Math.min(8, 30 / (count - 1)) : 0;

    return deckRecipes.map((recipe, index) => {
      const offset = index - mid;
      const x = offset * step;
      const y = Math.abs(offset) * 8;
      const rotate = offset * angleStep;
      const zIndex = Math.round(40 - Math.abs(offset) * 2);
      return { recipe, x, y, rotate, zIndex };
    });
  }, [deckRecipes]);

  return (
    <PortfolioContainer $expanded={expanded}>
      <PortfolioHeader onClick={() => setExpanded(prev => !prev)}>
        <HandleContainer className="handle-container">
          <Handle className="handle" />
        </HandleContainer>
      </PortfolioHeader>

      <CategoryTabs>
        {recipeTrayCategories.map(category => (
          <CategoryTab
            key={category.key}
            type="button"
            $active={activeCategory === category.key}
            $color={categoryColors[category.key] || '#9e9e9e'}
            onClick={() => {
              setActiveCategory(category.key);
              setExpanded(true);
            }}
          >
            {category.label}
          </CategoryTab>
        ))}
      </CategoryTabs>

      <RecipeCardsContainer $expanded={expanded}>
        <SearchFilterBar>
          <SearchInput
            type="text"
            placeholder="Filter recipes..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
          {searchQuery.trim() ? (
            <ClearButton type="button" onClick={() => setSearchQuery('')}>
              Clear
            </ClearButton>
          ) : null}
          <ResultCount>
            {deckRecipes.length} result{deckRecipes.length === 1 ? '' : 's'}
          </ResultCount>
        </SearchFilterBar>
        <FilterRow>
          <FilterGroup>
            <FilterLabel>Time</FilterLabel>
            <FilterChip type="button" $active={timeFilter === 'all'} onClick={() => setTimeFilter('all')}>
              All
            </FilterChip>
            <FilterChip type="button" $active={timeFilter === 'quick'} onClick={() => setTimeFilter('quick')}>
              &lt;30 min
            </FilterChip>
            <FilterChip type="button" $active={timeFilter === 'medium'} onClick={() => setTimeFilter('medium')}>
              30-60 min
            </FilterChip>
            <FilterChip type="button" $active={timeFilter === 'long'} onClick={() => setTimeFilter('long')}>
              1 hr+
            </FilterChip>
          </FilterGroup>
          <FilterGroup>
            <FilterLabel>Dietary</FilterLabel>
            {dietaryOptions.map(option => (
              <FilterChip
                key={option}
                type="button"
                $active={dietaryFilters.includes(option)}
                onClick={() => toggleDietaryFilter(option)}
              >
                {formatDietaryTag(option)}
              </FilterChip>
            ))}
          </FilterGroup>
          {hasActiveFilters ? (
            <ClearFiltersButton type="button" onClick={clearAllFilters}>
              Clear Filters
            </ClearFiltersButton>
          ) : null}
        </FilterRow>
        <DeckStage>
          {deckPositions.length > 0 ? (
            deckPositions.map(({ recipe, x, y, rotate, zIndex }) => (
              <DeckCard
                key={recipe.id}
                draggable
                $x={x}
                $y={y}
                $rotate={rotate}
                $zIndex={draggingId === recipe.id ? 70 : zIndex}
                onDragStart={(event) => handleDragStart(event, recipe)}
                onDragEnd={handleDragEnd}
              >
                <DeckTitle>{recipe.title}</DeckTitle>
                <DeckMeta>{recipe.time}</DeckMeta>
                {Array.isArray(recipe.dietary) && recipe.dietary.length > 0 ? (
                  <DeckTags>
                    {recipe.dietary.slice(0, 2).map(tag => (
                      <DeckTag key={`${recipe.id}-${tag}`}>{formatDietaryTag(tag)}</DeckTag>
                    ))}
                  </DeckTags>
                ) : null}
              </DeckCard>
            ))
          ) : (
            <EmptyMessage>
              {hasActiveFilters ? 'No recipes match your filters.' : 'No recipes in this category.'}
            </EmptyMessage>
          )}
        </DeckStage>
      </RecipeCardsContainer>
    </PortfolioContainer>
  );
};

export default RecipePortfolio;
