import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ExternalLink, Sparkles, Search, Loader2, Zap, Crown, Bot, Palette, GraduationCap, Users, Wrench, Youtube, BookOpen } from 'lucide-react';
import { useTheme } from '../components/shared/useTheme';

// Pixel's AI Toolbox pricing options
const aiToolboxOptions = [
  { value: 'annual', label: '⭐ Annual (Best Value!) - $333.33/year', link: 'https://shop.pixelnutscreative.com/product-details/product/68d72d6ea79ca6592408a90e', badge: 'Best Value' },
  { value: 'quarterly', label: '🗓️ Quarterly - $111/quarter', link: 'https://shop.pixelnutscreative.com/product-details/product/68d72e0097ff0c5ce998b466', badge: 'Quarterly' },
  { value: 'monthly', label: '🗓️ Monthly - $77.77/month', link: 'https://shop.pixelnutscreative.com/product-details/product/68d733ea5847661b433808a3', badge: 'Monthly' },
  { value: 'payment_plan', label: '💳 1 Year - Klarna/Afterpay - $333.33', link: 'https://shop.pixelnutscreative.com/product-details/product/69131c77b9c37c322d4cfefd', badge: 'Payment Plans' },
];

const workshopItems = [
  { 
    name: "Go Nuts! Content Creation Challenge", 
    nickname: "(aka AI Class)",
    description: "The legendary class where we go absolutely nuts creating content with AI. Warning: Side effects include uncontrollable creativity and an addiction to prompts. 🥜", 
    link: 'https://pixelnutscreative.com/gonuts',
    badge: '🔥 Fan Favorite',
    schedule: 'Weekdays 3pm PST',
    is_recurring: true,
  },
];

const nutsAndBotsItem = {
  name: 'The Nuts + Bots',
  description: "Your all-in-one business command center. CRM, funnels, automations, AND Pixel's AI Toolbox included. It's like having a robot army... but friendlier. 🤖",
  link: 'https://thenutsandbots.com/pricing',
  badge: '⚡ Includes AI Toolbox!',
  note: 'White-label High Level + All AI Tools',
};

