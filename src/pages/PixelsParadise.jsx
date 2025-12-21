1: import React, { useState, useEffect } from 'react';
   2: import { base44 } from '@/api/base44Client';
   3: import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
   4: import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
   5: import { Button } from '@/components/ui/button';
   6: import { Badge } from '@/components/ui/badge';
   7: import { Input } from '@/components/ui/input';
   8: import { Label } from '@/components/ui/label';
   9: import { Checkbox } from '@/components/ui/checkbox';
  10: import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
  11: import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
  12: import { ExternalLink, Sparkles, Search, Loader2, Zap, Crown, Bot, Palette, GraduationCap, Users, Wrench, Youtube, BookOpen, Bell, Check, X, ShoppingBag, Clock, Upload, Image as ImageIcon } from 'lucide-react';
  13: import ShopSection from '../components/pixelshop/ShopSection';
  14: import CustomGPTsSection from '../components/pixelshop/CustomGPTsSection';
  15: import PortfolioSection from '../components/portfolio/PortfolioSection';
  16: import { motion } from 'framer-motion';
  17: import { useTheme } from '../components/shared/useTheme';
  18: import { getEffectiveUserEmail } from '../components/admin/ImpersonationBanner';
  19: import ImageUploader from '../components/settings/ImageUploader';
  20: import { Textarea } from '@/components/ui/textarea';
  21: 
  22: // Pixel's AI Toolbox pricing options
  23: const aiToolboxOptions = [
  24:   { value: 'annual', label: '⭐ Annual (Best Value!) - $333.33/year', link: 'https://thenutsandbots.com/order-thenutsandbotsplusai-annual-8125-6335-3387-5540', badge: 'Best Value' },
  25:   { value: 'quarterly', label: '🗓️ Quarterly - $111/quarter', link: 'https://shop.pixelnutscreative.com/product-details/product/68d72e0097ff0c5ce998b466', badge: 'Quarterly' },
  26:   { value: 'monthly', label: '🗓️ Monthly - $77.77/month', link: 'https://shop.pixelnutscreative.com/product-details/product/68d733ea5847661b433808a3', badge: 'Monthly' },
  27:   { value: 'payment_plan', label: '💳 1 Year - Klarna/Afterpay - $333.33', link: 'https://shop.pixelnutscreative.com/product-details/product/69131c77b9c37c322d4cfefd', badge: 'Payment Plans' },
  28: ];
  29: 
  30: const workshopItems = [
  31:   { 
  32:     name: "Go Nuts! Content Creation Challenge", 
  33:     nickname: "AI CLASS",
  34:     description: "The legendary class where we go absolutely nuts creating content with AI. Warning: Side effects include uncontrollable creativity and an addiction to prompts. 🥜", 
  35:     link: 'https://pixelnutscreative.com/aiclass',
  36:     badge: '🔥 Fan Favorite',
  37:     schedule: 'T & Th 8am PST + Weekdays 3pm PST',
  38:     is_recurring: true,
  39:   },
  40: ];
  41: 
  42: const nutsAndBotsItem = {
  43:   name: 'The Nuts + Bots',
  44:   description: "Your all-in-one business command center. CRM, funnels, automations, AND Pixel's AI Toolbox included. It's like having a robot army... but friendlier. 🤖",
  45:   link: 'https://thenutsandbots.com/order-thenutsandbotsplusai-annual-8125-6335-3387-5540',
  46:   badge: '⚡ Includes AI Toolbox!',
  47:   note: 'White-label High Level + All AI Tools',
  48: };
  49: 
  50: const fallbackResources = [
  51:   { 
  52:     name: 'Magai', 
  53:     description: "Browser-based AI that actually remembers your conversations. Unlike my ex. 💅", 
  54:     link: 'https://magai.co/?via=blue', 
  55:     badge: '🔥 Recommended',
  56:     category: ['AI'],
  57:     keywords: ['ai', 'chat', 'assistant', 'writing', 'gpt', 'chatbot', 'personalities', 'browser']
  58:   },
  59:   { 
  60:     name: 'Suno', 
  61:     description: 'Turn your shower singing into actual songs. AI does the heavy lifting. ($10/mo for rights)', 
  62:     link: 'https://suno.com/invite/@iamnikolewithak',
  63:     category: ['AI'],
  64:     keywords: ['ai', 'music', 'songs', 'audio', 'create', 'generate', 'singing']
  65:   },
  66:   { 
  67:     name: 'Kling AI', 
  68:     description: 'Images to video magic. Your static pics are about to get a LOT more interesting.', 
  69:     link: 'https://klingai.com/h5-app/invitation?code=7BRNCEDRHUZE',
  70:     category: ['AI'],
  71:     keywords: ['ai', 'video', 'images', 'animation', 'create', 'generate']
  72:   },
  73:   { 
  74:     name: 'ElevenLabs', 
  75:     description: "Clone your voice so you don't have to talk anymore. Living the dream. 🎤", 
  76:     link: 'https://try.elevenlabs.io/vit4ewk7bgyi',
  77:     category: ['AI'],
  78:     keywords: ['ai', 'audio', 'voice', 'clone', 'sound', 'effects', 'music', 'text to speech', 'tts']
  79:   },
  80:   { 
  81:     name: 'Glam', 
  82:     description: 'Make your logo dance and yourself look fabulous. Win-win.', 
  83:     link: 'https://glam.onelink.me/OCYu/qi44plg8', 
  84:     badge: '📱 App',
  85:     category: ['AI'],
  86:     keywords: ['ai', 'logo', 'animate', 'animation', 'photos', 'selfie', 'app', 'mobile']
  87:   },
  88:   { 
  89:     name: 'Base44', 
  90:     description: 'Build apps without coding. Yes, this very app was made with it. Meta, right?', 
  91:     link: 'https://base44.pxf.io/c/5371887/2049275/25619?subId1=blue&trafcat=base',
  92:     category: ['Creative'],
  93:     keywords: ['no code', 'apps', 'websites', 'builder', 'create', 'development', 'software']
  94:   },
  95:   { 
  96:     name: 'Video Express', 
  97:     description: 'Images to videos - $179 ONE TIME. Unlimited forever. Do the math. 🧮', 
  98:     link: 'https://paykstrt.com/50942/156400', 
  99:     badge: '💎 One-Time',
 100:     category: ['Creative'],
 101:     keywords: ['video', 'images', 'create', 'animation', 'unlimited', 'one time', 'lifetime']
 102:   },
 103:   { 
 104:     name: 'Talking Photos', 
 105:     description: "Make any pic talk. Great for memes. Terrible for your ex's photos. $97 one time!", 
 106:     link: 'https://paykstrt.com/52357/156400', 
 107:     badge: '💎 One-Time',
 108:     category: ['Creative'],
 109:     keywords: ['video', 'photos', 'talking', 'cartoon', 'animation', 'one time', 'lifetime']
 110:   },
 111:   { 
 112:     name: 'Artistly', 
 113:     description: 'AI graphics on steroids. $149 one time = unlimited everything. Yes, really.', 
 114:     link: 'https://paykstrt.com/52357/156400', 
 115:     badge: '💎 One-Time',
 116:     category: ['Creative'],
 117:     keywords: ['ai', 'graphics', 'design', 'images', 'create', 'one time', 'lifetime', 'unlimited']
 118:   },
 119:   { 
 120:     name: "Let's Go Nuts", 
 121:     description: 'The community app where nuts gather. Available on both app stores! 🥜', 
 122:     link: 'https://keenkard.com/letsgonuts', 
 123:     badge: '📱 App',
 124:     category: ['Community'],
 125:     keywords: ['community', 'app', 'mobile', 'social', 'connect']
 126:   },
 127:   { 
 128:     name: 'AI Filmmaking (Skool)', 
 129:     description: "Learn to make films with AI for $5/mo. That's like... half a coffee. ☕", 
 130:     link: 'https://keenkard.com/aifilmmaking',
 131:     category: ['Learning'],
 132:     keywords: ['ai', 'film', 'video', 'learn', 'course', 'community', 'skool', 'filmmaking']
 133:   },
 134:   { 
 135:     name: 'MailChimp', 
 136:     description: "Email marketing that's actually FREE. Build that list, bestie! 📧", 
 137:     link: 'https://login.mailchimp.com/signup/?plan=free_monthly_plan_v0&locale=en', 
 138:     badge: '🆓 Free',
 139:     category: ['Business'],
 140:     keywords: ['email', 'marketing', 'newsletter', 'free', 'automation']
 141:   },
 142:   { 
 143:     name: 'Bellator Life', 
 144:     description: 'Digital vending machines = passive income while you sleep. Yes please.', 
 145:     link: 'https://bellatorlife.com/register?reference=iamnikolewithak',
 146:     category: ['Business'],
 147:     keywords: ['passive income', 'vending', 'digital', 'business', 'money', 'earn']
 148:   },
 149:   { 
 150:     name: 'Dreams Resources', 
 151:     description: 'Free business resources because we love free things. 🆓', 
 152:     link: 'https://dreamsresources.com/join/?refid=AA5551', 
 153:     badge: '🆓 Free',
 154:     category: ['Business'],
 155:     keywords: ['business', 'resources', 'tools', 'free']
 156:   },
 157: ];
 158: 
 159: const defaultCategories = ['All', 'AI', 'Creative', 'Business', 'Learning', 'Workshops', 'Community'];
 160: 
 161: export default function PixelsParadise() {
 162:   const queryClient = useQueryClient();
 163:   const [search, setSearch] = useState('');
 164:   const [selectedCategory, setSelectedCategory] = useState('All');
 165:   const [selectedPlan, setSelectedPlan] = useState('');
 166:   const [isAuthenticated, setIsAuthenticated] = useState(false);
 167:   const [showLiveReminders, setShowLiveReminders] = useState(false);
 168:   const [showAIClassModal, setShowAIClassModal] = useState(false);
 169:   const [user, setUser] = useState(null);
 170:   const [preferences, setPreferences] = useState(null);
 171:   const [reminderFormData, setReminderFormData] = useState({
 172:     email: '',
 173:     phone: '',
 174:     prefer_text: false,
 175:     prefer_email: true
 176:   });
 177:   const [reminderSubmitted, setReminderSubmitted] = useState(false);
 178:   const [showUploadTwin, setShowUploadTwin] = useState(false);
 179:   const [twinImage, setTwinImage] = useState('');
 180:   const [twinPrompt, setTwinPrompt] = useState('');
 181:   
 182:   const { isDark, bgClass, textClass, cardBgClass, subtextClass, primaryColor, accentColor } = useTheme();
 183: 
 184:   const effectiveEmail = user ? getEffectiveUserEmail(user.email) : null;
 185: 
 186:   // Fetch AI Platform User details for additional access checks
 187:   const { data: aiUser } = useQuery({
 188:     queryKey: ['aiPlatformUser', effectiveEmail],
 189:     queryFn: async () => {
 190:       if (!effectiveEmail) return null;
 191:       const users = await base44.entities.AIPlatformUser.filter({ user_email: effectiveEmail });
 192:       return users[0] || null;
 193:     },
 194:     enabled: !!effectiveEmail
 195:   });
 196: 
 197:   // Fetch uploaded digital twins
 198:   const { data: myTwins = [] } = useQuery({
 199:     queryKey: ['myDigitalTwins', effectiveEmail],
 200:     queryFn: async () => {
 201:       if (!effectiveEmail) return [];
 202:       return await base44.entities.CreatorPortfolio.filter({ 
 203:         creator_email: effectiveEmail,
 204:         content_type: 'digital_twin'
 205:       }, '-created_date');
 206:     },
 207:     enabled: !!effectiveEmail
 208:   });
 209: 
 210:   // Fetch ALL approved digital twins for gallery
 211:   const { data: galleryTwins = [] } = useQuery({
 212:     queryKey: ['galleryTwins'],
 213:     queryFn: async () => {
 214:       return await base44.entities.CreatorPortfolio.filter({ 
 215:         content_type: 'digital_twin',
 216:         approval_status: 'approved'
 217:       }, '-created_date');
 218:     }
 219:   });
 220: 
 221:   const hasAIToolbox = preferences?.subscription_product === 'pixels_toolbox_annual' || 
 222:                        preferences?.subscription_product === 'nuts_bots_annual' || 
 223:                        preferences?.has_annual_ai_plan ||
 224:                        (aiUser && (aiUser.platform === 'pixels_toolbox' || aiUser.platform === 'lets_go_nuts'));
 225:                        
 226:   const hasNutsBots = preferences?.subscription_product === 'nuts_bots_annual' || aiUser?.has_nuts_and_bots;
 227:   
 228:   // Considered "has digital twin" if marked in platform OR if they uploaded one
 229:   const hasDigitalTwin = preferences?.digital_twin_created || aiUser?.has_digital_twin || myTwins.length > 0;
 230: 
 231:   useEffect(() => {
 232:     base44.auth.isAuthenticated().then(setIsAuthenticated).catch(() => {});
 233:     base44.auth.me().then(async (userData) => {
 234:       setUser(userData);
 235:       const email = getEffectiveUserEmail(userData.email);
 236:       // Fetch preferences
 237:       const prefs = await base44.entities.UserPreferences.filter({ user_email: email });
 238:       if (prefs[0]) setPreferences(prefs[0]);
 239:     }).catch(() => {});
 240:   }, []);
 241: 
 242:   // Fetch custom categories
 243:   const { data: customCategories = [] } = useQuery({
 244:     queryKey: ['resourceCategories'],
 245:     queryFn: async () => {
 246:       try {
 247:         const cats = await base44.entities.ResourceCategory.filter({ is_active: true }, 'sort_order');
 248:         return cats.map(c => c.name);
 249:       } catch {
 250:         return [];
 251:       }
 252:     }
 253:   });
 254: 
 255:   const categories = customCategories.length > 0 
 256:     ? ['All', ...customCategories] 
 257:     : defaultCategories;
 258: 
 259:   // Live reminder signup query
 260:   const { data: existingSignup } = useQuery({
 261:     queryKey: ['liveReminderSignup', user?.email],
 262:     queryFn: async () => {
 263:       const signups = await base44.entities.LiveReminderSignup.filter({ created_by: user.email });
 264:       return signups[0] || null;
 265:     },
 266:     enabled: !!user,
 267:   });
 268: 
 269:   useEffect(() => {
 270:     if (existingSignup) {
 271:       setReminderFormData({
 272:         email: existingSignup.email || '',
 273:         phone: existingSignup.phone || '',
 274:         prefer_text: existingSignup.prefer_text || false,
 275:         prefer_email: existingSignup.prefer_email !== false
 276:       });
 277:       setReminderSubmitted(true);
 278:     }
 279:   }, [existingSignup]);
 280: 
 281:   const saveReminderMutation = useMutation({
 282:     mutationFn: async (data) => {
 283:       if (existingSignup) {
 284:         return await base44.entities.LiveReminderSignup.update(existingSignup.id, data);
 285:       }
 286:       return await base44.entities.LiveReminderSignup.create(data);
 287:     },
 288:     onSuccess: () => {
 289:       queryClient.invalidateQueries({ queryKey: ['liveReminderSignup'] });
 290:       setReminderSubmitted(true);
 291:     },
 292:   });
 293: 
 294:   const uploadTwinMutation = useMutation({
 295:     mutationFn: async () => {
 296:       const isTrusted = aiUser?.is_trusted_creator;
 297:       return await base44.entities.CreatorPortfolio.create({
 298:         creator_email: effectiveEmail,
 299:         creator_name: user?.full_name || 'Creator',
 300:         title: 'My Digital Twin',
 301:         description: 'My AI-generated digital twin',
 302:         content_type: 'digital_twin',
 303:         image_urls: [twinImage],
 304:         prompt_used: twinPrompt,
 305:         ai_tool_name: 'Midjourney/Other',
 306:         approval_status: isTrusted ? 'approved' : 'pending'
 307:       });
 308:     },
 309:     onSuccess: () => {
 310:       queryClient.invalidateQueries({ queryKey: ['myDigitalTwins'] });
 311:       setShowUploadTwin(false);
 312:       setTwinImage('');
 313:       setTwinPrompt('');
 314:       // Also notify backend if possible, but built-in notifications handle entity creation usually
 315:     }
 316:   });
 317: 
 318:   const handleReminderSubmit = (e) => {
 319:     e.preventDefault();
 320:     saveReminderMutation.mutate(reminderFormData);
 321:   };
 322: 
 323:   const { data: dbResources = [], isLoading } = useQuery({
 324:     queryKey: ['designResources'],
 325:     queryFn: () => base44.entities.DesignResource.filter({ is_active: true }, 'sort_order'),
 326:   });
 327: 
 328:   // Use database resources if available, otherwise fallback
 329:   const resources = dbResources.length > 0 ? dbResources : fallbackResources;
 330: 
 331:   const filteredResources = resources.filter(resource => {
 332:     const resourceCats = Array.isArray(resource.category) ? resource.category : [resource.category];
 333:     const matchesCategory = selectedCategory === 'All' || resourceCats.includes(selectedCategory);
 334:     const searchLower = search.toLowerCase();
 335:     const matchesSearch = !search || 
 336:       resource.name.toLowerCase().includes(searchLower) ||
 337:       resource.description.toLowerCase().includes(searchLower) ||
 338:       (resource.keywords && resource.keywords.some(k => k.includes(searchLower)));
 339:     return matchesCategory && matchesSearch;
 340:   });
 341: 
 342:   const handlePlanSelect = (value) => {
 343:     setSelectedPlan(value);
 344:     const option = aiToolboxOptions.find(o => o.value === value);
 345:     if (option) {
 346:       window.open(option.link, '_blank');
 347:     }
 348:   };
 349: 
 350:   // Gradient style using theme colors
 351:   const gradientStyle = { background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})` };
 352:   const gradientTextStyle = { backgroundImage: `linear-gradient(to right, ${primaryColor}, ${accentColor})` };
 353: 
 354:   return (
 355:     <div className={`min-h-screen ${bgClass} p-4 md:p-8`}>
 356:       <div className="max-w-6xl mx-auto space-y-8">
 357:         {isLoading && (
 358:           <div className="flex justify-center py-4">
 359:             <Loader2 className="w-6 h-6 animate-spin" style={{ color: primaryColor }} />
 360:           </div>
 361:         )}
 362: 
 363:         {/* Header with Live Reminder Bell */}
 364:         <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-4">
 365:           <div className="flex-1 text-center space-y-4">
 366:             <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent flex items-center justify-center gap-2 md:gap-3" style={gradientTextStyle}>
 367:               <Sparkles className="w-8 md:w-10 h-8 md:h-10" style={{ color: primaryColor }} />
 368:               Pixel's Place
 369:             </h1>
 370:             <p className={`${subtextClass} max-w-2xl mx-auto text-sm md:text-base px-4`}>
 371:               Your one-stop shop for all things Pixel Nuts Creative! Links, programs, tools, subscriptions, affiliate goodies, 
 372:               free trainings, and everything else I've hoarded like a digital squirrel. 🐿️
 373:             </p>
 374:           </div>
 375:           
 376:           {/* Big Bell */}
 377:           <button
 378:             onClick={() => setShowLiveReminders(true)}
 379:             className="flex-shrink-0 w-12 md:w-14 h-12 md:h-14 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105 transition-all"
 380:             style={gradientStyle}
 381:             title="Get Live Reminders"
 382:           >
 383:             <Bell className="w-6 md:w-7 h-6 md:h-7 text-white" />
 384:           </button>
 385:         </div>
 386: 
 387:         {/* ===== WORKSHOPS & CLASSES - TOP SECTION ===== */}
 388:         {/* Hide AI Class if already subscribed */}
 389:         {!hasAIToolbox && (
 390:           <div className="space-y-4">
 391:             <h2 className={`text-xl font-bold ${textClass} flex items-center gap-2`}>
 392:               <GraduationCap className="w-5 h-5" style={{ color: primaryColor }} />
 393:               Workshops & Classes
 394:               <span className={`text-sm font-normal ${subtextClass}`}>(where the magic happens)</span>
 395:             </h2>
 396:             {workshopItems.map((workshop) => (
 397:               <Card 
 398:                 key={workshop.name}
 399:                 className={`overflow-hidden hover:shadow-lg transition-all cursor-pointer group`}
 400:                 style={{ 
 401:                   background: isDark 
 402:                     ? `linear-gradient(135deg, ${primaryColor}20, ${accentColor}20)` 
 403:                     : `linear-gradient(135deg, ${primaryColor}15, ${accentColor}15)`,
 404:                   borderColor: isDark ? `${primaryColor}50` : `${primaryColor}40`
 405:                 }}
 406:                 onClick={() => window.open(workshop.link, '_blank')}
 407:               >
 408:                 <CardContent className="p-5 space-y-2">
 409:                   <div className="flex items-start justify-between gap-2">
 410:                     <div>
 411:                       <h3 className={`font-bold text-lg ${textClass} group-hover:opacity-80 transition-colors`}>
 412:                         {workshop.name}
 413:                       </h3>
 414:                       {workshop.nickname && (
 415:                         <span className="text-2xl font-black block mt-1 mb-2" style={{ color: primaryColor }}>{workshop.nickname}</span>
 416:                       )}
 417:                     </div>
 418:                     <ExternalLink className="w-4 h-4 text-gray-400 group-hover:opacity-80 flex-shrink-0 mt-1" style={{ color: primaryColor }} />
 419:                   </div>
 420:                   <p className={`text-sm ${subtextClass}`}>{workshop.description}</p>
 421:                   <div className="flex flex-wrap items-center gap-2 pt-1">
 422:                     {workshop.schedule && (
 423:                       <Badge className="text-xs border-0" style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}>
 424:                         🗓️ {workshop.schedule}
 425:                       </Badge>
 426:                     )}
 427:                     {workshop.badge && (
 428:                       <Badge className="text-xs border-0" style={{ backgroundColor: `${accentColor}20`, color: accentColor }}>{workshop.badge}</Badge>
 429:                     )}
 430:                   </div>
 431:                   
 432:                   <div className="pt-4">
 433:                     <Button 
 434:                       className="w-full text-white font-bold text-lg h-12 shadow-lg hover:scale-[1.02] transition-transform"
 435:                       style={gradientStyle}
 436:                     >
 437:                       REGISTER FOR FREE
 438:                     </Button>
 439:                   </div>
 440:                 </CardContent>
 441:               </Card>
 442:             ))}
 443:           </div>
 444:         )}
 445: 
 446:         {/* ===== DIGITAL TWIN SECTION ===== */}
 447:         {/* 1. Show CTA if they haven't uploaded/created one */}
 448:         {!hasDigitalTwin && (
 449:           <div className="rounded-2xl p-6 md:p-8 text-white shadow-2xl" style={{ background: `linear-gradient(135deg, ${accentColor}, ${primaryColor})` }}>
 450:             <div className="flex flex-col md:flex-row items-center gap-6">
 451:               <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 animate-pulse">
 452:                 <Bot className="w-8 h-8 text-white" />
 453:               </div>
 454:               <div className="flex-1 text-center md:text-left">
 455:                 <h2 className="text-2xl font-bold mb-2">Have you created your Digital Twin yet?</h2>
 456:                 <p className="text-white/90 mb-4">
 457:                   Clone yourself (digitally!) so you can be in two places at once. It's the ultimate productivity hack.
 458:                 </p>
 459:                 <div className="flex gap-3 justify-center md:justify-start">
 460:                   <Button 
 461:                     onClick={() => window.open('https://create.letsgonuts.ai', '_blank')}
 462:                     className="bg-white text-purple-600 font-bold hover:bg-gray-100"
 463:                   >
 464:                     Start Cloning Now
 465:                   </Button>
 466:                   <Button 
 467:                     onClick={() => setShowUploadTwin(true)}
 468:                     variant="outline"
 469:                     className="bg-purple-600 border-white text-white hover:bg-purple-700 hover:text-white"
 470:                   >
 471:                     I Have One! Upload It
 472:                   </Button>
 473:                 </div>
 474:               </div>
 475:             </div>
 476:           </div>
 477:         )}
 478: 
 479:         {/* 2. Show Digital Twin Gallery if they HAVE created one */}
 480:         {hasDigitalTwin && (
 481:           <div className="space-y-4">
 482:             <div className="flex items-center justify-between">
 483:               <h2 className={`text-xl font-bold ${textClass} flex items-center gap-2`}>
 484:                 <Bot className="w-5 h-5" style={{ color: primaryColor }} />
 485:                 Digital Twin Gallery
 486:               </h2>
 487:               <Button onClick={() => setShowUploadTwin(true)} size="sm" variant="outline">
 488:                 <Upload className="w-4 h-4 mr-2" /> Share Twin
 489:               </Button>
 490:             </div>
 491: 
 492:             {/* Pending twins message */}
 493:             {myTwins.some(t => t.approval_status === 'pending') && (
 494:               <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm flex items-center gap-2">
 495:                 <Clock className="w-4 h-4" />
 496:                 Your uploaded twin is pending approval. Hang tight!
 497:               </div>
 498:             )}
 499: 
 500:             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
 501:               {/* My Approved Twins */}
 502:               {myTwins.filter(t => t.approval_status === 'approved').map(twin => (
 503:                 <Card key={twin.id} className="overflow-hidden">
 504:                   <div className="aspect-square bg-gray-100 relative">
 505:                     <img src={twin.image_urls[0]} alt="Digital Twin" className="w-full h-full object-cover" />
 506:                     <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 text-center">
 507:                       My Twin
 508:                     </div>
 509:                   </div>
 510:                 </Card>
 511:               ))}
 512:               {/* Gallery Twins (Other people) */}
 513:               {galleryTwins.filter(t => t.creator_email !== effectiveEmail).slice(0, 8).map(twin => (
 514:                 <Card key={twin.id} className="overflow-hidden cursor-pointer group hover:shadow-lg transition-all">
 515:                   <div className="aspect-square bg-gray-100 relative">
 516:                     <img src={twin.image_urls[0]} alt="Digital Twin" className="w-full h-full object-cover" />
 517:                     <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
 518:                       <p className="text-white text-xs font-bold text-center px-2">
 519:                         Created by<br/>{twin.creator_name}
 520:                       </p>
 521:                     </div>
 522:                   </div>
 523:                   {twin.prompt_used && (
 524:                     <CardContent className="p-2 bg-gray-50 border-t">
 525:                       <p className="text-[10px] text-gray-500 line-clamp-2 italic">"{twin.prompt_used}"</p>
 526:                     </CardContent>
 527:                   )}
 528:                 </Card>
 529:               ))}
 530:             </div>
 531:           </div>
 532:         )}
 533: 
 534:         {/* ===== PIXEL'S AI TOOLBOX + NUTS & BOTS ===== */}
 535:         {(!hasAIToolbox || !hasNutsBots) && (
 536:           <div className="rounded-2xl p-6 md:p-8 text-white shadow-2xl space-y-6" style={gradientStyle}>
 537:             {/* AI Toolbox - Hide if subscribed */}
 538:             {!hasAIToolbox && (
 539:               <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
 540:                 <div className="flex-shrink-0">
 541:                   <div className="w-16 md:w-20 h-16 md:h-20 bg-white/20 rounded-2xl flex items-center justify-center">
 542:                     <Zap className="w-8 md:w-10 h-8 md:h-10 text-yellow-300" />
 543:                   </div>
 544:                 </div>
 545:                 <div className="flex-1 text-center md:text-left">
 546:                   <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-2">
 547:                     <Crown className="w-5 md:w-6 h-5 md:h-6 text-yellow-300" />
 548:                     <h2 className="text-xl md:text-2xl lg:text-3xl font-bold">Pixel's AI Toolbox</h2>
 549:                   </div>
 550:                   <p className="text-white/90 mb-4 text-sm md:text-base">
 551:                     Access the most amazing collection of 300+ AI tools to do anything you could possibly imagine (almost, except AI video).
 552:                     <br /><br />
 553:                     Basically it's for <strong>less than one dollar a day</strong> when paid annually!
 554:                     <br />
 555:                     Also includes <strong>seven AI classes each week</strong> where you can ask questions, get new tools, and get specific help for your needs! 🤯
 556:                   </p>
 557:                   <div className="flex flex-col gap-3">
 558:                     <Select value={selectedPlan} onValueChange={handlePlanSelect}>
 559:                       <SelectTrigger className="w-full bg-white/20 border-white/30 text-white">
 560:                         <SelectValue placeholder="Get access now..." />
 561:                       </SelectTrigger>
 562:                       <SelectContent>
 563:                         {aiToolboxOptions.map(option => (
 564:                           <SelectItem key={option.value} value={option.value}>
 565:                             {option.label}
 566:                           </SelectItem>
 567:                         ))}
 568:                       </SelectContent>
 569:                     </Select>
 570:                     <span className="text-white/70 text-xs md:text-sm text-center md:text-left">Pick one and let's GO! ⬆️</span>
 571:                   </div>
 572:                 </div>
 573:               </div>
 574:             )}
 575:             
 576:             {/* WANT IT ALL - Nuts + Bots inside the box - Hide if subscribed to Nuts + Bots */}
 577:             {!hasNutsBots && (
 578:               <div className="bg-white/15 backdrop-blur rounded-xl p-4 md:p-5 border border-white/20">
 579:                 <div className="flex flex-col md:flex-row items-center gap-4">
 580:                   <div className="flex-shrink-0">
 581:                     <div className="w-12 md:w-14 h-12 md:h-14 bg-white/30 rounded-xl flex items-center justify-center">
 582:                       <Bot className="w-6 md:w-7 h-6 md:h-7 text-white" />
 583:                     </div>
 584:                   </div>
 585:                   <div className="flex-1 text-center md:text-left">
 586:                     <h3 className="text-lg md:text-xl font-bold flex flex-wrap items-center justify-center md:justify-start gap-2">
 587:                       🚀 WANT IT ALL? Get The Nuts + Bots
 588:                     </h3>
 589:                     <p className="text-white/90 text-xs md:text-sm mt-1">
 590:                       All the tools you need to run your business - CRM, funnels, automations, AND Pixel's AI Toolbox included!
 591:                     </p>
 592:                     <div className="flex flex-col sm:flex-row flex-wrap items-center gap-2 md:gap-3 mt-3 justify-center md:justify-start">
 593:                       <Button
 594:                         onClick={() => window.open('https://thenutsandbots.com/order-thenutsandbotsplusai-annual-8125-6335-3387-5540', '_blank')}
 595:                         className="bg-white/30 hover:bg-white/40 text-white w-full sm:w-auto font-bold text-lg h-12"
 596:                         size="lg"
 597:                       >
 598:                         See Pricing & Get Started
 599:                       </Button>
 600:                     </div>
 601:                     <p className="text-white/90 text-sm mt-3 text-center md:text-left font-semibold">
 602:                       🎉 Use coupon code <span className="text-yellow-300 font-bold bg-black/20 px-1 rounded">NIKOLE</span> to get $111 off the annual plan!
 603:                     </p>
 604:                   </div>
 605:                 </div>
 606:               </div>
 607:             )}
 608:           </div>
 609:         )}
 610: 
 611: 
 612: 
 613:         {/* ===== PIXEL'S CREATIVE SHOP ===== */}
 614:         <div className={`pt-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
 615:           <ShopSection isDark={isDark} primaryColor={primaryColor} accentColor={accentColor} />
 616:         </div>
 617: 
 618:         {/* ===== CREATOR PORTFOLIO SHOWCASE ===== */}
 619:         <div className={`pt-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
 620:           <PortfolioSection 
 621:             userEmail={effectiveEmail}
 622:             isAuthenticated={isAuthenticated}
 623:             primaryColor={primaryColor}
 624:             accentColor={accentColor}
 625:             isDark={isDark}
 626:           />
 627:         </div>
 628: 
 629:         {/* ===== SEARCH & FILTERS ===== */}
 630:         <div className={`space-y-4 pt-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
 631:           <h2 className={`text-xl font-bold ${textClass} flex items-center gap-2`}>
 632:             <Wrench className="w-5 h-5" style={{ color: primaryColor }} />
 633:             Products I Actually Use and LOVE
 634:             <span className={`text-sm font-normal ${subtextClass}`}>(the good stuff)</span>
 635:           </h2>
 636: 
 637:           {/* Search */}
 638:           <div className="relative max-w-md mx-auto">
 639:             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
 640:             <Input
 641:               placeholder="Search tools (e.g., video, music, ai, business...)"
 642:               value={search}
 643:               onChange={(e) => setSearch(e.target.value)}
 644:               className={`pl-10 ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white/80'}`}
 645:             />
 646:           </div>
 647: 
 648:           {/* Category Filter */}
 649:           <div className="flex flex-wrap justify-center gap-2">
 650:             {categories.map(cat => (
 651:               <Button
 652:                 key={cat}
 653:                 variant={selectedCategory === cat ? 'default' : 'outline'}
 654:                 size="sm"
 655:                 onClick={() => setSelectedCategory(cat)}
 656:                 className={selectedCategory === cat ? 'text-white' : (isDark ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600' : '')}
 657:                 style={selectedCategory === cat ? gradientStyle : {}}
 658:               >
 659:                 {cat}
 660:               </Button>
 661:             ))}
 662:           </div>
 663:         </div>
 664: 
 665:         {/* Resource Cards Grid */}
 666:         <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
 667:           {filteredResources.map((resource) => {
 668:             const resourceCats = Array.isArray(resource.category) ? resource.category : [resource.category];
 669:             return (
 670:               <Card 
 671:                 key={resource.name} 
 672:                 className={`${isDark ? 'bg-gray-800/90' : 'bg-white/90'} backdrop-blur overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group`}
 673:                 onClick={() => window.open(resource.link, '_blank')}
 674:               >
 675:                 <div className="h-2" style={gradientStyle} />
 676:                 <CardContent className="p-4 space-y-2">
 677:                   <div className="flex items-start justify-between gap-2">
 678:                     <h3 className={`font-bold text-lg ${textClass} group-hover:opacity-80 transition-colors`}>
 679:                       {resource.name}
 680:                     </h3>
 681:                     <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" style={{ color: primaryColor }} />
 682:                   </div>
 683:                   <p className={`text-sm ${subtextClass}`}>{resource.description}</p>
 684:                   <div className="flex items-center justify-between pt-1 flex-wrap gap-1">
 685:                     {resourceCats.slice(0, 2).map(cat => (
 686:                       <Badge key={cat} variant="outline" className="text-xs" style={{ borderColor: primaryColor, color: primaryColor }}>
 687:                         {cat}
 688:                       </Badge>
 689:                     ))}
 690:                     {resource.badge && (
 691:                       <Badge className="text-xs border-0" style={{ backgroundColor: `${accentColor}20`, color: accentColor }}>
 692:                         {resource.badge}
 693:                       </Badge>
 694:                     )}
 695:                   </div>
 696:                 </CardContent>
 697:               </Card>
 698:             );
 699:           })}
 700:         </div>
 701: 
 702:         {filteredResources.length === 0 && (
 703:           <div className="text-center py-12">
 704:             <p className={subtextClass}>No resources found matching "{search}". Maybe try "free stuff"? 😏</p>
 705:           </div>
 706:         )}
 707: 
 708:         {/* Quick Links Section */}
 709:         <div className={`grid sm:grid-cols-2 gap-4 pt-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
 710:           <Card 
 711:             className="cursor-pointer hover:shadow-lg transition-all"
 712:             style={{ 
 713:               background: isDark 
 714:                 ? `linear-gradient(135deg, ${primaryColor}20, ${accentColor}20)` 
 715:                 : `linear-gradient(135deg, ${primaryColor}10, ${accentColor}10)`,
 716:               borderColor: `${primaryColor}40`
 717:             }}
 718:             onClick={() => window.open('https://youtube.com/@pixelnutscreative', '_blank')}
 719:           >
 720:             <CardContent className="p-4 flex items-center gap-4">
 721:               <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={gradientStyle}>
 722:                 <Youtube className="w-6 h-6 text-white" />
 723:               </div>
 724:               <div>
 725:                 <h3 className={`font-bold ${textClass}`}>YouTube Channel</h3>
 726:                 <p className={`text-sm ${subtextClass}`}>Free tutorials & behind the scenes chaos</p>
 727:               </div>
 728:             </CardContent>
 729:           </Card>
 730:           <Card 
 731:             className="cursor-pointer hover:shadow-lg transition-all"
 732:             style={{ 
 733:               background: isDark 
 734:                 ? `linear-gradient(135deg, ${primaryColor}20, ${accentColor}20)` 
 735:                 : `linear-gradient(135deg, ${primaryColor}10, ${accentColor}10)`,
 736:               borderColor: `${primaryColor}40`
 737:             }}
 738:             onClick={() => setShowAIClassModal(true)}
 739:           >
 740:             <CardContent className="p-4 flex items-center gap-4">
 741:               <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={gradientStyle}>
 742:                 <BookOpen className="w-6 h-6 text-white" />
 743:               </div>
 744:               <div>
 745:                 <h3 className={`font-bold ${textClass}`}>Free Trainings</h3>
 746:                 <p className={`text-sm ${subtextClass}`}>Join the Go Nuts! AI Class - 7 times a week!</p>
 747:               </div>
 748:             </CardContent>
 749:           </Card>
 750:         </div>
 751: 
 752:         {/* Footer */}
 753:         <div className={`text-center pt-6 ${subtextClass} text-sm`}>
 754:           <p>Made with 💜 and probably too much coffee by @PixelNutsCreative</p>
 755:           <p className="text-xs mt-1">Some links are affiliate links - thanks for supporting! 🥜</p>
 756:         </div>
 757:       </div>
 758: 
 759:       {/* Upload Digital Twin Modal */}
 760:       <Dialog open={showUploadTwin} onOpenChange={setShowUploadTwin}>
 761:         <DialogContent className="max-w-lg">
 762:           <DialogHeader>
 763:             <DialogTitle>Share Your Digital Twin</DialogTitle>
 764:           </DialogHeader>
 765:           <div className="space-y-4">
 766:             <div className="bg-purple-50 p-3 rounded-lg text-sm text-purple-800">
 767:               Upload your AI-generated twin! It will be reviewed by admin before appearing in the public gallery.
 768:             </div>
 769:             <div className="space-y-2">
 770:               <Label>Your Twin Image</Label>
 771:               <ImageUploader
 772:                 label="Upload Image"
 773:                 currentImage={twinImage}
 774:                 onImageChange={setTwinImage}
 775:                 size="large"
 776:               />
 777:             </div>
 778:             <div className="space-y-2">
 779:               <Label>Prompt Used (Optional)</Label>
 780:               <Textarea
 781:                 placeholder="Share the prompt you used to generate this..."
 782:                 value={twinPrompt}
 783:                 onChange={(e) => setTwinPrompt(e.target.value)}
 784:                 rows={3}
 785:               />
 786:             </div>
 787:             <Button 
 788:               onClick={() => uploadTwinMutation.mutate()}
 789:               disabled={!twinImage || uploadTwinMutation.isPending}
 790:               className="w-full"
 791:               style={gradientStyle}
 792:             >
 793:               {uploadTwinMutation.isPending ? 'Uploading...' : 'Submit to Gallery'}
 794:             </Button>
 795:           </div>
 796:         </DialogContent>
 797:       </Dialog>
 798: 
 799:       {/* Live Reminders Popup */}
 800:       <Dialog open={showLiveReminders} onOpenChange={setShowLiveReminders}>
 801:         <DialogContent className="max-w-md">
 802:           <DialogHeader className="-m-6 mb-4 p-4 rounded-t-lg" style={gradientStyle}>
 803:             <DialogTitle className="text-white flex items-center gap-2">
 804:               <Bell className="w-5 h-5" />
 805:               Never Miss a Live!
 806:             </DialogTitle>
 807:           </DialogHeader>
 808:           
 809:           <p className="text-gray-600 text-sm mb-4">
 810:             Get notified when @pixelnutscreative goes live on TikTok
 811:           </p>
 812: 
 813:           {reminderSubmitted ? (
 814:             <motion.div
 815:               initial={{ opacity: 0, scale: 0.9 }}
 816:               animate={{ opacity: 1, scale: 1 }}
 817:               className="text-center py-6"
 818:             >
 819:               <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: `${primaryColor}20` }}>
 820:                 <Check className="w-7 h-7" style={{ color: primaryColor }} />
 821:               </div>
 822:               <h3 className="text-lg font-bold text-gray-800 mb-2">You're Signed Up!</h3>
 823:               <p className="text-gray-600 text-sm mb-4">
 824:                 You'll get notified before @pixelnutscreative goes live.
 825:               </p>
 826:               <Button
 827:                 variant="outline"
 828:                 size="sm"
 829:                 onClick={() => setReminderSubmitted(false)}
 830:               >
 831:                 Update My Info
 832:               </Button>
 833:             </motion.div>
 834:           ) : (
 835:             <form onSubmit={handleReminderSubmit} className="space-y-4">
 836:               <div className="space-y-2">
 837:                 <Label htmlFor="reminder-email">Email Address</Label>
 838:                 <Input
 839:                   id="reminder-email"
 840:                   type="email"
 841:                   placeholder="your@email.com"
 842:                   value={reminderFormData.email}
 843:                   onChange={(e) => setReminderFormData({ ...reminderFormData, email: e.target.value })}
 844:                 />
 845:               </div>
 846: 
 847:               <div className="space-y-2">
 848:                 <Label htmlFor="reminder-phone">Phone Number (for text reminders)</Label>
 849:                 <Input
 850:                   id="reminder-phone"
 851:                   type="tel"
 852:                   placeholder="(555) 123-4567"
 853:                   value={reminderFormData.phone}
 854:                   onChange={(e) => setReminderFormData({ ...reminderFormData, phone: e.target.value })}
 855:                 />
 856:               </div>
 857: 
 858:               <div className="space-y-2">
 859:                 <Label>How would you like to be notified?</Label>
 860:                 <div className="flex flex-col gap-2">
 861:                   <div 
 862:                     className="flex items-center gap-3 p-2 border rounded-lg cursor-pointer hover:bg-gray-50"
 863:                     onClick={() => setReminderFormData({ ...reminderFormData, prefer_email: !reminderFormData.prefer_email })}
 864:                   >
 865:                     <Checkbox checked={reminderFormData.prefer_email} />
 866:                     <span className="text-sm">Email me before lives</span>
 867:                   </div>
 868:                   <div 
 869:                     className="flex items-center gap-3 p-2 border rounded-lg cursor-pointer hover:bg-gray-50"
 870:                     onClick={() => setReminderFormData({ ...reminderFormData, prefer_text: !reminderFormData.prefer_text })}
 871:                   >
 872:                     <Checkbox checked={reminderFormData.prefer_text} />
 873:                     <span className="text-sm">Text me before lives</span>
 874:                   </div>
 875:                 </div>
 876:               </div>
 877: 
 878:               <Button
 879:                 type="submit"
 880:                 className="w-full text-white"
 881:                 style={gradientStyle}
 882:                 disabled={saveReminderMutation.isPending || (!reminderFormData.email && !reminderFormData.phone)}
 883:               >
 884:                 {saveReminderMutation.isPending ? 'Saving...' : existingSignup ? 'Update My Info' : 'Sign Me Up!'}
 885:               </Button>
 886:             </form>
 887:           )}
 888: 
 889:           <div className="pt-4 border-t text-center">
 890:             <a
 891:               href="https://tiktok.com/@pixelnutscreative"
 892:               target="_blank"
 893:               rel="noopener noreferrer"
 894:               className="inline-flex items-center gap-2 text-sm hover:opacity-80"
 895:               style={{ color: primaryColor }}
 896:             >
 897:               <ExternalLink className="w-4 h-4" />
 898:               Follow @pixelnutscreative on TikTok
 899:             </a>
 900:           </div>
 901:         </DialogContent>
 902:       </Dialog>
 903: 
 904:       {/* AI Class Modal */}
 905:       <Dialog open={showAIClassModal} onOpenChange={setShowAIClassModal}>
 906:         <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
 907:           <DialogHeader className="-m-6 mb-4 p-6 rounded-t-lg bg-gradient-to-r from-cyan-400 to-blue-500">
 908:             <DialogTitle className="text-white text-2xl font-bold text-center">
 909:               🎨 AI CLASS IS FREE!
 910:             </DialogTitle>
 911:           </DialogHeader>
 912: 
 913:           <div className="space-y-6">
 914:             <div className="text-center space-y-2">
 915:               <h2 className="text-3xl font-bold text-gray-800">📅 AI Class Schedule</h2>
 916:               <p className="text-gray-600">
 917:                 You'll get reminder texts before each session so you never miss your spot.<br />
 918:                 When you're done, you can opt out of reminders with one tap — easy.
 919:               </p>
 920:             </div>
 921: 
 922:             <div className="grid md:grid-cols-2 gap-4">
 923:               <div className="p-4 bg-gray-800 text-white rounded-lg text-center">
 924:                 <div className="text-2xl mb-2">✅</div>
 925:                 <p className="font-semibold">Weekdays – 3 PM PST</p>
 926:               </div>
 927:               <div className="p-4 bg-gray-800 text-white rounded-lg text-center">
 928:                 <div className="text-2xl mb-2">✅</div>
 929:                 <p className="font-semibold">Tuesday + Thursday – 8 AM PST</p>
 930:               </div>
 931:             </div>
 932: 
 933:             <div className="text-center space-y-2">
 934:               <h3 className="text-xl font-bold text-gray-800">Choose your reminder style...</h3>
 935:               <p className="text-gray-600">US gets text. Everyone else gets email + WhatsApp. Easy.</p>
 936:             </div>
 937: 
 938:             {/* US vs Outside US Forms */}
 939:             {preferences?.country ? (
 940:               <div>
 941:                 {preferences.country === 'USA' ? (
 942:                   <div>
 943:                     <h4 className="text-center font-semibold mb-3 text-gray-700">🇺🇸 I'm in the US (Text Reminders)</h4>
 944:                     <div 
 945:                       dangerouslySetInnerHTML={{
 946:                         __html: `
 947:                           <iframe
 948:                             src="https://api.leadconnectorhq.com/widget/form/Ubgdqzxz5vZsDuqMB5ZW"
 949:                             style="width:100%;height:680px;border:none;border-radius:4px"
 950:                             id="inline-Ubgdqzxz5vZsDuqMB5ZW" 
 951:                             data-layout="{'id':'INLINE'}"
 952:                             data-trigger-type="alwaysShow"
 953:                             data-trigger-value=""
 954:                             data-activation-type="alwaysActivated"
 955:                             data-activation-value=""
 956:                             data-deactivation-type="neverDeactivate"
 957:                             data-deactivation-value=""
 958:                             data-form-name="Ai Class Text Reminders"
 959:                             data-height="680"
 960:                             data-layout-iframe-id="inline-Ubgdqzxz5vZsDuqMB5ZW"
 961:                             data-form-id="Ubgdqzxz5vZsDuqMB5ZW"
 962:                             title="Ai Class Text Reminders"
 963:                           ></iframe>
 964:                           <script src="https://link.msgsndr.com/js/form_embed.js"></script>
 965:                         `
 966:                       }}
 967:                     />
 968:                   </div>
 969:                 ) : (
 970:                   <div>
 971:                     <h4 className="text-center font-semibold mb-3 text-gray-700">🌍 I'm Outside the US (Email Reminders)</h4>
 972:                     <div 
 973:                       dangerouslySetInnerHTML={{
 974:                         __html: `
 975:                           <iframe
 976:                             src="https://api.leadconnectorhq.com/widget/form/IDaFPswHrAAqpJNfn2i2"
 977:                             style="width:100%;height:617px;border:none;border-radius:4px"
 978:                             id="inline-IDaFPswHrAAqpJNfn2i2" 
 979:                             data-layout="{'id':'INLINE'}"
 980:                             data-trigger-type="alwaysShow"
 981:                             data-trigger-value=""
 982:                             data-activation-type="alwaysActivated"
 983:                             data-activation-value=""
 984:                             data-deactivation-type="neverDeactivate"
 985:                             data-deactivation-value=""
 986:                             data-form-name="Ai Class Reminders - Email"
 987:                             data-height="617"
 988:                             data-layout-iframe-id="inline-IDaFPswHrAAqpJNfn2i2"
 989:                             data-form-id="IDaFPswHrAAqpJNfn2i2"
 990:                             title="Ai Class Reminders - Email"
 991:                           ></iframe>
 992:                           <script src="https://link.msgsndr.com/js/form_embed.js"></script>
 993:                         `
 994:                       }}
 995:                     />
 996:                   </div>
 997:                 )}
 998:               </div>
 999:             ) : (
1000:               <div className="space-y-4">
1001:                 <p className="text-center text-sm text-gray-600">Where are you located?</p>
1002:                 <div className="grid grid-cols-2 gap-4">
1003:                   <Button
1004:                     onClick={() => {
1005:                       // Show US form
1006:                       const tempPrefs = { ...preferences, country: 'USA' };
1007:                       setPreferences(tempPrefs);
1008:                     }}
1009:                     className="bg-white text-gray-800 border-2 border-gray-300 hover:bg-gray-50 h-auto py-6"
1010:                   >
1011:                     <div className="text-center">
1012:                       <div className="text-4xl mb-2">🇺🇸</div>
1013:                       <p className="font-semibold">I'm in the US</p>
1014:                       <p className="text-xs text-gray-500">(Text Reminders)</p>
1015:                     </div>
1016:                   </Button>
1017:                   <Button
1018:                     onClick={() => {
1019:                       // Show outside US form
1020:                       const tempPrefs = { ...preferences, country: 'International' };
1021:                       setPreferences(tempPrefs);
1022:                     }}
1023:                     className="bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90 h-auto py-6"
1024:                   >
1025:                     <div className="text-center">
1026:                       <div className="text-4xl mb-2">🌍</div>
1027:                       <p className="font-semibold">I'm Outside the US</p>
1028:                       <p className="text-xs text-white/80">(Email Reminders)</p>
1029:                     </div>
1030:                   </Button>
1031:                 </div>
1032:               </div>
1033:             )}
1034:           </div>
1035:         </DialogContent>
1036:       </Dialog>
1037:     </div>
1038:   );
1039: }