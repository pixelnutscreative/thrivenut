import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
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
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    occurrences: [{ start_time: '', end_time: '' }],
    link: '',
    location: '',
    target_levels: [],
    target_users: []
  });

  // Recurrence controls
  const [repeatWeekly, setRepeatWeekly] = useState(false);
  const [repeatDays, setRepeatDays] = useState([]);
  const [repeatWeeks, setRepeatWeeks] = useState(8);
  const [repeatNoEnd, setRepeatNoEnd] = useState(false);

   const { data: events = [] } = useQuery({
    queryKey: ['groupEvents', group.id],
    queryFn: () => base44.entities.GroupEvent.filter({ group_id: group.id }, 'start_time'),
  });

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
    setFormData({
      title: event.title,
      description: event.description || '',
      start_time: event.start_time,
      end_time: event.end_time || '',
      occurrences: (event.occurrences && event.occurrences.length > 0)
        ? event.occurrences
        : [{ start_time: event.start_time || '', end_time: event.end_time || '' }],
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
        occurrences: [{ start_time: '', end_time: '' }],
        link: '',
        location: '',
        target_levels: [],
        target_users: []
      });
      };

  const handleSubmit = () => {
    let occ = (formData.occurrences || []).filter(o => o.start_time);

    // If repeating weekly, generate future sessions based on first occurrence
    if (repeatWeekly && repeatDays.length > 0 && occ.length > 0 && occ[0].start_time) {
      const first = new Date(occ[0].start_time);
      const endFirst = occ[0].end_time ? new Date(occ[0].end_time) : null;
      const durationMs = endFirst ? (endFirst - first) : 0;

      // Find the Sunday of the week for the first date
      const weekStart = new Date(first);
      weekStart.setHours(0,0,0,0);
      weekStart.setDate(first.getDate() - first.getDay());

      const hours = first.getHours();
      const minutes = first.getMinutes();

      const generated = [];
      const weeksToGenerate = repeatNoEnd ? 52 : repeatWeeks;
      for (let w = 0; w < weeksToGenerate; w++) {
        for (const d of repeatDays) {
          const dt = new Date(weekStart);
          dt.setDate(weekStart.getDate() + d + w * 7);
          dt.setHours(hours, minutes, 0, 0);
          const startIso = new Date(dt).toISOString();
          const endIso = durationMs > 0 ? new Date(dt.getTime() + durationMs).toISOString() : '';
          generated.push({ start_time: startIso, end_time: endIso });
        }
      }

      // Ensure the very first is present (avoid duplicates)
      const all = [...generated, ...occ];
      // Deduplicate by start_time
      const map = new Map();
      all.forEach(o => { if (o.start_time) map.set(o.start_time, o); });
      occ = Array.from(map.values()).sort((a,b) => new Date(a.start_time) - new Date(b.start_time));
    }

    const primary = occ[0] || { start_time: formData.start_time, end_time: formData.end_time };
    const toSubmit = {
      ...formData,
      start_time: primary?.start_time || '',
      end_time: primary?.end_time || '',
      occurrences: occ
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
              <Button onClick={() => setIsDialogOpen(true)}><Plus className="w-4 h-4 mr-2" /> Add Event</Button>
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

                <div className="space-y-3">
                  <label className="text-sm font-medium">Event Dates & Times</label>
                  {(formData.occurrences || []).map((occ, idx) => (
                    <div key={idx} className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-center">
                      <Input
                        type="datetime-local"
                        value={occ.start_time}
                        onChange={e => {
                          const occurrences = [...(formData.occurrences || [])];
                          occurrences[idx] = { ...occurrences[idx], start_time: e.target.value };
                          setFormData({ ...formData, occurrences });
                        }}
                        placeholder="Start"
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
                      />
                      <div className="sm:col-span-2 flex justify-end">
                        {(formData.occurrences || []).length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-red-500"
                            onClick={() => {
                              const occurrences = (formData.occurrences || []).filter((_, i) => i !== idx);
                              setFormData({ ...formData, occurrences });
                            }}
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setFormData({ ...formData, occurrences: [...(formData.occurrences || []), { start_time: '', end_time: '' }] })}
                  >
                    + Add another date/time
                  </Button>
                </div>

                <div className="space-y-3 border-t pt-4">
                  <label className="text-sm font-medium">Repeat</label>
                  <div className="flex items-center gap-2">
                    <input
                      id="repeat-weekly"
                      type="checkbox"
                      checked={repeatWeekly}
                      onChange={(e) => setRepeatWeekly(e.target.checked)}
                    />
                    <label htmlFor="repeat-weekly" className="text-sm">Repeat weekly</label>
                  </div>

                  {repeatWeekly && (
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setRepeatDays((prev) => prev.includes(idx) ? prev.filter(x => x !== idx) : [...prev, idx]);
                            }}
                            className={`px-3 py-1 rounded border text-sm ${repeatDays.includes(idx) ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-700 border-gray-200'}`}
                          >
                            {d}
                          </button>
                        ))}
                      </div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">Generate</span>
                          <Input
                            type="number"
                            min={1}
                            max={52}
                            disabled={repeatNoEnd}
                            value={repeatWeeks}
                            onChange={(e) => setRepeatWeeks(Math.max(1, Math.min(52, parseInt(e.target.value || '1'))))}
                            className="w-20"
                          />
                          <span className="text-sm text-gray-600">weeks of sessions</span>
                        </div>
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                          <input
                            type="checkbox"
                            checked={repeatNoEnd}
                            onChange={(e) => setRepeatNoEnd(e.target.checked)}
                            className="rounded border-gray-300"
                          />
                          No end
                        </label>
                      </div>
                      <p className="text-xs text-gray-500">We’ll keep the same time as your first session and create upcoming weekly sessions on the selected days.</p>
                    </div>
                  )}
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

      <div className="grid gap-4">
        {visibleEvents.map(event => (
          <Card key={event.id}>
            <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-start">
              <div className="bg-purple-100 text-purple-700 p-3 rounded-lg text-center min-w-[80px]">
                <div className="text-xs font-bold uppercase">{event.start_time ? format(new Date(event.start_time), 'MMM') : 'TBA'}</div>
                <div className="text-2xl font-bold">{event.start_time ? format(new Date(event.start_time), 'd') : '--'}</div>
                <div className="text-xs">{event.start_time ? format(new Date(event.start_time), 'h:mm a') : ''}</div>
              </div>
              
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-lg">{event.title}</h4>
                  {(isAdmin || event.created_by === currentUser?.email) && (
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(event)} className="text-gray-500 h-6 w-6 p-0 hover:text-purple-600" title="Edit">
                        <Pencil className="w-4 h-4" />
                      </Button>
                      {isAdmin && (
                        <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(event.id)} className="text-red-500 h-6 w-6 p-0" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
                <div className="prose prose-sm text-gray-600 mt-1 max-w-none" dangerouslySetInnerHTML={{ __html: event.description }} />
                
                {event.edited_by && (
                  <p className="text-xs text-purple-400 italic mt-2">
                    Edited by {event.edited_by === currentUser?.email ? 'you' : event.edited_by} on {new Date(event.edited_at).toLocaleDateString()}
                  </p>
                )}

                {Array.isArray(event.occurrences) && event.occurrences.length > 1 && (
                  <div className="mt-2 text-sm text-gray-600">
                    <div className="font-medium">Other sessions:</div>
                    <ul className="list-disc ml-5">
                      {event.occurrences.slice(1).map((o, i) => (
                        <li key={i}>
                          {o.start_time ? `${format(new Date(o.start_time), 'EEE, MMM d, h:mm a')}${o.end_time ? ` - ${format(new Date(o.end_time), 'h:mm a')}` : ''}` : ''}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="mt-4 pt-4 border-t flex flex-wrap gap-2 justify-between items-center">
                  <div className="flex gap-4 text-sm text-gray-500">
                    {event.link && (
                      <a href={event.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-600 hover:underline">
                        <LinkIcon className="w-4 h-4" /> Join Link
                      </a>
                    )}
                    {event.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" /> {event.location}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="gap-2 text-purple-600 border-purple-200 hover:bg-purple-50"
                      onClick={() => handleAddToMyDay(event)}
                    >
                      <CalendarPlus className="w-3 h-3" /> Add to My Day
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="gap-2 text-gray-500"
                      onClick={() => handleShare(event)}
                    >
                      <Share2 className="w-3 h-3" /> Share
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {visibleEvents.length === 0 && <div className="text-center py-12 text-gray-500">No upcoming events.</div>}
      </div>
    </div>
  );
}