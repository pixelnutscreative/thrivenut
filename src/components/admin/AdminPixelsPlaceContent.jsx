import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Plus, Edit, Trash2, GripVertical, Eye, EyeOff, Copy, Loader2, Save, RotateCcw } from 'lucide-react';

const sectionTypes = [
  { id: 'workshops', label: 'Workshops & Classes' },
  { id: 'ai_toolbox', label: 'AI Toolbox' },
  { id: 'shop', label: 'Creative Shop' },
  { id: 'fun_zone', label: 'Fun Zone' },
  { id: 'resources', label: 'Resources Grid' },
  { id: 'quick_links', label: 'Quick Links' },
  { id: 'custom', label: 'Custom Content' },
];

const defaultSections = [
  { title: 'Workshops & Classes', section_type: 'workshops', icon: 'GraduationCap', sort_order: 10, is_active: true },
  { title: "Pixel's AI Toolbox", section_type: 'ai_toolbox', icon: 'Zap', sort_order: 20, is_active: true },
  { title: "Pixel's Creative Shop", section_type: 'shop', icon: 'ShoppingBag', sort_order: 30, is_active: true },
  { title: 'Fun Zone', section_type: 'fun_zone', icon: 'MessageSquare', sort_order: 40, is_active: true },
  { title: 'Products I Actually Use and LOVE', section_type: 'resources', icon: 'Wrench', sort_order: 50, is_active: true },
  { title: 'Quick Links', section_type: 'quick_links', icon: 'ExternalLink', sort_order: 60, is_active: true },
];

export default function AdminPixelsPlaceContent() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    section_type: 'custom',
    icon: 'Star',
    sort_order: 100,
    is_active: true,
    content: {}
  });

  const { data: sections = [], isLoading } = useQuery({
    queryKey: ['pixelsPlaceSections'],
    queryFn: () => base44.entities.PixelsPlaceSection.list('sort_order'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.PixelsPlaceSection.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pixelsPlaceSections'] });
      setShowModal(false);
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.PixelsPlaceSection.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pixelsPlaceSections'] });
      setShowModal(false);
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.PixelsPlaceSection.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pixelsPlaceSections'] })
  });

  const initializeDefaultsMutation = useMutation({
    mutationFn: async () => {
      for (const section of defaultSections) {
        await base44.entities.PixelsPlaceSection.create(section);
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pixelsPlaceSections'] })
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      section_type: 'custom',
      icon: 'Star',
      sort_order: 100,
      is_active: true,
      content: {}
    });
    setEditingSection(null);
  };

  const handleEdit = (section) => {
    setEditingSection(section);
    setFormData({
      title: section.title || '',
      description: section.description || '',
      section_type: section.section_type || 'custom',
      icon: section.icon || 'Star',
      sort_order: section.sort_order || 100,
      is_active: section.is_active !== false,
      content: section.content || {}
    });
    setShowModal(true);
  };

  const handleDuplicate = (section) => {
    setFormData({
      title: `${section.title} (Copy)`,
      description: section.description || '',
      section_type: section.section_type,
      icon: section.icon || 'Star',
      sort_order: (section.sort_order || 100) + 5,
      is_active: false, // Start hidden
      content: section.content || {}
    });
    setShowModal(true);
  };

  const handleSubmit = () => {
    if (editingSection) {
      updateMutation.mutate({ id: editingSection.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const toggleActive = (section) => {
    updateMutation.mutate({ id: section.id, data: { is_active: !section.is_active } });
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    
    const items = Array.from(sections);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    // Update sort orders
    items.forEach((item, index) => {
      updateMutation.mutate({ id: item.id, data: { sort_order: (index + 1) * 10 } });
    });
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-8"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Pixel's Place Sections</CardTitle>
              <CardDescription>Manage, reorder, show/hide, and duplicate sections</CardDescription>
            </div>
            <div className="flex gap-2">
              {sections.length === 0 && (
                <Button 
                  variant="outline" 
                  onClick={() => initializeDefaultsMutation.mutate()}
                  disabled={initializeDefaultsMutation.isPending}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Load Defaults
                </Button>
              )}
              <Button onClick={() => { resetForm(); setShowModal(true); }}>
                <Plus className="w-4 h-4 mr-2" />
                Add Section
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {sections.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No sections configured. Click "Load Defaults" to initialize.
            </div>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="sections">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                    {sections.map((section, index) => (
                      <Draggable key={section.id} draggableId={section.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`flex items-center gap-3 p-4 rounded-lg border ${
                              snapshot.isDragging ? 'bg-purple-50 border-purple-300' : 'bg-white'
                            } ${!section.is_active ? 'opacity-50 bg-gray-50' : ''}`}
                          >
                            <div {...provided.dragHandleProps}>
                              <GripVertical className="w-5 h-5 text-gray-400" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold">{section.title}</span>
                                <Badge variant="outline" className="text-xs">
                                  {sectionTypes.find(t => t.id === section.section_type)?.label || section.section_type}
                                </Badge>
                                {!section.is_active && (
                                  <Badge className="bg-gray-200 text-gray-600">Hidden</Badge>
                                )}
                              </div>
                              {section.description && (
                                <p className="text-sm text-gray-500 mt-1">{section.description}</p>
                              )}
                            </div>
                            <div className="flex gap-1">
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => toggleActive(section)}
                                title={section.is_active ? 'Hide section' : 'Show section'}
                              >
                                {section.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => handleDuplicate(section)}
                                title="Duplicate section"
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => handleEdit(section)}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="text-red-500"
                                onClick={() => deleteMutation.mutate(section.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingSection ? 'Edit Section' : 'Add Section'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Section Title *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Section title"
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Section Type</Label>
                <Select value={formData.section_type} onValueChange={(v) => setFormData({ ...formData, section_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {sectionTypes.map(type => (
                      <SelectItem key={type.id} value={type.id}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Sort Order</Label>
                <Input
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 100 })}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label>Active (visible on page)</Label>
              <Switch 
                checked={formData.is_active} 
                onCheckedChange={(v) => setFormData({ ...formData, is_active: v })} 
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={!formData.title || createMutation.isPending || updateMutation.isPending}>
              <Save className="w-4 h-4 mr-2" />
              {editingSection ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}