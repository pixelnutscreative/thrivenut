import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ExternalLink, Sparkles, Search, Loader2, Zap, Crown, Bot, Palette, GraduationCap, Users, Wrench, Youtube, BookOpen, Bell, Check, X, ShoppingBag, Clock, Upload, Image as ImageIcon } from 'lucide-react';
import ShopSection from '../components/pixelshop/ShopSection';
import CustomGPTsSection from '../components/pixelshop/CustomGPTsSection';
import PortfolioSection from '../components/portfolio/PortfolioSection';
import { motion } from 'framer-motion';
import { useTheme } from '../components/shared/useTheme';
import { getEffectiveUserEmail } from '../components/admin/ImpersonationBanner';
import ImageUploader from '../components/settings/ImageUploader';
import { Textarea } from '@/components/ui/textarea';

// Pixel's AI Toolbox pricing options
const aiToolboxOptions = [
  { value: 'annual', label: '⭐ Annual (Best Value!) - $333.33/year', link: 'https://thenutsandbots.com/order-thenutsandbotsplusai-annual-8125-6335-3387-5540', badge: 'Best Value' },
  { value: 'quarterly', label: '🗓️ Quarterly - $111/quarter', link: 'https://shop.pixelnutscreative.com/product-details/product/68d72e0097ff0c5ce998b466', badge: 'Quarterly' },
  { value: 'monthly', label: '🗓️ Monthly - $77.77/month', link: 'https://shop.pixelnutscreative.com/product-details/product/68d733ea5847661b433808a3', badge: 'Monthly' },
  { value: 'payment_plan', label: '💳 1 Year - Klarna/Afterpay - $333.33', link: 'https://shop.pixelnutscreative.com/product-details/product/69131c77b9c37c322d4cfefd', badge: 'Payment Plans' },
];

const workshopItems = [
  { 
    name: "Go Nuts! Content Creation Challenge", 
    nickname: "AI CLASS",
    description: "The legendary class where we go absolutely nuts creating content with AI. Warning: Side effects include uncontrollable creativity and an addiction to prompts. 🥜", 
    link: 'https://pixelnutscreative.com/aiclass',
    badge: '🔥 Fan Favorite',
    schedule: 'T & Th 8am PST + Weekdays 3pm PST',
    is_recurring: true,
  },
];

const nutsAndBotsItem = {
  name: 'The Nuts + Bots',
  description: "Your all-in-one business command center. CRM, funnels, automations, AND Pixel's AI Toolbox included. It's like having a robot army... but friendlier. 🤖",
  link: 'https://thenutsandbots.com/order-thenutsandbotsplusai-annual-8125-6335-3387-5540',
  badge: '⚡ Includes AI Toolbox!',
  note: 'White-label High Level + All AI Tools',
};

