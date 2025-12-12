import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Zap, Droplet, Smile, Utensils, Lightbulb, Cloud, StickyNote, Heart,
  Plus, Trash2, GripVertical, ExternalLink, Settings as SettingsIcon,
  Music, Link, Home, Check as CheckCircle, Calendar as CalendarIcon
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useTheme } from '../shared/useTheme';

const builtInActions = [
  { id: 'mood', label: 'Mood', icon: 'Smile', color: 'bg-pink-500' },
  { id: 'water', label: 'Water', icon: 'Droplet', color: 'bg-blue-500' },
  { id: 'task', label: 'Quick Task', icon: 'Check', color: 'bg-teal-500' },
  { id: 'event', label: 'Add Event', icon: 'Calendar', color: 'bg-orange-500' },
  { id: 'food', label: 'Food', icon: 'Utensils', color: 'bg-green-500' },
  { id: 'idea', label: 'Idea', icon: 'Lightbulb', color: 'bg-yellow-500' },
  { id: 'negative_thought', label: 'Reframe', icon: 'Cloud', color: 'bg-purple-500' },
  { id: 'note', label: 'Note', icon: 'StickyNote', color: 'bg-lime-500' },
  { id: 'gratitude', label: 'Gratitude', icon: 'Heart', color: 'bg-red-500' },
];

const iconOptions = [
  { value: 'Home', icon: Home },
  { value: 'Music', icon: Music },
  { value: 'Heart', icon: Heart },
  { value: 'Zap', icon: Zap },
  { value: 'Link', icon: Link },
  { value: 'ExternalLink', icon: ExternalLink },
  { value: 'Smile', icon: Smile },
  { value: 'Check', icon: CheckCircle },
];

const colorOptions = [
  'bg-pink-500', 'bg-blue-500', 'bg-orange-500', 'bg-yellow-500', 
  'bg-purple-500', 'bg-green-500', 'bg-red-500', 'bg-teal-500', 'bg-indigo-500',
  'bg-cyan-500', 'bg-lime-500', 'bg-amber-500'
];

