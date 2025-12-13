import { useEffect } from 'react';

export default function AnnouncementBarPositioner() {
  useEffect(() => {
    const adjustPositions = () => {
      const isMobile = window.innerWidth < 1024;
      const announcementBar = document.querySelector('[data-announcement-bar]');
      const quickActions = document.querySelector('#quick-actions-bar');
      const mainContent = document.querySelectorAll('.ml-72, .lg\\:hidden');
      
      let topOffset = isMobile ? 56 : 0;
      
      // Position quick actions below announcement bar if it exists
      if (announcementBar) {
        const barHeight = announcementBar.offsetHeight;
        topOffset += barHeight;
        
        if (quickActions) {
          quickActions.style.top = `${topOffset}px`;
          topOffset += quickActions.offsetHeight;
        }
      } else if (quickActions) {
        quickActions.style.top = isMobile ? '56px' : '0px';
        topOffset += quickActions.offsetHeight;
      }
      
      // Adjust main content padding
      mainContent.forEach(el => {
        if (el.classList.contains('ml-72')) {
          // Desktop
          el.style.paddingTop = announcementBar || quickActions ? `${topOffset}px` : '0px';
        } else {
          // Mobile
          el.style.paddingTop = `${topOffset}px`;
        }
      });
    };

    adjustPositions();
    window.addEventListener('resize', adjustPositions);
    
    const interval = setInterval(adjustPositions, 500);

    return () => {
      window.removeEventListener('resize', adjustPositions);
      clearInterval(interval);
    };
  }, []);

  return null;
}