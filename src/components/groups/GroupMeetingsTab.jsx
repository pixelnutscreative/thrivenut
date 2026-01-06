import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { Video, FileText, Calendar, Plus, Bot, ChevronDown, ChevronUp, Pencil } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function GroupMeetingsTab({ group, currentUser, isAdmin }) {
  const queryClient = useQueryClient();
  const [activeMeetingId, setActiveMeetingId] = useState(null);

  const { data: meetings = [] } = useQuery({
    queryKey: ['groupMeetings', group.id],
    queryFn: () => base44.entities.MeetingRecording.filter({ group_id: group.id }, '-meeting_date'),
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Meetings & Transcripts</h2>
          <p className="text-gray-500">Recordings, notes, and AI insights from our calls.</p>
        </div>
        {isAdmin && <AddMeetingDialog groupId={group.id} currentUser={currentUser} />}
      </div>

      <div className="grid gap-4">
        {meetings.map(meeting => (
           <MeetingCard 
             key={meeting.id} 
             meeting={meeting} 
             isAdmin={isAdmin}
             isExpanded={activeMeetingId === meeting.id}
             onToggle={() => setActiveMeetingId(activeMeetingId === meeting.id ? null : meeting.id)}
           />
        ))}
        {meetings.length === 0 && (
          <div className="text-center py-12 border-2 border-dashed rounded-xl bg-gray-50">
             <Video className="w-12 h-12 mx-auto text-gray-300 mb-2" />
             <p className="text-gray-500">No meetings recorded yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function MeetingCard({ meeting, isExpanded, onToggle, isAdmin }) {
  const [aiQuery, setAiQuery] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  const handleAskAI = async () => {
    if (!aiQuery) return;
    setIsAiLoading(true);
    try {
      // Use InvokeLLM since we have the transcript
      const prompt = `Based on the following meeting transcript, please answer the user's question.\n\nTranscript: ${meeting.transcript.substring(0, 15000)}\n\nUser Question: ${aiQuery}`;
      
      const res = await base44.integrations.Core.InvokeLLM({
         prompt: prompt,
      });
      setAiResponse(res);
    } catch (err) {
      setAiResponse("Sorry, I couldn't process that request.");
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <Card className="overflow-hidden">
      <div className="p-6 cursor-pointer hover:bg-gray-50 transition-colors" onClick={onToggle}>
        <div className="flex justify-between items-start">
           <div className="flex gap-4">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                 <Video className="w-6 h-6" />
              </div>
              <div>
                 <h3 className="font-bold text-lg">{meeting.title}</h3>
                 <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                    <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {format(new Date(meeting.meeting_date), 'PPP p')}</span>
                    {meeting.hours > 0 && (
                      <span className="bg-gray-100 px-2 py-0.5 rounded-full text-xs font-medium text-gray-700">
                        {meeting.hours}h Logged
                      </span>
                    )}
                    {meeting.attendees && meeting.attendees.length > 0 && (
                       <span>{meeting.attendees.length} Attendees</span>
                    )}
                 </div>
              </div>
           </div>
           <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
             {isAdmin && <EditMeetingDialog meeting={meeting} />}
             <button onClick={onToggle} className="p-1 hover:bg-gray-100 rounded-full">
               {isExpanded ? <ChevronUp className="text-gray-400" /> : <ChevronDown className="text-gray-400" />}
             </button>
           </div>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            initial={{ height: 0 }} 
            animate={{ height: 'auto' }} 
            exit={{ height: 0 }} 
            className="overflow-hidden border-t bg-gray-50"
          >
            <div className="p-6 space-y-6">
               {meeting.video_url && (
                 <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2"><Video className="w-4 h-4" /> Recording</h4>
                    <a href={meeting.video_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
                       {meeting.video_url}
                    </a>
                 </div>
               )}

               {meeting.transcript && (
                 <div className="grid md:grid-cols-2 gap-6">
                    <div>
                       <h4 className="font-medium mb-2 flex items-center gap-2"><FileText className="w-4 h-4" /> Transcript</h4>
                       <div className="bg-white p-4 rounded-lg border h-64 overflow-y-auto text-sm text-gray-600 whitespace-pre-wrap">
                          {meeting.transcript}
                       </div>
                    </div>
                    
                    {/* AI Q&A Section */}
                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                       <h4 className="font-medium mb-2 flex items-center gap-2 text-purple-900"><Bot className="w-4 h-4" /> Ask AI about this meeting</h4>
                       <div className="space-y-3">
                          <div className="flex gap-2">
                             <Input 
                               placeholder="e.g. What were the action items?" 
                               value={aiQuery}
                               onChange={e => setAiQuery(e.target.value)}
                               className="bg-white"
                             />
                             <Button onClick={handleAskAI} disabled={!aiQuery || isAiLoading} className="bg-purple-600 hover:bg-purple-700">
                                {isAiLoading ? '...' : 'Ask'}
                             </Button>
                          </div>
                          {aiResponse && (
                             <div className="bg-white p-3 rounded border text-sm text-gray-800 animate-in fade-in">
                                {aiResponse}
                             </div>
                          )}
                       </div>
                    </div>
                 </div>
               )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

function AddMeetingDialog({ groupId, currentUser }) {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState({ 
    title: '', 
    meeting_date: '', 
    attendees: '', 
    video_url: '', 
    transcript: '',
    hours: '0'
  });

  const mutation = useMutation({
    mutationFn: (meeting) => base44.entities.MeetingRecording.create({
      ...meeting,
      group_id: groupId,
      hours: parseFloat(meeting.hours) || 0,
      attendees: meeting.attendees.split(',').map(e => e.trim()).filter(Boolean)
    }),
    onSuccess: async (newMeeting) => {
      queryClient.invalidateQueries(['groupMeetings', groupId]);
      setIsOpen(false);
      const meetingTitle = data.title; // Capture title before reset
      setData({ title: '', meeting_date: '', attendees: '', video_url: '', transcript: '', hours: '0' });
      alert("Meeting added! Members have been notified.");

      // Notify group members
      try {
        await base44.functions.invoke('notifyGroupMembers', {
          group_id: groupId,
          title: `New Meeting: ${meetingTitle}`,
          message: `A new meeting has been added to the group.`,
          link: `/CreatorGroups?id=${groupId}&tab=meetings`,
          type: 'group_meeting_added',
          exclude_email: currentUser?.email
        });
      } catch (err) {
        console.error("Failed to send notification", err);
      }
    }
  });

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="w-4 h-4 mr-2" /> Add Meeting</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>Add Meeting Record</DialogTitle></DialogHeader>
        <div className="grid gap-4 py-4">
           <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                 <label className="text-sm font-medium">Title</label>
                 <Input value={data.title} onChange={e => setData({...data, title: e.target.value})} placeholder="Weekly Sync" />
              </div>
              <div className="space-y-2">
                 <label className="text-sm font-medium">Date & Time</label>
                 <Input type="datetime-local" value={data.meeting_date} onChange={e => setData({...data, meeting_date: e.target.value})} />
              </div>
              </div>
              <div className="space-y-2">
              <label className="text-sm font-medium">Duration (Hours)</label>
              <Input 
                type="number" 
                step="0.25" 
                value={data.hours} 
                onChange={e => setData({...data, hours: e.target.value})} 
                placeholder="1.0"
              />
              <p className="text-xs text-gray-500">Time to deduct from retainer package.</p>
              </div>
              <div className="space-y-2">
              <label className="text-sm font-medium">Attendees (comma separated emails)</label>
              <Input value={data.attendees} onChange={e => setData({...data, attendees: e.target.value})} placeholder="alice@example.com, bob@example.com" />
           </div>
           <div className="space-y-2">
              <label className="text-sm font-medium">Video URL (Optional)</label>
              <Input value={data.video_url} onChange={e => setData({...data, video_url: e.target.value})} placeholder="https://..." />
           </div>
           <div className="space-y-2">
              <label className="text-sm font-medium">Transcript</label>
              <Textarea 
                 value={data.transcript} 
                 onChange={e => setData({...data, transcript: e.target.value})} 
                 placeholder="Paste full transcript here..." 
                 className="h-32"
              />
           </div>
        </div>
        <DialogFooter>
          <Button onClick={() => mutation.mutate(data)} disabled={!data.title || !data.meeting_date}>Save Meeting</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditMeetingDialog({ meeting }) {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState({ 
    title: meeting.title, 
    meeting_date: meeting.meeting_date ? new Date(meeting.meeting_date).toISOString().slice(0, 16) : '', 
    attendees: (meeting.attendees || []).join(', '), 
    video_url: meeting.video_url || '', 
    transcript: meeting.transcript || '',
    hours: meeting.hours?.toString() || '0'
  });

  const mutation = useMutation({
    mutationFn: (updatedData) => base44.entities.MeetingRecording.update(meeting.id, {
      ...updatedData,
      hours: parseFloat(updatedData.hours) || 0,
      attendees: updatedData.attendees.split(',').map(e => e.trim()).filter(Boolean)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['groupMeetings']);
      setIsOpen(false);
    }
  });

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8"><Pencil className="w-4 h-4" /></Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>Edit Meeting</DialogTitle></DialogHeader>
        <div className="grid gap-4 py-4">
           <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                 <label className="text-sm font-medium">Title</label>
                 <Input value={data.title} onChange={e => setData({...data, title: e.target.value})} placeholder="Weekly Sync" />
              </div>
              <div className="space-y-2">
                 <label className="text-sm font-medium">Date & Time</label>
                 <Input type="datetime-local" value={data.meeting_date} onChange={e => setData({...data, meeting_date: e.target.value})} />
              </div>
              </div>
              <div className="space-y-2">
              <label className="text-sm font-medium">Duration (Hours)</label>
              <Input 
                type="number" 
                step="0.25" 
                value={data.hours} 
                onChange={e => setData({...data, hours: e.target.value})} 
                placeholder="1.0"
              />
              <p className="text-xs text-gray-500">Time to deduct from retainer package.</p>
              </div>
              <div className="space-y-2">
              <label className="text-sm font-medium">Attendees (comma separated emails)</label>
              <Input value={data.attendees} onChange={e => setData({...data, attendees: e.target.value})} placeholder="alice@example.com, bob@example.com" />
           </div>
           <div className="space-y-2">
              <label className="text-sm font-medium">Video URL (Optional)</label>
              <Input value={data.video_url} onChange={e => setData({...data, video_url: e.target.value})} placeholder="https://..." />
           </div>
           <div className="space-y-2">
              <label className="text-sm font-medium">Transcript</label>
              <Textarea 
                 value={data.transcript} 
                 onChange={e => setData({...data, transcript: e.target.value})} 
                 placeholder="Paste full transcript here..." 
                 className="h-32"
              />
           </div>
        </div>
        <DialogFooter>
          <Button onClick={() => mutation.mutate(data)} disabled={!data.title || !data.meeting_date}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}