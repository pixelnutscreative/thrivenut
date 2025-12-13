import { useEffect } from 'react';

export default function AnnouncementBarPositioner() {
  useEffect(() => {
    const adjustPositions = () => {
      const isMobile = window.innerWidth < 1024;
      const announcementBar = document.querySelector('[data-announcement-bar]');
      const quickActionsBar = document.querySelector('#quick-actions-bar');
      
      let cumulativeTop = 0;
      
      // Position announcement bar at the top
      if (announcementBar) {
        cumulativeTop += announcementBar.offsetHeight;
      }
      
      // Position quick actions bar below announcement bar
      if (quickActionsBar) {
        quickActionsBar.style.top = `${cumulativeTop}px`;
        cumulativeTop += quickActionsBar.offsetHeight;
      }
      
      // Add padding to all main content areas
      const allMainContent = document.querySelectorAll('.ml-72.flex-1, .lg\\:hidden');
      allMainContent.forEach((el) => {
        if (el.classList.contains('ml-72')) {
          // Desktop content
          el.style.paddingTop = `${cumulativeTop + 20}px`;
        } else {
          // Mobile content - add mobile header height
          el.style.paddingTop = `${cumulativeTop + 56 + 20}px`;
        }
      });
    };

    // Run immediately
    adjustPositions();
    
    // Run on resize
    window.addEventListener('resize', adjustPositions);
    
    // Run periodically to catch dynamic changes
    const interval = setInterval(adjustPositions, 100);
    
    // Run after a short delay to catch initial render
    setTimeout(adjustPositions, 100);

    return () => {
      window.removeEventListener('resize', adjustPositions);
      clearInterval(interval);
    };
  }, []);

  return null;
}