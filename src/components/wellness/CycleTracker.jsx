import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Moon, Calendar, Activity, Thermometer, Brain } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

const symptomsList = [
  { id: 'cramps', label: 'Cramps', icon: '⚡' },
  { id: 'headache', label: 'Headache', icon: '🤕' },
  { id: 'bloating', label: 'Bloating', icon: '🐡' },
  { id: 'tender_breasts', label: 'Tender Breasts', icon: '🍈' },
  { id: 'acne', label: 'Acne', icon: '🔴' },
  { id: 'fatigue', label: 'Fatigue', icon: '😴' },
  { id: 'backache', label: 'Backache', icon: '🦴' },
  { id: 'nausea', label: 'Nausea', icon: '🤢' },
  { id: 'cravings', label: 'Cravings', icon: '🍫' },
  { id: 'mood_swings', label: 'Mood Swings', icon: '🎢' },
  { id: 'hot_flashes', label: 'Hot Flashes', icon: '🔥' },
  { id: 'night_sweats', label: 'Night Sweats', icon: '💦' },
  { id: 'brain_fog', label: 'Brain Fog', icon: '🌫️' },
  { id: 'insomnia', label: 'Insomnia', icon: '👀' },
  { id: 'joint_pain', label: 'Joint Pain', icon: '🦵' },
  { id: 'anxiety', label: 'Anxiety', icon: '😰' },
  { id: 'irritability', label: 'Irritability', icon: '😤' },
  { id: 'do_not_care', label: 'IDGAF Mode', icon: '😑' },
  { id: 'pee_trip', label: 'Pee Trip', icon: '🚽' }
];

const flowOptions = [
  { id: 'none', label: 'None', color: 'bg-gray-100 text-gray-600' },
  { id: 'spotting', label: 'Spotting', color: 'bg-pink-100 text-pink-600' },
  { id: 'light', label: 'Light', color: 'bg-rose-100 text-rose-600' },
  { id: 'medium', label: 'Medium', color: 'bg-rose-200 text-rose-700' },
  { id: 'heavy', label: 'Heavy', color: 'bg-rose-500 text-white' }
];

export default function CycleTracker({ userEmail }) {
  const queryClient = useQueryClient();
  const today = format(new Date(), 'yyyy-MM-dd');
  const [showSymptoms, setShowSymptoms] = useState(false);

  const { data: log } = useQuery({
    queryKey: ['cycleLog', today, userEmail],
    queryFn: async () => {
      const logs = await base44.entities.CycleLog.filter({ date: today, created_by: userEmail });
      return logs[0] || null;
    },
    enabled: !!userEmail
  });

  const logMutation = useMutation({
    mutationFn: async (data) => {
      if (log) {
        return await base44.entities.CycleLog.update(log.id, data);
      } else {
        return await base44.entities.CycleLog.create({
          date: today,
          created_by: userEmail,
          ...data
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cycleLog'] });
    }
  });

  const handleFlowChange = (level) => {
    logMutation.mutate({ flow_level: level });
  };

  const toggleSymptom = (symptomId) => {
    const currentSymptoms = log?.symptoms || [];
    const newSymptoms = currentSymptoms.includes(symptomId)
      ? currentSymptoms.filter(s => s !== symptomId)
      : [...currentSymptoms, symptomId];
    logMutation.mutate({ symptoms: newSymptoms });
  };

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-rose-50 to-pink-50">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl flex items-center gap-2 text-rose-700">
          <Activity className="w-5 h-5" />
          Cycle & Symptom Tracker
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Flow Tracking */}
        <div>
          <label className="text-sm font-medium text-rose-800 mb-2 block">Flow Level / Bleeding</label>
          <div className="flex flex-wrap gap-2">
            {flowOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => handleFlowChange(option.id)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  log?.flow_level === option.id 
                    ? `ring-2 ring-rose-400 ${option.color}` 
                    : 'bg-white text-gray-500 hover:bg-gray-50'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Menopause Check */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-rose-800">Menopause & Fun Stuff</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => toggleSymptom('hot_flashes')}
              className={`p-3 rounded-xl border flex items-center gap-2 justify-center transition-all ${
                log?.symptoms?.includes('hot_flashes')
                  ? 'bg-orange-100 border-orange-300 text-orange-700'
                  : 'bg-white border-gray-200 text-gray-600 hover:bg-orange-50'
              }`}
            >
              <Thermometer className="w-4 h-4" />
              Hot Flash 🔥
            </button>
            <button
              onClick={() => toggleSymptom('night_sweats')}
              className={`p-3 rounded-xl border flex items-center gap-2 justify-center transition-all ${
                log?.symptoms?.includes('night_sweats')
                  ? 'bg-blue-100 border-blue-300 text-blue-700'
                  : 'bg-white border-gray-200 text-gray-600 hover:bg-blue-50'
              }`}
            >
              <Moon className="w-4 h-4" />
              Sweaty Night 💦
            </button>
          </div>
          
          <div className="flex items-center gap-2 p-3 bg-white rounded-xl border border-gray-200">
             <span className="text-sm">🚽 Pee Trips:</span>
             <div className="flex items-center gap-2">
               <Button size="sm" variant="outline" className="h-6 w-6 p-0" onClick={() => logMutation.mutate({ bathroom_trips: Math.max(0, (log?.bathroom_trips || 0) - 1) })}>-</Button>
               <span className="w-4 text-center">{log?.bathroom_trips || 0}</span>
               <Button size="sm" variant="outline" className="h-6 w-6 p-0" onClick={() => logMutation.mutate({ bathroom_trips: (log?.bathroom_trips || 0) + 1 })}>+</Button>
             </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-gray-600">IDGAF Level (Do Not Care Status):</label>
            <div className="flex gap-1">
              {['low', 'medium', 'high', 'extreme'].map(level => (
                <button
                  key={level}
                  onClick={() => logMutation.mutate({ do_not_care_status: level })}
                  className={`flex-1 py-1 rounded text-xs capitalize border ${
                    log?.do_not_care_status === level 
                      ? 'bg-rose-500 text-white border-rose-500' 
                      : 'bg-white text-gray-500 border-gray-200'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Symptoms Accordion */}
        <div className="border-t border-rose-200 pt-4">
          <button 
            onClick={() => setShowSymptoms(!showSymptoms)}
            className="flex items-center justify-between w-full text-rose-700 font-medium hover:text-rose-800"
          >
            <span>
              Symptoms ({log?.symptoms?.length || 0})
            </span>
            <span className="text-xl">{showSymptoms ? '−' : '+'}</span>
          </button>
          
          {showSymptoms && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="pt-3 grid grid-cols-2 sm:grid-cols-3 gap-2"
            >
              {symptomsList.map((symptom) => (
                <button
                  key={symptom.id}
                  onClick={() => toggleSymptom(symptom.id)}
                  className={`text-xs p-2 rounded-lg border text-left transition-all ${
                    log?.symptoms?.includes(symptom.id)
                      ? 'bg-rose-100 border-rose-300 text-rose-800'
                      : 'bg-white border-gray-100 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span className="mr-1">{symptom.icon}</span> {symptom.label}
                </button>
              ))}
            </motion.div>
          )}
        </div>

        <Textarea
          placeholder="Notes on cycle, mood, or symptoms..."
          value={log?.notes || ''}
          onChange={(e) => logMutation.mutate({ notes: e.target.value })}
          className="bg-white/50"
          rows={2}
        />
      </CardContent>
    </Card>
  );
}