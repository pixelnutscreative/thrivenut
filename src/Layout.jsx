import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from './utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  Target, 
  Heart, 
  BookOpen, 
  Settings, 
  Menu, 
  X,
  LogOut,
  TrendingUp,
  Users,
  Video,
  Pill,
  Gift,
  Brain,
  Home,
  ChevronDown,
  ChevronRight,
  Bell,
  Share2,
  Music,
  Star,
  Lock,
  UserCog,
  SettingsIcon,
  Sparkles,
  Palette
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import TikTokAccessGate from './components/access/TikTokAccessGate';
import ImpersonationBanner, { getEffectiveUserEmail, isImpersonating } from './components/admin/ImpersonationBanner';
import NotificationBell from './components/notifications/NotificationBell';
import FloatingHelpButton from './components/support/FloatingHelpButton';

// Map module IDs to nav items
const moduleNavMap = {
  tiktok: ['TikTok'],
  gifter: ['Gift Gallery Gratitude'],
  goals: ['Goals', 'Goal Sharing'],
  wellness: ['Wellness'],
  supplements: ['Supplements'],
  medications: ['Medications'],
  pets: ['Pet Care'],
  care_reminders: ['Care Reminders'],
  people: ['My People'],
  journal: ['Journal'],
  mental_health: ['Mental Health'],
};

const allNavItems = [
  { name: 'Dashboard', icon: LayoutDashboard, path: 'Dashboard', alwaysShow: true },
  { name: 'Goals', icon: Target, path: 'Goals', moduleId: 'goals' },
  { name: 'Wellness', icon: Heart, isSection: true, moduleId: 'wellness', subItems: [
    { name: 'Daily Wellness', icon: Heart, path: 'Wellness' },
    { name: 'Supplements', icon: Pill, path: 'Supplements', moduleId: 'supplements' },
    { name: 'Medications', icon: Pill, path: 'Medications', moduleId: 'medications' },
    { name: 'Pet Care', icon: Heart, path: 'PetCare', moduleId: 'pets' },
    { name: 'Care Reminders', icon: Heart, path: 'CareReminders', moduleId: 'care_reminders' },
  ]},
  { name: 'My People', icon: Users, path: 'People', moduleId: 'people' },
  { name: 'Journal', icon: BookOpen, path: 'Journal', moduleId: 'journal' },
  { name: 'Mental Health', icon: Brain, path: 'NeurodivergentSettings', moduleId: 'mental_health' },
  { name: 'Social Media Suite', icon: TrendingUp, isSection: true, moduleId: 'tiktok', requiresTikTokAccess: true, subItems: [
            { name: 'Creator Contacts', icon: Users, path: 'TikTokContacts' },
            { name: 'Social Engagement', icon: Users, path: 'TikTokEngagement' },
            { name: 'Creator Calendar', icon: Video, path: 'LiveSchedule' },
            { name: 'Content Schedule', icon: TrendingUp, path: 'TikTokGoals' },
                              { name: 'Discover Creators', icon: Users, path: 'DiscoverCreators' },
            { name: '── Gift Gallery Gratitude ──', icon: Gift, isDivider: true },
            { name: 'Weekly Gallery', icon: Gift, path: 'WeeklyGifterGallery', moduleId: 'gifter' },
            { name: 'Song Generator', icon: Music, path: 'SongGenerator', moduleId: 'gifter' },
  ]},
  { name: 'SuperFan Access', icon: Star, path: 'SuperFanAccess', showWhenNoTikTokAccess: true },
  { name: "Pixel's Place", icon: Sparkles, isSection: true, moduleId: 'pixels_paradise', alwaysShow: true, subItems: [
            { name: 'Resources & Tools', icon: Palette, path: 'PixelsParadise' },
            { name: 'Live Reminders', icon: Bell, path: 'LiveReminders' },
          ]},
  { name: 'Support', icon: Heart, path: 'Support', alwaysShow: true },
    { name: 'Settings', icon: Settings, path: 'Settings', alwaysShow: true },
  { name: 'Admin Panel', icon: UserCog, path: 'Admin', adminOnly: true },
];

