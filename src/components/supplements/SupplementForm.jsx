import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { base44 } from '@/api/base44Client';
import { Upload, Loader2 } from 'lucide-react';

export default function SupplementForm({ isOpen, onClose, supplement, onSave }) {
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    dosage: '',
    frequency: 'once_daily',
    time_category: 'with_breakfast',
    other_time_category: '',
    notes: '',
    is_active: true,
    label_image_url: ''
  });

  useEffect(() => {
    if (supplement) {
      setFormData({
        name: supplement.name || '',
        dosage: supplement.dosage || '',
        frequency: supplement.frequency || 'once_daily',
        time_category: supplement.time_category || 'with_breakfast',
        other_time_category: supplement.other_time_category || '',
        notes: supplement.notes || '',
        is_active: supplement.is_active !== false,
        label_image_url: supplement.label_image_url || ''
      });
    }
  }, [supplement]);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, label_image_url: file_url });
    } catch (error) {
      alert('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.dosage.trim()) {
      alert('Please provide supplement name and dosage');
      return;
    }

    setLoading(true);
    await onSave(formData);
    setLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{supplement ? 'Edit Supplement' : 'Add Supplement'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Supplement Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Vitamin C, Omega-3"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dosage">Dosage *</Label>
            <Input
              id="dosage"
              placeholder="e.g., 500mg, 2 capsules"
              value={formData.dosage}
              onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
            />
            <p className="text-xs text-gray-500">
              ⚠️ I confirm this dosage is correct for me, as advised by my healthcare provider or based on my own research.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="frequency">Frequency</Label>
            <Select
              value={formData.frequency}
              onValueChange={(value) => setFormData({ ...formData, frequency: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="once_daily">Once Daily</SelectItem>
                <SelectItem value="twice_daily">Twice Daily</SelectItem>
                <SelectItem value="three_times_daily">Three Times Daily</SelectItem>
                <SelectItem value="as_needed">As Needed</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="time_category">When to Take</Label>
            <Select
              value={formData.time_category}
              onValueChange={(value) => setFormData({ ...formData, time_category: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="upon_awakening">Upon Awakening</SelectItem>
                <SelectItem value="with_breakfast">With Breakfast</SelectItem>
                <SelectItem value="morning_snack">Morning Snack</SelectItem>
                <SelectItem value="30_min_before_lunch">30 Min Before Lunch</SelectItem>
                <SelectItem value="with_lunch">With Lunch</SelectItem>
                <SelectItem value="afternoon_snack">Afternoon Snack</SelectItem>
                <SelectItem value="with_dinner">With Dinner</SelectItem>
                <SelectItem value="before_bed">Before Bed</SelectItem>
                <SelectItem value="empty_stomach_morning">Empty Stomach (Morning)</SelectItem>
                <SelectItem value="empty_stomach_evening">Empty Stomach (Evening)</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.time_category === 'other' && (
            <div className="space-y-2">
              <Label htmlFor="other_time">Custom Timing</Label>
              <Input
                id="other_time"
                placeholder="e.g., 2 hours after dinner"
                value={formData.other_time_category}
                onChange={(e) => setFormData({ ...formData, other_time_category: e.target.value })}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Track effects: e.g., 'gives me energy' or 'upsets stomach'"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
            <p className="text-xs text-gray-500">
              Use this to track positive or negative effects you notice
            </p>
          </div>

          <div className="space-y-2">
            <Label>Upload Label Image (Optional)</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('supplement-image-upload').click()}
                disabled={uploadingImage}
                className="w-full"
              >
                {uploadingImage ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
                {formData.label_image_url ? 'Change Image' : 'Upload Image'}
              </Button>
              <input
                id="supplement-image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
            {formData.label_image_url && (
              <img
                src={formData.label_image_url}
                alt="Supplement label"
                className="w-full h-32 object-cover rounded border mt-2"
              />
            )}
            <p className="text-xs text-gray-500">
              For your reference only - not used to determine dosage
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {supplement ? 'Update' : 'Add'} Supplement
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}