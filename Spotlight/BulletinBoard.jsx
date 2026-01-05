// src/components/Home/Spotlight/BulletinBoard.jsx
import React, { forwardRef } from 'react';
import { BulletinBoardContainer, BoardFrame } from './styles/BulletinBoard.styles';

const BulletinBoard = forwardRef(({ children, hasExpandedCard }, ref) => {
  return (
    <BulletinBoardContainer ref={ref} $hasExpandedCard={hasExpandedCard}>
      <BoardFrame />
      {children}
    </BulletinBoardContainer>
  );
});

BulletinBoard.displayName = 'BulletinBoard';

export default BulletinBoard;