import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2 } from 'lucide-react';

const DROP_TIMING_OPTIONS = {
  beginning: '🏁 Beginning',
  first_bonus: '⭐ First Bonus',
  middle_bonus: '⭐⭐ Middle Bonus (30-60s)',
  end: '🔥 End of Battle'
};

export default function GloveAssignmentManager({ assignments = [], onUpdate, availableInventory = [], enabledTimings = Object.keys(DROP_TIMING_OPTIONS) }) {
  const handleAdd = () => {
    if (assignments.length < 10) {
      onUpdate([...assignments, { id: Date.now(), position: assignments.length + 1, contact_id: '', type: 'glove', drop_timing: enabledTimings[0] || 'beginning' }]);
    }
  };

  const handleRemove = (id) => {
    onUpdate(assignments.filter(a => a.id !== id));
  };

  const handleChange = (id, field, value) => {
    onUpdate(assignments.map(a => a.id === id ? { ...a, [field]: value } : a));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-sm">Glove Assignments (Max 10)</h4>
        <Badge variant="secondary">{assignments.length}/10</Badge>
      </div>

      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {assignments.map((assignment, idx) => (
          <Card key={assignment.id} className="p-3 space-y-2">
            <div className="flex gap-2 items-end">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded flex items-center justify-center font-bold text-blue-700 text-xs">
                {idx + 1}
              </div>
              <div className="flex-1 space-y-1">
                <label className="text-xs font-medium text-gray-600">Who throws this?</label>
                <Select value={assignment.contact_id} onValueChange={(v) => handleChange(assignment.id, 'contact_id', v)}>
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="Select contact" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableInventory.map(item => (
                      <SelectItem key={item.contact_id} value={item.contact_id}>
                        {item.contact_name} ({item.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleRemove(assignment.id)}
                className="text-red-400 hover:text-red-600 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="flex gap-2 items-end ml-10">
              <div className="flex-1 space-y-1">
                <label className="text-xs font-medium text-gray-600">Type</label>
                <Select value={assignment.type} onValueChange={(v) => handleChange(assignment.id, 'type', v)}>
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="glove">🥊 Glove</SelectItem>
                    <SelectItem value="hammer">🔨 Hammer</SelectItem>
                    <SelectItem value="lightning2">⚡ Lightning (2nd)</SelectItem>
                    <SelectItem value="lightning3">⚡ Lightning (3rd)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 space-y-1">
                <label className="text-xs font-medium text-gray-600">When?</label>
                <Select value={assignment.drop_timing || 'beginning'} onValueChange={(v) => handleChange(assignment.id, 'drop_timing', v)}>
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {enabledTimings.map(timing => (
                      <SelectItem key={timing} value={timing}>
                        {DROP_TIMING_OPTIONS[timing]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {assignments.length < 10 && (
        <Button
          onClick={handleAdd}
          variant="outline"
          size="sm"
          className="w-full"
        >
          <Plus className="w-4 h-4 mr-2" /> Add Assignment
        </Button>
      )}
    </div>
  );
}