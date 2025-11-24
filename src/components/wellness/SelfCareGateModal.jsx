import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Heart, ShowerHead, Utensils, Pill, Droplet, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import SelfCareChecklist from './SelfCareChecklist';

export default function SelfCareGateModal({ 
  isOpen, 
  selfCareLog, 
  requiredTasks,
  onToggleTask,
  moduleName 
}) {
  return (
    <Dialog open={isOpen}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Heart className="w-6 h-6 text-pink-500" />
            Take Care of Yourself First 💜
          </DialogTitle>
          <DialogDescription className="text-base">
            You've set a goal to complete some self-care tasks before accessing {moduleName}. 
            This is a loving reminder from past-you to take care of present-you!
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <p className="text-gray-600 mb-4 text-center">
            Complete these tasks to unlock {moduleName}:
          </p>

          <SelfCareChecklist
            selfCareLog={selfCareLog}
            onToggleTask={onToggleTask}
            requiredTasks={requiredTasks}
            showOnlyRequired={true}
          />

          <div className="mt-6 p-4 bg-purple-50 rounded-lg">
            <p className="text-purple-800 text-sm text-center">
              <strong>Remember:</strong> You set this up because you care about yourself. 
              These small acts of self-care make a big difference! 🌟
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <Link to={createPageUrl('Wellness')} className="flex-1">
            <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
              Go to Wellness
            </Button>
          </Link>
          <Link to={createPageUrl('Settings')} className="flex-1">
            <Button variant="outline" className="w-full">
              Adjust Settings
            </Button>
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}