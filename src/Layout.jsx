import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { createPageUrl } from './utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, Target, Heart, BookOpen, Settings, Menu, X, LogOut, 
  TrendingUp, Users, Video, Pill, Gift, Brain, Home, ChevronDown, 
  ChevronRight, Bell, Share2, Music, Star, Lock, UserCog, Sparkles, 
  Palette, Eye, Bookmark, HandMetal, PawPrint, Search, MousePointerClick, 
  Calendar, Sun, Cross, Smile, FileText, StickyNote, Tablet, HelpCircle, 
  MessageCircle, Briefcase, DollarSign, Activity, Wallet
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import TikTokAccessGate from './components/access/TikTokAccessGate';
import ImpersonationBanner, { getEffectiveUserEmail, isImpersonating } from './components/admin/ImpersonationBanner';
import NotificationBell from './components/notifications/NotificationBell';
import FloatingHelpButton from './components/support/FloatingHelpButton';
import QuickActionsWidget from './components/widgets/QuickActionsWidget';
import SoundCloudPlayer, { FloatingSoundCloudPlayer, MobileSoundCloudPopup } from './components/widgets/SoundCloudPlayer.jsx';

// Icon mapping
const iconMap = {
  LayoutDashboard, Target, Heart, BookOpen, Settings, TrendingUp, Users, Video,
  Pill, Gift, Brain, Home, ChevronDown, ChevronRight, Bell, Share2, Music, Star,
  Lock, UserCog, Sparkles, Eye, Bookmark, HandMetal, PawPrint, Search, 
  MousePointerClick, Calendar, Sun, Cross, Smile, FileText, StickyNote, 
  Tablet, HelpCircle, MessageCircle, Briefcase, Palette, DollarSign, Activity
};

