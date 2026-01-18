import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2 } from 'lucide-react';

export default function GloveAssignmentManager({ assignments = [], onUpdate }) {
  const handleAdd = () => {
    if (assignments.length < 10) {
      onUpdate([...assignments, { id: Date.now(), position: assignments.length + 1, assignee: '', type: 'glove' }]);
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

      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        {assignments.map((assignment, idx) => (
          <Card key={assignment.id} className="p-3 flex gap-2 items-end">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded flex items-center justify-center font-bold text-blue-700 text-xs">
              {idx + 1}
            </div>
            <div className="flex-1 space-y-1">
              <label className="text-xs font-medium text-gray-600">Assignee</label>
              <Input
                placeholder="Who throws this?"
                value={assignment.assignee}
                onChange={(e) => handleChange(assignment.id, 'assignee', e.target.value)}
                className="text-xs"
              />
            </div>
            <div className="flex-shrink-0 w-24">
              <label className="text-xs font-medium text-gray-600 block mb-1">Type</label>
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
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleRemove(assignment.id)}
              className="text-red-400 hover:text-red-600 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
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