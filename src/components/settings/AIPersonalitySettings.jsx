import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles } from 'lucide-react';

export default function AIPersonalitySettings({ formData, setFormData }) {
  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2"><Sparkles className="w-4 h-4" /> AI Personality & Tone</CardTitle>
        <CardDescription>Choose how the AI speaks to you (motivations, goal steps, content).</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          {[ // AI Personality & Tone Options
            { id: 'humorous', name: 'Humorous', description: 'Fun, witty, and light-hearted' },
            { id: 'professional', name: 'Professional', description: 'Clean, clear, and business-like' },
            { id: 'encouraging', name: 'Encouraging', description: 'Supportive, kind, and uplifting' },
            { id: 'loving', name: 'Loving', description: 'Warm, gentle, and nurturing' },
            { id: 'edgy_sassy', name: 'Edgy / Sassy', description: 'Bold, direct, borderline disrespectful (fun)' },
            { id: 'biblical', name: 'Biblical', description: 'Faith-based and scripture-aligned' },
          ].map(tone => (
            <div
              key={tone.id}
              onClick={() => setFormData({ ...formData, ai_personality_tone: tone.id })}
              className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                formData.ai_personality_tone === tone.id ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-purple-300'
              }`}
            >
              <p className="font-medium">{tone.name}</p>
              <p className="text-xs text-gray-500">{tone.description}</p>
            </div>
          ))}
        </div>
        <Label htmlFor="custom-ai-tone">Custom Brand Voice / Details (Optional)</Label>
        <Textarea
          id="custom-ai-tone"
          placeholder="Paste your brand voice details, specific phrases to use, or upload content style notes here..."
          value={formData.custom_ai_tone_details || ''}
          onChange={(e) => setFormData({ ...formData, custom_ai_tone_details: e.target.value })}
        />
      </CardContent>
    </Card>
  );
}