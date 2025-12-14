import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Filter } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ContentCardEditor from '../components/promotion/ContentCardEditor';
import { useTheme } from '../components/shared/useTheme';
import { useLocation } from 'react-router-dom';

export default function ContentCards() {
  const queryClient = useQueryClient();
  const location = useLocation();
  const { user, effectiveEmail, bgClass, primaryColor, accentColor } = useTheme();
  const [selectedCard, setSelectedCard] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  // Default filters to show ALL content
  const [filterBrand, setFilterBrand] = useState('all');
  const [filterCampaign, setFilterCampaign] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const { data: contentCards = [] } = useQuery({
    queryKey: ['contentCards'],
    queryFn: () => base44.entities.ContentCard.list('-updated_date'),
  });

  const { data: brands = [] } = useQuery({
    queryKey: ['brands'],
    queryFn: () => base44.entities.Brand.list('name'),
  });

  const { data: campaigns = [] } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => base44.entities.PromotionCampaign.list('-created_date'),
  });

  const handleNewCard = () => {
    setSelectedCard(null);
    setShowEditor(true);
  };

  const handleEditCard = (card) => {
    setSelectedCard(card);
    setShowEditor(true);
  };

  const handleCloseEditor = () => {
    setShowEditor(false);
    setSelectedCard(null);
  };

  // Check URL for edit parameter
  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    const editId = params.get('edit');
    if (editId && contentCards.length > 0) {
      const card = contentCards.find(c => c.id === editId);
      if (card) {
        handleEditCard(card);
      }
    }
  }, [location.search, contentCards]);

  const getBrandName = (brandId) => {
    const brand = brands.find(b => b.id === brandId);
    return brand?.name || 'Unknown';
  };

  const getCampaignName = (campaignId) => {
    const campaign = campaigns.find(c => c.id === campaignId);
    return campaign?.name || '';
  };

  const filteredCards = contentCards.filter(card => {
    if (filterBrand !== 'all' && card.brand_id !== filterBrand) return false;
    if (filterCampaign !== 'all' && card.campaign_id !== filterCampaign) return false;
    if (filterStatus !== 'all' && card.status !== filterStatus) return false;
    return true;
  });

  const statusColors = {
    idea: 'bg-gray-100 text-gray-800',
    in_progress: 'bg-blue-100 text-blue-800',
    ready: 'bg-green-100 text-green-800',
    scheduled: 'bg-purple-100 text-purple-800',
    posted: 'bg-teal-100 text-teal-800',
    follow_up: 'bg-amber-100 text-amber-800'
  };

  if (showEditor) {
    return (
      <ContentCardEditor
        card={selectedCard}
        onClose={handleCloseEditor}
        userEmail={effectiveEmail}
      />
    );
  }

  return (
    <div className={`min-h-screen ${bgClass} p-6`}>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Content Cards</h1>
            <p className="text-sm text-gray-600 mt-1">Manage promotional content creation</p>
          </div>
          <Button
            onClick={handleNewCard}
            style={{ background: `linear-gradient(to right, ${primaryColor}, ${accentColor})` }}
            className="text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Content Card
          </Button>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Filter className="w-4 h-4 text-gray-500" />
              <Select value={filterBrand} onValueChange={setFilterBrand}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Brands" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Brands</SelectItem>
                  {brands.map(brand => (
                    <SelectItem key={brand.id} value={brand.id}>{brand.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterCampaign} onValueChange={setFilterCampaign}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Campaigns" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Campaigns</SelectItem>
                  {campaigns.map(campaign => (
                    <SelectItem key={campaign.id} value={campaign.id}>{campaign.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="idea">Idea</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="ready">Ready</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="posted">Posted</SelectItem>
                  <SelectItem value="follow_up">Follow-up</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCards.map(card => (
            <Card key={card.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleEditCard(card)}>
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="truncate">{card.title}</span>
                  {card.edit_locked && <Badge variant="destructive" className="text-xs">🔒</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{getBrandName(card.brand_id)}</Badge>
                  <Badge className={statusColors[card.status] || 'bg-gray-100'}>
                    {card.status?.replace(/_/g, ' ')}
                  </Badge>
                </div>
                {card.campaign_id && (
                  <p className="text-xs text-gray-500">📋 {getCampaignName(card.campaign_id)}</p>
                )}
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{card.content_type}</span>
                  <span className="capitalize">{card.intent}</span>
                </div>
                {card.assigned_va && (
                  <p className="text-xs text-purple-600">VA: {card.assigned_va}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredCards.length === 0 && (
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <p className="text-gray-500 mb-4">No content cards yet</p>
              <Button onClick={handleNewCard}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Card
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}