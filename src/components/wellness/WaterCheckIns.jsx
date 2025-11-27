import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Droplet, Check } from 'lucide-react';

const waterSlots = [
  { id: 'water_morning', label: 'Morning', time: '☀️', description: 'Start your day hydrated' },
  { id: 'water_midday', label: 'Midday', time: '🌤️', description: 'Stay refreshed' },
  { id: 'water_afternoon', label: 'Afternoon', time: '🌅', description: 'Beat the slump' },
  { id: 'water_evening', label: 'Evening', time: '🌙', description: 'Wind down hydrated' }
];

export default function WaterCheckIns({ selfCareLog, onToggle }) {
  const completedCount = waterSlots.filter(slot => selfCareLog?.[slot.id]).length;
  const allComplete = completedCount === waterSlots.length;

  return (
    <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-50 to-cyan-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Droplet className="w-5 h-5 text-blue-500" />
            Water Check-ins
          </div>
          <Badge variant={allComplete ? "default" : "secondary"} className={allComplete ? "bg-green-500" : ""}>
            {completedCount}/{waterSlots.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {waterSlots.map(slot => {
            const done = selfCareLog?.[slot.id];
            return (
              <button
                key={slot.id}
                onClick={() => onToggle(slot.id, !done)}
                className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                  done
                    ? 'border-blue-400 bg-blue-100 text-blue-800'
                    : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50'
                }`}
              >
                <span className="text-2xl">{slot.time}</span>
                <span className="font-medium text-sm">{slot.label}</span>
                {done && <Check className="w-5 h-5 text-blue-600" />}
              </button>
            );
          })}
        </div>
        {allComplete && (
          <div className="mt-4 p-3 bg-blue-100 rounded-lg text-center">
            <span className="text-blue-800 font-medium">💧 Great job staying hydrated today!</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}