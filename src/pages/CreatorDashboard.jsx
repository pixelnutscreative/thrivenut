import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, Calendar, Target, TrendingUp, Lightbulb, Heart, Sparkles, FileText, ExternalLink } from 'lucide-react';
import { useTheme } from '../components/shared/useTheme';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { format, parseISO, differenceInDays, isBefore } from 'date-fns';
import FirstCampaignWizard from '../components/onboarding/FirstCampaignWizard';
import BatchModeSuggestion from '../components/onboarding/BatchModeSuggestion';

export default function CreatorDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { bgClass, primaryColor, accentColor, user, effectiveEmail, preferences } = useTheme();
  const [showWizard, setShowWizard] = useState(false);

  const isAdmin = user?.role === 'admin';

  const { data: contentCards = [] } = useQuery({
    queryKey: ['contentCards'],
    queryFn: () => base44.entities.ContentCard.list('-updated_date'),
  });

  const { data: platformOutputs = [] } = useQuery({
    queryKey: ['platformOutputs'],
    queryFn: () => base44.entities.ContentPlatformOutput.list(),
  });

  const { data: campaigns = [] } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => base44.entities.PromotionCampaign.list('-created_date'),
  });

  const { data: workflowSteps = [] } = useQuery({
    queryKey: ['workflowSteps'],
    queryFn: () => base44.entities.WorkflowStep.list('order'),
  });

  const { data: checklistItems = [] } = useQuery({
    queryKey: ['checklistItems'],
    queryFn: () => base44.entities.ChecklistItem.list(),
  });

  const { data: salesLogs = [] } = useQuery({
    queryKey: ['salesLogs'],
    queryFn: () => base44.entities.SalesLog.list('-date'),
  });

  const { data: promotedOffers = [] } = useQuery({
    queryKey: ['promotedOffers'],
    queryFn: () => base44.entities.PromotedOffer.list('name'),
  });

  const { data: brands = [] } = useQuery({
    queryKey: ['brands'],
    queryFn: () => base44.entities.Brand.list('name'),
  });

  // TODAY'S FOCUS
  const getOverdueOutputs = () => {
    const now = new Date();
    return platformOutputs.filter(output => {
      const card = contentCards.find(c => c.id === output.content_card_id);
      if (!card || card.status === 'posted') return false;
      const scheduleDate = output.schedule_datetime ? parseISO(output.schedule_datetime) : null;
      return scheduleDate && isBefore(scheduleDate, now);
    }).slice(0, 5);
  };

  const getBatchReadyCards = () => {
    const stepGroups = {};
    contentCards.filter(c => c.status !== 'posted' && c.current_workflow_step_id).forEach(card => {
      const stepId = card.current_workflow_step_id;
      if (!stepGroups[stepId]) stepGroups[stepId] = [];
      stepGroups[stepId].push(card);
    });
    return Object.entries(stepGroups).filter(([_, cards]) => cards.length >= 3).slice(0, 3);
  };

  const getIncompleteChecklistCards = () => {
    return contentCards.filter(card => {
      const cardChecklists = checklistItems.filter(item => item.content_card_id === card.id);
      const incomplete = cardChecklists.filter(item => !item.is_completed);
      return incomplete.length > 0 && card.status !== 'posted';
    }).slice(0, 5);
  };

  // CAMPAIGN HEALTH
  const getCampaignIssues = () => {
    const issues = [];
    campaigns.forEach(campaign => {
      if (campaign.status === 'active') {
        const campaignCards = contentCards.filter(c => c.campaign_id === campaign.id);
        const scheduled = campaignCards.filter(c => c.status === 'scheduled');
        if (scheduled.length === 0) {
          issues.push({ campaign, type: 'no_scheduled', message: 'No scheduled content' });
        }
      }
      
      if (campaign.status === 'completed') {
        const campaignCards = contentCards.filter(c => c.campaign_id === campaign.id);
        const postCampaign = campaignCards.filter(c => 
          ['nurture', 'authority'].includes(c.intent) && 
          ['scheduled', 'posted'].includes(c.status)
        );
        if (postCampaign.length === 0) {
          issues.push({ campaign, type: 'no_followup', message: 'No post-campaign content' });
        }
        if (!campaign.outcome_summary?.trim()) {
          issues.push({ campaign, type: 'no_outcome', message: 'Missing outcome notes' });
        }
      }
    });
    return issues.slice(0, 5);
  };

  // MONETIZATION
  const getOfferAlerts = () => {
    const alerts = [];
    promotedOffers.forEach(offer => {
      const offerSales = salesLogs.filter(s => s.promoted_offer_id === offer.id);
      const recentSales = offerSales.filter(s => {
        const daysSince = differenceInDays(new Date(), parseISO(s.date));
        return daysSince <= 30;
      });
      
      if (recentSales.length > 0) {
        const offerCampaigns = campaigns.filter(c => c.primary_offer_id === offer.id);
        const offerContent = contentCards.filter(c => 
          offerCampaigns.some(campaign => campaign.id === c.campaign_id)
        );
        const recentContent = offerContent.filter(c => {
          const daysSince = differenceInDays(new Date(), parseISO(c.created_date));
          return daysSince <= 30;
        });
        
        if (recentContent.length === 0) {
          alerts.push({ offer, recentSales: recentSales.length, message: 'Has recent sales but no recent content' });
        }
      }
    });
    return alerts;
  };

  const getThisWeekSales = () => {
    return salesLogs.filter(s => {
      const daysSince = differenceInDays(new Date(), parseISO(s.date));
      return daysSince <= 7;
    }).slice(0, 5);
  };

  // GENTLE SUGGESTIONS
  const getReusableContent = () => {
    return contentCards.filter(c => c.outcome_result === 'worked' && !c.reuse_toggle).slice(0, 5);
  };

  const getStaleEvergreen = () => {
    return contentCards.filter(card => {
      if (card.status !== 'posted' || card.intent !== 'remind') return false;
      const outputs = platformOutputs.filter(o => o.content_card_id === card.id);
      const lastScheduled = outputs
        .filter(o => o.schedule_datetime)
        .map(o => parseISO(o.schedule_datetime))
        .sort((a, b) => b - a)[0];
      if (!lastScheduled) return false;
      return differenceInDays(new Date(), lastScheduled) > 60;
    }).slice(0, 5);
  };

  const overdueOutputs = getOverdueOutputs();
  const batchReadyGroups = getBatchReadyCards();
  const incompleteCards = getIncompleteChecklistCards();
  const campaignIssues = getCampaignIssues();
  const offerAlerts = getOfferAlerts();
  const thisWeekSales = getThisWeekSales();
  const reusableContent = getReusableContent();
  const staleEvergreen = getStaleEvergreen();

  const getBrandName = (brandId) => brands.find(b => b.id === brandId)?.name || 'Unknown';
  const getStepName = (stepId) => workflowSteps.find(s => s.id === stepId)?.name || 'Unknown Step';
  const getOfferName = (offerId) => promotedOffers.find(o => o.id === offerId)?.name || 'Unknown';

  const handleCardClick = (cardId) => navigate(createPageUrl('ContentCards') + `?edit=${cardId}`);
  const handleCampaignClick = (campaignId) => navigate(createPageUrl('CampaignTimeline') + `?campaign=${campaignId}`);
  const handleCreateContent = (sale, type) => navigate(createPageUrl('SalesTracking'));

  const hasAnyItems = overdueOutputs.length > 0 || batchReadyGroups.length > 0 || 
    incompleteCards.length > 0 || campaignIssues.length > 0 || offerAlerts.length > 0 || 
    thisWeekSales.length > 0 || reusableContent.length > 0 || staleEvergreen.length > 0;

  // Onboarding Logic
  const showCampaignWizard = campaigns.length === 0 && !preferences?.onboarding_wizard_dismissed;
  const showBatchSuggestion = batchReadyGroups.length > 0 && !preferences?.batch_mode_suggestion_dismissed;

  const dismissBatchSuggestion = useMutation({
    mutationFn: async () => {
      const prefs = await base44.entities.UserPreferences.filter({ user_email: effectiveEmail });
      if (prefs[0]) {
        await base44.entities.UserPreferences.update(prefs[0].id, {
          batch_mode_suggestion_dismissed: true
        });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['preferences'] }),
  });

  React.useEffect(() => {
    if (showCampaignWizard) {
      setShowWizard(true);
    }
  }, [showCampaignWizard]);

  return (
    <div className={`min-h-screen ${bgClass} p-6`}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Creator Command Center</h1>
          <p className="text-gray-600">What should I work on today?</p>
        </div>

        {/* Batch Mode Suggestion */}
        {showBatchSuggestion && (
          <BatchModeSuggestion
            cardCount={batchReadyGroups[0][1].length}
            stepName={getStepName(batchReadyGroups[0][0])}
            onDismiss={() => dismissBatchSuggestion.mutate()}
          />
        )}

        {!hasAnyItems ? (
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <Target className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <p className="text-lg font-semibold text-gray-800 mb-2">All Clear! 🎉</p>
              <p className="text-sm text-gray-600">No urgent items or suggestions at the moment.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* TODAY'S FOCUS */}
            {(overdueOutputs.length > 0 || batchReadyGroups.length > 0 || incompleteCards.length > 0) && (
              <Card className="border-2 border-red-200">
                <CardHeader className="bg-red-50">
                  <CardTitle className="flex items-center gap-2 text-red-900">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    Today's Focus
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  {/* Overdue Outputs */}
                  {overdueOutputs.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-sm text-gray-700 mb-2 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-red-600" />
                        Overdue Scheduled Outputs ({overdueOutputs.length})
                      </h3>
                      <div className="space-y-2">
                        {overdueOutputs.map(output => {
                          const card = contentCards.find(c => c.id === output.content_card_id);
                          return (
                            <div
                              key={output.id}
                              onClick={() => handleCardClick(output.content_card_id)}
                              className="p-3 bg-white border border-red-200 rounded-lg hover:border-red-400 cursor-pointer transition-all"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <p className="font-medium text-sm">{card?.title}</p>
                                  <p className="text-xs text-gray-600 mt-1">
                                    {output.platform} • Due {format(parseISO(output.schedule_datetime), 'MMM d, h:mm a')}
                                  </p>
                                </div>
                                <Badge variant="destructive" className="text-xs">Overdue</Badge>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Batch Ready */}
                  {batchReadyGroups.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-sm text-gray-700 mb-2 flex items-center gap-2">
                        <Target className="w-4 h-4 text-purple-600" />
                        Batch-Ready Content
                      </h3>
                      <div className="space-y-2">
                        {batchReadyGroups.map(([stepId, cards]) => (
                          <div
                            key={stepId}
                            onClick={() => navigate(createPageUrl('BatchMode'))}
                            className="p-3 bg-white border border-purple-200 rounded-lg hover:border-purple-400 cursor-pointer transition-all"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-sm">{getStepName(stepId)}</p>
                                <p className="text-xs text-gray-600">{cards.length} cards ready for batch processing</p>
                              </div>
                              <Badge variant="secondary">{cards.length} cards</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Incomplete Checklists */}
                  {incompleteCards.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-sm text-gray-700 mb-2 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-600" />
                        Incomplete Checklists ({incompleteCards.length})
                      </h3>
                      <div className="space-y-2">
                        {incompleteCards.map(card => {
                          const cardChecklists = checklistItems.filter(item => item.content_card_id === card.id);
                          const incomplete = cardChecklists.filter(item => !item.is_completed).length;
                          return (
                            <div
                              key={card.id}
                              onClick={() => handleCardClick(card.id)}
                              className="p-3 bg-white border border-blue-200 rounded-lg hover:border-blue-400 cursor-pointer transition-all"
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium text-sm">{card.title}</p>
                                  <p className="text-xs text-gray-600">{incomplete} checklist items incomplete</p>
                                </div>
                                <Badge variant="outline">{getBrandName(card.brand_id)}</Badge>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* CAMPAIGN HEALTH */}
            {campaignIssues.length > 0 && (
              <Card className="border-2 border-amber-200">
                <CardHeader className="bg-amber-50">
                  <CardTitle className="flex items-center gap-2 text-amber-900">
                    <TrendingUp className="w-5 h-5 text-amber-600" />
                    Campaign Health Snapshot
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    {campaignIssues.map((issue, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleCampaignClick(issue.campaign.id)}
                        className="p-3 bg-white border border-amber-200 rounded-lg hover:border-amber-400 cursor-pointer transition-all"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{issue.campaign.name}</p>
                            <p className="text-xs text-gray-600 mt-1">{issue.message}</p>
                          </div>
                          <Badge variant="outline" className="bg-amber-50">{issue.campaign.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* MONETIZATION AWARENESS */}
            {(offerAlerts.length > 0 || thisWeekSales.length > 0) && (
              <Card className="border-2 border-green-200">
                <CardHeader className="bg-green-50">
                  <CardTitle className="flex items-center gap-2 text-green-900">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    Monetization Awareness
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  {/* Offer Alerts */}
                  {offerAlerts.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-sm text-gray-700 mb-2">Offers Needing Content</h3>
                      <div className="space-y-2">
                        {offerAlerts.map((alert, idx) => (
                          <div
                            key={idx}
                            onClick={() => navigate(createPageUrl('PromotedOffers'))}
                            className="p-3 bg-white border border-green-200 rounded-lg hover:border-green-400 cursor-pointer transition-all"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="font-medium text-sm">{alert.offer.name}</p>
                                <p className="text-xs text-gray-600 mt-1">{alert.recentSales} recent sales • {alert.message}</p>
                              </div>
                              <Badge className="bg-green-100 text-green-700">💰 Active</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* This Week's Sales */}
                  {thisWeekSales.length > 0 && isAdmin && (
                    <div>
                      <h3 className="font-semibold text-sm text-gray-700 mb-2">
                        This Week's Sales ({thisWeekSales.length})
                      </h3>
                      <div className="space-y-2">
                        {thisWeekSales.map(sale => (
                          <div
                            key={sale.id}
                            className="p-3 bg-white border border-green-200 rounded-lg"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <p className="font-medium text-sm">{getOfferName(sale.promoted_offer_id)}</p>
                                <p className="text-xs text-gray-600">${sale.sale_amount} • {format(parseISO(sale.date), 'MMM d')}</p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => navigate(createPageUrl('SalesTracking'))}
                                className="text-xs h-7"
                              >
                                <Heart className="w-3 h-3 mr-1" />
                                Thank You
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => navigate(createPageUrl('SalesTracking'))}
                                className="text-xs h-7"
                              >
                                <Sparkles className="w-3 h-3 mr-1" />
                                Spotlight
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => navigate(createPageUrl('SalesTracking'))}
                                className="text-xs h-7"
                              >
                                <FileText className="w-3 h-3 mr-1" />
                                Case Study
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* GENTLE SUGGESTIONS */}
            {(reusableContent.length > 0 || staleEvergreen.length > 0) && (
              <Card className="border-2 border-purple-200">
                <CardHeader className="bg-purple-50">
                  <CardTitle className="flex items-center gap-2 text-purple-900">
                    <Lightbulb className="w-5 h-5 text-purple-600" />
                    Gentle Suggestions
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  {/* Reusable Content */}
                  {reusableContent.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-sm text-gray-700 mb-2">Content Worth Reusing</h3>
                      <div className="space-y-2">
                        {reusableContent.map(card => (
                          <div
                            key={card.id}
                            onClick={() => handleCardClick(card.id)}
                            className="p-3 bg-white border border-purple-200 rounded-lg hover:border-purple-400 cursor-pointer transition-all"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-sm">{card.title}</p>
                                <p className="text-xs text-gray-600">Marked as "worked" but not flagged for reuse</p>
                              </div>
                              <Badge className="bg-green-100 text-green-700">✓ Worked</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Stale Evergreen */}
                  {staleEvergreen.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-sm text-gray-700 mb-2">Evergreen Content to Resurface</h3>
                      <div className="space-y-2">
                        {staleEvergreen.map(card => (
                          <div
                            key={card.id}
                            onClick={() => handleCardClick(card.id)}
                            className="p-3 bg-white border border-purple-200 rounded-lg hover:border-purple-400 cursor-pointer transition-all"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-sm">{card.title}</p>
                                <p className="text-xs text-gray-600">Not shared in 60+ days</p>
                              </div>
                              <Badge variant="outline">Evergreen</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* First Campaign Wizard */}
        <FirstCampaignWizard
          isOpen={showWizard}
          onClose={() => setShowWizard(false)}
          onComplete={() => {
            setShowWizard(false);
            queryClient.invalidateQueries({ queryKey: ['campaigns'] });
            queryClient.invalidateQueries({ queryKey: ['contentCards'] });
          }}
          userEmail={effectiveEmail}
        />
      </div>
    </div>
  );
}