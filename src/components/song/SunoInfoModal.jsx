import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Check, Music, Video, Shield, Sparkles } from 'lucide-react';

export default function SunoInfoModal({ isOpen, onClose }) {
  const benefits = [
    {
      icon: Shield,
      title: 'Commercial Rights',
      description: 'Use your songs on TikTok, YouTube, Spotify - anywhere you want to monetize!'
    },
    {
      icon: Music,
      title: 'Higher Quality Audio',
      description: 'Get professional-sounding tracks that stand out on your streams'
    },
    {
      icon: Video,
      title: 'Video Downloads with Lyrics',
      description: 'Download video files with animated lyrics - perfect for importing directly to TikTok!'
    },
    {
      icon: Sparkles,
      title: 'More Generations',
      description: 'Create more songs per month to keep your content fresh'
    }
  ];

  const handleOpenSuno = () => {
    window.open('https://suno.com/invite/@pixelnutscreative', '_blank');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Music className="w-6 h-6 text-purple-600" />
            Create Your Song with Suno
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <p className="text-gray-600">
            Suno is the AI music tool that turns your lyrics into real songs! Here's why a subscription is worth it:
          </p>

          <div className="space-y-3">
            {benefits.map((benefit, idx) => {
              const Icon = benefit.icon;
              return (
                <div key={idx} className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{benefit.title}</p>
                    <p className="text-sm text-gray-600">{benefit.description}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-4 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg border border-amber-200">
            <p className="text-sm text-amber-800">
              <strong>💡 Pro Tip:</strong> You can subscribe for just one month to create your songs, download everything you need, and cancel anytime. No long-term commitment required!
            </p>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Check className="w-4 h-4 text-green-500" />
            <span>Cancel anytime - no strings attached</span>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
            Maybe Later
          </Button>
          <Button 
            onClick={handleOpenSuno}
            className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Open Suno & Start Creating
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}