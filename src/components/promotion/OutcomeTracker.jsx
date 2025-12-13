import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function OutcomeTracker({ formData, setFormData, isLocked }) {
  const outcomeIcons = {
    worked: <TrendingUp className="w-4 h-4 text-green-600" />,
    didnt_work: <TrendingDown className="w-4 h-4 text-red-600" />,
    meh: <Minus className="w-4 h-4 text-gray-600" />
  };

  return (
    <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
      <CardHeader>
        <CardTitle className="text-base">Outcome Tracking</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Result</Label>
          <Select
            value={formData.outcome_result || ''}
            onValueChange={(v) => setFormData({ ...formData, outcome_result: v })}
            disabled={isLocked}
          >
            <SelectTrigger>
              <SelectValue placeholder="How did it perform?" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="worked">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  Worked
                </div>
              </SelectItem>
              <SelectItem value="didnt_work">
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-red-600" />
                  Didn't Work
                </div>
              </SelectItem>
              <SelectItem value="meh">
                <div className="flex items-center gap-2">
                  <Minus className="w-4 h-4 text-gray-600" />
                  Meh
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Outcome Notes</Label>
          <Textarea
            value={formData.outcome_notes || ''}
            onChange={(e) => setFormData({ ...formData, outcome_notes: e.target.value })}
            rows={3}
            placeholder="What happened? What did you learn?"
            disabled={isLocked}
          />
        </div>

        <div className="flex items-center justify-between pt-2 border-t">
          <Label>Mark for Reuse</Label>
          <Switch
            checked={formData.reuse_toggle}
            onCheckedChange={(checked) => setFormData({ ...formData, reuse_toggle: checked })}
            disabled={isLocked}
          />
        </div>

        <div className="text-xs text-purple-700 bg-white/50 p-2 rounded">
          💡 Track what worked so you can replicate success and avoid what didn't
        </div>
      </CardContent>
    </Card>
  );
}