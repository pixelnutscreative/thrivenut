import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { X } from 'lucide-react';

export default function AnnouncementBar() {
  const [dismissed, setDismissed] = useState([]);

  const { data: bars = [] } = useQuery({
    queryKey: ['announcementBars'],
    queryFn: async () => {
      const all = await base44.entities.AnnouncementBar.list('-display_order');
      return all;
    },
    refetchInterval: 30000, // Check every 30 seconds
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

  const activeBar = bars.find(bar => isInSchedule(bar) && !dismissed.includes(bar.id));

  const handleDismiss = () => {
    if (activeBar) {
      setDismissed([...dismissed, activeBar.id]);
    }
  };

  useEffect(() => {
    if (activeBar?.google_font) {
      const link = document.createElement('link');
      link.href = `https://fonts.googleapis.com/css2?family=${activeBar.google_font.replace(/ /g, '+')}:wght@400;600;700&display=swap`;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
  }, [activeBar]);

  if (!activeBar) return null;

  const backgroundStyle = activeBar.background_type === 'gradient'
    ? { background: `linear-gradient(to right, ${activeBar.gradient_color_start}, ${activeBar.gradient_color_end})` }
    : { backgroundColor: activeBar.background_color };

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[200] overflow-hidden"
      style={{
        ...backgroundStyle,
        fontFamily: activeBar.google_font || 'inherit',
      }}
    >
      <div className="relative py-3 px-4">
        <div className="marquee-container">
          <a
            href={activeBar.link}
            target="_blank"
            rel="noopener noreferrer"
            className="marquee-content whitespace-nowrap inline-block hover:opacity-80 transition-opacity"
            style={{ color: activeBar.text_color }}
          >
            <span className="text-lg font-semibold">{activeBar.message}</span>
          </a>
        </div>
        <button
          onClick={handleDismiss}
          className="absolute top-1/2 right-4 transform -translate-y-1/2 hover:opacity-70 transition-opacity"
          style={{ color: activeBar.text_color }}
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <style jsx>{`
        .marquee-container {
          overflow: hidden;
          display: flex;
        }
        .marquee-content {
          animation: marquee 20s linear infinite;
        }
        @keyframes marquee {
          0% {
            transform: translateX(100%);
          }
          100% {
            transform: translateX(-100%);
          }
        }
      `}</style>
    </div>
  );
}