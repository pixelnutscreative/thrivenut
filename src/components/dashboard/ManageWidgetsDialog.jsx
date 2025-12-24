import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Eye, EyeOff, Plus, Trash2, GripVertical } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function ManageWidgetsDialog({ isOpen, onClose, layout, onUpdateLayout, userEmail }) {
  const [selectedGroup, setSelectedGroup] = useState('');

  const { data: myGroups = [] } = useQuery({
    queryKey: ['myGroups', userEmail],
    queryFn: async () => {
      // Fetch groups I own or am a member of
      if (!userEmail) return [];

      // Get all groups I'm a member of (regardless of active status for now to catch everything)
      const memberships = await base44.entities.CreatorGroupMember.filter({ user_email: userEmail });
      const groupIds = memberships.map(m => m.group_id);

      // Also groups I own
      const ownedGroups = await base44.entities.CreatorGroup.filter({ owner_email: userEmail });
      const allIds = [...new Set([...groupIds, ...ownedGroups.map(g => g.id)])];

      if (allIds.length === 0) return [];

      // Fetch group details and filter out archived ones
      const groups = await Promise.all(allIds.map(id => base44.entities.CreatorGroup.filter({ id })));
      return groups.flat().filter(g => g && g.status !== 'archived');
    },
    enabled: !!userEmail && isOpen
  });

  const toggleVisibility = (id) => {
    const newLayout = layout.map(item => {
      if (item.id === id) {
        return { ...item, visible: !item.visible };
      }
      return item;
    });
    onUpdateLayout(newLayout);
  };

  const addGroupWidget = () => {
    if (!selectedGroup) return;
    const group = myGroups.find(g => g.id === selectedGroup);
    if (!group) return;

    // Check if already exists to avoid dupes? Or allow multiple?
    // Let's allow multiple but maybe warn.
    const newId = `group_${group.id}_${Date.now()}`;
    const newWidget = {
      id: newId,
      type: 'group',
      groupId: group.id,
      title: group.name,
      visible: true,
      order: layout.length,
      width: 'half',
      config: { showEvents: true, showFeed: true, showTicker: true }
    };
    
    onUpdateLayout([...layout, newWidget]);
    setSelectedGroup('');
  };

  const removeWidget = (id) => {
    const newLayout = layout.filter(item => item.id !== id);
    onUpdateLayout(newLayout);
  };

  const getWidgetLabel = (widget) => {
    if (widget.title) return widget.title;
    switch (widget.id) {
      case 'daily_motivation': return 'Daily Motivation';
      case 'my_day': return 'My Day';
      case 'tasks': return 'Tasks';
      case 'goals': return 'Goals';
      case 'habits': return 'Habits';
      case 'calendar_integration': return 'Calendar Connection';
      case 'special_events': return 'Special Events';
      case 'subscribed_events': return 'Subscribed Events';
      default: return widget.id;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Dashboard Widgets</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-500">Add Group Widget</h3>
            <div className="flex gap-2">
              <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select a group..." />
                </SelectTrigger>
                <SelectContent>
                  {myGroups.map(group => (
                    <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={addGroupWidget} disabled={!selectedGroup}>
                <Plus className="w-4 h-4 mr-2" /> Add
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-500">Current Widgets</h3>
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-2">
                {layout.map((widget) => (
                  <div key={widget.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                    <span className="font-medium text-sm">{getWidgetLabel(widget)}</span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleVisibility(widget.id)}
                        className={widget.visible ? "text-green-600" : "text-gray-400"}
                      >
                        {widget.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </Button>
                      
                      {/* Allow deleting custom widgets like groups */}
                      {widget.type === 'group' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeWidget(widget.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}