// src/components/Home/Spotlight/RecipeCard/CardBack.jsx
import React from 'react';
import styled from 'styled-components';

const ImageContainer = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
`;

const RecipeImage = styled.img.attrs({ loading: 'lazy' })`
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 3px;
`;

const ImageOverlay = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.7), transparent);
  padding: 12px;
  color: white;
`;

const ImageTitle = styled.h4`
  font-family: 'Courier New', monospace;
  font-size: 14px;
  margin: 0;
  text-shadow: 0 1px 3px rgba(0,0,0,0.5);
`;

const ImageCaption = styled.p`
  font-family: 'Courier New', monospace;
  font-size: 11px;
  margin: 4px 0 0;
  opacity: 0.9;
  text-shadow: 0 1px 2px rgba(0,0,0,0.5);
`;

const CardBack = ({ title, image, imageAlt, category }) => {
  return (
    <ImageContainer>
      <RecipeImage 
        src={image || '/api/placeholder/300/300'} 
        alt={imageAlt || title}
      />
      <ImageOverlay>
        <ImageTitle>{title}</ImageTitle>
        <ImageCaption>{category} Recipe</ImageCaption>
      </ImageOverlay>
    </ImageContainer>
  );
};

export default CardBack;