import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function IdeaDialog({ isOpen, onClose, onSave, isLoading }) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [ideaContent, setIdeaContent] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setIdeaContent('');
    }
  }, [isOpen]);

  const handleSubmit = () => {
    if (!ideaContent.trim()) return;
    onSave({ title, idea_content: ideaContent });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Jot Down an Idea</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title (Optional)</Label>
            <Input
              id="title"
              placeholder="Idea title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ideaContent">Idea Details</Label>
            <Textarea
              id="ideaContent"
              placeholder="Describe your brilliant idea!"
              value={ideaContent}
              onChange={(e) => setIdeaContent(e.target.value)}
              required
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!ideaContent.trim() || isLoading}>Save Idea</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}