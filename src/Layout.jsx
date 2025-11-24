import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from './utils';
import { base44 } from '@/api/base44Client';
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
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const navItems = [
  { name: 'Home', icon: Home, path: 'Home' },
  { name: 'Dashboard', icon: LayoutDashboard, path: 'Dashboard' },
  { name: 'TikTok', icon: TrendingUp, isSection: true, subItems: [
    { name: 'TikTok Goals', icon: TrendingUp, path: 'TikTokGoals' },
    { name: 'TikTok Engagement', icon: Users, path: 'TikTokEngagement' },
    { name: 'Creator Calendar', icon: Video, path: 'LiveSchedule' },
    { name: 'Discover Creators', icon: Users, path: 'DiscoverCreators' },
  ]},
  { name: 'Gifter Songs', icon: Gift, isSection: true, subItems: [
    { name: 'Gifter Manager', icon: Gift, path: 'GifterManager' },
    { name: 'Gift Entry', icon: Gift, path: 'GiftEntry' },
    { name: 'Weekly Summary', icon: Gift, path: 'WeeklySummary' },
    { name: 'Gift Library', icon: Gift, path: 'GiftLibrary' },
  ]},
  { name: 'Goals', icon: Target, path: 'Goals' },
  { name: 'Wellness', icon: Heart, isSection: true, subItems: [
    { name: 'Daily Wellness', icon: Heart, path: 'Wellness' },
    { name: 'Supplements', icon: Pill, path: 'Supplements' },
    { name: 'Medications', icon: Pill, path: 'Medications' },
    { name: 'Mental Health', icon: Brain, path: 'MentalHealth' },
  ]},
  { name: 'Journal', icon: BookOpen, path: 'Journal' },
  { name: 'Settings', icon: Settings, path: 'Settings' },
];

export default function Layout({ children, currentPageName }) {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [expandedSections, setExpandedSections] = useState(['TikTok', 'Gifter Songs', 'Wellness']);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

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

  // Don't show layout on onboarding or home page
  if (currentPageName === 'Onboarding' || currentPageName === 'Home') {
    return children;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6924840d3628eabd1d7f8247/e225113d4_Untitleddesign.png" 
              alt="ThriveNut" 
              className="w-8 h-8"
            />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
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
            className="lg:hidden fixed inset-0 z-40 bg-white pt-16"
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
                          hasActiveSubItem ? 'bg-purple-50 text-purple-700' : 'text-gray-700 hover:bg-purple-50'
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
                                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                                    : 'text-gray-600 hover:bg-purple-50'
                                }`}
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
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                        : 'text-gray-700 hover:bg-purple-50'
                    }`}
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
        <div className="fixed left-0 top-0 bottom-0 w-72 bg-white/95 backdrop-blur-sm border-r border-gray-200 p-6 flex flex-col">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6924840d3628eabd1d7f8247/e225113d4_Untitleddesign.png" 
                alt="ThriveNut" 
                className="w-10 h-10"
              />
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                ThriveNut
              </h1>
            </div>
            <p className="text-sm text-gray-500">Crush your goals, thrive daily</p>
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
                        hasActiveSubItem ? 'bg-purple-50 text-purple-700' : 'text-gray-700 hover:bg-purple-50'
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
                                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                                  : 'text-gray-600 hover:bg-purple-50'
                              }`}
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
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                      : 'text-gray-700 hover:bg-purple-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {user && (
            <div className="pt-6 mt-6 border-t">
              <p className="text-sm text-gray-500 mb-1">Signed in as</p>
              <p className="font-semibold text-gray-800 mb-4 truncate">{user.email}</p>
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