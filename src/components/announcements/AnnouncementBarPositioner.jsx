import { useEffect } from 'react';

export default function AnnouncementBarPositioner() {
  useEffect(() => {
    const adjustQuickActionsPosition = () => {
      const announcementBar = document.querySelector('[data-announcement-bar]');
      const quickActions = document.querySelector('.announcement-aware');
      
      if (announcementBar && quickActions) {
        const barHeight = announcementBar.offsetHeight;
        quickActions.style.top = `${barHeight}px`;
      } else if (quickActions) {
        const isMobile = window.innerWidth < 1024;
        quickActions.style.top = isMobile ? '56px' : '0';
      }
    };

    // Adjust on mount and when window resizes
    adjustQuickActionsPosition();
    window.addEventListener('resize', adjustQuickActionsPosition);
    
    // Check periodically in case announcement bar appears/disappears
    const interval = setInterval(adjustQuickActionsPosition, 1000);

    return () => {
      window.removeEventListener('resize', adjustQuickActionsPosition);
      clearInterval(interval);
    };
  }, []);

  return null;
}