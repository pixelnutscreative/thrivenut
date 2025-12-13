import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit2, Save, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export default function AdminChecklistsContent() {
  const queryClient = useQueryClient();
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showItemDialog, setShowItemDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [expandedTemplates, setExpandedTemplates] = useState([]);
  const [templateForm, setTemplateForm] = useState({
    workflow_step_id: '',
    platform: 'all',
    content_type: 'all',
    display_order: 0
  });
  const [itemForm, setItemForm] = useState({
    checklist_template_id: '',
    label: '',
    optional_tool_id: '',
    required_for_mvp: false
  });

  const { data: workflowSteps = [] } = useQuery({
    queryKey: ['workflowSteps'],
    queryFn: () => base44.entities.WorkflowStep.list('order'),
  });

  const { data: templates = [] } = useQuery({
    queryKey: ['checklistTemplates'],
    queryFn: () => base44.entities.ChecklistTemplate.list('display_order'),
  });

  const { data: items = [] } = useQuery({
    queryKey: ['checklistItems'],
    queryFn: () => base44.entities.ChecklistItem.list(),
  });

  const { data: tools = [] } = useQuery({
    queryKey: ['tools'],
    queryFn: () => base44.entities.Tool.list('name'),
  });

  const createTemplateMutation = useMutation({
    mutationFn: (data) => base44.entities.ChecklistTemplate.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklistTemplates'] });
      setShowTemplateDialog(false);
      resetTemplateForm();
    },
  });

  const updateTemplateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ChecklistTemplate.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklistTemplates'] });
      setShowTemplateDialog(false);
      resetTemplateForm();
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: (id) => base44.entities.ChecklistTemplate.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['checklistTemplates'] }),
  });

  const createItemMutation = useMutation({
    mutationFn: (data) => base44.entities.ChecklistItem.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklistItems'] });
      setShowItemDialog(false);
      resetItemForm();
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ChecklistItem.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklistItems'] });
      setShowItemDialog(false);
      resetItemForm();
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: (id) => base44.entities.ChecklistItem.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['checklistItems'] }),
  });

  const handleAddTemplate = () => {
    setEditingTemplate(null);
    resetTemplateForm();
    setShowTemplateDialog(true);
  };

  const handleEditTemplate = (template) => {
    setEditingTemplate(template);
    setTemplateForm({
      workflow_step_id: template.workflow_step_id,
      platform: template.platform || 'all',
      content_type: template.content_type || 'all',
      display_order: template.display_order || 0
    });
    setShowTemplateDialog(true);
  };

  const handleSaveTemplate = () => {
    if (editingTemplate) {
      updateTemplateMutation.mutate({ id: editingTemplate.id, data: templateForm });
    } else {
      createTemplateMutation.mutate(templateForm);
    }
  };

  const handleAddItem = (templateId) => {
    setEditingItem(null);
    setItemForm({
      checklist_template_id: templateId,
      label: '',
      optional_tool_id: '',
      required_for_mvp: false
    });
    setSelectedTemplateId(templateId);
    setShowItemDialog(true);
  };

  const handleEditItem = (item) => {
    setEditingItem(item);
    setItemForm({
      checklist_template_id: item.checklist_template_id,
      label: item.label,
      optional_tool_id: item.optional_tool_id || '',
      required_for_mvp: item.required_for_mvp || false
    });
    setShowItemDialog(true);
  };

  const handleSaveItem = () => {
    if (editingItem) {
      updateItemMutation.mutate({ id: editingItem.id, data: itemForm });
    } else {
      createItemMutation.mutate(itemForm);
    }
  };

  const resetTemplateForm = () => {
    setTemplateForm({
      workflow_step_id: '',
      platform: 'all',
      content_type: 'all',
      display_order: 0
    });
    setEditingTemplate(null);
  };

  const resetItemForm = () => {
    setItemForm({
      checklist_template_id: '',
      label: '',
      optional_tool_id: '',
      required_for_mvp: false
    });
    setEditingItem(null);
  };

  const getWorkflowStepName = (stepId) => {
    const step = workflowSteps.find(s => s.id === stepId);
    return step?.name || 'Unknown Step';
  };

  const getToolName = (toolId) => {
    const tool = tools.find(t => t.id === toolId);
    return tool?.name || '';
  };

  const toggleTemplate = (templateId) => {
    setExpandedTemplates(prev =>
      prev.includes(templateId)
        ? prev.filter(id => id !== templateId)
        : [...prev, templateId]
    );
  };

  const platforms = ['all', 'TikTok', 'YouTube', 'Facebook', 'LinkedIn', 'Pinterest', 'Email', 'SMS'];
  const contentTypes = ['all', 'video', 'post', 'email', 'sms', 'live', 'blog', 'promo'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Checklist Templates & Items</h2>
          <p className="text-sm text-gray-500 mt-1">Create checklists for workflow steps, platforms, and content types</p>
        </div>
        <Button onClick={handleAddTemplate}>
          <Plus className="w-4 h-4 mr-2" />
          Add Template
        </Button>
      </div>

      <div className="space-y-3">
        {templates.map((template) => {
          const templateItems = items.filter(item => item.checklist_template_id === template.id);
          const isExpanded = expandedTemplates.includes(template.id);

          return (
            <Card key={template.id}>
              <Collapsible open={isExpanded} onOpenChange={() => toggleTemplate(template.id)}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CollapsibleTrigger className="flex items-center gap-2 flex-1">
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      <div className="flex items-center gap-2 flex-1">
                        <CardTitle className="text-base">{getWorkflowStepName(template.workflow_step_id)}</CardTitle>
                        <Badge variant="outline">{template.platform || 'all'}</Badge>
                        <Badge variant="outline">{template.content_type || 'all'}</Badge>
                        <Badge>{templateItems.length} items</Badge>
                      </div>
                    </CollapsibleTrigger>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="ghost" onClick={() => handleEditTemplate(template)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          if (confirm('Delete this checklist template and all its items?')) {
                            deleteTemplateMutation.mutate(template.id);
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CollapsibleContent>
                  <CardContent className="space-y-2">
                    {templateItems.length === 0 ? (
                      <p className="text-sm text-gray-500 italic">No checklist items yet</p>
                    ) : (
                      templateItems.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{item.label}</span>
                            {item.required_for_mvp && <Badge variant="destructive" className="text-xs">MVP Required</Badge>}
                            {item.optional_tool_id && (
                              <Badge variant="secondary" className="text-xs">
                                🔧 {getToolName(item.optional_tool_id)}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <Button size="sm" variant="ghost" onClick={() => handleEditItem(item)}>
                              <Edit2 className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                if (confirm('Delete this checklist item?')) {
                                  deleteItemMutation.mutate(item.id);
                                }
                              }}
                            >
                              <Trash2 className="w-3 h-3 text-red-400" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAddItem(template.id)}
                      className="w-full mt-2"
                    >
                      <Plus className="w-3 h-3 mr-2" />
                      Add Item
                    </Button>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          );
        })}
      </div>

      {/* Template Dialog */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTemplate ? 'Edit Checklist Template' : 'Add Checklist Template'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label>Workflow Step</Label>
              <Select value={templateForm.workflow_step_id} onValueChange={(v) => setTemplateForm({ ...templateForm, workflow_step_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select workflow step..." />
                </SelectTrigger>
                <SelectContent>
                  {workflowSteps.map((step) => (
                    <SelectItem key={step.id} value={step.id}>{step.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Platform</Label>
              <Select value={templateForm.platform} onValueChange={(v) => setTemplateForm({ ...templateForm, platform: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {platforms.map((platform) => (
                    <SelectItem key={platform} value={platform}>{platform}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Content Type</Label>
              <Select value={templateForm.content_type} onValueChange={(v) => setTemplateForm({ ...templateForm, content_type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {contentTypes.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={() => setShowTemplateDialog(false)} variant="outline" className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleSaveTemplate} className="flex-1" disabled={!templateForm.workflow_step_id}>
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Item Dialog */}
      <Dialog open={showItemDialog} onOpenChange={setShowItemDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Checklist Item' : 'Add Checklist Item'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label>Item Label</Label>
              <Input
                value={itemForm.label}
                onChange={(e) => setItemForm({ ...itemForm, label: e.target.value })}
                placeholder="e.g., Write script outline"
              />
            </div>

            <div>
              <Label>Linked Tool (Optional)</Label>
              <Select value={itemForm.optional_tool_id} onValueChange={(v) => setItemForm({ ...itemForm, optional_tool_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>None</SelectItem>
                  {tools.map((tool) => (
                    <SelectItem key={tool.id} value={tool.id}>
                      {tool.name} ({tool.category})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">Tool will launch from this checklist item</p>
            </div>

            <div className="flex items-center justify-between">
              <Label>Required for MVP</Label>
              <Switch
                checked={itemForm.required_for_mvp}
                onCheckedChange={(checked) => setItemForm({ ...itemForm, required_for_mvp: checked })}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={() => setShowItemDialog(false)} variant="outline" className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleSaveItem} className="flex-1" disabled={!itemForm.label}>
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
            <strong>How it works:</strong> Checklist templates define what needs to be done at each workflow step. Items can link to tools for quick launching. Set platform/content type to "all" for universal checklists.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}