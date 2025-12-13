import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Trash2, Gift, Check, Copy } from 'lucide-react';

export default function AdminCouponQueueContent() {
  const queryClient = useQueryClient();
  const [newCoupon, setNewCoupon] = useState('');

  const { data: coupons = [], isLoading } = useQuery({
    queryKey: ['couponCodes'],
    queryFn: () => base44.entities.CouponCode.list('-created_date', 100)
  });

  const addCouponMutation = useMutation({
    mutationFn: (code) => base44.entities.CouponCode.create({
      code: code.toUpperCase(),
      status: 'available'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['couponCodes'] });
      setNewCoupon('');
    }
  });

  const deleteCouponMutation = useMutation({
    mutationFn: (id) => base44.entities.CouponCode.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['couponCodes'] })
  });

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 11; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewCoupon(code);
  };

  const available = coupons.filter(c => c.status === 'available');
  const assigned = coupons.filter(c => c.status === 'assigned');
  const used = coupons.filter(c => c.status === 'used');

  if (isLoading) {
    return <div className="flex items-center justify-center p-8"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="w-5 h-5" />
          Coupon Code Queue
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-center">
            <p className="text-2xl font-bold text-green-600">{available.length}</p>
            <p className="text-xs text-gray-600">Available</p>
          </div>
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-center">
            <p className="text-2xl font-bold text-blue-600">{assigned.length}</p>
            <p className="text-xs text-gray-600">Assigned</p>
          </div>
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-center">
            <p className="text-2xl font-bold text-gray-600">{used.length}</p>
            <p className="text-xs text-gray-600">Used</p>
          </div>
        </div>

        {/* Add Coupon */}
        <div className="p-4 bg-purple-50 border-2 border-purple-300 rounded-lg">
          <Label className="mb-2 block">Add Coupon to Queue</Label>
          <div className="flex gap-2">
            <Input
              placeholder="Paste 11-char code"
              value={newCoupon}
              onChange={(e) => setNewCoupon(e.target.value.toUpperCase())}
              maxLength={11}
              className="font-mono"
            />
            <Button 
              size="sm"
              variant="outline"
              onClick={generateRandomCode}
            >
              Generate
            </Button>
            <Button 
              onClick={() => addCouponMutation.mutate(newCoupon)}
              disabled={newCoupon.length !== 11 || addCouponMutation.isPending}
            >
              <Plus className="w-4 h-4 mr-2" /> Add
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-1">11 random characters (auto-generated codes prevent hacking)</p>
        </div>

        {/* Coupon List */}
        <div className="space-y-2">
          <h3 className="font-semibold text-sm">All Coupons</h3>
          <div className="max-h-96 overflow-y-auto space-y-2">
            {coupons.map(coupon => (
              <div key={coupon.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                <div className="flex items-center gap-3">
                  <code className="font-mono font-bold">{coupon.code}</code>
                  <Badge className={
                    coupon.status === 'available' ? 'bg-green-100 text-green-800' :
                    coupon.status === 'assigned' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }>
                    {coupon.status}
                  </Badge>
                  {coupon.assigned_to_email && (
                    <span className="text-xs text-gray-600">{coupon.assigned_to_email}</span>
                  )}
                  {coupon.credit_amount && (
                    <Badge variant="outline">${coupon.credit_amount.toFixed(2)}</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      navigator.clipboard.writeText(coupon.code);
                    }}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  {coupon.status === 'available' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteCouponMutation.mutate(coupon.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}