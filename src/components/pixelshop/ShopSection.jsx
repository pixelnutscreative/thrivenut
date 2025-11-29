import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ShoppingBag, ExternalLink, Calendar, ChevronLeft, ChevronRight,
  Sparkles, Video, Image, Palette, Users, Zap, Star
} from 'lucide-react';

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
    price_description: 'Starting at $25',
    is_featured: true,
    badge: '🔥 Popular',
    gallery_images: []
  },
  {
    id: 'fan_stickers',
    name: 'Custom Fan Stickers',
    description: 'Personalized sticker packs for your superfans',
    category: 'fan_stickers',
    price_description: 'Starting at $15',
    gallery_images: []
  },
  {
    id: 'greenscreens',
    name: 'Greenscreen Backgrounds',
    description: 'Custom backgrounds including "Losing for a Friend" style and more',
    category: 'greenscreens',
    price_description: 'Starting at $10',
    gallery_images: []
  },
  {
    id: 'battle_posters',
    name: 'Battle Posters',
    description: 'Eye-catching graphics to announce your TikTok battles',
    category: 'battle_posters',
    price_description: 'Starting at $20',
    badge: '⚡ New',
    gallery_images: []
  },
  {
    id: 'pipsqueeks',
    name: 'PipSqueeks Characters',
    description: 'Adorable mini character versions of you or your brand',
    category: 'pipsqueeks',
    price_description: 'Starting at $30',
    gallery_images: []
  },
  {
    id: 'digital_twins',
    name: 'Digital Twins',
    description: 'Full digital avatar versions of yourself',
    category: 'digital_twins',
    price_description: 'Starting at $50',
    is_featured: true,
    gallery_images: []
  },
  {
    id: 'nutpals',
    name: 'NutPals Custom Characters',
    description: 'Any animal or object personified! From designer bags to toilet paper with personality',
    category: 'nutpals',
    price_description: 'Starting at $25',
    badge: '🎨 Custom',
    is_featured: true,
    gallery_images: []
  },
  {
    id: 'consultation',
    name: '1-on-1 Creative Session',
    description: 'Book time with Pixel to plan your creative vision',
    category: 'consultation',
    price_description: '$75/hour',
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
            onClick={() => setCurrent(prev => (prev - 1 + images.length) % images.length)}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-1 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrent(prev => (prev + 1) % images.length)}
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
  const shopUrl = 'https://www.nutsandbots.co/shop';
  const bookingUrl = 'https://www.nutsandbots.co/book';

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
          <ShoppingBag className="w-7 h-7 text-purple-500" />
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
          style={{ background: `linear-gradient(to right, ${primaryColor || '#8B5CF6'}, ${accentColor || '#EC4899'})` }}
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
          <Calendar className="w-5 h-5 mr-2" />
          Book 1-on-1 Session
        </Button>
      </div>

      {/* Featured Items */}
      {featuredItems.length > 0 && (
        <div className="grid md:grid-cols-3 gap-4">
          {featuredItems.map(item => {
            const config = categoryConfig[item.category] || categoryConfig.other;
            const Icon = config.icon;
            return (
              <Card key={item.id} className={`overflow-hidden ${isDark ? 'bg-gray-800 border-gray-700' : ''} ${item.is_featured ? 'ring-2 ring-purple-400' : ''}`}>
                <ImageCarousel images={item.gallery_images} />
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <Badge className={config.color}>
                      <Icon className="w-3 h-3 mr-1" />
                      {config.label}
                    </Badge>
                    {item.badge && (
                      <Badge variant="secondary" className="text-xs">{item.badge}</Badge>
                    )}
                  </div>
                  <h3 className={`font-bold ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>{item.name}</h3>
                  <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{item.description}</p>
                  <div className="flex items-center justify-between mt-3">
                    <span className={`font-semibold text-purple-600`}>{item.price_description}</span>
                    <Button
                      size="sm"
                      onClick={() => window.open(item.shop_url || shopUrl, '_blank')}
                      style={{ background: `linear-gradient(to right, ${primaryColor || '#8B5CF6'}, ${accentColor || '#EC4899'})` }}
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      Order
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* All Categories Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {Object.entries(categoryConfig).map(([key, config]) => {
          const Icon = config.icon;
          const categoryItems = items.filter(i => i.category === key);
          if (categoryItems.length === 0 && key !== 'consultation') return null;
          
          return (
            <Card 
              key={key} 
              className={`cursor-pointer hover:shadow-lg transition-shadow ${isDark ? 'bg-gray-800 border-gray-700 hover:border-gray-600' : 'hover:border-purple-300'}`}
              onClick={() => window.open(shopUrl, '_blank')}
            >
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`p-3 rounded-xl ${config.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h4 className={`font-semibold ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>{config.label}</h4>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {categoryItems.length > 0 ? `${categoryItems.length} options` : 'View options'}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* NutPals Callout */}
      <Card className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white border-0">
        <CardContent className="p-6 text-center">
          <div className="text-4xl mb-2">🐿️</div>
          <h3 className="text-xl font-bold mb-2">Meet the NutPals!</h3>
          <p className="text-white/90 mb-4">
            Any character you can imagine! Animals, objects, even a designer handbag or roll of toilet paper with personality. 
            If you can dream it, I can create it!
          </p>
          <Button
            onClick={() => window.open(shopUrl, '_blank')}
            className="bg-white text-teal-600 hover:bg-gray-100"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Create Your NutPal
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}