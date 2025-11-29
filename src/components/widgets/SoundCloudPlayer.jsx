import React, { useState } from 'react';
import { Music, ChevronDown, ChevronUp, X } from 'lucide-react';
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

// Floating version of the player
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

      {/* Player Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-20 left-6 z-50 bg-white rounded-2xl shadow-2xl overflow-hidden w-80"
          >
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white">
              <div className="flex items-center gap-2">
                <Music className="w-5 h-5" />
                <span className="font-semibold">Music Player</span>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/20 rounded">
                <X className="w-4 h-4" />
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
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}