import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Upload, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function AddProductModal({ isOpen, onClose, onSuccess, brandId, primaryColor }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setImageUrl(file_url);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      alert('Please enter a product name');
      return;
    }

    setSaving(true);
    try {
      const newProduct = await base44.entities.BrandProduct.create({
        brand_id: brandId,
        name,
        description,
        image_url: imageUrl
      });
      onSuccess?.(newProduct);
      onClose();
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Product/Offer</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div>
            <Label>Product/Offer Name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Premium Package" />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              placeholder="What is this product/offer?"
              rows={3}
            />
          </div>
          <div>
            <Label>Product Image (Optional)</Label>
            {imageUrl ? (
              <div className="mt-2">
                <img src={imageUrl} alt="" className="w-32 h-32 object-cover rounded border" />
                <Button size="sm" variant="outline" className="mt-2" onClick={() => setImageUrl('')}>
                  Remove Image
                </Button>
              </div>
            ) : (
              <label className="mt-2 border-2 border-dashed rounded p-6 flex flex-col items-center cursor-pointer hover:bg-gray-50">
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                {uploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Upload className="w-6 h-6 text-gray-400" />}
                <span className="text-sm text-gray-500 mt-2">Click to upload</span>
              </label>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} style={{ background: primaryColor }}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Save Product
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}