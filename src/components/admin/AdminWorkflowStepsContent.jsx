import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit2, Save, X, GripVertical, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Checkbox } from '@/components/ui/checkbox';

const defaultSteps = [
  { name: 'Strategy & Script', description: 'Includes caption + SEO', applies_to: ['all'] },
  { name: 'Asset Gathering', description: 'Collect raw materials and resources', applies_to: ['all'] },
  { name: 'Graphics & Covers', description: 'Design thumbnails and cover images', applies_to: ['video', 'post'] },
  { name: 'Production', description: 'Create and edit content', applies_to: ['all'] },
  { name: 'Scheduling', description: 'Schedule across platforms', applies_to: ['all'] },
  { name: 'Follow-up & Repurpose', description: 'Track outcomes and reuse content', applies_to: ['all'] }
];

export default function AdminWorkflowStepsContent() {
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [editingStep, setEditingStep] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    order: 0,
    applies_to_campaign_types: [],
    applies_to_content_types: []
  });

  const { data: steps = [], isLoading } = useQuery({
    queryKey: ['workflowSteps'],
    queryFn: async () => {
      const data = await base44.entities.WorkflowStep.list('order');
      return data.length > 0 ? data : defaultSteps.map((s, i) => ({ ...s, order: i + 1, id: `default-${i}` }));
    },
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.WorkflowStep.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflowSteps'] });
      setShowDialog(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.WorkflowStep.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflowSteps'] });
      setShowDialog(false);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.WorkflowStep.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workflowSteps'] }),
  });

  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const items = Array.from(steps);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update order for all items
    for (let i = 0; i < items.length; i++) {
      if (items[i].id && !items[i].id.startsWith('default-')) {
        await base44.entities.WorkflowStep.update(items[i].id, { order: i + 1 });
      }
    }

    queryClient.invalidateQueries({ queryKey: ['workflowSteps'] });
  };

  const handleEdit = (step) => {
    setEditingStep(step);
    setFormData({
      name: step.name,
      order: step.order,
      applies_to_campaign_types: step.applies_to_campaign_types || [],
      applies_to_content_types: step.applies_to_content_types || []
    });
    setShowDialog(true);
  };

  const handleAdd = () => {
    setEditingStep(null);
    setFormData({
      name: '',
      order: steps.length + 1,
      applies_to_campaign_types: [],
      applies_to_content_types: []
    });
    setShowDialog(true);
  };

  const handleSave = () => {
    if (editingStep && editingStep.id && !editingStep.id.startsWith('default-')) {
      updateMutation.mutate({ id: editingStep.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (step) => {
    if (step.id && !step.id.startsWith('default-') && confirm('Delete this workflow step?')) {
      deleteMutation.mutate(step.id);
    }
  };

  const resetForm = () => {
    setEditingStep(null);
    setFormData({
      name: '',
      order: 0,
      applies_to_campaign_types: [],
      applies_to_content_types: []
    });
  };

  const campaignTypes = ['tool_promotion', 'affiliate_promotion', 'product_promotion', 'workshop_course', 'event_live', 'mlm_network_marketing', 'seasonal_promotion'];
  const contentTypes = ['video', 'post', 'email', 'sms', 'live', 'blog', 'promo'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Workflow Steps</h2>
          <p className="text-sm text-gray-500 mt-1">Define and order the content creation pipeline</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="w-4 h-4 mr-2" />
          Add Step
        </Button>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="workflow-steps">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
              {steps.map((step, index) => (
                <Draggable key={step.id || index} draggableId={String(step.id || index)} index={index}>
                  {(provided) => (
                    <Card
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                    >
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                          <div {...provided.dragHandleProps}>
                            <GripVertical className="w-5 h-5 text-gray-400 cursor-grab" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <Badge variant="outline">Step {index + 1}</Badge>
                              <h3 className="font-semibold">{step.name}</h3>
                            </div>
                            {step.description && (
                              <p className="text-sm text-gray-600">{step.description}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="ghost" onClick={() => handleEdit(step)}>
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(step)}
                              disabled={step.id?.startsWith('default-')}
                            >
                              <Trash2 className="w-4 h-4 text-red-400" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingStep ? 'Edit Workflow Step' : 'Add Workflow Step'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label>Step Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Strategy & Script"
              />
            </div>

            <div>
              <Label>Applies to Campaign Types</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {campaignTypes.map((type) => (
                  <div key={type} className="flex items-center gap-2">
                    <Checkbox
                      checked={formData.applies_to_campaign_types.includes(type)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFormData({
                            ...formData,
                            applies_to_campaign_types: [...formData.applies_to_campaign_types, type]
                          });
                        } else {
                          setFormData({
                            ...formData,
                            applies_to_campaign_types: formData.applies_to_campaign_types.filter(t => t !== type)
                          });
                        }
                      }}
                    />
                    <span className="text-sm">{type.replace(/_/g, ' ')}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">Leave empty to apply to all campaign types</p>
            </div>

            <div>
              <Label>Applies to Content Types</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {contentTypes.map((type) => (
                  <div key={type} className="flex items-center gap-2">
                    <Checkbox
                      checked={formData.applies_to_content_types.includes(type)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFormData({
                            ...formData,
                            applies_to_content_types: [...formData.applies_to_content_types, type]
                          });
                        } else {
                          setFormData({
                            ...formData,
                            applies_to_content_types: formData.applies_to_content_types.filter(t => t !== type)
                          });
                        }
                      }}
                    />
                    <span className="text-sm capitalize">{type}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">Leave empty to apply to all content types</p>
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={() => setShowDialog(false)} variant="outline" className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleSave} className="flex-1" disabled={!formData.name}>
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <p className="text-sm text-blue-800">
            <strong>Tip:</strong> Drag steps to reorder. The workflow order affects how content moves through the production pipeline. Each step can have its own checklists and tools.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}