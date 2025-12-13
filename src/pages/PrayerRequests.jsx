import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Heart, Plus, Users, Lock, Globe, Check, Send, BookOpen, 
  MessageCircle, Sparkles, Clock, AlertTriangle, PartyPopper, Edit, X, CheckCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { format, formatDistanceToNow } from 'date-fns';
import { useTheme } from '../components/shared/useTheme';
import { getEffectiveUserEmail } from '../components/admin/ImpersonationBanner';

const categories = [
  { value: 'health', label: '🏥 Health', color: 'bg-red-100 text-red-700' },
  { value: 'family', label: '👨‍👩‍👧‍👦 Family', color: 'bg-blue-100 text-blue-700' },
  { value: 'finances', label: '💰 Finances', color: 'bg-green-100 text-green-700' },
  { value: 'relationships', label: '💕 Relationships', color: 'bg-pink-100 text-pink-700' },
  { value: 'work', label: '💼 Work', color: 'bg-orange-100 text-orange-700' },
  { value: 'spiritual', label: '🙏 Spiritual Growth', color: 'bg-purple-100 text-purple-700' },
  { value: 'praise', label: '🎉 Praise Report', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'other', label: '📝 Other', color: 'bg-gray-100 text-gray-700' },
];

export default function PrayerRequests() {
  const queryClient = useQueryClient();
  const { isDark, bgClass, textClass, cardBgClass, primaryColor, accentColor } = useTheme();
  const [user, setUser] = useState(null);
  
  // Fetch Preferences to determine title
  const { data: preferences } = useQuery({
    queryKey: ['preferences', user?.email],
    queryFn: async () => {
      const email = getEffectiveUserEmail(user?.email);
      if (!email) return null;
      const prefs = await base44.entities.UserPreferences.filter({ user_email: email }, '-updated_date');
      return prefs[0] || null;
    },
    enabled: !!user?.email,
  });

  const isBibleEnabled = preferences?.enable_bible_options !== false;
  const [showNewRequest, setShowNewRequest] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [messageContent, setMessageContent] = useState('');
  const [scriptureRef, setScriptureRef] = useState('');
  const [scriptureText, setScriptureText] = useState('');
  const [sendAnonymously, setSendAnonymously] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'other',
    request_type: isBibleEnabled ? 'prayer' : 'light_and_love',
    is_urgent: false,
    is_anonymous: false,
    allow_messages: true,
    visibility: 'community'
  });
  
  const [showPrayerHistory, setShowPrayerHistory] = useState(null);
  const [updateModal, setUpdateModal] = useState(null); // holds request being updated
  const [updateContent, setUpdateContent] = useState('');
  const [isAnswerUpdate, setIsAnswerUpdate] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const effectiveEmail = user?.email ? getEffectiveUserEmail(user.email) : null;

  // Fetch all community prayer requests - filtered by user's Bible belief status
  const { data: prayerRequests = [] } = useQuery({
    queryKey: ['prayerRequests', isBibleEnabled],
    queryFn: async () => {
      const requests = await base44.entities.PrayerRequest.filter({ visibility: 'community' }, '-created_date');
      // Non-Bible believers only see light_and_love requests
      // Bible believers see ALL requests (they can pray for everyone)
      if (!isBibleEnabled) {
        return requests.filter(r => r.request_type === 'light_and_love');
      }
      return requests;
    },
    enabled: isBibleEnabled !== undefined,
  });

  // Fetch my prayer requests
  const { data: myRequests = [] } = useQuery({
    queryKey: ['myPrayerRequests', effectiveEmail],
    queryFn: () => base44.entities.PrayerRequest.filter({ created_by: effectiveEmail }, '-created_date'),
    enabled: !!effectiveEmail,
  });

  // Fetch interactions for selected request
  const { data: interactions = [] } = useQuery({
    queryKey: ['prayerInteractions', selectedRequest?.id],
    queryFn: () => base44.entities.PrayerInteraction.filter({ prayer_request_id: selectedRequest.id }, '-created_date'),
    enabled: !!selectedRequest,
  });

  // Check if I've prayed for each request - now returns full prayer history
  const { data: myPrayerHistory = [] } = useQuery({
    queryKey: ['myPrayers', effectiveEmail],
    queryFn: async () => {
      const prayers = await base44.entities.PrayerInteraction.filter({ 
        type: 'prayed',
        created_by: effectiveEmail 
      });
      return prayers;
    },
    enabled: !!effectiveEmail,
  });

  // Get prayer IDs for quick lookup
  const myPrayers = myPrayerHistory.map(p => p.prayer_request_id);
  
  // Get prayer history for a specific request
  const getPrayerHistoryForRequest = (requestId) => {
    return myPrayerHistory.filter(p => p.prayer_request_id === requestId);
  };

  const createRequestMutation = useMutation({
    mutationFn: async (data) => {
      return base44.entities.PrayerRequest.create({
        ...data,
        request_type: isBibleEnabled ? 'prayer' : 'light_and_love',
        requester_display_name: user?.full_name || effectiveEmail?.split('@')[0]
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prayerRequests'] });
      queryClient.invalidateQueries({ queryKey: ['myPrayerRequests'] });
      setShowNewRequest(false);
      setFormData({
        title: '',
        description: '',
        category: 'other',
        request_type: isBibleEnabled ? 'prayer' : 'light_and_love',
        is_urgent: false,
        is_anonymous: false,
        allow_messages: true,
        visibility: 'community'
      });
    }
  });

  const prayMutation = useMutation({
    mutationFn: async (requestId) => {
      // Create prayer interaction
      await base44.entities.PrayerInteraction.create({
        prayer_request_id: requestId,
        type: 'prayed',
        sender_display_name: user?.full_name || effectiveEmail?.split('@')[0]
      });
      // Update prayer count
      const request = prayerRequests.find(r => r.id === requestId) || myRequests.find(r => r.id === requestId);
      if (request) {
        await base44.entities.PrayerRequest.update(requestId, {
          prayer_count: (request.prayer_count || 0) + 1
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prayerRequests'] });
      queryClient.invalidateQueries({ queryKey: ['myPrayers'] });
      queryClient.invalidateQueries({ queryKey: ['prayerInteractions'] });
    }
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ requestId, type, message, scriptureRef, scriptureText }) => {
      return base44.entities.PrayerInteraction.create({
        prayer_request_id: requestId,
        type,
        message,
        scripture_reference: scriptureRef,
        scripture_text: scriptureText,
        is_anonymous: sendAnonymously,
        sender_display_name: sendAnonymously ? 'Anonymous' : (user?.full_name || effectiveEmail?.split('@')[0])
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prayerInteractions'] });
      setMessageContent('');
      setScriptureRef('');
      setScriptureText('');
      setSendAnonymously(false);
    }
  });

  const addUpdateMutation = useMutation({
    mutationFn: async ({ requestId, content, isAnswer, closeRequest }) => {
      const request = myRequests.find(r => r.id === requestId);
      const updates = request?.updates || [];
      const newUpdate = {
        date: new Date().toISOString(),
        content,
        is_answer: isAnswer
      };
      
      const updateData = {
        updates: [...updates, newUpdate]
      };
      
      if (isAnswer) {
        updateData.is_answered = true;
        updateData.answered_date = format(new Date(), 'yyyy-MM-dd');
        updateData.testimony = content;
      }
      
      if (closeRequest) {
        updateData.is_closed = true;
      }
      
      return base44.entities.PrayerRequest.update(requestId, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prayerRequests'] });
      queryClient.invalidateQueries({ queryKey: ['myPrayerRequests'] });
      setUpdateModal(null);
      setUpdateContent('');
      setIsAnswerUpdate(false);
    }
  });

  const closeRequestMutation = useMutation({
    mutationFn: async (requestId) => {
      return base44.entities.PrayerRequest.update(requestId, { is_closed: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prayerRequests'] });
      queryClient.invalidateQueries({ queryKey: ['myPrayerRequests'] });
    }
  });

  const isMyRequest = (request) => request.created_by === effectiveEmail;

  const PrayerCard = ({ request, showPrayButton = true, showActions = false }) => {
    const prayerHistory = getPrayerHistoryForRequest(request.id);
    const hasPrayed = prayerHistory.length > 0;
    const categoryInfo = categories.find(c => c.value === request.category);
    const isMine = isMyRequest(request);
    const isLightAndLove = request.request_type === 'light_and_love';
    
    return (
      <Card className={`${cardBgClass} ${request.is_answered ? (isDark ? 'border-green-600 bg-green-900/20' : 'border-green-300 bg-green-50/50') : ''} ${request.is_urgent && !request.is_answered ? (isDark ? 'border-red-600' : 'border-red-300') : ''}`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            {isLightAndLove && (
              <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                ✨ Light & Love
              </Badge>
            )}
            {request.is_urgent && !request.is_answered && (
              <Badge className="bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Urgent
              </Badge>
            )}
            {request.is_answered && (
              <Badge className="bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300">
                <PartyPopper className="w-3 h-3 mr-1" />
                {isLightAndLove ? 'Resolved!' : 'Answered!'}
              </Badge>
            )}
            {request.is_closed && !request.is_answered && (
              <Badge variant="secondary" className={isDark ? 'bg-gray-700 text-gray-300' : ''}>
                <X className="w-3 h-3 mr-1" />
                Closed
              </Badge>
            )}
            {categoryInfo && (
              <Badge className={categoryInfo.color}>{categoryInfo.label}</Badge>
            )}
            {request.is_anonymous && (
              <Badge variant="outline" className={`text-xs ${isDark ? 'border-gray-500 text-gray-300' : ''}`}>
                <Lock className="w-3 h-3 mr-1" />
                Anonymous
              </Badge>
            )}
          </div>
              
              <h3 className={`font-semibold ${textClass}`}>{request.title}</h3>
              <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {request.description}
              </p>
              
              {/* Updates/Testimonies */}
              {request.updates?.length > 0 && (
                <div className="mt-3 space-y-2">
                  {request.updates.map((update, idx) => (
                    <div key={idx} className={`p-3 rounded-lg ${update.is_answer ? (isDark ? 'bg-green-900/30 border border-green-700' : 'bg-green-100') : (isDark ? 'bg-gray-700' : 'bg-gray-100')}`}>
                      <div className="flex items-center gap-2 mb-1">
                        {update.is_answer ? (
                          <span className={`text-xs font-medium ${isDark ? 'text-green-400' : 'text-green-700'}`}>✨ Answered Prayer</span>
                        ) : (
                          <span className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>📝 Update</span>
                        )}
                        <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                          {formatDistanceToNow(new Date(update.date), { addSuffix: true })}
                        </span>
                      </div>
                      <p className={`text-sm ${update.is_answer ? (isDark ? 'text-green-300' : 'text-green-700') : (isDark ? 'text-gray-300' : 'text-gray-700')}`}>
                        {update.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Legacy testimony support */}
              {request.testimony && !request.updates?.some(u => u.is_answer) && (
                <div className={`mt-3 p-3 rounded-lg ${isDark ? 'bg-green-900/30 border border-green-700' : 'bg-green-100'}`}>
                  <p className={`text-sm font-medium ${isDark ? 'text-green-400' : 'text-green-800'}`}>✨ Testimony:</p>
                  <p className={`text-sm ${isDark ? 'text-green-300' : 'text-green-700'}`}>{request.testimony}</p>
                </div>
              )}
              
              <div className={`flex items-center gap-4 mt-3 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {!request.is_anonymous && (
                  <span>By {request.requester_display_name}</span>
                )}
                <span>{formatDistanceToNow(new Date(request.created_date), { addSuffix: true })}</span>
                <span className="flex items-center gap-1">
                  <Heart className="w-4 h-4 text-pink-500" />
                  {request.prayer_count || 0} prayers
                </span>
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              {showPrayButton && !request.is_closed && (
                <>
                  <Button
                    size="sm"
                    onClick={() => prayMutation.mutate(request.id)}
                    disabled={prayMutation.isPending}
                    className={hasPrayed ? 'bg-green-500' : ''}
                    style={!hasPrayed ? { background: `linear-gradient(to right, ${primaryColor}, ${accentColor})` } : {}}
                  >
                    {hasPrayed ? (
                      <>
                        <Check className="w-4 h-4 mr-1" />
                        {prayerHistory.length}
                      </>
                    ) : (
                      <>
                        <Heart className="w-4 h-4 mr-1" />
                        {isLightAndLove ? 'Send Love' : 'Pray'}
                      </>
                    )}
                  </Button>
                  {hasPrayed && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowPrayerHistory(request)}
                      className="text-xs"
                    >
                      <Clock className="w-3 h-3 mr-1" />
                      History
                    </Button>
                  )}
                  {request.allow_messages && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedRequest(request)}
                      className={isDark ? 'border-gray-600 text-gray-300' : ''}
                    >
                      <MessageCircle className="w-4 h-4" />
                    </Button>
                  )}
                </>
              )}
              
              {/* Owner actions */}
              {showActions && isMine && !request.is_closed && (
                <div className="flex flex-col gap-1 mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setUpdateModal(request)}
                    className={`text-xs ${isDark ? 'border-gray-600 text-gray-300' : ''}`}
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Update
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      if (confirm('Close this prayer request? It will move to the Answered section.')) {
                        closeRequestMutation.mutate(request.id);
                      }
                    }}
                    className={`text-xs ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500'}`}
                  >
                    <X className="w-3 h-3 mr-1" />
                    Close
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className={`min-h-screen ${bgClass} p-4 md:p-8`}>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-3xl font-bold ${textClass} flex items-center gap-3`}>
              <Heart className="w-8 h-8 text-pink-500" />
              {isBibleEnabled ? 'War Room (Prayer Requests)' : 'Love & Good Vibes'}
            </h1>
            <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
              {isBibleEnabled 
                ? 'Share your needs and lift up others in prayer'
                : 'Share your needs and send good vibes to others'}
            </p>
          </div>
          <Button
            onClick={() => setShowNewRequest(true)}
            style={{ background: `linear-gradient(to right, ${primaryColor}, ${accentColor})` }}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Request
          </Button>
        </div>

        <Tabs defaultValue="community">
          <TabsList>
            <TabsTrigger value="community" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Community
            </TabsTrigger>
            <TabsTrigger value="mine" className="flex items-center gap-2">
              <Heart className="w-4 h-4" />
              My Requests
            </TabsTrigger>
            <TabsTrigger value="answered" className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Answered
            </TabsTrigger>
          </TabsList>

          <TabsContent value="community" className="space-y-4 mt-4">
            {prayerRequests.filter(r => !r.is_answered).length === 0 ? (
              <Card className={cardBgClass}>
                <CardContent className="p-8 text-center">
                  <Heart className="w-12 h-12 text-pink-300 mx-auto mb-4" />
                  <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                    No prayer requests yet. Be the first to share!
                  </p>
                </CardContent>
              </Card>
            ) : (
              prayerRequests.filter(r => !r.is_answered).map(request => (
                <PrayerCard key={request.id} request={request} />
              ))
            )}
          </TabsContent>

          <TabsContent value="mine" className="space-y-4 mt-4">
            {myRequests.filter(r => !r.is_closed && !r.is_answered).length === 0 ? (
              <Card className={cardBgClass}>
                <CardContent className="p-8 text-center">
                  <Heart className="w-12 h-12 text-pink-300 mx-auto mb-4" />
                  <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                    You don't have any active prayer requests.
                  </p>
                  <Button
                    onClick={() => setShowNewRequest(true)}
                    className="mt-4"
                    style={{ background: `linear-gradient(to right, ${primaryColor}, ${accentColor})` }}
                  >
                    Share a Request
                  </Button>
                </CardContent>
              </Card>
            ) : (
              myRequests.filter(r => !r.is_closed && !r.is_answered).map(request => (
                <PrayerCard key={request.id} request={request} showPrayButton={false} showActions={true} />
              ))
            )}
          </TabsContent>

          <TabsContent value="answered" className="space-y-4 mt-4">
            {prayerRequests.filter(r => r.is_answered || r.is_closed).length === 0 ? (
              <Card className={cardBgClass}>
                <CardContent className="p-8 text-center">
                  <Sparkles className="w-12 h-12 text-yellow-300 mx-auto mb-4" />
                  <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                    No answered prayers yet. Keep believing!
                  </p>
                </CardContent>
              </Card>
            ) : (
              prayerRequests.filter(r => r.is_answered || r.is_closed).map(request => (
                <PrayerCard key={request.id} request={request} showPrayButton={false} />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* New Request Dialog */}
      <Dialog open={showNewRequest} onOpenChange={setShowNewRequest}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-pink-500" />
              Share a Prayer Request
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input
                placeholder="Brief title for your request"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Details</label>
              <Textarea
                placeholder="Share more about what you need prayer for..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <label 
                className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-gray-50"
                onClick={() => setFormData({ ...formData, is_urgent: !formData.is_urgent })}
              >
                <Checkbox checked={formData.is_urgent} />
                <div>
                  <span className="font-medium">🚨 Urgent Request</span>
                  <p className="text-xs text-gray-500">Mark as needing immediate prayer</p>
                </div>
              </label>

              <label 
                className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-gray-50"
                onClick={() => setFormData({ ...formData, is_anonymous: !formData.is_anonymous })}
              >
                <Checkbox checked={formData.is_anonymous} />
                <div>
                  <span className="font-medium">🔒 Post Anonymously</span>
                  <p className="text-xs text-gray-500">Your name won't be shown</p>
                </div>
              </label>

              <label 
                className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-gray-50"
                onClick={() => setFormData({ ...formData, allow_messages: !formData.allow_messages })}
              >
                <Checkbox checked={formData.allow_messages} />
                <div>
                  <span className="font-medium">💌 Allow Encouragement</span>
                  <p className="text-xs text-gray-500">Let others send messages & scriptures</p>
                </div>
              </label>
            </div>

            <Button
              onClick={() => createRequestMutation.mutate(formData)}
              disabled={!formData.title || createRequestMutation.isPending}
              className="w-full"
              style={{ background: `linear-gradient(to right, ${primaryColor}, ${accentColor})` }}
            >
              Share Prayer Request
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Update/Answer Dialog */}
      <Dialog open={!!updateModal} onOpenChange={() => { setUpdateModal(null); setUpdateContent(''); setIsAnswerUpdate(false); }}>
        <DialogContent className={`max-w-lg ${isDark ? 'bg-gray-800 text-gray-100' : ''}`}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {isAnswerUpdate ? (
                <>
                  <PartyPopper className="w-5 h-5 text-green-500" />
                  Share Answered Prayer
                </>
              ) : (
                <>
                  <Edit className="w-5 h-5 text-blue-500" />
                  Add Update
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          
          {updateModal && (
            <div className="space-y-4">
              <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <p className={`font-medium ${textClass}`}>{updateModal.title}</p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant={!isAnswerUpdate ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setIsAnswerUpdate(false)}
                  className={!isAnswerUpdate ? '' : (isDark ? 'border-gray-600' : '')}
                >
                  📝 Update
                </Button>
                <Button
                  variant={isAnswerUpdate ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setIsAnswerUpdate(true)}
                  className={isAnswerUpdate ? 'bg-green-600 hover:bg-green-700' : (isDark ? 'border-gray-600' : '')}
                >
                  ✨ Answered!
                </Button>
              </div>

              <Textarea
                placeholder={isAnswerUpdate ? 'Share how God answered this prayer...' : 'Share an update on your prayer request...'}
                value={updateContent}
                onChange={(e) => setUpdateContent(e.target.value)}
                rows={4}
                className={isDark ? 'bg-gray-700 border-gray-600' : ''}
              />

              <div className="flex gap-2">
                <Button
                  onClick={() => addUpdateMutation.mutate({ 
                    requestId: updateModal.id, 
                    content: updateContent, 
                    isAnswer: isAnswerUpdate,
                    closeRequest: isAnswerUpdate
                  })}
                  disabled={!updateContent.trim() || addUpdateMutation.isPending}
                  className="flex-1"
                  style={{ background: isAnswerUpdate ? '#16a34a' : `linear-gradient(to right, ${primaryColor}, ${accentColor})` }}
                >
                  {isAnswerUpdate ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Mark as Answered
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Post Update
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Message/Scripture Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Send Encouragement</DialogTitle>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="font-medium">{selectedRequest.title}</p>
                <p className="text-sm text-gray-600">{selectedRequest.description}</p>
              </div>

              {/* Existing interactions */}
              {interactions.length > 0 && (
                <div className="max-h-40 overflow-y-auto space-y-2">
                  {interactions.filter(i => i.type !== 'prayed').map(interaction => (
                    <div key={interaction.id} className="p-2 bg-purple-50 rounded-lg text-sm">
                      <p className="font-medium text-purple-700">
                        {interaction.is_anonymous ? 'Anonymous' : interaction.sender_display_name}
                      </p>
                      {interaction.message && <p className="text-gray-700">{interaction.message}</p>}
                      {interaction.scripture_reference && (
                        <p className="text-purple-600 italic">
                          {interaction.scripture_reference}: {interaction.scripture_text}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {selectedRequest.request_type === 'light_and_love' ? (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">Send an encouraging message (scriptures not shown for Light & Love requests)</p>
                  <Textarea
                    placeholder="Write an encouraging message of love and support..."
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                    rows={3}
                  />
                </div>
              ) : (
                <Tabs defaultValue="message">
                  <TabsList className="grid grid-cols-2">
                    <TabsTrigger value="message">💬 Message</TabsTrigger>
                    <TabsTrigger value="scripture">📖 Scripture</TabsTrigger>
                  </TabsList>

                  <TabsContent value="message" className="space-y-3">
                    <Textarea
                      placeholder="Write an encouraging message or a prayer for them..."
                      value={messageContent}
                      onChange={(e) => setMessageContent(e.target.value)}
                      rows={3}
                    />
                  </TabsContent>

                  <TabsContent value="scripture" className="space-y-3">
                    <Input
                      placeholder="Scripture reference (e.g., Philippians 4:6)"
                      value={scriptureRef}
                      onChange={(e) => setScriptureRef(e.target.value)}
                    />
                    <Textarea
                      placeholder="Paste the scripture text..."
                      value={scriptureText}
                      onChange={(e) => setScriptureText(e.target.value)}
                      rows={3}
                    />
                  </TabsContent>
                </Tabs>
              )}

              <label 
                className="flex items-center gap-2 cursor-pointer"
                onClick={() => setSendAnonymously(!sendAnonymously)}
              >
                <Checkbox checked={sendAnonymously} />
                <span className="text-sm">Send anonymously</span>
              </label>

              <Button
                onClick={() => {
                  if (messageContent) {
                    sendMessageMutation.mutate({
                      requestId: selectedRequest.id,
                      type: 'message',
                      message: messageContent
                    });
                  } else if (scriptureRef && scriptureText) {
                    sendMessageMutation.mutate({
                      requestId: selectedRequest.id,
                      type: 'scripture',
                      scriptureRef,
                      scriptureText
                    });
                  }
                }}
                disabled={(!messageContent && (!scriptureRef || !scriptureText)) || sendMessageMutation.isPending}
                className="w-full"
                style={{ background: `linear-gradient(to right, ${primaryColor}, ${accentColor})` }}
              >
                <Send className="w-4 h-4 mr-2" />
                Send Encouragement
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Prayer History Dialog */}
      <Dialog open={!!showPrayerHistory} onOpenChange={() => setShowPrayerHistory(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-purple-500" />
              Prayer History
            </DialogTitle>
          </DialogHeader>
          
          {showPrayerHistory && (
            <div className="space-y-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="font-medium">{showPrayerHistory.title}</p>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">
                  You've {showPrayerHistory.request_type === 'light_and_love' ? 'sent love' : 'prayed'} {prayerHistory.length} time{prayerHistory.length !== 1 ? 's' : ''}:
                </p>
                <div className="max-h-60 overflow-y-auto space-y-1">
                  {prayerHistory.map((prayer, idx) => (
                    <div key={prayer.id} className="p-2 bg-purple-50 rounded text-sm flex items-center justify-between">
                      <span className="text-purple-700">#{idx + 1}</span>
                      <span className="text-gray-600 text-xs">
                        {format(new Date(prayer.created_date), 'MMM d, yyyy h:mm a')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              
              <Button
                onClick={() => setShowPrayerHistory(null)}
                variant="outline"
                className="w-full"
              >
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}