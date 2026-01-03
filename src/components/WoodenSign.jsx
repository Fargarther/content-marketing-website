import React, { useEffect, useRef, useState } from 'react';
import woodenSignImg from '../assets/wooden_sign.png';
import './WoodenSign.css';

export default function WoodenSign({ onClick, trackRef }) {
    const containerRef = useRef(null);
    const [groundHeight, setGroundHeight] = useState(null);

    // Sync ground height for vertical positioning
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const ground = document.querySelector('.ground-nav');
        if (!ground) return;

        const update = () => {
            const nextHeight = Math.round(ground.getBoundingClientRect().height);
            if (nextHeight > 0) setGroundHeight(nextHeight);
        };

        update();
        window.addEventListener('resize', update);
        return () => window.removeEventListener('resize', update);
    }, []);

    // Sync horizontal scroll position
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const track = trackRef?.current;
        if (!track) return;

        const update = () => {
            const scrollLeft = track.scrollLeft || 0;
            if (containerRef.current) {
                containerRef.current.style.setProperty('--sign-scroll-offset', `${-scrollLeft}px`);
            }
        };

        update();
        track.addEventListener('scroll', update, { passive: true });
        window.addEventListener('resize', update);
        return () => {
            track.removeEventListener('scroll', update);
            window.removeEventListener('resize', update);
        };
    }, [trackRef]);

    const style = {};
    if (Number.isFinite(groundHeight)) {
        style['--sign-ground-height'] = `${groundHeight}px`;
    }

    return (
        <div
            className="wooden-sign-container"
            ref={containerRef}
            style={style}
            onClick={onClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    onClick();
                }
            }}
            aria-label="Open Recipes Bulletin Board"
        >
            <img src={woodenSignImg} alt="Recipes Sign" className="wooden-sign-image" />
        </div>
    );
}
