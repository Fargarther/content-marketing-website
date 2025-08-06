import React from 'react';

const NavBar = () => {
  return (
    <nav className="navbar" aria-label="Main Navigation">
      <ul>
        <li><a href="#home">Home</a></li>
        <li><a href="#blog">Blog</a></li>
        <li><a href="#about">About</a></li>
        <li><a href="#contact">Contact</a></li>
      </ul>
    </nav>
  );
};

export default NavBar;
