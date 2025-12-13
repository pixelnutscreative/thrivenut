import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Gift, DollarSign, Check } from 'lucide-react';

export default function AdminReferralCommissionsContent() {
  const queryClient = useQueryClient();
  const [newCoupon, setNewCoupon] = useState('');

  // Fetch all AI tool purchases
  const { data: purchases = [], isLoading } = useQuery({
    queryKey: ['aiToolPurchases'],
    queryFn: () => base44.entities.AIToolPurchase.list('-created_date', 100)
  });

  // Fetch available coupons
  const { data: coupons = [] } = useQuery({
    queryKey: ['availableCoupons'],
    queryFn: async () => {
      // You'll store these in a simple entity or preferences
      // For now, placeholder
      return [];
    }
  });

  const addCouponMutation = useMutation({
    mutationFn: async (code) => {
      // Store coupon in a CouponQueue entity or similar
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availableCoupons'] });
      setNewCoupon('');
    }
  });

  const verifyPurchaseMutation = useMutation({
    mutationFn: async (purchaseId) => {
      // Mark as verified after 2-week + onboarding check
      return await base44.entities.AIToolPurchase.update(purchaseId, {
        verified: true,
        verified_date: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aiToolPurchases'] });
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Add Coupon Codes */}
      <Card>
        <CardHeader>
          <CardTitle>Pre-populate Coupon Codes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="Paste 11-char coupon code"
              value={newCoupon}
              onChange={(e) => setNewCoupon(e.target.value.toUpperCase())}
              maxLength={11}
              className="font-mono"
            />
            <Button 
              onClick={() => addCouponMutation.mutate(newCoupon)}
              disabled={newCoupon.length !== 11}
            >
              <Plus className="w-4 h-4 mr-2" /> Add to Queue
            </Button>
          </div>
          <p className="text-xs text-gray-500">Coupons in queue: {coupons.length}</p>
        </CardContent>
      </Card>

      {/* Purchase Tracking */}
      <Card>
        <CardHeader>
          <CardTitle>AI Tool Purchase Tracking</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {purchases.map(purchase => (
              <div key={purchase.id} className="p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                <div>
                  <p className="font-medium">{purchase.buyer_email}</p>
                  <p className="text-sm text-gray-600">
                    {purchase.product_type} • ${purchase.purchase_amount}
                    {purchase.referred_by_user_id && ` • Referred by: ${purchase.referred_by_user_id}`}
                  </p>
                  <p className="text-xs text-gray-500">
                    Purchase: {new Date(purchase.created_date).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {purchase.verified ? (
                    <Badge className="bg-green-100 text-green-800">
                      <Check className="w-3 h-3 mr-1" /> Verified
                    </Badge>
                  ) : (
                    <Button 
                      size="sm"
                      onClick={() => verifyPurchaseMutation.mutate(purchase.id)}
                    >
                      Verify
                    </Button>
                  )}
                  <Badge>${(purchase.purchase_amount * 0.22).toFixed(2)}</Badge>
                </div>
              </div>
            ))}
            {purchases.length === 0 && (
              <p className="text-center text-gray-400 py-8">No AI tool purchases yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}