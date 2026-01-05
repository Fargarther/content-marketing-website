import React from 'react';
import BulletinBoardSection, { RecipeTray } from '../../components/BulletinBoard';
import './BulletinBoard.css';

export default function BulletinBoardPage({ onNavigate }) {
  const handleBack = () => {
    if (onNavigate) {
      onNavigate('/');
      return;
    }
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  return (
    <div className="bulletin-board-page">
      <header className="bulletin-board-header">
        <button
          type="button"
          className="bulletin-board-back"
          onClick={handleBack}
        >
          Back to Home
        </button>
        <div>
          <p className="bulletin-board-eyebrow">Recipe Lab</p>
          <h1 className="bulletin-board-title">Bulletin Board</h1>
        </div>
      </header>
      <main className="bulletin-board-content">
        <BulletinBoardSection />
      </main>
      <RecipeTray />
    </div>
  );
}
