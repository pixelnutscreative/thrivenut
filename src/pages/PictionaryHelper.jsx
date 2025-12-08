import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Lightbulb, Target, Shuffle, Loader2 } from 'lucide-react';
import { useTheme } from '../components/shared/useTheme';

export default function PictionaryHelper() {
  const { isDark, bgClass, primaryColor, textClass, cardBgClass } = useTheme();
  const [word, setWord] = useState('');
  const [style, setStyle] = useState('easy');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState(null);

  const getDrawingSuggestions = async (drawStyle) => {
    if (!word.trim()) return;
    
    setLoading(true);
    setStyle(drawStyle);
    
    try {
      const imagePrompts = {
        easy: `Simple line drawing tutorial showing how to draw "${word}" for Pictionary. Clear, basic shapes that are easy to recognize. Black lines on white background, step-by-step drawing guide, minimalist style, easy to copy.`,
        pro: `Professional art tutorial showing how to draw "${word}" step-by-step. Detailed, well-proportioned, artistic quality. Black lines on white background, multiple steps showing progression from basic shapes to finished drawing.`,
        tricky: `Ambiguous line drawing of "${word}" that could be mistaken for other things. Make it vague and open to interpretation while still being drawable. Simple black lines on white background, intentionally unclear features.`
      };

      const imageUrl = await base44.integrations.Core.GenerateImage({
        prompt: imagePrompts[drawStyle]
      });

      setSuggestions({
        style: drawStyle,
        word,
        imageUrl: imageUrl.url
      });
    } catch (error) {
      console.error('Error generating drawing:', error);
    } finally {
      setLoading(false);
    }
  };

  const styleOptions = [
    { value: 'easy', label: 'Make it Easy', icon: Target, color: 'bg-green-500', description: 'Simple & obvious to guess' },
    { value: 'pro', label: 'Draw it Well', icon: Sparkles, color: 'bg-blue-500', description: 'Like a real artist' },
    { value: 'tricky', label: 'Make it Tricky', icon: Shuffle, color: 'bg-purple-500', description: 'Ambiguous & confusing' }
  ];

  return (
    <div className={`min-h-screen ${bgClass} p-4 md:p-8`}>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className={`text-3xl font-bold ${textClass}`}>Pictionary Helper</h1>
          <p className="text-gray-500 mt-1">AI-powered drawing tips for your word!</p>
        </div>

        <Card className={cardBgClass}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5" style={{ color: primaryColor }} />
              What word do you need to draw?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Enter your word (e.g., elephant, pizza, spaceship)"
              value={word}
              onChange={(e) => setWord(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && getDrawingSuggestions('easy')}
              className="text-lg"
            />

            <div className="grid md:grid-cols-3 gap-3">
              {styleOptions.map(opt => {
                const Icon = opt.icon;
                return (
                  <Button
                    key={opt.value}
                    onClick={() => getDrawingSuggestions(opt.value)}
                    disabled={!word.trim() || loading}
                    className={`h-auto py-4 flex-col gap-2 ${opt.color} hover:opacity-90 text-white`}
                  >
                    {loading && style === opt.value ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <Icon className="w-6 h-6" />
                    )}
                    <div>
                      <div className="font-semibold">{opt.label}</div>
                      <div className="text-xs opacity-90">{opt.description}</div>
                    </div>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {suggestions && (
          <Card className={cardBgClass}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" style={{ color: primaryColor }} />
                  How to Draw "{suggestions.word}"
                </CardTitle>
                <Badge className={styleOptions.find(s => s.value === suggestions.style)?.color}>
                  {styleOptions.find(s => s.value === suggestions.style)?.label}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-4">
                <img 
                  src={suggestions.imageUrl} 
                  alt={`How to draw ${suggestions.word}`}
                  className="w-full max-w-2xl rounded-lg border-2 border-gray-200"
                />
                <p className="text-sm text-gray-500 text-center">
                  {suggestions.style === 'easy' && 'Follow these simple shapes - keep it basic and recognizable!'}
                  {suggestions.style === 'pro' && 'Follow the steps to create a detailed, artistic drawing.'}
                  {suggestions.style === 'tricky' && 'Draw it ambiguously - make them guess multiple things!'}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {!suggestions && !loading && (
          <Card className={cardBgClass}>
            <CardContent className="py-12 text-center text-gray-500">
              <Lightbulb className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-semibold mb-2">How it works:</p>
              <ul className="text-left max-w-md mx-auto space-y-2">
                <li>🎯 <strong>Make it Easy:</strong> Get simple tips for obvious drawings</li>
                <li>✨ <strong>Draw it Well:</strong> Professional step-by-step instructions</li>
                <li>🎲 <strong>Make it Tricky:</strong> Ambiguous tips to keep them guessing</li>
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}