import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Play, Square, Utensils } from 'lucide-react';
import { format, differenceInHours, differenceInMinutes, parseISO } from 'date-fns';

const scheduleInfo = {
  '16_8': { fastHours: 16, eatHours: 8 },
  '18_6': { fastHours: 18, eatHours: 6 },
  '20_4': { fastHours: 20, eatHours: 4 },
  'omad': { fastHours: 23, eatHours: 1 },
  '5_2': { fastHours: 0, eatHours: 0 },
  'custom': { fastHours: 0, eatHours: 0 }
};

export default function FastingTracker({ preferences, selfCareLog, onUpdate }) {
  const [now, setNow] = useState(new Date());
  
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  if (!preferences?.intermittent_fasting) return null;

  const schedule = preferences.fasting_schedule || '16_8';
  const { fastHours } = scheduleInfo[schedule] || scheduleInfo['16_8'];
  
  const eatingStart = preferences.eating_window_start || '12:00';
  const eatingEnd = preferences.eating_window_end || '20:00';
  
  const fastingStarted = selfCareLog?.fasting_started ? parseISO(selfCareLog.fasting_started) : null;
  const fastingEnded = selfCareLog?.fasting_ended ? parseISO(selfCareLog.fasting_ended) : null;
  
  // Determine current state
  const currentTime = format(now, 'HH:mm');
  const isInEatingWindow = currentTime >= eatingStart && currentTime <= eatingEnd;
  const isFasting = fastingStarted && !fastingEnded;
  
  // Calculate elapsed time
  let elapsedHours = 0;
  let elapsedMinutes = 0;
  if (fastingStarted) {
    const endTime = fastingEnded || now;
    elapsedHours = differenceInHours(endTime, fastingStarted);
    elapsedMinutes = differenceInMinutes(endTime, fastingStarted) % 60;
  }
  
  const progressPercent = fastHours > 0 ? Math.min((elapsedHours / fastHours) * 100, 100) : 0;
  const fastComplete = elapsedHours >= fastHours && fastHours > 0;

  const handleStartFast = () => {
    onUpdate('fasting_started', new Date().toISOString());
    onUpdate('fasting_ended', null);
  };

  const handleEndFast = () => {
    onUpdate('fasting_ended', new Date().toISOString());
  };

  return (
    <Card className="shadow-lg border-0 bg-gradient-to-br from-green-50 to-emerald-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-green-600" />
            Intermittent Fasting
          </div>
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            {schedule === 'omad' ? 'OMAD' : schedule.replace('_', ':')}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status */}
        <div className="text-center p-4 bg-white rounded-xl border-2 border-green-200">
          {isFasting ? (
            <>
              <div className="text-3xl font-bold text-green-700">
                {elapsedHours}h {elapsedMinutes}m
              </div>
              <p className="text-sm text-gray-600">
                {fastComplete ? '✅ Fast complete!' : `of ${fastHours} hours`}
              </p>
              {!fastComplete && (
                <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              )}
            </>
          ) : fastingEnded ? (
            <>
              <div className="text-2xl mb-1">🍽️</div>
              <p className="font-semibold text-green-700">Eating Window</p>
              <p className="text-sm text-gray-600">
                Completed {elapsedHours}h {elapsedMinutes}m fast
              </p>
            </>
          ) : (
            <>
              <div className="text-2xl mb-1">{isInEatingWindow ? '🍽️' : '⏰'}</div>
              <p className="font-semibold text-gray-700">
                {isInEatingWindow ? 'Eating Window Open' : 'Ready to Fast'}
              </p>
              <p className="text-sm text-gray-600">
                Eating window: {eatingStart} - {eatingEnd}
              </p>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          {!isFasting && !fastingEnded && (
            <Button 
              onClick={handleStartFast}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <Play className="w-4 h-4 mr-2" />
              Start Fast
            </Button>
          )}
          {isFasting && (
            <Button 
              onClick={handleEndFast}
              variant="outline"
              className="flex-1 border-green-400 text-green-700 hover:bg-green-50"
            >
              <Utensils className="w-4 h-4 mr-2" />
              Break Fast
            </Button>
          )}
          {fastingEnded && (
            <Button 
              onClick={handleStartFast}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <Play className="w-4 h-4 mr-2" />
              Start New Fast
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}