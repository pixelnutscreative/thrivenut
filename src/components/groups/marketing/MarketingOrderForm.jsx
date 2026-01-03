import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Upload, AlertCircle } from 'lucide-react';

export default function MarketingOrderForm({ group, onClose, existingOrder = null }) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, formState: { errors }, watch } = useForm({
    defaultValues: existingOrder || {
      title: '',
      description: '',
      needed_by_date: '',
      shipping_address: '',
      budget: '',
      vendor_quote_url: '',
      status: 'pending_quote'
    }
  });

  const [uploading, setUploading] = useState(false);
  const [quoteUrl, setQuoteUrl] = useState(existingOrder?.vendor_quote_url || '');

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.MarketingOrder.create({ ...data, group_id: group.id, client_email: base44.auth.user?.email || 'unknown' }),
    onSuccess: () => {
      queryClient.invalidateQueries(['marketingOrders', group.id]);
      onClose();
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.MarketingOrder.update(existingOrder.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['marketingOrders', group.id]);
      onClose();
    }
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setQuoteUrl(file_url);
    } catch (err) {
      console.error("Upload failed", err);
      alert("Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = (data) => {
    const payload = {
      ...data,
      budget: data.budget ? parseFloat(data.budget) : null,
      vendor_quote_url: quoteUrl,
    };

    if (existingOrder) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{existingOrder ? 'Edit Order' : 'New Marketing Order'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
          
          <div className="space-y-2">
            <Label>Project Title</Label>
            <Input {...register('title', { required: true })} placeholder="e.g. Summer Event Banners" />
            {errors.title && <span className="text-red-500 text-sm">Required</span>}
          </div>

          <div className="space-y-2">
            <Label>Specs & Details</Label>
            <Textarea 
                {...register('description', { required: true })} 
                placeholder="Describe what you need: dimensions, material, quantity, finish, etc. Be as specific as possible!"
                className="min-h-[100px]"
            />
            {errors.description && <span className="text-red-500 text-sm">Required</span>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label>Needed By</Label>
                <Input type="date" {...register('needed_by_date')} />
            </div>
            <div className="space-y-2">
                <Label>Target Budget (Optional)</Label>
                <div className="relative">
                    <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                    <Input type="number" step="0.01" {...register('budget')} className="pl-7" placeholder="0.00" />
                </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Shipping Address</Label>
            <Textarea {...register('shipping_address')} placeholder="Full delivery address..." />
          </div>

          <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 space-y-3">
            <div className="flex items-start gap-3">
                <div className="p-2 bg-indigo-100 rounded-full">
                    <Upload className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                    <h4 className="font-semibold text-indigo-900">Found a better price?</h4>
                    <p className="text-sm text-indigo-700">Upload a quote from another vendor, and we'll do our best to match or beat it!</p>
                </div>
            </div>
            
            <div className="flex items-center gap-3">
                <Input 
                    type="file" 
                    onChange={handleFileUpload} 
                    disabled={uploading}
                    className="bg-white"
                />
                {uploading && <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />}
            </div>
            {quoteUrl && (
                <div className="text-sm text-green-600 flex items-center gap-1">
                    <span className="font-medium">✓ Quote uploaded</span>
                    <a href={quoteUrl} target="_blank" rel="noreferrer" className="underline hover:text-green-700">(View)</a>
                </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending || uploading} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              {createMutation.isPending || updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {existingOrder ? 'Save Changes' : 'Submit Order Request'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}