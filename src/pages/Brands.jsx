import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Sparkles, Building2, Target, Users } from 'lucide-react';
import { useTheme } from '../components/shared/useTheme';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function BrandsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { bgClass, primaryColor, accentColor, effectiveEmail } = useTheme();
  
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    primary_product_service: '',
    category: 'personal',
    description: '',
    positioning_statement: '',
    target_audience: '',
    brand_voice: '',
    owner: effectiveEmail
  });

  const { data: brands = [], isLoading } = useQuery({
    queryKey: ['brands', effectiveEmail],
    queryFn: () => base44.entities.Brand.filter({ owner: effectiveEmail }, 'name'),
    enabled: !!effectiveEmail,
  });

  const { data: campaigns = [] } = useQuery({
    queryKey: ['campaigns', effectiveEmail],
    queryFn: async () => {
      const userBrands = await base44.entities.Brand.filter({ owner: effectiveEmail }, 'name');
      const brandIds = userBrands.map(b => b.id);
      if (brandIds.length === 0) return [];
      const allCampaigns = await base44.entities.PromotionCampaign.list();
      return allCampaigns.filter(c => brandIds.includes(c.brand_id));
    },
    enabled: !!effectiveEmail,
  });

  const { data: contentCards = [] } = useQuery({
    queryKey: ['contentCards', effectiveEmail],
    queryFn: () => base44.entities.ContentCard.filter({ owner: effectiveEmail }),
    enabled: !!effectiveEmail,
  });

  const createBrandMutation = useMutation({
    mutationFn: (data) => base44.entities.Brand.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      setShowCreateDialog(false);
      resetForm();
    },
  });

  const updateBrandMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Brand.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      setEditingBrand(null);
      resetForm();
    },
  });

  const deleteBrandMutation = useMutation({
    mutationFn: (id) => base44.entities.Brand.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      primary_product_service: '',
      category: 'personal',
      description: '',
      positioning_statement: '',
      target_audience: '',
      brand_voice: '',
      owner: effectiveEmail
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingBrand) {
      updateBrandMutation.mutate({ id: editingBrand.id, data: formData });
    } else {
      createBrandMutation.mutate(formData);
    }
  };

  const handleEdit = (brand) => {
    setEditingBrand(brand);
    setFormData({
      name: brand.name || '',
      primary_product_service: brand.primary_product_service || '',
      category: brand.category || 'personal',
      description: brand.description || '',
      positioning_statement: brand.positioning_statement || '',
      target_audience: brand.target_audience || '',
      brand_voice: brand.brand_voice || '',
      owner: brand.owner || effectiveEmail
    });
  };

  const handleDelete = (brandId) => {
    const brandCampaigns = campaigns.filter(c => c.brand_id === brandId);
    const brandCards = contentCards.filter(c => c.brand_id === brandId);
    
    if (brandCampaigns.length > 0 || brandCards.length > 0) {
      if (!confirm(`This brand has ${brandCampaigns.length} campaigns and ${brandCards.length} content cards. Delete anyway?`)) {
        return;
      }
    }
    
    deleteBrandMutation.mutate(brandId);
  };

  const getBrandStats = (brandId) => {
    const brandCampaigns = campaigns.filter(c => c.brand_id === brandId);
    const brandCards = contentCards.filter(c => c.brand_id === brandId);
    return { campaigns: brandCampaigns.length, cards: brandCards.length };
  };

  const categoryColors = {
    personal: 'bg-purple-100 text-purple-700',
    business: 'bg-blue-100 text-blue-700',
    client: 'bg-green-100 text-green-700',
    nonprofit: 'bg-pink-100 text-pink-700',
    creator: 'bg-orange-100 text-orange-700'
  };

  const BrandForm = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Brand Name *</Label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Pixel's Toolbox, My Coaching Brand"
          required
        />
        <p className="text-xs text-gray-500 mt-1">Your company or content brand name</p>
      </div>

      <div>
        <Label>Primary Product / Service</Label>
        <Input
          value={formData.primary_product_service || ''}
          onChange={(e) => setFormData({ ...formData, primary_product_service: e.target.value })}
          placeholder="e.g., AI Tools Subscription, Business Coaching, Discord Workshop"
        />
        <p className="text-xs text-gray-500 mt-1">What you're selling or promoting under this brand</p>
      </div>

      <div>
        <Label>Category</Label>
        <Select value={formData.category} onValueChange={(val) => setFormData({ ...formData, category: val })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="personal">Personal / Content Creator</SelectItem>
            <SelectItem value="business">Business / Company</SelectItem>
            <SelectItem value="client">Client Brand</SelectItem>
            <SelectItem value="nonprofit">Nonprofit / Ministry</SelectItem>
            <SelectItem value="creator">Side Project / Creator Brand</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Description</Label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="What does this brand do?"
          rows={3}
        />
      </div>

      <div>
        <Label>Positioning Statement (Optional)</Label>
        <Textarea
          value={formData.positioning_statement}
          onChange={(e) => setFormData({ ...formData, positioning_statement: e.target.value })}
          placeholder="We help [target audience] [solve problem] by [unique solution]..."
          rows={2}
        />
      </div>

      <div>
        <Label>Target Audience (Optional)</Label>
        <Input
          value={formData.target_audience}
          onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
          placeholder="Busy moms, small business owners, content creators..."
        />
      </div>

      <div>
        <Label>Brand Voice (Optional)</Label>
        <Input
          value={formData.brand_voice}
          onChange={(e) => setFormData({ ...formData, brand_voice: e.target.value })}
          placeholder="Fun & casual, professional & polished, empowering & supportive..."
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setShowCreateDialog(false);
            setEditingBrand(null);
            resetForm();
          }}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={createBrandMutation.isPending || updateBrandMutation.isPending}
          style={{ background: `linear-gradient(to right, ${primaryColor}, ${accentColor})` }}
          className="text-white"
        >
          {editingBrand ? 'Update Brand' : 'Create Brand'}
        </Button>
      </div>
    </form>
  );

  if (isLoading) {
    return (
      <div className={`min-h-screen ${bgClass} p-6 flex items-center justify-center`}>
        <p className="text-gray-600">Loading brands...</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${bgClass} p-6`}>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Brands</h1>
            <p className="text-gray-600">Manage your brands, businesses, and client accounts</p>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button
                style={{ background: `linear-gradient(to right, ${primaryColor}, ${accentColor})` }}
                className="text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Brand
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Create New Brand
                </DialogTitle>
              </DialogHeader>
              <BrandForm />
            </DialogContent>
          </Dialog>
        </div>

        {brands.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-semibold text-gray-800 mb-2">No brands yet</p>
              <p className="text-sm text-gray-600 mb-6">
                Create your first brand to organize campaigns and content
              </p>
              <Button
                onClick={() => setShowCreateDialog(true)}
                style={{ background: `linear-gradient(to right, ${primaryColor}, ${accentColor})` }}
                className="text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Brand
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {brands.map((brand) => {
              const stats = getBrandStats(brand.id);
              return (
                <Card key={brand.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Building2 className="w-5 h-5 text-gray-600" />
                          <CardTitle className="text-lg">{brand.name}</CardTitle>
                        </div>
                        <Badge className={categoryColors[brand.category] || 'bg-gray-100 text-gray-700'}>
                          {brand.category}
                        </Badge>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(brand)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(brand.id)}
                          className="text-red-400 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {brand.primary_product_service && (
                     <div className="flex items-start gap-2 mb-2">
                       <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                         {brand.primary_product_service}
                       </Badge>
                     </div>
                    )}

                    {brand.description && (
                     <p className="text-sm text-gray-600 line-clamp-2">{brand.description}</p>
                    )}

                    {brand.target_audience && (
                      <div className="flex items-start gap-2 text-xs">
                        <Users className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-600 line-clamp-1">{brand.target_audience}</span>
                      </div>
                    )}

                    {brand.positioning_statement && (
                      <div className="flex items-start gap-2 text-xs">
                        <Target className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-600 line-clamp-2">{brand.positioning_statement}</span>
                      </div>
                    )}

                    <div className="flex gap-4 pt-3 border-t">
                      <div className="text-center">
                        <p className="text-lg font-semibold text-gray-800">{stats.campaigns}</p>
                        <p className="text-xs text-gray-500">Campaigns</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-semibold text-gray-800">{stats.cards}</p>
                        <p className="text-xs text-gray-500">Content Cards</p>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={() => navigate(createPageUrl('CampaignTimeline') + `?brand=${brand.id}`)}
                    >
                      View Campaigns
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={!!editingBrand} onOpenChange={() => { setEditingBrand(null); resetForm(); }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit className="w-5 h-5" />
                Edit Brand
              </DialogTitle>
            </DialogHeader>
            <BrandForm />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}