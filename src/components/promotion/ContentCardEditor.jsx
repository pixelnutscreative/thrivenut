import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, Lock, Unlock, CheckCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PlatformOutputTabs from './PlatformOutputTabs';
import AssetsPanel from './AssetsPanel';
import WorkflowChecklist from './WorkflowChecklist';
import ScriptDrawer from './ScriptDrawer';
import OutcomeTracker from './OutcomeTracker';
import ChangeRequestModal from './ChangeRequestModal';

export default function ContentCardEditor({ card, onClose, userEmail }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    title: '',
    brand_id: '',
    campaign_id: '',
    content_type: 'video',
    intent: 'grow',
    status: 'idea',
    current_workflow_step_id: '',
    owner: userEmail,
    assigned_va: '',
    script_approved: false,
    assets_locked: false,
    edit_locked: false,
    outcome_result: '',
    outcome_notes: '',
    reuse_toggle: false
  });
  const [scriptDrawerOpen, setScriptDrawerOpen] = useState(false);
  const [showChangeRequestModal, setShowChangeRequestModal] = useState(false);

  useEffect(() => {
    if (card) {
      setFormData(card);
    }
  }, [card]);

  const { data: brands = [] } = useQuery({
    queryKey: ['brands', userEmail],
    queryFn: () => base44.entities.Brand.filter({ owner: userEmail }, 'name'),
    enabled: !!userEmail,
  });

  const { data: campaigns = [] } = useQuery({
    queryKey: ['campaigns', userEmail],
    queryFn: async () => {
      const userBrands = await base44.entities.Brand.filter({ owner: userEmail }, 'name');
      const brandIds = userBrands.map(b => b.id);
      if (brandIds.length === 0) return [];
      const allCampaigns = await base44.entities.PromotionCampaign.list('-created_date');
      return allCampaigns.filter(c => brandIds.includes(c.brand_id));
    },
    enabled: !!userEmail,
  });

  // Auto-create default brand if none exists (should rarely trigger - onboarding handles this)
  const ensureDefaultBrand = async () => {
    if (brands.length === 0) {
      const defaultBrand = await base44.entities.Brand.create({
        name: 'My Brand',
        primary_product_service: 'My Product/Service',
        category: 'personal',
        owner: userEmail
      });
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      return defaultBrand.id;
    }
    return brands[0].id;
  };

  // Auto-select first brand when creating new card (no blockers)
  useEffect(() => {
    if (!card && brands.length > 0 && !formData.brand_id) {
      setFormData(prev => ({ ...prev, brand_id: brands[0].id }));
    }
  }, [card, brands, formData.brand_id]);

  const { data: workflowSteps = [] } = useQuery({
    queryKey: ['workflowSteps'],
    queryFn: () => base44.entities.WorkflowStep.list('order'),
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      // Ensure brand exists (campaigns are optional)
      let brandId = data.brand_id;
      if (!brandId) {
        brandId = await ensureDefaultBrand();
      }

      const finalData = { ...data, brand_id: brandId };

      if (card) {
        return await base44.entities.ContentCard.update(card.id, finalData);
      } else {
        return await base44.entities.ContentCard.create(finalData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contentCards'] });
      onClose();
    },
  });

  const handleSave = () => {
    saveMutation.mutate(formData);
  };

  const isLocked = formData.edit_locked;
  const canEdit = !isLocked; // VAs would need additional permission check

  const filteredCampaigns = campaigns.filter(c => c.brand_id === formData.brand_id);
  const currentStep = workflowSteps.find(s => s.id === formData.current_workflow_step_id) || workflowSteps[0];

  // Set default workflow step if none selected
  React.useEffect(() => {
    if (card && !formData.current_workflow_step_id && workflowSteps.length > 0) {
      setFormData(prev => ({ ...prev, current_workflow_step_id: workflowSteps[0].id }));
    }
  }, [card, workflowSteps]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-purple-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={onClose}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                {card ? 'Edit Content Card' : 'New Content Card'}
              </h1>
              {card && (
                <div className="flex items-center gap-2 mt-1">
                  {formData.script_approved && <Badge variant="outline" className="text-xs">✓ Script Approved</Badge>}
                  {formData.assets_locked && <Badge variant="outline" className="text-xs">🔒 Assets Locked</Badge>}
                  {formData.edit_locked && <Badge variant="destructive" className="text-xs">🔒 Edit Locked</Badge>}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {card && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setScriptDrawerOpen(!scriptDrawerOpen)}
              >
                {scriptDrawerOpen ? 'Close' : 'Open'} Script
              </Button>
            )}
            <Button onClick={handleSave} disabled={saveMutation.isPending || !formData.title}>
              <Save className="w-4 h-4 mr-2" />
              {saveMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>

        {/* Edit Lock Banner */}
        {isLocked && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-red-600" />
                <div>
                  <h3 className="font-semibold text-red-900">Content Locked for Editing</h3>
                  <p className="text-sm text-red-700">This content is locked. You cannot make changes directly.</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowChangeRequestModal(true)}
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                Request Change
              </Button>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Main Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Content Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Title *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Content card title..."
                    disabled={isLocked}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Brand *</Label>
                    <Select
                      value={formData.brand_id}
                      onValueChange={(v) => setFormData({ ...formData, brand_id: v, campaign_id: '' })}
                      disabled={isLocked}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select brand..." />
                      </SelectTrigger>
                      <SelectContent>
                        {brands.map(brand => (
                          <SelectItem key={brand.id} value={brand.id}>{brand.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Campaign (Optional)</Label>
                    <Select
                      value={formData.campaign_id}
                      onValueChange={(v) => setFormData({ ...formData, campaign_id: v })}
                      disabled={isLocked || !formData.brand_id}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select campaign..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={null}>None</SelectItem>
                        {filteredCampaigns.map(campaign => (
                          <SelectItem key={campaign.id} value={campaign.id}>{campaign.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Content Type *</Label>
                    <Select
                      value={formData.content_type}
                      onValueChange={(v) => setFormData({ ...formData, content_type: v })}
                      disabled={isLocked}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="video">📹 Video</SelectItem>
                        <SelectItem value="post">📱 Post</SelectItem>
                        <SelectItem value="email">📧 Email</SelectItem>
                        <SelectItem value="sms">💬 SMS</SelectItem>
                        <SelectItem value="live">🔴 Live</SelectItem>
                        <SelectItem value="blog">📝 Blog</SelectItem>
                        <SelectItem value="long_form">📄 Long Form</SelectItem>
                        <SelectItem value="carousel">🎠 Carousel</SelectItem>
                        <SelectItem value="story">📖 Story</SelectItem>
                        <SelectItem value="reel">🎬 Reel</SelectItem>
                        <SelectItem value="promo">🎁 Promo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Intent *</Label>
                    <Select
                      value={formData.intent}
                      onValueChange={(v) => setFormData({ ...formData, intent: v })}
                      disabled={isLocked}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="grow">Grow</SelectItem>
                        <SelectItem value="sell">Sell</SelectItem>
                        <SelectItem value="remind">Remind</SelectItem>
                        <SelectItem value="nurture">Nurture</SelectItem>
                        <SelectItem value="authority">Authority</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(v) => setFormData({ ...formData, status: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="idea">Idea</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="ready">Ready</SelectItem>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="posted">Posted</SelectItem>
                        <SelectItem value="follow_up">Follow-up</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Assigned VA</Label>
                    <Input
                      value={formData.assigned_va}
                      onChange={(e) => setFormData({ ...formData, assigned_va: e.target.value })}
                      placeholder="VA email..."
                      disabled={isLocked}
                    />
                  </div>
                </div>

                {/* Workflow Step Indicator */}
                <div className="pt-4 border-t">
                  <Label>Current Workflow Step</Label>
                  <Select
                    value={formData.current_workflow_step_id}
                    onValueChange={(v) => setFormData({ ...formData, current_workflow_step_id: v })}
                    disabled={isLocked}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select workflow step..." />
                    </SelectTrigger>
                    <SelectContent>
                      {workflowSteps.map(step => (
                        <SelectItem key={step.id} value={step.id}>
                          {step.order}. {step.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    Determines which checklist items are shown
                  </p>
                </div>

                {/* Lock States */}
                <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Script Approved</Label>
                    <Switch
                      checked={formData.script_approved}
                      onCheckedChange={(checked) => setFormData({ ...formData, script_approved: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Assets Locked</Label>
                    <Switch
                      checked={formData.assets_locked}
                      onCheckedChange={(checked) => setFormData({ ...formData, assets_locked: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Edit Locked</Label>
                    <Switch
                      checked={formData.edit_locked}
                      onCheckedChange={(checked) => setFormData({ ...formData, edit_locked: checked })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Platform Outputs */}
            {card && (
              <PlatformOutputTabs
                contentCardId={card.id}
                contentType={formData.content_type}
                isLocked={isLocked}
              />
            )}

            {/* Outcome Tracking - Only show after posted */}
            {card && (formData.status === 'posted' || formData.status === 'follow_up') && (
              <OutcomeTracker
                formData={formData}
                setFormData={setFormData}
                isLocked={isLocked}
              />
            )}
          </div>

          {/* Right Column - Workflow & Assets */}
          <div className="space-y-6">
            {card && currentStep && (
              <WorkflowChecklist
                contentCardId={card.id}
                workflowStep={currentStep}
                contentType={formData.content_type}
                selectedPlatform="all"
              />
            )}

            {card && (
              <AssetsPanel
                contentCardId={card.id}
                isLocked={formData.assets_locked}
              />
            )}
          </div>
        </div>

        {/* Script Drawer */}
        {card && (
          <ScriptDrawer
            contentCardId={card.id}
            isOpen={scriptDrawerOpen}
            onClose={() => setScriptDrawerOpen(false)}
            isLocked={!formData.script_approved}
          />
        )}

        {/* Change Request Modal */}
        {card && (
          <ChangeRequestModal
            contentCardId={card.id}
            isOpen={showChangeRequestModal}
            onClose={() => setShowChangeRequestModal(false)}
            userEmail={userEmail}
          />
        )}
      </div>
    </div>
  );
}