import { useEffect } from 'react';

export default function AnnouncementBarPositioner() {
  useEffect(() => {
    const adjustPositions = () => {
      const isMobile = window.innerWidth < 1024;
      const announcementBar = document.querySelector('[data-announcement-bar]');
      const quickActions = document.querySelector('#quick-actions-bar');
      const desktopContent = document.querySelector('.ml-72.flex-1');
      const mobileContent = document.querySelector('.lg\\:hidden');
      
      let topOffset = 0;
      
      // Add announcement bar height if it exists
      if (announcementBar) {
        const barHeight = announcementBar.offsetHeight;
        topOffset += barHeight;
      }
      
      // Position quick actions
      if (quickActions) {
        quickActions.style.top = `${topOffset}px`;
        topOffset += quickActions.offsetHeight;
      }
      
      // Add extra spacing
      topOffset += 16;
      
      // Apply padding to main content
      if (desktopContent) {
        desktopContent.style.paddingTop = `${topOffset}px`;
      }
      if (mobileContent && !desktopContent) {
        mobileContent.style.paddingTop = `${topOffset + 56}px`; // Add mobile menu height
      }
    };

    // Initial adjustment
    adjustPositions();
    
    // Adjust on resize
    window.addEventListener('resize', adjustPositions);
    
    // Check periodically for changes
    const interval = setInterval(adjustPositions, 200);

    return () => {
      window.removeEventListener('resize', adjustPositions);
      clearInterval(interval);
    };
  }, []);

  return null;
}