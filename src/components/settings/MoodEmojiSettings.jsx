import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, GripVertical } from 'lucide-react';

const defaultMoodOptions = [
  { emoji: '😄', label: 'Great', value: 'great' },
  { emoji: '🙂', label: 'Good', value: 'good' },
  { emoji: '😐', label: 'Okay', value: 'okay' },
  { emoji: '😔', label: 'Low', value: 'low' },
  { emoji: '😰', label: 'Anxious', value: 'anxious' },
  { emoji: '😡', label: 'Angry', value: 'angry' },
  { emoji: '😢', label: 'Sad', value: 'sad' },
  { emoji: '🥰', label: 'Loved', value: 'loved' },
  { emoji: '💪', label: 'Motivated', value: 'motivated' },
  { emoji: '😴', label: 'Tired', value: 'tired' },
];

export default function MoodEmojiSettings({ formData, setFormData }) {
  const [newEmoji, setNewEmoji] = useState('');
  const [newLabel, setNewLabel] = useState('');

  const customMoods = formData.custom_mood_options || [];
  const allMoods = [...defaultMoodOptions, ...customMoods];
  const topMoods = formData.top_mood_emojis || defaultMoodOptions.slice(0, 7).map(m => m.value);

  const toggleTopMood = (value) => {
    const current = [...topMoods];
    if (current.includes(value)) {
      if (current.length > 1) { // Keep at least 1
        setFormData({ 
          ...formData, 
          top_mood_emojis: current.filter(v => v !== value) 
        });
      }
    } else {
      if (current.length < 7) { // Max 7
        setFormData({ 
          ...formData, 
          top_mood_emojis: [...current, value] 
        });
      }
    }
  };

  const addCustomMood = () => {
    if (!newEmoji.trim() || !newLabel.trim()) return;
    
    const value = newLabel.toLowerCase().replace(/\s+/g, '_');
    const newMood = {
      emoji: newEmoji,
      label: newLabel,
      value: value,
      isCustom: true
    };

    setFormData({
      ...formData,
      custom_mood_options: [...customMoods, newMood],
      top_mood_emojis: topMoods.length < 7 ? [...topMoods, value] : topMoods
    });

    setNewEmoji('');
    setNewLabel('');
  };

  const removeCustomMood = (value) => {
    setFormData({
      ...formData,
      custom_mood_options: customMoods.filter(m => m.value !== value),
      top_mood_emojis: topMoods.filter(v => v !== value)
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Mood Emoji Customization</CardTitle>
        <CardDescription>Pick your top 7 mood emojis and add custom ones</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-sm mb-2 block">
            Your Top 7 Moods ({topMoods.length}/7)
          </Label>
          <p className="text-xs text-gray-500 mb-3">
            These will appear in quick actions. Click to add/remove from your top 7.
          </p>
          <div className="grid grid-cols-5 gap-2">
            {allMoods.map((mood) => {
              const isTop = topMoods.includes(mood.value);
              const canAdd = topMoods.length < 7;
              const canRemove = topMoods.length > 1;
              
              return (
                <button
                  key={mood.value}
                  onClick={() => toggleTopMood(mood.value)}
                  disabled={!isTop && !canAdd}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    isTop 
                      ? 'border-purple-500 bg-purple-50 scale-105' 
                      : 'border-gray-200 hover:border-purple-300 opacity-60'
                  } ${!isTop && !canAdd ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                  title={mood.label}
                >
                  <div className="text-2xl mb-1">{mood.emoji}</div>
                  <div className="text-xs text-gray-600 truncate">{mood.label}</div>
                  {isTop && (
                    <div className="text-[10px] text-purple-600 font-semibold mt-1">
                      #{topMoods.indexOf(mood.value) + 1}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Add Custom Mood */}
        <div className="pt-4 border-t space-y-3">
          <Label className="text-sm">Add Custom Mood</Label>
          <div className="flex gap-2">
            <Input
              placeholder="😊"
              value={newEmoji}
              onChange={(e) => setNewEmoji(e.target.value)}
              className="w-16 text-center text-2xl"
              maxLength={2}
            />
            <Input
              placeholder="Mood name"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter') addCustomMood();
              }}
            />
            <Button onClick={addCustomMood} disabled={!newEmoji.trim() || !newLabel.trim()}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-gray-500">
            Use any emoji you want! These will be available in your mood tracker.
          </p>
        </div>

        {/* Custom Moods List */}
        {customMoods.length > 0 && (
          <div className="pt-4 border-t space-y-2">
            <Label className="text-sm">Your Custom Moods</Label>
            <div className="space-y-1">
              {customMoods.map((mood) => (
                <div key={mood.value} className="flex items-center justify-between p-2 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{mood.emoji}</span>
                    <span className="text-sm">{mood.label}</span>
                    {topMoods.includes(mood.value) && (
                      <Badge variant="secondary" className="text-xs">Top 7</Badge>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeCustomMood(mood.value)}
                    className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}