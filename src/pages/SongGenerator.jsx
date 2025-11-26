import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Music, Loader2, Copy, RefreshCw, Sparkles, Users, Send, Check, Gift, Swords, Heart, Share2, Trophy, Star, Zap, Settings, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { createPageUrl } from '../utils';
import { getEffectiveUserEmail } from '../components/admin/ImpersonationBanner';
import { format, startOfWeek } from 'date-fns';

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
  const [songType, setSongType] = useState('');
  const [formData, setFormData] = useState({
    gifters: [],
    milestone: '',
    engagement_action: 'taps',
    custom_prompt: '',
    tone_override: ''
  });
  const [generatedSong, setGeneratedSong] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);
  const [user, setUser] = useState(null);

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

  // Get current week's entries for auto-population
  const currentWeek = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const { data: entries = [] } = useQuery({
    queryKey: ['giftingEntries', currentWeek, effectiveEmail],
    queryFn: () => base44.entities.GiftingEntry.filter({ week: currentWeek, created_by: effectiveEmail }),
    enabled: !!effectiveEmail && songType === 'gift_gallery',
  });

  const gifters = contacts.filter(c => c.is_gifter);

  // Auto-populate gift gallery from entries
  useEffect(() => {
    if (songType === 'gift_gallery' && entries.length > 0) {
      const sortedEntries = [...entries].sort((a, b) => {
        const order = { '1st': 1, '2nd': 2, '3rd': 3 };
        return (order[a.rank] || 99) - (order[b.rank] || 99);
      });
      setFormData(prev => ({
        ...prev,
        gifters: sortedEntries.map(e => ({
          name: e.gifter_phonetic || e.gifter_screen_name || e.gifter_username,
          username: e.gifter_username,
          rank: e.rank,
          gift: e.gift_name
        }))
      }));
    }
  }, [songType, entries]);

  const generateSong = async () => {
    setLoading(true);
    try {
      const hostName = preferences?.tiktok_display_name || preferences?.tiktok_username || 'Host';
      const roomVibe = preferences?.room_vibe || '';
      const tone = formData.tone_override || preferences?.default_song_tone || 'upbeat';
      const includeLevelUp = preferences?.include_levelup_verse !== false;
      const league = preferences?.league_level || '';

      let prompt = `You are Sunny Songbird, a fun, bubbly songwriter who helps TikTok lyve-stream hosts turn their community moments into songs!

Voice: High-energy, supportive, and always hype. Think "best friend who hypes you up AND writes your bars."
Always spell out usernames with numbers (e.g., SheriD777 = Sheri Dee Seven Seven Seven).
Always write "lyve" (not LIVE) so it's pronounced correctly.

Song Format:
[VERSE 1]
[VERSE 2]  
[CHORUS]
[VERSE 3]
[FINAL CHORUS]
[OUTRO/TAG]

Host Name: ${hostName}
${roomVibe ? `Room Vibe/Theme: ${roomVibe}` : ''}
Tone: ${tone}
${league ? `League Level: ${league}` : ''}
${includeLevelUp ? 'Include a verse encouraging the community to help level up!' : ''}

`;

      if (songType === 'gift_gallery' || songType === 'top_gifters') {
        const gifterList = formData.gifters.map(g => 
          `${g.rank || 'Gifter'}: ${g.name}${g.username ? ` (@${g.username})` : ''}${g.gift ? ` sent ${g.gift}` : ''}`
        ).join('\n');
        prompt += `Create a Thank-You Song celebrating these gifters:\n${gifterList}\n\nMake each gifter feel special and appreciated. Weave in the room vibe if provided.`;
      } else if (songType === 'battle_hype') {
        prompt += `Create a high-energy Battle Hype Song to pump up the crowd! Focus on energy, tapping, sharing, and supporting ${hostName}. Make it chant-worthy!`;
      } else if (songType === 'engagement') {
        const action = formData.engagement_action;
        prompt += `Create an Engagement Hype Song focused on "${action}". This should be chant-style with NO usernames. Focus on: "Tap tap tap the screen," "Share the lyve," "Drop stickers," "Push the energy," "Keep the chat flowing." Make it catchy and repeatable!`;
      } else if (songType === 'milestone') {
        prompt += `Create a Milestone Celebration Song for: "${formData.milestone}". Make it epic and celebratory!`;
      } else if (songType === 'custom') {
        prompt += `Create a custom celebration song based on: "${formData.custom_prompt}"`;
      } else if (songType === 'most_taps') {
        prompt += `Create a song celebrating the biggest tappers! Focus on heart taps, screen tapping, and keeping the energy flowing for ${hostName}.`;
      } else if (songType === 'most_shares') {
        prompt += `Create a song thanking those who share the lyve! Celebrate people who spread the word and bring new viewers to ${hostName}'s stream.`;
      } else if (songType === 'top_viewers') {
        prompt += `Create a song celebrating loyal viewers who watch the longest! Thank them for their time and dedication to ${hostName}'s content.`;
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
            style_suggestions: {
              type: "array",
              items: { type: "string" },
              description: "7 music style suggestions for AI music tools"
            }
          }
        }
      });

      const songOutput = `${result.song}\n\n---\n📝 Title Ideas:\n${result.title_ideas?.map((t, i) => `${i + 1}. ${t}`).join('\n') || ''}\n\n🎵 Style Suggestions for Suno:\n${result.style_suggestions?.map((s, i) => `${i + 1}. ${s}`).join('\n') || ''}\n\n🎶 Lyrics are ready! Copy them, then head to https://suno.com to create your track!`;

      setGeneratedSong(songOutput);

      // Auto-share
      const recipients = [];
      if (preferences?.share_songs_with_pixel) recipients.push('PixelNutsCreative@gmail.com');
      if (preferences?.song_share_email) recipients.push(preferences.song_share_email);

      if (recipients.length > 0) {
        for (const email of recipients) {
          await base44.integrations.Core.SendEmail({
            to: email,
            subject: `🎵 New Song from Sunny Songbird - ${songTypes.find(s => s.id === songType)?.label || 'Custom'}`,
            body: `Here's a new song for ${hostName}:\n\n${songOutput}\n\n---\nGenerated with Sunny Songbird 🎤`
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
    navigator.clipboard.writeText(generatedSong);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
                    <div className="flex items-center justify-between">
                      <Label>Gifters to Celebrate</Label>
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
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-2 border-pink-200 bg-gradient-to-br from-pink-50 to-purple-50">
              <CardHeader>
                <CardTitle className="text-center text-pink-600">🎵 Your Song is Ready! 🎵</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-6 bg-white rounded-xl border-2 border-purple-200 shadow-inner max-h-96 overflow-y-auto">
                  <pre className="whitespace-pre-wrap font-sans text-sm text-purple-800 leading-relaxed">
                    {generatedSong}
                  </pre>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={copyToClipboard} className="flex-1 border-purple-300">
                    {copied ? <><Check className="w-4 h-4 mr-2" /> Copied!</> : <><Copy className="w-4 h-4 mr-2" /> Copy Song</>}
                  </Button>
                  <Button variant="outline" onClick={generateSong} disabled={loading} className="flex-1 border-pink-300">
                    <RefreshCw className="w-4 h-4 mr-2" /> Regenerate
                  </Button>
                </div>
                
                <div className="flex gap-2">
                  <a href="https://suno.com" target="_blank" rel="noopener noreferrer" className="flex-1">
                    <Button variant="outline" className="w-full border-amber-300 hover:bg-amber-50">
                      <ExternalLink className="w-4 h-4 mr-2" /> Open Suno.com
                    </Button>
                  </a>
                </div>

                {shared && (
                  <div className="p-3 bg-teal-50 rounded-lg flex items-center gap-2">
                    <Check className="w-4 h-4 text-teal-600" />
                    <span className="text-sm text-teal-700">Song auto-shared based on your settings!</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}