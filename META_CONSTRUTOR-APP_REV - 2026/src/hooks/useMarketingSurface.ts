import { useEffect } from 'react';

export const useMarketingSurface = () => {
  useEffect(() => {
    document.body.classList.add('marketing-surface');

    return () => {
      document.body.classList.remove('marketing-surface');
    };
  }, []);
};
