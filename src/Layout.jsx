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
  Music
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Map module IDs to nav items
const moduleNavMap = {
  tiktok: ['TikTok'],
  gifter: ['Gifter Songs'],
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
  { name: 'Home', icon: Home, path: 'Home', alwaysShow: true },
  { name: 'Dashboard', icon: LayoutDashboard, path: 'Dashboard', alwaysShow: true },
  { name: 'TikTok', icon: TrendingUp, isSection: true, moduleId: 'tiktok', subItems: [
            { name: 'TikTok Dashboard', icon: TrendingUp, path: 'TikTokDashboard' },
            { name: 'TikTok Contacts', icon: Users, path: 'TikTokContacts' },
            { name: 'Content Goals', icon: TrendingUp, path: 'TikTokGoals' },
            { name: 'TikTok Engagement', icon: Users, path: 'TikTokEngagement' },
            { name: 'Creator Calendar', icon: Video, path: 'LiveSchedule' },
            { name: 'Live Reminders', icon: Bell, path: 'LiveReminders' },
            { name: 'Discover Creators', icon: Users, path: 'DiscoverCreators' },
          ]},
  { name: 'Gifter Songs', icon: Gift, isSection: true, moduleId: 'gifter', subItems: [
                    { name: 'Song Generator', icon: Music, path: 'SongGenerator' },
                    { name: 'Gifter Manager', icon: Gift, path: 'GifterManager' },
                    { name: 'Gift Entry', icon: Gift, path: 'GiftEntry' },
                    { name: 'AI Screenshot Import', icon: Gift, path: 'GiftScreenshotImport' },
                    { name: 'Weekly Summary', icon: Gift, path: 'WeeklySummary' },
                    { name: 'Gift Library', icon: Gift, path: 'GiftLibrary' },
                  ]},
  { name: 'Goals', icon: Target, path: 'Goals', moduleId: 'goals' },
  { name: 'Goal Sharing', icon: Share2, path: 'GoalSharing', moduleId: 'goals' },
  { name: 'Wellness', icon: Heart, isSection: true, moduleId: 'wellness', subItems: [
    { name: 'Daily Wellness', icon: Heart, path: 'Wellness' },
    { name: 'Supplements', icon: Pill, path: 'Supplements', moduleId: 'supplements' },
    { name: 'Medications', icon: Pill, path: 'Medications', moduleId: 'medications' },
    { name: 'Pet Care', icon: Heart, path: 'PetCare', moduleId: 'pets' },
    { name: 'Care Reminders', icon: Heart, path: 'CareReminders', moduleId: 'care_reminders' },
  ]},
  { name: 'My People', icon: Users, path: 'People', moduleId: 'people' },
  { name: 'Journal', icon: BookOpen, path: 'Journal', moduleId: 'journal' },
  { name: 'Settings', icon: Settings, path: 'Settings', alwaysShow: true },
  { name: 'Mental Health', icon: Brain, path: 'NeurodivergentSettings', moduleId: 'mental_health' },
];

