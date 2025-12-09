import React, { useState, useEffect, useMemo } from 'react';
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
  Sparkles,
  Palette,
  Eye,
  Bookmark,
  HandMetal,
  PawPrint,
  Search,
  MousePointerClick,
  Calendar,
  Sun,
  Cross,
  Smile,
  FileText,
  StickyNote,
  Tablet,
  HelpCircle,
  MessageCircle,
  Briefcase
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import TikTokAccessGate from './components/access/TikTokAccessGate';
import ImpersonationBanner, { getEffectiveUserEmail, isImpersonating } from './components/admin/ImpersonationBanner';
import NotificationBell from './components/notifications/NotificationBell';
import FloatingHelpButton from './components/support/FloatingHelpButton';
import QuickActionsWidget from './components/widgets/QuickActionsWidget';
import SoundCloudPlayer, { FloatingSoundCloudPlayer, MobileSoundCloudPopup } from './components/widgets/SoundCloudPlayer.jsx';

// Map module IDs to nav items
const moduleNavMap = {
  tiktok: ['TikTok'],
  gifter: ['Gift Gallery Gratitude'],
  goals: ['Goals', 'Goal Sharing'],
  tasks: ['Tasks'],
  wellness: ['Wellness'],
  supplements: ['Supplements'],
  medications: ['Medications'],
  pets: ['Pet Care'],
  care_reminders: ['Care Reminders'],
  people: ['My People'],
  journal: ['Journal'],
  mental_health: ['Mental Health'],
};

// Icon mapping for dynamic menu
const iconMap = {
  LayoutDashboard, Target, Heart, BookOpen, Settings, TrendingUp, Users, Video,
  Pill, Gift, Brain, Home, ChevronDown, ChevronRight, Bell, Share2, Music, Star,
  Lock, UserCog, Sparkles, Eye, Bookmark, HandMetal, PawPrint, Search, 
  MousePointerClick, Calendar, Sun, Cross, Smile, FileText, StickyNote, 
  Tablet, HelpCircle, MessageCircle, Briefcase, Palette
};

// Custom peanut icon component
const PeanutIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <ellipse cx="12" cy="7" rx="4" ry="5" />
    <ellipse cx="12" cy="17" rx="4" ry="5" />
    <path d="M8 12h8" />
  </svg>
);

// Custom praying hands icon
const PrayingHandsIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2v4" />
    <path d="M8 6l4 4 4-4" />
    <path d="M7 10c0 0-2 2-2 5s2 5 2 5" />
    <path d="M17 10c0 0 2 2 2 5s-2 5-2 5" />
    <path d="M12 10v12" />
    <path d="M9 14h6" />
  </svg>
);

// Custom reminder string icon  
const ReminderIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
    <path d="M12 5v3" />
    <path d="M9 8h6" />
    <circle cx="12" cy="15" r="6" />
    <path d="M12 12v3l2 2" />
  </svg>
);

