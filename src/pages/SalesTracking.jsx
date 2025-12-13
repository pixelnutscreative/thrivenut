import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, DollarSign, TrendingUp, Heart, Sparkles, FileText, Target } from 'lucide-react';
import { useTheme } from '../components/shared/useTheme';
import { format, parseISO } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function SalesTracking() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { bgClass, primaryColor, accentColor, user } = useTheme();
  const [showAddSale, setShowAddSale] = useState(false);
  const [saleData, setSaleData] = useState({
    promoted_offer_id: '',
    campaign_id: '',
    brand_id: '',
    date: new Date().toISOString().split('T')[0],
    sale_amount: '',
    commission_amount: '',
    buyer_name_or_handle: '',
    source_platform: ''
  });

  const isAdmin = user?.role === 'admin';

  const { data: salesLogs = [] } = useQuery({
    queryKey: ['salesLogs'],
    queryFn: () => base44.entities.SalesLog.list('-date'),
  });

  const { data: promotedOffers = [] } = useQuery({
    queryKey: ['promotedOffers'],
    queryFn: () => base44.entities.PromotedOffer.list('name'),
  });

  const { data: campaigns = [] } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => base44.entities.PromotionCampaign.list('-created_date'),
  });

  const { data: brands = [] } = useQuery({
    queryKey: ['brands'],
    queryFn: () => base44.entities.Brand.list('name'),
  });

  const { data: contentCards = [] } = useQuery({
    queryKey: ['contentCards'],
    queryFn: () => base44.entities.ContentCard.list('-updated_date'),
  });

  const createSaleMutation = useMutation({
    mutationFn: (data) => base44.entities.SalesLog.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salesLogs'] });
      setShowAddSale(false);
      resetForm();
    },
  });

  const createContentMutation = useMutation({
    mutationFn: (data) => base44.entities.ContentCard.create(data),
    onSuccess: (newCard) => {
      queryClient.invalidateQueries({ queryKey: ['contentCards'] });
      navigate(createPageUrl('ContentCards') + `?edit=${newCard.id}`);
    },
  });

  const resetForm = () => {
    setSaleData({
      promoted_offer_id: '',
      campaign_id: '',
      brand_id: '',
      date: new Date().toISOString().split('T')[0],
      sale_amount: '',
      commission_amount: '',
      buyer_name_or_handle: '',
      source_platform: ''
    });
  };

  const handleAddSale = () => {
    createSaleMutation.mutate({
      ...saleData,
      sale_amount: parseFloat(saleData.sale_amount),
      commission_amount: saleData.commission_amount ? parseFloat(saleData.commission_amount) : undefined
    });
  };

  const handleCreateContent = (sale, contentType) => {
    const offer = promotedOffers.find(o => o.id === sale.promoted_offer_id);
    const campaign = campaigns.find(c => c.id === sale.campaign_id);
    
    const contentTypeMap = {
      thank_you: {
        title: `Thank You - ${offer?.name || 'Sale'}`,
        intent: 'nurture',
        content_type: 'post',
        icon: '💝'
      },
      spotlight: {
        title: `Customer Spotlight - ${sale.buyer_name_or_handle || 'Recent Sale'}`,
        intent: 'authority',
        content_type: 'post',
        icon: '✨'
      },
      case_study: {
        title: `Case Study - ${offer?.name || 'Sale'}`,
        intent: 'sell',
        content_type: 'post',
        icon: '📊'
      }
    };

    const template = contentTypeMap[contentType];
    const notes = `Generated from sale on ${format(parseISO(sale.date), 'MMM d, yyyy')}${sale.buyer_name_or_handle ? `\nBuyer: ${sale.buyer_name_or_handle}` : ''}\nProduct: ${offer?.name || 'N/A'}\nSale Amount: $${sale.sale_amount}`;

    createContentMutation.mutate({
      title: template.title,
      brand_id: sale.brand_id,
      campaign_id: sale.campaign_id,
      content_type: template.content_type,
      intent: template.intent,
      status: 'idea',
      owner: user.email,
      notes
    });
  };

  const getOfferName = (offerId) => {
    const offer = promotedOffers.find(o => o.id === offerId);
    return offer?.name || 'Unknown Offer';
  };

  const getCampaignName = (campaignId) => {
    const campaign = campaigns.find(c => c.id === campaignId);
    return campaign?.name || '';
  };

  const hasFollowUpContent = (sale) => {
    return contentCards.some(card => 
      card.campaign_id === sale.campaign_id &&
      ['nurture', 'authority'].includes(card.intent) &&
      ['scheduled', 'posted'].includes(card.status)
    );
  };

  const totalRevenue = salesLogs.reduce((sum, s) => sum + (s.sale_amount || 0), 0);
  const totalCommission = salesLogs.reduce((sum, s) => sum + (s.commission_amount || 0), 0);

  return (
    <div className={`min-h-screen ${bgClass} p-6`}>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Sales Tracking</h1>
            <p className="text-sm text-gray-600 mt-1">Log sales and create follow-up content</p>
          </div>
          <Button
            onClick={() => setShowAddSale(true)}
            style={{ background: `linear-gradient(to right, ${primaryColor}, ${accentColor})` }}
            className="text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Log Sale
          </Button>
        </div>

        {/* Summary Stats */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Sales</p>
                  <p className="text-2xl font-bold">{salesLogs.length}</p>
                </div>
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold">${totalRevenue.toFixed(2)}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Commission</p>
                  <p className="text-2xl font-bold">${totalCommission.toFixed(2)}</p>
                </div>
                <Target className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sales List */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Sales</CardTitle>
          </CardHeader>
          <CardContent>
            {salesLogs.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No sales logged yet</p>
            ) : (
              <div className="space-y-4">
                {salesLogs.map(sale => {
                  const needsFollowUp = !hasFollowUpContent(sale);
                  return (
                    <div key={sale.id} className="p-4 border rounded-lg bg-white">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{getOfferName(sale.promoted_offer_id)}</h3>
                            {sale.campaign_id && (
                              <Badge variant="outline" className="text-xs">
                                {getCampaignName(sale.campaign_id)}
                              </Badge>
                            )}
                            {needsFollowUp && (
                              <Badge variant="destructive" className="text-xs">
                                ⚠️ No Follow-Up
                              </Badge>
                            )}
                          </div>
                          <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-600">
                            <div>
                              <span className="font-medium">Date:</span> {format(parseISO(sale.date), 'MMM d, yyyy')}
                            </div>
                            <div>
                              <span className="font-medium">Amount:</span> ${sale.sale_amount}
                              {sale.commission_amount && <span className="text-green-600 ml-2">(${sale.commission_amount} commission)</span>}
                            </div>
                            {sale.buyer_name_or_handle && (
                              <div>
                                <span className="font-medium">Buyer:</span> {sale.buyer_name_or_handle}
                              </div>
                            )}
                          </div>
                        </div>

                        {isAdmin && (
                          <div className="flex gap-2 ml-4">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCreateContent(sale, 'thank_you')}
                              title="Create Thank You Content"
                            >
                              <Heart className="w-4 h-4 text-pink-600" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCreateContent(sale, 'spotlight')}
                              title="Create Spotlight Content"
                            >
                              <Sparkles className="w-4 h-4 text-purple-600" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCreateContent(sale, 'case_study')}
                              title="Create Case Study Content"
                            >
                              <FileText className="w-4 h-4 text-blue-600" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add Sale Dialog */}
        <Dialog open={showAddSale} onOpenChange={setShowAddSale}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Log New Sale</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label>Promoted Offer *</Label>
                <Select value={saleData.promoted_offer_id} onValueChange={(val) => setSaleData({...saleData, promoted_offer_id: val})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select offer..." />
                  </SelectTrigger>
                  <SelectContent>
                    {promotedOffers.map(offer => (
                      <SelectItem key={offer.id} value={offer.id}>{offer.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Campaign</Label>
                  <Select value={saleData.campaign_id} onValueChange={(val) => setSaleData({...saleData, campaign_id: val})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select campaign..." />
                    </SelectTrigger>
                    <SelectContent>
                      {campaigns.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Brand</Label>
                  <Select value={saleData.brand_id} onValueChange={(val) => setSaleData({...saleData, brand_id: val})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select brand..." />
                    </SelectTrigger>
                    <SelectContent>
                      {brands.map(b => (
                        <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Sale Date *</Label>
                  <Input
                    type="date"
                    value={saleData.date}
                    onChange={(e) => setSaleData({...saleData, date: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Source Platform</Label>
                  <Input
                    value={saleData.source_platform}
                    onChange={(e) => setSaleData({...saleData, source_platform: e.target.value})}
                    placeholder="TikTok, Instagram, etc."
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Sale Amount *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={saleData.sale_amount}
                    onChange={(e) => setSaleData({...saleData, sale_amount: e.target.value})}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label>Commission Amount</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={saleData.commission_amount}
                    onChange={(e) => setSaleData({...saleData, commission_amount: e.target.value})}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <Label>Buyer Name/Handle</Label>
                <Input
                  value={saleData.buyer_name_or_handle}
                  onChange={(e) => setSaleData({...saleData, buyer_name_or_handle: e.target.value})}
                  placeholder="@username or name"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={() => setShowAddSale(false)} variant="outline" className="flex-1">
                  Cancel
                </Button>
                <Button
                  onClick={handleAddSale}
                  disabled={!saleData.promoted_offer_id || !saleData.date || !saleData.sale_amount}
                  className="flex-1"
                  style={{ background: `linear-gradient(to right, ${primaryColor}, ${accentColor})` }}
                >
                  Log Sale
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}