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
  engagement_live_song: 'Engagement Live Song',
  gift_gallery_song: 'Gift Gallery Thank You Song',
  thank_you_song: 'General Thank You Song',
  custom_song: 'Custom Song (Choose Type)',
  logo: 'Logo Design ($111)',
  other: 'Other'
};

const songTypes = {
  hype: 'Hype/Energetic',
  chill: 'Chill/Relaxed',
  emotional: 'Emotional/Heartfelt',
  funny: 'Funny/Comedic',
  epic: 'Epic/Dramatic'
};

export default function RequestContentModal({ isOpen, onClose, userEmail, primaryColor, accentColor }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    request_type: '',
    song_type: '',
    budget: 0,
    duration_days: 7,
    reference_images: [],
    coupon_code: ''
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');

  // Fetch pricing
  const { data: pricingOptions = [] } = useQuery({
    queryKey: ['contentPricing'],
    queryFn: () => base44.entities.ContentRequestPricing.filter({ is_active: true }),
  });

  // Fetch user's available coupons
  const { data: userCoupons = [] } = useQuery({
    queryKey: ['userCoupons', userEmail],
    queryFn: async () => {
      return await base44.entities.CouponCode.filter({
        assigned_to_email: userEmail,
        is_used: false,
        status: 'assigned'
      });
    },
    enabled: !!userEmail && isOpen,
  });

  const calculateFinalPrice = () => {
    let basePrice = parseFloat(formData.budget) || 0;
    
    // Apply rush multiplier
    const days = parseInt(formData.duration_days) || 7;
    let rushMultiplier = 1;
    if (days === 1) rushMultiplier = 2; // 2x for 1 day
    else if (days <= 3) rushMultiplier = 1.5; // 1.5x for 2-3 days
    
    const priceWithRush = basePrice * rushMultiplier;
    
    // Apply coupon discount
    let discount = 0;
    if (appliedCoupon) {
      if (appliedCoupon.discount_type === 'percentage') {
        discount = priceWithRush * (appliedCoupon.credit_amount / 100);
      } else {
        discount = appliedCoupon.credit_amount;
      }
      
      // Check minimum purchase
      if (appliedCoupon.minimum_purchase && basePrice < appliedCoupon.minimum_purchase) {
        discount = 0;
      }
    }
    
    const finalPrice = Math.max(0, priceWithRush - discount);
    
    return { basePrice, rushMultiplier, priceWithRush, discount, finalPrice };
  };

  const verifyCoupon = async () => {
    if (!formData.coupon_code) {
      setCouponError('Please enter a coupon code');
      return;
    }
    
    try {
      const coupons = await base44.entities.CouponCode.filter({
        code: formData.coupon_code.toUpperCase(),
        status: 'assigned',
        is_used: false
      });
      
      if (coupons.length === 0) {
        setCouponError('Invalid or expired coupon code');
        setAppliedCoupon(null);
        return;
      }
      
      const coupon = coupons[0];
      
      // Check if assigned to this user
      if (coupon.assigned_to_email && coupon.assigned_to_email !== userEmail) {
        setCouponError('This coupon is not assigned to you');
        setAppliedCoupon(null);
        return;
      }
      
      // Check expiration
      if (coupon.expiration_date && new Date(coupon.expiration_date) < new Date()) {
        setCouponError('This coupon has expired');
        setAppliedCoupon(null);
        return;
      }
      
      setAppliedCoupon(coupon);
      setCouponError('');
    } catch (error) {
      setCouponError('Error verifying coupon');
      setAppliedCoupon(null);
    }
  };

  const createRequestMutation = useMutation({
    mutationFn: async (data) => {
      // Calculate deadline
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + data.duration_days);
      
      const pricing = calculateFinalPrice();
      
      const requestData = {
        ...data,
        deadline: deadline.toISOString(),
        requester_email: userEmail,
        payment_status: 'pending',
        rush_multiplier: pricing.rushMultiplier,
        discount_amount: pricing.discount,
        final_price: pricing.finalPrice
      };
      
      // Mark coupon as used
      if (appliedCoupon) {
        requestData.coupon_code = appliedCoupon.code;
        await base44.entities.CouponCode.update(appliedCoupon.id, {
          is_used: true,
          used_date: new Date().toISOString(),
          status: 'used',
          used_on_request_id: 'pending' // Will update with request ID after creation
        });
      }
      
      return await base44.entities.ContentRequest.create(requestData);
    },
    onSuccess: async (request) => {
      // Update coupon with actual request ID
      if (appliedCoupon) {
        await base44.entities.CouponCode.update(appliedCoupon.id, {
          used_on_request_id: request.id
        });
      }
      queryClient.invalidateQueries({ queryKey: ['openContentRequests'] });
      queryClient.invalidateQueries({ queryKey: ['myContentRequests'] });
      queryClient.invalidateQueries({ queryKey: ['userCoupons'] });
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
      budget: pricing?.base_price || 0,
      song_type: '' // Reset song type when changing request type
    });
  };

  const handleSubmit = () => {
    // Validate song type for custom songs
    if (formData.request_type === 'custom_song' && !formData.song_type) {
      return;
    }
    
    // TODO: Integrate Stripe payment here before creating request
    createRequestMutation.mutate(formData);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      request_type: '',
      song_type: '',
      budget: 0,
      duration_days: 7,
      reference_images: [],
      coupon_code: ''
    });
    setAppliedCoupon(null);
    setCouponError('');
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

          {formData.request_type === 'custom_song' && (
            <div>
              <Label>Song Type *</Label>
              <Select value={formData.song_type} onValueChange={(v) => setFormData({ ...formData, song_type: v })}>
                <SelectTrigger><SelectValue placeholder="Choose song style..." /></SelectTrigger>
                <SelectContent>
                  {Object.entries(songTypes).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label>Your Budget ($)</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="number"
                step="1"
                min="1"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: parseFloat(e.target.value) })}
                className="pl-8"
                placeholder="Enter amount you want to pay"
              />
            </div>
            <p className="text-xs text-purple-600 mt-1">
              💡 Tip: Paying more than minimum encourages creators to submit their best work!
            </p>
          </div>

          <div>
            <Label>Deadline</Label>
            <Select value={String(formData.duration_days)} onValueChange={(v) => setFormData({ ...formData, duration_days: parseInt(v) })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 Day (Rush - 2x price) ⚡</SelectItem>
                <SelectItem value="2">2 Days (Rush - 1.5x price) 🔥</SelectItem>
                <SelectItem value="3">3 Days (Rush - 1.5x price) 🔥</SelectItem>
                <SelectItem value="7">1 Week (Standard)</SelectItem>
                <SelectItem value="14">2 Weeks</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Coupon Code */}
          <div>
            <Label>Coupon Code (Optional)</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Enter code"
                value={formData.coupon_code}
                onChange={(e) => {
                  setFormData({ ...formData, coupon_code: e.target.value.toUpperCase() });
                  setCouponError('');
                  setAppliedCoupon(null);
                }}
              />
              <Button type="button" variant="outline" onClick={verifyCoupon}>
                Apply
              </Button>
            </div>
            {couponError && <p className="text-xs text-red-500 mt-1">{couponError}</p>}
            {appliedCoupon && (
              <p className="text-xs text-green-600 mt-1">
                ✓ Coupon applied: ${appliedCoupon.credit_amount} {appliedCoupon.discount_type === 'percentage' ? '%' : ''} off
              </p>
            )}
            {userCoupons.length > 0 && !appliedCoupon && (
              <div className="mt-2 p-2 bg-purple-50 rounded text-xs">
                <p className="font-medium text-purple-800 mb-1">Your coupons:</p>
                <div className="space-y-1">
                  {userCoupons.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, coupon_code: c.code });
                        setAppliedCoupon(c);
                        setCouponError('');
                      }}
                      className="block text-purple-600 hover:underline"
                    >
                      {c.code} - ${c.credit_amount} off
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Price Summary */}
          {formData.budget > 0 && (
            <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-200 space-y-2 text-sm">
              <h4 className="font-semibold text-purple-900">Price Breakdown</h4>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Base Price:</span>
                  <span>${calculateFinalPrice().basePrice.toFixed(2)}</span>
                </div>
                {calculateFinalPrice().rushMultiplier > 1 && (
                  <div className="flex justify-between text-orange-600 font-medium">
                    <span>Rush Fee ({calculateFinalPrice().rushMultiplier}x):</span>
                    <span>+${(calculateFinalPrice().priceWithRush - calculateFinalPrice().basePrice).toFixed(2)}</span>
                  </div>
                )}
                {appliedCoupon && calculateFinalPrice().discount > 0 && (
                  <div className="flex justify-between text-green-600 font-medium">
                    <span>Coupon Discount:</span>
                    <span>-${calculateFinalPrice().discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg pt-2 border-t border-purple-300 text-purple-900">
                  <span>Total:</span>
                  <span>${calculateFinalPrice().finalPrice.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

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
            disabled={
              createRequestMutation.isPending || 
              !formData.title || 
              !formData.request_type ||
              (formData.request_type === 'custom_song' && !formData.song_type)
            }
            className="w-full text-white"
            style={{ background: `linear-gradient(to right, ${primaryColor}, ${accentColor})` }}
          >
            {createRequestMutation.isPending ? 'Creating...' : `Pay $${calculateFinalPrice().finalPrice.toFixed(2)} & Post Request`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}