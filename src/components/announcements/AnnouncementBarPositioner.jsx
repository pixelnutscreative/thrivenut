import { useEffect } from 'react';

export default function AnnouncementBarPositioner() {
  useEffect(() => {
    const adjustPositions = () => {
      const isMobile = window.innerWidth < 1024;
      const announcementBar = document.querySelector('[data-announcement-bar]');
      const quickActions = document.querySelector('#quick-actions-bar');
      const desktopContent = document.querySelector('.ml-72.flex-1');
      const mobileContent = document.querySelector('.lg\\:hidden:not(.ml-72)');
      
      let mobileOffset = 56; // Mobile menu height
      let desktopOffset = 0;
      
      // Calculate offsets
      if (announcementBar) {
        const barHeight = announcementBar.offsetHeight;
        mobileOffset += barHeight;
        desktopOffset += barHeight;
      }
      
      // Position quick actions below announcement bar
      if (quickActions) {
        quickActions.style.top = isMobile ? `${mobileOffset}px` : `${desktopOffset}px`;
        const qaHeight = quickActions.offsetHeight;
        mobileOffset += qaHeight;
        desktopOffset += qaHeight;
      }
      
      // Apply padding to main content
      if (desktopContent) {
        desktopContent.style.paddingTop = `${desktopOffset}px`;
      }
      if (mobileContent) {
        mobileContent.style.paddingTop = `${mobileOffset}px`;
      }
    };

    adjustPositions();
    window.addEventListener('resize', adjustPositions);
    
    const interval = setInterval(adjustPositions, 300);

    return () => {
      window.removeEventListener('resize', adjustPositions);
      clearInterval(interval);
    };
  }, []);

  return null;
}