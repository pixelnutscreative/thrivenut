import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Gift, DollarSign, Check, Trash2 } from 'lucide-react';
import AdminCouponQueueContent from './AdminCouponQueueContent';

export default function AdminReferralCommissionsContent() {
  const queryClient = useQueryClient();
  const [showAddPurchase, setShowAddPurchase] = useState(false);
  const [newPurchase, setNewPurchase] = useState({
    buyerEmail: '',
    referredByUserId: '',
    productType: 'pixels_ai_toolbox',
    purchaseAmount: 333,
    externalPurchase: true
  });

  // Fetch all AI tool purchases
  const { data: purchases = [], isLoading } = useQuery({
    queryKey: ['aiToolPurchases'],
    queryFn: () => base44.entities.AIToolPurchase.list('-created_date', 100)
  });

  const addPurchaseMutation = useMutation({
    mutationFn: async (data) => {
      const response = await base44.functions.invoke('recordAIPurchase', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aiToolPurchases'] });
      setShowAddPurchase(false);
      setNewPurchase({
        buyerEmail: '',
        referredByUserId: '',
        productType: 'pixels_ai_toolbox',
        purchaseAmount: 333,
        externalPurchase: true
      });
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
      {/* Coupon Queue */}
      <AdminCouponQueueContent />

      {/* Add Purchase Manually */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Record External Purchase</CardTitle>
            <Button size="sm" onClick={() => setShowAddPurchase(!showAddPurchase)}>
              <Plus className="w-4 h-4 mr-2" /> Add Purchase
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showAddPurchase && (
            <div className="p-4 bg-purple-50 border-2 border-purple-300 rounded-lg space-y-3 mb-4">
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <Label>Buyer Email</Label>
                  <Input
                    value={newPurchase.buyerEmail}
                    onChange={(e) => setNewPurchase({ ...newPurchase, buyerEmail: e.target.value })}
                    placeholder="buyer@example.com"
                  />
                </div>
                <div>
                  <Label>Referred By (Email)</Label>
                  <Input
                    value={newPurchase.referredByUserId}
                    onChange={(e) => setNewPurchase({ ...newPurchase, referredByUserId: e.target.value })}
                    placeholder="referrer@example.com"
                  />
                </div>
                <div>
                  <Label>Product</Label>
                  <select
                    value={newPurchase.productType}
                    onChange={(e) => setNewPurchase({ 
                      ...newPurchase, 
                      productType: e.target.value,
                      purchaseAmount: e.target.value === 'pixels_ai_toolbox' ? 333 : 297
                    })}
                    className="w-full p-2 border rounded"
                  >
                    <option value="pixels_ai_toolbox">Pixel's AI Toolbox ($333/yr)</option>
                    <option value="nuts_and_bots">Nuts & Bots ($297/yr)</option>
                    <option value="nuts_and_bots_plus_ai">Nuts & Bots + AI ($333/yr)</option>
                  </select>
                </div>
                <div>
                  <Label>Purchase Amount</Label>
                  <Input
                    type="number"
                    value={newPurchase.purchaseAmount}
                    onChange={(e) => setNewPurchase({ ...newPurchase, purchaseAmount: parseFloat(e.target.value) })}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowAddPurchase(false)}>Cancel</Button>
                <Button 
                  onClick={() => addPurchaseMutation.mutate(newPurchase)}
                  disabled={!newPurchase.buyerEmail || addPurchaseMutation.isPending}
                >
                  <Check className="w-4 h-4 mr-2" /> Record Purchase
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Purchase Tracking */}
      <Card>
        <CardHeader>
          <CardTitle>AI Tool Purchase History</CardTitle>
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