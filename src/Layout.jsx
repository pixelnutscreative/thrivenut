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
  TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const navItems = [
  { name: 'Dashboard', icon: LayoutDashboard, path: 'Dashboard' },
  { name: 'TikTok Goals', icon: TrendingUp, path: 'TikTokGoals' },
  { name: 'Goals', icon: Target, path: 'Goals' },
  { name: 'Wellness', icon: Heart, path: 'Wellness' },
  { name: 'Journal', icon: BookOpen, path: 'Journal' },
];

export default function Layout({ children, currentPageName }) {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const handleLogout = async () => {
    await base44.auth.logout();
  };

  // Don't show layout on onboarding
  if (currentPageName === 'Onboarding') {
    return children;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            ThriveNut
          </h1>
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
            <nav className="p-6 space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPageName === item.path;
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
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
              ThriveNut
            </h1>
            <p className="text-sm text-gray-500">Crush your goals, thrive daily</p>
          </div>

          <nav className="flex-1 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPageName === item.path;
              return (
                <Link
                  key={item.name}
                  to={createPageUrl(item.path)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg scale-105'
                      : 'text-gray-700 hover:bg-purple-50 hover:scale-102'
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