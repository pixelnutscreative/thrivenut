import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, ExternalLink, Check, Calendar, BookOpen, History, Settings, UserPlus } from 'lucide-react';
import { format, getDay, addDays, parseISO, isPast, getDate } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { getEffectiveUserEmail } from '../components/admin/ImpersonationBanner';
import { useTheme } from '../components/shared/useTheme';

const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const getDayName = (date) => daysOfWeek[getDay(date)];

export default function TikTokEngagement() {
  const queryClient = useQueryClient();
  const [expandedHistory, setExpandedHistory] = useState({});
  const [viewMode, setViewMode] = useState('today');
  const [justEngaged, setJustEngaged] = useState({}); // { contactId: { primary: true, 0: true, 1: true } }
  const [user, setUser] = useState(null);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [scheduleForm, setScheduleForm] = useState({
    engagement_frequency: 'weekly',
    engagement_days: [],
    engagement_day_of_month: 1
  });

  React.useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const effectiveEmail = user ? getEffectiveUserEmail(user.email) : null;
  const { isDark, bgClass, textClass, cardBgClass, subtextClass } = useTheme();

  const { data: preferences } = useQuery({
    queryKey: ['preferences', effectiveEmail],
    queryFn: async () => {
      const prefs = await base44.entities.UserPreferences.filter({ user_email: effectiveEmail }, '-updated_date');
      return prefs[0] || null;
    },
    enabled: !!effectiveEmail,
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ['tiktokContacts', effectiveEmail],
    queryFn: () => base44.entities.TikTokContact.filter({ created_by: effectiveEmail }, '-created_date'),
    enabled: !!effectiveEmail,
  });

  const { data: legacyCreators = [] } = useQuery({
    queryKey: ['tiktokCreators', effectiveEmail],
    queryFn: () => base44.entities.TikTokCreator.filter({ created_by: effectiveEmail }, '-created_date'),
    enabled: !!effectiveEmail,
  });

  const engagementContacts = [
    ...contacts.filter(c => c.engagement_enabled),
    ...legacyCreators.map(c => ({
      ...c,
      engagement_enabled: true,
      engagement_frequency: c.engagement_frequency,
      engagement_days: c.specific_days,
      engagement_category_id: c.category_id,
      engagement_history: c.engagement_history,
      last_engaged_date: c.last_engaged_date,
      _isLegacy: true
    }))
  ];

  const { data: categories = [] } = useQuery({
    queryKey: ['engagementCategories', effectiveEmail],
    queryFn: () => base44.entities.EngagementCategory.filter({ created_by: effectiveEmail }, 'name'),
    enabled: !!effectiveEmail,
  });

  const markEngagedMutation = useMutation({
    mutationFn: async ({ id, currentHistory, isLegacy }) => {
      const newTimestamp = new Date().toISOString();
      const updatedHistory = [...(currentHistory || []), newTimestamp];
      
      if (isLegacy) {
        return await base44.entities.TikTokCreator.update(id, {
          last_engaged_date: format(new Date(), 'yyyy-MM-dd'),
          engagement_history: updatedHistory
        });
      }
      
      return await base44.entities.TikTokContact.update(id, {
        last_engaged_date: format(new Date(), 'yyyy-MM-dd'),
        engagement_history: updatedHistory
      });
    },
    onSuccess: (_, variables) => {
      setJustEngaged(prev => ({ ...prev, [variables.id]: true }));
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['tiktokContacts'] });
        queryClient.invalidateQueries({ queryKey: ['tiktokCreators'] });
      }, 800);
    },
  });

  const updateScheduleMutation = useMutation({
    mutationFn: async ({ id, data, isLegacy }) => {
      if (isLegacy) {
        return await base44.entities.TikTokCreator.update(id, {
          engagement_frequency: data.engagement_frequency,
          specific_days: data.engagement_days
        });
      }
      return await base44.entities.TikTokContact.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tiktokContacts'] });
      queryClient.invalidateQueries({ queryKey: ['tiktokCreators'] });
      setEditingSchedule(null);
    },
  });

  const openTikTok = (username) => {
    window.open(`https://tiktok.com/@${username}`, '_blank');
  };

  const getFrequencyLabel = (contact) => {
    if (contact.engagement_frequency === 'daily') return 'Daily';
    if (contact.engagement_frequency === 'monthly') {
      const day = contact.engagement_day_of_month || 1;
      const suffix = day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th';
      return `Monthly (${day}${suffix})`;
    }
    if (contact.engagement_days?.length) {
      return contact.engagement_days.map(d => d.slice(0, 3)).join(', ');
    }
    return 'Multiple/Week';
  };

  const getCategoryName = (categoryId) => {
    const cat = categories.find(c => c.id === categoryId);
    return cat ? cat.name : null;
  };

  const handleEditSchedule = (contact) => {
    setScheduleForm({
      engagement_frequency: contact.engagement_frequency || 'weekly',
      engagement_days: contact.engagement_days || [],
      engagement_day_of_month: contact.engagement_day_of_month || 1
    });
    setEditingSchedule(contact);
  };

  const handleSaveSchedule = () => {
    if (!editingSchedule) return;
    updateScheduleMutation.mutate({
      id: editingSchedule.id,
      data: scheduleForm,
      isLegacy: editingSchedule._isLegacy
    });
  };

  const toggleDay = (day) => {
    setScheduleForm(prev => ({
      ...prev,
      engagement_days: prev.engagement_days.includes(day)
        ? prev.engagement_days.filter(d => d !== day)
        : [...prev.engagement_days, day]
    }));
  };

  const today = format(new Date(), 'yyyy-MM-dd');
  const currentDayName = getDayName(new Date());
  const currentDayOfMonth = getDate(new Date());

  // Check if all accounts for a contact are engaged
  const isFullyEngaged = (contact) => {
    const engaged = justEngaged[contact.id];
    if (!engaged) return false;
    
    // Must have primary checked (if they have a TikTok username)
    if (contact.username && !engaged.primary) return false;
    
    // Must have all other TikTok accounts checked
    const otherAccounts = contact.other_tiktok_accounts || [];
    for (let i = 0; i < otherAccounts.length; i++) {
      if (!engaged[`tiktok_${i}`]) return false;
    }
    
    // Must have all social engagement accounts checked
    if (contact.social_engagement) {
      for (const [platform, enabled] of Object.entries(contact.social_engagement)) {
        if (enabled && contact.social_links?.[platform] && !engaged[`social_${platform}`]) {
          return false;
        }
      }
    }
    
    return true;
  };

  const contactsToShow = engagementContacts.filter(contact => {
    if (viewMode === 'all') return true;
    
    // Only hide if ALL accounts are engaged
    if (isFullyEngaged(contact)) return false;

    const lastEngagedToday = contact.last_engaged_date === today;
    if (lastEngagedToday) return false;

    if (contact.engagement_frequency === 'daily') return true;

    if (contact.engagement_frequency === 'monthly') {
      const targetDay = contact.engagement_day_of_month || 1;
      if (currentDayOfMonth !== targetDay) return false;
      if (!contact.last_engaged_date) return true;
      const lastEngagedDate = parseISO(contact.last_engaged_date);
      const oneMonthAgo = addDays(new Date(), -28);
      return lastEngagedDate <= oneMonthAgo;
    }

    if (contact.engagement_frequency === 'multiple_per_week') {
      return contact.engagement_days?.includes(currentDayName);
    }

    return true;
  }).sort((a, b) => {
    // Sort by last engaged date - oldest first (null/never engaged at top)
    if (!a.last_engaged_date && !b.last_engaged_date) return 0;
    if (!a.last_engaged_date) return -1;
    if (!b.last_engaged_date) return 1;
    return new Date(a.last_engaged_date) - new Date(b.last_engaged_date);
  });

  const CreatorCard = ({ contact, index }) => {
    const engaged = justEngaged[contact.id] || {};
    const fullyEngaged = isFullyEngaged(contact);
    const categoryName = getCategoryName(contact.engagement_category_id);

    const toggleAccountEngaged = (accountKey) => {
      setJustEngaged(prev => ({
        ...prev,
        [contact.id]: {
          ...(prev[contact.id] || {}),
          [accountKey]: !(prev[contact.id]?.[accountKey])
        }
      }));
    };

    return (
      <motion.div
        key={contact.id}
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={fullyEngaged ? { opacity: 0, scale: 0.8, y: -20 } : { opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        <Card 
          className={`hover:shadow-lg transition-shadow overflow-hidden ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}
          style={{ borderTop: `4px solid ${contact.color || '#8B5CF6'}` }}
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className={`text-lg ${textClass}`}>@{contact.username}</CardTitle>
                {contact.display_name && (
                  <p className={`text-sm ${subtextClass}`}>{contact.display_name}</p>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <p className={`text-sm ${subtextClass}`}>{getFrequencyLabel(contact)}</p>
                  {categoryName && (
                    <Badge variant="outline" className="text-xs" style={{ borderColor: contact.color }}>
                      {categoryName}
                    </Badge>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleEditSchedule(contact)}
                className="text-gray-400 hover:text-purple-600"
                title="Edit Schedule"
              >
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {contact.last_engaged_date && (
              <div className="flex items-center justify-between">
                <div className={`flex items-center gap-2 text-sm ${subtextClass}`}>
                  <Calendar className="w-4 h-4" />
                  <span>Last: {format(new Date(contact.last_engaged_date), 'MMM d, yyyy')}</span>
                </div>
                {contact.engagement_history?.length > 0 && (
                  <Badge variant="secondary" className="text-xs">{contact.engagement_history.length} total</Badge>
                )}
              </div>
            )}
            
            {contact.notes && <p className={`text-sm ${subtextClass} italic`}>{contact.notes}</p>}

            {contact.engagement_history?.length > 0 && (
              <div className="space-y-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpandedHistory(prev => ({ ...prev, [contact.id]: !prev[contact.id] }))}
                  className="w-full justify-start text-xs text-gray-600"
                >
                  <History className="w-3 h-3 mr-2" />
                  {expandedHistory[contact.id] ? 'Hide' : 'Show'} Engagement Log
                </Button>
                
                {expandedHistory[contact.id] && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="max-h-32 overflow-y-auto space-y-1 pl-2 border-l-2 border-purple-200"
                  >
                    {[...contact.engagement_history].reverse().map((timestamp, idx) => (
                      <p key={idx} className="text-xs text-gray-500">✓ {format(new Date(timestamp), 'MMM d, yyyy h:mm a')}</p>
                    ))}
                  </motion.div>
                )}
              </div>
            )}

            {/* All TikTok accounts with checkmarks */}
            <div className="space-y-2 pt-2">
              {/* Primary TikTok account */}
              {contact.username && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      toggleAccountEngaged('primary');
                      // Also update the database when primary is checked
                      if (!engaged.primary) {
                        markEngagedMutation.mutate({ id: contact.id, currentHistory: contact.engagement_history, isLegacy: contact._isLegacy });
                      }
                    }}
                    className={`h-9 w-9 flex-shrink-0 transition-all duration-300 ${engaged.primary ? 'bg-green-500 border-green-500' : 'border-green-300 hover:bg-green-50'}`}
                    title="Mark as engaged"
                  >
                    <Check className={`w-4 h-4 ${engaged.primary ? 'text-white' : 'text-green-600'}`} />
                  </Button>
                  <Button 
                    onClick={() => openTikTok(contact.username)} 
                    className="flex-1 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 h-9 text-sm overflow-hidden"
                  >
                    <ExternalLink className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">@{contact.username}</span>
                  </Button>
                </div>
              )}
              
              {/* Other TikTok accounts */}
              {contact.other_tiktok_accounts?.map((acc, idx) => {
                const account = typeof acc === 'string' ? { username: acc } : acc;
                const isAccountEngaged = engaged[`tiktok_${idx}`];
                return (
                  <div key={`tiktok-${idx}`} className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => toggleAccountEngaged(`tiktok_${idx}`)}
                      className={`h-9 w-9 flex-shrink-0 transition-all duration-300 ${isAccountEngaged ? 'bg-green-500 border-green-500' : 'border-gray-200 hover:bg-green-50'}`}
                      title="Mark as engaged"
                    >
                      <Check className={`w-4 h-4 ${isAccountEngaged ? 'text-white' : 'text-gray-300'}`} />
                    </Button>
                    <Button 
                      onClick={() => openTikTok(account.username)} 
                      variant="outline"
                      className="flex-1 h-9 text-sm text-pink-600 border-pink-200 hover:bg-pink-50 overflow-hidden"
                    >
                      <ExternalLink className="w-3 h-3 mr-1 flex-shrink-0" />
                      <span className="truncate">@{account.username}</span>
                    </Button>
                  </div>
                );
              })}

              {/* Social media links with engagement enabled */}
              {contact.social_engagement && Object.entries(contact.social_engagement)
                .filter(([_, enabled]) => enabled)
                .map(([platform]) => {
                  const link = contact.social_links?.[platform];
                  if (!link) return null;
                  const isAccountEngaged = engaged[`social_${platform}`];
                  const platformLabel = platform.startsWith('custom_') 
                    ? platform.replace('custom_', '').replace(/_/g, ' ')
                    : platform.charAt(0).toUpperCase() + platform.slice(1);
                  
                  // Platform colors
                  const platformColors = {
                    instagram: 'from-purple-500 to-pink-500 text-white border-0',
                    facebook: 'bg-blue-600 text-white border-0 hover:bg-blue-700',
                    youtube: 'bg-red-600 text-white border-0 hover:bg-red-700',
                    twitter: 'bg-black text-white border-0 hover:bg-gray-800',
                    linkedin: 'bg-blue-700 text-white border-0 hover:bg-blue-800',
                    twitch: 'bg-purple-600 text-white border-0 hover:bg-purple-700',
                    threads: 'bg-black text-white border-0 hover:bg-gray-800',
                    discord: 'bg-indigo-600 text-white border-0 hover:bg-indigo-700',
                    snapchat: 'bg-yellow-400 text-black border-0 hover:bg-yellow-500',
                    pinterest: 'bg-red-700 text-white border-0 hover:bg-red-800',
                  };
                  const colorClass = platform === 'instagram' 
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 hover:from-purple-600 hover:to-pink-600'
                    : platformColors[platform] || 'bg-gray-600 text-white border-0 hover:bg-gray-700';
                  
                  // Determine the URL to open
                  const getUrl = () => {
                    if (link.startsWith('http')) return link;
                    if (platform === 'instagram') return `https://instagram.com/${link.replace('@', '')}`;
                    if (platform === 'facebook') return `https://facebook.com/${link}`;
                    if (platform === 'youtube') return `https://youtube.com/@${link.replace('@', '')}`;
                    if (platform === 'twitter') return `https://twitter.com/${link.replace('@', '')}`;
                    if (platform === 'twitch') return `https://twitch.tv/${link}`;
                    return link;
                  };

                  return (
                    <div key={`social-${platform}`} className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => toggleAccountEngaged(`social_${platform}`)}
                        className={`h-9 w-9 flex-shrink-0 transition-all duration-300 ${isAccountEngaged ? 'bg-green-500 border-green-500' : 'border-gray-200 hover:bg-green-50'}`}
                        title="Mark as engaged"
                      >
                        <Check className={`w-4 h-4 ${isAccountEngaged ? 'text-white' : 'text-gray-300'}`} />
                      </Button>
                      <Button 
                        onClick={() => window.open(getUrl(), '_blank')} 
                        className={`flex-1 h-9 text-sm overflow-hidden ${colorClass}`}
                      >
                        <ExternalLink className="w-3 h-3 mr-1 flex-shrink-0" />
                        <span className="truncate">{platformLabel}: {link}</span>
                      </Button>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className={`min-h-screen ${bgClass} p-4 md:p-8`}>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className={`text-3xl font-bold ${textClass}`}>Social Engagement Tracker</h1>
            <p className={`${subtextClass} mt-1`}>Engage with creators you've added to your contacts</p>
          </div>
          <Link to={createPageUrl('TikTokContacts')}>
            <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
              <UserPlus className="w-4 h-4 mr-2" />
              Manage Contacts
            </Button>
          </Link>
        </div>

        {/* Engagement Guide */}
        <Card className={isDark ? 'bg-gradient-to-r from-blue-900/30 to-cyan-900/30 border-blue-700' : 'bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200'}>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <BookOpen className={`w-6 h-6 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
              <div className="flex-1">
                <h3 className={`font-semibold ${textClass}`}>How to Properly Engage</h3>
                <p className={`text-sm ${subtextClass}`}>Learn the best practices for meaningful engagement</p>
              </div>
              <Button variant="outline" onClick={() => window.open('https://www.tiktok.com/@pixelnutscreative/video/7568313920054627598', '_blank')} className="border-blue-300 hover:bg-blue-100">
                <ExternalLink className="w-4 h-4 mr-2" />
                View Guide
              </Button>
            </div>
          </CardContent>
        </Card>

        {engagementContacts.length === 0 ? (
          <Card className={`p-12 text-center ${cardBgClass}`}>
            <p className={`${subtextClass} mb-4`}>No contacts set up for engagement tracking yet.</p>
            <Link to={createPageUrl('TikTokContacts')}>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Contacts
              </Button>
            </Link>
          </Card>
        ) : (
          <Tabs value={viewMode} onValueChange={setViewMode} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="today">Due Today ({contactsToShow.length})</TabsTrigger>
              <TabsTrigger value="all">View All ({engagementContacts.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="today" className="mt-4">
              <motion.div layout className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence mode="popLayout">
                  {contactsToShow.length === 0 ? (
                    <Card className={`col-span-full p-12 text-center ${cardBgClass}`}>
                      <p className={`${subtextClass} mb-4`}>🎉 No creators due today. Great job!</p>
                      <Button onClick={() => setViewMode('all')} variant="outline">View All Creators</Button>
                    </Card>
                  ) : (
                    contactsToShow.map((contact, index) => <CreatorCard key={contact.id} contact={contact} index={index} />)
                  )}
                </AnimatePresence>
              </motion.div>
            </TabsContent>

            <TabsContent value="all" className="mt-4">
              {Object.keys(justEngaged).length > 0 && (
                <div className="mb-4 flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setJustEngaged({})}
                    className="text-gray-600 hover:text-gray-800"
                  >
                    Reset All Checkmarks
                  </Button>
                </div>
              )}
              <motion.div layout className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence mode="popLayout">
                  {engagementContacts.map((contact, index) => <CreatorCard key={contact.id} contact={contact} index={index} />)}
                </AnimatePresence>
              </motion.div>
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* Edit Schedule Modal */}
      <Dialog open={!!editingSchedule} onOpenChange={(open) => !open && setEditingSchedule(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Engagement Schedule</DialogTitle>
          </DialogHeader>
          
          {editingSchedule && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: editingSchedule.color || '#8B5CF6' }} />
                <div>
                  <p className="font-semibold">@{editingSchedule.username}</p>
                  {editingSchedule.display_name && (
                    <p className="text-sm text-gray-600">{editingSchedule.display_name}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Frequency</Label>
                <Select 
                  value={scheduleForm.engagement_frequency} 
                  onValueChange={(v) => setScheduleForm({ ...scheduleForm, engagement_frequency: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="multiple_per_week">Specific Days</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {scheduleForm.engagement_frequency === 'multiple_per_week' && (
                <div className="space-y-2">
                  <Label>Days</Label>
                  <div className="flex flex-wrap gap-2">
                    {daysOfWeek.map(day => (
                      <Badge
                        key={day}
                        variant={scheduleForm.engagement_days.includes(day) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => toggleDay(day)}
                      >
                        {day.slice(0, 3)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {scheduleForm.engagement_frequency === 'monthly' && (
                <div className="space-y-2">
                  <Label>Day of Month</Label>
                  <Select 
                    value={String(scheduleForm.engagement_day_of_month || 1)} 
                    onValueChange={(v) => setScheduleForm({ ...scheduleForm, engagement_day_of_month: parseInt(v) })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                        <SelectItem key={day} value={String(day)}>
                          {day === 1 ? '1st' : day === 2 ? '2nd' : day === 3 ? '3rd' : `${day}th`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingSchedule(null)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveSchedule}
              disabled={updateScheduleMutation.isPending}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {updateScheduleMutation.isPending ? 'Saving...' : 'Save Schedule'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}