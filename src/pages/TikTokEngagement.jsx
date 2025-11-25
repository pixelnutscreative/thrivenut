import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, ExternalLink, Check, Calendar, BookOpen, History, FolderPlus, UserPlus } from 'lucide-react';
import { format, getDay, addDays, parseISO, isPast } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';

const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const getDayName = (date) => daysOfWeek[getDay(date)];

export default function TikTokEngagement() {
  const queryClient = useQueryClient();
  const [expandedHistory, setExpandedHistory] = useState({});
  const [viewMode, setViewMode] = useState('today');
  const [justEngaged, setJustEngaged] = useState({});
  const [user, setUser] = useState(null);

  React.useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  // Fetch contacts with engagement enabled
  const { data: contacts = [] } = useQuery({
    queryKey: ['tiktokContacts', user?.email],
    queryFn: () => base44.entities.TikTokContact.filter({ created_by: user.email }, '-created_date'),
    enabled: !!user,
  });

  // Also fetch legacy TikTokCreator records for backwards compatibility
  const { data: legacyCreators = [] } = useQuery({
    queryKey: ['tiktokCreators', user?.email],
    queryFn: () => base44.entities.TikTokCreator.filter({ created_by: user.email }, '-created_date'),
    enabled: !!user,
  });

  // Combine: contacts with engagement_enabled + legacy creators
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
    queryKey: ['engagementCategories', user?.email],
    queryFn: () => base44.entities.EngagementCategory.filter({ created_by: user.email }, 'name'),
    enabled: !!user,
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

  const openTikTok = (username) => {
    window.open(`https://tiktok.com/@${username}`, '_blank');
  };

  const getFrequencyLabel = (contact) => {
    if (contact.engagement_frequency === 'daily') return 'Daily';
    if (contact.engagement_frequency === 'weekly') return 'Weekly';
    if (contact.engagement_days?.length) {
      return contact.engagement_days.map(d => d.slice(0, 3)).join(', ');
    }
    return 'Multiple/Week';
  };

  const getCategoryName = (categoryId) => {
    const cat = categories.find(c => c.id === categoryId);
    return cat ? cat.name : null;
  };

  const today = format(new Date(), 'yyyy-MM-dd');
  const currentDayName = getDayName(new Date());

  const contactsToShow = engagementContacts.filter(contact => {
    if (viewMode === 'all') return true;
    if (justEngaged[contact.id]) return false;

    const lastEngagedToday = contact.last_engaged_date === today;
    if (lastEngagedToday) return false;

    if (contact.engagement_frequency === 'daily') return true;

    if (contact.engagement_frequency === 'weekly') {
      if (!contact.last_engaged_date) return true;
      const lastEngagedDate = parseISO(contact.last_engaged_date);
      const oneWeekAgo = addDays(new Date(), -7);
      return isPast(lastEngagedDate) && lastEngagedDate <= oneWeekAgo;
    }

    if (contact.engagement_frequency === 'multiple_per_week') {
      return contact.engagement_days?.includes(currentDayName);
    }

    return true;
  });

  const CreatorCard = ({ contact, index }) => {
    const isEngaged = justEngaged[contact.id];
    const categoryName = getCategoryName(contact.engagement_category_id);

    return (
      <motion.div
        key={contact.id}
        initial={{ opacity: 0, y: 20 }}
        animate={isEngaged ? { opacity: 0, scale: 0.8, y: -20 } : { opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ delay: isEngaged ? 0 : index * 0.05, duration: isEngaged ? 0.5 : 0.3 }}
      >
        <Card 
          className="hover:shadow-lg transition-shadow overflow-hidden"
          style={{ borderTop: `4px solid ${contact.color || '#8B5CF6'}` }}
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg">@{contact.username}</CardTitle>
                {contact.display_name && (
                  <p className="text-sm text-gray-600">{contact.display_name}</p>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-sm text-gray-500">{getFrequencyLabel(contact)}</p>
                  {categoryName && (
                    <Badge variant="outline" className="text-xs" style={{ borderColor: contact.color }}>
                      {categoryName}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {contact.last_engaged_date && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>Last: {format(new Date(contact.last_engaged_date), 'MMM d, yyyy')}</span>
                </div>
                {contact.engagement_history?.length > 0 && (
                  <Badge variant="secondary" className="text-xs">{contact.engagement_history.length} total</Badge>
                )}
              </div>
            )}
            
            {contact.notes && <p className="text-sm text-gray-600 italic">{contact.notes}</p>}

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

            <div className="flex gap-2 pt-2">
              <Button onClick={() => openTikTok(contact.username)} className="flex-1 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600">
                <ExternalLink className="w-4 h-4 mr-2" />
                Visit Profile
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => markEngagedMutation.mutate({ id: contact.id, currentHistory: contact.engagement_history, isLegacy: contact._isLegacy })}
                className={`transition-all duration-300 ${isEngaged ? 'bg-green-500 border-green-500' : 'border-green-300 hover:bg-green-50'}`}
                title="Mark as engaged"
              >
                <Check className={`w-4 h-4 ${isEngaged ? 'text-white' : 'text-green-600'}`} />
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">TikTok Engagement Tracker</h1>
            <p className="text-gray-600 mt-1">Engage with creators you've added to your contacts</p>
          </div>
          <Link to={createPageUrl('TikTokContacts')}>
            <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
              <UserPlus className="w-4 h-4 mr-2" />
              Manage Contacts
            </Button>
          </Link>
        </div>

        {/* Engagement Guide */}
        <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <BookOpen className="w-6 h-6 text-blue-600" />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800">How to Properly Engage</h3>
                <p className="text-sm text-gray-600">Learn the best practices for meaningful engagement</p>
              </div>
              <Button variant="outline" onClick={() => window.open('https://www.tiktok.com/@pixelnutscreative/video/7568313920054627598', '_blank')} className="border-blue-300 hover:bg-blue-100">
                <ExternalLink className="w-4 h-4 mr-2" />
                View Guide
              </Button>
            </div>
          </CardContent>
        </Card>

        {engagementContacts.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-gray-500 mb-4">No contacts set up for engagement tracking yet.</p>
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
              <AnimatePresence>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {contactsToShow.length === 0 ? (
                    <Card className="col-span-full p-12 text-center">
                      <p className="text-gray-500 mb-4">🎉 No creators due today. Great job!</p>
                      <Button onClick={() => setViewMode('all')} variant="outline">View All Creators</Button>
                    </Card>
                  ) : (
                    contactsToShow.map((contact, index) => <CreatorCard key={contact.id} contact={contact} index={index} />)
                  )}
                </div>
              </AnimatePresence>
            </TabsContent>

            <TabsContent value="all" className="mt-4">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {engagementContacts.map((contact, index) => <CreatorCard key={contact.id} contact={contact} index={index} />)}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}