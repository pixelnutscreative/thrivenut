import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { X, ExternalLink } from 'lucide-react';

export default function GroupAnnouncementBanner({ groupId }) {
  const [activeAnnouncement, setActiveAnnouncement] = useState(null);
  
  const { data: announcements = [] } = useQuery({
    queryKey: ['groupAnnouncementsPublic', groupId],
    queryFn: () => base44.entities.Notification.filter({ 
      group_id: groupId, 
      type: 'announcement',
      is_active: true
    }, '-created_date'),
    refetchInterval: 60000 // Refresh every minute to check schedule
  });

  useEffect(() => {
    // Filter by schedule
    const now = new Date();
    const valid = announcements.filter(ann => {
      if (ann.start_time && new Date(ann.start_time) > now) return false;
      if (ann.end_time && new Date(ann.end_time) < now) return false;
      return true;
    });
    
    // Take the most recent valid one
    setActiveAnnouncement(valid[0] || null);
  }, [announcements]);

  if (!activeAnnouncement) return null;

  const ann = activeAnnouncement;
  const bgStyle = ann.style_type === 'gradient' 
    ? { background: `linear-gradient(to right, ${ann.button_color || '#8b5cf6'}, ${ann.color_end || '#ec4899'})` }
    : { backgroundColor: ann.button_color || '#8b5cf6' };

  // Determine marquee animation class
  let marqueeClass = '';
  if (ann.animation_direction === 'left') marqueeClass = 'animate-marquee-left';
  if (ann.animation_direction === 'right') marqueeClass = 'animate-marquee-right';
  if (ann.animation_direction === 'up') marqueeClass = 'animate-marquee-up';
  if (ann.animation_direction === 'down') marqueeClass = 'animate-marquee-down';

  const isVertical = ann.animation_direction === 'up' || ann.animation_direction === 'down';

  return (
    <div 
      className="w-full mb-6 rounded-lg overflow-hidden shadow-sm relative group"
      style={bgStyle}
    >
      <div className={`relative px-4 py-3 flex items-center ${isVertical ? 'h-12' : ''} overflow-hidden`}>
        
        {/* Marquee Content */}
        <div className={`flex-1 ${marqueeClass ? 'overflow-hidden relative h-full w-full' : ''}`}>
           <div className={`
             ${marqueeClass ? 'absolute whitespace-nowrap' : 'text-center'} 
             font-bold text-white tracking-wide
             ${!marqueeClass && 'w-full'}
           `}>
             <span dangerouslySetInnerHTML={{ __html: ann.message }} />
           </div>
        </div>

        {/* Action Link (if present) */}
        {ann.link && (
          <a 
            href={ann.link} 
            target="_blank" 
            rel="noopener noreferrer"
            className="ml-4 bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded-full text-xs font-bold transition-colors flex items-center gap-1 z-10"
          >
            View <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>

      <style jsx>{`
        @keyframes marquee-left {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        @keyframes marquee-right {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes marquee-up {
          0% { transform: translateY(100%); }
          100% { transform: translateY(-100%); }
        }
        @keyframes marquee-down {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        .animate-marquee-left div {
          animation: marquee-left 15s linear infinite;
        }
        .animate-marquee-right div {
          animation: marquee-right 15s linear infinite;
        }
        .animate-marquee-up div {
          animation: marquee-up 5s linear infinite;
          left: 0; right: 0; text-align: center;
        }
        .animate-marquee-down div {
          animation: marquee-down 5s linear infinite;
          left: 0; right: 0; text-align: center;
        }
      `}</style>
    </div>
  );
}