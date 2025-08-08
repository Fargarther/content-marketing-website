import React from 'react';
import './NavBar.css';

const NavBar = () => {
  return (
    <nav className="navbar" aria-label="Main Navigation">
      <ul className="navbar-list">
        <li><a href="#home" className="navbar-link">Home</a></li>
        <li><a href="#blog" className="navbar-link">Blog</a></li>
        <li><a href="#about" className="navbar-link">About</a></li>
        <li><a href="#contact" className="navbar-link">Contact</a></li>
      </ul>
    </nav>
  );
};

export default NavBar;
