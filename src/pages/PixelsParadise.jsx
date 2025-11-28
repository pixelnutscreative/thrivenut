import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ExternalLink, Sparkles, Search, Loader2 } from 'lucide-react';

const fallbackResources = [
  { 
    name: 'Magai', 
    description: 'Browser-based AI assistant with custom personalities', 
    link: 'https://magai.co/?via=blue', 
    badge: '🔥 Recommended',
    category: 'AI',
    keywords: ['ai', 'chat', 'assistant', 'writing', 'gpt', 'chatbot', 'personalities', 'browser']
  },
  { 
    name: 'Suno', 
    description: 'Create amazing songs with AI ($10/mo for rights)', 
    link: 'https://suno.com/invite/@iamnikolewithak',
    category: 'AI',
    keywords: ['ai', 'music', 'songs', 'audio', 'create', 'generate', 'singing']
  },
  { 
    name: 'Kling AI', 
    description: 'Images to video and so much more!', 
    link: 'https://klingai.com/h5-app/invitation?code=7BRNCEDRHUZE',
    category: 'AI',
    keywords: ['ai', 'video', 'images', 'animation', 'create', 'generate']
  },
  { 
    name: 'ElevenLabs', 
    description: 'Create audio, sound effects, voice clones, music', 
    link: 'https://try.elevenlabs.io/vit4ewk7bgyi',
    category: 'AI',
    keywords: ['ai', 'audio', 'voice', 'clone', 'sound', 'effects', 'music', 'text to speech', 'tts']
  },
  { 
    name: 'Glam', 
    description: 'Animate your logo with AI + pretty pics of yourself', 
    link: 'https://glam.onelink.me/OCYu/qi44plg8', 
    badge: '📱 App',
    category: 'AI',
    keywords: ['ai', 'logo', 'animate', 'animation', 'photos', 'selfie', 'app', 'mobile']
  },
  { 
    name: 'Base44', 
    description: 'Create no-code apps + sites', 
    link: 'https://base44.pxf.io/c/5371887/2049275/25619?subId1=blue&trafcat=base',
    category: 'Creative',
    keywords: ['no code', 'apps', 'websites', 'builder', 'create', 'development', 'software']
  },
  { 
    name: 'Video Express', 
    description: 'Turn images to videos - $179 one time, unlimited!', 
    link: 'https://paykstrt.com/50942/156400', 
    badge: '💎 One-Time',
    category: 'Creative',
    keywords: ['video', 'images', 'create', 'animation', 'unlimited', 'one time', 'lifetime']
  },
  { 
    name: 'Talking Photos', 
    description: 'Make cartoon pics talk - $97 one time!', 
    link: 'https://paykstrt.com/52357/156400', 
    badge: '💎 One-Time',
    category: 'Creative',
    keywords: ['video', 'photos', 'talking', 'cartoon', 'animation', 'one time', 'lifetime']
  },
  { 
    name: 'Artistly', 
    description: 'AI graphics + tools - $149 one time, unlimited!', 
    link: 'https://paykstrt.com/52357/156400', 
    badge: '💎 One-Time',
    category: 'Creative',
    keywords: ['ai', 'graphics', 'design', 'images', 'create', 'one time', 'lifetime', 'unlimited']
  },
  { 
    name: 'The Nuts + Bots', 
    description: 'White label High Level for your business + AI tools', 
    link: 'https://thenutsandbots.com/pricing', 
    badge: '⚡ All-in-One',
    category: 'Business',
    keywords: ['business', 'crm', 'marketing', 'automation', 'high level', 'white label', 'ai']
  },
  { 
    name: "Let's Go Nuts", 
    description: 'Community app (Apple & Play Store)', 
    link: 'https://keenkard.com/letsgonuts', 
    badge: '📱 App',
    category: 'Community',
    keywords: ['community', 'app', 'mobile', 'social', 'connect']
  },
  { 
    name: 'AI Filmmaking', 
    description: 'Join the Skool community - $5/month', 
    link: 'https://keenkard.com/aifilmmaking',
    category: 'Learning',
    keywords: ['ai', 'film', 'video', 'learn', 'course', 'community', 'skool', 'filmmaking']
  },
  { 
    name: 'MailChimp', 
    description: 'Email marketing - FREE account', 
    link: 'https://login.mailchimp.com/signup/?plan=free_monthly_plan_v0&locale=en', 
    badge: '🆓 Free',
    category: 'Business',
    keywords: ['email', 'marketing', 'newsletter', 'free', 'automation']
  },
  { 
    name: 'Bellator Life', 
    description: 'Digital vending machines for passive income', 
    link: 'https://bellatorlife.com/register?reference=iamnikolewithak',
    category: 'Business',
    keywords: ['passive income', 'vending', 'digital', 'business', 'money', 'earn']
  },
  { 
    name: 'Dreams Resources', 
    description: 'Business resources & tools', 
    link: 'https://dreamsresources.com/join/?refid=AA5551', 
    badge: '🆓 Free',
    category: 'Business',
    keywords: ['business', 'resources', 'tools', 'free']
  },
];