export default function Layout({ children, currentPageName }) {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [expandedSections, setExpandedSections] = useState(['TikTok', 'Gifter Songs', 'Wellness']);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: preferences } = useQuery({
    queryKey: ['preferences', user?.email],
    queryFn: async () => {
      const prefs = await base44.entities.UserPreferences.filter({ user_email: user.email }, '-updated_date');
      return prefs[0] || null;
    },
    enabled: !!user,
  });

  const enabledModules = preferences?.enabled_modules || ['tiktok', 'gifter', 'goals', 'wellness', 'supplements', 'medications', 'pets', 'care_reminders', 'people', 'journal', 'mental_health'];

  // Filter nav items based on enabled modules
  const navItems = allNavItems.filter(item => {
    if (item.alwaysShow) return true;
    if (item.moduleId && !enabledModules.includes(item.moduleId)) return false;
    return true;
  }).map(item => {
    // Filter sub-items too
    if (item.subItems) {
      const filteredSubItems = item.subItems.filter(sub => {
        if (!sub.moduleId) return true;
        return enabledModules.includes(sub.moduleId);
      });
      return { ...item, subItems: filteredSubItems };
    }
    return item;
  });

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

  // Get theme colors
  const primaryColor = preferences?.primary_color || '#1fd2ea';
  const accentColor = preferences?.accent_color || '#bd84f5';
  const isDark = preferences?.theme_type === 'dark';

  // Don't show layout on onboarding or home page
  if (currentPageName === 'Onboarding' || currentPageName === 'Home') {
    return children;
  }

  const bgClass = isDark 
    ? 'bg-[#1f1f23] text-gray-100' 
    : 'bg-gradient-to-br from-teal-50 via-purple-50 to-blue-50 text-gray-900';

  const sidebarClass = isDark
    ? 'bg-[#2a2a30]/95 border-gray-700'
    : 'bg-white/95 border-gray-200';

  const textClass = isDark ? 'text-gray-100' : 'text-gray-800';
  const subtextClass = isDark ? 'text-gray-400' : 'text-gray-500';
  const hoverClass = isDark ? 'hover:bg-gray-700/50' : 'hover:bg-teal-50';

  return (
    <div className={`min-h-screen ${bgClass}`} style={{ '--primary-color': primaryColor, '--accent-color': accentColor }}>
      {/* Mobile Header */}
      <div className={`lg:hidden fixed top-0 left-0 right-0 z-50 backdrop-blur-sm border-b px-4 py-3 ${sidebarClass}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6924840d3628eabd1d7f8247/e225113d4_Untitleddesign.png" 
              alt="ThriveNut" 
              className="w-8 h-8"
            />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-purple-400 bg-clip-text text-transparent">
              ThriveNut
            </h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </Button>
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
                  return (
                    <div key={item.name}>
                      <button
                        onClick={() => toggleSection(item.name)}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                              hasActiveSubItem 
                                ? (isDark ? 'bg-gray-700 text-teal-400' : 'bg-teal-50 text-teal-700')
                                : (isDark ? 'text-gray-300 hover:bg-gray-700/50' : 'text-gray-700 hover:bg-teal-50')
                            }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="w-5 h-5" />
                          <span className="font-medium">{item.name}</span>
                        </div>
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>
                      {isExpanded && (
                        <div className="ml-4 mt-1 space-y-1">
                          {item.subItems.map(subItem => {
                            const SubIcon = subItem.icon;
                            const subIsActive = currentPageName === subItem.path;
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
                    className="w-full"
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
            <div className="flex items-center gap-3 mb-2">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6924840d3628eabd1d7f8247/e225113d4_Untitleddesign.png" 
                alt="ThriveNut" 
                className="w-10 h-10"
              />
              <h1 
                className="text-3xl font-bold bg-clip-text text-transparent"
                style={{ backgroundImage: `linear-gradient(to right, ${primaryColor}, ${accentColor})` }}
              >
                ThriveNut
              </h1>
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
                return (
                  <div key={item.name}>
                    <button
                      onClick={() => toggleSection(item.name)}
                      className={`w-full flex items-center justify-between px-4 py-2 rounded-xl transition-all ${
                        hasActiveSubItem 
                          ? (isDark ? 'bg-gray-700 text-teal-400' : 'bg-teal-50 text-teal-700')
                          : (isDark ? 'text-gray-300 hover:bg-gray-700/50' : 'text-gray-700 hover:bg-teal-50')
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-5 h-5" />
                        <span className="font-medium">{item.name}</span>
                      </div>
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                    {isExpanded && (
                      <div className="ml-4 mt-1 space-y-1">
                        {item.subItems.map(subItem => {
                          const SubIcon = subItem.icon;
                          const subIsActive = currentPageName === subItem.path;
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
                    className={`w-full ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : ''}`}
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
    </div>
  );
}