export default function Layout({ children, currentPageName }) {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [expandedSections, setExpandedSections] = useState(['TikTok', 'Wellness']);
  const [showAccessGate, setShowAccessGate] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  // Get effective email (real user or impersonated)
      const effectiveEmail = user ? getEffectiveUserEmail(user.email) : null;
      const currentlyImpersonating = isImpersonating();

      const { data: preferences } = useQuery({
        queryKey: ['preferences', effectiveEmail],
        queryFn: async () => {
          const prefs = await base44.entities.UserPreferences.filter({ user_email: effectiveEmail }, '-updated_date');
          return prefs[0] || null;
        },
        enabled: !!effectiveEmail,
      });

  const enabledModules = preferences?.enabled_modules || ['tiktok', 'gifter', 'goals', 'wellness', 'supplements', 'medications', 'pets', 'care_reminders', 'people', 'journal', 'mental_health'];
  const featureOrder = preferences?.feature_order || [];
  const hasTikTokAccess = preferences?.tiktok_access_approved || user?.email?.toLowerCase() === 'pixelnutscreative@gmail.com';
  const isAdmin = user?.email?.toLowerCase() === 'pixelnutscreative@gmail.com';

  // Filter and order nav items based on enabled modules and feature order
  const getOrderedNavItems = () => {
    // First filter based on enabled modules - but SHOW TikTok items always (gated by popup)
    // Also show disabled modules with a way to enable them
    let filtered = allNavItems.filter(item => {
      if (item.alwaysShow) return true;
      // Admin only items
      if (item.adminOnly) return isAdmin;
      // Hide SuperFan Access if user already has TikTok access
      if (item.showWhenNoTikTokAccess) return !hasTikTokAccess;
      // Show TikTok items for everyone (they'll be gated by popup)
      if (item.requiresTikTokAccess) return true;
      // Show all module sections (even disabled ones) so users can enable them
      if (item.isSection) return true;
      if (item.moduleId && !enabledModules.includes(item.moduleId)) return false;
      return true;
    }).map(item => {
      if (item.subItems) {
        const filteredSubItems = item.subItems.filter(sub => {
          if (!sub.moduleId) return true;
          return enabledModules.includes(sub.moduleId);
        });
        return { ...item, subItems: filteredSubItems };
      }
      return item;
    });

    // If there's a feature order, apply it
    if (featureOrder.length > 0) {
      const alwaysShowItems = filtered.filter(item => item.alwaysShow);
      const orderableItems = filtered.filter(item => !item.alwaysShow && item.moduleId);
      
      // Sort orderable items by feature order
      orderableItems.sort((a, b) => {
        const aIndex = featureOrder.indexOf(a.moduleId);
        const bIndex = featureOrder.indexOf(b.moduleId);
        if (aIndex === -1 && bIndex === -1) return 0;
        if (aIndex === -1) return 1;
        if (bIndex === -1) return -1;
        return aIndex - bIndex;
      });

      // Rebuild: Home, Dashboard first, then ordered features, then Settings at the end
      const home = alwaysShowItems.find(i => i.name === 'Home');
      const dashboard = alwaysShowItems.find(i => i.name === 'Dashboard');
      const settings = alwaysShowItems.find(i => i.name === 'Settings');
      
      return [home, dashboard, ...orderableItems, settings].filter(Boolean);
    }

    return filtered;
  };

  const handleNavClick = (item, e) => {
    // Check if this is a TikTok-gated item and user doesn't have access
    if (item.requiresTikTokAccess && !hasTikTokAccess) {
      e.preventDefault();
      setShowAccessGate(true);
      return false;
    }
    return true;
  };

  const navItems = getOrderedNavItems();

  const toggleSection = (sectionName) => {
    setExpandedSections(prev => 
      prev.includes(sectionName) 
        ? prev.filter(s => s !== sectionName)
        : [...prev, sectionName]
    );
  };

  const isSubItemActive = (item) => {
    if (item.subItems) {
      return item.subItems.some(sub => sub.path === currentPageName);
    }
    return false;
  };

  const handleLogout = async () => {
    await base44.auth.logout();
  };

  // Handle system theme detection
  const [systemDark, setSystemDark] = useState(
    typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => setSystemDark(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Get theme colors
  const primaryColor = preferences?.primary_color || '#1fd2ea';
  const accentColor = preferences?.accent_color || '#bd84f5';
  const themeType = preferences?.theme_type || 'light';
  const isDark = themeType === 'dark' || (themeType === 'system' && systemDark);

  // Don't show layout on onboarding or home page (home is public landing page)
  if (currentPageName === 'Onboarding' || currentPageName === 'Home') {
    return children;
  }

  const bgClass = isDark 
    ? 'bg-[#1f1f23] text-gray-100' 
    : 'bg-gradient-to-br from-teal-50 via-purple-50 to-blue-50 text-gray-900';

  const backgroundImageUrl = preferences?.background_image_url;

  const sidebarClass = isDark
    ? 'bg-[#2a2a30]/95 border-gray-700'
    : 'bg-white/95 border-gray-200';

  const textClass = isDark ? 'text-gray-100' : 'text-gray-800';
  const subtextClass = isDark ? 'text-gray-400' : 'text-gray-500';
  const hoverClass = isDark ? 'hover:bg-gray-700/50' : 'hover:bg-teal-50';

  return (
        <div 
          className={`min-h-screen ${bgClass} ${currentlyImpersonating ? 'pt-10' : ''}`} 
          style={{ 
            '--primary-color': primaryColor, 
            '--accent-color': accentColor,
            ...(backgroundImageUrl ? {
              backgroundImage: `url(${backgroundImageUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundAttachment: 'fixed'
            } : {})
          }}
        >
          <ImpersonationBanner />
      {/* Mobile Header */}
      <div className={`lg:hidden fixed top-0 left-0 right-0 z-50 backdrop-blur-sm border-b px-4 py-3 ${sidebarClass}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6924840d3628eabd1d7f8247/e225113d4_Untitleddesign.png" 
              alt="Thrive Nut" 
              className="w-8 h-8"
            />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-purple-400 bg-clip-text text-transparent">
              Thrive Nut
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {user && <NotificationBell userEmail={effectiveEmail} isDark={isDark} />}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween' }}
            className={`lg:hidden fixed inset-0 z-40 pt-16 ${isDark ? 'bg-[#1f1f23]' : 'bg-white'}`}
          >
            <nav className="p-6 space-y-1 overflow-y-auto max-h-[calc(100vh-8rem)]">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPageName === item.path;
                const isExpanded = expandedSections.includes(item.name);
                const hasActiveSubItem = isSubItemActive(item);

                if (item.isSection) {
                                        const isLocked = item.requiresTikTokAccess && !hasTikTokAccess;
                                        const isModuleDisabled = item.moduleId && !item.alwaysShow && !enabledModules.includes(item.moduleId);
                                        return (
                                          <div key={item.name}>
                                            <div className="flex items-center">
                                              <button
                                                onClick={(e) => {
                                                  if (isLocked) {
                                                    setShowAccessGate(true);
                                                  } else if (!isModuleDisabled) {
                                                    toggleSection(item.name);
                                                  }
                                                }}
                                                className={`flex-1 flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                                                  isModuleDisabled 
                                                    ? (isDark ? 'text-gray-500' : 'text-gray-400')
                                                    : hasActiveSubItem 
                                                      ? (isDark ? 'bg-gray-700 text-teal-400' : 'bg-teal-50 text-teal-700')
                                                      : (isDark ? 'text-gray-300 hover:bg-gray-700/50' : 'text-gray-700 hover:bg-teal-50')
                                                }`}
                                              >
                                                <div className="flex items-center gap-3">
                                                  <Icon className={`w-5 h-5 ${isModuleDisabled ? 'opacity-50' : ''}`} />
                                                  <span className={`font-medium ${isModuleDisabled ? 'opacity-50' : ''}`}>{item.name}</span>
                                                  {isLocked && <Lock className="w-3 h-3 text-amber-500" />}
                                                </div>
                                                {!isLocked && !isModuleDisabled && (isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />)}
                                              </button>
                                              {isModuleDisabled && (
                                                <Link
                                                  to={createPageUrl('Settings')}
                                                  onClick={() => setMobileMenuOpen(false)}
                                                  className={`p-1 rounded hover:bg-gray-200 ${isDark ? 'hover:bg-gray-700' : ''}`}
                                                  title="Enable in Settings"
                                                >
                                                  <Settings className="w-4 h-4 text-gray-400 hover:text-teal-500" />
                                                </Link>
                                              )}
                                            </div>
                                            {isExpanded && !isLocked && !isModuleDisabled && (
                                              <div className="ml-4 mt-1 space-y-1">
                                                {item.subItems.filter(sub => {
                                                  if (sub.moduleId && !enabledModules.includes(sub.moduleId)) return false;
                                                  return true;
                                                }).map(subItem => {
                                                  const SubIcon = subItem.icon;
                                                  const subIsActive = currentPageName === subItem.path;
                                                  
                                                  // Render dividers differently
                                                  if (subItem.isDivider) {
                                                    return (
                                                      <div key={subItem.name} className={`px-2 py-1 text-xs font-semibold ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                                        {subItem.name}
                                                      </div>
                                                    );
                                                  }
                                                  
                                                  return (
                                                    <Link
                                                      key={subItem.path}
                                                      to={createPageUrl(subItem.path)}
                                                      onClick={() => setMobileMenuOpen(false)}
                                                      className={`flex items-center gap-3 px-4 py-2 rounded-xl transition-all text-sm ${
                                                        subIsActive
                                                          ? 'text-white shadow-lg'
                                                          : (isDark ? 'text-gray-400 hover:bg-gray-700/50' : 'text-gray-600 hover:bg-teal-50')
                                                      }`}
                                                      style={subIsActive ? { background: `linear-gradient(to right, ${primaryColor}, ${accentColor})` } : {}}
                                                    >
                                                      <SubIcon className="w-4 h-4" />
                                                      <span>{subItem.name}</span>
                                                    </Link>
                                                  );
                                                })}
                                              </div>
                                            )}
                                          </div>
                                        );
                                      }

                                      return (
                                        <Link
                                          key={item.name}
                                          to={createPageUrl(item.path)}
                                          onClick={() => setMobileMenuOpen(false)}
                                          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                                            isActive
                                              ? 'text-white shadow-lg'
                                              : (isDark ? 'text-gray-300 hover:bg-gray-700/50' : 'text-gray-700 hover:bg-teal-50')
                                          }`}
                                          style={isActive ? { background: `linear-gradient(to right, ${primaryColor}, ${accentColor})` } : {}}
                                        >
                                          <Icon className="w-5 h-5" />
                                          <span className="font-medium">{item.name}</span>
                                        </Link>
                                      );
                                    })}
              
              {user && (
                <div className="pt-6 mt-6 border-t">
                  <p className="text-sm text-gray-500 mb-2">Signed in as</p>
                  <p className="font-semibold text-gray-800 mb-4">{user.email}</p>
                  <Button
                    onClick={handleLogout}
                    variant="outline"
                    className="w-full text-gray-700 border-gray-300 hover:bg-gray-100"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex">
        <div className={`fixed left-0 top-0 bottom-0 w-72 backdrop-blur-sm border-r p-6 flex flex-col ${sidebarClass}`}>
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <img 
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6924840d3628eabd1d7f8247/e225113d4_Untitleddesign.png" 
                  alt="Thrive Nut" 
                  className="w-10 h-10"
                />
                <h1 
                  className="text-3xl font-bold bg-clip-text text-transparent"
                  style={{ backgroundImage: `linear-gradient(to right, ${primaryColor}, ${accentColor})` }}
                >
                  Thrive Nut
                </h1>
              </div>
              {user && <NotificationBell userEmail={effectiveEmail} isDark={isDark} />}
            </div>
            <p className={`text-sm ${subtextClass}`}>Crush your goals, thrive daily</p>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPageName === item.path;
              const isExpanded = expandedSections.includes(item.name);
              const hasActiveSubItem = isSubItemActive(item);

              if (item.isSection) {
                                    const isLocked = item.requiresTikTokAccess && !hasTikTokAccess;
                                    const isModuleDisabled = item.moduleId && !item.alwaysShow && !enabledModules.includes(item.moduleId);
                                    return (
                                      <div key={item.name}>
                                        <div className="flex items-center">
                                          <button
                                            onClick={(e) => {
                                              if (isLocked) {
                                                setShowAccessGate(true);
                                              } else if (!isModuleDisabled) {
                                                toggleSection(item.name);
                                              }
                                            }}
                                            className={`flex-1 flex items-center justify-between px-4 py-2 rounded-xl transition-all ${
                                              isModuleDisabled 
                                                ? (isDark ? 'text-gray-500' : 'text-gray-400')
                                                : hasActiveSubItem 
                                                  ? (isDark ? 'bg-gray-700 text-teal-400' : 'bg-teal-50 text-teal-700')
                                                  : (isDark ? 'text-gray-300 hover:bg-gray-700/50' : 'text-gray-700 hover:bg-teal-50')
                                            }`}
                                          >
                                            <div className="flex items-center gap-3">
                                              <Icon className={`w-5 h-5 ${isModuleDisabled ? 'opacity-50' : ''}`} />
                                              <span className={`font-medium ${isModuleDisabled ? 'opacity-50' : ''}`}>{item.name}</span>
                                              {isLocked && <Lock className="w-3 h-3 text-amber-500" />}
                                            </div>
                                            {!isLocked && !isModuleDisabled && (isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />)}
                                          </button>
                                          {isModuleDisabled && (
                                            <Link
                                              to={createPageUrl('Settings')}
                                              className={`p-1 rounded hover:bg-gray-200 ${isDark ? 'hover:bg-gray-700' : ''}`}
                                              title="Enable in Settings"
                                            >
                                              <Settings className="w-4 h-4 text-gray-400 hover:text-teal-500" />
                                            </Link>
                                          )}
                                        </div>
                                        {isExpanded && !isLocked && !isModuleDisabled && (
                                          <div className="ml-4 mt-1 space-y-1">
                                            {item.subItems.filter(sub => {
                                              if (sub.moduleId && !enabledModules.includes(sub.moduleId)) return false;
                                              return true;
                                            }).map(subItem => {
                                              const SubIcon = subItem.icon;
                                              const subIsActive = currentPageName === subItem.path;
                                              
                                              // Render dividers differently
                                              if (subItem.isDivider) {
                                                return (
                                                  <div key={subItem.name} className={`px-2 py-1 text-xs font-semibold ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                                    {subItem.name}
                                                  </div>
                                                );
                                              }
                                              
                                              return (
                                                <Link
                                                  key={subItem.path}
                                                  to={createPageUrl(subItem.path)}
                                                  className={`flex items-center gap-3 px-4 py-2 rounded-xl transition-all text-sm ${
                                                    subIsActive
                                                      ? 'text-white shadow-lg'
                                                      : (isDark ? 'text-gray-400 hover:bg-gray-700/50' : 'text-gray-600 hover:bg-teal-50')
                                                  }`}
                                                  style={subIsActive ? { background: `linear-gradient(to right, ${primaryColor}, ${accentColor})` } : {}}
                                                >
                                                  <SubIcon className="w-4 h-4" />
                                                  <span>{subItem.name}</span>
                                                </Link>
                                              );
                                            })}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  }

                                  return (
                                    <Link
                                      key={item.name}
                                      to={createPageUrl(item.path)}
                                      className={`flex items-center gap-3 px-4 py-2 rounded-xl transition-all ${
                                        isActive
                                          ? 'text-white shadow-lg'
                                          : (isDark ? 'text-gray-300 hover:bg-gray-700/50' : 'text-gray-700 hover:bg-teal-50')
                                      }`}
                                      style={isActive ? { background: `linear-gradient(to right, ${primaryColor}, ${accentColor})` } : {}}
                                    >
                                      <Icon className="w-5 h-5" />
                                      <span className="font-medium">{item.name}</span>
                                    </Link>
                                  );
                                })}
          </nav>

          {user && (
                <div className={`pt-6 mt-6 border-t ${isDark ? 'border-gray-700' : ''}`}>
                  <p className={`text-sm ${subtextClass} mb-1`}>Signed in as</p>
                  <p className={`font-semibold ${textClass} mb-4 truncate`}>{user.email}</p>
                  <Button
                    onClick={handleLogout}
                    variant="outline"
                    className={`w-full ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'text-gray-700 border-gray-300 hover:bg-gray-100'}`}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
              )}
        </div>

        {/* Main Content */}
        <div className="ml-72 flex-1">
          {children}
        </div>
      </div>

      {/* Mobile Main Content */}
              <div className="lg:hidden pt-16">
                {children}
              </div>

              {/* TikTok Access Gate Modal */}
              <TikTokAccessGate 
                isOpen={showAccessGate} 
                onClose={() => setShowAccessGate(false)} 
              />

              {/* Floating Help Button */}
              <FloatingHelpButton pageName={currentPageName} userEmail={user?.email} />
            </div>
          );
        }