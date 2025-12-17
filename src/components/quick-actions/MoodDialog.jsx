import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function MoodDialog({ isOpen, onClose, onSave, isLoading, topMoodEmojis = [] }) {
  const queryClient = useQueryClient();
  const [mood, setMood] = useState('');
  const [note, setNote] = useState('');

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
              {topMoodEmojis.length > 0 ? (
                topMoodEmojis.map((m, index) => (
                  <Button
                    key={index}
                    variant={mood === m.value ? 'default' : 'outline'}
                    onClick={() => setMood(m.value)}
                    className={`${mood === m.value ? m.color : ''}`}
                  >
                    {m.emoji} {m.label}
                  </Button>
                ))
              ) : (
                // Default mood buttons if preferences are not set or empty
                <>
                  <Button variant={mood === 'great' ? 'default' : 'outline'} onClick={() => setMood('great')}>😊 Great</Button>
                  <Button variant={mood === 'good' ? 'default' : 'outline'} onClick={() => setMood('good')}>🙂 Good</Button>
                  <Button variant={mood === 'okay' ? 'default' : 'outline'} onClick={() => setMood('okay')}>😐 Okay</Button>
                  <Button variant={mood === 'low' ? 'default' : 'outline'} onClick={() => setMood('low')}>🙁 Low</Button>
                  <Button variant={mood === 'anxious' ? 'default' : 'outline'} onClick={() => setMood('anxious')}>😟 Anxious</Button>
                </>
              )}
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