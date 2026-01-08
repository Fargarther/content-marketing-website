import React, { useEffect, useRef, useCallback, useState } from 'react';
import GroundNav from '../components/GroundNav';
import PrairieGrass from '../components/PrairieGrass';
import Sky from '../components/Sky';
import Windmill from '../components/Windmill';
import WoodenSign from '../components/WoodenSign';
import BugTrail from '../components/BugTrail';
import ContactTrail from '../components/ContactTrail';
import Barrel from '../components/Barrel';
import Mailbox from '../components/Mailbox';
import Ranch from '../components/Ranch';
import resumeImg from '../Alex_Benson_Resume.png';
import './Home.css';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export default function Home({ onNavigate }) {
  const PANEL_COUNT = 5;
  const trackRef = useRef(null);
  const touchRef = useRef(null);
  const ranchWidthRef = useRef(null);
  const contactPromptRef = useRef(null);
  const aboutPopupRef = useRef(null);
  const [resumeOpen, setResumeOpen] = useState(false);
  const [currentHash, setCurrentHash] = useState(
    typeof window !== 'undefined' ? window.location.hash || '#home' : '#home'
  );
  const [totalWidth, setTotalWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth * PANEL_COUNT : 0
  );
  const [viewportHeight, setViewportHeight] = useState(
    typeof window !== 'undefined' ? window.innerHeight : 800
  );
  const velocityRef = useRef(0);
  const animFrameRef = useRef(null);

  // Shared Mutable Scroll State to avoid layout thrashing
  // Format: { current: 0 } -> we pass this object reference to children
  const scrollStateRef = useRef({ scrollLeft: 0 });

  // Calculate max scroll based on ranch position (site ends at ranch)
  const getMaxScroll = useCallback(() => {
    const track = trackRef.current;
    if (!track) return 0;

    const vw = window.innerWidth;
    const isMobile = vw <= 768;

    // Ranch position and width (matching Ranch.css values)
    const ranchX = isMobile ? 2250 : 4650;
    const ranchWidth = ranchWidthRef.current || (isMobile
      ? Math.min(1000, Math.max(600, vw * 1.5))
      : Math.min(1800, Math.max(1200, vw * 0.9)));

    // Max scroll = ranch end position - viewport width
    const ranchEnd = ranchX + ranchWidth;
    const maxByRanch = ranchEnd - vw;

    // Also respect the natural scroll limit
    const maxByContent = track.scrollWidth - track.clientWidth;

    return Math.min(maxByRanch, maxByContent);
  }, []);

  // Cache ranch width so scroll limit aligns with the actual rendered size
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const updateRanchWidth = () => {
      const ranch = document.querySelector('.ranch-container');
      if (ranch) {
        ranchWidthRef.current = Math.round(ranch.getBoundingClientRect().width);
      }
    };

    updateRanchWidth();
    window.addEventListener('resize', updateRanchWidth);
    return () => window.removeEventListener('resize', updateRanchWidth);
  }, []);

  // Update the shared ref whenever the track scrolls and clamp to max
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const onScroll = () => {
      // Clamp scroll position to ranch end
      const max = getMaxScroll();
      if (track.scrollLeft > max) {
        track.scrollLeft = max;
      }
      // Update the shared value
      scrollStateRef.current.scrollLeft = track.scrollLeft;
    };

    track.addEventListener('scroll', onScroll, { passive: true });
    return () => track.removeEventListener('scroll', onScroll);
  }, [getMaxScroll]);

  // Translate wheel movement into horizontal scroll on the track
  const handleWheel = useCallback((e) => {
    const track = trackRef.current;
    if (!track) return;
    if (track.scrollWidth <= track.clientWidth) return;
    if (e.ctrlKey) return; // let zoom gestures through

    const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
    if (delta === 0) return;
    const max = getMaxScroll();
    // Kick a simple inertial scroll
    velocityRef.current += delta * 0.35;

    const step = () => {
      const t = trackRef.current;
      if (!t) return;
      const currentMax = getMaxScroll();
      let next = t.scrollLeft + velocityRef.current;
      // clamp edges
      if (next < 0) {
        next = 0;
        velocityRef.current = 0;
      } else if (next > currentMax) {
        next = currentMax;
        velocityRef.current = 0;
      }
      t.scrollLeft = next;
      // apply friction
      velocityRef.current *= 0.88;
      if (Math.abs(velocityRef.current) > 0.2) {
        animFrameRef.current = requestAnimationFrame(step);
      } else {
        velocityRef.current = 0;
        animFrameRef.current = null;
      }
    };

    if (!animFrameRef.current) {
      animFrameRef.current = requestAnimationFrame(step);
    }
    e.preventDefault();
  }, [getMaxScroll]);

  // Attach wheel listener with passive: false to allow preventDefault
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    track.addEventListener('wheel', handleWheel, { passive: false });
    return () => track.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  // Touch/pan: convert vertical or horizontal drags into horizontal scroll
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const onTouchStart = (e) => {
      if (track.scrollWidth <= track.clientWidth) return;
      const t = e.touches[0];
      touchRef.current = { x: t.clientX, y: t.clientY };
    };

    const onTouchMove = (e) => {
      if (!touchRef.current || track.scrollWidth <= track.clientWidth) return;
      const t = e.touches[0];
      const dx = t.clientX - touchRef.current.x;
      const dy = t.clientY - touchRef.current.y;
      const primary = Math.abs(dx) >= Math.abs(dy) ? dx : dy;
      let next = track.scrollLeft - primary;

      // Clamp to max scroll (site ends at ranch)
      const max = getMaxScroll();
      if (next < 0) next = 0;
      if (next > max) next = max;

      track.scrollLeft = next;
      touchRef.current = { x: t.clientX, y: t.clientY };
      e.preventDefault();
    };

    const onTouchEnd = () => { touchRef.current = null; };

    track.addEventListener('touchstart', onTouchStart, { passive: false });
    track.addEventListener('touchmove', onTouchMove, { passive: false });
    track.addEventListener('touchend', onTouchEnd);
    track.addEventListener('touchcancel', onTouchEnd);

    return () => {
      track.removeEventListener('touchstart', onTouchStart);
      track.removeEventListener('touchmove', onTouchMove);
      track.removeEventListener('touchend', onTouchEnd);
      track.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [getMaxScroll]);

  // Track total width for synced ground/grass
  useEffect(() => {
    const update = () => {
      setTotalWidth(window.innerWidth * PANEL_COUNT);
      setViewportHeight(window.innerHeight || viewportHeight);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [PANEL_COUNT, viewportHeight]);

  // Scroll reveal for the contact callout in the projects panel
  useEffect(() => {
    const track = trackRef.current;
    const target = contactPromptRef.current;
    if (!track || !target) return;

    let rafId = null;

    const update = () => {
      const scrollLeft = track.scrollLeft || 0;
      const vw = window.innerWidth || 1024;
      const rect = target.getBoundingClientRect();
      const trackRect = track.getBoundingClientRect();
      const targetLeft = rect.left - trackRect.left + scrollLeft;
      const start = targetLeft - vw * 0.7;
      const end = targetLeft - vw * 0.3;
      const progress = clamp(
        (scrollLeft - start) / Math.max(1, end - start),
        0,
        1
      );
      const offset = (1 - progress) * 18;
      target.style.setProperty('--cta-opacity', progress.toFixed(3));
      target.style.setProperty('--cta-offset', `${offset.toFixed(1)}px`);
    };

    const onScroll = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        update();
      });
    };

    update();
    track.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', update);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      track.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', update);
    };
  }, []);

  const scrollToTarget = useCallback((hashValue) => {
    if (typeof window === 'undefined') return;
    const hash = (hashValue || '').replace('#', '') || 'home';
    const track = trackRef.current;
    if (!track) return;

    const centerOnElement = (element) => {
      if (!element) return false;
      const rect = element.getBoundingClientRect();
      const trackRect = track.getBoundingClientRect();
      const scrollLeft = track.scrollLeft || 0;
      const worldCenter = scrollLeft + (rect.left - trackRect.left) + rect.width / 2;
      const targetLeft = worldCenter - (window.innerWidth / 2);
      const max = getMaxScroll();
      const clamped = Math.max(0, Math.min(targetLeft, max));
      track.scrollTo({ left: clamped, behavior: 'smooth' });
      return true;
    };

    if (hash === 'recipes') {
      const sign = document.querySelector('.wooden-sign-container');
      if (centerOnElement(sign)) return;
    }

    if (hash === 'contact') {
      const mailbox = document.querySelector('.mailbox-container');
      if (centerOnElement(mailbox)) return;
    }

    const target = document.getElementById(hash);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [getMaxScroll]);

  const handleNavClick = useCallback((href) => {
    if (typeof window === 'undefined') return;
    if (!href) return;
    const hash = href.startsWith('#') ? href : `#${href}`;
    window.history.replaceState(null, '', hash);
    setCurrentHash(hash);
    scrollToTarget(hash);
  }, [scrollToTarget]);

  // End-of-page about popup
  useEffect(() => {
    const track = trackRef.current;
    const popup = aboutPopupRef.current;
    if (!track || !popup) return;

    let rafId = null;

    const update = () => {
      const scrollLeft = track.scrollLeft || 0;
      const vw = window.innerWidth || 1024;
      const max = getMaxScroll();
      const start = Math.max(0, max - vw * 0.45);
      const end = Math.max(start + 1, max - vw * 0.1);
      const progress = clamp(
        (scrollLeft - start) / (end - start),
        0,
        1
      );
      const offset = (1 - progress) * 26;
      popup.style.setProperty('--about-popup-opacity', progress.toFixed(3));
      popup.style.setProperty('--about-popup-offset', `${offset.toFixed(1)}px`);
    };

    const onScroll = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        update();
      });
    };

    update();
    track.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', update);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      track.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', update);
    };
  }, [getMaxScroll]);

  // Scroll to the hashed section when nav updates
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash || '#home';
      setCurrentHash(hash);
      scrollToTarget(hash);
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [scrollToTarget]);

  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  useEffect(() => {
    if (!resumeOpen) return;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setResumeOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [resumeOpen]);

  const groundVisualHeight = 100;
  const handleSignClick = useCallback(() => {
    if (onNavigate) {
      onNavigate('/bulletin-board');
      return;
    }
    if (typeof window !== 'undefined') {
      window.location.href = '/bulletin-board';
    }
  }, [onNavigate]);

  return (
    <div
      className="horizontal-shell"
      style={{
        '--panel-count': PANEL_COUNT,
        '--ground-nav-height': `${groundVisualHeight}px`,
        '--ground-height': `${groundVisualHeight}px`,
      }}
    >
      <div className="scroll-track" ref={trackRef}>
        <section className="panel hero-panel" id="home">
          <div className="panel-inner">
            <p className="eyebrow">
              <span>Communications Specialist</span>
              <span className="eyebrow-divider" aria-hidden="true" />
              <span>Storyteller</span>
            </p>
            <h1>
              Alex Benson
            </h1>
            <div className="hero-actions">
              <button
                type="button"
                className="resume-button"
                onClick={() => setResumeOpen(true)}
                aria-haspopup="dialog"
                aria-expanded={resumeOpen}
                aria-controls="resume-modal"
              >
                Resume
              </button>
              <button
                type="button"
                className="resume-button portfolio-button"
                onClick={() => handleNavClick('#portfolio')}
              >
                Portfolio
              </button>
            </div>
          </div>
        </section>

        <section className="panel projects-panel" id="recipes">
          <div className="panel-inner compact">
            <div className="section-header">
              <h2 className="contact-cta" ref={contactPromptRef}>
                Click Mailbox To Contact!
              </h2>
            </div>
          </div>
        </section>

        <section className="panel about-panel" id="about">
          <div className="panel-inner">
            <p className="eyebrow">Quiet space to tune the grass.</p>
            <h2>About</h2>
          </div>
        </section>

        <section className="panel contact-panel" id="contact">
          <div className="panel-inner">
            <p className="eyebrow">Contact</p>
            <h2>Reach out when ready.</h2>
            <a className="cta" href="mailto:hello@contentstudio.test">Email</a>
          </div>
        </section>

        <section className="panel portfolio-panel" id="portfolio">
          <div className="panel-inner compact">
            <div className="section-header">
              <p className="eyebrow">Portfolio</p>
              <h2>Selected work and case studies.</h2>
            </div>
          </div>
        </section>

      </div>

      <Windmill trackRef={trackRef} />
      <BugTrail trackRef={trackRef} />
      <ContactTrail trackRef={trackRef} />
      <WoodenSign trackRef={trackRef} onClick={handleSignClick} />
      <Barrel trackRef={trackRef} />
      <Mailbox trackRef={trackRef} />
      <Ranch trackRef={trackRef} />
      <PrairieGrass
        spanCount={PANEL_COUNT}
        scrollVelocityRef={velocityRef}
        trackRef={trackRef}
        scrollStateRef={scrollStateRef}
        onWheel={handleWheel}
      />

      {/* GroundNav moved outside to enforce z-index layering (Sky < Grass < Ground) */}
      <GroundNav
        totalWidth={totalWidth}
        groundHeight={groundVisualHeight}
        viewportHeight={viewportHeight}
        currentHash={currentHash}
        onNavClick={handleNavClick}
      />

      {/* Pass totalWidth to Sky to help it scale speeds if needed, though we hardcoded them */}
      <Sky trackRef={trackRef} scrollStateRef={scrollStateRef} />

      <div className="about-popup" ref={aboutPopupRef}>
        <p className="about-popup-body">
          Greetings! My name is Alex! I am a born and raised Central Illinoian with a passion
          for storytelling. Be it an unpublished piece of literary fiction, or a memorable
          social media post, I love crafting compelling narratives that speak about the human
          condition.
        </p>
        <p className="about-popup-body">
          I have experience managing the food for events with groups totaling 300+ people! No
          matter the size or task, initiation and preperation, or mise en place, is everything;
          I help your organizion by writing shotlists, formalizing statistics and strategy, and
          contributing myself to team efforts.
        </p>
        <p className="about-popup-body">
          During my off hours I play gutiar, enjoy video games, and read. My favorite collection:
          Little House on the Prarrie. Favorte food: Mac and Cheese.
        </p>
      </div>

      {resumeOpen && (
        <div
          className="resume-overlay"
          onClick={() => setResumeOpen(false)}
          role="presentation"
        >
          <div
            className="resume-modal"
            id="resume-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="resume-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="resume-header">
              <h3 id="resume-title">Resume</h3>
              <div className="resume-actions">
                <a
                  className="resume-download"
                  href={resumeImg}
                  download="Alex_Benson_Resume.png"
                >
                  Download
                </a>
                <button
                  type="button"
                  className="resume-close"
                  onClick={() => setResumeOpen(false)}
                  aria-label="Close resume"
                >
                  Close
                </button>
              </div>
            </div>
            <div className="resume-content">
              <img
                src={resumeImg}
                alt="Alex Benson resume"
                className="resume-image"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