export default function QuickActionsSettings({ formData, setFormData }) {
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [newAction, setNewAction] = useState({ label: '', icon: 'Home', page: '', external_url: '', color: 'bg-teal-500' });
  const [editingAction, setEditingAction] = useState(null);
  const { primaryColor, accentColor } = useTheme();

  const quickActions = formData.quick_actions || ['mood', 'water', 'food', 'note'];
  const customActions = formData.custom_quick_actions || [];

  const handleToggleAction = (actionId) => {
    const newActions = quickActions.includes(actionId)
      ? quickActions.filter(a => a !== actionId)
      : [...quickActions, actionId];
    setFormData({ ...formData, quick_actions: newActions });
  };

  const handleAddCustomAction = () => {
    if (!newAction.label) return;
    const id = `custom_${Date.now()}`;
    const updatedCustom = [...customActions, { ...newAction, id }];
    setFormData({ 
      ...formData, 
      custom_quick_actions: updatedCustom,
      quick_actions: [...quickActions, id]
    });
    setNewAction({ label: '', icon: 'Home', page: '', external_url: '', color: 'bg-teal-500' });
    setShowAddCustom(false);
  };

  const handleRemoveCustomAction = (actionId) => {
    setFormData({
      ...formData,
      custom_quick_actions: customActions.filter(a => a.id !== actionId),
      quick_actions: quickActions.filter(a => a !== actionId)
    });
  };

  const handleEditAction = (action) => {
    setEditingAction({ ...action });
  };

  const handleSaveEdit = () => {
    if (!editingAction) return;
    
    // Check if it's a built-in or custom action
    const isBuiltIn = builtInActions.find(a => a.id === editingAction.id);
    
    if (isBuiltIn) {
      // For built-in, we store overrides in a new field
      const overrides = formData.action_overrides || {};
      overrides[editingAction.id] = {
        label: editingAction.label,
        color: editingAction.color
      };
      setFormData({ ...formData, action_overrides: overrides });
    } else {
      // For custom, update normally
      const updatedCustom = customActions.map(a => 
        a.id === editingAction.id ? editingAction : a
      );
      setFormData({ ...formData, custom_quick_actions: updatedCustom });
    }
    setEditingAction(null);
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    
    const items = Array.from(quickActions);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    setFormData({ ...formData, quick_actions: items });
  };

  const getIconComponent = (iconName) => {
    const icons = { Smile, Droplet, Utensils, Lightbulb, Cloud, StickyNote, Heart, Home, Music, Zap, Link, ExternalLink, Check: CheckCircle, Calendar: CalendarIcon };
    return icons[iconName] || Zap;
  };

  const getActionDisplay = (actionId) => {
    const builtIn = builtInActions.find(a => a.id === actionId);
    const custom = customActions.find(a => a.id === actionId);
    const action = builtIn || custom;
    
    if (!action) return null;
    
    // Apply overrides for built-in actions
    const overrides = formData.action_overrides?.[actionId] || {};
    
    return {
      ...action,
      label: overrides.label || action.label,
      color: overrides.color || action.color,
      isBuiltIn: !!builtIn
    };
  };

  return (
    <div className="space-y-6">
      {/* Unified Actions List */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Drag to reorder, toggle to enable/disable, click gear to customize</CardDescription>
        </CardHeader>
        <CardContent>
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="quick-actions">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                  {quickActions.map((actionId, index) => {
                    const action = getActionDisplay(actionId);
                    if (!action) return null;
                    
                    const Icon = getIconComponent(action.icon);
                    const isEnabled = quickActions.includes(actionId);
                    
                    return (
                      <Draggable key={actionId} draggableId={actionId} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                              snapshot.isDragging 
                                ? 'border-purple-400 shadow-lg bg-white' 
                                : 'border-gray-200 bg-gray-50 hover:border-purple-300'
                            }`}
                          >
                            <GripVertical className="w-4 h-4 text-gray-400" />
                            <Checkbox 
                              checked={isEnabled}
                              onCheckedChange={() => handleToggleAction(actionId)}
                            />
                            <div className={`w-8 h-8 rounded-lg ${action.color} flex items-center justify-center`}>
                              <Icon className="w-4 h-4 text-white" />
                            </div>
                            <span className="font-medium flex-1">{action.label}</span>
                            {!action.isBuiltIn && (
                              <span className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded">Custom</span>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditAction(action);
                              }}
                              className="h-7 w-7 p-0"
                            >
                              <SettingsIcon className="w-4 h-4 text-gray-400" />
                            </Button>
                            {!action.isBuiltIn && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveCustomAction(action.id);
                                }}
                                className="h-7 w-7 p-0 text-red-400 hover:text-red-600"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        )}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>

          {/* Add more actions */}
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm text-gray-600 mb-3">Add More Actions:</p>
            <div className="grid grid-cols-2 gap-2">
              {builtInActions.filter(a => !quickActions.includes(a.id)).map(action => {
                const Icon = getIconComponent(action.icon);
                return (
                  <button
                    key={action.id}
                    onClick={() => handleToggleAction(action.id)}
                    className="flex items-center gap-2 p-2 rounded-lg border-2 border-dashed border-gray-300 hover:border-purple-400 hover:bg-purple-50 transition-colors"
                  >
                    <div className={`w-6 h-6 rounded ${action.color} flex items-center justify-center`}>
                      <Icon className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-sm">{action.label}</span>
                  </button>
                );
              })}
              <Dialog open={showAddCustom} onOpenChange={setShowAddCustom}>
                <DialogTrigger asChild>
                  <button className="flex items-center justify-center gap-2 p-2 rounded-lg border-2 border-dashed border-purple-300 hover:border-purple-500 hover:bg-purple-50 transition-colors">
                    <Plus className="w-4 h-4 text-purple-600" />
                    <span className="text-sm text-purple-600 font-medium">Custom</span>
                  </button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Custom Quick Action</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Label</Label>
                      <Input
                        value={newAction.label}
                        onChange={(e) => setNewAction({ ...newAction, label: e.target.value })}
                        placeholder="e.g., My Playlist"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Icon</Label>
                      <div className="flex gap-2 flex-wrap">
                        {iconOptions.map(opt => {
                          const Icon = opt.icon;
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => setNewAction({ ...newAction, icon: opt.value })}
                              className={`p-2 rounded-lg border-2 ${
                                newAction.icon === opt.value ? 'border-purple-500 bg-purple-50' : 'border-gray-200'
                              }`}
                            >
                              <Icon className="w-5 h-5" />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Color</Label>
                      <div className="flex gap-2 flex-wrap">
                        {colorOptions.map(color => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setNewAction({ ...newAction, color })}
                            className={`w-8 h-8 rounded-lg ${color} ${
                              newAction.color === color ? 'ring-2 ring-offset-2 ring-purple-500' : ''
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Link to Page (optional)</Label>
                      <Select 
                        value={newAction.page || ''} 
                        onValueChange={(v) => setNewAction({ ...newAction, page: v, external_url: '' })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a page" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={null}>None</SelectItem>
                          <SelectItem value="Dashboard">Dashboard</SelectItem>
                          <SelectItem value="Goals">Goals</SelectItem>
                          <SelectItem value="Journal">Journal</SelectItem>
                          <SelectItem value="Wellness">Wellness</SelectItem>
                          <SelectItem value="Tasks">Tasks</SelectItem>
                          <SelectItem value="SavedMotivations">Content Ideas</SelectItem>
                          <SelectItem value="PrayerRequests">Prayer Requests</SelectItem>
                          <SelectItem value="PixelsParadise">Pixel's Place</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Or External URL</Label>
                      <Input
                        value={newAction.external_url}
                        onChange={(e) => setNewAction({ ...newAction, external_url: e.target.value, page: '' })}
                        placeholder="https://..."
                      />
                    </div>
                    <Button onClick={handleAddCustomAction} className="w-full" disabled={!newAction.label}>
                      Add Action
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Action Dialog */}
      <Dialog open={!!editingAction} onOpenChange={() => setEditingAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Quick Action</DialogTitle>
          </DialogHeader>
          {editingAction && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Label</Label>
                <Input
                  value={editingAction.label}
                  onChange={(e) => setEditingAction({ ...editingAction, label: e.target.value })}
                  placeholder="Action name"
                />
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex gap-2 flex-wrap">
                  {colorOptions.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setEditingAction({ ...editingAction, color })}
                      className={`w-10 h-10 rounded-lg ${color} ${
                        editingAction.color === color ? 'ring-2 ring-offset-2 ring-purple-500' : ''
                      }`}
                    />
                  ))}
                </div>
              </div>
              {!editingAction.isBuiltIn && (
                <>
                  <div className="space-y-2">
                    <Label>Icon</Label>
                    <div className="flex gap-2 flex-wrap">
                      {iconOptions.map(opt => {
                        const Icon = opt.icon;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setEditingAction({ ...editingAction, icon: opt.value })}
                            className={`p-2 rounded-lg border-2 ${
                              editingAction.icon === opt.value ? 'border-purple-500 bg-purple-50' : 'border-gray-200'
                            }`}
                          >
                            <Icon className="w-5 h-5" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Link to Page</Label>
                    <Select 
                      value={editingAction.page || ''} 
                      onValueChange={(v) => setEditingAction({ ...editingAction, page: v, external_url: '' })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a page" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={null}>None</SelectItem>
                        <SelectItem value="Dashboard">Dashboard</SelectItem>
                        <SelectItem value="Goals">Goals</SelectItem>
                        <SelectItem value="Journal">Journal</SelectItem>
                        <SelectItem value="Wellness">Wellness</SelectItem>
                        <SelectItem value="Tasks">Tasks</SelectItem>
                        <SelectItem value="SavedMotivations">Content Ideas</SelectItem>
                        <SelectItem value="PrayerRequests">Prayer Requests</SelectItem>
                        <SelectItem value="PixelsParadise">Pixel's Place</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Or External URL</Label>
                    <Input
                      value={editingAction.external_url || ''}
                      onChange={(e) => setEditingAction({ ...editingAction, external_url: e.target.value, page: '' })}
                      placeholder="https://..."
                    />
                  </div>
                </>
              )}
              <Button onClick={handleSaveEdit} className="w-full">Save Changes</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}