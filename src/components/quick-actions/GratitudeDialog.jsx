import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function GratitudeDialog({ isOpen, onClose, onSave, isLoading }) {
  const queryClient = useQueryClient();
  const [gratitudeEntry, setGratitudeEntry] = useState('');

  useEffect(() => {
    if (isOpen) {
      setGratitudeEntry('');
    }
  }, [isOpen]);

  const handleSubmit = () => {
    if (!gratitudeEntry.trim()) return;
    onSave({ gratitude_entry: gratitudeEntry });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Express Gratitude</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="gratitudeEntry">What are you grateful for today?</Label>
            <Textarea
              id="gratitudeEntry"
              placeholder="e.g., My family, a sunny day, a good cup of coffee"
              value={gratitudeEntry}
              onChange={(e) => setGratitudeEntry(e.target.value)}
              required
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!gratitudeEntry.trim() || isLoading}>Save Gratitude</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}