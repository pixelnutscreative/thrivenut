import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Music, MonitorPlay, EyeOff, Menu } from 'lucide-react';

const positionOptions = [
  { value: 'menu', label: 'In Menu', icon: Menu, description: 'Shows above Pixel\'s Place in sidebar' },
  { value: 'floating', label: 'Floating Button', icon: MonitorPlay, description: 'Floating music button on screen' },
  { value: 'hidden', label: 'Hidden', icon: EyeOff, description: 'Don\'t show the player' },
];

export default function SoundCloudSettings({ formData, setFormData }) {
  const position = formData.soundcloud_player_position || 'hidden';
  const playlistUrl = formData.soundcloud_playlist_url || '';

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Music className="w-5 h-5 text-orange-500" />
            SoundCloud Player
          </CardTitle>
          <CardDescription>Add a music player with your favorite playlist</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>SoundCloud Playlist or Track URL</Label>
            <Input
              value={playlistUrl}
              onChange={(e) => setFormData({ ...formData, soundcloud_playlist_url: e.target.value })}
              placeholder="https://soundcloud.com/username/sets/playlist-name"
            />
            <p className="text-xs text-gray-500">
              Paste a link to any SoundCloud playlist, album, or track
            </p>
          </div>

          <div className="space-y-2">
            <Label>Player Position</Label>
            <div className="grid grid-cols-3 gap-3">
              {positionOptions.map(opt => {
                const Icon = opt.icon;
                return (
                  <div
                    key={opt.value}
                    onClick={() => setFormData({ ...formData, soundcloud_player_position: opt.value })}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all text-center ${
                      position === opt.value
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-orange-300'
                    }`}
                  >
                    <Icon className={`w-6 h-6 mx-auto mb-2 ${position === opt.value ? 'text-orange-600' : 'text-gray-500'}`} />
                    <h4 className="font-semibold text-sm">{opt.label}</h4>
                    <p className="text-xs text-gray-500 mt-1">{opt.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {playlistUrl && position !== 'hidden' && (
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-sm text-gray-600 mb-3">Preview:</p>
              <iframe
                width="100%"
                height="166"
                scrolling="no"
                frameBorder="no"
                allow="autoplay"
                src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(playlistUrl)}&color=%23bd84f5&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false&visual=false`}
                className="border-0 rounded-lg"
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}