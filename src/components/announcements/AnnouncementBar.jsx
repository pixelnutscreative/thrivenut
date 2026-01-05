import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { X } from 'lucide-react';

export default function AnnouncementBar() {
  // Check if global announcements are enabled in PlatformConfig
  const { data: config } = useQuery({
    queryKey: ['platformConfigAnnouncements'],
    queryFn: async () => {
      try {
        const res = await base44.entities.PlatformConfig.filter({ platform_id: 'global_announcements' });
        return res[0];
      } catch (e) {
        return null;
      }
    }
  });

  // If disabled by admin, return null immediately
  if (config && config.is_enabled === false) return null;

  // Persist dismissed announcements to localStorage
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dismissed_announcements');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  const [user, setUser] = useState(null);

  // Sync dismissed to localStorage
  useEffect(() => {
    localStorage.setItem('dismissed_announcements', JSON.stringify(dismissed));
  }, [dismissed]);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  // Fetch user's active groups to filter group-specific announcements
  const { data: myGroupIds = [] } = useQuery({
    queryKey: ['myGroupIds', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const memberships = await base44.entities.CreatorGroupMember.filter({ user_email: user.email, status: 'active' });
      return memberships.map(m => m.group_id);
    },
    enabled: !!user?.email
  });

  const { data: bars = [] } = useQuery({
    queryKey: ['announcementBars', myGroupIds],
    queryFn: async () => {
      try {
        // 1. Fetch Global Announcement Bars
        const globalBars = await base44.entities.AnnouncementBar.list('-display_order');
        
        // 2. Fetch Group-Specific Notifications that act as bars
        // Since we can't do complex OR queries easily, we'll fetch notifications 
        // that have a group_id in our list.
        // Assuming AnnouncementBar entity is used for GLOBAL system announcements
        // and Notification entity (with group_id) is used for GROUP announcements.
        // Or we can add group_id to AnnouncementBar entity itself?
        // The user prompt said: "notification bar... just like we have in the admin... so when they post that up, it will show up at the top"
        // Let's assume we are re-purposing AnnouncementBar for groups OR fetching Notifications that are meant to be announcements.
        // Let's stick to modifying Notification entity as per plan, but display them HERE.
        
        let groupAnnouncements = [];
        if (myGroupIds.length > 0) {
            // We need to fetch notifications for these groups that are "announcement" type?
            // Or maybe simply ALL active notifications for the group are treated as announcements?
            // User said "admin's can put an announcement and the bar that runs across the top"
            // Let's look for notifications with type="announcement" and group_id IN myGroupIds
            // Current Notification entity has type="system" default.
            
            // Since we can't filter by array includes easily in one call if not supported,
            // we'll fetch by group_id for each group (or list all if volume low).
            // Better: use the new group_id field in Notification.
            
            // For now, let's just fetch ALL active notifications for the user's groups.
            // In a real app with many notifs this might be heavy, but for now it's ok.
            // We'll filter client side for type='announcement' or just display the latest.
            
            const promises = myGroupIds.map(gid => 
                base44.entities.Notification.filter({ group_id: gid, is_active: true })
            );
            const results = await Promise.all(promises);
            groupAnnouncements = results.flat().map(n => ({
                id: n.id,
                message: n.message,
                link: n.link,
                background_color: n.button_color || '#8b5cf6', // Use button color as bg for group announcements
                text_color: '#ffffff',
                is_active: true,
                schedule_type: 'manual',
                display_order: 100, // Higher priority than global?
                type: 'group_announcement',
                group_id: n.group_id
            }));
        }

        return [...globalBars, ...groupAnnouncements];
      } catch (error) {
        console.error('Error fetching announcement bars:', error);
        return [];
      }
    },
    refetchInterval: 30000,
    retry: false,
    enabled: !!user // Only fetch if we know the user
  });

  const isInSchedule = (bar) => {
    if (bar.schedule_type === 'manual') {
      return bar.is_active;
    }
    
    if (bar.schedule_type === 'recurring' && bar.recurring_schedule?.length > 0) {
      const now = new Date();
      const currentDay = now.toLocaleDateString('en-US', { weekday: 'long', timeZone: bar.recurring_schedule[0].timezone || 'America/Los_Angeles' });
      const currentTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: bar.recurring_schedule[0].timezone || 'America/Los_Angeles' });
      
      for (const schedule of bar.recurring_schedule) {
        if (schedule.day === currentDay) {
          const scheduleTime = schedule.time;
          const [scheduleHour, scheduleMinute] = scheduleTime.split(':');
          const [currentHour, currentMinute] = currentTime.split(':');
          
          // Show if within 1 hour of scheduled time
          const scheduledMinutes = parseInt(scheduleHour) * 60 + parseInt(scheduleMinute);
          const currentMinutes = parseInt(currentHour) * 60 + parseInt(currentMinute);
          const diff = currentMinutes - scheduledMinutes;
          
          if (diff >= 0 && diff <= 60) {
            return true;
          }
        }
      }
    }
    
    return false;
  };

  // Find all active bars, then pick the highest priority one
  const activeBars = bars.filter(bar => isInSchedule(bar) && !dismissed.includes(bar.id));
  const activeBar = activeBars.length > 0 ? activeBars[0] : null; // Already sorted by -display_order

  const handleDismiss = () => {
    if (activeBar) {
      setDismissed([...dismissed, activeBar.id]);
    }
  };

  useEffect(() => {
    if (activeBar?.google_font) {
      const link = document.createElement('link');
      link.href = `https://fonts.googleapis.com/css2?family=${activeBar.google_font.replace(/ /g, '+')}:wght@400;700;900&display=swap`;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
  }, [activeBar]);

  if (!activeBar) return null;

  // Use solid or gradient style
  const backgroundStyle = activeBar.background_type === 'gradient'
    ? { background: `linear-gradient(to right, ${activeBar.gradient_color_start || activeBar.background_color}, ${activeBar.gradient_color_end || activeBar.background_color})` }
    : { backgroundColor: activeBar.background_color };

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;
  
  const formattedMessage = activeBar.message.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  return (
    <div
      data-announcement-bar
      className="fixed z-[45] overflow-hidden text-white shadow-md flex items-center"
      style={{
        ...backgroundStyle,
        fontFamily: activeBar.google_font || 'inherit',
        left: isMobile ? 0 : '288px',
        right: 0,
        top: isMobile ? '56px' : '0',
        width: isMobile ? '100%' : 'calc(100% - 288px)',
        height: '48px'
      }}
    >
      <div className="relative w-full h-full flex items-center px-4">
        <div className="marquee-container flex-1">
          <div 
            className="marquee-content whitespace-nowrap font-medium"
            dangerouslySetInnerHTML={{ __html: formattedMessage }}
          />
        </div>
        
        {activeBar.link && (
          <a
            href={activeBar.link}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-4 bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded-full text-xs font-bold transition-colors z-10 whitespace-nowrap"
          >
            View
          </a>
        )}

        <button
          onClick={handleDismiss}
          className="ml-2 text-white/80 hover:text-white transition-colors p-1 z-10"
          aria-label="Dismiss"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <style jsx>{`
        .marquee-container {
          overflow: hidden;
          position: relative;
          height: 100%;
          display: flex;
          align-items: center;
        }
        .marquee-content {
          animation: marquee-global 20s linear infinite;
          padding-left: 100%;
        }
        @keyframes marquee-global {
          0% { transform: translateX(0); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
    </div>
  );
}