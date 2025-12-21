import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Palette, Plus, Loader2, Play, Pause, Music, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion, AnimatePresence } from 'framer-motion';
import SoundCloudPlayer from '../widgets/SoundCloudPlayer';

function NutPalCard({ nutpal, onClick }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const images = nutpal.images || [];
  
  // Auto-rotate images if there are multiple
  useEffect(() => {
    if (images.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentImageIndex(prev => (prev + 1) % images.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <div 
      className="flex-shrink-0 w-32 md:w-40 cursor-pointer group"
      onClick={() => onClick(nutpal)}
    >
      <div className="aspect-square rounded-lg md:rounded-xl overflow-hidden bg-gradient-to-br from-teal-100 to-cyan-100 relative">
        {images.length > 0 ? (
          <>
            <img 
              src={images[currentImageIndex]} 
              alt={nutpal.name}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
            />
            {images.length > 1 && (
              <div className="absolute bottom-1.5 md:bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                {images.map((_, idx) => (
                  <div 
                    key={idx}
                    className={`w-1 md:w-1.5 h-1 md:h-1.5 rounded-full transition-colors ${
                      idx === currentImageIndex ? 'bg-white' : 'bg-white/50'
                    }`}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Palette className="w-8 md:w-12 h-8 md:h-12 text-teal-300" />
          </div>
        )}
      </div>
      <p className="mt-1.5 md:mt-2 text-center text-xs md:text-sm font-medium truncate">{nutpal.name}</p>
    </div>
  );
}

export default function NutPalsCarousel({ isDark, primaryColor, accentColor, isAdmin }) {
  const scrollRef = useRef(null);
  const [selectedNutPal, setSelectedNutPal] = useState(null);
  const [viewerImageIndex, setViewerImageIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const { data: nutpals = [], isLoading } = useQuery({
    queryKey: ['nutpalStyles'],
    queryFn: async () => {
      const items = await base44.entities.NutPalStyle.filter({ is_active: true }, 'sort_order');
      return items;
    }
  });

  const { data: defaultConfig } = useQuery({
    queryKey: ['platformConfigDefaultSong'],
    queryFn: async () => {
      const configs = await base44.entities.PlatformConfig.filter({ config_key: 'default_nutpal_song' });
      return configs[0]?.config_value;
    }
  });

  // Fetch approved submissions for the selected NutPal style
  const { data: submissions = [] } = useQuery({
    queryKey: ['nutpalSubmissions', selectedNutPal?.id],
    queryFn: async () => {
      if (!selectedNutPal) return [];
      return await base44.entities.CreatorPortfolio.filter({ 
        style_id: selectedNutPal.id, 
        approval_status: 'approved',
        is_nutpal: true
      }, '-created_date');
    },
    enabled: !!selectedNutPal
  });

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleNutPalClick = (nutpal) => {
    setSelectedNutPal(nutpal);
    setViewerImageIndex(0);
    setIsPlaying(true); // Start slideshow
  };

  const allImages = React.useMemo(() => {
    if (!selectedNutPal) return [];
    // Combine official images with approved user submissions
    const official = (selectedNutPal.images || []).map(url => ({ url, type: 'official', creator: 'Pixel Nuts' }));
    const userSubs = submissions.map(sub => ({ 
      url: sub.image_urls[0], 
      type: 'community', 
      creator: sub.creator_name || 'Community Member',
      title: sub.title 
    }));
    return [...official, ...userSubs];
  }, [selectedNutPal, submissions]);

  // Slideshow Logic
  useEffect(() => {
    let interval;
    if (selectedNutPal && isPlaying && allImages.length > 1) {
      interval = setInterval(() => {
        setViewerImageIndex(prev => (prev + 1) % allImages.length);
      }, 4000); // 4 seconds per slide
    }
    return () => clearInterval(interval);
  }, [selectedNutPal, isPlaying, allImages.length]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-teal-500" />
      </div>
    );
  }

  if (nutpals.length === 0) {
    return (
      <div className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
        <Palette className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>NutPals gallery coming soon!</p>
        {isAdmin && (
          <p className="text-sm mt-2">Add NutPal styles in the Admin panel.</p>
        )}
      </div>
    );
  }

  const currentSongUrl = selectedNutPal?.soundcloud_url || defaultConfig;

  return (
    <>
      <div className="relative px-2 md:px-0">
        {/* Scroll Buttons */}
        <button
          onClick={() => scroll('left')}
          className={`absolute left-0 md:left-2 top-1/2 -translate-y-1/2 z-10 p-1.5 md:p-2 rounded-full shadow-lg ${
            isDark ? 'bg-gray-700 text-white' : 'bg-white text-gray-800'
          } hover:scale-110 transition-transform`}
        >
          <ChevronLeft className="w-4 md:w-5 h-4 md:h-5" />
        </button>
        <button
          onClick={() => scroll('right')}
          className={`absolute right-0 md:right-2 top-1/2 -translate-y-1/2 z-10 p-1.5 md:p-2 rounded-full shadow-lg ${
            isDark ? 'bg-gray-700 text-white' : 'bg-white text-gray-800'
          } hover:scale-110 transition-transform`}
        >
          <ChevronRight className="w-4 md:w-5 h-4 md:h-5" />
        </button>

        {/* Carousel */}
        <div 
          ref={scrollRef}
          className="flex gap-3 md:gap-4 overflow-x-auto py-4 px-8 md:px-12"
          style={{ 
            scrollbarWidth: 'thin', 
            scrollbarColor: `${primaryColor || '#1fd2ea'} transparent`
          }}
        >
          {nutpals.map((nutpal) => (
            <NutPalCard 
              key={nutpal.id} 
              nutpal={nutpal} 
              onClick={handleNutPalClick}
            />
          ))}
        </div>
      </div>

      {/* Lightbox Viewer with Slideshow */}
      <Dialog open={!!selectedNutPal} onOpenChange={() => { setSelectedNutPal(null); setIsPlaying(false); }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0 bg-black/95 text-white border-gray-800">
          {selectedNutPal && (
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-900 to-black z-10">
                <div className="flex items-center gap-3">
                  <DialogTitle className="text-xl font-bold flex items-center gap-2">
                    {selectedNutPal.name}
                    <span className="text-xs font-normal bg-white/20 px-2 py-0.5 rounded-full">
                      {allImages.length} images
                    </span>
                  </DialogTitle>
                </div>
                
                <div className="flex items-center gap-4">
                  {currentSongUrl && (
                    <div className="hidden md:block w-64 h-16 opacity-80 hover:opacity-100 transition-opacity">
                      <iframe
                        width="100%"
                        height="100%"
                        scrolling="no"
                        frameBorder="no"
                        allow="autoplay"
                        src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(currentSongUrl)}&color=%23bd84f5&auto_play=true&hide_related=true&show_comments=false&show_user=false&show_reposts=false&show_teaser=false&visual=false`}
                      ></iframe>
                    </div>
                  )}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="text-white hover:bg-white/20"
                  >
                    {isPlaying ? <Pause className="w-5 h-5 mr-2" /> : <Play className="w-5 h-5 mr-2" />}
                    {isPlaying ? 'Pause' : 'Play'}
                  </Button>
                </div>
              </div>
              
              <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
                <AnimatePresence mode="wait">
                  {allImages.length > 0 ? (
                    <motion.div
                      key={viewerImageIndex}
                      className="relative w-full h-full flex items-center justify-center p-4"
                      initial={{ opacity: 0, x: 50 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -50 }}
                      transition={{ duration: 0.5 }}
                    >
                      <img
                        src={allImages[viewerImageIndex].url}
                        alt=""
                        className="max-w-full max-h-[60vh] md:max-h-[70vh] object-contain rounded-lg shadow-2xl"
                      />
                      
                      {/* Caption Overlay */}
                      <div className="absolute bottom-8 left-0 right-0 text-center">
                        <div className="inline-block bg-black/60 backdrop-blur-md px-4 py-2 rounded-full text-sm">
                          {allImages[viewerImageIndex].type === 'official' ? (
                            <span className="text-teal-300 font-semibold">Official Style</span>
                          ) : (
                            <span className="flex items-center gap-2">
                              <User className="w-3 h-3 text-purple-300" />
                              Created by <span className="font-bold text-purple-300">{allImages[viewerImageIndex].creator}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="text-center text-gray-500">
                      <Palette className="w-20 h-20 mx-auto mb-4 opacity-20" />
                      <p>No images available yet.</p>
                    </div>
                  )}
                </AnimatePresence>

                {/* Nav Arrows */}
                {allImages.length > 1 && (
                  <>
                    <button
                      onClick={() => {
                        setIsPlaying(false);
                        setViewerImageIndex(prev => (prev - 1 + allImages.length) % allImages.length);
                      }}
                      className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 rounded-full text-white hover:bg-white/20 transition-colors"
                    >
                      <ChevronLeft className="w-8 h-8" />
                    </button>
                    <button
                      onClick={() => {
                        setIsPlaying(false);
                        setViewerImageIndex(prev => (prev + 1) % allImages.length);
                      }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 rounded-full text-white hover:bg-white/20 transition-colors"
                    >
                      <ChevronRight className="w-8 h-8" />
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnails */}
              <div className="h-24 bg-gray-900 border-t border-gray-800 flex items-center p-2 gap-2 overflow-x-auto">
                {allImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setViewerImageIndex(idx);
                      setIsPlaying(false);
                    }}
                    className={`flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-all ${
                      idx === viewerImageIndex ? 'border-teal-500 scale-105 opacity-100' : 'border-transparent opacity-50 hover:opacity-80'
                    }`}
                  >
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}