const categories = ['All', 'AI', 'Creative', 'Business', 'Learning', 'Workshops', 'Community'];

const categoryColors = {
  AI: 'from-purple-500 to-pink-500',
  Creative: 'from-teal-500 to-cyan-500',
  Business: 'from-orange-500 to-amber-500',
  Learning: 'from-blue-500 to-indigo-500',
  Workshops: 'from-rose-500 to-pink-500',
  Community: 'from-green-500 to-emerald-500',
};

export default function PixelsParadise() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const { data: dbResources = [], isLoading } = useQuery({
    queryKey: ['designResources'],
    queryFn: () => base44.entities.DesignResource.filter({ is_active: true }, 'sort_order'),
  });

  // Use database resources if available, otherwise fallback
  const resources = dbResources.length > 0 ? dbResources : fallbackResources;

  // Separate featured/recurring items
  const featuredResources = resources.filter(r => r.is_featured || r.is_recurring);

  const filteredResources = resources.filter(resource => {
    const matchesCategory = selectedCategory === 'All' || resource.category === selectedCategory;
    const searchLower = search.toLowerCase();
    const matchesSearch = !search || 
      resource.name.toLowerCase().includes(searchLower) ||
      resource.description.toLowerCase().includes(searchLower) ||
      resource.keywords.some(k => k.includes(searchLower));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-cyan-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {isLoading && (
          <div className="flex justify-center py-4">
            <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
          </div>
        )}
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-cyan-500 bg-clip-text text-transparent flex items-center justify-center gap-3">
            <Sparkles className="w-10 h-10 text-purple-500" />
            Pixel's Paradise
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Essential tools, AI resources, and everything you need to create amazing content.
          </p>
        </div>

        {/* Search */}
        <div className="relative max-w-md mx-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Search tools (e.g., video, music, ai, business...)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-white/80"
          />
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-2">
          {categories.map(cat => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(cat)}
              className={selectedCategory === cat ? 'bg-purple-600 hover:bg-purple-700' : 'bg-white/80'}
            >
              {cat}
            </Button>
          ))}
        </div>

        {/* Featured / Recurring Classes */}
        {featuredResources.length > 0 && selectedCategory === 'All' && !search && (
          <div className="space-y-3">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              Featured & Recurring Classes
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {featuredResources.map((resource) => (
                <Card 
                  key={resource.id || resource.name} 
                  className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
                  onClick={() => window.open(resource.link, '_blank')}
                >
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-lg text-gray-800 group-hover:text-purple-600 transition-colors">
                        {resource.name}
                      </h3>
                      <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-purple-500 flex-shrink-0 mt-1" />
                    </div>
                    <p className="text-sm text-gray-600">{resource.description}</p>
                    {resource.schedule && (
                      <p className="text-xs font-medium text-purple-600 bg-purple-100 px-2 py-1 rounded-full w-fit">
                        🗓️ {resource.schedule}
                      </p>
                    )}
                    <div className="flex items-center gap-2 pt-1">
                      {resource.is_recurring && (
                        <Badge className="text-xs bg-green-100 text-green-700 border-0">🔄 Recurring</Badge>
                      )}
                      {resource.badge && (
                        <Badge className="text-xs bg-purple-100 text-purple-700 border-0">{resource.badge}</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Resource Cards Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredResources.map((resource) => (
            <Card 
              key={resource.name} 
              className="bg-white/90 backdrop-blur overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
              onClick={() => window.open(resource.link, '_blank')}
            >
              <div className={`h-2 bg-gradient-to-r ${categoryColors[resource.category]}`} />
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-lg text-gray-800 group-hover:text-purple-600 transition-colors">
                    {resource.name}
                  </h3>
                  <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-purple-500 flex-shrink-0 mt-1" />
                </div>
                <p className="text-sm text-gray-600">{resource.description}</p>
                <div className="flex items-center justify-between pt-1">
                  <Badge variant="outline" className="text-xs">
                    {resource.category}
                  </Badge>
                  {resource.badge && (
                    <Badge className="text-xs bg-purple-100 text-purple-700 border-0">
                      {resource.badge}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredResources.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No resources found matching "{search}"</p>
          </div>
        )}

        {/* Full Links Button */}
        <div className="text-center pt-4">
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={() => window.open('https://pixelnutscreative.com/links', '_blank')}
          >
            View Full Resource Page <ExternalLink className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}