export default function Layout({ children, currentPageName }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [expandedSections, setExpandedSections] = useState(['Social Media Suite']); // Default expand
  const [showAccessGate, setShowAccessGate] = useState(false);
  const [userLoading, setUserLoading] = useState(true);

  // Authentication
  useEffect(() => {
    base44.auth.me()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setUserLoading(false));
  }, []);

  // Effective Email (Impersonation)
  const effectiveEmail = useMemo(() => {
    if (!user || !user.email) return null;
    try {
      return getEffectiveUserEmail(user.email) || null;
    } catch {
      return null;
    }
  }, [user]);
  
  const currentlyImpersonating = isImpersonating();

  // Preferences Query
  const { data: preferences } = useQuery({
    queryKey: ['preferences', effectiveEmail],
    queryFn: async () => {
      if (!effectiveEmail) return null;
      const prefs = await base44.entities.UserPreferences.filter({ user_email: effectiveEmail }, '-updated_date');
      return prefs[0] || null;
    },
    enabled: !!effectiveEmail,
  });

  // Admin Check
  const realUserEmail = user?.email ? user.email.toLowerCase() : '';
  const adminEmails = ['pixelnutscreative@gmail.com', 'pixel@thrivenut.app'];
  const isAdmin = realUserEmail && adminEmails.includes(realUserEmail);
  
  // Permissions
  const hasTikTokAccess = isAdmin || preferences?.tiktok_access_approved;
  // Determine if Bible features are enabled (default to true if undefined)
  const isBibleBeliever = preferences?.enable_bible_options !== false;
  const enabledModules = preferences?.enabled_modules || ['tiktok', 'gifter', 'goals', 'tasks', 'wellness', 'supplements', 'medications', 'pets', 'care_reminders', 'people', 'journal', 'mental_health', 'finance', 'activity'];

  // --- THEME HANDLING ---
  const primaryColor = preferences?.primary_color || '#1fd2ea';
  const accentColor = preferences?.accent_color || '#bd84f5';
  const menuColor = preferences?.menu_color || '#2a2a30';

  // Determine if menu text should be light or dark based on background luminance
  const isMenuDark = useMemo(() => {
    if (!menuColor) return true;
    const hex = menuColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance < 0.5;
  }, [menuColor]);

  // --- DYNAMIC NAMES ---
  const getDashboardName = () => {
    const name = preferences?.nickname || user?.full_name?.split(' ')[0] || 'My';
    return `${name}'s Day`;
  };

  const getPrayerName = () => {
    return isBibleBeliever ? 'Prayer Requests' : 'Send Light & Love';
  };

  // --- MENU GROUPS (Collapsible) ---
  const menuGroups = [
    {
      id: 'core',
      items: [
        { name: getDashboardName(), icon: LayoutDashboard, path: 'Dashboard', alwaysShow: true },
        { name: "Pixel's Place", icon: Sparkles, path: 'PixelsParadise', alwaysShow: true },
      ]
    },
    {
      id: 'goals',
      title: 'Goals + Growth',
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      items: [
        { name: 'Quick Notes', icon: StickyNote, path: 'QuickNotes', moduleId: 'quick_notes' },
        { name: 'Tasks', icon: FileText, path: 'Tasks', moduleId: 'tasks' },
        { name: 'Habits', icon: Target, path: 'Habits', moduleId: 'habits' },
        { name: 'Goals', icon: Target, path: 'Goals', moduleId: 'goals' },
        { name: 'Vision Board', icon: Eye, path: 'VisionBoard', moduleId: 'goals' },
        { name: 'Journal', icon: BookOpen, path: 'Journal', moduleId: 'journal' },
        { name: 'Finance', icon: Wallet, path: 'Finance', moduleId: 'finance' },
      ]
    },
    {
      id: 'friends',
      title: 'Friends + Loved Ones',
      color: 'text-cyan-400', // Turquoise
      bgColor: 'bg-cyan-500/10',
      items: [
        { name: 'My People', icon: Users, path: 'People', moduleId: 'people' },
        { name: 'Care Reminders', icon: Bell, path: 'CareReminders', moduleId: 'care_reminders' },
        { name: 'Pet Care', icon: PawPrint, path: 'PetCare', moduleId: 'pets' },
      ]
    },
    {
      id: 'faith',
      title: 'Faith & Spiritual',
      color: 'text-lime-400', // Lime Green
      bgColor: 'bg-lime-500/10',
      items: [
        { name: getPrayerName(), icon: Heart, path: 'PrayerRequests', moduleId: 'prayer' },
        { name: 'Holy Hitmakers', icon: Music, path: 'HolyHitmakers', requiresBibleBeliever: true },
        { name: 'Bible Resources', icon: BookOpen, path: 'BibleResources', requiresBibleBeliever: true },
      ]
    },
    {
      id: 'health',
      title: 'Mind + Body Health',
      color: 'text-yellow-400', // Gold/Yellow
      bgColor: 'bg-yellow-500/10',
      items: [
        { name: 'Mental Health', icon: Brain, path: 'NeurodivergentSettings', moduleId: 'mental_health' },
        { name: 'Daily Wellness', icon: Heart, path: 'Wellness', moduleId: 'wellness' },
        { name: 'Supplements', icon: Tablet, path: 'Supplements', moduleId: 'supplements' },
        { name: 'Medications', icon: Pill, path: 'Medications', moduleId: 'medications' },
        { name: 'Activity Tracker', icon: Activity, path: 'ActivityTracker', moduleId: 'activity' },
      ]
    },
    {
      id: 'creator',
      title: 'Creator Suite',
      color: 'text-orange-400', // Orange
      bgColor: 'bg-orange-500/10',
      items: [
        { name: 'Social Media Suite', icon: Share2, isSection: true, moduleId: 'tiktok', requiresTikTokAccess: true, subItems: [
          { name: 'Discover Creators', icon: Search, path: 'DiscoverCreators', highlight: true },
          { name: 'Live Engagement', icon: Activity, path: 'LiveEngagement', highlight: true },
          { name: 'Creator Contacts', icon: Users, path: 'TikTokContacts' },
          { name: 'Social Engagement', icon: MousePointerClick, path: 'TikTokEngagement' },
          { name: 'Content Calendar', icon: Calendar, path: 'LiveSchedule' },
          { name: 'Sunny Songbird', icon: Sun, path: 'SongGenerator' },
          { name: 'Gift Gallery Gratitude', icon: Gift, path: 'WeeklyGifterGallery' },
          { name: 'Love Away Giveaways', icon: Gift, path: 'LoveAway' },
          { name: 'Pictionary Helper', icon: Palette, path: 'PictionaryHelper' },
        ]},
        { name: 'Content Ideas', icon: Smile, path: 'SavedMotivations', moduleId: 'motivations' },
        { name: "Ping & Pong's Silly Songs", icon: Smile, externalUrl: 'https://sillysongs.pixelnutscreative.com' },
      ]
    },
    {
      id: 'support',
      title: 'Support & Settings',
      color: 'text-pink-400', // Hot Pink
      bgColor: 'bg-pink-500/10',
      items: [
        { name: 'Support', icon: HelpCircle, path: 'Support', alwaysShow: true },
        { name: 'Settings', icon: Settings, path: 'Settings', alwaysShow: true },
        { name: 'Admin Panel', icon: UserCog, path: 'Admin', adminOnly: true },
        { name: 'Community Map', icon: Share2, path: 'CommunityMap', adminOnly: true },
      ]
    }
  ];

  const [collapsedGroups, setCollapsedGroups] = useState([]);

  const toggleGroup = (groupId) => {
    setCollapsedGroups(prev => 
      prev.includes(groupId) 
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  // Logic to toggle expanded sections
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

  // --- STYLES ---
  const bgClass = 'bg-gradient-to-br from-teal-50 via-purple-50 to-blue-50 text-gray-900';

  const sidebarStyle = {
    backgroundColor: menuColor,
    borderColor: '#e5e7eb'
  };

  const menuTextClass = isMenuDark ? 'text-gray-100' : 'text-gray-800';
  const menuSubtextClass = isMenuDark ? 'text-gray-400' : 'text-gray-500';
  const menuHoverClass = isMenuDark ? 'hover:bg-white/10' : 'hover:bg-teal-50';
  const menuActiveClass = isMenuDark ? 'bg-white/10 text-teal-400' : 'bg-teal-50 text-teal-700';
  const menuBorderClass = isMenuDark ? 'border-gray-600' : 'border-gray-200';

  // Public/Auth Check
  const publicPages = ['Onboarding', 'Home', 'Pricing', 'SubscriptionSuccess'];
  if (publicPages.includes(currentPageName)) {
    return children;
  }

  if (!userLoading && !user) {
    window.location.href = createPageUrl('Home');
    return null;
  }

  const soundcloudUrl = preferences?.soundcloud_playlist_url || '';
  const soundcloudPosition = preferences?.soundcloud_player_position || 'hidden';

  return (
    <div 
      className={`min-h-screen ${bgClass} ${currentlyImpersonating ? 'pt-10' : ''}`} 
      style={{ 
        '--primary-color': primaryColor, 
        '--accent-color': accentColor,
      }}
    >
      <ImpersonationBanner />
      
      {/* Mobile Header */}
      <div className={`lg:hidden fixed top-0 left-0 right-0 z-50 backdrop-blur-sm border-b px-4 py-3 ${menuTextClass}`} style={sidebarStyle}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6924840d3628eabd1d7f8247/e225113d4_Untitleddesign.png" 
              alt="Let's Thrive!" 
              className="w-8 h-8"
            />
            <h1 className="text-xl font-bold bg-gradient-to-r from-teal-600 to-purple-400 bg-clip-text text-transparent whitespace-nowrap">
              Let's Thrive!
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {user && <NotificationBell userEmail={effectiveEmail} isDark={isMenuDark} />}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={menuTextClass}
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
            className="lg:hidden fixed inset-0 z-40 pt-16 flex flex-col"
            style={{ backgroundColor: menuColor }}
          >
            <nav className="flex-1 p-6 space-y-1 overflow-y-auto">
              {menuGroups.map((group) => {
                const isCollapsed = collapsedGroups.includes(group.id);
                
                return (
                  <div key={group.id} className="mb-2">
                    {group.title && (
                      <button
                        onClick={() => toggleGroup(group.id)}
                        className={`w-full px-2 py-2 mt-4 mb-1 text-xs font-bold uppercase tracking-wider ${group.color} ${group.bgColor} rounded-lg flex items-center justify-between hover:opacity-80 transition-opacity`}
                      >
                        <span>{group.title}</span>
                        {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    )}

                    <AnimatePresence>
                      {(!isCollapsed || !group.title) && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden space-y-1"
                        >
                          {group.items.map((item) => {
                            // Check permissions/modules
                            if (item.adminOnly && !isAdmin) return null;
                            if (item.requiresBibleBeliever && !isBibleBeliever) return null;
                            if (item.moduleId && !enabledModules.includes(item.moduleId) && !item.alwaysShow) return null;

                            const Icon = item.icon;
                            const isActive = currentPageName === item.path;
                            const isExpanded = expandedSections.includes(item.name);
                            const hasActiveSubItem = isSubItemActive(item);

                            // Section (Dropdown)
                            if (item.isSection) {
                              const isLocked = item.requiresTikTokAccess && !hasTikTokAccess;
                              return (
                                <div key={item.name}>
                                  <button
                                    onClick={() => isLocked ? setShowAccessGate(true) : toggleSection(item.name)}
                                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                                      hasActiveSubItem ? menuActiveClass : `${menuTextClass} ${menuHoverClass}`
                                    }`}
                                  >
                                    <div className="flex items-center gap-3">
                                      <Icon className="w-5 h-5" />
                                      <span className="font-medium">{item.name}</span>
                                      {isLocked && <Lock className="w-3 h-3 text-amber-500" />}
                                    </div>
                                    {!isLocked && (isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />)}
                                  </button>
                                  
                                  {isExpanded && !isLocked && (
                                    <div className="ml-4 mt-1 space-y-1">
                                      {item.subItems?.map(sub => (
                                        sub.externalUrl ? (
                                          <a
                                            key={sub.name}
                                            href={sub.externalUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={`flex items-center gap-3 px-4 py-2 rounded-xl text-sm ${menuTextClass} ${menuHoverClass}`}
                                          >
                                            <sub.icon className="w-4 h-4" />
                                            <span>{sub.name}</span>
                                            <span className="text-xs opacity-50">↗</span>
                                          </a>
                                        ) : (
                                          <Link
                                            key={sub.path}
                                            to={createPageUrl(sub.path)}
                                            onClick={() => setMobileMenuOpen(false)}
                                            className={`flex items-center gap-3 px-4 py-2 rounded-xl text-sm ${
                                              currentPageName === sub.path 
                                                ? (isMenuDark ? 'text-white bg-white/10' : 'text-teal-700 bg-teal-50')
                                                : `${menuTextClass} ${menuHoverClass}`
                                            }`}
                                          >
                                            <sub.icon className="w-4 h-4" />
                                            <span>{sub.name}</span>
                                          </Link>
                                        )
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            }

                            // Standard Link
                            if (item.externalUrl) {
                              return (
                                <a
                                  key={item.name}
                                  href={item.externalUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${menuTextClass} ${menuHoverClass}`}
                                >
                                  <Icon className="w-5 h-5" />
                                  <span className="font-medium">{item.name}</span>
                                  <span className="text-xs opacity-50">↗</span>
                                </a>
                              );
                            }

                            return (
                              <Link
                                key={item.path}
                                to={createPageUrl(item.path)}
                                onClick={() => setMobileMenuOpen(false)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                                  isActive 
                                    ? 'text-white shadow-lg'
                                    : `${menuTextClass} ${menuHoverClass}`
                                }`}
                                style={isActive ? { background: `linear-gradient(to right, ${primaryColor}, ${accentColor})` } : {}}
                              >
                                <Icon className="w-5 h-5" />
                                <span className="font-medium">{item.name}</span>
                              </Link>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}

              {user && (
                <div className={`pt-6 mt-6 border-t ${menuBorderClass}`}>
                  <Link
                    to={createPageUrl('Settings')}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all mb-3 ${menuTextClass} ${menuHoverClass}`}
                  >
                    <Settings className="w-4 h-4" />
                    <span className="font-medium">Settings</span>
                  </Link>
                  <Button
                    onClick={handleLogout}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    <LogOut className="w-4 h-4 mr-2" /> Sign Out
                  </Button>
                </div>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex">
        <div className="fixed left-0 top-0 bottom-0 w-72 backdrop-blur-sm border-r p-6 flex flex-col" style={sidebarStyle}>
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <img 
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6924840d3628eabd1d7f8247/e225113d4_Untitleddesign.png" 
                  alt="Let's Thrive!" 
                  className="w-10 h-10"
                />
                <h1 
                  className="text-2xl font-bold bg-clip-text text-transparent whitespace-nowrap"
                  style={{ backgroundImage: `linear-gradient(to right, ${primaryColor}, ${accentColor})` }}
                >
                  Let's Thrive!
                </h1>
              </div>
              {user && <NotificationBell userEmail={effectiveEmail} isDark={isMenuDark} />}
            </div>
            <p className={`text-sm ${menuSubtextClass}`}>Crush your goals, thrive daily</p>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto custom-scrollbar">
            {menuGroups.map((group) => {
              const isCollapsed = collapsedGroups.includes(group.id);
              
              return (
                <div key={group.id} className="mb-2">
                  {group.title && (
                    <button
                      onClick={() => toggleGroup(group.id)}
                      className={`w-full px-2 py-2 mt-4 mb-1 text-xs font-bold uppercase tracking-wider ${group.color} ${group.bgColor} rounded-lg flex items-center justify-between hover:opacity-80 transition-opacity`}
                    >
                      <span>{group.title}</span>
                      {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  )}

                  <AnimatePresence>
                    {(!isCollapsed || !group.title) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden space-y-1"
                      >
                        {group.items.map((item) => {
                          // Check permissions/modules
                          if (item.adminOnly && !isAdmin) return null;
                          if (item.requiresBibleBeliever && !isBibleBeliever) return null;
                          if (item.moduleId && !enabledModules.includes(item.moduleId) && !item.alwaysShow) return null;

                          const Icon = item.icon;
                          const isActive = currentPageName === item.path;
                          const isExpanded = expandedSections.includes(item.name);
                          const hasActiveSubItem = isSubItemActive(item);

                          // Section (Dropdown)
                          if (item.isSection) {
                            const isLocked = item.requiresTikTokAccess && !hasTikTokAccess;
                            return (
                              <div key={item.name}>
                                <button
                                  onClick={() => isLocked ? setShowAccessGate(true) : toggleSection(item.name)}
                                  className={`w-full flex items-center justify-between px-4 py-2 rounded-xl transition-all ${
                                    hasActiveSubItem ? menuActiveClass : `${menuTextClass} ${menuHoverClass}`
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <Icon className="w-5 h-5" />
                                    <span className="font-medium">{item.name}</span>
                                    {isLocked && <Lock className="w-3 h-3 text-amber-500" />}
                                  </div>
                                  {!isLocked && (isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />)}
                                </button>
                                
                                {isExpanded && !isLocked && (
                                  <div className="ml-4 mt-1 space-y-1">
                                    {item.subItems?.map(sub => (
                                      sub.externalUrl ? (
                                        <a
                                          key={sub.name}
                                          href={sub.externalUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className={`flex items-center gap-3 px-4 py-2 rounded-xl text-sm ${menuTextClass} ${menuHoverClass}`}
                                        >
                                          <sub.icon className="w-4 h-4" />
                                          <span>{sub.name}</span>
                                          <span className="text-xs opacity-50">↗</span>
                                        </a>
                                      ) : (
                                        <Link
                                          key={sub.path}
                                          to={createPageUrl(sub.path)}
                                          className={`flex items-center gap-3 px-4 py-2 rounded-xl text-sm ${
                                            currentPageName === sub.path 
                                              ? (isMenuDark ? 'text-white bg-white/10' : 'text-teal-700 bg-teal-50')
                                              : `${menuTextClass} ${menuHoverClass}`
                                          }`}
                                        >
                                          <sub.icon className="w-4 h-4" />
                                          <span>{sub.name}</span>
                                        </Link>
                                      )
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          }

                          // Standard Link
                          if (item.externalUrl) {
                            return (
                              <a
                                key={item.name}
                                href={item.externalUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`flex items-center gap-3 px-4 py-2 rounded-xl transition-all ${menuTextClass} ${menuHoverClass}`}
                              >
                                <Icon className="w-5 h-5" />
                                <span className="font-medium">{item.name}</span>
                                <span className="text-xs opacity-50">↗</span>
                              </a>
                            );
                          }

                          return (
                            <Link
                              key={item.path}
                              to={createPageUrl(item.path)}
                              className={`flex items-center gap-3 px-4 py-2 rounded-xl transition-all ${
                                isActive 
                                  ? 'text-white shadow-lg'
                                  : `${menuTextClass} ${menuHoverClass}`
                              }`}
                              style={isActive ? { background: `linear-gradient(to right, ${primaryColor}, ${accentColor})` } : {}}
                            >
                              <Icon className="w-5 h-5" />
                              <span className="font-medium">{item.name}</span>
                            </Link>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </nav>

          {/* Footer & SoundCloud */}
          {user && (
            <div className={`pt-6 mt-6 border-t ${menuBorderClass}`}>
              <Link
                to={createPageUrl('Settings')}
                className={`flex items-center gap-3 px-4 py-2 rounded-xl transition-all mb-3 ${menuTextClass} ${menuHoverClass}`}
              >
                {preferences?.profile_image_url ? (
                  <img src={preferences.profile_image_url} alt="Profile" className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isMenuDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                    <Settings className="w-4 h-4 text-gray-500" />
                  </div>
                )}
                <span className="font-medium flex-1">Settings</span>
              </Link>
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className={`w-full ${isMenuDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'text-gray-700 border-gray-300 hover:bg-gray-100'}`}
              >
                <LogOut className="w-4 h-4 mr-2" /> Sign Out
              </Button>

              {soundcloudPosition === 'menu' && soundcloudUrl && (
                <div className="mt-4 pt-4 border-t" style={{ borderColor: menuBorderClass }}>
                  <SoundCloudPlayer playlistUrl={soundcloudUrl} isMenuDark={isMenuDark} />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Main Content Area */}
        <div className="ml-72 flex-1">
          {children}
        </div>
      </div>

      {/* Mobile Main Content */}
      <div className={`lg:hidden pt-16 ${user && preferences?.quick_actions?.length > 0 ? 'pt-32' : ''}`}>
        {children}
      </div>

      {/* Floating Elements */}
      {soundcloudPosition === 'menu' && soundcloudUrl && (
        <MobileSoundCloudPopup 
          playlistUrl={soundcloudUrl}
          primaryColor={primaryColor}
          accentColor={accentColor}
        />
      )}

      <TikTokAccessGate 
        isOpen={showAccessGate} 
        onClose={() => setShowAccessGate(false)} 
      />

      <FloatingHelpButton pageName={currentPageName} userEmail={user?.email} />

      {user && preferences && (
        <QuickActionsWidget 
          preferences={preferences}
          primaryColor={primaryColor}
          accentColor={accentColor}
        />
      )}

      {soundcloudPosition === 'floating' && soundcloudUrl && (
        <FloatingSoundCloudPlayer 
          playlistUrl={soundcloudUrl}
          primaryColor={primaryColor}
          accentColor={accentColor}
        />
      )}
    </div>
  );
}