import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Music, Loader2, Copy, RefreshCw, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const styles = [
  { value: 'fun and upbeat', label: '🎉 Fun & Upbeat' },
  { value: 'sweet and heartfelt', label: '💖 Sweet & Heartfelt' },
  { value: 'hype and energetic', label: '🔥 Hype & Energetic' },
  { value: 'silly and playful', label: '😜 Silly & Playful' },
  { value: 'classy and elegant', label: '✨ Classy & Elegant' },
];

export default function SongGenerator({ gifter, onClose }) {
  const [formData, setFormData] = useState({
    gifter_name: gifter?.screen_name || gifter?.username || '',
    gifter_username: gifter?.username || '',
    rank: '',
    gift_name: '',
    style: 'fun and upbeat'
  });
  const [generatedSong, setGeneratedSong] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateSong = async () => {
    if (!formData.gifter_name) return;
    
    setLoading(true);
    try {
      const response = await base44.functions.invoke('generateGifterSong', formData);
      setGeneratedSong(response.data.song);
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
    <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-purple-700">
          <Music className="w-6 h-6" />
          Sunny Songbird 🎵
        </CardTitle>
        <p className="text-sm text-gray-600">Generate a thank-you song for your gifter!</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Gifter Name *</Label>
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
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating Magic...</>
          ) : (
            <><Sparkles className="w-4 h-4 mr-2" /> Generate Song</>
          )}
        </Button>

        {generatedSong && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <div className="p-4 bg-white rounded-lg border-2 border-purple-200 shadow-inner">
              <pre className="whitespace-pre-wrap font-sans text-lg text-center text-purple-800">
                {generatedSong}
              </pre>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={copyToClipboard}
                className="flex-1"
              >
                {copied ? (
                  <><Copy className="w-4 h-4 mr-2" /> Copied!</>
                ) : (
                  <><Copy className="w-4 h-4 mr-2" /> Copy Song</>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={generateSong}
                disabled={loading}
                className="flex-1"
              >
                <RefreshCw className="w-4 h-4 mr-2" /> Try Another
              </Button>
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}