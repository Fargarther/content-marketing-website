import React, { useEffect, useRef, useState } from 'react';
import cloud1 from '../assets/cloud_wc_1.png';
import cloud2 from '../assets/cloud_wc_2.png';
import cloud3 from '../assets/cloud_wc_3.png';
import cloud4 from '../assets/cloud_wc_4.png';
import cloud5 from '../assets/cloud_wc_5.png';

export default function Sky({ scrollVelocityRef, trackRef }) {
    const [offset, setOffset] = useState(0);
    const requestRef = useRef();

    // Madalyn Design Spec:
    // Layer A: High/Slow (0.05-0.08)
    // Layer B: Mid/Medium (0.11-0.14)
    // Layer C: Low/Fast (0.18-0.22) for 5-panel wide layout

    const clouds = [
        // --- Layer A: High Haze (0-15%) ---
        // Very slow, very blurry, sets the atmosphere
        { id: 'haze1', src: cloud2, layer: 'A', top: '2%', left: '2%', speed: 0.05, opacity: 0.30, blur: '12px', width: '900px' },
        { id: 'haze2', src: cloud1, layer: 'A', top: '8%', left: '55%', speed: 0.07, opacity: 0.25, blur: '15px', width: '1000px' },

        // --- Layer B: Mid Clouds (20-40%) ---
        // The main volume of the sky. Feathered edges.
        { id: 'mid1', src: cloud3, layer: 'B', top: '15%', left: '15%', speed: 0.11, opacity: 0.75, blur: '0.5px', width: '600px' },
        { id: 'mid2', src: cloud4, layer: 'B', top: '25%', left: '75%', speed: 0.14, opacity: 0.70, blur: '0.5px', width: '550px' },
        { id: 'mid3', src: cloud5, layer: 'B', top: '35%', left: '40%', speed: 0.13, opacity: 0.72, blur: '0.5px', width: '650px' },

        // --- Layer C: Low Wisps (45-65%) ---
        // Closer to the horizon/viewer. Faster parallax.
        { id: 'low1', src: cloud1, layer: 'C', top: '55%', left: '10%', speed: 0.18, opacity: 0.90, blur: '0.5px', width: '400px' },
        { id: 'low2', src: cloud2, layer: 'C', top: '65%', left: '85%', speed: 0.21, opacity: 0.88, blur: '0.5px', width: '450px' },
        { id: 'low3', src: cloud3, layer: 'C', top: '60%', left: '55%', speed: 0.22, opacity: 0.92, blur: '0.5px', width: '350px' },
    ];

    const animate = () => {
        if (trackRef.current) {
            setOffset(trackRef.current.scrollLeft);
        }
        requestRef.current = requestAnimationFrame(animate);
    };

    useEffect(() => {
        requestRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(requestRef.current);
    }, []);

    return (
        <div className="sky-container" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            pointerEvents: 'none',
            zIndex: 0,
            overflow: 'hidden',
        }}>
            {clouds.map((cloud) => {
                // Calculate parallax position
                // Parallax rule: moves opposite to scroll
                const translateX = -(offset * cloud.speed);

                return (
                    <img
                        key={cloud.id}
                        src={cloud.src}
                        alt=""
                        style={{
                            position: 'absolute',
                            top: cloud.top,
                            left: cloud.left,
                            width: cloud.width,
                            opacity: cloud.opacity,
                            filter: `blur(${cloud.blur})`,
                            transform: `translate3d(${translateX}px, 0, 0)`,
                            willChange: 'transform',
                        }}
                    />
                );
            })}
        </div>
    );
}
