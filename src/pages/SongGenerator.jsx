import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { Music, Loader2, Copy, RefreshCw, Sparkles, Users, Send, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const styles = [
  { value: 'fun and upbeat', label: '🎉 Fun & Upbeat' },
  { value: 'sweet and heartfelt', label: '💖 Sweet & Heartfelt' },
  { value: 'hype and energetic', label: '🔥 Hype & Energetic' },
  { value: 'silly and playful', label: '😜 Silly & Playful' },
  { value: 'classy and elegant', label: '✨ Classy & Elegant' },
];

export default function SongGenerator() {
  const [formData, setFormData] = useState({
    gifter_name: '',
    gifter_username: '',
    rank: '',
    gift_name: '',
    style: 'fun and upbeat'
  });
  const [generatedSong, setGeneratedSong] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: preferences } = useQuery({
    queryKey: ['preferences', user?.email],
    queryFn: async () => {
      const prefs = await base44.entities.UserPreferences.filter({ user_email: user.email });
      return prefs[0] || null;
    },
    enabled: !!user,
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ['tiktokContacts', user?.email],
    queryFn: () => base44.entities.TikTokContact.filter({ created_by: user.email }, 'display_name'),
    enabled: !!user,
  });

  const gifters = contacts.filter(c => c.is_gifter);

  const handleGifterSelect = (gifterId) => {
    const gifter = gifters.find(g => g.id === gifterId);
    if (gifter) {
      setFormData({
        ...formData,
        gifter_name: gifter.phonetic || gifter.screen_name || gifter.display_name || gifter.username,
        gifter_username: gifter.username
      });
    }
  };

  const generateSong = async () => {
    if (!formData.gifter_name) return;
    
    setLoading(true);
    try {
      const response = await base44.functions.invoke('generateGifterSong', formData);
      const song = response.data.song;
      setGeneratedSong(song);
      
      // Auto-share based on settings
      const recipients = [];
      if (preferences?.share_songs_with_pixel) {
        recipients.push('PixelNutsCreative@gmail.com');
      }
      if (preferences?.song_share_email) {
        recipients.push(preferences.song_share_email);
      }
      
      if (recipients.length > 0) {
        for (const email of recipients) {
          await base44.integrations.Core.SendEmail({
            to: email,
            subject: `🎵 Gifter Song for ${formData.gifter_name}`,
            body: `Here's a thank-you song generated for ${formData.gifter_name} (@${formData.gifter_username || 'N/A'}):\n\n${song}\n\n---\nGenerated with Sunny Songbird 🎤`
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



  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-purple-50 to-pink-50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center justify-center gap-3">
            <Music className="w-10 h-10 text-purple-500" />
            Sunny Songbird
          </h1>
          <p className="text-gray-600 mt-2">Your TikTok Live Hypegirl! 🎵</p>
          <p className="text-sm text-gray-500">Generate fun thank-you songs for your amazing gifters</p>
        </div>

        <Card className="border-2 border-purple-200 bg-white/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              Create a Song
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Quick Select from Saved Gifters */}
            {gifters.length > 0 && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Users className="w-4 h-4" /> Quick Select Gifter
                </Label>
                <Select onValueChange={handleGifterSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose from saved gifters..." />
                  </SelectTrigger>
                  <SelectContent>
                    {gifters.map(gifter => (
                      <SelectItem key={gifter.id} value={gifter.id}>
                        {gifter.screen_name || gifter.display_name || gifter.username} (@{gifter.username})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">Or enter details manually below</p>
              </div>
            )}

            <div className="border-t pt-4 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Gifter Name / Phonetic *</Label>
                  <Input
                    value={formData.gifter_name}
                    onChange={(e) => setFormData({ ...formData, gifter_name: e.target.value })}
                    placeholder="How to say their name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Username</Label>
                  <Input
                    value={formData.gifter_username}
                    onChange={(e) => setFormData({ ...formData, gifter_username: e.target.value })}
                    placeholder="@username"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Rank</Label>
                  <Select
                    value={formData.rank}
                    onValueChange={(value) => setFormData({ ...formData, rank: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select rank" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1st">🥇 1st Place</SelectItem>
                      <SelectItem value="2nd">🥈 2nd Place</SelectItem>
                      <SelectItem value="3rd">🥉 3rd Place</SelectItem>
                      <SelectItem value="Top Gifter">⭐ Top Gifter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Gift Name</Label>
                  <Input
                    value={formData.gift_name}
                    onChange={(e) => setFormData({ ...formData, gift_name: e.target.value })}
                    placeholder="e.g., Lion, Rose, etc."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Song Style</Label>
                <Select
                  value={formData.style}
                  onValueChange={(value) => setFormData({ ...formData, style: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {styles.map(style => (
                      <SelectItem key={style.value} value={style.value}>
                        {style.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={generateSong}
                disabled={loading || !formData.gifter_name}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-lg py-6"
              >
                {loading ? (
                  <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Creating Magic...</>
                ) : (
                  <><Sparkles className="w-5 h-5 mr-2" /> Generate Song 🎤</>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {generatedSong && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="border-2 border-pink-200 bg-gradient-to-br from-pink-50 to-purple-50">
              <CardHeader>
                <CardTitle className="text-center text-pink-600">🎵 Your Song is Ready! 🎵</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-6 bg-white rounded-xl border-2 border-purple-200 shadow-inner">
                  <pre className="whitespace-pre-wrap font-sans text-xl text-center text-purple-800 leading-relaxed">
                    {generatedSong}
                  </pre>
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={copyToClipboard}
                    className="flex-1 border-purple-300"
                  >
                    {copied ? (
                      <><Copy className="w-4 h-4 mr-2" /> Copied! ✓</>
                    ) : (
                      <><Copy className="w-4 h-4 mr-2" /> Copy Song</>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={generateSong}
                    disabled={loading}
                    className="flex-1 border-pink-300"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" /> Try Another Style
                  </Button>
                </div>

                {/* Sharing Status */}
                {(preferences?.share_songs_with_pixel || preferences?.song_share_email) && (
                  <div className="border-t pt-4 mt-4">
                    <div className="p-3 bg-teal-50 rounded-lg flex items-center gap-2">
                      {shared ? (
                        <><Check className="w-4 h-4 text-teal-600" /> <span className="text-sm text-teal-700">Song auto-shared based on your settings!</span></>
                      ) : (
                        <><Send className="w-4 h-4 text-teal-600" /> <span className="text-sm text-teal-700">Songs will be auto-shared based on your <a href="/Settings" className="underline font-medium">sharing settings</a></span></>
                      )}
                    </div>
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