const fallbackResources = [
  { 
    name: 'Magai', 
    description: "Browser-based AI that actually remembers your conversations. Unlike my ex. 💅", 
    link: 'https://magai.co/?via=blue', 
    badge: '🔥 Recommended',
    category: 'AI',
    keywords: ['ai', 'chat', 'assistant', 'writing', 'gpt', 'chatbot', 'personalities', 'browser']
  },
  { 
    name: 'Suno', 
    description: 'Turn your shower singing into actual songs. AI does the heavy lifting. ($10/mo for rights)', 
    link: 'https://suno.com/invite/@iamnikolewithak',
    category: 'AI',
    keywords: ['ai', 'music', 'songs', 'audio', 'create', 'generate', 'singing']
  },
  { 
    name: 'Kling AI', 
    description: 'Images to video magic. Your static pics are about to get a LOT more interesting.', 
    link: 'https://klingai.com/h5-app/invitation?code=7BRNCEDRHUZE',
    category: 'AI',
    keywords: ['ai', 'video', 'images', 'animation', 'create', 'generate']
  },
  { 
    name: 'ElevenLabs', 
    description: "Clone your voice so you don't have to talk anymore. Living the dream. 🎤", 
    link: 'https://try.elevenlabs.io/vit4ewk7bgyi',
    category: 'AI',
    keywords: ['ai', 'audio', 'voice', 'clone', 'sound', 'effects', 'music', 'text to speech', 'tts']
  },
  { 
    name: 'Glam', 
    description: 'Make your logo dance and yourself look fabulous. Win-win.', 
    link: 'https://glam.onelink.me/OCYu/qi44plg8', 
    badge: '📱 App',
    category: 'AI',
    keywords: ['ai', 'logo', 'animate', 'animation', 'photos', 'selfie', 'app', 'mobile']
  },
  { 
    name: 'Base44', 
    description: 'Build apps without coding. Yes, this very app was made with it. Meta, right?', 
    link: 'https://base44.pxf.io/c/5371887/2049275/25619?subId1=blue&trafcat=base',
    category: 'Creative',
    keywords: ['no code', 'apps', 'websites', 'builder', 'create', 'development', 'software']
  },
  { 
    name: 'Video Express', 
    description: 'Images to videos - $179 ONE TIME. Unlimited forever. Do the math. 🧮', 
    link: 'https://paykstrt.com/50942/156400', 
    badge: '💎 One-Time',
    category: 'Creative',
    keywords: ['video', 'images', 'create', 'animation', 'unlimited', 'one time', 'lifetime']
  },
  { 
    name: 'Talking Photos', 
    description: "Make any pic talk. Great for memes. Terrible for your ex's photos. $97 one time!", 
    link: 'https://paykstrt.com/52357/156400', 
    badge: '💎 One-Time',
    category: 'Creative',
    keywords: ['video', 'photos', 'talking', 'cartoon', 'animation', 'one time', 'lifetime']
  },
  { 
    name: 'Artistly', 
    description: 'AI graphics on steroids. $149 one time = unlimited everything. Yes, really.', 
    link: 'https://paykstrt.com/52357/156400', 
    badge: '💎 One-Time',
    category: 'Creative',
    keywords: ['ai', 'graphics', 'design', 'images', 'create', 'one time', 'lifetime', 'unlimited']
  },
  { 
    name: "Let's Go Nuts", 
    description: 'The community app where nuts gather. Available on both app stores! 🥜', 
    link: 'https://keenkard.com/letsgonuts', 
    badge: '📱 App',
    category: 'Community',
    keywords: ['community', 'app', 'mobile', 'social', 'connect']
  },
  { 
    name: 'AI Filmmaking (Skool)', 
    description: "Learn to make films with AI for $5/mo. That's like... half a coffee. ☕", 
    link: 'https://keenkard.com/aifilmmaking',
    category: 'Learning',
    keywords: ['ai', 'film', 'video', 'learn', 'course', 'community', 'skool', 'filmmaking']
  },
  { 
    name: 'MailChimp', 
    description: "Email marketing that's actually FREE. Build that list, bestie! 📧", 
    link: 'https://login.mailchimp.com/signup/?plan=free_monthly_plan_v0&locale=en', 
    badge: '🆓 Free',
    category: 'Business',
    keywords: ['email', 'marketing', 'newsletter', 'free', 'automation']
  },
  { 
    name: 'Bellator Life', 
    description: 'Digital vending machines = passive income while you sleep. Yes please.', 
    link: 'https://bellatorlife.com/register?reference=iamnikolewithak',
    category: 'Business',
    keywords: ['passive income', 'vending', 'digital', 'business', 'money', 'earn']
  },
  { 
    name: 'Dreams Resources', 
    description: 'Free business resources because we love free things. 🆓', 
    link: 'https://dreamsresources.com/join/?refid=AA5551', 
    badge: '🆓 Free',
    category: 'Business',
    keywords: ['business', 'resources', 'tools', 'free']
  },
];

// Hidden workshops (admin can toggle these)
const hiddenWorkshops = [
  { id: 'graphics_bootcamp', name: 'Graphic Essentials Boot Camp', description: 'Coming soon!', link: '', enabled: false },
  { id: 'design_intensive', name: 'Design My Business Graphics Intensive', description: 'Coming soon!', link: '', enabled: false },
  { id: 'master_ai_graphics', name: 'Master AI Graphics', description: 'Coming soon!', link: '', enabled: false },
];

const categories = ['All', 'AI', 'Creative', 'Business', 'Learning', 'Community'];

const categoryColors = {
  AI: 'from-purple-500 to-pink-500',
  Creative: 'from-teal-500 to-cyan-500',
  Business: 'from-orange-500 to-amber-500',
  Learning: 'from-blue-500 to-indigo-500',
  Community: 'from-green-500 to-emerald-500',
};