const fallbackResources = [
  { 
    name: 'Magai', 
    description: "Browser-based AI that actually remembers your conversations. Unlike my ex. 💅", 
    link: 'https://magai.co/?via=blue', 
    badge: '🔥 Recommended',
    category: ['AI'],
    keywords: ['ai', 'chat', 'assistant', 'writing', 'gpt', 'chatbot', 'personalities', 'browser']
  },
  { 
    name: 'Suno', 
    description: 'Turn your shower singing into actual songs. AI does the heavy lifting. ($10/mo for rights)', 
    link: 'https://suno.com/invite/@iamnikolewithak',
    category: ['AI'],
    keywords: ['ai', 'music', 'songs', 'audio', 'create', 'generate', 'singing']
  },
  { 
    name: 'Kling AI', 
    description: 'Images to video magic. Your static pics are about to get a LOT more interesting.', 
    link: 'https://klingai.com/h5-app/invitation?code=7BRNCEDRHUZE',
    category: ['AI'],
    keywords: ['ai', 'video', 'images', 'animation', 'create', 'generate']
  },
  { 
    name: 'ElevenLabs', 
    description: "Clone your voice so you don't have to talk anymore. Living the dream. 🎤", 
    link: 'https://try.elevenlabs.io/vit4ewk7bgyi',
    category: ['AI'],
    keywords: ['ai', 'audio', 'voice', 'clone', 'sound', 'effects', 'music', 'text to speech', 'tts']
  },
  { 
    name: 'Glam', 
    description: 'Make your logo dance and yourself look fabulous. Win-win.', 
    link: 'https://glam.onelink.me/OCYu/qi44plg8', 
    badge: '📱 App',
    category: ['AI'],
    keywords: ['ai', 'logo', 'animate', 'animation', 'photos', 'selfie', 'app', 'mobile']
  },
  { 
    name: 'Base44', 
    description: 'Build apps without coding. Yes, this very app was made with it. Meta, right?', 
    link: 'https://base44.pxf.io/c/5371887/2049275/25619?subId1=blue&trafcat=base',
    category: ['Creative'],
    keywords: ['no code', 'apps', 'websites', 'builder', 'create', 'development', 'software']
  },
  { 
    name: 'Video Express', 
    description: 'Images to videos - $179 ONE TIME. Unlimited forever. Do the math. 🧮', 
    link: 'https://paykstrt.com/50942/156400', 
    badge: '💎 One-Time',
    category: ['Creative'],
    keywords: ['video', 'images', 'create', 'animation', 'unlimited', 'one time', 'lifetime']
  },
  { 
    name: 'Talking Photos', 
    description: "Make any pic talk. Great for memes. Terrible for your ex's photos. $97 one time!", 
    link: 'https://paykstrt.com/52357/156400', 
    badge: '💎 One-Time',
    category: ['Creative'],
    keywords: ['video', 'photos', 'talking', 'cartoon', 'animation', 'one time', 'lifetime']
  },
  { 
    name: 'Artistly', 
    description: 'AI graphics on steroids. $149 one time = unlimited everything. Yes, really.', 
    link: 'https://paykstrt.com/52357/156400', 
    badge: '💎 One-Time',
    category: ['Creative'],
    keywords: ['ai', 'graphics', 'design', 'images', 'create', 'one time', 'lifetime', 'unlimited']
  },
  { 
    name: "Let's Go Nuts", 
    description: 'The community app where nuts gather. Available on both app stores! 🥜', 
    link: 'https://keenkard.com/letsgonuts', 
    badge: '📱 App',
    category: ['Community'],
    keywords: ['community', 'app', 'mobile', 'social', 'connect']
  },
  { 
    name: 'AI Filmmaking (Skool)', 
    description: "Learn to make films with AI for $5/mo. That's like... half a coffee. ☕", 
    link: 'https://keenkard.com/aifilmmaking',
    category: ['Learning'],
    keywords: ['ai', 'film', 'video', 'learn', 'course', 'community', 'skool', 'filmmaking']
  },
  { 
    name: 'MailChimp', 
    description: "Email marketing that's actually FREE. Build that list, bestie! 📧", 
    link: 'https://login.mailchimp.com/signup/?plan=free_monthly_plan_v0&locale=en', 
    badge: '🆓 Free',
    category: ['Business'],
    keywords: ['email', 'marketing', 'newsletter', 'free', 'automation']
  },
  { 
    name: 'Bellator Life', 
    description: 'Digital vending machines = passive income while you sleep. Yes please.', 
    link: 'https://bellatorlife.com/register?reference=iamnikolewithak',
    category: ['Business'],
    keywords: ['passive income', 'vending', 'digital', 'business', 'money', 'earn']
  },
  { 
    name: 'Dreams Resources', 
    description: 'Free business resources because we love free things. 🆓', 
    link: 'https://dreamsresources.com/join/?refid=AA5551', 
    badge: '🆓 Free',
    category: ['Business'],
    keywords: ['business', 'resources', 'tools', 'free']
  },
];

const defaultCategories = ['All', 'AI', 'Creative', 'Business', 'Learning', 'Workshops', 'Community'];

