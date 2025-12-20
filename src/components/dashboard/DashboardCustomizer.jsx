import React, { useState, useEffect } from 'react';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { 
  ArrowUp, ArrowDown, Eye, EyeOff, GripVertical, RefreshCw, Check, X 
} from 'lucide-react';
import { motion, Reorder } from 'framer-motion';

const WIDGET_LABELS = {
  daily_motivation: 'Daily Motivation',
  my_day: 'My Day & Calendar',
  tasks: 'Tasks',
  goals: 'Goals',
  habits: 'Habits',
  calendar_integration: 'Calendar Connect',
  special_events: 'Special Events',
  subscribed_events: 'Subscribed Events',
  notion_tasks: 'Notion Tasks'
};

const DEFAULT_LAYOUT = [
  { id: 'daily_motivation', visible: true, order: 0 },
  { id: 'my_day', visible: true, order: 1 },
  { id: 'tasks', visible: true, order: 2 },
  { id: 'goals', visible: true, order: 3 },
  { id: 'habits', visible: true, order: 4 },
  { id: 'calendar_integration', visible: true, order: 5 },
  { id: 'special_events', visible: true, order: 6 },
  { id: 'subscribed_events', visible: true, order: 7 }
];

export default function DashboardCustomizer({ isOpen, onClose, currentLayout, onSave }) {
  const [layout, setLayout] = useState([]);

  useEffect(() => {
    if (isOpen && currentLayout) {
      // Ensure all defaults are present
      const merged = [...currentLayout];
      DEFAULT_LAYOUT.forEach(def => {
        if (!merged.find(p => p.id === def.id)) {
          merged.push(def);
        }
      });
      // Sort by order
      merged.sort((a, b) => (a.order || 0) - (b.order || 0));
      setLayout(merged);
    }
  }, [isOpen, currentLayout]);

  const handleMove = (index, direction) => {
    const newLayout = [...layout];
    if (direction === 'up' && index > 0) {
      [newLayout[index], newLayout[index - 1]] = [newLayout[index - 1], newLayout[index]];
    } else if (direction === 'down' && index < newLayout.length - 1) {
      [newLayout[index], newLayout[index + 1]] = [newLayout[index + 1], newLayout[index]];
    }
    // Re-index orders
    const ordered = newLayout.map((item, i) => ({ ...item, order: i }));
    setLayout(ordered);
  };

  const handleToggle = (id) => {
    setLayout(prev => prev.map(item => 
      item.id === id ? { ...item, visible: !item.visible } : item
    ));
  };

  const handleReset = () => {
    setLayout(DEFAULT_LAYOUT);
  };

  const handleSave = () => {
    onSave(layout);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-hidden flex flex-col bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Customize Dashboard
          </DialogTitle>
          <DialogDescription>
            Show, hide, and reorder your dashboard sections.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2 py-2 space-y-3">
          {layout.map((widget, index) => {
            if (!widget || !widget.id) return null;
            
            return (
              <motion.div
                key={widget.id}
                layoutId={widget.id}
                initial={false}
                className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all ${
                  widget.visible 
                    ? 'border-purple-100 bg-purple-50/50' 
                    : 'border-gray-100 bg-gray-50 opacity-70'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => handleMove(index, 'up')}
                      disabled={index === 0}
                      className="p-1 hover:bg-gray-200 rounded-md disabled:opacity-30 transition-colors"
                    >
                      <ArrowUp className="w-3 h-3 text-gray-500" />
                    </button>
                    <button
                      onClick={() => handleMove(index, 'down')}
                      disabled={index === layout.length - 1}
                      className="p-1 hover:bg-gray-200 rounded-md disabled:opacity-30 transition-colors"
                    >
                      <ArrowDown className="w-3 h-3 text-gray-500" />
                    </button>
                  </div>
                  
                  <div>
                    <p className={`font-medium text-sm ${widget.visible ? 'text-gray-900' : 'text-gray-500'}`}>
                      {WIDGET_LABELS[widget.id] || widget.id.replace(/_/g, ' ')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-full ${
                    widget.visible ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-400'
                  }`}>
                    {widget.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </div>
                  <Switch 
                    checked={widget.visible} 
                    onCheckedChange={() => handleToggle(widget.id)}
                  />
                </div>
              </motion.div>
            );
          })}
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