// src/components/Home/Spotlight/RecipeCard/CardFront.jsx
'use client';
import React from 'react';
import styled from 'styled-components';
import RatingSystem from './RatingSystem';

const CardTitle = styled.h3`
  font-family: var(--font-display);
  font-size: ${props => props.$expanded ? '21px' : '18px'};
  margin: 0 0 10px;
  color: #59483b;
  font-weight: bold;
  letter-spacing: 0.02em;
  transform: ${props => props.$expanded ? 'none' : 'rotate(-0.5deg)'};
`;

const CardMeta = styled.div`
  font-family: var(--font-mono);
  font-size: ${props => props.$expanded ? '14px' : '13px'};
  margin-bottom: 13px;
  color: #8a7248;
  font-style: italic;
`;

const CardContent = styled.div`
  font-family: var(--font-body);
  font-size: ${props => props.$expanded ? '16px' : '14px'};
  color: #5d4e3f;
  flex: 1;
  line-height: 1.4;
  overflow: hidden;
  transform: ${props => props.$expanded ? 'none' : 'rotate(-0.5deg)'};
  
  /* Multi-line ellipsis for collapsed view */
  ${props => !props.$expanded && `
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
  `}
`;

const CardFront = ({ title, category, time, text, rating, onRatingChange, expanded = false }) => {
  return (
    <>
      <CardTitle $expanded={expanded}>{title}</CardTitle>
      <CardMeta $expanded={expanded}>{category} • {time}</CardMeta>
      <CardContent $expanded={expanded}>{text}</CardContent>
      <RatingSystem rating={rating} onRate={onRatingChange} />
    </>
  );
};

const areEqual = (prevProps, nextProps) => {
  if (prevProps.title !== nextProps.title) return false;
  if (prevProps.category !== nextProps.category) return false;
  if (prevProps.time !== nextProps.time) return false;
  if (prevProps.text !== nextProps.text) return false;
  if (prevProps.rating !== nextProps.rating) return false;
  if (prevProps.expanded !== nextProps.expanded) return false;
  return true;
};

export default React.memo(CardFront, areEqual);
