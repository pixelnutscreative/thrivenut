import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, Calendar, TrendingUp, Repeat, Lightbulb } from 'lucide-react';
import { useTheme } from '../components/shared/useTheme';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { format, parseISO, differenceInDays } from 'date-fns';

export default function CampaignTimeline() {
  const navigate = useNavigate();
  const { bgClass, primaryColor, accentColor, user, effectiveEmail } = useTheme();
  const [selectedCampaign, setSelectedCampaign] = useState('');

  const isAdmin = user?.role === 'admin';

  const { data: campaigns = [] } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => base44.entities.PromotionCampaign.list('-created_date'),
  });

  const { data: contentCards = [] } = useQuery({
    queryKey: ['contentCards'],
    queryFn: () => base44.entities.ContentCard.list('-updated_date'),
  });

  const { data: platformOutputs = [] } = useQuery({
    queryKey: ['platformOutputs'],
    queryFn: () => base44.entities.ContentPlatformOutput.list(),
  });

  const { data: salesLogs = [] } = useQuery({
    queryKey: ['salesLogs'],
    queryFn: () => base44.entities.SalesLog.list('-date'),
  });

  const campaign = campaigns.find(c => c.id === selectedCampaign);
  const campaignCards = contentCards.filter(c => c.campaign_id === selectedCampaign);

  // Timeline Phase Logic
  const getCardPhase = (card) => {
    const cardOutputs = platformOutputs.filter(o => o.content_card_id === card.id);
    const earliestSchedule = cardOutputs
      .filter(o => o.schedule_datetime)
      .map(o => new Date(o.schedule_datetime))
      .sort((a, b) => a - b)[0];

    if (!campaign?.start_date && !earliestSchedule) return 'pre-campaign';

    const now = new Date();
    const campaignStart = campaign?.start_date ? parseISO(campaign.start_date) : null;
    const campaignEnd = campaign?.end_date ? parseISO(campaign.end_date) : null;

    // Posted content
    if (card.status === 'posted') {
      if (card.intent === 'remind' || card.content_type === 'email') {
        return 'evergreen';
      }
      return 'post-campaign';
    }

    // Not yet scheduled
    if (!earliestSchedule) {
      return 'pre-campaign';
    }

    // Based on schedule date
    if (campaignStart && earliestSchedule < campaignStart) return 'pre-campaign';
    if (campaignEnd && earliestSchedule > campaignEnd) return 'evergreen';
    if (campaignStart && campaignEnd && earliestSchedule >= campaignStart && earliestSchedule <= campaignEnd) {
      return 'active';
    }

    return 'active';
  };

  const phases = {
    'pre-campaign': { label: 'Pre-Campaign', icon: Calendar, color: 'bg-blue-100 text-blue-700 border-blue-300' },
    'active': { label: 'Active / Launch', icon: TrendingUp, color: 'bg-green-100 text-green-700 border-green-300' },
    'post-campaign': { label: 'Post-Campaign', icon: AlertCircle, color: 'bg-purple-100 text-purple-700 border-purple-300' },
    'evergreen': { label: 'Evergreen / Follow-Up', icon: Repeat, color: 'bg-amber-100 text-amber-700 border-amber-300' }
  };

  const groupedCards = {
    'pre-campaign': campaignCards.filter(c => getCardPhase(c) === 'pre-campaign'),
    'active': campaignCards.filter(c => getCardPhase(c) === 'active'),
    'post-campaign': campaignCards.filter(c => getCardPhase(c) === 'post-campaign'),
    'evergreen': campaignCards.filter(c => getCardPhase(c) === 'evergreen')
  };

  // Smart Memory Flags
  const getSmartFlags = () => {
    if (!campaign) return [];
    const flags = [];

    // No post-campaign content
    if (groupedCards['post-campaign'].length === 0 && groupedCards['evergreen'].length === 0) {
      flags.push({
        type: 'missing_followup',
        severity: 'warning',
        message: 'No post-campaign or follow-up content planned'
      });
    }

    // Scheduled but no recap
    const hasScheduled = campaignCards.some(c => c.status === 'scheduled');
    const hasRecap = campaignCards.some(c => 
      (c.title?.toLowerCase().includes('recap') || c.title?.toLowerCase().includes('results'))
    );
    if (hasScheduled && !hasRecap) {
      flags.push({
        type: 'missing_recap',
        severity: 'info',
        message: 'Scheduled content found, but no recap content planned'
      });
    }

    // Completed without outcome notes
    if (campaign.status === 'completed' && !campaign.outcome_summary?.trim()) {
      flags.push({
        type: 'no_outcome',
        severity: 'warning',
        message: 'Campaign marked completed without outcome notes'
      });
    }

    // Content marked "worked" but not reused
    const workedContent = campaignCards.filter(c => c.outcome_result === 'worked' && !c.reuse_toggle);
    if (workedContent.length > 0) {
      flags.push({
        type: 'reuse_opportunity',
        severity: 'success',
        message: `${workedContent.length} piece${workedContent.length > 1 ? 's' : ''} of content marked as "worked" but not flagged for reuse`
      });
    }

    // Sales logged without follow-up
    const campaignSales = salesLogs.filter(s => s.campaign_id === selectedCampaign);
    const hasFollowUp = campaignCards.some(c => 
      c.intent === 'nurture' && (c.status === 'scheduled' || c.status === 'posted')
    );
    if (campaignSales.length > 0 && !hasFollowUp) {
      flags.push({
        type: 'sales_no_followup',
        severity: 'info',
        message: `${campaignSales.length} sale${campaignSales.length > 1 ? 's' : ''} logged, but no nurture content scheduled`
      });
    }

    // Evergreen content not resurfaced
    const evergreenCards = groupedCards['evergreen'];
    const staleEvergreen = evergreenCards.filter(c => {
      if (c.status !== 'posted') return false;
      const outputs = platformOutputs.filter(o => o.content_card_id === c.id);
      const lastPosted = outputs
        .filter(o => o.schedule_datetime)
        .map(o => parseISO(o.schedule_datetime))
        .sort((a, b) => b - a)[0];
      if (!lastPosted) return false;
      return differenceInDays(new Date(), lastPosted) > 60;
    });
    if (staleEvergreen.length > 0) {
      flags.push({
        type: 'stale_evergreen',
        severity: 'info',
        message: `${staleEvergreen.length} evergreen piece${staleEvergreen.length > 1 ? 's' : ''} not resurfaced in 60+ days`
      });
    }

    return flags;
  };

  const smartFlags = campaign ? getSmartFlags() : [];

  const handleCardClick = (card) => {
    navigate(createPageUrl('ContentCards') + `?edit=${card.id}`);
  };

  const flagColors = {
    warning: 'border-amber-400 bg-amber-50',
    info: 'border-blue-400 bg-blue-50',
    success: 'border-green-400 bg-green-50'
  };

  const flagIcons = {
    warning: '⚠️',
    info: 'ℹ️',
    success: '💡'
  };

  return (
    <div className={`min-h-screen ${bgClass} p-6`}>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Campaign Timeline</h1>
            <p className="text-sm text-gray-600 mt-1">Visualize content phases for your campaigns</p>
          </div>
        </div>

        {/* Campaign Selector */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium">Select Campaign</label>
              <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
                <SelectTrigger className="w-80">
                  <SelectValue placeholder="Choose a campaign..." />
                </SelectTrigger>
                <SelectContent>
                  {campaigns.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} {c.status && `(${c.status})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {!selectedCampaign ? (
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <Lightbulb className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg font-medium mb-2">Select a Campaign</p>
              <p className="text-sm text-gray-500">Choose a campaign above to view its timeline and insights</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Smart Memory Flags */}
            {smartFlags.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-purple-600" />
                    Smart Memory Insights
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {smartFlags.map((flag, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg border-2 ${flagColors[flag.severity]}`}
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-lg">{flagIcons[flag.severity]}</span>
                        <p className="text-sm font-medium">{flag.message}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Timeline Phases */}
            {Object.entries(phases).map(([phaseKey, phaseData]) => {
              const PhaseIcon = phaseData.icon;
              const cards = groupedCards[phaseKey];

              return (
                <Card key={phaseKey} className="border-2">
                  <CardHeader className={`${phaseData.color} border-b-2`}>
                    <CardTitle className="flex items-center gap-3">
                      <PhaseIcon className="w-5 h-5" />
                      {phaseData.label}
                      <Badge variant="secondary">{cards.length} card{cards.length !== 1 ? 's' : ''}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {cards.length === 0 ? (
                      <p className="text-sm text-gray-500 italic text-center py-4">
                        No content in this phase
                      </p>
                    ) : (
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {cards.map(card => {
                          const cardOutputs = platformOutputs.filter(o => o.content_card_id === card.id);
                          const hasSchedule = cardOutputs.some(o => o.schedule_datetime);
                          
                          return (
                            <div
                              key={card.id}
                              onClick={() => handleCardClick(card)}
                              className="p-4 border-2 border-gray-200 rounded-lg hover:border-purple-400 cursor-pointer transition-all bg-white"
                            >
                              <div className="flex items-start justify-between mb-2">
                                <h4 className="font-semibold text-sm flex-1">{card.title}</h4>
                                {card.reuse_toggle && <Badge variant="outline" className="text-xs bg-green-50">♻️ Reuse</Badge>}
                              </div>
                              <div className="flex flex-wrap gap-2 text-xs">
                                <Badge variant="secondary">{card.content_type}</Badge>
                                <Badge variant="outline">{card.intent}</Badge>
                                {card.outcome_result === 'worked' && (
                                  <Badge className="bg-green-100 text-green-700">✓ Worked</Badge>
                                )}
                                {card.edit_locked && <Badge variant="destructive">🔒</Badge>}
                              </div>
                              {hasSchedule && (
                                <div className="mt-2 text-xs text-gray-600 flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {format(parseISO(cardOutputs.find(o => o.schedule_datetime).schedule_datetime), 'MMM d')}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}

            {/* Campaign Summary */}
            {campaign && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Campaign Summary</CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-700">{campaignCards.length}</p>
                    <p className="text-xs text-blue-600">Total Cards</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-700">
                      {campaignCards.filter(c => c.status === 'posted').length}
                    </p>
                    <p className="text-xs text-green-600">Posted</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <p className="text-2xl font-bold text-purple-700">
                      {campaignCards.filter(c => c.status === 'scheduled').length}
                    </p>
                    <p className="text-xs text-purple-600">Scheduled</p>
                  </div>
                  <div className="text-center p-4 bg-amber-50 rounded-lg">
                    <p className="text-2xl font-bold text-amber-700">
                      {salesLogs.filter(s => s.campaign_id === selectedCampaign).length}
                    </p>
                    <p className="text-xs text-amber-600">Sales Logged</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}