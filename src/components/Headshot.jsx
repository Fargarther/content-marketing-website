import React from 'react';
import './Headshot.css';

const Headshot = ({ src = "https://via.placeholder.com/200x200/f5f5dc/8b7d6b?text=Headshot" }) => {
  return (
    <div className="headshot-container">
      <img
        src={src}
        alt=""
        className="headshot"
        loading="lazy"
        aria-hidden="true"
      />
    </div>
  );
};

export default Headshot;