import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tag, User, Link as LinkIcon, FileText } from 'lucide-react';

const categories = [
  { id: 'watch', label: 'To Watch', emoji: '🎬' },
  { id: 'read', label: 'To Read', emoji: '📚' },
  { id: 'research', label: 'To Research', emoji: '🔍' },
  { id: 'buy', label: 'To Buy', emoji: '🛒' },
  { id: 'return', label: 'To Return', emoji: '↩️' },
  { id: 'visit', label: 'To Visit', emoji: '📍' },
  { id: 'listen', label: 'To Listen', emoji: '🎧' },
  { id: 'try', label: 'To Try', emoji: '🧪' },
  { id: 'bucket_list', label: 'Bucket List', emoji: '🌠' },
  { id: 'other', label: 'Other', emoji: '📦' }
];

export default function CollectionItemModal({ isOpen, onClose, item, onSave, defaultCategory }) {
  const [formData, setFormData] = useState({
    title: '',
    category: defaultCategory || 'watch',
    recommended_by: '',
    link: '',
    notes: '',
    status: 'pending'
  });

  React.useEffect(() => {
    if (item) {
      setFormData(item);
    } else {
      setFormData({
        title: '',
        category: defaultCategory || 'watch',
        recommended_by: '',
        link: '',
        notes: '',
        status: 'pending'
      });
    }
  }, [item, isOpen, defaultCategory]);

  const handleSubmit = () => {
    if (!formData.title.trim()) return;
    onSave(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{item ? 'Edit Item' : 'Add to List'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>What is it?</Label>
            <Input
              placeholder="Movie title, book name, product..."
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>List Category</Label>
              <Select 
                value={formData.category} 
                onValueChange={(v) => setFormData({ ...formData, category: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.emoji} {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Who recommended it?</Label>
              <div className="relative">
                <User className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  className="pl-9"
                  placeholder="Friend's name"
                  value={formData.recommended_by}
                  onChange={(e) => setFormData({ ...formData, recommended_by: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Link (optional)</Label>
            <div className="relative">
              <LinkIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                className="pl-9"
                placeholder="https://..."
                value={formData.link}
                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              placeholder="Any details..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
            Save Item
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}