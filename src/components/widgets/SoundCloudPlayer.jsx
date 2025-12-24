import React, { useState } from 'react';
import { Music, ChevronDown, ChevronUp, Minus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Helper to determine service and URL
const getEmbedDetails = (url, service) => {
  if (!url) return null;

  // Auto-detect if service not explicitly consistent or generic
  const isSpotify = url.includes('spotify.com');
  const isSoundCloud = url.includes('soundcloud.com');

  if (isSpotify) {
    // Convert standard Spotify URL to Embed URL
    // e.g. https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M -> https://open.spotify.com/embed/playlist/37i9dQZF1DXcBWIGoYBM5M
    let embedSrc = url;
    if (!url.includes('/embed/')) {
      embedSrc = url.replace('open.spotify.com/', 'open.spotify.com/embed/');
    }
    // Remove parameters usually to be safe, though spotify handles them
    return {
      type: 'spotify',
      src: embedSrc,
      height: 152, // Standard compact spotify height
      allow: "autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
    };
  } else {
    // Default to SoundCloud
    const encodedUrl = encodeURIComponent(url);
    const src = `https://w.soundcloud.com/player/?url=${encodedUrl}&color=%23bd84f5&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false&visual=false`;
    return {
      type: 'soundcloud',
      src,
      height: 166,
      allow: "autoplay"
    };
  }
};

export default function SoundCloudPlayer({ playlistUrl, isMenuDark, collapsed = false }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!playlistUrl) return null;

  const embedDetails = getEmbedDetails(playlistUrl);
  if (!embedDetails) return null;

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
      
      {/* Keep iframe in DOM, just hide it - prevents reload */}
      <div 
        className={`transition-all duration-200 ${isExpanded ? 'h-auto opacity-100' : 'h-0 opacity-0 overflow-hidden'}`}
      >
        <iframe
          width="100%"
          height={embedDetails.height}
          scrolling="no"
          frameBorder="0"
          allow={embedDetails.allow}
          src={embedDetails.src}
          className="border-0"
        />
      </div>
    </div>
  );
}

// Floating version of the player - PERSISTENT IFRAME
export function FloatingSoundCloudPlayer({ playlistUrl, primaryColor, accentColor }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!playlistUrl) return null;
  const embedDetails = getEmbedDetails(playlistUrl);
  if (!embedDetails) return null;

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
        <div className={embedDetails.type === 'spotify' ? 'p-2' : ''}>
          <iframe
            width="100%"
            height={embedDetails.type === 'spotify' ? 380 : 300} // Taller for floating/playlist view
            scrolling="no"
            frameBorder="0"
            allow={embedDetails.allow}
            src={embedDetails.src}
            className="border-0"
          />
        </div>
      </div>
    </>
  );
}

// Mobile popup that slides up from bottom - PERSISTENT IFRAME
export function MobileSoundCloudPopup({ playlistUrl, primaryColor, accentColor, isHidden }) {
  const [isOpen, setIsOpen] = useState(true); // Auto-open on load

  if (!playlistUrl) return null;
  const embedDetails = getEmbedDetails(playlistUrl);
  if (!embedDetails) return null;

  return (
    <>
      {/* Trigger Button - Bottom Right (shifted up to avoid Help button) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`lg:hidden fixed bottom-24 right-4 w-12 h-12 rounded-full shadow-lg flex items-center justify-center z-40 transition-opacity duration-200 ${isHidden ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        style={{ background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})` }}
      >
        <Music className="w-5 h-5 text-white" />
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
            height={embedDetails.height} 
            scrolling="no" 
            frameBorder="0" 
            allow={embedDetails.allow}
            src={embedDetails.src}
            className="rounded-lg"
          />
        </div>
      </div>
    </>
  );
}