export default function PixelsParadise() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedPlan, setSelectedPlan] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLiveReminders, setShowLiveReminders] = useState(false);
  const [showAIClassModal, setShowAIClassModal] = useState(false);
  const [user, setUser] = useState(null);
  const [preferences, setPreferences] = useState(null);
  const [reminderFormData, setReminderFormData] = useState({
    email: '',
    phone: '',
    prefer_text: false,
    prefer_email: true
  });
  const [reminderSubmitted, setReminderSubmitted] = useState(false);
  const [showUploadTwin, setShowUploadTwin] = useState(false);
  const [twinImage, setTwinImage] = useState('');
  const [twinPrompt, setTwinPrompt] = useState('');
  
  const { isDark, bgClass, textClass, cardBgClass, subtextClass, primaryColor, accentColor } = useTheme();

  const effectiveEmail = user ? getEffectiveUserEmail(user.email) : null;

  // Fetch AI Platform User details for additional access checks
  const { data: aiUser } = useQuery({
    queryKey: ['aiPlatformUser', effectiveEmail],
    queryFn: async () => {
      if (!effectiveEmail) return null;
      const users = await base44.entities.AIPlatformUser.filter({ user_email: effectiveEmail });
      return users[0] || null;
    },
    enabled: !!effectiveEmail
  });

  // Fetch uploaded digital twins
  const { data: myTwins = [] } = useQuery({
    queryKey: ['myDigitalTwins', effectiveEmail],
    queryFn: async () => {
      if (!effectiveEmail) return [];
      return await base44.entities.CreatorPortfolio.filter({ 
        creator_email: effectiveEmail,
        content_type: 'digital_twin'
      }, '-created_date');
    },
    enabled: !!effectiveEmail
  });

  // Fetch ALL approved digital twins for gallery
  const { data: galleryTwins = [] } = useQuery({
    queryKey: ['galleryTwins'],
    queryFn: async () => {
      return await base44.entities.CreatorPortfolio.filter({ 
        content_type: 'digital_twin',
        approval_status: 'approved'
      }, '-created_date');
    }
  });

  const hasAIToolbox = preferences?.subscription_product === 'pixels_toolbox_annual' || 
                       preferences?.subscription_product === 'nuts_bots_annual' || 
                       preferences?.has_annual_ai_plan ||
                       (aiUser && (aiUser.platform === 'pixels_toolbox' || aiUser.platform === 'lets_go_nuts'));
                       
  const hasNutsBots = preferences?.subscription_product === 'nuts_bots_annual' || aiUser?.has_nuts_and_bots;
  
  // Considered "has digital twin" if marked in platform OR if they uploaded one
  const hasDigitalTwin = preferences?.digital_twin_created || aiUser?.has_digital_twin || myTwins.length > 0;

  useEffect(() => {
    base44.auth.isAuthenticated().then(setIsAuthenticated).catch(() => {});
    base44.auth.me().then(async (userData) => {
      setUser(userData);
      const email = getEffectiveUserEmail(userData.email);
      // Fetch preferences
      const prefs = await base44.entities.UserPreferences.filter({ user_email: email });
      if (prefs[0]) setPreferences(prefs[0]);
    }).catch(() => {});
  }, []);

  // Fetch custom categories
  const { data: customCategories = [] } = useQuery({
    queryKey: ['resourceCategories'],
    queryFn: async () => {
      try {
        const cats = await base44.entities.ResourceCategory.filter({ is_active: true }, 'sort_order');
        return cats.map(c => c.name);
      } catch {
        return [];
      }
    }
  });

  const categories = customCategories.length > 0 
    ? ['All', ...customCategories] 
    : defaultCategories;

  // Live reminder signup query
  const { data: existingSignup } = useQuery({
    queryKey: ['liveReminderSignup', user?.email],
    queryFn: async () => {
      const signups = await base44.entities.LiveReminderSignup.filter({ created_by: user.email });
      return signups[0] || null;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (existingSignup) {
      setReminderFormData({
        email: existingSignup.email || '',
        phone: existingSignup.phone || '',
        prefer_text: existingSignup.prefer_text || false,
        prefer_email: existingSignup.prefer_email !== false
      });
      setReminderSubmitted(true);
    }
  }, [existingSignup]);

  const saveReminderMutation = useMutation({
    mutationFn: async (data) => {
      if (existingSignup) {
        return await base44.entities.LiveReminderSignup.update(existingSignup.id, data);
      }
      return await base44.entities.LiveReminderSignup.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['liveReminderSignup'] });
      setReminderSubmitted(true);
    },
  });

  const uploadTwinMutation = useMutation({
    mutationFn: async () => {
      const isTrusted = aiUser?.is_trusted_creator;
      return await base44.entities.CreatorPortfolio.create({
        creator_email: effectiveEmail,
        creator_name: user?.full_name || 'Creator',
        title: 'My Digital Twin',
        description: 'My AI-generated digital twin',
        content_type: 'digital_twin',
        image_urls: [twinImage],
        prompt_used: twinPrompt,
        ai_tool_name: 'Midjourney/Other',
        approval_status: isTrusted ? 'approved' : 'pending'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myDigitalTwins'] });
      setShowUploadTwin(false);
      setTwinImage('');
      setTwinPrompt('');
      // Also notify backend if possible, but built-in notifications handle entity creation usually
    }
  });

  const handleReminderSubmit = (e) => {
    e.preventDefault();
    saveReminderMutation.mutate(reminderFormData);
  };

  const { data: dbResources = [], isLoading } = useQuery({
    queryKey: ['designResources'],
    queryFn: () => base44.entities.DesignResource.filter({ is_active: true }, 'sort_order'),
  });

  // Use database resources if available, otherwise fallback
  const resources = dbResources.length > 0 ? dbResources : fallbackResources;

  const filteredResources = resources.filter(resource => {
    const resourceCats = Array.isArray(resource.category) ? resource.category : [resource.category];
    const matchesCategory = selectedCategory === 'All' || resourceCats.includes(selectedCategory);
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

  // Gradient style using theme colors
  const gradientStyle = { background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})` };
  const gradientTextStyle = { backgroundImage: `linear-gradient(to right, ${primaryColor}, ${accentColor})` };

  return (
    <div className={`min-h-screen ${bgClass} p-4 md:p-8`}>
      <div className="max-w-6xl mx-auto space-y-8">
        {isLoading && (
          <div className="flex justify-center py-4">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: primaryColor }} />
          </div>
        )}

        {/* Header with Live Reminder Bell */}
        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-4">
          <div className="flex-1 text-center space-y-4">
            <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent flex items-center justify-center gap-2 md:gap-3" style={gradientTextStyle}>
              <Sparkles className="w-8 md:w-10 h-8 md:h-10" style={{ color: primaryColor }} />
              Pixel's Place
            </h1>
            <p className={`${subtextClass} max-w-2xl mx-auto text-sm md:text-base px-4`}>
              Your one-stop shop for all things Pixel Nuts Creative! Links, programs, tools, subscriptions, affiliate goodies, 
              free trainings, and everything else I've hoarded like a digital squirrel. 🐿️
            </p>
          </div>
          
          {/* Big Bell */}
          <button
            onClick={() => setShowLiveReminders(true)}
            className="flex-shrink-0 w-12 md:w-14 h-12 md:h-14 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105 transition-all"
            style={gradientStyle}
            title="Get Live Reminders"
          >
            <Bell className="w-6 md:w-7 h-6 md:h-7 text-white" />
          </button>
        </div>

        {/* ===== WORKSHOPS & CLASSES - TOP SECTION ===== */}
        {/* Hide AI Class if already subscribed */}
        {!hasAIToolbox && (
          <div className="space-y-4">
            <h2 className={`text-xl font-bold ${textClass} flex items-center gap-2`}>
              <GraduationCap className="w-5 h-5" style={{ color: primaryColor }} />
              Workshops & Classes
              <span className={`text-sm font-normal ${subtextClass}`}>(where the magic happens)</span>
            </h2>
            {workshopItems.map((workshop) => (
              <Card 
                key={workshop.name}
                className={`overflow-hidden hover:shadow-lg transition-all cursor-pointer group`}
                style={{ 
                  background: isDark 
                    ? `linear-gradient(135deg, ${primaryColor}20, ${accentColor}20)` 
                    : `linear-gradient(135deg, ${primaryColor}15, ${accentColor}15)`,
                  borderColor: isDark ? `${primaryColor}50` : `${primaryColor}40`
                }}
                onClick={() => window.open(workshop.link, '_blank')}
              >
                <CardContent className="p-5 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className={`font-bold text-lg ${textClass} group-hover:opacity-80 transition-colors`}>
                        {workshop.name}
                      </h3>
                      {workshop.nickname && (
                        <span className="text-2xl font-black block mt-1 mb-2" style={{ color: primaryColor }}>{workshop.nickname}</span>
                      )}
                    </div>
                    <ExternalLink className="w-4 h-4 text-gray-400 group-hover:opacity-80 flex-shrink-0 mt-1" style={{ color: primaryColor }} />
                  </div>
                  <p className={`text-sm ${subtextClass}`}>{workshop.description}</p>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {workshop.schedule && (
                      <Badge className="text-xs border-0" style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}>
                        🗓️ {workshop.schedule}
                      </Badge>
                    )}
                    {workshop.badge && (
                      <Badge className="text-xs border-0" style={{ backgroundColor: `${accentColor}20`, color: accentColor }}>{workshop.badge}</Badge>
                    )}
                  </div>
                  
                  <div className="pt-4">
                    <Button 
                      className="w-full text-white font-bold text-lg h-12 shadow-lg hover:scale-[1.02] transition-transform"
                      style={gradientStyle}
                    >
                      REGISTER FOR FREE
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* ===== DIGITAL TWIN SECTION ===== */}
        {/* 1. Show CTA if they haven't uploaded/created one */}
        {!hasDigitalTwin && (
          <div className="rounded-2xl p-6 md:p-8 text-white shadow-2xl" style={{ background: `linear-gradient(135deg, ${accentColor}, ${primaryColor})` }}>
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 animate-pulse">
                <Bot className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-2xl font-bold mb-2">Have you created your Digital Twin yet?</h2>
                <p className="text-white/90 mb-4">
                  Clone yourself (digitally!) so you can be in two places at once. It's the ultimate productivity hack.
                </p>
                <div className="flex gap-3 justify-center md:justify-start">
                  <Button 
                    onClick={() => window.open('https://create.letsgonuts.ai', '_blank')}
                    className="bg-white text-purple-600 font-bold hover:bg-gray-100"
                  >
                    Start Cloning Now
                  </Button>
                  <Button 
                    onClick={() => setShowUploadTwin(true)}
                    variant="outline"
                    className="bg-purple-600 border-white text-white hover:bg-purple-700 hover:text-white"
                  >
                    I Have One! Upload It
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. Show Digital Twin Gallery if they HAVE created one */}
        {hasDigitalTwin && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className={`text-xl font-bold ${textClass} flex items-center gap-2`}>
                <Bot className="w-5 h-5" style={{ color: primaryColor }} />
                Digital Twin Gallery
              </h2>
              <Button onClick={() => setShowUploadTwin(true)} size="sm" variant="outline">
                <Upload className="w-4 h-4 mr-2" /> Share Twin
              </Button>
            </div>

            {/* Pending twins message */}
            {myTwins.some(t => t.approval_status === 'pending') && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Your uploaded twin is pending approval. Hang tight!
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* My Approved Twins */}
              {myTwins.filter(t => t.approval_status === 'approved').map(twin => (
                <Card key={twin.id} className="overflow-hidden">
                  <div className="aspect-square bg-gray-100 relative">
                    <img src={twin.image_urls[0]} alt="Digital Twin" className="w-full h-full object-cover" />
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 text-center">
                      My Twin
                    </div>
                  </div>
                </Card>
              ))}
              {/* Gallery Twins (Other people) */}
              {galleryTwins.filter(t => t.creator_email !== effectiveEmail).slice(0, 8).map(twin => (
                <Card key={twin.id} className="overflow-hidden cursor-pointer group hover:shadow-lg transition-all">
                  <div className="aspect-square bg-gray-100 relative">
                    <img src={twin.image_urls[0]} alt="Digital Twin" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <p className="text-white text-xs font-bold text-center px-2">
                        Created by<br/>{twin.creator_name}
                      </p>
                    </div>
                  </div>
                  {twin.prompt_used && (
                    <CardContent className="p-2 bg-gray-50 border-t">
                      <p className="text-[10px] text-gray-500 line-clamp-2 italic">"{twin.prompt_used}"</p>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* ===== PIXEL'S AI TOOLBOX + NUTS & BOTS ===== */}
        {(!hasAIToolbox || !hasNutsBots) && (
          <div className="rounded-2xl p-6 md:p-8 text-white shadow-2xl space-y-6" style={gradientStyle}>
            {/* AI Toolbox - Hide if subscribed */}
            {!hasAIToolbox && (
              <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
                <div className="flex-shrink-0">
                  <div className="w-16 md:w-20 h-16 md:h-20 bg-white/20 rounded-2xl flex items-center justify-center">
                    <Zap className="w-8 md:w-10 h-8 md:h-10 text-yellow-300" />
                  </div>
                </div>
                <div className="flex-1 text-center md:text-left">
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-2">
                    <Crown className="w-5 md:w-6 h-5 md:h-6 text-yellow-300" />
                    <h2 className="text-xl md:text-2xl lg:text-3xl font-bold">Pixel's AI Toolbox</h2>
                  </div>
                  <p className="text-white/90 mb-4 text-sm md:text-base">
                    Access the most amazing collection of 300+ AI tools to do anything you could possibly imagine (almost, except AI video).
                    <br /><br />
                    Basically it's for <strong>less than one dollar a day</strong> when paid annually!
                    <br />
                    Also includes <strong>seven AI classes each week</strong> where you can ask questions, get new tools, and get specific help for your needs! 🤯
                  </p>
                  <div className="flex flex-col gap-3">
                    <Select value={selectedPlan} onValueChange={handlePlanSelect}>
                      <SelectTrigger className="w-full bg-white/20 border-white/30 text-white">
                        <SelectValue placeholder="Get access now..." />
                      </SelectTrigger>
                      <SelectContent>
                        {aiToolboxOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="text-white/70 text-xs md:text-sm text-center md:text-left">Pick one and let's GO! ⬆️</span>
                  </div>
                </div>
              </div>
            )}
            
            {/* WANT IT ALL - Nuts + Bots inside the box - Hide if subscribed to Nuts + Bots */}
            {!hasNutsBots && (
              <div className="bg-white/15 backdrop-blur rounded-xl p-4 md:p-5 border border-white/20">
                <div className="flex flex-col md:flex-row items-center gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 md:w-14 h-12 md:h-14 bg-white/30 rounded-xl flex items-center justify-center">
                      <Bot className="w-6 md:w-7 h-6 md:h-7 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <h3 className="text-lg md:text-xl font-bold flex flex-wrap items-center justify-center md:justify-start gap-2">
                      🚀 WANT IT ALL? Get The Nuts + Bots
                    </h3>
                    <p className="text-white/90 text-xs md:text-sm mt-1">
                      All the tools you need to run your business - CRM, funnels, automations, AND Pixel's AI Toolbox included!
                    </p>
                    <div className="flex flex-col sm:flex-row flex-wrap items-center gap-2 md:gap-3 mt-3 justify-center md:justify-start">
                      <Button
                        onClick={() => window.open('https://thenutsandbots.com/order-thenutsandbotsplusai-annual-8125-6335-3387-5540', '_blank')}
                        className="bg-white/30 hover:bg-white/40 text-white w-full sm:w-auto font-bold text-lg h-12"
                        size="lg"
                      >
                        See Pricing & Get Started
                      </Button>
                    </div>
                    <p className="text-white/90 text-sm mt-3 text-center md:text-left font-semibold">
                      🎉 Use coupon code <span className="text-yellow-300 font-bold bg-black/20 px-1 rounded">NIKOLE</span> to get $111 off the annual plan!
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}



        {/* ===== PIXEL'S CREATIVE SHOP ===== */}
        <div className={`pt-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <ShopSection isDark={isDark} primaryColor={primaryColor} accentColor={accentColor} />
        </div>

        {/* ===== CREATOR PORTFOLIO SHOWCASE ===== */}
        <div className={`pt-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <PortfolioSection 
            userEmail={effectiveEmail}
            isAuthenticated={isAuthenticated}
            primaryColor={primaryColor}
            accentColor={accentColor}
            isDark={isDark}
          />
        </div>

        {/* ===== SEARCH & FILTERS ===== */}
        <div className={`space-y-4 pt-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <h2 className={`text-xl font-bold ${textClass} flex items-center gap-2`}>
            <Wrench className="w-5 h-5" style={{ color: primaryColor }} />
            Products I Actually Use and LOVE
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

          {/* Category Filter */}
          <div className="flex flex-wrap justify-center gap-2">
            {categories.map(cat => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(cat)}
                className={selectedCategory === cat ? 'text-white' : (isDark ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600' : '')}
                style={selectedCategory === cat ? gradientStyle : {}}
              >
                {cat}
              </Button>
            ))}
          </div>
        </div>

        {/* Resource Cards Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredResources.map((resource) => {
            const resourceCats = Array.isArray(resource.category) ? resource.category : [resource.category];
            return (
              <Card 
                key={resource.name} 
                className={`${isDark ? 'bg-gray-800/90' : 'bg-white/90'} backdrop-blur overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group`}
                onClick={() => window.open(resource.link, '_blank')}
              >
                <div className="h-2" style={gradientStyle} />
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className={`font-bold text-lg ${textClass} group-hover:opacity-80 transition-colors`}>
                      {resource.name}
                    </h3>
                    <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" style={{ color: primaryColor }} />
                  </div>
                  <p className={`text-sm ${subtextClass}`}>{resource.description}</p>
                  <div className="flex items-center justify-between pt-1 flex-wrap gap-1">
                    {resourceCats.slice(0, 2).map(cat => (
                      <Badge key={cat} variant="outline" className="text-xs" style={{ borderColor: primaryColor, color: primaryColor }}>
                        {cat}
                      </Badge>
                    ))}
                    {resource.badge && (
                      <Badge className="text-xs border-0" style={{ backgroundColor: `${accentColor}20`, color: accentColor }}>
                        {resource.badge}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredResources.length === 0 && (
          <div className="text-center py-12">
            <p className={subtextClass}>No resources found matching "{search}". Maybe try "free stuff"? 😏</p>
          </div>
        )}

        {/* Quick Links Section */}
        <div className={`grid sm:grid-cols-2 gap-4 pt-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <Card 
            className="cursor-pointer hover:shadow-lg transition-all"
            style={{ 
              background: isDark 
                ? `linear-gradient(135deg, ${primaryColor}20, ${accentColor}20)` 
                : `linear-gradient(135deg, ${primaryColor}10, ${accentColor}10)`,
              borderColor: `${primaryColor}40`
            }}
            onClick={() => window.open('https://youtube.com/@pixelnutscreative', '_blank')}
          >
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={gradientStyle}>
                <Youtube className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className={`font-bold ${textClass}`}>YouTube Channel</h3>
                <p className={`text-sm ${subtextClass}`}>Free tutorials & behind the scenes chaos</p>
              </div>
            </CardContent>
          </Card>
          <Card 
            className="cursor-pointer hover:shadow-lg transition-all"
            style={{ 
              background: isDark 
                ? `linear-gradient(135deg, ${primaryColor}20, ${accentColor}20)` 
                : `linear-gradient(135deg, ${primaryColor}10, ${accentColor}10)`,
              borderColor: `${primaryColor}40`
            }}
            onClick={() => setShowAIClassModal(true)}
          >
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={gradientStyle}>
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className={`font-bold ${textClass}`}>Free Trainings</h3>
                <p className={`text-sm ${subtextClass}`}>Join the Go Nuts! AI Class - 7 times a week!</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className={`text-center pt-6 ${subtextClass} text-sm`}>
          <p>Made with 💜 and probably too much coffee by @PixelNutsCreative</p>
          <p className="text-xs mt-1">Some links are affiliate links - thanks for supporting! 🥜</p>
        </div>
      </div>

      {/* Upload Digital Twin Modal */}
      <Dialog open={showUploadTwin} onOpenChange={setShowUploadTwin}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Share Your Digital Twin</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-purple-50 p-3 rounded-lg text-sm text-purple-800">
              Upload your AI-generated twin! It will be reviewed by admin before appearing in the public gallery.
            </div>
            <div className="space-y-2">
              <Label>Your Twin Image</Label>
              <ImageUploader
                label="Upload Image"
                currentImage={twinImage}
                onImageChange={setTwinImage}
                size="large"
              />
            </div>
            <div className="space-y-2">
              <Label>Prompt Used (Optional)</Label>
              <Textarea
                placeholder="Share the prompt you used to generate this..."
                value={twinPrompt}
                onChange={(e) => setTwinPrompt(e.target.value)}
                rows={3}
              />
            </div>
            <Button 
              onClick={() => uploadTwinMutation.mutate()}
              disabled={!twinImage || uploadTwinMutation.isPending}
              className="w-full"
              style={gradientStyle}
            >
              {uploadTwinMutation.isPending ? 'Uploading...' : 'Submit to Gallery'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Live Reminders Popup */}
      <Dialog open={showLiveReminders} onOpenChange={setShowLiveReminders}>
        <DialogContent className="max-w-md">
          <DialogHeader className="-m-6 mb-4 p-4 rounded-t-lg" style={gradientStyle}>
            <DialogTitle className="text-white flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Never Miss a Live!
            </DialogTitle>
          </DialogHeader>
          
          <p className="text-gray-600 text-sm mb-4">
            Get notified when @pixelnutscreative goes live on TikTok
          </p>

          {reminderSubmitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-6"
            >
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: `${primaryColor}20` }}>
                <Check className="w-7 h-7" style={{ color: primaryColor }} />
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">You're Signed Up!</h3>
              <p className="text-gray-600 text-sm mb-4">
                You'll get notified before @pixelnutscreative goes live.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setReminderSubmitted(false)}
              >
                Update My Info
              </Button>
            </motion.div>
          ) : (
            <form onSubmit={handleReminderSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reminder-email">Email Address</Label>
                <Input
                  id="reminder-email"
                  type="email"
                  placeholder="your@email.com"
                  value={reminderFormData.email}
                  onChange={(e) => setReminderFormData({ ...reminderFormData, email: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reminder-phone">Phone Number (for text reminders)</Label>
                <Input
                  id="reminder-phone"
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={reminderFormData.phone}
                  onChange={(e) => setReminderFormData({ ...reminderFormData, phone: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>How would you like to be notified?</Label>
                <div className="flex flex-col gap-2">
                  <div 
                    className="flex items-center gap-3 p-2 border rounded-lg cursor-pointer hover:bg-gray-50"
                    onClick={() => setReminderFormData({ ...reminderFormData, prefer_email: !reminderFormData.prefer_email })}
                  >
                    <Checkbox checked={reminderFormData.prefer_email} />
                    <span className="text-sm">Email me before lives</span>
                  </div>
                  <div 
                    className="flex items-center gap-3 p-2 border rounded-lg cursor-pointer hover:bg-gray-50"
                    onClick={() => setReminderFormData({ ...reminderFormData, prefer_text: !reminderFormData.prefer_text })}
                  >
                    <Checkbox checked={reminderFormData.prefer_text} />
                    <span className="text-sm">Text me before lives</span>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full text-white"
                style={gradientStyle}
                disabled={saveReminderMutation.isPending || (!reminderFormData.email && !reminderFormData.phone)}
              >
                {saveReminderMutation.isPending ? 'Saving...' : existingSignup ? 'Update My Info' : 'Sign Me Up!'}
              </Button>
            </form>
          )}

          <div className="pt-4 border-t text-center">
            <a
              href="https://tiktok.com/@pixelnutscreative"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm hover:opacity-80"
              style={{ color: primaryColor }}
            >
              <ExternalLink className="w-4 h-4" />
              Follow @pixelnutscreative on TikTok
            </a>
          </div>
        </DialogContent>
      </Dialog>

      {/* AI Class Modal */}
      <Dialog open={showAIClassModal} onOpenChange={setShowAIClassModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="-m-6 mb-4 p-6 rounded-t-lg bg-gradient-to-r from-cyan-400 to-blue-500">
            <DialogTitle className="text-white text-2xl font-bold text-center">
              🎨 AI CLASS IS FREE!
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold text-gray-800">📅 AI Class Schedule</h2>
              <p className="text-gray-600">
                You'll get reminder texts before each session so you never miss your spot.<br />
                When you're done, you can opt out of reminders with one tap — easy.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-800 text-white rounded-lg text-center">
                <div className="text-2xl mb-2">✅</div>
                <p className="font-semibold">Weekdays – 3 PM PST</p>
              </div>
              <div className="p-4 bg-gray-800 text-white rounded-lg text-center">
                <div className="text-2xl mb-2">✅</div>
                <p className="font-semibold">Tuesday + Thursday – 8 AM PST</p>
              </div>
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold text-gray-800">Choose your reminder style...</h3>
              <p className="text-gray-600">US gets text. Everyone else gets email + WhatsApp. Easy.</p>
            </div>

            {/* US vs Outside US Forms */}
            {preferences?.country ? (
              <div>
                {preferences.country === 'USA' ? (
                  <div>
                    <h4 className="text-center font-semibold mb-3 text-gray-700">🇺🇸 I'm in the US (Text Reminders)</h4>
                    <div 
                      dangerouslySetInnerHTML={{
                        __html: `
                          <iframe
                            src="https://api.leadconnectorhq.com/widget/form/Ubgdqzxz5vZsDuqMB5ZW"
                            style="width:100%;height:680px;border:none;border-radius:4px"
                            id="inline-Ubgdqzxz5vZsDuqMB5ZW" 
                            data-layout="{'id':'INLINE'}"
                            data-trigger-type="alwaysShow"
                            data-trigger-value=""
                            data-activation-type="alwaysActivated"
                            data-activation-value=""
                            data-deactivation-type="neverDeactivate"
                            data-deactivation-value=""
                            data-form-name="Ai Class Text Reminders"
                            data-height="680"
                            data-layout-iframe-id="inline-Ubgdqzxz5vZsDuqMB5ZW"
                            data-form-id="Ubgdqzxz5vZsDuqMB5ZW"
                            title="Ai Class Text Reminders"
                          ></iframe>
                          <script src="https://link.msgsndr.com/js/form_embed.js"></script>
                        `
                      }}
                    />
                  </div>
                ) : (
                  <div>
                    <h4 className="text-center font-semibold mb-3 text-gray-700">🌍 I'm Outside the US (Email Reminders)</h4>
                    <div 
                      dangerouslySetInnerHTML={{
                        __html: `
                          <iframe
                            src="https://api.leadconnectorhq.com/widget/form/IDaFPswHrAAqpJNfn2i2"
                            style="width:100%;height:617px;border:none;border-radius:4px"
                            id="inline-IDaFPswHrAAqpJNfn2i2" 
                            data-layout="{'id':'INLINE'}"
                            data-trigger-type="alwaysShow"
                            data-trigger-value=""
                            data-activation-type="alwaysActivated"
                            data-activation-value=""
                            data-deactivation-type="neverDeactivate"
                            data-deactivation-value=""
                            data-form-name="Ai Class Reminders - Email"
                            data-height="617"
                            data-layout-iframe-id="inline-IDaFPswHrAAqpJNfn2i2"
                            data-form-id="IDaFPswHrAAqpJNfn2i2"
                            title="Ai Class Reminders - Email"
                          ></iframe>
                          <script src="https://link.msgsndr.com/js/form_embed.js"></script>
                        `
                      }}
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-center text-sm text-gray-600">Where are you located?</p>
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    onClick={() => {
                      // Show US form
                      const tempPrefs = { ...preferences, country: 'USA' };
                      setPreferences(tempPrefs);
                    }}
                    className="bg-white text-gray-800 border-2 border-gray-300 hover:bg-gray-50 h-auto py-6"
                  >
                    <div className="text-center">
                      <div className="text-4xl mb-2">🇺🇸</div>
                      <p className="font-semibold">I'm in the US</p>
                      <p className="text-xs text-gray-500">(Text Reminders)</p>
                    </div>
                  </Button>
                  <Button
                    onClick={() => {
                      // Show outside US form
                      const tempPrefs = { ...preferences, country: 'International' };
                      setPreferences(tempPrefs);
                    }}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90 h-auto py-6"
                  >
                    <div className="text-center">
                      <div className="text-4xl mb-2">🌍</div>
                      <p className="font-semibold">I'm Outside the US</p>
                      <p className="text-xs text-white/80">(Email Reminders)</p>
                    </div>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}