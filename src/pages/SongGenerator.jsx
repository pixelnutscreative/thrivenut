import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Music, Loader2, Copy, RefreshCw, Sparkles, Users, Send, Check, Gift, Swords, Heart, Share2, Trophy, Star, Zap, Settings, ExternalLink, History, Edit, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { createPageUrl } from '../utils';
import { getEffectiveUserEmail } from '../components/admin/ImpersonationBanner';
import { format, startOfWeek, subWeeks, addWeeks } from 'date-fns';
import SunoInfoModal from '../components/song/SunoInfoModal';
import SongHistoryModal from '../components/song/SongHistoryModal';

const songTypes = [
  { id: 'gift_gallery', label: '🎁 Gift Gallery Thank-You', icon: Gift, description: 'Celebrate your top gifters from the week' },
  { id: 'top_viewers', label: '👑 Top Viewers Song', icon: Users, description: 'Thank viewers who watched the longest' },
  { id: 'top_gifters', label: '💎 Top Gifters Song', icon: Gift, description: 'Celebrate biggest gifters' },
  { id: 'most_taps', label: '❤️ Most Taps Song', icon: Heart, description: 'Hype up your tappers' },
  { id: 'most_shares', label: '🔄 Most Shares Song', icon: Share2, description: 'Thank those who shared' },
  { id: 'battle_hype', label: '⚔️ Battle Hype Song', icon: Swords, description: 'Get pumped for battles' },
  { id: 'milestone', label: '🎉 Milestone Song', icon: Trophy, description: 'Celebrate a big achievement' },
  { id: 'engagement', label: '🔥 Engagement Hype Song', icon: Zap, description: 'Get the crowd moving' },
  { id: 'custom', label: '✨ Custom Celebration', icon: Star, description: 'Something special' },
];

const toneOptions = [
  { value: 'upbeat', label: '🎉 Upbeat' },
  { value: 'chill', label: '😌 Chill' },
  { value: 'hype', label: '🔥 Hype' },
  { value: 'emotional', label: '💜 Emotional' },
  { value: 'funny', label: '😂 Funny' },
  { value: 'epic', label: '⚡ Epic' },
  { value: 'cozy', label: '☕ Cozy' },
];

