import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Palette, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion, AnimatePresence } from 'framer-motion';

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
      className="flex-shrink-0 w-40 cursor-pointer group"
      onClick={() => onClick(nutpal)}
    >
      <div className="aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-teal-100 to-cyan-100 relative">
        {images.length > 0 ? (
          <>
            <img 
              src={images[currentImageIndex]} 
              alt={nutpal.name}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
            />
            {images.length > 1 && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                {images.map((_, idx) => (
                  <div 
                    key={idx}
                    className={`w-1.5 h-1.5 rounded-full transition-colors ${
                      idx === currentImageIndex ? 'bg-white' : 'bg-white/50'
                    }`}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Palette className="w-12 h-12 text-teal-300" />
          </div>
        )}
      </div>
      <p className="mt-2 text-center text-sm font-medium truncate">{nutpal.name}</p>
    </div>
  );
}

export default function NutPalsCarousel({ isDark, primaryColor, accentColor, isAdmin }) {
  const scrollRef = useRef(null);
  const [selectedNutPal, setSelectedNutPal] = useState(null);
  const [viewerImageIndex, setViewerImageIndex] = useState(0);

  const { data: nutpals = [], isLoading } = useQuery({
    queryKey: ['nutpalStyles'],
    queryFn: async () => {
      const items = await base44.entities.NutPalStyle.filter({ is_active: true }, 'sort_order');
      return items;
    }
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
  };

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

  return (
    <>
      <div className="relative">
        {/* Scroll Buttons */}
        <button
          onClick={() => scroll('left')}
          className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full shadow-lg ${
            isDark ? 'bg-gray-700 text-white' : 'bg-white text-gray-800'
          } hover:scale-110 transition-transform`}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={() => scroll('right')}
          className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full shadow-lg ${
            isDark ? 'bg-gray-700 text-white' : 'bg-white text-gray-800'
          } hover:scale-110 transition-transform`}
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Carousel */}
        <div 
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide py-4 px-8"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
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

      {/* Lightbox Viewer */}
      <Dialog open={!!selectedNutPal} onOpenChange={() => setSelectedNutPal(null)}>
        <DialogContent className="max-w-2xl">
          {selectedNutPal && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedNutPal.name}</DialogTitle>
              </DialogHeader>
              
              {selectedNutPal.images?.length > 0 ? (
                <div className="relative">
                  <div className="aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-teal-100 to-cyan-100">
                    <AnimatePresence mode="wait">
                      <motion.img
                        key={viewerImageIndex}
                        src={selectedNutPal.images[viewerImageIndex]}
                        alt={selectedNutPal.name}
                        className="w-full h-full object-contain"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      />
                    </AnimatePresence>
                  </div>
                  
                  {selectedNutPal.images.length > 1 && (
                    <>
                      <button
                        onClick={() => setViewerImageIndex(prev => 
                          (prev - 1 + selectedNutPal.images.length) % selectedNutPal.images.length
                        )}
                        className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 rounded-full text-white hover:bg-black/70"
                      >
                        <ChevronLeft className="w-6 h-6" />
                      </button>
                      <button
                        onClick={() => setViewerImageIndex(prev => 
                          (prev + 1) % selectedNutPal.images.length
                        )}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 rounded-full text-white hover:bg-black/70"
                      >
                        <ChevronRight className="w-6 h-6" />
                      </button>
                      
                      {/* Thumbnail strip */}
                      <div className="flex gap-2 mt-4 justify-center flex-wrap">
                        {selectedNutPal.images.map((img, idx) => (
                          <button
                            key={idx}
                            onClick={() => setViewerImageIndex(idx)}
                            className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                              idx === viewerImageIndex ? 'border-teal-500 scale-105' : 'border-transparent opacity-70'
                            }`}
                          >
                            <img src={img} alt="" className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="aspect-square rounded-xl bg-gradient-to-br from-teal-100 to-cyan-100 flex items-center justify-center">
                  <Palette className="w-24 h-24 text-teal-300" />
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}