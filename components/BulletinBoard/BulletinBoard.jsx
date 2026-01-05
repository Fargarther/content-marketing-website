// src/components/Home/Spotlight/BulletinBoard.jsx
'use client';
import React, { forwardRef } from 'react';
import { BulletinBoardContainer, BoardFrame } from './styles/BulletinBoard.styles';

const BulletinBoard = forwardRef(({ children, hasExpandedCard, ...rest }, ref) => {
  return (
    <BulletinBoardContainer ref={ref} $hasExpandedCard={hasExpandedCard} {...rest}>
      <BoardFrame />
      {children}
    </BulletinBoardContainer>
  );
});

BulletinBoard.displayName = 'BulletinBoard';

export default BulletinBoard;
