import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Palette, Sparkles, Wand2, Image, Type, Layers } from 'lucide-react';

const resourceCategories = [
  {
    title: 'AI Tools',
    icon: Wand2,
    color: 'from-purple-500 to-pink-500',
    items: [
      { name: 'Coming Soon', description: 'AI-powered design tools', link: '#', badge: 'Soon' }
    ]
  },
  {
    title: 'Design Tools',
    icon: Palette,
    color: 'from-teal-500 to-cyan-500',
    items: [
      { name: 'Canva', description: 'Easy graphic design', link: 'https://canva.com', badge: 'Free tier' },
      { name: 'Figma', description: 'Collaborative design', link: 'https://figma.com', badge: 'Free tier' }
    ]
  },
  {
    title: 'Image Resources',
    icon: Image,
    color: 'from-orange-500 to-amber-500',
    items: [
      { name: 'Unsplash', description: 'Free stock photos', link: 'https://unsplash.com', badge: 'Free' },
      { name: 'Pexels', description: 'Free stock photos & videos', link: 'https://pexels.com', badge: 'Free' }
    ]
  }
];

export default function PixelsParadise() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-cyan-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-cyan-500 bg-clip-text text-transparent flex items-center justify-center gap-3">
            <Sparkles className="w-10 h-10 text-purple-500" />
            Pixel's Paradise
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Essential design tools, AI resources, and everything you need to create amazing content. 
            Curated by PixelNutsCreative.
          </p>
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={() => window.open('https://pixelnutscreative.com/links', '_blank')}
          >
            View Full Resource Page <ExternalLink className="w-4 h-4" />
          </Button>
        </div>

        {/* Resource Categories */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resourceCategories.map((category) => {
            const Icon = category.icon;
            return (
              <Card key={category.title} className="bg-white/80 backdrop-blur overflow-hidden">
                <div className={`h-2 bg-gradient-to-r ${category.color}`} />
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon className="w-5 h-5" />
                    {category.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {category.items.map((item) => (
                    <a
                      key={item.name}
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-gray-800">{item.name}</p>
                          <p className="text-sm text-gray-500">{item.description}</p>
                        </div>
                        {item.badge && (
                          <Badge variant="secondary" className="text-xs">
                            {item.badge}
                          </Badge>
                        )}
                      </div>
                    </a>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Coming Soon Section */}
        <Card className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
          <CardContent className="p-8 text-center">
            <Sparkles className="w-12 h-12 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">AI Tools & Subscriptions Coming Soon!</h2>
            <p className="opacity-90">
              Subscribe directly through ThriveNut to access exclusive AI-powered design tools.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}