import React from 'react';
import windmillSvg from '../assets/windmill.svg';
import './Windmill.css';

const Windmill = () => {
    return (
        <div className="windmill-container" aria-hidden="true">
            <img src={windmillSvg} className="windmill-image" alt="" />
        </div>
    );
};

export default Windmill;
