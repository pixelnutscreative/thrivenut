import React, { useState, useEffect } from 'react';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { 
  Eye, EyeOff, GripVertical, RefreshCw, LayoutTemplate, Columns 
} from 'lucide-react';
import { Reorder, useDragControls } from 'framer-motion';

const WIDGET_LABELS = {
  daily_motivation: 'Daily Motivation',
  my_day: 'My Day & Calendar',
  tasks: 'Tasks',
  goals: 'Goals',
  habits: 'Habits',
  calendar_integration: 'Calendar Connect',
  special_events: 'Special Events',
  subscribed_events: 'Subscribed Events',
  notion_tasks: 'Notion Tasks',
  group_highlights: 'Highlights (Birthdays/Anniversaries)',
  upcoming_battles: 'Upcoming Battles',
  live_creators: 'Live Creators Today'
};

const DEFAULT_LAYOUT = [
  { id: 'daily_motivation', visible: true, order: 0, width: 'full' },
  { id: 'my_day', visible: true, order: 1, width: 'full' },
  { id: 'tasks', visible: true, order: 2, width: 'half' },
  { id: 'goals', visible: true, order: 3, width: 'half' },
  { id: 'habits', visible: true, order: 4, width: 'half' },
  { id: 'calendar_integration', visible: true, order: 5, width: 'half' },
  { id: 'special_events', visible: true, order: 6, width: 'half' },
  { id: 'subscribed_events', visible: true, order: 7, width: 'half' },
  { id: 'group_highlights', visible: false, order: 8, width: 'half' },
  { id: 'upcoming_battles', visible: false, order: 9, width: 'half' },
  { id: 'live_creators', visible: false, order: 10, width: 'half' }
];

export default function DashboardCustomizer({ isOpen, onClose, currentLayout, onSave }) {
  const [layout, setLayout] = useState([]);

  useEffect(() => {
    if (isOpen) {
      // Ensure all defaults are present and have default widths if missing
      const merged = [...(currentLayout || [])];
      DEFAULT_LAYOUT.forEach(def => {
        const existing = merged.find(p => p.id === def.id);
        if (!existing) {
          merged.push(def);
        } else if (!existing.width) {
          // Add default width if missing from existing layout
          existing.width = def.width;
        }
      });
      // Sort by order
      merged.sort((a, b) => (a.order || 0) - (b.order || 0));
      setLayout(merged);
    }
  }, [isOpen, currentLayout]);

  const handleToggleVisibility = (id) => {
    setLayout(prev => prev.map(item => 
      item.id === id ? { ...item, visible: !item.visible } : item
    ));
  };

  const handleToggleWidth = (id) => {
    setLayout(prev => prev.map(item => 
      item.id === id ? { ...item, width: item.width === 'full' ? 'half' : 'full' } : item
    ));
  };

  const handleReset = () => {
    setLayout(DEFAULT_LAYOUT);
  };

  const handleSave = () => {
    // Re-index orders based on current array position
    const ordered = layout.map((item, i) => ({ ...item, order: i }));
    onSave(ordered);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-hidden flex flex-col bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Customize Dashboard
          </DialogTitle>
          <DialogDescription>
            Drag to reorder. Toggle visibility and width (full/half).
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2 py-2">
          <Reorder.Group axis="y" values={layout} onReorder={setLayout} className="space-y-2">
            {layout.map((widget) => {
              if (!widget || !widget.id) return null;
              
              return (
                <Reorder.Item
                  key={widget.id}
                  value={widget}
                  className={`flex items-center justify-between p-3 rounded-xl border-2 bg-white transition-colors ${
                    widget.visible ? 'border-gray-200' : 'border-gray-100 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <GripVertical className="w-5 h-5 text-gray-400 cursor-grab active:cursor-grabbing" />
                    
                    <div className="flex flex-col">
                      <p className={`font-medium text-sm ${widget.visible ? 'text-gray-900' : 'text-gray-500'}`}>
                        {WIDGET_LABELS[widget.id] || widget.id.replace(/_/g, ' ')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Width Toggle */}
                    <div className="flex bg-gray-100 rounded-lg p-1 mr-2">
                      <button
                        onClick={() => widget.visible && handleToggleWidth(widget.id)}
                        disabled={!widget.visible}
                        className={`p-1.5 rounded-md transition-all ${
                          widget.width === 'half' 
                            ? 'bg-white shadow-sm text-gray-900' 
                            : 'text-gray-400 hover:text-gray-600'
                        }`}
                        title="Half Width"
                      >
                        <Columns className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => widget.visible && handleToggleWidth(widget.id)}
                        disabled={!widget.visible}
                        className={`p-1.5 rounded-md transition-all ${
                          widget.width === 'full' 
                            ? 'bg-white shadow-sm text-gray-900' 
                            : 'text-gray-400 hover:text-gray-600'
                        }`}
                        title="Full Width"
                      >
                        <LayoutTemplate className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Visibility Toggle */}
                    <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
                      {widget.visible ? (
                        <Eye className="w-4 h-4 text-gray-500" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-gray-300" />
                      )}
                      <Switch 
                        checked={widget.visible} 
                        onCheckedChange={() => handleToggleVisibility(widget.id)}
                      />
                    </div>
                  </div>
                </Reorder.Item>
              );
            })}
          </Reorder.Group>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 pt-4 border-t mt-2">
          <Button 
            variant="ghost" 
            onClick={handleReset}
            className="text-gray-500 hover:text-gray-700 sm:mr-auto"
          >
            <RefreshCw className="w-4 h-4 mr-2" /> Reset Default
          </Button>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={onClose} className="flex-1 sm:flex-none">
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-purple-600 hover:bg-purple-700 text-white flex-1 sm:flex-none">
              Save Changes
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}