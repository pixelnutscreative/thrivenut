import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Upload, X, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function AddCharacterModal({ isOpen, onClose, onSuccess, primaryColor }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length + images.length > 7) {
      alert('Maximum 7 images allowed');
      return;
    }

    setUploading(true);
    try {
      const urls = await Promise.all(
        files.map(async (file) => {
          const { file_url } = await base44.integrations.Core.UploadFile({ file });
          return file_url;
        })
      );
      setImages([...images, ...urls]);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload images');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      alert('Please enter a character name');
      return;
    }

    setSaving(true);
    try {
      const newChar = await base44.entities.CharacterReference.create({
        name,
        description,
        images,
        prompt_snippet: description
      });
      onSuccess?.(newChar);
      onClose();
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save character');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Character Reference</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div>
            <Label>Character Name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Sarah, My Dog Max" />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              placeholder="Describe the character's appearance, style, features..."
              rows={3}
            />
          </div>
          <div>
            <Label>Reference Images (Up to 7)</Label>
            <div className="grid grid-cols-4 gap-2 mt-2">
              {images.map((url, idx) => (
                <div key={idx} className="relative">
                  <img src={url} alt="" className="w-full h-24 object-cover rounded border" />
                  <Button
                    size="sm"
                    variant="destructive"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                    onClick={() => setImages(images.filter((_, i) => i !== idx))}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
              {images.length < 7 && (
                <label className="border-2 border-dashed rounded h-24 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50">
                  <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
                  {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5 text-gray-400" />}
                  <span className="text-xs text-gray-500 mt-1">Upload</span>
                </label>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} style={{ background: primaryColor }}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Save Character
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}