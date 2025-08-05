import './App.css';
import Hero from './components/Hero';
import About from './components/About';
import Portfolio from './components/Portfolio';
import BlogPreview from './components/BlogPreview';
import Contact from './components/Contact';

// Main application shell with sticky navigation and section components
function App() {
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
        {/* Each component corresponds to a section */}
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
