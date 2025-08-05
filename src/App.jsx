import { useEffect } from 'react';
import './App.css';
import Hero from './components/Hero';
import About from './components/About';
import Portfolio from './components/Portfolio';
import BlogPreview from './components/BlogPreview';
import Contact from './components/Contact';

function App() {
  useEffect(() => {
    // Smooth scrolling for anchor links
    const handleSmoothScroll = (e) => {
      const href = e.currentTarget.getAttribute('href');
      if (href && href.startsWith('#')) {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          const navHeight = document.querySelector('.nav').offsetHeight;
          const targetPosition = target.offsetTop - navHeight;
          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });
        }
      }
    };

    const anchors = document.querySelectorAll('a[href^="#"]');
    anchors.forEach(anchor => {
      anchor.addEventListener('click', handleSmoothScroll);
    });

    // Active navigation highlighting and scroll effects
    const handleScroll = () => {
      const sections = document.querySelectorAll('section');
      const navLinks = document.querySelectorAll('.nav a');
      const navbar = document.querySelector('.nav');
      
      let current = '';
      sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (window.scrollY >= (sectionTop - 100)) {
          current = section.getAttribute('id');
        }
      });

      navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href').slice(1) === current) {
          link.classList.add('active');
        }
      });

      // Add scrolled class to navigation
      if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    };

    window.addEventListener('scroll', handleScroll);

    // Cleanup
    return () => {
      anchors.forEach(anchor => {
        anchor.removeEventListener('click', handleSmoothScroll);
      });
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <>
      <nav className="nav">
        <ul>
          <li><a href="#hero">Home</a></li>
          <li><a href="#about">About</a></li>
          <li><a href="#portfolio">Portfolio</a></li>
          <li><a href="#blog">Blog</a></li>
          <li><a href="#contact">Contact</a></li>
        </ul>
      </nav>
      <main>
        <Hero />
        <About />
        <Portfolio />
        <BlogPreview />
        <Contact />
      </main>
    </>
  );
}

export default App;