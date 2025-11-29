import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, Music, Sparkles, BookOpen, Mic2, Image, Share2, Heart } from 'lucide-react';
import { useTheme } from '../components/shared/useTheme';

export default function HolyHitmakers() {
  const { isDark, bgClass, textClass, cardBgClass, primaryColor, accentColor } = useTheme();

  const gptUrl = 'https://chatgpt.com/g/g-68d7f71ef634819189ba15d6b1edf481-bible-thumpers-holy-hitmakers';
  const sunoUrl = 'https://suno.com/invite/@iamnikolewithak';

  return (
    <div className={`min-h-screen ${bgClass} p-4 md:p-8`}>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className={`text-4xl font-bold ${textClass} flex items-center justify-center gap-3`}>
            <span className="text-4xl">✝️</span>
            Holy Hitmakers
            <span className="text-4xl">🎵</span>
          </h1>
          <p className={`mt-2 text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Turn Scripture into Spirit-filled songs that slap AND save
          </p>
        </div>

        {/* Main CTA Card */}
        <Card className="bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 text-white border-0 overflow-hidden">
          <CardContent className="p-8 text-center space-y-6">
            <div className="text-6xl">🔥</div>
            <div>
              <h2 className="text-2xl font-bold mb-2">Ready to Write Holy Fire?</h2>
              <p className="text-white/90">
                Give the GPT a Bible verse, pick your vibe, and watch it create catchy, 
                theologically-sound lyrics ready for Suno!
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={() => window.open(gptUrl, '_blank')}
                size="lg"
                className="bg-white text-orange-600 hover:bg-gray-100 font-bold"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Open Holy Hitmakers GPT
              </Button>
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(gptUrl);
                  alert('Link copied! Share the Gospel through song! 🙌');
                }}
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/20"
              >
                <Share2 className="w-5 h-5 mr-2" />
                Share This GPT
              </Button>
            </div>
            <p className="text-sm text-white/70">
              Free to use! Requires ChatGPT account (Plus for best experience)
            </p>
          </CardContent>
        </Card>

        {/* How It Works */}
        <Card className={cardBgClass}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-amber-500" />
              How It Works
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center p-4">
                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">📖</span>
                </div>
                <h3 className="font-bold mb-2">1. Pick a Scripture</h3>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Share any Bible verse and choose your vibe (funny, worship, kids, etc.)
                </p>
              </div>
              <div className="text-center p-4">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">✍️</span>
                </div>
                <h3 className="font-bold mb-2">2. Get Your Lyrics</h3>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Receive 7 title options, full lyrics, music style prompts & cover art ideas
                </p>
              </div>
              <div className="text-center p-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">🎤</span>
                </div>
                <h3 className="font-bold mb-2">3. Create in Suno</h3>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Paste your lyrics into Suno and let AI bring your worship to life!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* What You Get */}
        <Card className={`${cardBgClass} border-amber-200`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-600">
              <Sparkles className="w-5 h-5" />
              What Holy Hitmakers Creates For You
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg">
                <Music className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-amber-800">7 Song Title Options</h4>
                  <p className="text-sm text-amber-700">Mix of reverent and fun titles to choose from</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
                <BookOpen className="w-5 h-5 text-orange-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-orange-800">Full Song Lyrics</h4>
                  <p className="text-sm text-orange-700">Verse, chorus, bridge - ready to sing!</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                <Mic2 className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-red-800">7 Suno Style Prompts</h4>
                  <p className="text-sm text-red-700">From gospel trap to Hillsong ballads</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                <Image className="w-5 h-5 text-purple-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-purple-800">7 Cover Art Prompts</h4>
                  <p className="text-sm text-purple-700">Ready for AI image generation</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Suno Quick Start */}
        <Card className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="text-5xl">🎧</div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-xl font-bold mb-2">New to Suno?</h3>
                <p className="text-white/90 text-sm mb-3">
                  After Holy Hitmakers generates your lyrics, head to Suno to bring them to life! 
                  $10/mo gets you the 5.0 voice and full rights to your songs.
                </p>
                <p className="text-white/70 text-xs">
                  Pro tip: Set the "weirdness" slider to 77% for best results! 🎚️
                </p>
              </div>
              <Button
                onClick={() => window.open(sunoUrl, '_blank')}
                className="bg-white text-purple-600 hover:bg-gray-100 shrink-0"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Try Suno Free
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Spread the Word */}
        <Card className={cardBgClass}>
          <CardContent className="p-6 text-center">
            <Heart className="w-10 h-10 text-red-500 mx-auto mb-3" />
            <h3 className={`text-xl font-bold mb-2 ${textClass}`}>Spread the Kingdom!</h3>
            <p className={`mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Holy Hitmakers is FREE to share! Send this link to anyone who wants to 
              create faith-filled music. Let's spread the Gospel through song! 🙌
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(gptUrl);
                  alert('Link copied! Go spread the Word! ✝️');
                }}
                style={{ background: `linear-gradient(to right, ${primaryColor}, ${accentColor})` }}
              >
                <Share2 className="w-4 h-4 mr-2" />
                Copy GPT Link to Share
              </Button>
              <Button
                variant="outline"
                onClick={() => window.open('https://pixelnutscreative.com', '_blank')}
              >
                Want Your Own Custom GPT?
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500">
          Made with 💜 and the Holy Spirit by @PixelNutsCreative
        </p>
      </div>
    </div>
  );
}