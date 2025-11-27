import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ChevronDown, ChevronRight, Bell, Heart, HandHelping, PartyPopper, Loader2, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const categoryIcons = {
  spiritual: '🙏', health: '💪', personal: '🎯', financial: '💰',
  relationship: '❤️', learning: '📚', career: '💼', creative: '🎨', other: '✨'
};

const emojiOptions = ['👏', '🔥', '💪', '🌟', '❤️', '🎉', '👍', '🙌'];

export default function SharedGoalCard({ goal, sharerEmail, sharerName, currentUser }) {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [showNudgeModal, setShowNudgeModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [nudgeMessage, setNudgeMessage] = useState('');
  const [helpMessage, setHelpMessage] = useState('');
  const [sentInteraction, setSentInteraction] = useState(null);

  const stepsCompleted = goal.steps?.filter(s => s.completed).length || 0;
  const stepsTotal = goal.steps?.length || 0;
  const stepsPercent = stepsTotal > 0 ? (stepsCompleted / stepsTotal) * 100 : 0;

  const interactionMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.entities.GoalInteraction.create({
        goal_id: goal.id,
        goal_title: goal.title,
        from_email: currentUser.email,
        from_name: currentUser.full_name || currentUser.email,
        to_email: sharerEmail,
        ...data
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['goalInteractions'] });
      setSentInteraction(variables.interaction_type);
      setTimeout(() => setSentInteraction(null), 2000);
      setShowNudgeModal(false);
      setShowHelpModal(false);
      setNudgeMessage('');
      setHelpMessage('');
    },
  });

  const sendReaction = (emoji) => {
    interactionMutation.mutate({ interaction_type: 'reaction', emoji });
  };

  const sendCheer = () => {
    interactionMutation.mutate({ interaction_type: 'cheer', message: 'Keep going! 🎉' });
  };

  const sendNudge = () => {
    interactionMutation.mutate({ 
      interaction_type: 'nudge', 
      message: nudgeMessage || 'Hey! Just checking in on your progress 💜'
    });
  };

  const sendHelp = () => {
    interactionMutation.mutate({ 
      interaction_type: 'offer_help', 
      message: helpMessage || 'Let me know if you need any help with this!'
    });
  };

  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-2">
              <span className="text-xl">{categoryIcons[goal.category] || '🎯'}</span>
              <div>
                <CardTitle className="text-base">{goal.title}</CardTitle>
                {goal.target_date && (
                  <p className="text-xs text-gray-500 mt-1">Target: {goal.target_date}</p>
                )}
              </div>
            </div>
            {sentInteraction && (
              <Badge className="bg-green-100 text-green-700 animate-pulse">
                <Check className="w-3 h-3 mr-1" /> Sent!
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Progress bar for steps */}
          {stepsTotal > 0 && (
            <div className="space-y-1">
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center justify-between w-full text-sm text-gray-600 hover:text-gray-800"
              >
                <span className="flex items-center gap-1">
                  {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  {stepsCompleted}/{stepsTotal} steps
                </span>
                <span className="text-xs">{Math.round(stepsPercent)}%</span>
              </button>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-purple-500 rounded-full transition-all"
                  style={{ width: `${stepsPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Expandable steps list */}
          <AnimatePresence>
            {expanded && stepsTotal > 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="space-y-1 pt-2">
                  {goal.steps.map((step, idx) => (
                    <div 
                      key={step.id || idx}
                      className={`flex items-center gap-2 p-2 rounded-lg text-sm ${
                        step.completed ? 'bg-green-50 text-green-700' : 'bg-gray-50'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        step.completed ? 'bg-green-500 border-green-500' : 'border-gray-300'
                      }`}>
                        {step.completed && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className={step.completed ? 'line-through' : ''}>{step.title}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Interaction buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
            {/* Quick emoji reactions */}
            <div className="flex gap-1">
              {emojiOptions.slice(0, 4).map(emoji => (
                <button
                  key={emoji}
                  onClick={() => sendReaction(emoji)}
                  disabled={interactionMutation.isPending}
                  className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-lg transition-transform hover:scale-110"
                >
                  {emoji}
                </button>
              ))}
            </div>

            <div className="flex-1" />

            {/* Action buttons */}
            <Button
              size="sm"
              variant="ghost"
              onClick={sendCheer}
              disabled={interactionMutation.isPending}
              className="text-amber-600 hover:bg-amber-50"
            >
              <PartyPopper className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowNudgeModal(true)}
              className="text-purple-600 hover:bg-purple-50"
            >
              <Bell className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowHelpModal(true)}
              className="text-teal-600 hover:bg-teal-50"
            >
              <HandHelping className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Nudge Modal */}
      <Dialog open={showNudgeModal} onOpenChange={setShowNudgeModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-purple-600" />
              Send a Friendly Nudge
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Send {sharerName || sharerEmail} a gentle reminder about this goal
            </p>
            <Textarea
              placeholder="Hey! Just checking in on your progress 💜"
              value={nudgeMessage}
              onChange={(e) => setNudgeMessage(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNudgeModal(false)}>Cancel</Button>
            <Button 
              onClick={sendNudge} 
              disabled={interactionMutation.isPending}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {interactionMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Bell className="w-4 h-4 mr-2" />}
              Send Nudge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Offer Help Modal */}
      <Dialog open={showHelpModal} onOpenChange={setShowHelpModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HandHelping className="w-5 h-5 text-teal-600" />
              Offer Your Help
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Let {sharerName || sharerEmail} know you're here to help!
            </p>
            <Textarea
              placeholder="Let me know if you need any help with this!"
              value={helpMessage}
              onChange={(e) => setHelpMessage(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowHelpModal(false)}>Cancel</Button>
            <Button 
              onClick={sendHelp} 
              disabled={interactionMutation.isPending}
              className="bg-teal-600 hover:bg-teal-700"
            >
              {interactionMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <HandHelping className="w-4 h-4 mr-2" />}
              Offer Help
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}