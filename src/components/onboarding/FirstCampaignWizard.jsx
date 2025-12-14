import React, { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, Sparkles, Target } from 'lucide-react';

export default function FirstCampaignWizard({ isOpen, onClose, onComplete, userEmail }) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [campaignData, setCampaignData] = useState({
    name: '',
    campaign_type: 'tool_promotion',
    goal: 'sell',
    brand_id: '',
    description: '',
    start_date: '',
    end_date: ''
  });
  const [createStarterCards, setCreateStarterCards] = useState(true);
  const [isCreatingDefaults, setIsCreatingDefaults] = useState(false);

  const { data: brands = [] } = useQuery({
    queryKey: ['brands'],
    queryFn: () => base44.entities.Brand.list('name'),
  });

  // Auto-create defaults on mount if needed
  React.useEffect(() => {
    const initDefaults = async () => {
      if (brands.length === 0) {
        // Auto-create default brand and campaign immediately
        const defaultBrand = await base44.entities.Brand.create({
          name: 'My Content',
          category: 'personal',
          owner: userEmail
        });
        
        await base44.entities.PromotionCampaign.create({
          name: 'Ideas & One-Off Content',
          campaign_type: 'general',
          goal: 'awareness',
          brand_id: defaultBrand.id,
          status: 'evergreen'
        });
        
        queryClient.invalidateQueries({ queryKey: ['brands'] });
        queryClient.invalidateQueries({ queryKey: ['campaigns'] });
        
        // Close wizard and complete
        await dismissMutation.mutateAsync();
        onComplete();
      } else if (brands.length === 1 && !campaignData.brand_id) {
        setCampaignData(prev => ({ ...prev, brand_id: brands[0].id }));
      }
    };
    
    if (isOpen && brands.length === 0) {
      initDefaults();
    }
  }, [isOpen, brands.length]);

  const createCampaignMutation = useMutation({
    mutationFn: (data) => base44.entities.PromotionCampaign.create(data),
    onSuccess: async (campaign) => {
      if (createStarterCards) {
        const starterCards = [
          { title: 'Teaser Post', content_type: 'post', intent: 'grow', status: 'idea' },
          { title: 'Launch Announcement', content_type: 'post', intent: 'sell', status: 'idea' },
          { title: 'Follow-up Email', content_type: 'email', intent: 'nurture', status: 'idea' }
        ];
        
        for (const card of starterCards) {
          await base44.entities.ContentCard.create({
            ...card,
            brand_id: campaignData.brand_id,
            campaign_id: campaign.id,
            owner: userEmail
          });
        }
      }
      
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['contentCards'] });
      onComplete();
    },
  });

  const dismissMutation = useMutation({
    mutationFn: async () => {
      const prefs = await base44.entities.UserPreferences.filter({ user_email: userEmail });
      if (prefs[0]) {
        await base44.entities.UserPreferences.update(prefs[0].id, {
          onboarding_wizard_dismissed: true
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preferences'] });
      onClose();
    },
  });

  const campaignTypes = {
    tool_promotion: { label: 'Tool Promotion', desc: 'Promote software tools and SaaS products' },
    affiliate_promotion: { label: 'Affiliate Promotion', desc: 'Promote affiliate offers' },
    product_promotion: { label: 'Product Promotion', desc: 'Promote physical or digital products' },
    workshop_course: { label: 'Workshop / Course', desc: 'Promote educational content' },
    event_live: { label: 'Event / Live', desc: 'Promote live events and webinars' }
  };

  const goals = {
    sell: { label: 'Sell', icon: '💰', desc: 'Drive direct sales' },
    register: { label: 'Register', icon: '📝', desc: 'Get signups and registrations' },
    attend: { label: 'Attend', icon: '🎯', desc: 'Drive event attendance' },
    nurture: { label: 'Nurture', icon: '🌱', desc: 'Build relationships' },
    awareness: { label: 'Awareness', icon: '📣', desc: 'Increase visibility' }
  };

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
    else handleCreate();
  };

  const handleCreate = () => {
    createCampaignMutation.mutate({
      ...campaignData,
      status: 'planning'
    });
  };

  const handleSkip = async () => {
    await dismissMutation.mutateAsync();
  };

  const canProceed = () => {
    if (step === 1) return campaignData.name && campaignData.brand_id;
    if (step === 2) return campaignData.campaign_type;
    if (step === 3) return campaignData.goal;
    return false;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            Create Your First Campaign
          </DialogTitle>
          <p className="text-sm text-gray-600">Step {step} of 3</p>
        </DialogHeader>

        <div className="pt-4 space-y-6">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <Label>Campaign Name *</Label>
                <Input
                  value={campaignData.name}
                  onChange={(e) => setCampaignData({...campaignData, name: e.target.value})}
                  placeholder="e.g., Spring Product Launch"
                />
              </div>

              <div>
                <Label>Brand *</Label>
                <Select value={campaignData.brand_id} onValueChange={(val) => setCampaignData({...campaignData, brand_id: val})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a brand..." />
                  </SelectTrigger>
                  <SelectContent>
                    {brands.map(b => (
                      <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Description (Optional)</Label>
                <Textarea
                  value={campaignData.description}
                  onChange={(e) => setCampaignData({...campaignData, description: e.target.value})}
                  rows={3}
                  placeholder="What's this campaign about?"
                />
              </div>
            </div>
          )}

          {/* Step 2: Campaign Type */}
          {step === 2 && (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 mb-4">Choose the type of campaign you're creating</p>
              {Object.entries(campaignTypes).map(([key, type]) => (
                <div
                  key={key}
                  onClick={() => setCampaignData({...campaignData, campaign_type: key})}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    campaignData.campaign_type === key
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-purple-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{type.label}</p>
                      <p className="text-sm text-gray-600">{type.desc}</p>
                    </div>
                    {campaignData.campaign_type === key && (
                      <Badge className="bg-purple-600">Selected</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Step 3: Goal & Dates */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <Label className="mb-3 block">Campaign Goal *</Label>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(goals).map(([key, goal]) => (
                    <div
                      key={key}
                      onClick={() => setCampaignData({...campaignData, goal: key})}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all text-center ${
                        campaignData.goal === key
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      <div className="text-2xl mb-1">{goal.icon}</div>
                      <p className="font-semibold text-sm">{goal.label}</p>
                      <p className="text-xs text-gray-600">{goal.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Start Date (Optional)</Label>
                  <Input
                    type="date"
                    value={campaignData.start_date}
                    onChange={(e) => setCampaignData({...campaignData, start_date: e.target.value})}
                  />
                </div>
                <div>
                  <Label>End Date (Optional)</Label>
                  <Input
                    type="date"
                    value={campaignData.end_date}
                    onChange={(e) => setCampaignData({...campaignData, end_date: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg">
                <input
                  type="checkbox"
                  id="starter-cards"
                  checked={createStarterCards}
                  onChange={(e) => setCreateStarterCards(e.target.checked)}
                  className="w-4 h-4"
                />
                <label htmlFor="starter-cards" className="text-sm cursor-pointer">
                  Create 3 starter content cards (Teaser, Launch, Follow-up)
                </label>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <Button variant="ghost" onClick={handleSkip} disabled={isCreatingDefaults}>
              {isCreatingDefaults ? 'Setting up...' : 'Skip for Now'}
            </Button>
            <div className="flex gap-2">
              {step > 1 && (
                <Button variant="outline" onClick={() => setStep(step - 1)}>
                  Back
                </Button>
              )}
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                {step < 3 ? (
                  <>
                    Next <ChevronRight className="w-4 h-4 ml-1" />
                  </>
                ) : (
                  'Create Campaign'
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}