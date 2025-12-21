import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Trash2, EyeOff, Eye, RefreshCw, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

export default function AdminDuplicateCleanup() {
  const queryClient = useQueryClient();
  const [showHidden, setShowHidden] = useState(false);

  // Fetch all preferences
  const { data: allPrefs = [], isLoading } = useQuery({
    queryKey: ['allUserPreferencesForCleanup'],
    queryFn: async () => {
      // Fetch a large number to ensure we catch duplicates
      return await base44.entities.UserPreferences.list('-created_date', 2000);
    },
  });

  // Mutations
  const updatePrefMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.UserPreferences.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allUserPreferencesForCleanup'] });
    },
  });

  const hardDeleteMutation = useMutation({
    mutationFn: (id) => base44.entities.UserPreferences.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allUserPreferencesForCleanup'] });
    },
  });

  // Process data
  const { duplicates, hiddenOrDeleted, cleanRecords } = useMemo(() => {
    const grouped = {};
    const hidden = [];
    const clean = [];

    allPrefs.forEach(pref => {
      // Check if hidden or soft deleted
      if (pref.is_hidden_admin || pref.soft_deleted_at) {
        hidden.push(pref);
        return;
      }

      if (!pref.user_email) return; // Skip completely broken ones without email

      const email = pref.user_email.toLowerCase();
      if (!grouped[email]) grouped[email] = [];
      grouped[email].push(pref);
    });

    const dupes = Object.entries(grouped)
      .filter(([_, prefs]) => prefs.length > 1)
      .map(([email, prefs]) => ({ email, prefs }));

    return { duplicates: dupes, hiddenOrDeleted: hidden, cleanRecords: clean };
  }, [allPrefs]);

  const handleSoftDelete = (id) => {
    updatePrefMutation.mutate({
      id,
      data: { 
        soft_deleted_at: new Date().toISOString(),
        is_hidden_admin: true 
      }
    });
  };

  const handleHide = (id) => {
    updatePrefMutation.mutate({
      id,
      data: { is_hidden_admin: true }
    });
  };

  const handleRestore = (id) => {
    updatePrefMutation.mutate({
      id,
      data: { 
        soft_deleted_at: null,
        is_hidden_admin: false 
      }
    });
  };

  const calculateDataScore = (pref) => {
    let score = 0;
    if (pref.dashboard_layout?.length > 0) score += 5;
    if (pref.enabled_modules?.length > 3) score += 2; // Default is 3
    if (pref.tiktok_username) score += 3;
    if (pref.nickname) score += 2;
    if (pref.profile_image_url) score += 2;
    // Add more heuristics
    return score;
  };

  if (isLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-purple-600" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-purple-600" />
            Duplicate Cleanup Tool
          </h2>
          <p className="text-sm text-gray-500">Find and merge duplicate user records</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ['allUserPreferencesForCleanup'] })}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Hidden / Deleted Section */}
      <Accordion type="single" collapsible className="bg-white rounded-lg border">
        <AccordionItem value="hidden">
          <AccordionTrigger className="px-4 hover:no-underline">
            <div className="flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-gray-500" />
              <span>Hidden & Soft Deleted Records ({hiddenOrDeleted.length})</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            {hiddenOrDeleted.length === 0 ? (
              <p className="text-gray-500 italic">No hidden records.</p>
            ) : (
              <div className="space-y-2">
                {hiddenOrDeleted.map(pref => {
                  const daysDeleted = pref.soft_deleted_at 
                    ? differenceInDays(new Date(), new Date(pref.soft_deleted_at)) 
                    : 0;
                  const isExpired = daysDeleted > 30;

                  return (
                    <div key={pref.id} className="flex items-center justify-between p-3 bg-gray-50 rounded border text-sm">
                      <div>
                        <p className="font-medium">{pref.user_email || 'No Email'}</p>
                        <div className="flex gap-2 text-xs text-gray-500">
                          <span>ID: {pref.id}</span>
                          {pref.soft_deleted_at && (
                            <span className={isExpired ? "text-red-600 font-bold" : "text-amber-600"}>
                              Deleted {daysDeleted} days ago
                            </span>
                          )}
                          {pref.is_hidden_admin && !pref.soft_deleted_at && (
                            <span className="text-gray-600">Hidden</span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleRestore(pref.id)}>
                          <RefreshCw className="w-3 h-3 mr-1" /> Restore
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive" 
                          onClick={() => {
                            if (window.confirm('Permanently delete this record? This cannot be undone.')) {
                              hardDeleteMutation.mutate(pref.id);
                            }
                          }}
                        >
                          <Trash2 className="w-3 h-3 mr-1" /> Delete Forever
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Duplicates List */}
      <div className="space-y-6">
        {duplicates.length === 0 ? (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <AlertTitle>No Duplicates Found!</AlertTitle>
            <AlertDescription>All user emails have unique preference records.</AlertDescription>
          </Alert>
        ) : (
          duplicates.map(({ email, prefs }) => (
            <Card key={email} className="border-orange-200">
              <CardHeader className="bg-orange-50/50 pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>{email}</span>
                  <Badge variant="outline" className="bg-orange-100 text-orange-700">
                    {prefs.length} Records
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                {prefs.map(pref => {
                  const score = calculateDataScore(pref);
                  const isLikelyBest = score === Math.max(...prefs.map(calculateDataScore));

                  return (
                    <div key={pref.id} className={`p-3 rounded-lg border ${isLikelyBest ? 'border-green-200 bg-green-50/30' : 'border-gray-200 bg-white'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{format(new Date(pref.created_date), 'MMM d, yyyy')}</Badge>
                          {isLikelyBest && <Badge className="bg-green-100 text-green-700 border-green-200">Likely Primary</Badge>}
                          <span className="text-xs text-gray-400 font-mono">{pref.id}</span>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-7 text-gray-500 hover:text-gray-900"
                            onClick={() => handleHide(pref.id)}
                            title="Hide from lists"
                          >
                            <EyeOff className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-7 text-red-400 hover:text-red-600 hover:bg-red-50"
                            onClick={() => handleSoftDelete(pref.id)}
                            title="Soft Delete (30 days)"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-600">
                        <div>
                          <span className="font-semibold block">Nickname:</span>
                          {pref.nickname || '-'}
                        </div>
                        <div>
                          <span className="font-semibold block">TikTok:</span>
                          {pref.tiktok_username || '-'}
                        </div>
                        <div>
                          <span className="font-semibold block">Widgets:</span>
                          {pref.dashboard_layout?.length || 0}
                        </div>
                        <div>
                          <span className="font-semibold block">Modules:</span>
                          {pref.enabled_modules?.length || 0}
                        </div>
                        <div className="col-span-2">
                          <span className="font-semibold block">Created By:</span>
                          {pref.created_by}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}