const defaultNavItems = [
  // Core (no header)
  { name: 'Dashboard', icon: LayoutDashboard, path: 'Dashboard', alwaysShow: true },
  { name: "Pixel's Place", icon: Sparkles, path: 'PixelsParadise', alwaysShow: true },
  
  // INDIGO: Life & Organization
  { name: '── Life & Organization ──', isGroupHeader: true, color: 'text-indigo-400', bgColor: 'bg-indigo-500/10' },
  { name: 'Tasks', icon: FileText, path: 'Tasks', moduleId: 'tasks' },
  { name: 'Family Members', icon: Users, path: 'FamilyMembers', moduleId: 'people' },
  { name: 'Work Schedules', icon: Briefcase, path: 'WorkSchedules', moduleId: 'work' },
  { name: 'Cleaning Tasks', icon: Sparkles, path: 'CleaningTasks', moduleId: 'cleaning' },
  { name: 'Care Reminders', icon: Bell, path: 'CareReminders', moduleId: 'care_reminders' },
  
  // TEAL: Goals & Growth
  { name: '── Goals & Growth ──', isGroupHeader: true, color: 'text-teal-400', bgColor: 'bg-teal-500/10' },
  { name: 'Goals', icon: Target, path: 'Goals', moduleId: 'goals' },
  { name: 'Vision Board', icon: Eye, path: 'VisionBoard', moduleId: 'goals' },
  { name: 'Saved Motivations', icon: Bookmark, path: 'SavedMotivations', moduleId: 'motivations' },
  
  // PURPLE: Faith & Spiritual
  { name: '── Faith & Spiritual ──', isGroupHeader: true, color: 'text-purple-400', bgColor: 'bg-purple-500/10' },
  { name: 'Prayer Requests', icon: Heart, path: 'PrayerRequests', moduleId: 'prayer', requiresBibleBeliever: true },
  
  // PINK: Creator Suite
  { name: '── Creator Suite ──', isGroupHeader: true, color: 'text-pink-400', bgColor: 'bg-pink-500/10' },
  { name: 'Social Media Suite', icon: Share2, isSection: true, moduleId: 'tiktok', requiresTikTokAccess: true, subItems: [
    { name: 'Discover Creators', icon: Search, path: 'DiscoverCreators', highlight: true },
    { name: 'Creator Contacts', icon: Users, path: 'TikTokContacts' },
    { name: 'Social Engagement', icon: MousePointerClick, path: 'TikTokEngagement' },
    { name: 'Content Calendar', icon: Calendar, path: 'LiveSchedule' },
    { name: 'Sunny Songbird', icon: Sun, path: 'SongGenerator' },
    { name: 'Gift Gallery Gratitude', icon: Gift, path: 'WeeklyGifterGallery' },
    { name: 'Love Away Giveaways', icon: Gift, path: 'LoveAway' },
    { name: 'Pictionary Helper', icon: Palette, path: 'PictionaryHelper' },
  ]},
  { name: 'Music & Songs', icon: Music, isSection: true, subItems: [
    { name: 'Holy Hitmakers', icon: Cross, path: 'HolyHitmakers' },
    { name: "Ping & Pong's Silly Songs", icon: Smile, externalUrl: 'https://sillysongs.pixelnutscreative.com' },
  ]},
  
  // GREEN: Wellness & Health
  { name: '── Wellness & Health ──', isGroupHeader: true, color: 'text-green-400', bgColor: 'bg-green-500/10' },
  { name: 'Daily Wellness', icon: Heart, path: 'Wellness', moduleId: 'wellness' },
  { name: 'Mental Health', icon: Brain, isSection: true, moduleId: 'mental_health', subItems: [
    { name: 'Mental Health Hub', icon: Brain, path: 'NeurodivergentSettings' },
    { name: 'Journal', icon: FileText, path: 'Journal', moduleId: 'journal' },
    { name: 'Quick Notes', icon: StickyNote, path: 'QuickNotes', moduleId: 'quick_notes' },
  ]},
  { name: 'Supplements', icon: Tablet, path: 'Supplements', moduleId: 'supplements' },
  { name: 'Medications', icon: Pill, path: 'Medications', moduleId: 'medications' },
  { name: 'Pet Care', icon: PawPrint, path: 'PetCare', moduleId: 'pets' },
  
  // Special items
  { name: 'SuperFan Access', icon: Star, path: 'SuperFanAccess', showWhenNoTikTokAccess: true },
  { name: 'Support', icon: HelpCircle, path: 'Support', alwaysShow: true },
  { name: 'Admin Panel', icon: UserCog, path: 'Admin', adminOnly: true },
];

