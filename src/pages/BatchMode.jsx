import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Filter, ExternalLink, AlertCircle } from 'lucide-react';
import { useTheme } from '../components/shared/useTheme';
import BatchCardItem from '../components/promotion/BatchCardItem';

export default function BatchMode() {
  const queryClient = useQueryClient();
  const { bgClass, primaryColor, accentColor, effectiveEmail } = useTheme();
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [selectedCampaign, setSelectedCampaign] = useState('all');
  const [selectedWorkflowStep, setSelectedWorkflowStep] = useState('');
  const [filterMissingAssets, setFilterMissingAssets] = useState(false);
  const [filterMissingCaptions, setFilterMissingCaptions] = useState(false);
  const [filterIncompleteMVP, setFilterIncompleteMVP] = useState(false);

  const { data: brands = [] } = useQuery({
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
      const allCampaigns = await base44.entities.PromotionCampaign.list('-created_date');
      return allCampaigns.filter(c => brandIds.includes(c.brand_id));
    },
    enabled: !!effectiveEmail,
  });

  const { data: workflowSteps = [] } = useQuery({
    queryKey: ['workflowSteps'],
    queryFn: () => base44.entities.WorkflowStep.list('order'),
  });

  const { data: contentCards = [] } = useQuery({
    queryKey: ['contentCards', effectiveEmail],
    queryFn: () => base44.entities.ContentCard.filter({ owner: effectiveEmail }, '-updated_date'),
    enabled: !!effectiveEmail,
  });

  const { data: assets = [] } = useQuery({
    queryKey: ['assetLinks'],
    queryFn: () => base44.entities.AssetLink.list(),
  });

  const { data: platformOutputs = [] } = useQuery({
    queryKey: ['platformOutputs'],
    queryFn: () => base44.entities.ContentPlatformOutput.list(),
  });

  const filteredCampaigns = campaigns.filter(c => 
    selectedBrand === 'all' || c.brand_id === selectedBrand
  );

  const filteredCards = contentCards.filter(card => {
    // Workflow step filter (required)
    if (!selectedWorkflowStep || card.current_workflow_step_id !== selectedWorkflowStep) return false;

    // Brand filter
    if (selectedBrand !== 'all' && card.brand_id !== selectedBrand) return false;

    // Campaign filter
    if (selectedCampaign !== 'all' && card.campaign_id !== selectedCampaign) return false;

    // Missing assets filter
    if (filterMissingAssets) {
      const cardAssets = assets.filter(a => a.content_card_id === card.id);
      if (cardAssets.length > 0) return false;
    }

    // Missing captions filter
    if (filterMissingCaptions) {
      const cardOutputs = platformOutputs.filter(o => o.content_card_id === card.id);
      const hasCaptions = cardOutputs.some(o => o.caption_or_copy?.trim());
      if (hasCaptions) return false;
    }

    return true;
  });

  const selectedStep = workflowSteps.find(s => s.id === selectedWorkflowStep);

  return (
    <div className={`min-h-screen ${bgClass} p-6`}>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Batch Mode</h1>
            <p className="text-sm text-gray-600 mt-1">Process multiple content cards by workflow step</p>
          </div>
        </div>

        {/* Selection Panel */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Batch Selection</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Brand (Optional)</label>
                <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Brands" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Brands</SelectItem>
                    {brands.map(b => (
                      <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Campaign (Optional)</label>
                <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Campaigns" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Campaigns</SelectItem>
                    {filteredCampaigns.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Workflow Step (Required) *</label>
                <Select value={selectedWorkflowStep} onValueChange={setSelectedWorkflowStep}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select step..." />
                  </SelectTrigger>
                  <SelectContent>
                    {workflowSteps.map(step => (
                      <SelectItem key={step.id} value={step.id}>
                        {step.order}. {step.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Additional Filters */}
            <div className="pt-4 border-t">
              <p className="text-sm font-medium mb-3">Additional Filters</p>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="missingAssets"
                    checked={filterMissingAssets}
                    onCheckedChange={setFilterMissingAssets}
                  />
                  <label htmlFor="missingAssets" className="text-sm cursor-pointer">
                    Missing Assets
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="missingCaptions"
                    checked={filterMissingCaptions}
                    onCheckedChange={setFilterMissingCaptions}
                  />
                  <label htmlFor="missingCaptions" className="text-sm cursor-pointer">
                    Missing Captions
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="incompleteMVP"
                    checked={filterIncompleteMVP}
                    onCheckedChange={setFilterIncompleteMVP}
                  />
                  <label htmlFor="incompleteMVP" className="text-sm cursor-pointer">
                    MVP Checklist Incomplete
                  </label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {!selectedWorkflowStep ? (
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg font-medium mb-2">Select a Workflow Step</p>
              <p className="text-sm text-gray-500">Choose a workflow step above to view content cards in batch mode</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  {selectedStep?.name}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {filteredCards.length} card{filteredCards.length !== 1 ? 's' : ''} at this step
                </p>
              </div>
            </div>

            {filteredCards.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center py-12">
                  <p className="text-gray-600">No content cards found matching your criteria</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredCards.map(card => (
                  <BatchCardItem
                    key={card.id}
                    card={card}
                    workflowStep={selectedStep}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}