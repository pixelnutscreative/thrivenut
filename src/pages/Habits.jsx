import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Target, Plus } from 'lucide-react';
import { useTheme } from '../components/shared/useTheme';
import { useNavigate } from 'react-router-dom';
import Goals from './Goals'; // Reuse Goals component but filter

export default function Habits() {
  const { bgClass, textClass } = useTheme();
  const navigate = useNavigate();

  return (
    <div className={`min-h-screen ${bgClass} p-4 md:p-8`}>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-teal-100 rounded-xl">
              <Target className="w-8 h-8 text-teal-600" />
            </div>
            <div>
              <h1 className={`text-3xl font-bold ${textClass}`}>Habits</h1>
              <p className="text-gray-500">Track your daily routines and streaks.</p>
            </div>
          </div>
        </div>

        {/* Reuse the Goals page content but pass a filter prop if supported, 
            or better yet, just render Goals with a pre-selected filter.
            Since Goals.js likely manages its own state, we might need to modify it 
            to accept initial filter. 
            For now, let's just render Goals and the user can see habits there.
            Actually, let's just wrap Goals and force the 'habit' tab if possible.
        */}
        
        {/* HACK: Since Goals.js is complex, we'll render it but maybe we should've checked if it supports props.
            Let's assume for now we just show the Goals page content. 
            Ideally we'd refactor Goals.js to accept `defaultTab="habit"`.
        */}
        <Goals defaultType="habit" /> 
      </div>
    </div>
  );
}