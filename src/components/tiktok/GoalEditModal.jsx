import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';

export default function GoalEditModal({ isOpen, onClose, currentGoal, onSave }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    posts_goal: currentGoal?.posts_goal || 0,
    lives_goal: currentGoal?.lives_goal || 0,
    shop_lives_goal: currentGoal?.shop_lives_goal || 0,
    engagement_goal: currentGoal?.engagement_goal || 0,
    notes: currentGoal?.notes || ''
  });

  const handleSave = async () => {
    setLoading(true);
    await onSave(formData);
    setLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Set Your Weekly Content Goals</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="posts">Number of Posts</Label>
            <Input
              id="posts"
              type="number"
              min="0"
              value={formData.posts_goal}
              onChange={(e) => setFormData({...formData, posts_goal: parseInt(e.target.value) || 0})}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lives">Number of Lives</Label>
            <Input
              id="lives"
              type="number"
              min="0"
              value={formData.lives_goal}
              onChange={(e) => setFormData({...formData, lives_goal: parseInt(e.target.value) || 0})}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="shop_lives">TT Shop Lives</Label>
            <Input
              id="shop_lives"
              type="number"
              min="0"
              value={formData.shop_lives_goal}
              onChange={(e) => setFormData({...formData, shop_lives_goal: parseInt(e.target.value) || 0})}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="engagement">Engagement Actions</Label>
            <Input
              id="engagement"
              type="number"
              min="0"
              value={formData.engagement_goal}
              onChange={(e) => setFormData({...formData, engagement_goal: parseInt(e.target.value) || 0})}
              placeholder="Comments, DMs, etc."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Weekly Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              placeholder="Any notes or reminders for this week..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading} className="bg-purple-600 hover:bg-purple-700">
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save Goals
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}