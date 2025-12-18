import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ShoppingBag, ExternalLink, Calendar, ChevronLeft, ChevronRight,
  Sparkles, Video, Image, Palette, Users, Zap, Star, Clock
} from 'lucide-react';
import NutPalsCarousel from './NutPalsCarousel';

const categoryConfig = {
  live_stream: { label: 'LIVE Stream Graphics', icon: Video, color: 'bg-purple-100 text-purple-700' },
  fan_stickers: { label: 'Fan Stickers', icon: Star, color: 'bg-pink-100 text-pink-700' },
  greenscreens: { label: 'Greenscreens', icon: Image, color: 'bg-green-100 text-green-700' },
  battle_posters: { label: 'Battle Posters', icon: Zap, color: 'bg-red-100 text-red-700' },
  pipsqueeks: { label: 'PipSqueeks', icon: Users, color: 'bg-amber-100 text-amber-700' },
  digital_twins: { label: 'Digital Twins', icon: Sparkles, color: 'bg-blue-100 text-blue-700' },
  nutpals: { label: 'NutPals', icon: Palette, color: 'bg-teal-100 text-teal-700' },
  consultation: { label: '1-on-1 Sessions', icon: Calendar, color: 'bg-indigo-100 text-indigo-700' },
  other: { label: 'Other', icon: ShoppingBag, color: 'bg-gray-100 text-gray-700' }
};

// Fallback items if database is empty
const fallbackItems = [
  {
    id: 'live_graphics',
    name: 'LIVE Stream Graphics Package',
    description: 'Custom overlays, banners, and animations for your TikTok LIVE',
    category: 'live_stream',
    is_featured: true,
    badge: '🔥 Popular',
    gallery_images: []
  },
  {
    id: 'digital_twins',
    name: 'Digital Twins',
    description: 'Full digital avatar versions of yourself',
    category: 'digital_twins',
    is_featured: true,
    gallery_images: []
  },
  {
    id: 'nutpals',
    name: 'NutPals Custom Characters',
    description: 'Any animal or object personified! From designer bags to toilet paper with personality',
    category: 'nutpals',
    badge: '🎨 Custom',
    is_featured: true,
    gallery_images: []
  }
];

function ImageCarousel({ images }) {
  const [current, setCurrent] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (images.length <= 1) return;
    intervalRef.current = setInterval(() => {
      setCurrent(prev => (prev + 1) % images.length);
    }, 3000);
    return () => clearInterval(intervalRef.current);
  }, [images.length]);

  if (!images || images.length === 0) {
    return (
      <div className="w-full h-40 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center">
        <Palette className="w-12 h-12 text-purple-300" />
      </div>
    );
  }

  return (
    <div className="relative w-full h-40 rounded-lg overflow-hidden group">
      <img 
        src={images[current]} 
        alt="" 
        className="w-full h-full object-cover transition-opacity duration-500"
      />
      {images.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); setCurrent(prev => (prev - 1 + images.length) % images.length); }}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-1 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setCurrent(prev => (prev + 1) % images.length); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {images.map((_, idx) => (
              <div 
                key={idx} 
                className={`w-1.5 h-1.5 rounded-full ${idx === current ? 'bg-white' : 'bg-white/50'}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function ShopSection({ isDark, primaryColor, accentColor }) {
  const shopUrl = 'https://shop.pixelnutscreative.com';
  const bookingUrl = 'https://api.leadconnectorhq.com/widget/booking/kYlIpWiW6Cl1hulku154';
  const hoursPackageUrl = 'https://shop.pixelnutscreative.com/shop/collections/design-sessions';

  const gradientStyle = { background: `linear-gradient(135deg, ${primaryColor || '#1fd2ea'}, ${accentColor || '#bd84f5'})` };

  const { data: dbItems = [] } = useQuery({
    queryKey: ['shopItems'],
    queryFn: async () => {
      try {
        const items = await base44.entities.ShopItem.filter({ is_active: true }, 'sort_order');
        return items;
      } catch {
        return [];
      }
    }
  });

  const items = dbItems.length > 0 ? dbItems : fallbackItems;
  const featuredItems = items.filter(i => i.is_featured);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className={`text-2xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-800'} flex items-center justify-center gap-2`}>
          <ShoppingBag className="w-7 h-7" style={{ color: primaryColor }} />
          Pixel's Creative Shop
        </h2>
        <p className={`mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Custom graphics, characters & more for your TikTok LIVE
        </p>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap justify-center gap-3">
        <Button
          onClick={() => window.open(shopUrl, '_blank')}
          size="lg"
          className="text-white"
          style={gradientStyle}
        >
          <ShoppingBag className="w-5 h-5 mr-2" />
          Browse Full Shop
        </Button>
        <Button
          onClick={() => window.open(bookingUrl, '_blank')}
          size="lg"
          variant="outline"
          className={isDark ? 'border-gray-600 text-gray-200 hover:bg-gray-700' : ''}
        >
          <Clock className="w-5 h-5 mr-2" />
          Book Your First Session
        </Button>
        <Button
          onClick={() => window.open(hoursPackageUrl, '_blank')}
          size="lg"
          variant="outline"
          className={isDark ? 'border-gray-600 text-gray-200 hover:bg-gray-700' : ''}
        >
          <Calendar className="w-5 h-5 mr-2" />
          Get a Package of Hours
        </Button>
      </div>

      <p className={`text-center text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
        Book a session and we'll dive in and get working together! Or get the tools and learn FREE 7 times a week.
      </p>

      {/* Featured Items Removed per request */}
      {/* 
      {featuredItems.length > 0 && (
        <div className="grid md:grid-cols-3 gap-4">
          ...
        </div>
      )} 
      */}

      {/* NutPals Carousel Section */}
      <Card className="text-white border-0 overflow-hidden" style={gradientStyle}>
        <CardContent className="p-4 md:p-6">
          <div className="text-center mb-4">
            <h3 className="text-lg md:text-xl font-bold mb-2">🐿️ Meet the NutPals!</h3>
            <p className="text-white/90 text-sm md:text-base">
              50+ character styles! Any animal or object personified - from designer bags to toilet paper with personality. 
              If you can dream it, I can create it!
            </p>
          </div>
          
          <div className="max-w-full overflow-hidden">
            <NutPalsCarousel 
              isDark={false} 
              primaryColor={primaryColor} 
              accentColor={accentColor}
            />
          </div>
          
          <div className="text-center mt-4">
            <Button
              onClick={() => window.open(shopUrl, '_blank')}
              className="bg-white hover:bg-gray-100"
              style={{ color: primaryColor }}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Create Your NutPal
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}