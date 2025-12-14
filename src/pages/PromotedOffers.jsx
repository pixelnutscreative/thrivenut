import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Edit2, DollarSign, TrendingUp, Target, FileText } from 'lucide-react';
import { useTheme } from '../components/shared/useTheme';

export default function PromotedOffers() {
  const queryClient = useQueryClient();
  const { bgClass, primaryColor, accentColor, effectiveEmail } = useTheme();
  const [showDialog, setShowDialog] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    offer_type: 'tool',
    affiliate_link: '',
    program_signup_link: '',
    notes: ''
  });

  const { data: offers = [] } = useQuery({
    queryKey: ['promotedOffers', effectiveEmail],
    queryFn: () => base44.entities.PromotedOffer.filter({ owner: effectiveEmail }, 'name'),
    enabled: !!effectiveEmail,
  });

  const { data: salesLogs = [] } = useQuery({
    queryKey: ['salesLogs'],
    queryFn: () => base44.entities.SalesLog.list('-date'),
  });

  const { data: campaigns = [] } = useQuery({
    queryKey: ['campaigns', effectiveEmail],
    queryFn: async () => {
      const userBrands = await base44.entities.Brand.filter({ owner: effectiveEmail }, 'name');
      const brandIds = userBrands.map(b => b.id);
      if (brandIds.length === 0) return [];
      const allCampaigns = await base44.entities.PromotionCampaign.list('-created_date');
      return allCampaigns.filter(c => brandIds.includes(c.brand_id));
    },
    enabled: !!effectiveEmail,
  });

  const { data: contentCards = [] } = useQuery({
    queryKey: ['contentCards', effectiveEmail],
    queryFn: () => base44.entities.ContentCard.filter({ owner: effectiveEmail }, '-updated_date'),
    enabled: !!effectiveEmail,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.PromotedOffer.create({ ...data, owner: effectiveEmail }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotedOffers'] });
      setShowDialog(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.PromotedOffer.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotedOffers'] });
      setShowDialog(false);
      resetForm();
    },
  });

  const resetForm = () => {
    setFormData({ name: '', offer_type: 'tool', affiliate_link: '', program_signup_link: '', notes: '' });
    setEditingOffer(null);
  };

  const handleAdd = () => {
    setEditingOffer(null);
    resetForm();
    setShowDialog(true);
  };

  const handleEdit = (offer) => {
    setEditingOffer(offer);
    setFormData({
      name: offer.name,
      offer_type: offer.offer_type,
      affiliate_link: offer.affiliate_link || '',
      program_signup_link: offer.program_signup_link || '',
      notes: offer.notes || ''
    });
    setShowDialog(true);
  };

  const handleSave = () => {
    if (editingOffer) {
      updateMutation.mutate({ id: editingOffer.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const getOfferStats = (offerId) => {
    const sales = salesLogs.filter(s => s.promoted_offer_id === offerId);
    const totalRevenue = sales.reduce((sum, s) => sum + (s.sale_amount || 0), 0);
    const totalCommission = sales.reduce((sum, s) => sum + (s.commission_amount || 0), 0);
    const linkedCampaigns = campaigns.filter(c => c.primary_offer_id === offerId);
    const linkedContent = contentCards.filter(c => 
      linkedCampaigns.some(campaign => campaign.id === c.campaign_id)
    );

    return {
      salesCount: sales.length,
      totalRevenue,
      totalCommission,
      linkedCampaigns,
      linkedContent,
      hasSales: sales.length > 0,
      hasLowContent: sales.length > 0 && linkedContent.length < 3
    };
  };

  return (
    <div className={`min-h-screen ${bgClass} p-6`}>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Promoted Offers</h1>
            <p className="text-sm text-gray-600 mt-1">Manage offers and track performance</p>
          </div>
          <Button
            onClick={handleAdd}
            style={{ background: `linear-gradient(to right, ${primaryColor}, ${accentColor})` }}
            className="text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Offer
          </Button>
        </div>

        {/* Offers List */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {offers.map(offer => {
            const stats = getOfferStats(offer.id);
            return (
              <Card key={offer.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base mb-2">{offer.name}</CardTitle>
                      <Badge variant="outline">{offer.offer_type}</Badge>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(offer)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Performance Stats */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        <span className="text-xs text-green-600">Sales</span>
                      </div>
                      <p className="text-xl font-bold text-green-700">{stats.salesCount}</p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <TrendingUp className="w-4 h-4 text-blue-600" />
                        <span className="text-xs text-blue-600">Revenue</span>
                      </div>
                      <p className="text-xl font-bold text-blue-700">${stats.totalRevenue.toFixed(0)}</p>
                    </div>
                  </div>

                  {stats.totalCommission > 0 && (
                    <div className="p-2 bg-purple-50 rounded text-center">
                      <p className="text-xs text-purple-600">Commission</p>
                      <p className="text-lg font-bold text-purple-700">${stats.totalCommission.toFixed(2)}</p>
                    </div>
                  )}

                  {/* Linked Items */}
                  <div className="pt-2 border-t space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Campaigns</span>
                      <Badge variant="secondary">{stats.linkedCampaigns.length}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Content Cards</span>
                      <Badge variant="secondary">{stats.linkedContent.length}</Badge>
                    </div>
                  </div>

                  {/* Awareness Indicators */}
                  {stats.hasSales && (
                    <Badge className="w-full justify-center bg-green-100 text-green-700">
                      💰 Has Sales
                    </Badge>
                  )}
                  {stats.hasLowContent && (
                    <Badge variant="destructive" className="w-full justify-center">
                      ⚠️ Low Content Volume
                    </Badge>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {offers.length === 0 && (
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg font-medium mb-2">No Offers Yet</p>
              <p className="text-sm text-gray-500 mb-4">Create your first promoted offer to start tracking</p>
              <Button onClick={handleAdd}>
                <Plus className="w-4 h-4 mr-2" />
                Add Offer
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Add/Edit Dialog */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingOffer ? 'Edit Offer' : 'Add Offer'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label>Offer Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g., Canva Pro Affiliate"
                />
              </div>

              <div>
                <Label>Offer Type *</Label>
                <Select value={formData.offer_type} onValueChange={(val) => setFormData({...formData, offer_type: val})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tool">Tool</SelectItem>
                    <SelectItem value="affiliate">Affiliate</SelectItem>
                    <SelectItem value="product">Product</SelectItem>
                    <SelectItem value="mlm">MLM</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Affiliate Link</Label>
                <Input
                  value={formData.affiliate_link}
                  onChange={(e) => setFormData({...formData, affiliate_link: e.target.value})}
                  placeholder="https://..."
                />
              </div>

              <div>
                <Label>Program Signup Link</Label>
                <Input
                  value={formData.program_signup_link}
                  onChange={(e) => setFormData({...formData, program_signup_link: e.target.value})}
                  placeholder="https://..."
                />
              </div>

              <div>
                <Label>Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows={3}
                  placeholder="Additional notes about this offer..."
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={() => setShowDialog(false)} variant="outline" className="flex-1">
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={!formData.name || !formData.offer_type}
                  className="flex-1"
                >
                  {editingOffer ? 'Update' : 'Create'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}