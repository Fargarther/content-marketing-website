// src/components/Home/Spotlight/RecipeCard/CardFront.jsx
import React from 'react';
import styled from 'styled-components';
import RatingSystem from './RatingSystem';

const CardTitle = styled.h3`
  font-family: 'Courier New', monospace;
  font-size: ${props => props.$expanded ? '21px' : '18px'};
  margin: 0 0 10px;
  color: #59483b;
  font-weight: bold;
  letter-spacing: -0.5px;
  transform: ${props => props.$expanded ? 'none' : 'rotate(-0.5deg)'};
`;

const CardMeta = styled.div`
  font-family: 'Courier New', monospace;
  font-size: ${props => props.$expanded ? '14px' : '13px'};
  margin-bottom: 13px;
  color: #8a7248;
  font-style: italic;
`;

const CardContent = styled.div`
  font-family: 'Courier New', monospace;
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

export default CardFront;