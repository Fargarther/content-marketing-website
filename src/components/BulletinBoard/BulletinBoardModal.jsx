import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Spotlight from './Index';
import './BulletinBoardModal.css';

export default function BulletinBoardModal({ isOpen, onClose }) {
    const [active, setActive] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setActive(true);
            document.body.style.overflow = 'hidden';
        } else {
            const timer = setTimeout(() => setActive(false), 500); // Wait for exit animation
            document.body.style.overflow = '';
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!active) return null;

    return createPortal(
        <div className={`board-modal-overlay ${isOpen ? 'open' : 'closing'}`} onClick={onClose}>
            <div className="board-modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="board-modal-close" onClick={onClose} aria-label="Close Board">
                    &times;
                </button>
                <div className="board-wrapper">
                    <Spotlight />
                </div>
            </div>
        </div>,
        document.body
    );
}