export default function Layout({ children, currentPageName }) {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [expandedSections, setExpandedSections] = useState([]);
  const [collapsedGroups, setCollapsedGroups] = useState(() => {
    // Default collapsed groups based on menu config
    return [];
  });
  const [showAccessGate, setShowAccessGate] = useState(false);

  const [userLoading, setUserLoading] = useState(true);

  useEffect(() => {
    base44.auth.me()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setUserLoading(false));
  }, []);

  // Get effective email (real user or impersonated)
  const effectiveEmail = useMemo(() => {
    if (!user || !user.email) return null;
    try {
      return getEffectiveUserEmail(user.email) || null;
    } catch {
      return null;
    }
  }, [user]);
  const currentlyImpersonating = isImpersonating();

  const { data: preferences } = useQuery({
    queryKey: ['preferences', effectiveEmail],
    queryFn: async () => {
      if (!effectiveEmail) return null;
      try {
        const prefs = await base44.entities.UserPreferences.filter({ user_email: effectiveEmail }, '-updated_date');
        return prefs[0] || null;
      } catch {
        return null;
      }
    },
    enabled: !!effectiveEmail,
  });

  const enabledModules = preferences?.enabled_modules || ['tiktok', 'gifter', 'goals', 'tasks', 'wellness', 'supplements', 'medications', 'pets', 'care_reminders', 'people', 'journal', 'mental_health'];
  
  // Fetch admin menu config
  const { data: menuConfig = [], isLoading: menuLoading } = useQuery({
    queryKey: ['menuConfig'],
    queryFn: async () => {
      try {
        const items = await base44.entities.MenuConfig.filter({ is_active: true }, 'sort_order');
        return items;
      } catch (error) {
        console.error('Error loading menu config:', error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Build nav items from database config or use defaults
  const allNavItems = React.useMemo(() => {
    // Always use defaults if no config exists
    if (!menuConfig || menuConfig.length === 0) return defaultNavItems;
    
    // Group items by parent_section
    const sections = {};
    const topLevel = [];
    
    menuConfig.forEach(item => {
      if (item.parent_section) {
        if (!sections[item.parent_section]) sections[item.parent_section] = [];
        sections[item.parent_section].push({
          name: item.name,
          icon: iconMap[item.icon] || Star,
          path: item.path || '',
          externalUrl: item.external_url,
          moduleId: item.module_id,
          highlight: item.highlight,
          isDivider: item.name?.startsWith('──'),
        });
      } else {
        const navItem = {
          name: item.name,
          icon: iconMap[item.icon] || Star,
          path: item.path || '',
          externalUrl: item.external_url,
          moduleId: item.module_id,
          isSection: item.is_section,
          isGroupHeader: item.is_group_header,
          color: item.header_color,
          bgColor: item.header_bg_color,
          alwaysShow: item.always_show,
          adminOnly: item.admin_only,
          requiresTikTokAccess: item.requires_tiktok_access,
          requiresBibleBeliever: item.requires_bible_believer,
          showWhenNoTikTokAccess: item.show_when_no_tiktok_access,
          highlight: item.highlight,
        };
        topLevel.push(navItem);
      }
    });
    
    // Attach sub-items to sections
    return topLevel.map(item => {
      if (item.isSection && sections[item.name]) {
        return { ...item, subItems: sections[item.name] };
      }
      return item;
    });
  }, [menuConfig]);
  
  // IMPORTANT: isAdmin checks the REAL user email (not impersonated), so admin always sees admin menu
  const realUserEmail = user?.email ? user.email.toLowerCase() : '';
  const adminEmails = ['pixelnutscreative@gmail.com', 'pixel@thrivenut.app'];
  const isAdmin = realUserEmail && adminEmails.includes(realUserEmail);
  
  // hasTikTokAccess - admins ALWAYS have access
  const hasTikTokAccess = isAdmin || preferences?.tiktok_access_approved;
  const isBibleBeliever = preferences?.is_bible_believer || preferences?.greeting_type === 'scripture';

  // Filter nav items based on enabled modules (order comes from admin config)
  const getOrderedNavItems = () => {
    // Filter based on enabled modules - but SHOW TikTok items always (gated by popup)
    let filtered = allNavItems.filter(item => {
      if (item.alwaysShow) return true;
      // Admin only items
      if (item.adminOnly) return isAdmin;
      // Bible believer only items
      if (item.requiresBibleBeliever) return isBibleBeliever;
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

  const toggleGroup = (groupName) => {
    setCollapsedGroups(prev =>
      prev.includes(groupName)
        ? prev.filter(g => g !== groupName)
        : [...prev, groupName]
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
  const [systemDark, setSystemDark] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = (e) => setSystemDark(e.matches);
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    } catch {
      // Ignore media query errors
    }
  }, []);

  // Get theme colors
  const primaryColor = preferences?.primary_color || '#1fd2ea';
  const accentColor = preferences?.accent_color || '#bd84f5';
  const themeType = preferences?.theme_type || 'light';
  const isDark = themeType === 'dark' || (themeType === 'system' && systemDark);
  const menuColor = preferences?.menu_color || (isDark ? '#2a2a30' : '#ffffff');
          const soundcloudUrl = preferences?.soundcloud_playlist_url || '';
          const soundcloudPosition = preferences?.soundcloud_player_position || 'hidden';

          // Determine if menu color is dark to set text color appropriately
  const isMenuDark = (() => {
    const hex = menuColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance < 0.5;
  })();

  // Public pages - no layout, no auth required
  const publicPages = ['Onboarding', 'Home', 'Pricing', 'SubscriptionSuccess'];
  if (publicPages.includes(currentPageName)) {
    return children;
  }

  // For all other pages, require authentication
  // If not logged in, redirect to Home page
  if (!userLoading && !user) {
    window.location.href = createPageUrl('Home');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Redirecting to login...</p>
        </div>
      </div>
    );
  }

  const bgClass = isDark 
    ? 'bg-[#1f1f23] text-gray-100' 
    : 'bg-gradient-to-br from-teal-50 via-purple-50 to-blue-50 text-gray-900';



  const sidebarStyle = {
    backgroundColor: isDark ? `${menuColor}f2` : `${menuColor}f2`,
    borderColor: isDark ? '#374151' : '#e5e7eb'
  };

  // Menu text classes based on menu color brightness (not just theme)
  const menuTextClass = isMenuDark ? 'text-gray-100' : 'text-gray-800';
  const menuSubtextClass = isMenuDark ? 'text-gray-400' : 'text-gray-500';
  const menuHoverClass = isMenuDark ? 'hover:bg-white/10' : 'hover:bg-teal-50';
  const menuActiveClass = isMenuDark ? 'bg-white/10 text-teal-400' : 'bg-teal-50 text-teal-700';
  const menuBorderClass = isMenuDark ? 'border-gray-600' : 'border-gray-200';

  // Page content text classes (based on theme)
  const textClass = isDark ? 'text-gray-100' : 'text-gray-800';
  const subtextClass = isDark ? 'text-gray-400' : 'text-gray-500';
  const hoverClass = isDark ? 'hover:bg-gray-700/50' : 'hover:bg-teal-50';

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
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 backdrop-blur-sm border-b px-4 py-3" style={sidebarStyle}>
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
        className="lg:hidden fixed inset-0 z-40 pt-16"
        style={{ backgroundColor: menuColor }}
      >
            <nav className="p-6 space-y-1 overflow-y-auto max-h-[calc(100vh-8rem)]">
              {navItems.map((item, index) => {
                // Render group headers (collapsible)
                if (item.isGroupHeader) {
                  const isCollapsed = collapsedGroups.includes(item.name);
                  return (
                    <button
                      key={item.name}
                      onClick={() => toggleGroup(item.name)}
                      className={`w-full px-2 py-2 mt-4 mb-1 text-xs font-bold uppercase tracking-wider ${item.color} ${item.bgColor} rounded-lg flex items-center justify-between cursor-pointer hover:opacity-80`}
                    >
                      <span>{item.name.replace(/──/g, '').trim()}</span>
                      {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  );
                }

                // Skip items in collapsed groups
                const currentGroupIndex = navItems.slice(0, index).reverse().findIndex(i => i.isGroupHeader);
                const currentGroup = currentGroupIndex !== -1 ? navItems[index - currentGroupIndex - 1] : null;
                if (currentGroup && collapsedGroups.includes(currentGroup.name)) {
                  return null;
                }

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
                                                  
                                                  // Handle external URLs
                                                  if (subItem.externalUrl) {
                                                    return (
                                                      <a
                                                        key={subItem.name}
                                                        href={subItem.externalUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        onClick={() => setMobileMenuOpen(false)}
                                                        className={`flex items-center gap-3 px-4 py-2 rounded-xl transition-all text-sm ${isDark ? 'text-gray-400 hover:bg-gray-700/50' : 'text-gray-600 hover:bg-teal-50'}`}
                                                      >
                                                        <SubIcon className="w-4 h-4" />
                                                        <span>{subItem.name}</span>
                                                        <span className="text-xs opacity-50">↗</span>
                                                      </a>
                                                    );
                                                  }

                                                  return (
                                                    <Link
                                                      key={subItem.path}
                                                      to={createPageUrl(subItem.path || '')}
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
                                          to={createPageUrl(item.path || '')}
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
                  <div className={`pt-6 mt-6 border-t ${isDark ? 'border-gray-700' : ''}`}>
                    <Link
                      to={createPageUrl('Settings')}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all mb-3 ${isDark ? 'text-gray-300 hover:bg-gray-700/50' : 'text-gray-700 hover:bg-teal-50'}`}
                    >
                      {preferences?.profile_image_url ? (
                        <img 
                          src={preferences.profile_image_url} 
                          alt="Profile" 
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                          <Settings className="w-4 h-4 text-gray-500" />
                        </div>
                      )}
                      <span className="font-medium flex-1">Settings</span>
                    </Link>
                    <Button
                      onClick={handleLogout}
                      variant="outline"
                      size="sm"
                      className={`w-full ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'text-gray-700 border-gray-300 hover:bg-gray-100'}`}
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

              <nav className="flex-1 space-y-1 overflow-y-auto">
              {navItems.map((item, index) => {
                // Render group headers (collapsible)
                if (item.isGroupHeader) {
                  const isCollapsed = collapsedGroups.includes(item.name);
                  return (
                    <button
                      key={item.name}
                      onClick={() => toggleGroup(item.name)}
                      className={`w-full px-2 py-2 mt-4 mb-1 text-xs font-bold uppercase tracking-wider ${item.color} ${item.bgColor} rounded-lg flex items-center justify-between cursor-pointer hover:opacity-80`}
                    >
                      <span>{item.name.replace(/──/g, '').trim()}</span>
                      {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  );
                }

                // Skip items in collapsed groups
                const currentGroupIndex = navItems.slice(0, index).reverse().findIndex(i => i.isGroupHeader);
                const currentGroup = currentGroupIndex !== -1 ? navItems[index - currentGroupIndex - 1] : null;
                if (currentGroup && collapsedGroups.includes(currentGroup.name)) {
                  return null;
                }

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
                                                ? (isMenuDark ? 'text-gray-500' : 'text-gray-400')
                                                : hasActiveSubItem 
                                                  ? menuActiveClass
                                                  : `${menuTextClass} ${menuHoverClass}`
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
                                              className={`p-1 rounded ${isMenuDark ? 'hover:bg-white/10' : 'hover:bg-gray-200'}`}
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
                                                  <div key={subItem.name} className={`px-2 py-1 text-xs font-semibold ${isMenuDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                                    {subItem.name}
                                                  </div>
                                                );
                                              }

                                              // Handle external URLs
                                              if (subItem.externalUrl) {
                                                return (
                                                  <a
                                                    key={subItem.name}
                                                    href={subItem.externalUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className={`flex items-center gap-3 px-4 py-2 rounded-xl transition-all text-sm ${isMenuDark ? 'text-gray-400 hover:bg-white/10' : 'text-gray-600 hover:bg-teal-50'}`}
                                                  >
                                                    <SubIcon className="w-4 h-4" />
                                                    <span>{subItem.name}</span>
                                                    <span className="text-xs opacity-50">↗</span>
                                                  </a>
                                                );
                                              }

                                              return (
                                                    <Link
                                                      key={subItem.path}
                                                      to={createPageUrl(subItem.path || '')}
                                                      className={`flex items-center gap-3 px-4 py-2 rounded-xl transition-all text-sm ${
                                                        subIsActive
                                                          ? 'text-white shadow-lg'
                                                          : subItem.highlight
                                                            ? (isMenuDark ? 'text-teal-300 bg-teal-500/40 hover:bg-teal-500/60' : 'text-teal-900 bg-teal-200 hover:bg-teal-300')
                                                            : (isMenuDark ? 'text-gray-400 hover:bg-white/10' : 'text-gray-600 hover:bg-teal-50')
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
                                      to={createPageUrl(item.path || '')}
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
                                  </nav>

          {user && (
                    <div className={`pt-6 mt-6 border-t ${menuBorderClass}`}>
                      <Link
                        to={createPageUrl('Settings')}
                        className={`flex items-center gap-3 px-4 py-2 rounded-xl transition-all mb-3 ${menuTextClass} ${menuHoverClass}`}
                      >
                        {preferences?.profile_image_url ? (
                          <img 
                            src={preferences.profile_image_url} 
                            alt="Profile" 
                            className="w-8 h-8 rounded-full object-cover"
                          />
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
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign Out
                      </Button>

                      {/* SoundCloud Player at Bottom of Menu */}
                      {soundcloudPosition === 'menu' && soundcloudUrl && (
                        <div className="mt-4 pt-4 border-t" style={{ borderColor: menuBorderClass }}>
                          <SoundCloudPlayer 
                            playlistUrl={soundcloudUrl} 
                            isMenuDark={isMenuDark}
                          />
                        </div>
                      )}
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

              {/* Mobile SoundCloud Popup */}
              {soundcloudPosition === 'menu' && soundcloudUrl && (
                <MobileSoundCloudPopup 
                  playlistUrl={soundcloudUrl}
                  primaryColor={primaryColor}
                  accentColor={accentColor}
                />
              )}

              {/* TikTok Access Gate Modal */}
              <TikTokAccessGate 
                isOpen={showAccessGate} 
                onClose={() => setShowAccessGate(false)} 
              />

              {/* Floating Help Button */}
              <FloatingHelpButton pageName={currentPageName} userEmail={user?.email} />

              {/* Quick Actions Widget */}
              {user && preferences && (
                <QuickActionsWidget 
                  preferences={preferences}
                  primaryColor={primaryColor}
                  accentColor={accentColor}
                />
              )}

              {/* Floating SoundCloud Player */}
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