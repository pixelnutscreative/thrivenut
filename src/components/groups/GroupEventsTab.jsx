import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useTheme } from '../shared/useTheme';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Calendar, MapPin, Link as LinkIcon, Plus, Trash2, Pencil, Share2, CalendarPlus } from 'lucide-react';
import { format } from 'date-fns';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import LevelSelector from './LevelSelector';
import MemberSelector from './MemberSelector';

export default function GroupEventsTab({ group, currentUser, myMembership, isAdmin }) {
  const { preferences } = useTheme();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    occurrences: [],
    link: '',
    location: '',
    target_levels: [],
    target_users: []
  });

  const { data: events = [] } = useQuery({
    queryKey: ['groupEvents', group.id],
    queryFn: async () => {
      const allEvents = await base44.entities.GroupEvent.filter({ group_id: group.id }, '-start_time');
      // Deduplicate by ID just in case
      const uniqueEvents = Array.from(new Map(allEvents.map(item => [item.id, item])).values());
      return uniqueEvents;
    },
  });

  // Handle Edit from URL
  useEffect(() => {
    const editId = searchParams.get('editId');
    if (editId && events.length > 0 && !isDialogOpen && !editingId) {
      const event = events.find(e => e.id === editId);
      if (event) {
        handleEdit(event);
        // Clear param so it doesn't reopen on close
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('editId');
        setSearchParams(newParams);
      }
    }
  }, [searchParams, events]);

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const event = await base44.entities.GroupEvent.create({ ...data, group_id: group.id, created_by: currentUser?.email });
      // Send notifications to group members
      try {
        await base44.functions.invoke('notifyGroupMembers', {
          group_id: group.id,
          title: `New Event: ${group.name}`,
          message: `New event scheduled: ${data.title}`,
          type: 'group_event',
          link: `/CreatorGroups?id=${group.id}&tab=events`
        });
      } catch (err) {
        console.error("Failed to send notifications", err);
      }
      return event;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['groupEvents', group.id]);
      handleCloseDialog();
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.GroupEvent.update(editingId, {
      ...data,
      edited_by: currentUser?.email,
      edited_at: new Date().toISOString()
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['groupEvents', group.id]);
      handleCloseDialog();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.GroupEvent.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['groupEvents', group.id])
  });

  const addToMyDayMutation = useMutation({
    mutationFn: async ({ event, isUrgent }) => {
      // Ensure date is YYYY-MM-DD
      const dateStr = event.start_time.split('T')[0];
      
      // Ensure time is HH:mm
      const timeStr = new Date(event.start_time).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });

      // Create ExternalEvent for My Day
      return await base44.entities.ExternalEvent.create({
        title: event.title,
        description: `Group Event: ${group.name}\n\n${event.description || ''}`,
        date: dateStr,
        time: timeStr,
        platform: 'Other',
        url: event.link || window.location.href,
        location: event.location,
        is_urgent: isUrgent,
        created_by: currentUser?.email
      });
    },
    onSuccess: () => {
      alert('Event added to My Day! (Check date if not today)');
      queryClient.invalidateQueries(['manualEventsToday']);
    }
  });

  const handleShare = async (event) => {
    const shareData = {
      title: event.title,
      text: `Check out this event in ${group.name}: ${event.title}`,
      url: window.location.href, // Or a deep link if possible
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
      alert('Link copied to clipboard!');
    }
  };

  const handleAddToMyDay = (event) => {
    const isUrgent = window.confirm('Mark this event as URGENT? (It will appear at the top of your dashboard)');
    addToMyDayMutation.mutate({ event, isUrgent });
  };

  const handleEdit = (event) => {
    setEditingId(event.id);
    
    // Transform existing occurrences to include ID and default recurrence (disabled)
    const existingOcc = (event.occurrences && event.occurrences.length > 0)
      ? event.occurrences.map((o, idx) => ({
          ...o,
          id: Date.now() + idx,
          recurrence: { enabled: false, days: [], weeks: 8, noEnd: false }
        }))
      : [{ 
          id: Date.now(), 
          start_time: event.start_time || '', 
          end_time: event.end_time || '', 
          recurrence: { enabled: false, days: [], weeks: 8, noEnd: false } 
        }];

    setFormData({
      title: event.title,
      description: event.description || '',
      start_time: event.start_time,
      end_time: event.end_time || '',
      occurrences: existingOcc,
      link: event.link || '',
      location: event.location || '',
      target_levels: event.target_levels || [],
      target_users: event.target_users || []
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingId(null);
    setFormData({
      title: '',
      description: '',
      start_time: '',
      end_time: '',
      occurrences: [],
      link: '',
      location: '',
      target_levels: [],
      target_users: []
    });
  };

  const handleSubmit = () => {
    let finalOccurrences = [];
    
    // Filter out empty occurrences
    const validOccurrences = (formData.occurrences || []).filter(o => o.start_time);
    
    validOccurrences.forEach(occ => {
      // Add the original occurrence
      finalOccurrences.push({
        start_time: occ.start_time,
        end_time: occ.end_time
      });

      // Handle Recurrence
      if (occ.recurrence?.enabled && occ.recurrence.days?.length > 0) {
        const first = new Date(occ.start_time);
        const endFirst = occ.end_time ? new Date(occ.end_time) : null;
        const durationMs = endFirst ? (endFirst - first) : 0;
        
        const weekStart = new Date(first);
        weekStart.setHours(0,0,0,0);
        weekStart.setDate(first.getDate() - first.getDay()); // Sunday of that week
        
        const hours = first.getHours();
        const minutes = first.getMinutes();
        
        const weeksToGenerate = occ.recurrence.noEnd ? 52 : (occ.recurrence.weeks || 8);
        
        for (let w = 0; w < weeksToGenerate; w++) {
          for (const d of occ.recurrence.days) {
            const dt = new Date(weekStart);
            dt.setDate(weekStart.getDate() + d + (w * 7));
            dt.setHours(hours, minutes, 0, 0);
            
            // Don't duplicate the original start time
            if (Math.abs(dt.getTime() - first.getTime()) < 60000) continue;
            
            // Skip past dates if needed, but usually we generate from the first date
            
            const startIso = dt.toISOString();
            const endIso = durationMs > 0 ? new Date(dt.getTime() + durationMs).toISOString() : '';
            
            finalOccurrences.push({ start_time: startIso, end_time: endIso });
          }
        }
      }
    });

    // Deduplicate and Sort
    const uniqueMap = new Map();
    finalOccurrences.forEach(o => uniqueMap.set(o.start_time, o));
    const sortedOcc = Array.from(uniqueMap.values()).sort((a,b) => new Date(a.start_time) - new Date(b.start_time));

    const primary = sortedOcc[0] || { start_time: formData.start_time, end_time: formData.end_time };
    
    const toSubmit = {
      ...formData,
      start_time: primary?.start_time || '',
      end_time: primary?.end_time || '',
      occurrences: sortedOcc
    };

    if (editingId) {
      updateMutation.mutate(toSubmit);
    } else {
      createMutation.mutate(toSubmit);
    }
  };

  const visibleEvents = events.filter(event => {
    if (isAdmin) return true;
    const levelMatch = !event.target_levels || event.target_levels.length === 0 || event.target_levels.includes(myMembership?.level);
    const userMatch = !event.target_users || event.target_users.length === 0 || event.target_users.includes(myMembership?.user_email);
    return levelMatch && userMatch;
  });

  return (
    <div className="space-y-6">
      {isAdmin && (
        <div className="flex justify-end">
          <Dialog open={isDialogOpen} onOpenChange={(open) => !open && handleCloseDialog()}>
            <DialogTrigger asChild>
              <Button 
                onClick={() => {
                  setIsDialogOpen(true);
                  setFormData(prev => ({ 
                    ...prev, 
                    occurrences: [{
                      id: Date.now(),
                      start_time: '',
                      end_time: '',
                      recurrence: { enabled: false, days: [], weeks: 8, noEnd: false }
                    }]
                  }));
                }} 
                className="text-white hover:opacity-90"
                style={{ backgroundColor: preferences?.primary_color }}
              >
                <Plus className="w-4 h-4 mr-2" /> Add Event
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingId ? 'Edit Event' : 'Add Group Event'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <Input placeholder="Event Title" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                
                <div className="h-48 mb-12">
                  <ReactQuill 
                    theme="snow" 
                    value={formData.description} 
                    onChange={v => setFormData({...formData, description: v})} 
                    className="h-36"
                  />
                </div>

                <div className="space-y-4">
                  <label className="text-sm font-medium">Event Dates & Times</label>
                  {(formData.occurrences || []).map((occ, idx) => (
                    <div key={occ.id || idx} className="border p-3 rounded-lg bg-gray-50 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-center">
                        <Input
                          type="datetime-local"
                          value={occ.start_time}
                          onChange={e => {
                            const occurrences = [...(formData.occurrences || [])];
                            occurrences[idx] = { ...occurrences[idx], start_time: e.target.value };
                            setFormData({ ...formData, occurrences });
                          }}
                          placeholder="Start"
                          className="bg-white"
                        />
                        <Input
                          type="datetime-local"
                          value={occ.end_time || ''}
                          onChange={e => {
                            const occurrences = [...(formData.occurrences || [])];
                            occurrences[idx] = { ...occurrences[idx], end_time: e.target.value };
                            setFormData({ ...formData, occurrences });
                          }}
                          placeholder="End (optional)"
                          className="bg-white"
                        />
                      </div>
                      
                      {/* Per-Occurrence Recurrence Settings */}
                      <div className="flex items-center justify-between">
                         <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                           <input 
                             type="checkbox"
                             checked={occ.recurrence?.enabled || false}
                             onChange={(e) => {
                               const occurrences = [...(formData.occurrences || [])];
                               const isEnabled = e.target.checked;
                               // Initialize default recurrence if enabling
                               const recurrence = occurrences[idx].recurrence || { days: [], weeks: 8, noEnd: false };
                               occurrences[idx] = { 
                                 ...occurrences[idx], 
                                 recurrence: { ...recurrence, enabled: isEnabled } 
                               };
                               setFormData({ ...formData, occurrences });
                             }}
                             className="rounded border-gray-300"
                           />
                           Repeating Session?
                         </label>

                         {(formData.occurrences || []).length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-red-500 h-6 px-2"
                              onClick={() => {
                                const occurrences = (formData.occurrences || []).filter((_, i) => i !== idx);
                                setFormData({ ...formData, occurrences });
                              }}
                            >
                              <Trash2 className="w-3 h-3 mr-1" /> Remove
                            </Button>
                          )}
                      </div>

                      {occ.recurrence?.enabled && (
                        <div className="pl-4 border-l-2 border-indigo-200 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                           <div className="flex flex-wrap gap-2">
                            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d, dIdx) => (
                              <button
                                key={dIdx}
                                type="button"
                                onClick={() => {
                                  const occurrences = [...(formData.occurrences || [])];
                                  const currentDays = occurrences[idx].recurrence.days || [];
                                  const newDays = currentDays.includes(dIdx) 
                                    ? currentDays.filter(x => x !== dIdx) 
                                    : [...currentDays, dIdx];
                                  
                                  occurrences[idx].recurrence = { ...occurrences[idx].recurrence, days: newDays };
                                  setFormData({ ...formData, occurrences });
                                }}
                                className={`px-2 py-1 rounded border text-xs ${
                                  (occ.recurrence.days || []).includes(dIdx) 
                                    ? 'bg-purple-600 text-white border-purple-600' 
                                    : 'bg-white text-gray-700 border-gray-200'
                                }`}
                              >
                                {d}
                              </button>
                            ))}
                          </div>
                          <div className="flex items-center gap-3 flex-wrap">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-600">Generate</span>
                              <Input
                                type="number"
                                min={1}
                                max={52}
                                disabled={occ.recurrence.noEnd}
                                value={occ.recurrence.weeks || 8}
                                onChange={(e) => {
                                  const occurrences = [...(formData.occurrences || [])];
                                  occurrences[idx].recurrence.weeks = Math.max(1, Math.min(52, parseInt(e.target.value || '1')));
                                  setFormData({ ...formData, occurrences });
                                }}
                                className="w-16 h-8 text-xs bg-white"
                              />
                              <span className="text-xs text-gray-600">weeks</span>
                            </div>
                            <label className="flex items-center gap-2 text-xs cursor-pointer">
                              <input
                                type="checkbox"
                                checked={occ.recurrence.noEnd || false}
                                onChange={(e) => {
                                  const occurrences = [...(formData.occurrences || [])];
                                  occurrences[idx].recurrence.noEnd = e.target.checked;
                                  setFormData({ ...formData, occurrences });
                                }}
                                className="rounded border-gray-300"
                              />
                              No end (1 year)
                            </label>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setFormData({ 
                      ...formData, 
                      occurrences: [...(formData.occurrences || []), { 
                        id: Date.now(),
                        start_time: '', 
                        end_time: '',
                        recurrence: { enabled: false, days: [], weeks: 8, noEnd: false }
                      }] 
                    })}
                  >
                    + Add Another Session Time
                  </Button>
                </div>
                <Input placeholder="Link (Zoom, etc)" value={formData.link} onChange={e => setFormData({...formData, link: e.target.value})} />
                <Input placeholder="Location (Optional)" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
                
                <LevelSelector 
                  group={group} 
                  selectedLevels={formData.target_levels} 
                  onChange={(levels) => setFormData({...formData, target_levels: levels})} 
                />

                <div className="space-y-2">
                  <label className="text-sm font-medium">Specific Users (Optional)</label>
                  <MemberSelector
                      group={group}
                      selectedUsers={formData.target_users}
                      onChange={(users) => setFormData({...formData, target_users: users})}
                  />
                </div>

                <DialogFooter>
                  <Button onClick={handleSubmit} disabled={!formData.title}>
                    {editingId ? 'Update Event' : 'Create Event'}
                  </Button>
                  <Button variant="outline" onClick={handleCloseDialog}>Cancel</Button>
                </DialogFooter>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleEvents.map(event => {
          const isPast = event.start_time && new Date(event.start_time) < new Date();
          return (
          <Card key={event.id} className={`flex flex-col h-full hover:shadow-md transition-shadow ${isPast ? 'opacity-60 grayscale bg-gray-50' : ''}`}>
            <CardContent className="p-4 flex flex-col gap-4 flex-1">
              <div className="flex justify-between items-start w-full">
                <div className={`p-2 rounded-lg text-center min-w-[70px] ${isPast ? 'bg-gray-200 text-gray-500' : 'bg-purple-100 text-purple-700'}`}>
                  <div className="text-[10px] font-bold uppercase">{event.start_time ? format(new Date(event.start_time), 'MMM') : 'TBA'}</div>
                  <div className="text-xl font-bold">{event.start_time ? format(new Date(event.start_time), 'd') : '--'}</div>
                  <div className="text-[10px]">{event.start_time ? new Date(event.start_time).toLocaleTimeString([], {hour: 'numeric', minute:'2-digit'}) : ''}</div>
                </div>
                
                {(isAdmin || event.created_by === currentUser?.email) && (
                  <div className="flex gap-1 -mr-2 -mt-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(event)} className="text-gray-400 hover:text-purple-600 h-8 w-8" title="Edit">
                      <Pencil className="w-4 h-4" />
                    </Button>
                    {isAdmin && (
                      <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(event.id)} className="text-gray-400 hover:text-red-500 h-8 w-8" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
              
              <div className="flex-1">
                <h4 className="font-bold text-lg mb-2 leading-tight line-clamp-2">{event.title}</h4>
                <div className="prose prose-sm text-gray-600 text-xs line-clamp-3 mb-3" dangerouslySetInnerHTML={{ __html: event.description }} />
                
                {(() => {
                  const now = new Date();
                  const futureOccurrences = (event.occurrences || [])
                    .filter(o => new Date(o.start_time) > now);

                  if (futureOccurrences.length === 0) return null;

                  return (
                    <div className="text-xs text-purple-600 font-medium mb-2">
                      +{futureOccurrences.length} future sessions
                    </div>
                  );
                })()}

                <div className="space-y-2 mt-auto">
                    {event.link && (
                      <a href={event.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-blue-600 hover:underline truncate">
                        <LinkIcon className="w-3 h-3 flex-shrink-0" /> Join Link
                      </a>
                    )}
                    {event.location && (
                      <div className="flex items-center gap-2 text-xs text-gray-500 truncate">
                        <MapPin className="w-3 h-3 flex-shrink-0" /> {event.location}
                      </div>
                    )}
                </div>
              </div>

              <div className="pt-3 border-t flex gap-2 justify-between mt-auto">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className={`text-xs h-8 flex-1 ${isPast ? 'text-gray-500 border-gray-300' : 'text-purple-600 border-purple-200 hover:bg-purple-50'}`}
                  onClick={() => handleAddToMyDay(event)}
                >
                  <CalendarPlus className="w-3 h-3 mr-1" /> Add
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="text-xs h-8 w-8 px-0 text-gray-500"
                  onClick={() => handleShare(event)}
                >
                  <Share2 className="w-3 h-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )})}
        {visibleEvents.length === 0 && <div className="text-center py-12 text-gray-500">No upcoming events.</div>}
      </div>
    </div>
  );
}