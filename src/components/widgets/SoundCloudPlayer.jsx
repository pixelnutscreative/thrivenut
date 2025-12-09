import React, { useState } from 'react';
import { Music, ChevronDown, ChevronUp, X, Minus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SoundCloudPlayer({ playlistUrl, isMenuDark, collapsed = false, onToggle }) {
  const [isExpanded, setIsExpanded] = useState(!collapsed);

  if (!playlistUrl) return null;

  // Extract the playlist/track URL and create embed URL
  const getEmbedUrl = (url) => {
    // Handle various SoundCloud URL formats
    const encodedUrl = encodeURIComponent(url);
    return `https://w.soundcloud.com/player/?url=${encodedUrl}&color=%23bd84f5&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false&visual=false`;
  };

  const embedUrl = getEmbedUrl(playlistUrl);

  return (
    <div className={`rounded-lg overflow-hidden ${isMenuDark ? 'bg-gray-800/50' : 'bg-gray-100'}`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full flex items-center justify-between p-2 ${isMenuDark ? 'hover:bg-white/10' : 'hover:bg-gray-200'} transition-colors`}
      >
        <div className="flex items-center gap-2">
          <Music className={`w-4 h-4 ${isMenuDark ? 'text-purple-400' : 'text-purple-600'}`} />
          <span className={`text-sm font-medium ${isMenuDark ? 'text-gray-200' : 'text-gray-700'}`}>
            Music Player
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className={`w-4 h-4 ${isMenuDark ? 'text-gray-400' : 'text-gray-500'}`} />
        ) : (
          <ChevronDown className={`w-4 h-4 ${isMenuDark ? 'text-gray-400' : 'text-gray-500'}`} />
        )}
      </button>
      
      {/* We use standard conditional rendering here as this is in the menu and usually doesn't need background persistence when closed */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <iframe
              width="100%"
              height="166"
              scrolling="no"
              frameBorder="no"
              allow="autoplay"
              src={embedUrl}
              className="border-0"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Floating version of the player - PERSISTENT IFRAME
export function FloatingSoundCloudPlayer({ playlistUrl, primaryColor, accentColor }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!playlistUrl) return null;

  const getEmbedUrl = (url) => {
    const encodedUrl = encodeURIComponent(url);
    return `https://w.soundcloud.com/player/?url=${encodedUrl}&color=%23bd84f5&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false&visual=false`;
  };

  return (
    <>
      {/* Floating Music Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 left-6 z-50 w-12 h-12 rounded-full shadow-lg flex items-center justify-center text-white"
        style={{ background: `linear-gradient(135deg, ${primaryColor || '#1fd2ea'}, ${accentColor || '#bd84f5'})` }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <Music className="w-5 h-5" />
      </motion.button>

      {/* Player Panel - Kept in DOM to maintain playback */}
      <div
        className={`fixed bottom-20 left-6 z-50 bg-white rounded-2xl shadow-2xl overflow-hidden w-80 transition-all duration-300 origin-bottom-left ${
          isOpen 
            ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto' 
            : 'opacity-0 translate-y-10 scale-90 pointer-events-none'
        }`}
      >
        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white">
          <div className="flex items-center gap-2">
            <Music className="w-5 h-5" />
            <span className="font-semibold">Music Player</span>
          </div>
          <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/20 rounded">
            <Minus className="w-4 h-4" />
          </button>
        </div>
        <iframe
          width="100%"
          height="300"
          scrolling="no"
          frameBorder="no"
          allow="autoplay"
          src={getEmbedUrl(playlistUrl)}
          className="border-0"
        />
      </div>
    </>
  );
}

// Mobile popup that slides up from bottom - PERSISTENT IFRAME
export function MobileSoundCloudPopup({ playlistUrl, primaryColor, accentColor }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!playlistUrl) return null;

  const getEmbedUrl = (url) => {
    const encodedUrl = encodeURIComponent(url);
    return `https://w.soundcloud.com/player/?url=${encodedUrl}&color=%23bd84f5&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false&visual=false`;
  };

  return (
    <>
      {/* Trigger Button - Bottom Right */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed bottom-4 right-4 w-14 h-14 rounded-full shadow-lg flex items-center justify-center z-40"
        style={{ background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})` }}
      >
        <Music className="w-6 h-6 text-white" />
      </button>

      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 bg-black/50 z-[60]"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>
      
      {/* Player Popup - Kept in DOM */}
      <div
        className={`lg:hidden fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl z-[70] max-h-[50vh] transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-y-0' : 'translate-y-[110%]'
        }`}
      >
        {/* Handle Bar */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Music className="w-5 h-5" style={{ color: primaryColor }} />
            <h3 className="font-semibold text-gray-800">Now Playing</h3>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors flex items-center gap-1 text-sm font-medium text-gray-600"
          >
            <ChevronDown className="w-5 h-5" />
            Minimize
          </button>
        </div>
        
        {/* Player */}
        <div className="p-4">
          <iframe 
            width="100%" 
            height="166" 
            scrolling="no" 
            frameBorder="no" 
            allow="autoplay"
            src={getEmbedUrl(playlistUrl)}
            className="rounded-lg"
          />
        </div>
      </div>
    </>
  );
}