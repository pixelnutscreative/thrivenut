import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { createPageUrl } from './utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button.jsx';
import {
  LayoutDashboard, Target, Heart, BookOpen, Settings, Menu, X, LogOut,
  TrendingUp, Users, Video, Pill, Gift, Brain, Home, ChevronDown,
  ChevronRight, Bell, Share2, Music, Star, Lock, UserCog, Sparkles,
  Palette, Eye, Bookmark, HandMetal, PawPrint, Search, MousePointerClick,
  Calendar, Sun, Cross, Smile, FileText, StickyNote, Tablet, HelpCircle,
  MessageCircle, Briefcase, DollarSign, Activity, Wallet, Swords, Lightbulb, Zap,
  Image as ImageIcon 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import TikTokAccessGate from './components/access/TikTokAccessGate';
import ImpersonationBanner, { getEffectiveUserEmail, isImpersonating } from './components/admin/ImpersonationBanner';
import NotificationBell from './components/notifications/NotificationBell';
import FloatingHelpButton from './components/support/FloatingHelpButton';
import QuickActionsBarV2 from './components/widgets/QuickActionsBarV2';
import SoundCloudPlayer, { FloatingSoundCloudPlayer, MobileSoundCloudPopup } from './components/widgets/SoundCloudPlayer.jsx';
import AnnouncementBar from './components/announcements/AnnouncementBar';
import AnnouncementBarPositioner from './components/announcements/AnnouncementBarPositioner';

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
  const [expandedSections, setExpandedSections] = useState(['Content Creator Center']); // Default expand creator center
  const [showAccessGate, setShowAccessGate] = useState(false);
  const [userLoading, setUserLoading] = useState(true);

  // Authentication
  useEffect(() => {
    base44.auth.me().
    then(setUser).
    catch(() => setUser(null)).
    finally(() => setUserLoading(false));
  }, []);

  // Analytics Tracking
  useEffect(() => {
    if (user?.email) {
      // Small delay to ensure we don't track rapid redirects
      const timer = setTimeout(() => {
        base44.entities.AnalyticsEvent.create({
          user_email: user.email,
          path: location.pathname + location.search,
          event_type: 'page_view',
          metadata: {
            referrer: document.referrer,
            timestamp: new Date().toISOString()
          }
        }).catch(err => console.error("Analytics error", err));
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [location.pathname, location.search, user?.email]);

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
    enabled: !!effectiveEmail
  });

  // Admin Check
  const realUserEmail = user?.email ? user.email.toLowerCase() : '';
  const adminEmails = ['pixelnutscreative@gmail.com', 'pixel@thrivenut.app'];
  const isAdmin = realUserEmail && adminEmails.includes(realUserEmail);

  // Fetch My Groups for Menu
  const { data: myMenuGroups = [] } = useQuery({
    queryKey: ['myMenuGroups', effectiveEmail],
    queryFn: async () => {
      if (!effectiveEmail) return [];
      const memberships = await base44.entities.CreatorGroupMember.filter({ user_email: effectiveEmail, status: 'active' });
      if (memberships.length === 0) return [];
      
      const details = await Promise.all(memberships.map(m => base44.entities.CreatorGroup.filter({ id: m.group_id })));
      const activeGroups = details.flat().filter(g => g && g.status === 'active');
      // Deduplicate groups by ID to prevent menu duplicates
      return Array.from(new Map(activeGroups.map(g => [g.id, g])).values());
      },
    enabled: !!effectiveEmail
  });

  // Permissions
  const hasTikTokAccess = isAdmin || preferences?.tiktok_access_approved || preferences?.is_superfan;
  // Determine if Bible features are enabled (default to true if undefined)
  const isBibleBeliever = preferences?.enable_bible_options !== false;
  const enabledModules = preferences?.enabled_modules || ['tiktok', 'gifter', 'goals', 'tasks', 'wellness', 'supplements', 'medications', 'pets', 'care_reminders', 'people', 'journal', 'mental_health', 'finance', 'activity', 'motivations'];
  const isKidMode = preferences?.default_landing_page === 'KidsJournal';

  // Redirect kids to KidsJournal on login (from Home/Dashboard)
  useEffect(() => {
    if (isKidMode && (currentPageName === 'Dashboard' || currentPageName === 'Home')) {
      navigate(createPageUrl('KidsJournal'));
    }
  }, [isKidMode, currentPageName]);

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
    { name: preferences?.my_resources_label || 'My Stuff', icon: Bookmark, path: 'MyResources', moduleId: 'my_resources' },
    { 
      name: 'My Groups', 
      icon: Users, 
      isSection: true,
      alwaysShow: true,
      subItems: [
         { name: 'Browse Groups', icon: Search, path: 'CreatorGroups?mode=browse' },
         ...myMenuGroups.map(g => ({
           name: g.name,
           icon: Users,
           path: `CreatorGroups?id=${g.id}`
         }))
      ]
    },
    { name: "Pixel's Place", icon: Sparkles, path: 'PixelsParadise', moduleId: 'pixels_place' }]

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
    { name: 'Finance', icon: Wallet, path: 'Finance', moduleId: 'finance' }]

  },
  {
    id: 'friends',
    title: 'Friends + Loved Ones',
    color: 'text-cyan-400', // Turquoise
    bgColor: 'bg-cyan-500/10',
    items: [
    { name: 'My People', icon: Users, path: 'People', moduleId: 'people' },
    { name: 'Kid Controls', icon: Lock, path: 'KidControls', moduleId: 'parenting' },
    { name: 'Care Reminders', icon: Bell, path: 'CareReminders', moduleId: 'care_reminders' },
    { name: 'Pet Care', icon: PawPrint, path: 'PetCare', moduleId: 'pets' }]

  },
  {
    id: 'faith',
    title: 'Faith & Spiritual',
    color: 'text-lime-400', // Lime Green
    bgColor: 'bg-lime-500/10',
    items: [
    { name: getPrayerName(), icon: Heart, path: 'PrayerRequests', moduleId: 'prayer' },
    { name: 'Holy Hitmakers', icon: Music, path: 'HolyHitmakers', requiresBibleBeliever: true, moduleId: 'holy_hitmakers' },
    { name: 'Bible Resources', icon: BookOpen, path: 'BibleResources', requiresBibleBeliever: true, moduleId: 'bible_resources' }]

  },
  {
    id: 'health',
    title: 'Mind + Body Health',
    color: 'text-yellow-400', // Gold/Yellow
    bgColor: 'bg-yellow-500/10',
    items: [
    { name: 'Mental Health', icon: Brain, path: 'MentalHealth', moduleId: 'mental_health' },
    { name: 'Daily Wellness', icon: Heart, path: 'Wellness', moduleId: 'wellness' },
    { name: 'Supplements', icon: Tablet, path: 'Supplements', moduleId: 'supplements' },
    { name: 'Medications', icon: Pill, path: 'Medications', moduleId: 'medications' },
    { name: 'Activity Tracker', icon: Activity, path: 'ActivityTracker', moduleId: 'activity' }]

  },
  {
    id: 'creator',
    title: 'Creator Suite',
    color: 'text-orange-400', // Orange
    bgColor: 'bg-orange-500/10',
    items: [
    { name: 'Content Creator Center', icon: Target, path: 'ContentCreatorHub', moduleId: 'content_creator_center' },
    // Affiliate Programs moved to Share & Earn
    { name: 'Content Ideas', icon: Lightbulb, path: 'SavedMotivations', moduleId: 'motivations' },
    { name: 'Content Marketplace', icon: Briefcase, path: 'ContentMarketplace', highlight: true, moduleId: 'content_marketplace' },
    { name: 'Create AI Music', icon: Music, isSection: true, moduleId: 'ai_music_suite', subItems: [
      { name: 'Sunny Songbird', icon: Sun, path: 'SongGenerator' },
      { name: "Ping & Pong's Silly Songs", icon: Smile, externalUrl: 'https://sillysongs.pixelnutscreative.com' },
      { name: 'Holy Hitmakers', icon: Music, path: 'HolyHitmakers', requiresBibleBeliever: true }]
    },
    { name: 'Social Media Suite', icon: Share2, isSection: true, moduleId: 'tiktok', requiresTikTokAccess: true, subItems: [
      { name: 'Social Shortcuts', icon: Link, path: 'SocialShortcuts' },
      { name: 'Social Engagement', icon: MousePointerClick, path: 'TikTokEngagement' },
      { name: 'Creator Contacts', icon: Users, path: 'TikTokContacts' },
      { name: 'Content Calendar', icon: Calendar, path: 'LiveSchedule' },
      { name: 'Discover Creators', icon: Search, path: 'DiscoverCreators' },
      { name: 'Live Engagement', icon: Activity, path: 'LiveEngagement' },
      { name: 'Gift Gallery Gratitude', icon: Gift, path: 'WeeklyGifterGallery' },
      { name: 'Love Aways', icon: Gift, path: 'LoveAway' }]
    }]

  },
  {
    id: 'share_earn',
    title: 'Share & Earn',
    color: 'text-pink-400', // Hot Pink
    bgColor: 'bg-pink-500/10',
    items: [
      { name: 'Links & Dashboard', icon: Share2, path: 'ShareDashboard', moduleId: 'share_earn' },
      { name: 'Thrive Nut', icon: Sparkles, path: 'ThriveGenerator', moduleId: 'share_earn' },
      { name: "Pixel's AI Toolbox", icon: Brain, path: 'AIToolsGenerator', moduleId: 'share_earn' },
      { name: 'The Nuts + Bots', icon: MessageCircle, path: 'NutsBotsGenerator', moduleId: 'share_earn' }
    ]
  }];


  const [collapsedGroups, setCollapsedGroups] = useState(['goals', 'friends', 'faith', 'health', 'creator', 'support']);

  const toggleGroup = (groupId) => {
    setCollapsedGroups((previousGroups) =>
    previousGroups.includes(groupId) ?
    previousGroups.filter((id) => id !== groupId) :
    [...previousGroups, groupId]
    );
  };

  // Logic to toggle expanded sections
  const toggleSection = (sectionName) => {
    setExpandedSections((previousSections) =>
    previousSections.includes(sectionName) ?
    previousSections.filter((s) => s !== sectionName) :
    [...previousSections, sectionName]
    );

    // Scroll to top when opening Social Media Suite
    if (sectionName === 'Social Media Suite' && !expandedSections.includes(sectionName)) {
      setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
    }
  };



  const isSubItemActive = (item) => {
    if (item.subItems) {
      return item.subItems.some((sub) => {
         if (!sub.path) return false;
         // Check exact path match or if path contains query params, check against location
         if (sub.path.includes('?')) {
             const [path, search] = sub.path.split('?');
             return path === currentPageName && location.search.includes(search);
         }
         return sub.path === currentPageName;
      });
    }
    return false;
  };

  const handleLogout = async () => {
    sessionStorage.removeItem('impersonating');
    sessionStorage.removeItem('impersonatingStarted');
    await base44.auth.logout();
  };

  // --- STYLES ---
  // Using a very light version of the primary/accent colors for the background
  const bgClass = 'bg-gradient-to-br from-[var(--primary-color)]/5 via-white to-[var(--accent-color)]/5 text-gray-900';

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
  const publicPages = ['Onboarding', 'Home', 'Pricing', 'SubscriptionSuccess', 'BattleInventoryShared', 'CustomHomepage'];
  if (publicPages.includes(currentPageName)) {
    return children;
  }

  // Show loading state while checking user
  if (userLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-teal-50 via-purple-50 to-blue-50">
        <div className="text-center animate-pulse">
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6924840d3628eabd1d7f8247/e225113d4_Untitleddesign.png"
            alt="Let's Thrive!"
            className="w-16 h-16 mx-auto mb-4" 
          />
          <h1 className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-purple-400 bg-clip-text text-transparent">
            Let's Thrive!
          </h1>
          <p className="text-gray-500 mt-2">Loading your space...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    window.location.href = createPageUrl('Home');
    return null;
  }

  // Determine music URL based on active service
  const activeService = preferences?.active_music_service || 'soundcloud';
  const soundcloudUrl = activeService === 'spotify' ?
  preferences?.spotify_playlist_url || '' :
  preferences?.soundcloud_playlist_url || 'https://soundcloud.com/pixel-nuts-creative/sets/rise-praise';

  const soundcloudPosition = preferences?.soundcloud_player_position || 'menu';

   return (
     <>
      <style>{`
        :root {
          --primary-color: ${primaryColor};
          --accent-color: ${accentColor};
        }
      `}</style>
      <AnnouncementBar />
      <div
        className={`min-h-screen ${bgClass} ${currentlyImpersonating ? 'pt-10' : ''}`}
        style={{
          '--primary-color': primaryColor,
          '--accent-color': accentColor
        }}>

      <ImpersonationBanner />
      
      {/* Mobile Header */}
      <div className={`lg:hidden fixed top-0 left-0 right-0 z-30 backdrop-blur-sm border-b px-4 py-3 ${menuTextClass}`} style={sidebarStyle}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6924840d3628eabd1d7f8247/e225113d4_Untitleddesign.png"
                alt="Let's Thrive!"
                className="w-8 h-8" />

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
                className={menuTextClass}>

              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen &&
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween' }}
            className="lg:hidden fixed inset-0 z-20 pt-16 flex flex-col"
            style={{ backgroundColor: menuColor }}>

            <nav className="flex-1 p-6 space-y-1 overflow-y-auto">
              {menuGroups.map((group) => {
                const isCollapsed = collapsedGroups.includes(group.id);

                return (
                  <div key={group.id} className="mb-2">
                    {group.title &&
                    <button
                      onClick={() => toggleGroup(group.id)}
                      className={`w-full px-2 py-2 mt-4 mb-1 text-xs font-bold uppercase tracking-wider ${group.color} ${group.bgColor} rounded-lg flex items-center justify-between hover:opacity-80 transition-opacity`}>

                        <span>{group.title}</span>
                        {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    }

                    <AnimatePresence>
                      {(!isCollapsed || !group.title) &&
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden space-y-1">

                          {group.items.map((item) => {
                            // Check permissions/modules
                            if (item.adminOnly && !isAdmin) return null;
                            if (isKidMode) {
                              if (!item.moduleId) return null;
                              if (!enabledModules.includes(item.moduleId)) return null;
                            }
                            if (item.requiresBibleBeliever && !isBibleBeliever) return null;
                            if (!isKidMode && item.moduleId && !enabledModules.includes(item.moduleId) && !item.alwaysShow) return null;

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
                                  hasActiveSubItem ? menuActiveClass : `${menuTextClass} ${menuHoverClass}`}`
                                  }>

                                    <div className="flex items-center gap-3">
                                      <Icon className="w-5 h-5" />
                                      <span className="font-medium">{item.name}</span>
                                      {isLocked && <Lock className="w-3 h-3 text-amber-500" />}
                                    </div>
                                    {!isLocked && (isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />)}
                                  </button>
                                  
                                  {isExpanded && !isLocked &&
                                <div className="ml-4 mt-1 space-y-1">
                                      {item.subItems?.map((sub) =>
                                  sub.externalUrl ?
                                  <a
                                    key={sub.name}
                                    href={sub.externalUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`flex items-center gap-3 px-4 py-2 rounded-xl text-sm ${menuTextClass} ${menuHoverClass}`}>

                                            <sub.icon className="w-4 h-4" />
                                            <span>{sub.name}</span>
                                            <span className="text-xs opacity-50">↗</span>
                                          </a> :

                                  <Link
                                    key={sub.path}
                                    to={createPageUrl(sub.path)}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={`flex items-center gap-3 px-4 py-2 rounded-xl text-sm ${
                                    currentPageName === sub.path ?
                                    isMenuDark ? 'text-white bg-white/10' : 'text-teal-700 bg-teal-50' :
                                    `${menuTextClass} ${menuHoverClass}`}`
                                    }>

                                            <sub.icon className="w-4 h-4" />
                                            <span>{sub.name}</span>
                                          </Link>

                                  )}
                                    </div>
                                }
                                </div>);

                          }

                          // Standard Link
                          if (item.externalUrl) {
                            return (
                              <a
                                key={item.name}
                                href={item.externalUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${menuTextClass} ${menuHoverClass}`}>

                                  <Icon className="w-5 h-5" />
                                  <span className="font-medium">{item.name}</span>
                                  <span className="text-xs opacity-50">↗</span>
                                </a>);

                          }

                          return (
                            <Link
                              key={item.path}
                              to={createPageUrl(item.path)}
                              onClick={() => setMobileMenuOpen(false)}
                              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                              isActive ?
                              'text-white shadow-lg' :
                              `${menuTextClass} ${menuHoverClass}`}`
                              }
                              style={isActive ? { background: `linear-gradient(to right, ${primaryColor}, ${accentColor})` } : {}}>

                                <Icon className="w-5 h-5" />
                                <span className="font-medium">{item.name}</span>
                              </Link>);

                        })}
                        </motion.div>
                      }
                    </AnimatePresence>
                  </div>);

              })}

              {user &&
              <div className={`pt-6 mt-6 border-t ${menuBorderClass}`}>
                  <button
                  onClick={() => {
                    const accounts = JSON.parse(localStorage.getItem('savedAccounts') || '[]');
                    const currentEmail = user.email;

                    let message = 'ACCOUNT MANAGER\n\n';
                    if (accounts.length > 0) {
                      message += 'Saved Accounts:\n';
                      accounts.forEach((acc, idx) => {
                        const isCurrent = acc.email === currentEmail;
                        message += `${idx + 1}. ${acc.email}${isCurrent ? ' (current)' : ''}\n`;
                      });
                      message += '\n';
                    }

                    message += 'Options:\n';
                    message += '1. Add this account to saved list\n';
                    message += '2. Switch to different account\n';
                    message += '3. Remove saved account\n';
                    message += '4. Cancel\n\n';
                    message += 'Enter number:';

                    const choice = prompt(message);

                    if (choice === '1') {
                      const exists = accounts.find((a) => a.email === currentEmail);
                      if (!exists) {
                        accounts.push({ email: currentEmail, name: user.full_name });
                        localStorage.setItem('savedAccounts', JSON.stringify(accounts));
                        alert('Account saved! You can now switch between accounts easily.');
                      } else {
                        alert('This account is already saved.');
                      }
                    } else if (choice === '2') {
                      if (accounts.length === 0) {
                        alert('No saved accounts. Add accounts first!');
                        return;
                      }
                      const accountsList = accounts.map((acc, idx) => `${idx + 1}. ${acc.email}`).join('\n');
                      const selection = prompt(`Select account:\n${accountsList}\n\nEnter number:`);
                      const selectedIdx = parseInt(selection) - 1;
                      if (selectedIdx >= 0 && selectedIdx < accounts.length) {
                        base44.auth.logout(createPageUrl('Home') + '?email=' + accounts[selectedIdx].email);
                      }
                    } else if (choice === '3') {
                      if (accounts.length === 0) {
                        alert('No saved accounts to remove.');
                        return;
                      }
                      const accountsList = accounts.map((acc, idx) => `${idx + 1}. ${acc.email}`).join('\n');
                      const selection = prompt(`Remove account:\n${accountsList}\n\nEnter number:`);
                      const selectedIdx = parseInt(selection) - 1;
                      if (selectedIdx >= 0 && selectedIdx < accounts.length) {
                        accounts.splice(selectedIdx, 1);
                        localStorage.setItem('savedAccounts', JSON.stringify(accounts));
                        alert('Account removed from saved list.');
                      }
                    }
                  }}
                  className={`w-full flex items-center justify-between gap-2 mb-4 px-2 py-2 rounded-lg ${menuHoverClass}`}>

                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${menuTextClass}`}>{preferences?.nickname || user.full_name || user.email}</p>
                        <p className={`text-xs truncate ${menuSubtextClass}`}>{user.email}</p>
                      </div>
                    </div>
                    <img
                    src={preferences?.profile_image_url || `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'%3E%3C/path%3E%3Ccircle cx='12' cy='7' r='4'%3E%3C/circle%3E%3C/svg%3E`}
                    alt="Profile"
                    className="w-10 h-10 rounded-full object-cover border-2 border-gray-300 flex-shrink-0" />

                  </button>

                  <div className="flex items-center gap-1 mt-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => { navigate(createPageUrl('Settings')); setMobileMenuOpen(false); }}
                      className={isMenuDark ? 'text-gray-400 hover:text-white hover:bg-white/10' : 'text-gray-500 hover:bg-gray-100'}
                      title="Settings"
                    >
                      <Settings className="w-5 h-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => { navigate(createPageUrl('Support')); setMobileMenuOpen(false); }}
                      className={isMenuDark ? 'text-gray-400 hover:text-white hover:bg-white/10' : 'text-gray-500 hover:bg-gray-100'}
                      title="Support"
                    >
                      <HelpCircle className="w-5 h-5" />
                    </Button>
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => { navigate(createPageUrl('Admin')); setMobileMenuOpen(false); }}
                        className={isMenuDark ? 'text-gray-400 hover:text-white hover:bg-white/10' : 'text-gray-500 hover:bg-gray-100'}
                        title="Admin Panel"
                      >
                        <UserCog className="w-5 h-5" />
                      </Button>
                    )}
                    <Button
                      onClick={handleLogout}
                      size="sm"
                      className={`flex-1 justify-center ${isMenuDark ? 'bg-gray-700 text-gray-100 hover:bg-gray-600' : 'bg-gray-800 text-white hover:bg-gray-700'}`}
                    >
                      <LogOut className="w-4 h-4 mr-2" /> Log Out
                    </Button>
                  </div>

                  {soundcloudPosition === 'menu' && soundcloudUrl &&
                <div className="mt-4 pt-4 border-t" style={{ borderColor: menuBorderClass }}>
                      <SoundCloudPlayer playlistUrl={soundcloudUrl} isMenuDark={isMenuDark} />
                    </div>
                }
                </div>
              }
            </nav>
          </motion.div>
          }
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex">
        <div className="fixed left-0 top-0 bottom-0 w-72 backdrop-blur-sm border-r p-6 flex flex-col overflow-y-auto" style={sidebarStyle}>
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <img
                    src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6924840d3628eabd1d7f8247/e225113d4_Untitleddesign.png"
                    alt="Let's Thrive!"
                    className="w-10 h-10" />

                <h1
                    className="text-2xl font-bold bg-clip-text text-transparent whitespace-nowrap"
                    style={{ backgroundImage: `linear-gradient(to right, ${primaryColor}, ${accentColor})` }}>

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
                  {group.title &&
                    <button
                      onClick={() => toggleGroup(group.id)}
                      className={`w-full px-2 py-2 mt-4 mb-1 text-xs font-bold uppercase tracking-wider ${group.color} ${group.bgColor} rounded-lg flex items-center justify-between hover:opacity-80 transition-opacity`}>

                      <span>{group.title}</span>
                      {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                    }

                  <AnimatePresence>
                    {(!isCollapsed || !group.title) &&
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden space-y-1">

                        {group.items.map((item) => {
                          // Check permissions/modules
                          if (item.adminOnly && !isAdmin) return null;
                          if (isKidMode) {
                            if (!item.moduleId) return null;
                            if (!enabledModules.includes(item.moduleId)) return null;
                          }
                          if (item.requiresBibleBeliever && !isBibleBeliever) return null;
                          if (!isKidMode && item.moduleId && !enabledModules.includes(item.moduleId) && !item.alwaysShow) return null;

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
                                  hasActiveSubItem ? menuActiveClass : `${menuTextClass} ${menuHoverClass}`}`
                                  }>

                                  <div className="flex items-center gap-3">
                                    <Icon className="w-5 h-5" />
                                    <span className="font-medium">{item.name}</span>
                                    {isLocked && <Lock className="w-3 h-3 text-amber-500" />}
                                  </div>
                                  {!isLocked && (isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />)}
                                </button>
                                
                                {isExpanded && !isLocked &&
                                <div className="ml-4 mt-1 space-y-1">
                                    {item.subItems?.map((sub) =>
                                  sub.externalUrl ?
                                  <a
                                    key={sub.name}
                                    href={sub.externalUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`flex items-center gap-3 px-4 py-2 rounded-xl text-sm ${menuTextClass} ${menuHoverClass}`}>

                                          <sub.icon className="w-4 h-4" />
                                          <span>{sub.name}</span>
                                          <span className="text-xs opacity-50">↗</span>
                                        </a> :

                                  <Link
                                    key={sub.path}
                                    to={createPageUrl(sub.path)}
                                    className={`flex items-center gap-3 px-4 py-2 rounded-xl text-sm ${
                                    currentPageName === sub.path ?
                                    isMenuDark ? 'text-white bg-white/10' : 'text-teal-700 bg-teal-50' :
                                    `${menuTextClass} ${menuHoverClass}`}`
                                    }>

                                          <sub.icon className="w-4 h-4" />
                                          <span>{sub.name}</span>
                                        </Link>

                                  )}
                                  </div>
                                }
                              </div>);

                          }

                          // Standard Link
                          if (item.externalUrl) {
                            return (
                              <a
                                key={item.name}
                                href={item.externalUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`flex items-center gap-3 px-4 py-2 rounded-xl transition-all ${menuTextClass} ${menuHoverClass}`}>

                                <Icon className="w-5 h-5" />
                                <span className="font-medium">{item.name}</span>
                                <span className="text-xs opacity-50">↗</span>
                              </a>);

                          }

                          return (
                            <Link
                              key={item.path}
                              to={createPageUrl(item.path)}
                              className={`flex items-center gap-3 px-4 py-2 rounded-xl transition-all ${
                              isActive ?
                              'text-white shadow-lg' :
                              `${menuTextClass} ${menuHoverClass}`}`
                              }
                              style={isActive ? { background: `linear-gradient(to right, ${primaryColor}, ${accentColor})` } : {}}>

                              <Icon className="w-5 h-5" />
                              <span className="text-sm font-medium">{item.name}</span>
                            </Link>);

                        })}
                      </motion.div>
                      }
                  </AnimatePresence>
                </div>);

              })}
          </nav>

          {/* Footer & SoundCloud */}
          {user &&
            <div className={`pt-6 mt-6 border-t ${menuBorderClass}`}>
            <button
                onClick={() => {
                  const accounts = JSON.parse(localStorage.getItem('savedAccounts') || '[]');
                  const currentEmail = user.email;

                  let message = 'ACCOUNT MANAGER\n\n';
                  if (accounts.length > 0) {
                    message += 'Saved Accounts:\n';
                    accounts.forEach((acc, idx) => {
                      const isCurrent = acc.email === currentEmail;
                      message += `${idx + 1}. ${acc.email}${isCurrent ? ' (current)' : ''}\n`;
                    });
                    message += '\n';
                  }

                  message += 'Options:\n';
                  message += '1. Add this account to saved list\n';
                  message += '2. Switch to different account\n';
                  message += '3. Remove saved account\n';
                  message += '4. Cancel\n\n';
                  message += 'Enter number:';

                  const choice = prompt(message);

                  if (choice === '1') {
                    const exists = accounts.find((a) => a.email === currentEmail);
                    if (!exists) {
                      accounts.push({ email: currentEmail, name: user.full_name });
                      localStorage.setItem('savedAccounts', JSON.stringify(accounts));
                      alert('Account saved! You can now switch between accounts easily.');
                    } else {
                      alert('This account is already saved.');
                    }
                  } else if (choice === '2') {
                    if (accounts.length === 0) {
                      alert('No saved accounts. Add accounts first!');
                      return;
                    }
                    const accountsList = accounts.map((acc, idx) => `${idx + 1}. ${acc.email}`).join('\n');
                    const selection = prompt(`Select account:\n${accountsList}\n\nEnter number:`);
                    const selectedIdx = parseInt(selection) - 1;
                    if (selectedIdx >= 0 && selectedIdx < accounts.length) {
                      base44.auth.logout(createPageUrl('Home') + '?email=' + accounts[selectedIdx].email);
                    }
                  } else if (choice === '3') {
                    if (accounts.length === 0) {
                      alert('No saved accounts to remove.');
                      return;
                    }
                    const accountsList = accounts.map((acc, idx) => `${idx + 1}. ${acc.email}`).join('\n');
                    const selection = prompt(`Remove account:\n${accountsList}\n\nEnter number:`);
                    const selectedIdx = parseInt(selection) - 1;
                    if (selectedIdx >= 0 && selectedIdx < accounts.length) {
                      accounts.splice(selectedIdx, 1);
                      localStorage.setItem('savedAccounts', JSON.stringify(accounts));
                      alert('Account removed from saved list.');
                    }
                  }
                }}
                className={`w-full flex items-center justify-between gap-2 mb-4 px-2 py-2 rounded-lg ${menuHoverClass}`}>

              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${menuTextClass}`}>{preferences?.nickname || user.full_name || user.email}</p>
                  <p className={`text-xs truncate ${menuSubtextClass}`}>{user.email}</p>
                </div>
              </div>
              <img
                  src={preferences?.profile_image_url || `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'%3E%3C/path%3E%3Ccircle cx='12' cy='7' r='4'%3E%3C/circle%3E%3C/svg%3E`}
                  alt="Profile"
                  className="w-10 h-10 rounded-full object-cover border-2 border-gray-300 flex-shrink-0" />

            </button>

            <div className="flex items-center gap-1 mt-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(createPageUrl('Settings'))}
                className={isMenuDark ? 'text-gray-400 hover:text-white hover:bg-white/10' : 'text-gray-500 hover:bg-gray-100'}
                title="Settings"
              >
                <Settings className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(createPageUrl('Support'))}
                className={isMenuDark ? 'text-gray-400 hover:text-white hover:bg-white/10' : 'text-gray-500 hover:bg-gray-100'}
                title="Support"
              >
                <HelpCircle className="w-5 h-5" />
              </Button>
              {isAdmin && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate(createPageUrl('Admin'))}
                  className={isMenuDark ? 'text-gray-400 hover:text-white hover:bg-white/10' : 'text-gray-500 hover:bg-gray-100'}
                  title="Admin Panel"
                >
                  <UserCog className="w-5 h-5" />
                </Button>
              )}
              <Button
                onClick={handleLogout}
                size="sm"
                className={`flex-1 justify-center ${isMenuDark ? 'bg-gray-700 text-gray-100 hover:bg-gray-600' : 'bg-gray-800 text-white hover:bg-gray-700'}`}
              >
                <LogOut className="w-4 h-4 mr-2" /> Log Out
              </Button>
            </div>

              {soundcloudPosition === 'menu' && soundcloudUrl &&
              <div className="mt-4 pt-4 border-t" style={{ borderColor: menuBorderClass }}>
                  <SoundCloudPlayer playlistUrl={soundcloudUrl} isMenuDark={isMenuDark} />
                </div>
              }
            </div>
            }
        </div>

        {/* Main Content Area */}
        <div className="ml-72 flex-1" style={{ paddingTop: '80px' }}>
          {children}
        </div>
        </div>

        {/* Mobile Main Content */}
        <div className="lg:hidden" style={{ paddingTop: '140px' }}>
        {children}
        </div>

      {/* Floating Elements */}
      {soundcloudPosition === 'menu' && soundcloudUrl &&
        <MobileSoundCloudPopup
          playlistUrl={soundcloudUrl}
          primaryColor={primaryColor}
          accentColor={accentColor}
          isHidden={mobileMenuOpen} />

        }

      <TikTokAccessGate
          isOpen={showAccessGate}
          onClose={() => setShowAccessGate(false)} />


      <FloatingHelpButton pageName={currentPageName} userEmail={user?.email} />

      {user && effectiveEmail && preferences && !mobileMenuOpen &&
        <QuickActionsBarV2
          preferences={preferences}
          primaryColor={primaryColor}
          accentColor={accentColor} />

        }

      {soundcloudPosition === 'floating' && soundcloudUrl &&
        <FloatingSoundCloudPlayer
          playlistUrl={soundcloudUrl}
          primaryColor={primaryColor}
          accentColor={accentColor} />

        }
    </div>
    </>);

}