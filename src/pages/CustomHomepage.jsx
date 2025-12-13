import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Loader2, AlertTriangle } from 'lucide-react';
import { getEffectiveUserEmail } from '../components/admin/ImpersonationBanner';
import { format } from 'date-fns';
import MyDaySection from '../components/dashboard/MyDaySection';

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

  const queryClient = useQueryClient();
  const today = format(new Date(), 'yyyy-MM-dd');

  const { data: preferences, isLoading: prefsLoading } = useQuery({
    queryKey: ['preferences', effectiveEmail],
    queryFn: async () => {
      const prefs = await base44.entities.UserPreferences.filter({ user_email: effectiveEmail }, '-updated_date');
      return prefs[0] || null;
    },
    enabled: !!effectiveEmail,
  });

  const { data: selfCareLog } = useQuery({
    queryKey: ['selfCareLog', today, effectiveEmail],
    queryFn: async () => {
      const logs = await base44.entities.DailySelfCareLog.filter({ date: today, created_by: effectiveEmail });
      return logs[0] || null;
    },
    enabled: !!effectiveEmail,
  });

  const { data: urgentEvents = [] } = useQuery({
    queryKey: ['urgentEventsToday', today, effectiveEmail],
    queryFn: async () => {
      return await base44.entities.ExternalEvent.filter({ date: today, is_urgent: true, created_by: effectiveEmail });
    },
    enabled: !!effectiveEmail
  });

  const updateSelfCareMutation = useMutation({
    mutationFn: async (updates) => {
      if (selfCareLog) {
        return await base44.entities.DailySelfCareLog.update(selfCareLog.id, updates);
      } else {
        return await base44.entities.DailySelfCareLog.create({ date: today, ...updates });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['selfCareLog'] });
    },
  });

  const handleToggleTask = (taskId, value) => {
    updateSelfCareMutation.mutate({ [taskId]: value });
  };

  const handleUpdateMealNotes = (noteKey, noteValue) => {
    updateSelfCareMutation.mutate({ [noteKey]: noteValue });
  };

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
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-purple-50 to-blue-50">
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        {/* Urgent Events Section */}
        {urgentEvents.length > 0 && (
          <Card className="bg-gradient-to-r from-amber-400 to-orange-500 border-0 shadow-xl">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <AlertTriangle className="w-6 h-6" />
                DO NOT MISS THESE EVENTS
              </h2>
              <div className="grid gap-3">
                {urgentEvents.map(event => (
                  <div key={event.id} className="bg-white rounded-lg p-4 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col items-center justify-center w-14 h-14 bg-amber-50 rounded-lg border-2 border-amber-200">
                        <span className="text-sm font-bold text-amber-700">{event.time}</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900">{event.title}</h4>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <span>@{event.host_username}</span>
                          <span>•</span>
                          <span>{event.platform}</span>
                        </div>
                      </div>
                    </div>
                    {event.link && (
                      <a 
                        href={event.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors font-medium"
                      >
                        Join →
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* Compact My Day Section */}
        <MyDaySection
          selfCareLog={selfCareLog}
          onToggleTask={handleToggleTask}
          onUpdateMealNotes={handleUpdateMealNotes}
          preferences={preferences}
          viewMode="compact"
        />

        {/* Custom HTML Content */}
        <div 
          className="custom-html-container bg-white rounded-xl shadow-lg overflow-hidden"
          dangerouslySetInnerHTML={{ __html: customHtml }}
        />
      </div>
    </div>
  );
}