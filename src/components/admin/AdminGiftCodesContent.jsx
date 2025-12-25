import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus, Trash2, Gift, Check, Copy, Tag } from 'lucide-react';

export default function AdminGiftCodesContent() {
  const queryClient = useQueryClient();
  const [newCode, setNewCode] = useState('');
  const [description, setDescription] = useState('Christmas Gift 2025');
  const [selectedPackageId, setSelectedPackageId] = useState('all_access'); // default to logic handling

  const { data: coupons = [], isLoading: couponsLoading } = useQuery({
    queryKey: ['giftCoupons'],
    queryFn: async () => {
      // Fetch all coupons and filter/sort client side if needed, or rely on limit
      return await base44.entities.CouponCode.list('-created_date', 100);
    }
  });

  const { data: packages = [] } = useQuery({
    queryKey: ['subscriptionPackages'],
    queryFn: () => base44.entities.SubscriptionPackage.list()
  });

  const createCouponMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        code: newCode.trim().toUpperCase(),
        description: description,
        status: 'available',
        discount_type: 'full_access',
        // If specific package selected, use it. If "all_access" let backend logic handle default.
        grant_subscription_package_id: selectedPackageId === 'all_access' ? null : selectedPackageId
      };
      return await base44.entities.CouponCode.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['giftCoupons'] });
      setNewCode('');
    }
  });

  const deleteCouponMutation = useMutation({
    mutationFn: (id) => base44.entities.CouponCode.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['giftCoupons'] })
  });

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'GIFT-';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewCode(code);
  };

  if (couponsLoading) {
    return <div className="flex items-center justify-center p-8"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  }

  // Filter out referral coupons if you want to separate them visually
  // Assuming referral coupons have 'assigned_to_email' or different structure
  // But for now show all to be safe.
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="w-5 h-5 text-purple-600" />
          Gift Access Codes
        </CardTitle>
        <CardDescription>Create codes that grant full access (Thrive Nut) to users.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Create New Code */}
        <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Coupon Code</Label>
              <div className="flex gap-2">
                <Input 
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                  placeholder="e.g. MERRY-XMAS"
                  className="font-mono uppercase"
                />
                <Button variant="outline" onClick={generateRandomCode} size="icon" title="Generate Random">
                  <Sparkles className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Description</Label>
              <Input 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Christmas Gift"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Grant Access To:</Label>
              <Select value={selectedPackageId} onValueChange={setSelectedPackageId}>
                <SelectTrigger className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_access">✨ Thrive Nut (Full Access Default)</SelectItem>
                  {packages.map(pkg => (
                    <SelectItem key={pkg.id} value={pkg.id}>{pkg.name} ({pkg.interval})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button 
            onClick={() => createCouponMutation.mutate()}
            disabled={!newCode || createCouponMutation.isPending}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            {createCouponMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
            Create Gift Code
          </Button>
        </div>

        {/* List */}
        <div className="space-y-3">
          <h3 className="font-medium text-sm text-gray-500">Active Codes</h3>
          {coupons.length === 0 ? (
            <p className="text-center text-gray-400 py-4">No coupons found.</p>
          ) : (
            <div className="space-y-2">
              {coupons.map(coupon => (
                <div key={coupon.id} className="flex items-center justify-between p-3 bg-white border rounded-lg shadow-sm">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <code className="bg-gray-100 px-2 py-1 rounded font-bold text-purple-700">{coupon.code}</code>
                      <Badge variant={coupon.status === 'redeemed' ? 'secondary' : 'default'} className={
                        coupon.status === 'available' ? 'bg-green-100 text-green-800' : 
                        coupon.status === 'redeemed' ? 'bg-gray-100 text-gray-500' : ''
                      }>
                        {coupon.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-500 flex items-center gap-2">
                      <span>{coupon.description || 'No description'}</span>
                      {coupon.redeemed_by_email && (
                        <span className="text-blue-600">• Redeemed by: {coupon.redeemed_by_email}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button size="icon" variant="ghost" onClick={() => navigator.clipboard.writeText(coupon.code)}>
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => deleteCouponMutation.mutate(coupon.id)}>
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function Sparkles({ className }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    </svg>
  );
}