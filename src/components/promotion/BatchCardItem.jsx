import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight, ExternalLink, CheckCircle2, Circle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../../utils';

export default function BatchCardItem({ card, workflowStep }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isExpanded, setIsExpanded] = useState(false);

  const { data: brands = [] } = useQuery({
    queryKey: ['brands'],
    queryFn: () => base44.entities.Brand.list('name'),
  });

  const { data: templates = [] } = useQuery({
    queryKey: ['checklistTemplates', workflowStep?.id],
    queryFn: async () => {
      if (!workflowStep?.id) return [];
      return await base44.entities.ChecklistTemplate.filter({ workflow_step_id: workflowStep.id });
    },
    enabled: !!workflowStep?.id,
  });

  const { data: allItems = [] } = useQuery({
    queryKey: ['checklistItems'],
    queryFn: () => base44.entities.ChecklistItem.list(),
  });

  const { data: tools = [] } = useQuery({
    queryKey: ['tools'],
    queryFn: () => base44.entities.Tool.list('name'),
  });

  const { data: assets = [] } = useQuery({
    queryKey: ['assetLinks', card.id],
    queryFn: () => base44.entities.AssetLink.filter({ content_card_id: card.id }),
    enabled: isExpanded,
  });

  const { data: platformOutputs = [] } = useQuery({
    queryKey: ['platformOutputs', card.id],
    queryFn: () => base44.entities.ContentPlatformOutput.filter({ content_card_id: card.id }),
    enabled: isExpanded,
  });

  const brand = brands.find(b => b.id === card.brand_id);

  const getRelevantTemplate = () => {
    let match = templates.find(t => t.platform === 'all' && t.content_type === card.content_type);
    if (!match) match = templates.find(t => t.platform === 'all' && t.content_type === 'all');
    return match;
  };

  const template = getRelevantTemplate();
  const checklistItems = template ? allItems.filter(item => item.checklist_template_id === template.id) : [];

  const getTool = (toolId) => tools.find(t => t.id === toolId);

  const handleOpenCard = () => {
    navigate(createPageUrl('ContentCards') + `?edit=${card.id}`);
  };

  const statusColors = {
    idea: 'bg-gray-100 text-gray-700',
    in_progress: 'bg-blue-100 text-blue-700',
    ready: 'bg-green-100 text-green-700',
    scheduled: 'bg-purple-100 text-purple-700',
    posted: 'bg-teal-100 text-teal-700'
  };

  return (
    <Card className={isExpanded ? 'border-purple-300 shadow-lg' : ''}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex-shrink-0"
            >
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </Button>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-lg">{card.title}</h3>
                <Badge variant="outline">{brand?.name}</Badge>
                <Badge className={statusColors[card.status]}>{card.status?.replace(/_/g, ' ')}</Badge>
                {card.edit_locked && <Badge variant="destructive">🔒</Badge>}
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>Type: {card.content_type}</span>
                <span>Intent: {card.intent}</span>
                {card.assigned_va && <span className="text-purple-600">VA: {card.assigned_va}</span>}
              </div>
            </div>
          </div>

          <Button size="sm" variant="outline" onClick={handleOpenCard}>
            Open Card
          </Button>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-4 pt-4 border-t space-y-4"
            >
              {/* Checklist Items */}
              <div>
                <h4 className="font-medium mb-2">Checklist for {workflowStep.name}</h4>
                {checklistItems.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">No checklist items for this step</p>
                ) : (
                  <div className="space-y-2">
                    {checklistItems.map(item => {
                      const tool = item.optional_tool_id ? getTool(item.optional_tool_id) : null;
                      return (
                        <div
                          key={item.id}
                          className={`p-3 rounded-lg border ${
                            item.required_for_mvp
                              ? 'border-red-200 bg-red-50'
                              : 'border-gray-200 bg-gray-50'
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <Circle className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="text-sm font-medium">{item.label}</p>
                              {item.required_for_mvp && (
                                <Badge variant="destructive" className="text-xs mt-1">MVP Required</Badge>
                              )}
                            </div>
                            {tool && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(tool.url, '_blank')}
                                className="text-xs h-7"
                              >
                                <ExternalLink className="w-3 h-3 mr-1" />
                                {tool.name}
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4 pt-2">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-700">{assets.length}</p>
                  <p className="text-xs text-blue-600">Assets</p>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-700">{platformOutputs.length}</p>
                  <p className="text-xs text-purple-600">Platforms</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-700">
                    {platformOutputs.filter(o => o.caption_or_copy?.trim()).length}
                  </p>
                  <p className="text-xs text-green-600">With Captions</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}