export default function PixelsParadise() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedPlan, setSelectedPlan] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const { isDark, bgClass, textClass, cardBgClass, subtextClass } = useTheme();

  useEffect(() => {
    base44.auth.isAuthenticated().then(setIsAuthenticated).catch(() => {});
  }, []);

  const { data: dbResources = [], isLoading } = useQuery({
    queryKey: ['designResources'],
    queryFn: () => base44.entities.DesignResource.filter({ is_active: true }, 'sort_order'),
  });

  // Use database resources if available, otherwise fallback
  const resources = dbResources.length > 0 ? dbResources : fallbackResources;

  const filteredResources = resources.filter(resource => {
    const matchesCategory = selectedCategory === 'All' || resource.category === selectedCategory;
    const searchLower = search.toLowerCase();
    const matchesSearch = !search || 
      resource.name.toLowerCase().includes(searchLower) ||
      resource.description.toLowerCase().includes(searchLower) ||
      (resource.keywords && resource.keywords.some(k => k.includes(searchLower)));
    return matchesCategory && matchesSearch;
  });

  const handlePlanSelect = (value) => {
    setSelectedPlan(value);
    const option = aiToolboxOptions.find(o => o.value === value);
    if (option) {
      window.open(option.link, '_blank');
    }
  };

  return (
    <div className={`min-h-screen ${bgClass} p-4 md:p-8`}>
      <div className="max-w-6xl mx-auto space-y-8">
        {isLoading && (
          <div className="flex justify-center py-4">
            <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
          </div>
        )}

        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-cyan-500 bg-clip-text text-transparent flex items-center justify-center gap-3">
            <Sparkles className="w-10 h-10 text-purple-500" />
            Pixel's Place
          </h1>
          <p className={`${subtextClass} max-w-2xl mx-auto`}>
            Your one-stop shop for all things Pixel Nuts Creative! Links, programs, tools, subscriptions, affiliate goodies, 
            free trainings, and everything else I've hoarded like a digital squirrel. 🐿️
          </p>
        </div>

        {/* ===== PIXEL'S AI TOOLBOX - TOP SECTION ===== */}
        <div className="bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 rounded-2xl p-6 md:p-8 text-white shadow-2xl">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="flex-shrink-0">
              <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center">
                <Zap className="w-10 h-10 text-yellow-300" />
              </div>
            </div>
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                <Crown className="w-6 h-6 text-yellow-300" />
                <h2 className="text-2xl md:text-3xl font-bold">Pixel's AI Toolbox</h2>
              </div>
              <p className="text-white/90 mb-4">
                The ultimate collection of AI tools, templates, prompts, and pure creative chaos. 
                Everything I use to create content that makes people say "wait, HOW did you do that?!" 🤯
              </p>
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-center md:justify-start">
                <Select value={selectedPlan} onValueChange={handlePlanSelect}>
                  <SelectTrigger className="w-full sm:w-72 bg-white/20 border-white/30 text-white">
                    <SelectValue placeholder="Choose your adventure..." />
                  </SelectTrigger>
                  <SelectContent>
                    {aiToolboxOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-white/70 text-sm">← Pick one and let's GO!</span>
              </div>
            </div>
          </div>
        </div>

        {/* ===== WORKSHOPS + NUTS & BOTS SECTION ===== */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Workshops */}
          <div className="space-y-4">
            <h2 className={`text-xl font-bold ${textClass} flex items-center gap-2`}>
              <GraduationCap className="w-5 h-5 text-purple-500" />
              Workshops & Classes
              <span className={`text-sm font-normal ${subtextClass}`}>(where the magic happens)</span>
            </h2>
            {workshopItems.map((workshop) => (
              <Card 
                key={workshop.name}
                className={`${isDark ? 'bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-purple-700' : 'bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200'} overflow-hidden hover:shadow-lg transition-all cursor-pointer group`}
                onClick={() => window.open(workshop.link, '_blank')}
              >
                <CardContent className="p-5 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className={`font-bold text-lg ${textClass} group-hover:text-purple-600 transition-colors`}>
                        {workshop.name}
                      </h3>
                      {workshop.nickname && (
                        <span className="text-sm text-purple-500 font-medium">{workshop.nickname}</span>
                      )}
                    </div>
                    <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-purple-500 flex-shrink-0 mt-1" />
                  </div>
                  <p className={`text-sm ${subtextClass}`}>{workshop.description}</p>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {workshop.schedule && (
                      <Badge className="text-xs bg-green-100 text-green-700 border-0">
                        🗓️ {workshop.schedule}
                      </Badge>
                    )}
                    {workshop.badge && (
                      <Badge className="text-xs bg-purple-100 text-purple-700 border-0">{workshop.badge}</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Nuts + Bots */}
          <div className="space-y-4">
            <h2 className={`text-xl font-bold ${textClass} flex items-center gap-2`}>
              <Bot className="w-5 h-5 text-teal-500" />
              The Nuts + Bots
              <span className={`text-sm font-normal ${subtextClass}`}>(business in a box)</span>
            </h2>
            <Card 
              className={`${isDark ? 'bg-gradient-to-br from-teal-900/30 to-cyan-900/30 border-teal-700' : 'bg-gradient-to-br from-teal-50 to-cyan-50 border-2 border-teal-300'} overflow-hidden hover:shadow-lg transition-all cursor-pointer group h-fit`}
              onClick={() => window.open(nutsAndBotsItem.link, '_blank')}
            >
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className={`font-bold text-xl ${textClass} group-hover:text-teal-600 transition-colors`}>
                    {nutsAndBotsItem.name}
                  </h3>
                  <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-teal-500 flex-shrink-0 mt-1" />
                </div>
                <p className={subtextClass}>{nutsAndBotsItem.description}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="bg-teal-500 text-white border-0 text-sm">
                    {nutsAndBotsItem.badge}
                  </Badge>
                </div>
                <p className="text-xs text-teal-600 font-medium pt-2 border-t border-teal-200">
                  ✨ {nutsAndBotsItem.note}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ===== SEARCH & FILTERS ===== */}
        <div className={`space-y-4 pt-4 border-t ${isDark ? 'border-gray-700' : 'border-purple-200'}`}>
          <h2 className={`text-xl font-bold ${textClass} flex items-center gap-2`}>
            <Wrench className="w-5 h-5 text-purple-500" />
            Tools, Resources & Affiliate Links
            <span className={`text-sm font-normal ${subtextClass}`}>(the good stuff)</span>
          </h2>

          {/* Search */}
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search tools (e.g., video, music, ai, business...)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`pl-10 ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white/80'}`}
            />
          </div>

          {/* Category Filter - Fixed visibility */}
          <div className="flex flex-wrap justify-center gap-2">
            {categories.map(cat => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(cat)}
                className={`${selectedCategory === cat 
                  ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                  : (isDark ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600' : 'bg-white border-purple-300 text-purple-700 hover:bg-purple-50 hover:border-purple-400')
                }`}
              >
                {cat}
              </Button>
            ))}
          </div>
        </div>

        {/* Resource Cards Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredResources.map((resource) => (
            <Card 
              key={resource.name} 
              className={`${isDark ? 'bg-gray-800/90' : 'bg-white/90'} backdrop-blur overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group`}
              onClick={() => window.open(resource.link, '_blank')}
            >
              <div className={`h-2 bg-gradient-to-r ${categoryColors[resource.category] || 'from-gray-400 to-gray-500'}`} />
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className={`font-bold text-lg ${textClass} group-hover:text-purple-600 transition-colors`}>
                    {resource.name}
                  </h3>
                  <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-purple-500 flex-shrink-0 mt-1" />
                </div>
                <p className={`text-sm ${subtextClass}`}>{resource.description}</p>
                <div className="flex items-center justify-between pt-1">
                  <Badge variant="outline" className="text-xs border-purple-300 text-purple-600">
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
            <p className={subtextClass}>No resources found matching "{search}". Maybe try "free stuff"? 😏</p>
          </div>
        )}

        {/* Quick Links Section */}
        <div className={`grid sm:grid-cols-2 gap-4 pt-4 border-t ${isDark ? 'border-gray-700' : 'border-purple-200'}`}>
          <Card 
            className="bg-gradient-to-r from-red-50 to-orange-50 border-red-200 cursor-pointer hover:shadow-lg transition-all"
            onClick={() => window.open('https://youtube.com/@pixelnutscreative', '_blank')}
          >
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center">
                <Youtube className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800">YouTube Channel</h3>
                <p className="text-sm text-gray-600">Free tutorials & behind the scenes chaos</p>
              </div>
            </CardContent>
          </Card>
          <Card 
            className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 cursor-pointer hover:shadow-lg transition-all"
            onClick={() => window.open('https://pixelnutscreative.com/trainings', '_blank')}
          >
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800">Free Trainings</h3>
                <p className="text-sm text-gray-600">Because learning should be fun AND free</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center pt-6 text-gray-500 text-sm">
          <p>Made with 💜 and probably too much coffee by @PixelNutsCreative</p>
          <p className="text-xs mt-1">Some links are affiliate links - thanks for supporting! 🥜</p>
        </div>
      </div>
    </div>
  );
}