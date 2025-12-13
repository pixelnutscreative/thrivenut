import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Upload, X, AlertTriangle } from 'lucide-react';

export default function SubmitDesignModal({ isOpen, onClose, request, userEmail, userName, primaryColor, accentColor }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    watermarked_image: null,
    unwatermarked_image: null,
    description: ''
  });
  const [uploadingWatermarked, setUploadingWatermarked] = useState(false);
  const [uploadingUnwatermarked, setUploadingUnwatermarked] = useState(false);

  const submitDesignMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.entities.ContentSubmission.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contentSubmissions'] });
      onClose();
      resetForm();
    },
  });

  const handleWatermarkedUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploadingWatermarked(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, watermarked_image: file_url });
    } catch (error) {
      alert('Failed to upload image');
    } finally {
      setUploadingWatermarked(false);
    }
  };

  const handleUnwatermarkedUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploadingUnwatermarked(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, unwatermarked_image: file_url });
    } catch (error) {
      alert('Failed to upload image');
    } finally {
      setUploadingUnwatermarked(false);
    }
  };

  const handleSubmit = () => {
    submitDesignMutation.mutate({
      request_id: request.id,
      creator_email: userEmail,
      creator_name: userName,
      image_url: formData.watermarked_image,
      unwatermarked_image_url: formData.unwatermarked_image,
      description: formData.description
    });
  };

  const resetForm = () => {
    setFormData({
      watermarked_image: null,
      unwatermarked_image: null,
      description: ''
    });
  };

  if (!request) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { onClose(); resetForm(); } }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Submit Your Design</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-1">{request.title}</h3>
            <p className="text-sm text-gray-600">{request.description}</p>
            <p className="text-sm font-bold text-green-600 mt-2">💰 Prize: ${request.budget}</p>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
            <AlertTriangle className="w-4 h-4 inline mr-2" />
            <strong>IMPORTANT:</strong> Upload a heavily watermarked version for preview. Your clean file will only be shared if you win!
          </div>

          <div>
            <Label>Watermarked Preview Image *</Label>
            <p className="text-xs text-gray-500 mb-2">This will be shown to the requester and community for voting</p>
            {formData.watermarked_image ? (
              <div className="relative">
                <img src={formData.watermarked_image} alt="Preview" className="w-full rounded-lg" />
                <button
                  onClick={() => setFormData({ ...formData, watermarked_image: null })}
                  className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="block">
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleWatermarkedUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={uploadingWatermarked}
                  onClick={() => document.querySelectorAll('input[type="file"]')[0].click()}
                >
                  {uploadingWatermarked ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...</>
                  ) : (
                    <><Upload className="w-4 h-4 mr-2" /> Upload Watermarked Image</>
                  )}
                </Button>
              </label>
            )}
          </div>

          <div>
            <Label>Clean/Final Image (Unwatermarked) *</Label>
            <p className="text-xs text-gray-500 mb-2">Only shown to requester if you win</p>
            {formData.unwatermarked_image ? (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
                <span className="text-sm text-green-800">✓ Clean file uploaded</span>
                <button
                  onClick={() => setFormData({ ...formData, unwatermarked_image: null })}
                  className="text-red-500 hover:text-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="block">
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleUnwatermarkedUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={uploadingUnwatermarked}
                  onClick={() => document.querySelectorAll('input[type="file"]')[1].click()}
                >
                  {uploadingUnwatermarked ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...</>
                  ) : (
                    <><Upload className="w-4 h-4 mr-2" /> Upload Clean Image</>
                  )}
                </Button>
              </label>
            )}
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              placeholder="Tell them about your design approach..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={submitDesignMutation.isPending || !formData.watermarked_image || !formData.unwatermarked_image}
            className="w-full text-white"
            style={{ background: `linear-gradient(to right, ${primaryColor}, ${accentColor})` }}
          >
            {submitDesignMutation.isPending ? 'Submitting...' : 'Submit Design'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}