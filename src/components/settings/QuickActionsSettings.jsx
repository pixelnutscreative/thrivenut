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
  Plus, Trash2, GripVertical, ExternalLink, ArrowDown, ArrowUp, ArrowLeft, ArrowRight,
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
];

const colorOptions = [
  'bg-pink-500', 'bg-blue-500', 'bg-orange-500', 'bg-yellow-500', 
  'bg-purple-500', 'bg-green-500', 'bg-red-500', 'bg-teal-500', 'bg-indigo-500'
];

const positionOptions = [
  { value: 'bottom', label: 'Bottom Center', icon: ArrowUp, description: 'Bar at bottom of screen' },
  { value: 'top', label: 'Top Center', icon: ArrowDown, description: 'Bar at top of screen' },
  { value: 'left', label: 'Left Side', icon: ArrowRight, description: 'Vertical bar on left' },
  { value: 'right', label: 'Right Side', icon: ArrowLeft, description: 'Vertical bar on right' },
];

export default function QuickActionsSettings({ formData, setFormData }) {
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [newAction, setNewAction] = useState({ label: '', icon: 'Home', page: '', external_url: '', color: 'bg-teal-500' });
  const [editingAction, setEditingAction] = useState(null);
  const { primaryColor, accentColor } = useTheme();

  const quickActions = formData.quick_actions || ['mood', 'water', 'food', 'note'];
  const customActions = formData.custom_quick_actions || [];
  const position = formData.quick_actions_position || 'bottom';

  const handleToggleBuiltIn = (actionId) => {
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
    setEditingAction(action);
  };

  const handleSaveEdit = () => {
    if (!editingAction) return;
    const updatedCustom = customActions.map(a => 
      a.id === editingAction.id ? editingAction : a
    );
    setFormData({ ...formData, custom_quick_actions: updatedCustom });
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

  return (
    <div className="space-y-6">
      {/* Reorder Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions Order</CardTitle>
          <CardDescription>Drag to reorder your quick action buttons</CardDescription>
        </CardHeader>
        <CardContent>
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="quick-actions">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                  {quickActions.map((actionId, index) => {
                    const builtIn = builtInActions.find(a => a.id === actionId);
                    const custom = customActions.find(a => a.id === actionId);
                    const action = builtIn || custom;
                    if (!action) return null;
                    
                    const Icon = getIconComponent(action.icon);
                    
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
                            <div className={`w-8 h-8 rounded-lg ${action.color} flex items-center justify-center`}>
                              <Icon className="w-4 h-4 text-white" />
                            </div>
                            <span className="font-medium flex-1">{action.label}</span>
                            {custom && (
                              <span className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded">Custom</span>
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
        </CardContent>
      </Card>

      {/* Built-in Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Built-in Quick Actions</CardTitle>
          <CardDescription>Toggle actions to add/remove from your bar</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {builtInActions.map(action => {
            const Icon = getIconComponent(action.icon);
            const isEnabled = quickActions.includes(action.id);
            return (
              <div
                key={action.id}
                onClick={() => handleToggleBuiltIn(action.id)}
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                  isEnabled ? 'bg-purple-50 border-2 border-purple-300' : 'bg-gray-50 border-2 border-transparent hover:border-gray-200'
                }`}
              >
                <Checkbox checked={isEnabled} />
                <div className={`w-8 h-8 rounded-lg ${action.color} flex items-center justify-center`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <span className="font-medium">{action.label}</span>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Custom Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Custom Quick Actions</CardTitle>
              <CardDescription>Add shortcuts to pages or external links</CardDescription>
            </div>
            <Dialog open={showAddCustom} onOpenChange={setShowAddCustom}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1">
                  <Plus className="w-4 h-4" />
                  Add Custom
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Custom Quick Action</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
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
                      value={newAction.page} 
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
                        <SelectItem value="PrayerRequests">Prayer Requests</SelectItem>
                        <SelectItem value="PixelsParadise">Pixel's Place</SelectItem>
                        <SelectItem value="SongGenerator">Sunny Songbird</SelectItem>
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
        </CardHeader>
        <CardContent>
          {customActions.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">No custom actions yet</p>
          ) : (
            <div className="space-y-2">
              {customActions.map(action => {
                const Icon = getIconComponent(action.icon);
                const isEnabled = quickActions.includes(action.id);
                return (
                  <div
                    key={action.id}
                    className={`flex items-center gap-3 p-3 rounded-lg bg-gray-50 border-2 ${
                      isEnabled ? 'border-purple-300' : 'border-transparent'
                    }`}
                  >
                    <Checkbox 
                      checked={isEnabled}
                      onCheckedChange={(checked) => {
                        const newActions = checked
                          ? [...quickActions, action.id]
                          : quickActions.filter(a => a !== action.id);
                        setFormData({ ...formData, quick_actions: newActions });
                      }}
                    />
                    <div 
                      className={`w-8 h-8 rounded-lg ${action.color} flex items-center justify-center cursor-pointer hover:opacity-80`}
                      onClick={(e) => { e.stopPropagation(); handleEditAction(action); }}
                      title="Click to change color"
                    >
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <span className="font-medium">{action.label}</span>
                      {action.page && <span className="text-xs text-gray-500 ml-2">→ {action.page}</span>}
                      {action.external_url && <span className="text-xs text-gray-500 ml-2">↗ External</span>}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveCustomAction(action.id)}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Action Color Dialog */}
      <Dialog open={!!editingAction} onOpenChange={() => setEditingAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit {editingAction?.label}</DialogTitle>
          </DialogHeader>
          {editingAction && (
            <div className="space-y-4 py-4">
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
              <Button onClick={handleSaveEdit} className="w-full">Save Changes</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}