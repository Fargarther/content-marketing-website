import { useEffect, useState, useCallback } from 'react';
import GroundNav from '../components/GroundNav';
import './Portfolio.css';

const aboutImages = import.meta.glob('../assets/About ME/*.{jpg,JPG,jpeg,JPEG,png,PNG,webp,WEBP,svg,SVG}', {
  eager: true,
  as: 'url',
});
const aiImages = import.meta.glob('../assets/AI/*.{jpg,JPG,jpeg,JPEG,png,PNG,webp,WEBP,svg,SVG}', {
  eager: true,
  as: 'url',
});
const aiVideos = import.meta.glob('../assets/AI/*.{mp4,MP4}', {
  eager: true,
  as: 'url',
});
const fieldsImages = import.meta.glob('../assets/Fields/*.{jpg,JPG,jpeg,JPEG,png,PNG,webp,WEBP,svg,SVG}', {
  eager: true,
  as: 'url',
});
const fieldsVideos = import.meta.glob('../assets/Fields/*.{mp4,MP4}', {
  eager: true,
  as: 'url',
});

const formatLabel = (path) => {
  const name = path.split('/').pop() || '';
  return name.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ');
};

const buildItems = (entries, type, group) => Object.entries(entries)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([path, src]) => ({
    type,
    group,
    src,
    label: formatLabel(path),
  }));

const collageItems = [
  ...buildItems(aboutImages, 'image', 'about'),
  ...buildItems(aiImages, 'image', 'ai'),
  ...buildItems(aiVideos, 'video', 'ai'),
  ...buildItems(fieldsImages, 'image', 'fields'),
  ...buildItems(fieldsVideos, 'video', 'fields'),
];

const spanPatterns = [
  { col: 3, row: 3 },
  { col: 4, row: 3 },
  { col: 2, row: 2 },
  { col: 3, row: 2 },
  { col: 2, row: 3 },
  { col: 4, row: 4 },
  { col: 3, row: 4 },
  { col: 2, row: 2 },
  { col: 3, row: 3 },
];

const tiltPattern = [-1.2, 0.6, -0.4, 1, -0.8, 0.4, -0.6, 0.8, -1];
const liftPattern = [0, -6, 4, -2, 6, -4, 2, -5, 3];

export default function Portfolio({ onNavigate }) {
  const [activeItem, setActiveItem] = useState(null);
  const [currentNav, setCurrentNav] = useState('/portfolio');
  const [totalWidth, setTotalWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );
  const [viewportHeight, setViewportHeight] = useState(
    typeof window !== 'undefined' ? window.innerHeight : 800
  );
  const groundVisualHeight = 100;

  useEffect(() => {
    if (!activeItem) return;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setActiveItem(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeItem]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const update = () => {
      setTotalWidth(window.innerWidth);
      setViewportHeight(window.innerHeight || viewportHeight);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [viewportHeight]);

  const navigateToHome = useCallback((hash) => {
    if (onNavigate) {
      onNavigate('/');
      requestAnimationFrame(() => {
        if (hash) {
          window.location.hash = hash;
        }
      });
      return;
    }
    if (hash) {
      window.location.href = `/${hash}`;
      return;
    }
    window.location.href = '/';
  }, [onNavigate]);

  const handleNavClick = useCallback((href) => {
    if (!href) return;
    setCurrentNav(href);
    if (href === '/portfolio') return;
    if (href.startsWith('/')) {
      if (onNavigate) {
        onNavigate(href);
        return;
      }
      window.location.href = href;
      return;
    }
    navigateToHome(href);
  }, [navigateToHome, onNavigate]);

  return (
    <div
      className="portfolio-page"
      aria-label="Portfolio page"
      style={{ '--ground-height': `${groundVisualHeight}px` }}
    >
      <header className="portfolio-header">
        <div className="portfolio-header-top">
          <p className="eyebrow">Portfolio</p>
          <button
            type="button"
            className="portfolio-home"
            onClick={() => navigateToHome()}
          >
            Return Home
          </button>
        </div>
        <h1>Collage of work, experiments, and visual studies.</h1>
      </header>

      <div className="portfolio-collage">
        {collageItems.map((item, index) => {
          const span = spanPatterns[index % spanPatterns.length];
          const tilt = tiltPattern[index % tiltPattern.length];
          const lift = liftPattern[index % liftPattern.length];
          return (
            <figure
              key={`${item.group}-${index}`}
              className="collage-item"
              data-group={item.group}
              style={{
                '--col-span': span.col,
                '--row-span': span.row,
                '--tilt': `${tilt}deg`,
                '--lift': `${lift}px`,
              }}
              role="button"
              tabIndex={0}
              aria-label={`Enlarge ${item.label}`}
              onClick={() => setActiveItem(item)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  setActiveItem(item);
                }
              }}
            >
              {item.type === 'video' ? (
                <video
                  className="collage-media"
                  src={item.src}
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  aria-label={item.label}
                />
              ) : (
                <img
                  className="collage-media"
                  src={item.src}
                  alt={item.label}
                  loading="lazy"
                />
              )}
            </figure>
          );
        })}
      </div>

      {activeItem && (
        <div
          className="portfolio-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={`${activeItem.label} preview`}
          onClick={() => setActiveItem(null)}
        >
          <div
            className="portfolio-lightbox-inner"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="portfolio-lightbox-close"
              onClick={() => setActiveItem(null)}
              aria-label="Close preview"
            >
              Close
            </button>
            <div className="portfolio-lightbox-media">
              {activeItem.type === 'video' ? (
                <video
                  src={activeItem.src}
                  controls
                  autoPlay
                  muted
                  playsInline
                />
              ) : (
                <img src={activeItem.src} alt={activeItem.label} />
              )}
            </div>
          </div>
        </div>
      )}

      <GroundNav
        totalWidth={totalWidth}
        groundHeight={groundVisualHeight}
        viewportHeight={viewportHeight}
        currentHash={currentNav}
        onNavClick={handleNavClick}
      />
    </div>
  );
}
