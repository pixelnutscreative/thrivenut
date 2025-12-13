import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Loader2, AlertTriangle } from 'lucide-react';
import { getEffectiveUserEmail } from '../components/admin/ImpersonationBanner';

export default function CustomHomepage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.auth.me()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const effectiveEmail = user ? getEffectiveUserEmail(user.email) : null;

  const { data: preferences, isLoading: prefsLoading } = useQuery({
    queryKey: ['preferences', effectiveEmail],
    queryFn: async () => {
      const prefs = await base44.entities.UserPreferences.filter({ user_email: effectiveEmail }, '-updated_date');
      return prefs[0] || null;
    },
    enabled: !!effectiveEmail,
  });

  if (loading || prefsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  const customHtml = preferences?.custom_homepage_html;

  if (!customHtml || !customHtml.trim()) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-teal-50 via-purple-50 to-blue-50">
        <Card className="p-8 max-w-md text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-amber-500" />
          <h2 className="text-xl font-bold mb-2">No Custom Homepage Yet</h2>
          <p className="text-gray-600 mb-4">
            You haven't created your custom homepage yet. Go to Settings → Homepage to paste your HTML code.
          </p>
          <a 
            href="/Settings#homepage" 
            className="inline-block px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Go to Settings
          </a>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div 
        className="custom-html-container"
        dangerouslySetInnerHTML={{ __html: customHtml }}
      />
    </div>
  );
}