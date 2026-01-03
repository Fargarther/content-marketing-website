// src/components/Home/Spotlight/ControlBar.jsx
import React from 'react';
import styled from 'styled-components';

const ControlBarContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 15px;
  margin: 20px 0;
`;

const ActionButton = styled.button`
  background-color: #a67c52;
  color: #fff;
  border: none;
  padding: 8px 15px;
  border-radius: 5px;
  cursor: pointer;
  font-weight: 600;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  
  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
    transition: left 0.5s;
  }
  
  &:hover {
    background-color: #8c6a46;
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(140, 106, 70, 0.3);
    
    &:before {
      left: 100%;
    }
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const ControlBar = ({ onAddCard, onShuffleCards, onClearCards }) => {
  return (
    <ControlBarContainer>
      <ActionButton onClick={onAddCard}>Add Recipe Card</ActionButton>
      <ActionButton onClick={onShuffleCards}>Shuffle Cards</ActionButton>
      <ActionButton onClick={onClearCards}>Clear Board</ActionButton>
    </ControlBarContainer>
  );
};

export default ControlBar;