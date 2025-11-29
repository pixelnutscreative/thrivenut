import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, Music, Sparkles } from 'lucide-react';
import { useTheme } from '../components/shared/useTheme';

export default function HolyHitmakers() {
  const { isDark, bgClass, textClass, cardBgClass } = useTheme();

  return (
    <div className={`min-h-screen ${bgClass} p-4 md:p-8`}>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className={`text-3xl font-bold ${textClass} flex items-center gap-3`}>
            <Music className="w-8 h-8 text-amber-500" />
            Holy Hitmakers
          </h1>
          <p className={`mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Create worship-inspired songs and faith-filled lyrics with AI
          </p>
        </div>

        <Card className={`${cardBgClass} border-amber-200`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-600">
              <Sparkles className="w-5 h-5" />
              About Holy Hitmakers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className={isDark ? 'text-gray-300' : 'text-gray-700'}>
              Holy Hitmakers is a custom GPT that helps you create worship songs, hymns, 
              and faith-inspired lyrics. Whether you're looking for something uplifting 
              for your live streams or personal devotion, Holy Hitmakers can help!
            </p>
            
            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl p-6 space-y-4">
              <h3 className="font-semibold text-amber-800">What you can create:</h3>
              <ul className="space-y-2 text-amber-700">
                <li>✨ Worship songs for your TikTok LIVE</li>
                <li>🙏 Personal devotional hymns</li>
                <li>💫 Faith-inspired spoken word</li>
                <li>🎵 Modern praise lyrics</li>
                <li>📖 Scripture-based melodies</li>
              </ul>
            </div>

            <Button
              onClick={() => window.open('https://chat.openai.com/g/g-holyHitmakers', '_blank')}
              className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Open Holy Hitmakers GPT
            </Button>

            <p className="text-sm text-center text-gray-500">
              Requires ChatGPT Plus subscription to use Custom GPTs
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}