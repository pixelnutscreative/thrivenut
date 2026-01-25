import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function MoodDialog({ isOpen, onClose, onSave, isLoading, preferences }) {
  const queryClient = useQueryClient();
  const [mood, setMood] = useState('');
  const [note, setNote] = useState('');

  // Default moods
  const defaultMoodOptions = [
    { emoji: '😄', label: 'Great', value: 'great' },
    { emoji: '🙂', label: 'Good', value: 'good' },
    { emoji: '😐', label: 'Okay', value: 'okay' },
    { emoji: '😔', label: 'Low', value: 'low' },
    { emoji: '😰', label: 'Anxious', value: 'anxious' },
    { emoji: '😡', label: 'Angry', value: 'angry' },
    { emoji: '😢', label: 'Sad', value: 'sad' },
  ];

  // Build full mood list: defaults + custom
  const allMoods = [...defaultMoodOptions, ...(preferences?.custom_mood_options || [])];
  
  // Get top 7 selected moods (or defaults if not configured)
  const topMoodValues = preferences?.top_mood_emojis || defaultMoodOptions.slice(0, 7).map(m => m.value);
  const topMoodEmojis = allMoods.filter(m => topMoodValues.includes(m.value));

  useEffect(() => {
    if (isOpen) {
      setMood('');
      setNote('');
    }
  }, [isOpen]);

  const handleSubmit = () => {
    if (!mood) return;
    onSave({ mood, note });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log Your Mood</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>How are you feeling?</Label>
            <div className="flex flex-wrap gap-2">
              {topMoodEmojis.map((m, index) => (
                <Button
                  key={index}
                  variant={mood === m.value ? 'default' : 'outline'}
                  onClick={() => setMood(m.value)}
                >
                  {m.emoji} {m.label}
                </Button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="note">Notes (Optional)</Label>
            <Textarea
              id="note"
              placeholder="What's on your mind?"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!mood || isLoading}>Save Mood</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}