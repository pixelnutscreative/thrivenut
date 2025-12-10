import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Music, MonitorPlay, EyeOff, Menu, Check } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const positionOptions = [
  { value: 'menu', label: 'In Menu', icon: Menu, description: 'Shows above Pixel\'s Place in sidebar' },
  { value: 'floating', label: 'Floating Button', icon: MonitorPlay, description: 'Floating music button on screen' },
  { value: 'hidden', label: 'Hidden', icon: EyeOff, description: 'Don\'t show the player' },
  { value: 'bottom_bar', label: 'Bottom Bar', icon: MonitorPlay, description: 'Fixed to bottom of screen' }, // Added hypothetical option if wanted, but sticking to existing for now
];

export default function SoundCloudSettings({ formData, setFormData }) {
  const position = formData.soundcloud_player_position || 'hidden';
  const activeService = formData.active_music_service || 'soundcloud';
  
  // Handlers for URLs
  const handleSoundCloudChange = (e) => {
    setFormData({ ...formData, soundcloud_playlist_url: e.target.value });
  };

  const handleSpotifyChange = (e) => {
    setFormData({ ...formData, spotify_playlist_url: e.target.value });
  };

  const handleServiceChange = (value) => {
    setFormData({ ...formData, active_music_service: value });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Music className="w-5 h-5 text-orange-500" />
            Music Player Settings
          </CardTitle>
          <CardDescription>Add a music player with your favorite playlist (SoundCloud or Spotify)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          <div className="space-y-2">
            <Label>Preferred Music Service</Label>
            <div className="flex gap-4">
              <button
                onClick={() => handleServiceChange('soundcloud')}
                className={`flex-1 p-4 rounded-xl border-2 transition-all flex items-center justify-center gap-2 ${
                  activeService === 'soundcloud'
                    ? 'border-orange-500 bg-orange-50 text-orange-800'
                    : 'border-gray-200 hover:border-orange-200 text-gray-600'
                }`}
              >
                <img src="https://simpleicons.org/icons/soundcloud.svg" className="w-5 h-5 opacity-80" alt="" />
                <span className="font-semibold">SoundCloud</span>
                {activeService === 'soundcloud' && <Check className="w-4 h-4 ml-1" />}
              </button>
              
              <button
                onClick={() => handleServiceChange('spotify')}
                className={`flex-1 p-4 rounded-xl border-2 transition-all flex items-center justify-center gap-2 ${
                  activeService === 'spotify'
                    ? 'border-green-500 bg-green-50 text-green-800'
                    : 'border-gray-200 hover:border-green-200 text-gray-600'
                }`}
              >
                <img src="https://simpleicons.org/icons/spotify.svg" className="w-5 h-5 opacity-80" alt="" />
                <span className="font-semibold">Spotify</span>
                {activeService === 'spotify' && <Check className="w-4 h-4 ml-1" />}
              </button>
            </div>
          </div>

          {activeService === 'soundcloud' ? (
            <div className="space-y-2">
              <Label>SoundCloud Playlist or Track URL</Label>
              <Input
                value={formData.soundcloud_playlist_url || ''}
                onChange={handleSoundCloudChange}
                placeholder="https://soundcloud.com/username/sets/playlist-name"
                className="border-orange-200 focus:ring-orange-500"
              />
              <p className="text-xs text-gray-500">
                Paste a link to any SoundCloud playlist, album, or track
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Spotify Playlist, Album or Track URL</Label>
              <Input
                value={formData.spotify_playlist_url || ''}
                onChange={handleSpotifyChange}
                placeholder="https://open.spotify.com/playlist/..."
                className="border-green-200 focus:ring-green-500"
              />
              <p className="text-xs text-gray-500">
                Paste a link to any Spotify playlist, album, or track
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label>Player Position</Label>
            <div className="grid grid-cols-3 gap-3">
              {positionOptions.slice(0, 3).map(opt => {
                const Icon = opt.icon;
                return (
                  <div
                    key={opt.value}
                    onClick={() => setFormData({ ...formData, soundcloud_player_position: opt.value })}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all text-center ${
                      position === opt.value
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-purple-300'
                    }`}
                  >
                    <Icon className={`w-6 h-6 mx-auto mb-2 ${position === opt.value ? 'text-purple-600' : 'text-gray-500'}`} />
                    <h4 className="font-semibold text-sm">{opt.label}</h4>
                    <p className="text-xs text-gray-500 mt-1">{opt.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Preview */}
          <div className="pt-4 border-t">
            <Label className="mb-2 block text-gray-600">Preview</Label>
            <div className="bg-gray-50 p-4 rounded-xl">
              {activeService === 'soundcloud' && formData.soundcloud_playlist_url && (
                <iframe
                  width="100%"
                  height="166"
                  scrolling="no"
                  frameBorder="no"
                  allow="autoplay"
                  src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(formData.soundcloud_playlist_url)}&color=%23bd84f5&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false&visual=false`}
                  className="border-0 rounded-lg shadow-sm"
                />
              )}
              
              {activeService === 'spotify' && formData.spotify_playlist_url && (
                <iframe 
                  src={formData.spotify_playlist_url.replace('open.spotify.com/', 'open.spotify.com/embed/')}
                  width="100%" 
                  height="152" 
                  frameBorder="0" 
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                  loading="lazy"
                  className="border-0 rounded-xl shadow-sm"
                />
              )}
              
              {((activeService === 'soundcloud' && !formData.soundcloud_playlist_url) || 
                (activeService === 'spotify' && !formData.spotify_playlist_url)) && (
                <div className="text-center py-8 text-gray-400 italic">
                  Enter a URL above to see preview
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}