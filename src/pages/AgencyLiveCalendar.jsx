import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useTheme } from '@/components/shared/useTheme';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Video, Filter, User, Clock, Link as LinkIcon, Plus } from 'lucide-react';
import LiveScheduleModal from '@/components/tiktok/LiveScheduleModal';

export default function AgencyLiveCalendar({ group }) {
  const { user } = useTheme();
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState('list'); // list, grid
  const [dayFilter, setDayFilter] = useState('upcoming'); // today, tomorrow, upcoming, all
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch Group Members
  const { data: members = [] } = useQuery({
    queryKey: ['groupMembers', group.id],
    queryFn: () => base44.entities.CreatorGroupMember.filter({ group_id: group.id, status: 'active' })
  });

  // Fetch Live Schedules for this Group specifically
  const { data: groupLives = [] } = useQuery({
    queryKey: ['groupLives', group.id],
    queryFn: () => base44.entities.LiveSchedule.filter({ group_id: group.id }, '-created_date')
  });

  const memberEmails = members.map(m => m.user_email);

  const filteredLives = useMemo(() => {
    let result = [...groupLives];
    const today = new Date();
    const todayDay = today.toLocaleDateString('en-US', { weekday: 'long' });
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDay = tomorrow.toLocaleDateString('en-US', { weekday: 'long' });

    if (dayFilter === 'today') {
        result = result.filter(l => 
            (l.is_recurring && l.recurring_days?.includes(todayDay)) || 
            l.specific_date === today.toISOString().split('T')[0]
        );
    } else if (dayFilter === 'tomorrow') {
        result = result.filter(l => 
            (l.is_recurring && l.recurring_days?.includes(tomorrowDay)) || 
            l.specific_date === tomorrow.toISOString().split('T')[0]
        );
    } 
    // "Upcoming" logic could be complex, for now let's just show everything sorted
    
    return result;
  }, [groupLives, dayFilter]);

  const handleSaveLive = async (items) => {
    // This handles the bulk save from the modal
    // We need to inject group_id into each item
    for (const item of items) {
        if (item.id) {
             await base44.entities.LiveSchedule.update(item.id, {
                 ...item,
                 group_id: group.id
             });
        } else {
             await base44.entities.LiveSchedule.create({
                 ...item,
                 host_username: item.host_username || 'me', // Modal might handle this differently?
                 // The modal usually assumes 'me' if creating for self
                 created_by: user.email,
                 group_id: group.id
             });
        }
    }
    queryClient.invalidateQueries(['groupLives', group.id]);
    setIsModalOpen(false);
  };

  // Helper to open modal with pre-filled group context
  // We need to adapt LiveScheduleModal to support single item create or adapt Agency page to use it
  // Actually LiveScheduleModal in components/tiktok/LiveScheduleModal.js seems to handle multiple items
  // But for this agency view, maybe we just want a simple "Add My Live" button that links to the group?

  // Let's create a simpler "Add Group Live" dialog here or reuse logic.
  // Reusing LiveScheduleModal might be best if we pass the current lives.
  
  // Filter lives created by ME for the modal
  const myLives = groupLives.filter(l => l.created_by === user?.email);

  return (
    <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-lg shadow-sm border">
            <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <Video className="w-6 h-6 text-pink-500" />
                    Agency Live Calendar
                </h2>
                <p className="text-sm text-gray-500">Support your team! Join their lives and help them grow.</p>
            </div>
            <div className="flex items-center gap-2">
                <Select value={dayFilter} onValueChange={setDayFilter}>
                    <SelectTrigger className="w-32">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="upcoming">Upcoming</SelectItem>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="tomorrow">Tomorrow</SelectItem>
                        <SelectItem value="all">All</SelectItem>
                    </SelectContent>
                </Select>
                <Button onClick={() => setIsModalOpen(true)} className="bg-pink-600 hover:bg-pink-700">
                    <Plus className="w-4 h-4 mr-2" /> Add My Schedule
                </Button>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredLives.map(live => (
                <Card key={live.id} className="hover:shadow-md transition-all">
                    <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-lg">@{live.host_username}</span>
                                {live.priority < 3 && <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">🔥 Hot</Badge>}
                            </div>
                            <a 
                                href={`https://tiktok.com/@${live.host_username}`} 
                                target="_blank" 
                                rel="noreferrer"
                                className="p-2 bg-black text-white rounded-full hover:opacity-80"
                            >
                                <LinkIcon className="w-3 h-3" />
                            </a>
                        </div>
                        
                        <div className="space-y-2 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-gray-400" />
                                <span className="font-medium text-gray-900">{live.time}</span>
                                <span className="text-xs">({live.creator_timezone})</span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                <span>
                                    {live.is_recurring 
                                        ? (live.recurring_days || []).join(', ') 
                                        : live.specific_date
                                    }
                                </span>
                            </div>

                            <div className="flex flex-wrap gap-1 mt-2">
                                {(live.live_types || ['regular']).map(type => (
                                    <Badge key={type} variant="secondary" className="text-xs font-normal capitalize">
                                        {type.replace('_', ' ')}
                                    </Badge>
                                ))}
                            </div>
                            
                            {live.notes && (
                                <div className="mt-3 p-2 bg-gray-50 rounded text-xs italic">
                                    "{live.notes}"
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            ))}
            {filteredLives.length === 0 && (
                <div className="col-span-full text-center py-12 text-gray-500">
                    No lives found for this filter. Be the first to add one!
                </div>
            )}
        </div>

        {/* Live Schedule Modal - Needs adaptation to handle "Save" which usually returns array of items */}
        {/* We need to update LiveScheduleModal to allow passing 'group_id' or handle it in parent */}
        {/* For now, using a simplified integration: user edits their 'myLives' via the modal */}
        <LiveScheduleModal 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)}
            lives={myLives}
            onSave={handleSaveLive}
        />
    </div>
  );
}