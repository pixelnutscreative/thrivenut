import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Bell, Check, X, Users, Loader2, PartyPopper, HandHelping, Heart, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { motion, AnimatePresence } from 'framer-motion';

const relationships = {
  mentor: 'Mentor',
  mentee: 'Mentee',
  family: 'Family',
  friend: 'Friend',
  coworker: 'Coworker',
  tiktok_creator: 'TikTok Creator',
  other: 'Other'
};

const interactionIcons = {
  nudge: { icon: Bell, color: 'text-purple-600', bg: 'bg-purple-100', label: 'sent you a nudge' },
  reaction: { icon: Heart, color: 'text-pink-600', bg: 'bg-pink-100', label: 'reacted to your goal' },
  offer_help: { icon: HandHelping, color: 'text-teal-600', bg: 'bg-teal-100', label: 'offered to help' },
  cheer: { icon: PartyPopper, color: 'text-amber-600', bg: 'bg-amber-100', label: 'is cheering you on!' }
};

export default function NotificationBell({ userEmail, isDark }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: pendingShares = [] } = useQuery({
    queryKey: ['pendingGoalShares', userEmail],
    queryFn: () => base44.entities.GoalShare.filter({ 
      viewer_email: userEmail, 
      status: 'pending' 
    }),
    enabled: !!userEmail,
    refetchInterval: 60000,
  });

  const { data: unreadInteractions = [] } = useQuery({
    queryKey: ['unreadInteractions', userEmail],
    queryFn: () => base44.entities.GoalInteraction.filter({ 
      to_email: userEmail, 
      is_read: false 
    }, '-created_date'),
    enabled: !!userEmail,
    refetchInterval: 30000,
  });

  const updateShareMutation = useMutation({
    mutationFn: async ({ id, status, userName }) => {
      await base44.entities.GoalShare.update(id, { 
        status, 
        viewer_name: userName 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingGoalShares'] });
      queryClient.invalidateQueries({ queryKey: ['goalSharesReceived'] });
    },
  });

  const markReadMutation = useMutation({
    mutationFn: (id) => base44.entities.GoalInteraction.update(id, { is_read: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['unreadInteractions'] }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      for (const i of unreadInteractions) {
        await base44.entities.GoalInteraction.update(i.id, { is_read: true });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['unreadInteractions'] }),
  });

  const handleAccept = async (share, userName) => {
    updateShareMutation.mutate({ id: share.id, status: 'accepted', userName });
  };

  const handleDecline = async (share) => {
    updateShareMutation.mutate({ id: share.id, status: 'declined' });
  };

  const notificationCount = pendingShares.length + unreadInteractions.length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
        >
          <Bell className={`w-5 h-5 ${isDark ? 'text-gray-300' : 'text-gray-600'}`} />
          <AnimatePresence>
            {notificationCount > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold"
              >
                {notificationCount > 9 ? '9+' : notificationCount}
              </motion.div>
            )}
          </AnimatePresence>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-3 border-b bg-gray-50 flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">Notifications</h3>
          {unreadInteractions.length > 0 && (
            <Button size="sm" variant="ghost" onClick={() => markAllReadMutation.mutate()} className="text-xs h-6">
              Mark all read
            </Button>
          )}
        </div>
        
        <div className="max-h-80 overflow-y-auto">
          {pendingShares.length === 0 && unreadInteractions.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No new notifications</p>
            </div>
          ) : (
            <div className="divide-y">
              {/* Goal Interactions */}
              {unreadInteractions.map(interaction => {
                const config = interactionIcons[interaction.interaction_type] || interactionIcons.reaction;
                const Icon = config.icon;
                return (
                  <Link
                    key={interaction.id}
                    to={`${createPageUrl('Goals')}?tab=shared-with-me`}
                    onClick={() => {
                      markReadMutation.mutate(interaction.id);
                      setOpen(false);
                    }}
                  >
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-3 hover:bg-gray-50 cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-full ${config.bg} flex items-center justify-center shrink-0`}>
                        {interaction.emoji ? (
                          <span className="text-lg">{interaction.emoji}</span>
                        ) : (
                          <Icon className={`w-4 h-4 ${config.color}`} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">
                          <span className="font-medium">{interaction.from_name || interaction.from_email}</span>
                          {' '}{config.label}
                        </p>
                        <p className="text-xs text-purple-600 truncate">{interaction.goal_title}</p>
                        {interaction.message && (
                          <p className="text-xs text-gray-600 mt-1 italic">"{interaction.message}"</p>
                        )}
                      </div>
                      <button className="text-gray-400 hover:text-gray-600">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                  </Link>
                );
              })}

              {/* Pending Shares */}
              {pendingShares.map(share => (
                <motion.div
                  key={share.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-3 hover:bg-gray-50"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                      <Users className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800">
                        {share.sharer_name || share.sharer_email}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        wants to share goals with you
                      </p>
                      <Badge variant="outline" className="mt-1 text-xs">
                        {relationships[share.relationship] || share.relationship}
                      </Badge>
                      
                      <div className="flex gap-2 mt-2">
                        <Button
                          size="sm"
                          className="h-7 text-xs bg-green-600 hover:bg-green-700"
                          onClick={() => handleAccept(share)}
                          disabled={updateShareMutation.isPending}
                        >
                          {updateShareMutation.isPending ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <><Check className="w-3 h-3 mr-1" /> Accept</>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => handleDecline(share)}
                          disabled={updateShareMutation.isPending}
                        >
                          <X className="w-3 h-3 mr-1" /> Decline
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}