import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Upload, X, DollarSign } from 'lucide-react';

const requestTypeLabels = {
  battle_poster: 'Battle Poster',
  battle_poster_with_loser: 'Battle Poster + Loser Poster',
  fan_sticker_single: 'Single Fan Sticker',
  fan_sticker_set: 'Fan Sticker Set (15)',
  digital_twin_initial: 'Digital Twin (7 images)',
  digital_twin_additional: 'Digital Twin Additional Image',
  greenscreen_background: 'Greenscreen Background',
  greenscreen_title: 'Greenscreen Title',
  nutpal: 'NutPal Character',
  other: 'Other'
};

export default function RequestContentModal({ isOpen, onClose, userEmail, primaryColor, accentColor }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    request_type: '',
    budget: 0,
    duration_hours: 24,
    reference_images: []
  });
  const [uploadingImage, setUploadingImage] = useState(false);

  // Fetch pricing
  const { data: pricingOptions = [] } = useQuery({
    queryKey: ['contentPricing'],
    queryFn: () => base44.entities.ContentRequestPricing.filter({ is_active: true }),
  });

  const createRequestMutation = useMutation({
    mutationFn: async (data) => {
      // Calculate deadline
      const deadline = new Date();
      deadline.setHours(deadline.getHours() + data.duration_hours);
      
      return await base44.entities.ContentRequest.create({
        ...data,
        deadline: deadline.toISOString(),
        requester_email: userEmail,
        payment_status: 'pending' // Will be updated after Stripe payment
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['openContentRequests'] });
      queryClient.invalidateQueries({ queryKey: ['myContentRequests'] });
      onClose();
      resetForm();
    },
  });

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploadingImage(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({
        ...formData,
        reference_images: [...formData.reference_images, file_url]
      });
    } catch (error) {
      alert('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = (index) => {
    setFormData({
      ...formData,
      reference_images: formData.reference_images.filter((_, i) => i !== index)
    });
  };

  const handleTypeChange = (type) => {
    const pricing = pricingOptions.find(p => p.request_type === type);
    setFormData({
      ...formData,
      request_type: type,
      budget: pricing?.base_price || 0
    });
  };

  const handleSubmit = () => {
    // TODO: Integrate Stripe payment here before creating request
    createRequestMutation.mutate(formData);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      request_type: '',
      budget: 0,
      duration_hours: 24,
      reference_images: []
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { onClose(); resetForm(); } }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Request Custom Content</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
            💰 Payment is collected upfront and held until you select a winner and receive your file!
          </div>

          <div>
            <Label>What do you need?</Label>
            <Select value={formData.request_type} onValueChange={handleTypeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select content type..." />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(requestTypeLabels).map(([value, label]) => {
                  const pricing = pricingOptions.find(p => p.request_type === value);
                  return (
                    <SelectItem key={value} value={value}>
                      {label} {pricing && `- $${pricing.base_price}`}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Title</Label>
            <Input
              placeholder="Brief title for your request"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              placeholder="Describe what you want in detail..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Budget</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="number"
                  step="1"
                  min="1"
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: parseFloat(e.target.value) })}
                  className="pl-8"
                />
              </div>
            </div>

            <div>
              <Label>Duration (hours)</Label>
              <Input
                type="number"
                min="1"
                max="720"
                value={formData.duration_hours}
                onChange={(e) => setFormData({ ...formData, duration_hours: parseInt(e.target.value) })}
              />
              <p className="text-xs text-gray-500 mt-1">1 hour to 30 days (720 hours)</p>
            </div>
          </div>

          <div>
            <Label>Reference Images (Optional)</Label>
            <div className="space-y-2">
              <div className="grid grid-cols-4 gap-2">
                {formData.reference_images.map((url, idx) => (
                  <div key={idx} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
              <label className="block">
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={uploadingImage}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={uploadingImage}
                  onClick={() => document.querySelector('input[type="file"]').click()}
                >
                  {uploadingImage ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...</>
                  ) : (
                    <><Upload className="w-4 h-4 mr-2" /> Add Reference Image</>
                  )}
                </Button>
              </label>
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={createRequestMutation.isPending || !formData.title || !formData.request_type}
            className="w-full text-white"
            style={{ background: `linear-gradient(to right, ${primaryColor}, ${accentColor})` }}
          >
            {createRequestMutation.isPending ? 'Creating...' : `Pay $${formData.budget} & Post Request`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}