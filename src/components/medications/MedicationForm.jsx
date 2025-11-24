import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { base44 } from '@/api/base44Client';
import { Upload, Loader2, AlertCircle } from 'lucide-react';

export default function MedicationForm({ isOpen, onClose, medication, onSave }) {
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    dosage: '',
    frequency: 'once_daily',
    time_category: 'with_breakfast',
    other_time_category: '',
    prescribing_doctor: '',
    prescription_date: '',
    notes: '',
    is_active: true,
    label_image_url: ''
  });

  useEffect(() => {
    if (medication) {
      setFormData({
        name: medication.name || '',
        dosage: medication.dosage || '',
        frequency: medication.frequency || 'once_daily',
        time_category: medication.time_category || 'with_breakfast',
        other_time_category: medication.other_time_category || '',
        prescribing_doctor: medication.prescribing_doctor || '',
        prescription_date: medication.prescription_date || '',
        notes: medication.notes || '',
        is_active: medication.is_active !== false,
        label_image_url: medication.label_image_url || ''
      });
    }
  }, [medication]);

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
      alert('Please provide medication name and dosage');
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
          <DialogTitle>{medication ? 'Edit Medication' : 'Add Medication'}</DialogTitle>
        </DialogHeader>

        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4 flex gap-2">
          <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-gray-700">
            <strong>Reminder:</strong> You are responsible for the accuracy of this information. This app does not provide medical advice.
          </p>
        </div>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Medication Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Fluoxetine, Ibuprofen"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dosage">Dosage *</Label>
            <Input
              id="dosage"
              placeholder="e.g., 20mg, 1 tablet"
              value={formData.dosage}
              onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
            />
            <p className="text-xs text-gray-500">
              ⚠️ I confirm this dosage is correct for me as prescribed by my healthcare provider.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="prescribing_doctor">Prescribing Doctor (Optional)</Label>
            <Input
              id="prescribing_doctor"
              placeholder="Dr. Smith"
              value={formData.prescribing_doctor}
              onChange={(e) => setFormData({ ...formData, prescribing_doctor: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="prescription_date">Prescription Date (Optional)</Label>
            <Input
              id="prescription_date"
              type="date"
              value={formData.prescription_date}
              onChange={(e) => setFormData({ ...formData, prescription_date: e.target.value })}
            />
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
              placeholder="Track effects or important reminders"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Upload Label Image (Optional)</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('medication-image-upload').click()}
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
                id="medication-image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
            {formData.label_image_url && (
              <img
                src={formData.label_image_url}
                alt="Medication label"
                className="w-full h-32 object-cover rounded border mt-2"
              />
            )}
            <p className="text-xs text-gray-500">
              For your reference only
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
            {medication ? 'Update' : 'Add'} Medication
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}