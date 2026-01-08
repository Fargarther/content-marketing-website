import { useEffect, useState } from 'react';

const getMatches = (breakpoint) => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia(`(max-width: ${breakpoint}px)`).matches;
};

export default function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(() => getMatches(breakpoint));

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const media = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const handleChange = () => setIsMobile(media.matches);

    handleChange();
    if (media.addEventListener) {
      media.addEventListener('change', handleChange);
      return () => media.removeEventListener('change', handleChange);
    }

    media.addListener(handleChange);
    return () => media.removeListener(handleChange);
  }, [breakpoint]);

  return isMobile;
}
