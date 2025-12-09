import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { getEffectiveUserEmail } from '../admin/ImpersonationBanner';
import { useState, useEffect, useMemo } from 'react';

export function useTheme() {
  const [user, setUser] = useState(null);
  const [userLoading, setUserLoading] = useState(true);

  useEffect(() => {
    base44.auth.me()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setUserLoading(false));
  }, []);

  const effectiveEmail = useMemo(() => {
    if (!user || !user.email) return null;
    try {
      const email = getEffectiveUserEmail(user.email);
      return email || null;
    } catch {
      return user.email || null;
    }
  }, [user]);

  const { data: preferences, isLoading: prefsLoading } = useQuery({
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

  const primaryColor = preferences?.primary_color || '#1fd2ea';
  const accentColor = preferences?.accent_color || '#bd84f5';

  // Always light background for app
  const bgClass = 'bg-gradient-to-br from-teal-50 via-purple-50 to-blue-50';
  const textClass = 'text-gray-800';
  const subtextClass = 'text-gray-600';
  const cardBgClass = 'bg-white';
  const inputBgClass = 'bg-white';
  const borderClass = 'border-gray-200';
  const hoverClass = 'hover:bg-gray-50';
  const mutedBgClass = 'bg-gray-50';

  return {
    primaryColor,
    accentColor,
    bgClass,
    textClass,
    subtextClass,
    cardBgClass,
    inputBgClass,
    borderClass,
    hoverClass,
    mutedBgClass,
    user,
    effectiveEmail,
    preferences,
    isLoading: userLoading || (!!effectiveEmail && prefsLoading),
  };
}