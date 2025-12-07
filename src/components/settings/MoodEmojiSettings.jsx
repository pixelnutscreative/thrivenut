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
            Click to add/remove from your top 7.
          </p>
          <div className="grid grid-cols-7 md:grid-cols-10 gap-1.5">
            {allMoods.map((mood) => {
              const isTop = topMoods.includes(mood.value);
              const canAdd = topMoods.length < 7;
              
              return (
                <button
                  key={mood.value}
                  onClick={() => toggleTopMood(mood.value)}
                  disabled={!isTop && !canAdd}
                  className={`p-2 rounded-lg border transition-all ${
                    isTop 
                      ? 'border-purple-500 bg-purple-50 ring-1 ring-purple-300' 
                      : 'border-gray-200 hover:border-purple-300 opacity-50'
                  } ${!isTop && !canAdd ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                  title={mood.label}
                >
                  <div className="text-xl">{mood.emoji}</div>
                  <div className="text-[10px] text-gray-600 truncate leading-tight">{mood.label}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Add Custom Mood - Compact */}
        <div className="pt-3 border-t space-y-2">
          <Label className="text-sm">Add Custom Mood</Label>
          <div className="flex gap-2">
            <Input
              placeholder="😊"
              value={newEmoji}
              onChange={(e) => setNewEmoji(e.target.value)}
              className="w-14 text-center text-xl p-1"
              maxLength={2}
            />
            <Input
              placeholder="Name"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              className="flex-1 h-9"
              onKeyDown={(e) => {
                if (e.key === 'Enter') addCustomMood();
              }}
            />
            <Button size="sm" onClick={addCustomMood} disabled={!newEmoji.trim() || !newLabel.trim()} className="h-9">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Custom Moods List - Compact */}
        {customMoods.length > 0 && (
          <div className="pt-2 space-y-1">
            <Label className="text-xs text-gray-500">Custom:</Label>
            <div className="flex flex-wrap gap-1">
              {customMoods.map((mood) => (
                <div key={mood.value} className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 rounded-full border border-purple-200 text-xs">
                  <span>{mood.emoji}</span>
                  <span>{mood.label}</span>
                  <button
                    onClick={() => removeCustomMood(mood.value)}
                    className="ml-1 text-red-400 hover:text-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}