import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function AddBrandModal({ isOpen, onClose, onSuccess, primaryColor }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [toneVoice, setToneVoice] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      alert('Please enter a brand name');
      return;
    }

    setSaving(true);
    try {
      const newBrand = await base44.entities.Brand.create({
        name,
        description,
        tone_voice: toneVoice
      });
      onSuccess?.(newBrand);
      onClose();
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save brand');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Brand</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div>
            <Label>Brand Name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Acme Inc" />
          </div>
          <div>
            <Label>Brand Description</Label>
            <Textarea 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              placeholder="What does your brand do? What makes it unique?"
              rows={3}
            />
          </div>
          <div>
            <Label>Tone & Voice</Label>
            <Input 
              value={toneVoice} 
              onChange={(e) => setToneVoice(e.target.value)} 
              placeholder="e.g., Professional, Friendly, Bold, Luxurious"
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} style={{ background: primaryColor }}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Save Brand
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}