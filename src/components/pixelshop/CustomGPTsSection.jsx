import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Bot, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CustomGPTsSection({ isDark, primaryColor, accentColor }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Fetch Custom GPTs from DesignResource entity
  const { data: allGPTs = [] } = useQuery({
    queryKey: ['customGPTs'],
    queryFn: async () => {
      try {
        const resources = await base44.entities.DesignResource.filter({ is_active: true }, 'sort_order');
        return resources.filter(r => r.category?.includes('CustomGPT'));
      } catch {
        return [];
      }
    }
  });

  // Get unique categories from keywords
  const categories = ['All', ...new Set(allGPTs.flatMap(gpt => gpt.keywords || []))];

  // Filter by category
  const filteredGPTs = selectedCategory === 'All' 
    ? allGPTs 
    : allGPTs.filter(gpt => gpt.keywords?.includes(selectedCategory));

  const currentGPT = filteredGPTs[currentIndex];

  const handlePrev = () => {
    setCurrentIndex(prev => prev === 0 ? filteredGPTs.length - 1 : prev - 1);
  };

  const handleNext = () => {
    setCurrentIndex(prev => prev === filteredGPTs.length - 1 ? 0 : prev + 1);
  };

  const gradientStyle = { background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})` };
  const textClass = isDark ? 'text-gray-100' : 'text-gray-800';
  const subtextClass = isDark ? 'text-gray-400' : 'text-gray-600';

  if (filteredGPTs.length === 0) {
    return (
      <div className="text-center py-8">
        <Bot className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p className={subtextClass}>No Custom GPTs available yet. Check back soon!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Category Filter */}
      <div className="flex flex-wrap justify-center gap-2">
        {categories.map(cat => (
          <Button
            key={cat}
            variant={selectedCategory === cat ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setSelectedCategory(cat);
              setCurrentIndex(0);
            }}
            className={selectedCategory === cat ? 'text-white' : (isDark ? 'bg-gray-700 border-gray-600 text-gray-300' : '')}
            style={selectedCategory === cat ? gradientStyle : {}}
          >
            {cat}
          </Button>
        ))}
      </div>

      {/* Carousel */}
      <div className="relative">
        <AnimatePresence mode="wait">
          {currentGPT && (
            <motion.div
              key={currentGPT.id}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
            >
              <Card 
                className={`overflow-hidden ${isDark ? 'bg-gray-800/90 border-gray-700' : 'bg-white/90'} backdrop-blur hover:shadow-xl transition-shadow`}
              >
                {/* Image */}
                {currentGPT.gallery_images?.[0] && (
                  <div className="aspect-square w-full max-w-md mx-auto">
                    <img 
                      src={currentGPT.gallery_images[0]} 
                      alt={currentGPT.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                {/* Content */}
                <div className="p-6 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h3 className={`text-2xl font-bold ${textClass} mb-2`}>
                        {currentGPT.name}
                      </h3>
                      {currentGPT.description && (
                        <p className={`${subtextClass} leading-relaxed`}>
                          {currentGPT.description}
                        </p>
                      )}
                    </div>
                    <Bot className="w-6 h-6 flex-shrink-0" style={{ color: primaryColor }} />
                  </div>

                  {/* Keywords */}
                  {currentGPT.keywords?.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {currentGPT.keywords.map((keyword, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs" style={{ borderColor: primaryColor, color: primaryColor }}>
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Link Button */}
                  <Button
                    onClick={() => window.open(currentGPT.link, '_blank')}
                    className="w-full text-white"
                    style={gradientStyle}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open Custom GPT
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Arrows */}
        {filteredGPTs.length > 1 && (
          <>
            <Button
              variant="outline"
              size="icon"
              onClick={handlePrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full w-10 h-10 shadow-lg z-10"
              style={{ 
                backgroundColor: isDark ? '#1f1f23' : 'white',
                borderColor: primaryColor
              }}
            >
              <ChevronLeft className="w-5 h-5" style={{ color: primaryColor }} />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full w-10 h-10 shadow-lg z-10"
              style={{ 
                backgroundColor: isDark ? '#1f1f23' : 'white',
                borderColor: primaryColor
              }}
            >
              <ChevronRight className="w-5 h-5" style={{ color: primaryColor }} />
            </Button>
          </>
        )}
      </div>

      {/* Dot Indicators */}
      {filteredGPTs.length > 1 && (
        <div className="flex justify-center gap-2 pt-2">
          {filteredGPTs.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`w-2 h-2 rounded-full transition-all ${
                idx === currentIndex ? 'w-6' : 'opacity-30'
              }`}
              style={{ backgroundColor: primaryColor }}
            />
          ))}
        </div>
      )}
    </div>
  );
}