export default function SongGenerator() {
  const queryClient = useQueryClient();
  const [songType, setSongType] = useState('');
  const [formData, setFormData] = useState({
    gifters: [],
    milestone: '',
    engagement_action: 'taps',
    custom_prompt: '',
    tone_override: ''
  });
  const [generatedSong, setGeneratedSong] = useState('');
  const [songTitles, setSongTitles] = useState([]);
  const [songStyles, setSongStyles] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedStyle, setCopiedStyle] = useState(false);
  const [shared, setShared] = useState(false);
  const [isEditingLyrics, setIsEditingLyrics] = useState(false);
  const [editedLyrics, setEditedLyrics] = useState('');
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [finalLyrics, setFinalLyrics] = useState('');
  const [captionLyrics, setCaptionLyrics] = useState('');
  const [postCaption, setPostCaption] = useState('');
  const [processingFinal, setProcessingFinal] = useState(false);
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [copiedFinalLyrics, setCopiedFinalLyrics] = useState(false);
  const [user, setUser] = useState(null);
  const [showSunoModal, setShowSunoModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [editingSong, setEditingSong] = useState(null);
  const [gifterFilter, setGifterFilter] = useState('first_and_shoutouts'); // 'first_and_shoutouts', 'all_top_3', 'custom'
  const [customSelectedIds, setCustomSelectedIds] = useState([]);
  // Default to most recent Sunday (week ending date)
  const getMostRecentSunday = () => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday
    const daysToSubtract = dayOfWeek === 0 ? 0 : dayOfWeek;
    const sunday = new Date(today);
    sunday.setDate(today.getDate() - daysToSubtract);
    return format(sunday, 'yyyy-MM-dd');
  };
  const [selectedWeek, setSelectedWeek] = useState(getMostRecentSunday());

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const effectiveEmail = user ? getEffectiveUserEmail(user.email) : null;

  const { data: preferences } = useQuery({
    queryKey: ['preferences', effectiveEmail],
    queryFn: async () => {
      const prefs = await base44.entities.UserPreferences.filter({ user_email: effectiveEmail });
      return prefs[0] || null;
    },
    enabled: !!effectiveEmail,
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ['tiktokContacts', effectiveEmail],
    queryFn: () => base44.entities.TikTokContact.filter({ created_by: effectiveEmail }, 'display_name'),
    enabled: !!effectiveEmail,
  });

  // Get selected week's entries for auto-population
  const { data: rawEntries = [] } = useQuery({
    queryKey: ['giftingEntries', selectedWeek, effectiveEmail],
    queryFn: () => base44.entities.GiftingEntry.filter({ week: selectedWeek, owner_email: effectiveEmail }, '-created_date', 500),
    enabled: !!effectiveEmail && (songType === 'gift_gallery' || songType === 'top_gifters'),
  });

  // Normalize entries
  const entries = rawEntries.map(e => ({
    id: e.id,
    gifter_id: e.data?.gifter_id || e.gifter_id,
    gifter_username: e.data?.gifter_username || e.gifter_username,
    gifter_screen_name: e.data?.gifter_screen_name || e.gifter_screen_name,
    gifter_phonetic: e.data?.gifter_phonetic || e.gifter_phonetic,
    gift_id: e.data?.gift_id || e.gift_id,
    gift_name: e.data?.gift_name || e.gift_name,
    rank: e.data?.rank || e.rank,
    week: e.data?.week || e.week,
  }));

  // Week navigation
  const goToPreviousWeek = () => {
    const current = new Date(selectedWeek + 'T12:00:00');
    current.setDate(current.getDate() - 7);
    setSelectedWeek(format(current, 'yyyy-MM-dd'));
  };

  const goToNextWeek = () => {
    const current = new Date(selectedWeek + 'T12:00:00');
    current.setDate(current.getDate() + 7);
    setSelectedWeek(format(current, 'yyyy-MM-dd'));
  };

  const gifters = contacts.filter(c => c.is_gifter);

  // Song history - filter by effective email (impersonated user if applicable)
  const { data: songHistory = [], isLoading: historyLoading } = useQuery({
    queryKey: ['songHistory', effectiveEmail],
    queryFn: () => base44.entities.GeneratedSong.filter({ owner_email: effectiveEmail }, '-created_date', 50),
    enabled: !!effectiveEmail,
  });

  const saveSongMutation = useMutation({
    mutationFn: (data) => base44.entities.GeneratedSong.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['songHistory'] });
    },
  });

  const deleteSongMutation = useMutation({
    mutationFn: (id) => base44.entities.GeneratedSong.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['songHistory'] });
    },
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: ({ id, is_favorite }) => base44.entities.GeneratedSong.update(id, { is_favorite: !is_favorite }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['songHistory'] });
    },
  });

  // Auto-populate gift gallery from entries based on filter
  useEffect(() => {
    if (songType === 'gift_gallery' && entries.length > 0) {
      let filteredEntries = [...entries];
      
      // Count unique gifts to determine if we should auto-limit
      const uniqueGifts = new Set(entries.map(e => e.gift_name)).size;
      const shouldAutoLimit = uniqueGifts >= 20;
      
      if (gifterFilter === 'first_and_shoutouts' || (gifterFilter === 'all_top_3' && shouldAutoLimit)) {
        // Only 1st place and shoutouts
        filteredEntries = entries.filter(e => e.rank === '1st' || e.rank === 'shoutout');
      } else if (gifterFilter === 'all_top_3') {
        // All top 3 (1st, 2nd, 3rd) - only when not auto-limited
        filteredEntries = entries.filter(e => e.rank === '1st' || e.rank === '2nd' || e.rank === '3rd' || e.rank === 'shoutout');
      } else if (gifterFilter === 'custom') {
        // Only custom selected
        filteredEntries = entries.filter(e => customSelectedIds.includes(e.id));
      }
      
      const sortedEntries = filteredEntries.sort((a, b) => {
        const order = { '1st': 1, '2nd': 2, '3rd': 3, 'shoutout': 4 };
        return (order[a.rank] || 99) - (order[b.rank] || 99);
      });
      
      setFormData(prev => ({
        ...prev,
        gifters: sortedEntries.map(e => ({
          id: e.id,
          name: e.gifter_phonetic || e.gifter_screen_name || e.gifter_username,
          username: e.gifter_username,
          rank: e.rank,
          gift: e.gift_name
        }))
      }));
    }
  }, [songType, entries, gifterFilter, customSelectedIds]);

  // Helper to count entries
  const uniqueGiftCount = new Set(entries.map(e => e.gift_name)).size;
  const shouldAutoLimit = uniqueGiftCount >= 20;
  const firstPlaceCount = entries.filter(e => e.rank === '1st').length;
  const shoutoutCount = entries.filter(e => e.rank === 'shoutout').length;
  const allTop3Count = entries.filter(e => ['1st', '2nd', '3rd'].includes(e.rank)).length;

  const generateSong = async () => {
    setLoading(true);
    try {
      const hostDisplayName = preferences?.tiktok_display_name || preferences?.tiktok_username || 'the host';
      const roomVibe = preferences?.room_vibe || '';
      const tone = formData.tone_override || preferences?.default_song_tone || 'upbeat';
      const includeLevelUp = preferences?.include_levelup_verse !== false;
      const league = preferences?.league_level || '';

      let prompt = `You are Sunny Songbird, a fun, bubbly songwriter who helps TikTok lyve-stream hosts turn their community moments into songs!

Voice: High-energy, supportive, and always hype. Think "best friend who hypes you up AND writes your bars."
CRITICAL: Use the PHONETIC spelling provided for each gifter's name - this is how it should be pronounced/sung!
Always write "lyve" (not LIVE) so it's pronounced correctly.

Song Format:
[VERSE 1]
[VERSE 2]  
[CHORUS]
[VERSE 3]
[FINAL CHORUS]
[OUTRO/TAG]

Creator/Host Display Name: ${hostDisplayName} (use this name in the song, NOT "host")
${roomVibe ? `Room Vibe/Theme: ${roomVibe}` : ''}
Tone: ${tone}
${league ? `League Level: ${league}` : ''}
${includeLevelUp ? 'Include a verse encouraging the community to help level up!' : ''}

`;

      if (songType === 'gift_gallery' || songType === 'top_gifters') {
        const gifterList = formData.gifters.map(g => 
          `${g.rank || 'Gifter'}: "${g.name}" (this is the PHONETIC pronunciation to use in the song)${g.gift ? ` - sent ${g.gift}` : ''}`
        ).join('\n');
        prompt += `Create a Thank-You Song celebrating these gifters for ${hostDisplayName}'s stream:\n${gifterList}\n\nCRITICAL: Use the PHONETIC name provided in quotes for each gifter - that's exactly how it should appear in the lyrics!\nMake each gifter feel special and appreciated. Use "${hostDisplayName}" when referring to the creator. Weave in the room vibe if provided.`;
      } else if (songType === 'battle_hype') {
        prompt += `Create a high-energy Battle Hype Song to pump up the crowd! Focus on energy, tapping, sharing, and supporting ${hostDisplayName}. Make it chant-worthy!`;
      } else if (songType === 'engagement') {
        const action = formData.engagement_action;
        prompt += `Create an Engagement Hype Song focused on "${action}". This should be chant-style with NO usernames. Focus on: "Tap tap tap the screen," "Share the lyve," "Drop stickers," "Push the energy," "Keep the chat flowing." Make it catchy and repeatable!`;
      } else if (songType === 'milestone') {
        prompt += `Create a Milestone Celebration Song for ${hostDisplayName}: "${formData.milestone}". Make it epic and celebratory!`;
      } else if (songType === 'custom') {
        prompt += `Create a custom celebration song for ${hostDisplayName} based on: "${formData.custom_prompt}"`;
      } else if (songType === 'most_taps') {
        prompt += `Create a song celebrating the biggest tappers! Focus on heart taps, screen tapping, and keeping the energy flowing for ${hostDisplayName}.`;
      } else if (songType === 'most_shares') {
        prompt += `Create a song thanking those who share the lyve! Celebrate people who spread the word and bring new viewers to ${hostDisplayName}'s stream.`;
      } else if (songType === 'top_viewers') {
        prompt += `Create a song celebrating loyal viewers who watch the longest! Thank them for their time and dedication to ${hostDisplayName}'s content.`;
      }

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            song: { type: "string", description: "The complete song lyrics" },
            title_ideas: { 
              type: "array", 
              items: { type: "string" },
              description: "7 creative title ideas for the song"
            },
            style_paragraph: {
              type: "string",
              description: "A single paragraph describing the music style for Suno AI (genre, tempo, mood, instruments) - ready to paste directly"
            }
          }
        }
      });

      setGeneratedSong(result.song || '');
      setSongTitles(result.title_ideas || []);
      setSongStyles(result.style_paragraph || '');
      setEditedLyrics(result.song || '');
      setIsEditingLyrics(false);

      // Save to history with owner_email for impersonation support
      saveSongMutation.mutate({
        song_type: songType,
        song_type_label: songTypes.find(s => s.id === songType)?.label || songType,
        lyrics: result.song || '',
        title: result.title_ideas?.[0] || '',
        tone: formData.tone_override || preferences?.default_song_tone || 'upbeat',
        gifters: formData.gifters,
        milestone: formData.milestone,
        custom_prompt: formData.custom_prompt,
        owner_email: effectiveEmail
      });

      // Auto-share
      const recipients = [];
      if (preferences?.share_songs_with_pixel) recipients.push('PixelNutsCreative@gmail.com');
      if (preferences?.song_share_email) recipients.push(preferences.song_share_email);

      if (recipients.length > 0) {
        for (const email of recipients) {
            await base44.integrations.Core.SendEmail({
              to: email,
              subject: `🎵 New Song from Sunny Songbird - ${songTypes.find(s => s.id === songType)?.label || 'Custom'}`,
              body: `Here's a new song for ${hostDisplayName}:\n\n${result.song}\n\n---\nStyle: ${result.style_paragraph}\n\nGenerated with Sunny Songbird 🎤`
            });
          }
        setShared(true);
        setTimeout(() => setShared(false), 3000);
      }
    } catch (error) {
      console.error('Error generating song:', error);
      setGeneratedSong('Oops! Something went wrong. Please try again! 💜');
    }
    setLoading(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(isEditingLyrics ? editedLyrics : generatedSong);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyStyleToClipboard = () => {
    navigator.clipboard.writeText(songStyles);
    setCopiedStyle(true);
    setTimeout(() => setCopiedStyle(false), 2000);
  };

  const saveLyricsEdit = () => {
    setGeneratedSong(editedLyrics);
    setIsEditingLyrics(false);
  };

  const processFinalLyrics = async () => {
    if (!finalLyrics.trim()) return;
    setProcessingFinal(true);
    
    try {
      const hostDisplayName = preferences?.tiktok_display_name || preferences?.tiktok_username || 'the creator';
      
      // Build gifter mapping for replacement
      const gifterMapping = formData.gifters.map(g => ({
        phonetic: g.name,
        displayName: g.username ? `@${g.username}` : g.name,
        username: g.username || ''
      }));

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You have song lyrics that use PHONETIC spellings for gifter names. Convert them to use display names for video captions.

GIFTER MAPPING (phonetic -> display):
${gifterMapping.map(g => `"${g.phonetic}" -> "${g.displayName}"`).join('\n')}

ORIGINAL LYRICS:
${finalLyrics}

Return the lyrics with phonetic names replaced by their display names (@username format where available).
Also create a TikTok post caption that:
1. Thanks the top gifters of the week for ${hostDisplayName}'s Gift Gallery
2. Tags each gifter with their @username
3. Is fun and appreciative
4. Ends with relevant hashtags

Creator display name: ${hostDisplayName}`,
        response_json_schema: {
          type: "object",
          properties: {
            caption_lyrics: { type: "string", description: "The lyrics with phonetic names replaced by display names" },
            post_caption: { type: "string", description: "TikTok post caption thanking gifters with @mentions and hashtags" }
          }
        }
      });

      setCaptionLyrics(result.caption_lyrics || finalLyrics);
      setPostCaption(result.post_caption || '');
    } catch (error) {
      console.error('Error processing final lyrics:', error);
      setCaptionLyrics(finalLyrics);
      setPostCaption('');
    }
    setProcessingFinal(false);
  };

  const addGifter = () => {
    setFormData(prev => ({
      ...prev,
      gifters: [...prev.gifters, { name: '', username: '', rank: '', gift: '' }]
    }));
  };

  const updateGifter = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      gifters: prev.gifters.map((g, i) => i === index ? { ...g, [field]: value } : g)
    }));
  };

  const removeGifter = (index) => {
    setFormData(prev => ({
      ...prev,
      gifters: prev.gifters.filter((_, i) => i !== index)
    }));
  };

  const selectGifterFromContacts = (index, gifterId) => {
    const gifter = gifters.find(g => g.id === gifterId);
    if (gifter) {
      updateGifter(index, 'name', gifter.phonetic || gifter.display_name || gifter.username);
      updateGifter(index, 'username', gifter.username);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-purple-50 to-pink-50 p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-500 via-purple-500 to-pink-500 bg-clip-text text-transparent flex items-center justify-center gap-3">
            <Music className="w-10 h-10 text-amber-500" />
            Sunny Songbird
          </h1>
          <p className="text-gray-600 mt-2">Your TikTok Lyve Hypegirl! 🎵</p>
          <p className="text-sm text-gray-500">Let's turn your community moments into songs!</p>
          
          <Button 
            variant="outline" 
            onClick={() => setShowHistoryModal(true)}
            className="mt-4"
          >
            <History className="w-4 h-4 mr-2" />
            Song History ({songHistory.length})
          </Button>
        </div>

        {/* Settings Preview */}
        {preferences && (
          <Card className="bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-wrap">
                  {preferences.tiktok_display_name && (
                    <Badge variant="secondary" className="bg-amber-100">
                      🎤 {preferences.tiktok_display_name}
                    </Badge>
                  )}
                  {preferences.room_vibe && (
                    <Badge variant="secondary" className="bg-purple-100">
                      ✨ {preferences.room_vibe.slice(0, 30)}{preferences.room_vibe.length > 30 ? '...' : ''}
                    </Badge>
                  )}
                  {preferences.league_level && (
                    <Badge variant="secondary" className="bg-blue-100">
                      🏆 {preferences.league_level}
                    </Badge>
                  )}
                  {preferences.default_song_tone && (
                    <Badge variant="secondary" className="bg-pink-100">
                      {toneOptions.find(t => t.value === preferences.default_song_tone)?.label}
                    </Badge>
                  )}
                </div>
                <Link to={createPageUrl('Settings') + '?tab=tiktok_sharing'}>
                  <Button variant="ghost" size="sm">
                    <Settings className="w-4 h-4 mr-1" /> Edit
                  </Button>
                </Link>
              </div>
              {!preferences.tiktok_display_name && !preferences.room_vibe && (
                <p className="text-sm text-amber-700 mt-2">
                  💡 Set up your Sunny Songbird preferences in Settings → TikTok for personalized songs!
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Song Type Selection */}
        {!songType ? (
          <Card>
            <CardHeader>
              <CardTitle>What type of song do you want to create today? 🎶</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-3">
              {songTypes.map(type => {
                const Icon = type.icon;
                return (
                  <motion.div
                    key={type.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      variant="outline"
                      className="w-full h-auto p-4 flex flex-col items-start gap-1 text-left hover:border-purple-400 hover:bg-purple-50"
                      onClick={() => setSongType(type.id)}
                    >
                      <span className="text-lg font-semibold">{type.label}</span>
                      <span className="text-xs text-gray-500 font-normal">{type.description}</span>
                    </Button>
                  </motion.div>
                );
              })}
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Back Button */}
            <Button variant="ghost" onClick={() => { setSongType(''); setGeneratedSong(''); }}>
              ← Back to Song Types
            </Button>

            {/* Song Form */}
            <Card className="border-2 border-purple-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-500" />
                  {songTypes.find(s => s.id === songType)?.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Gift Gallery / Top Gifters */}
                {(songType === 'gift_gallery' || songType === 'top_gifters') && (
                  <div className="space-y-3">
                    {/* Week Picker */}
                    <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200">
                      <Button variant="ghost" size="sm" onClick={goToPreviousWeek}>
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <div className="text-center">
                        <div className="flex items-center gap-2 justify-center text-amber-700">
                          <Calendar className="w-4 h-4" />
                          <span className="text-sm font-medium">Week Ending</span>
                        </div>
                        <p className="font-bold">{format(new Date(selectedWeek + 'T12:00:00'), 'MMMM d, yyyy')}</p>
                        <p className="text-xs text-amber-600">{entries.length} entries</p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={goToNextWeek}>
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Gifter Filter Selection */}
                    {entries.length > 0 && (
                      <div className="space-y-2 p-3 bg-purple-50 rounded-lg border border-purple-200">
                        <Label className="text-purple-700">Which gifters to include?</Label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                          <Button
                            type="button"
                            variant={gifterFilter === 'first_and_shoutouts' ? 'default' : 'outline'}
                            className={`h-auto py-2 px-3 text-left ${gifterFilter === 'first_and_shoutouts' ? 'bg-purple-600' : ''}`}
                            onClick={() => setGifterFilter('first_and_shoutouts')}
                          >
                            <div>
                              <div className="font-medium">🥇 1st Place + Shoutouts</div>
                              <div className="text-xs opacity-80">{firstPlaceCount + shoutoutCount} gifters</div>
                            </div>
                          </Button>
                          <Button
                            type="button"
                            variant={gifterFilter === 'all_top_3' ? 'default' : 'outline'}
                            className={`h-auto py-2 px-3 text-left ${gifterFilter === 'all_top_3' ? 'bg-purple-600' : ''}`}
                            onClick={() => setGifterFilter('all_top_3')}
                          >
                            <div>
                              <div className="font-medium">🏆 All Top 3</div>
                              <div className="text-xs opacity-80">
                                {shouldAutoLimit ? (
                                  <span className="text-amber-300">Auto-limits to 1st (20+ gifts)</span>
                                ) : (
                                  `${allTop3Count} gifters`
                                )}
                              </div>
                            </div>
                          </Button>
                          <Button
                            type="button"
                            variant={gifterFilter === 'custom' ? 'default' : 'outline'}
                            className={`h-auto py-2 px-3 text-left ${gifterFilter === 'custom' ? 'bg-purple-600' : ''}`}
                            onClick={() => setGifterFilter('custom')}
                          >
                            <div>
                              <div className="font-medium">✨ Custom Select</div>
                              <div className="text-xs opacity-80">{customSelectedIds.length} selected</div>
                            </div>
                          </Button>
                        </div>
                        
                        {/* Custom Selection UI */}
                        {gifterFilter === 'custom' && (
                          <div className="mt-3 p-3 bg-white rounded-lg border max-h-48 overflow-y-auto">
                            <div className="flex justify-between mb-2">
                              <span className="text-sm font-medium text-gray-700">Select entries to include:</span>
                              <div className="flex gap-2">
                                <button 
                                  type="button"
                                  onClick={() => setCustomSelectedIds(entries.map(e => e.id))}
                                  className="text-xs text-purple-600 hover:underline"
                                >
                                  All
                                </button>
                                <button 
                                  type="button"
                                  onClick={() => setCustomSelectedIds([])}
                                  className="text-xs text-gray-500 hover:underline"
                                >
                                  Clear
                                </button>
                              </div>
                            </div>
                            <div className="space-y-1">
                              {entries.map(entry => (
                                <label 
                                  key={entry.id}
                                  className={`flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-gray-50 ${
                                    customSelectedIds.includes(entry.id) ? 'bg-purple-50' : ''
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={customSelectedIds.includes(entry.id)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setCustomSelectedIds(prev => [...prev, entry.id]);
                                      } else {
                                        setCustomSelectedIds(prev => prev.filter(id => id !== entry.id));
                                      }
                                    }}
                                    className="rounded text-purple-600"
                                  />
                                  <span className="text-sm">
                                    {entry.rank === '1st' && '🥇'}
                                    {entry.rank === '2nd' && '🥈'}
                                    {entry.rank === '3rd' && '🥉'}
                                    {entry.rank === 'shoutout' && '⭐'}
                                    {' '}{entry.gifter_screen_name || entry.gifter_username}
                                    {entry.gift_name && <span className="text-gray-500"> - {entry.gift_name}</span>}
                                  </span>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <Label>Gifters to Celebrate ({formData.gifters.length})</Label>
                      <Button variant="outline" size="sm" onClick={addGifter}>
                        + Add Gifter
                      </Button>
                    </div>
                    {formData.gifters.map((gifter, idx) => (
                      <div key={idx} className="grid grid-cols-12 gap-2 p-3 bg-gray-50 rounded-lg">
                        <div className="col-span-3">
                          <Select onValueChange={(v) => selectGifterFromContacts(idx, v)}>
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder="Quick pick..." />
                            </SelectTrigger>
                            <SelectContent>
                              {gifters.map(g => (
                                <SelectItem key={g.id} value={g.id}>
                                  {g.display_name || g.username}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-3">
                          <Input
                            placeholder="Name/Phonetic"
                            value={gifter.name}
                            onChange={(e) => updateGifter(idx, 'name', e.target.value)}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="col-span-2">
                          <Select value={gifter.rank} onValueChange={(v) => updateGifter(idx, 'rank', v)}>
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder="Rank" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1st">🥇 1st</SelectItem>
                              <SelectItem value="2nd">🥈 2nd</SelectItem>
                              <SelectItem value="3rd">🥉 3rd</SelectItem>
                              <SelectItem value="shoutout">⭐ Shoutout</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-3">
                          <Input
                            placeholder="Gift name"
                            value={gifter.gift}
                            onChange={(e) => updateGifter(idx, 'gift', e.target.value)}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="col-span-1">
                          <Button variant="ghost" size="sm" onClick={() => removeGifter(idx)} className="h-8 text-red-500">
                            ×
                          </Button>
                        </div>
                      </div>
                    ))}
                    {formData.gifters.length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-4">
                        No gifters added yet. Add some above or <Link to={createPageUrl('GiftScreenshotImport')} className="text-purple-600 underline">import from screenshots</Link>!
                      </p>
                    )}
                  </div>
                )}

                {/* Engagement Song */}
                {songType === 'engagement' && (
                  <div className="space-y-2">
                    <Label>What action do you want to boost?</Label>
                    <Select value={formData.engagement_action} onValueChange={(v) => setFormData({ ...formData, engagement_action: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="taps">❤️ Heart Taps</SelectItem>
                        <SelectItem value="shares">🔄 Shares</SelectItem>
                        <SelectItem value="stickers">🎁 Stickers/Gifts</SelectItem>
                        <SelectItem value="chat">💬 Chat Energy</SelectItem>
                        <SelectItem value="all">🔥 Everything!</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Milestone */}
                {songType === 'milestone' && (
                  <div className="space-y-2">
                    <Label>What milestone are you celebrating?</Label>
                    <Input
                      placeholder="e.g., Hit 10K followers!, Ranked up to B3!, 1 Year Anniversary!"
                      value={formData.milestone}
                      onChange={(e) => setFormData({ ...formData, milestone: e.target.value })}
                    />
                  </div>
                )}

                {/* Custom */}
                {songType === 'custom' && (
                  <div className="space-y-2">
                    <Label>Describe what you want the song to be about</Label>
                    <Textarea
                      placeholder="Tell Sunny what you want to celebrate, who to thank, what vibe you're going for..."
                      value={formData.custom_prompt}
                      onChange={(e) => setFormData({ ...formData, custom_prompt: e.target.value })}
                      rows={3}
                    />
                  </div>
                )}

                {/* Tone Override */}
                <div className="space-y-2 pt-4 border-t">
                  <Label>Override Tone (optional)</Label>
                  <Select value={formData.tone_override} onValueChange={(v) => setFormData({ ...formData, tone_override: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Use default from settings" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={null}>Use default</SelectItem>
                      {toneOptions.map(t => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={generateSong}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-amber-500 via-purple-500 to-pink-500 hover:from-amber-600 hover:via-purple-600 hover:to-pink-600 text-lg py-6"
                >
                  {loading ? (
                    <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Creating Magic...</>
                  ) : (
                    <><Sparkles className="w-5 h-5 mr-2" /> Generate Song 🎤</>
                  )}
                </Button>
              </CardContent>
            </Card>
          </>
        )}

        {/* Generated Song */}
        {generatedSong && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {/* Lyrics Card */}
            <Card className="border-2 border-pink-200 bg-gradient-to-br from-pink-50 to-purple-50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-pink-600">🎵 Your Song Lyrics</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (isEditingLyrics) {
                        saveLyricsEdit();
                      } else {
                        setEditedLyrics(generatedSong);
                        setIsEditingLyrics(true);
                      }
                    }}
                  >
                    {isEditingLyrics ? <><Check className="w-4 h-4 mr-1" /> Save</> : <><Edit className="w-4 h-4 mr-1" /> Edit</>}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditingLyrics ? (
                  <Textarea
                    value={editedLyrics}
                    onChange={(e) => setEditedLyrics(e.target.value)}
                    className="min-h-[300px] font-sans text-sm text-purple-800"
                  />
                ) : (
                  <div className="p-6 bg-white rounded-xl border-2 border-purple-200 shadow-inner max-h-96 overflow-y-auto">
                    <pre className="whitespace-pre-wrap font-sans text-sm text-purple-800 leading-relaxed">
                      {generatedSong}
                    </pre>
                  </div>
                )}
                <div className="flex gap-3">
                  <Button variant="outline" onClick={copyToClipboard} className="flex-1 border-purple-300">
                    {copied ? <><Check className="w-4 h-4 mr-2" /> Copied!</> : <><Copy className="w-4 h-4 mr-2" /> Copy Lyrics</>}
                  </Button>
                  <Button variant="outline" onClick={generateSong} disabled={loading} className="flex-1 border-pink-300">
                    <RefreshCw className="w-4 h-4 mr-2" /> Regenerate
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Suno Style Card */}
            {songStyles && (
              <Card className="border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-amber-700 text-lg">🎹 Suno Style Prompt</CardTitle>
                    <Button variant="outline" size="sm" onClick={copyStyleToClipboard} className="border-amber-300">
                      {copiedStyle ? <><Check className="w-4 h-4 mr-1" /> Copied!</> : <><Copy className="w-4 h-4 mr-1" /> Copy</>}
                    </Button>
                  </div>
                  <CardDescription>Paste this into Suno's style field</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="p-4 bg-white rounded-lg border border-amber-200 text-sm text-gray-700">
                    {songStyles}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Title Ideas Card */}
            {songTitles.length > 0 && (
              <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
                <CardHeader>
                  <CardTitle className="text-blue-700 text-lg">📝 Title Ideas</CardTitle>
                  <CardDescription>Click any title to copy it</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {songTitles.map((title, idx) => (
                      <Button
                        key={idx}
                        variant="outline"
                        className="justify-start text-left h-auto py-2 px-3 border-blue-200 hover:bg-blue-100"
                        onClick={() => {
                          navigator.clipboard.writeText(title);
                        }}
                      >
                        <span className="text-blue-600 font-medium mr-2">{idx + 1}.</span>
                        <span className="text-gray-700">{title}</span>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Suno Button */}
            <div className="flex gap-3">
              <Button 
                onClick={() => setShowSunoModal(true)}
                className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
              >
                <ExternalLink className="w-4 h-4 mr-2" /> Create Your Track with Suno 🎵
              </Button>
              <Button 
                onClick={() => {
                  setFinalLyrics('');
                  setCaptionLyrics('');
                  setPostCaption('');
                  setShowFinalizeModal(true);
                }}
                variant="outline"
                className="flex-1 border-purple-300 text-purple-700 hover:bg-purple-50"
              >
                <Music className="w-4 h-4 mr-2" /> Finalize for Video Captions
              </Button>
            </div>

            {shared && (
              <div className="p-3 bg-teal-50 rounded-lg flex items-center gap-2">
                <Check className="w-4 h-4 text-teal-600" />
                <span className="text-sm text-teal-700">Song auto-shared based on your settings!</span>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Suno Info Modal */}
      <SunoInfoModal 
        isOpen={showSunoModal} 
        onClose={() => setShowSunoModal(false)} 
      />

      {/* Finalize Lyrics Modal */}
      <Dialog open={showFinalizeModal} onOpenChange={setShowFinalizeModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Music className="w-5 h-5 text-purple-600" />
              Finalize Lyrics for Video Captions
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {!captionLyrics ? (
              <>
                <p className="text-sm text-gray-600">
                  Paste your final lyrics from Suno below. We'll replace the phonetic spellings with display names for your video captions.
                </p>

                <div className="space-y-2">
                  <Label>Paste Final Lyrics from Suno</Label>
                  <Textarea
                    value={finalLyrics}
                    onChange={(e) => setFinalLyrics(e.target.value)}
                    placeholder="Paste your final song lyrics here..."
                    className="min-h-[200px]"
                  />
                </div>

                <Button
                  onClick={processFinalLyrics}
                  disabled={processingFinal || !finalLyrics.trim()}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  {processingFinal ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
                  ) : (
                    <><Sparkles className="w-4 h-4 mr-2" /> Convert for Captions</>
                  )}
                </Button>
              </>
            ) : (
              <>
                {/* Caption-Ready Lyrics */}
                <Card className="border-2 border-green-200 bg-green-50">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-green-700 text-lg">📝 Caption-Ready Lyrics</CardTitle>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          navigator.clipboard.writeText(captionLyrics);
                          setCopiedFinalLyrics(true);
                          setTimeout(() => setCopiedFinalLyrics(false), 2000);
                        }}
                        className="border-green-300"
                      >
                        {copiedFinalLyrics ? <><Check className="w-4 h-4 mr-1" /> Copied!</> : <><Copy className="w-4 h-4 mr-1" /> Copy</>}
                      </Button>
                    </div>
                    <CardDescription>Phonetic names replaced with display names</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="p-4 bg-white rounded-lg border border-green-200 max-h-48 overflow-y-auto">
                      <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700">
                        {captionLyrics}
                      </pre>
                    </div>
                  </CardContent>
                </Card>

                {/* Post Caption */}
                <Card className="border-2 border-pink-200 bg-pink-50">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-pink-700 text-lg">📱 TikTok Post Caption</CardTitle>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          navigator.clipboard.writeText(postCaption);
                          setCopiedCaption(true);
                          setTimeout(() => setCopiedCaption(false), 2000);
                        }}
                        className="border-pink-300"
                      >
                        {copiedCaption ? <><Check className="w-4 h-4 mr-1" /> Copied!</> : <><Copy className="w-4 h-4 mr-1" /> Copy</>}
                      </Button>
                    </div>
                    <CardDescription>Ready to paste into your TikTok post</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={postCaption}
                      onChange={(e) => setPostCaption(e.target.value)}
                      className="min-h-[120px] bg-white"
                    />
                  </CardContent>
                </Card>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setFinalLyrics('');
                      setCaptionLyrics('');
                      setPostCaption('');
                    }}
                    className="flex-1"
                  >
                    Start Over
                  </Button>
                  <Button
                    variant="outline"
                    onClick={async () => {
                      setProcessingFinal(true);
                      try {
                        const gifterMapping = formData.gifters.map(g => ({
                          phonetic: g.name,
                          displayName: g.username ? `@${g.username}` : g.name
                        }));
                        const result = await base44.integrations.Core.InvokeLLM({
                          prompt: `Replace phonetic spellings with display names in these lyrics.

                GIFTER MAPPING (phonetic -> display):
                ${gifterMapping.map(g => `"${g.phonetic}" -> "${g.displayName}"`).join('\n')}

                LYRICS:
                ${finalLyrics}

                Return the lyrics with phonetic names replaced by display names.`,
                          response_json_schema: {
                            type: "object",
                            properties: {
                              caption_lyrics: { type: "string" }
                            }
                          }
                        });
                        setCaptionLyrics(result.caption_lyrics || finalLyrics);
                      } catch (e) {
                        console.error(e);
                      }
                      setProcessingFinal(false);
                    }}
                    disabled={processingFinal}
                    className="flex-1 border-green-300 text-green-700"
                  >
                    {processingFinal ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                    Generate Lyrics for Captions
                  </Button>
                  <Button
                    variant="outline"
                    onClick={async () => {
                      setProcessingFinal(true);
                      try {
                        const hostDisplayName = preferences?.tiktok_display_name || preferences?.tiktok_username || 'the creator';
                        const gifterTags = formData.gifters
                          .filter(g => g.username)
                          .map(g => `@${g.username}`)
                          .join(' ');
                        const result = await base44.integrations.Core.InvokeLLM({
                          prompt: `Create a TikTok post caption for ${hostDisplayName}'s Gift Gallery Thank-You video.

                The caption should:
                1. Thank the top gifters of the week
                2. Be fun, appreciative, and engaging
                3. Include these gifter tags: ${gifterTags}
                4. End with relevant hashtags like #TikTokLive #GiftGallery #ThankYou

                Creator display name: ${hostDisplayName}`,
                          response_json_schema: {
                            type: "object",
                            properties: {
                              post_caption: { type: "string" }
                            }
                          }
                        });
                        setPostCaption(result.post_caption || '');
                      } catch (e) {
                        console.error(e);
                      }
                      setProcessingFinal(false);
                    }}
                    disabled={processingFinal}
                    className="flex-1 border-pink-300 text-pink-700"
                  >
                    {processingFinal ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                    Regenerate Caption
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Song History Modal */}
      <SongHistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        songs={songHistory}
        isLoading={historyLoading}
        onSelect={(song) => {
          setGeneratedSong(song.lyrics);
          setSongType(song.song_type);
          setFormData({
            ...formData,
            gifters: song.gifters || [],
            milestone: song.milestone || '',
            custom_prompt: song.custom_prompt || '',
            tone_override: song.tone || ''
          });
          setShowHistoryModal(false);
        }}
        onDelete={(id) => deleteSongMutation.mutate(id)}
        onToggleFavorite={(song) => toggleFavoriteMutation.mutate({ id: song.id, is_favorite: song.is_favorite })}
      />
    </div>
  );
}