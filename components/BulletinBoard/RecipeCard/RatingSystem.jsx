// src/components/Home/Spotlight/RecipeCard/RatingSystem.jsx
'use client';
import React from 'react';
import styled from 'styled-components';

const RatingContainer = styled.div`
  display: flex;
  align-items: center;
  margin-top: 10px;
  gap: 3px;

  @media (max-width: 640px) {
    margin-top: 8px;
  }
`;

const Star = styled.span`
  color: ${props => props.$filled ? '#b38c42' : '#d1c6a8'};
  cursor: pointer;
  font-size: 16px;
  transition: color 0.2s;
  
  &:hover {
    color: ${props => !props.$filled ? '#c9a051' : '#b38c42'};
  }

  @media (max-width: 640px) {
    font-size: 14px;
  }
`;

const RatingText = styled.span`
  font-family: var(--font-mono);
  font-size: 12px;
  color: #8a7248;
  margin-left: 8px;
  font-style: italic;

  @media (max-width: 640px) {
    font-size: 10px;
  }
`;

const RatingSystem = ({ rating, onRate }) => {
  return (
    <RatingContainer>
      {[1, 2, 3, 4, 5].map(value => (
        <Star
          key={value}
          className="star"
          $filled={value <= rating}
          onClick={() => onRate(value)}
        >
          ★
        </Star>
      ))}
      <RatingText>
        {rating > 0 ? `${rating}/5` : 'Rate this'}
      </RatingText>
    </RatingContainer>
  );
};

export default RatingSystem;
