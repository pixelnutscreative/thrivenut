import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, CheckCircle2, Circle } from 'lucide-react';

export default function WorkflowChecklist({ contentCardId, workflowStep, contentType, selectedPlatform }) {
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

  const getRelevantTemplate = () => {
    // Find most specific match: exact platform + content type > platform + all > all + content type > all + all
    let match = templates.find(t => t.platform === selectedPlatform && t.content_type === contentType);
    if (!match) match = templates.find(t => t.platform === selectedPlatform && t.content_type === 'all');
    if (!match) match = templates.find(t => t.platform === 'all' && t.content_type === contentType);
    if (!match) match = templates.find(t => t.platform === 'all' && t.content_type === 'all');
    return match;
  };

  const template = getRelevantTemplate();
  const items = template ? allItems.filter(item => item.checklist_template_id === template.id) : [];

  const getToolUrl = (toolId) => {
    const tool = tools.find(t => t.id === toolId);
    return tool?.url || '';
  };

  const getToolName = (toolId) => {
    const tool = tools.find(t => t.id === toolId);
    return tool?.name || '';
  };

  if (!workflowStep) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Workflow Step</CardTitle>
          <Badge variant="secondary">{workflowStep.name}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.length === 0 ? (
          <p className="text-sm text-gray-500 italic">No checklist for this step</p>
        ) : (
          items.map(item => (
            <div
              key={item.id}
              className={`p-3 rounded-lg border-2 ${
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
                  {item.optional_tool_id && (
                    <div className="mt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(getToolUrl(item.optional_tool_id), '_blank')}
                        className="text-xs h-7"
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        Launch {getToolName(item.optional_tool_id)}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}