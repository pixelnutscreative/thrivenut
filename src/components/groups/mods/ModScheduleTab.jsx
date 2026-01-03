import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, Users, UserPlus, CheckCircle, XCircle, AlertCircle, Plus, Filter, Mail, Trash2 } from 'lucide-react';
import { format, isSameDay, startOfWeek, addDays, startOfDay, endOfDay, parseISO } from 'date-fns';

export default function ModScheduleTab({ group, currentUser, isAdmin }) {
  const [view, setView] = useState('upcoming'); // upcoming, my_shifts, open, reports
  const [selectedDate, setSelectedDate] = useState(new Date());

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Mod Schedule</h2>
          <p className="text-gray-500">Manage stream shifts and assignments</p>
        </div>
        {isAdmin && <CreateShiftButton group={group} />}
      </div>

      <Tabs value={view} onValueChange={setView} className="w-full">
        <TabsList className="bg-white border p-1 rounded-lg w-full sm:w-auto justify-start h-auto flex-wrap">
          <TabsTrigger value="upcoming" className="px-4 py-2"><Calendar className="w-4 h-4 mr-2" /> Schedule</TabsTrigger>
          <TabsTrigger value="my_shifts" className="px-4 py-2"><CheckCircle className="w-4 h-4 mr-2" /> My Shifts</TabsTrigger>
          <TabsTrigger value="open" className="px-4 py-2"><UserPlus className="w-4 h-4 mr-2" /> Open Shifts</TabsTrigger>
          {isAdmin && <TabsTrigger value="reports" className="px-4 py-2"><Filter className="w-4 h-4 mr-2" /> Reports</TabsTrigger>}
        </TabsList>

        <div className="mt-6">
          <TabsContent value="upcoming">
             <ScheduleView group={group} isAdmin={isAdmin} currentUser={currentUser} />
          </TabsContent>
          <TabsContent value="my_shifts">
             <MyShiftsView group={group} currentUser={currentUser} />
          </TabsContent>
          <TabsContent value="open">
             <OpenShiftsView group={group} currentUser={currentUser} />
          </TabsContent>
          {isAdmin && (
            <TabsContent value="reports">
               <ModReportsView group={group} />
            </TabsContent>
          )}
        </div>
      </Tabs>
    </div>
  );
}

function CreateShiftButton({ group }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: 'Live Stream',
    date: format(new Date(), 'yyyy-MM-dd'),
    startTime: '10:00',
    endTime: '12:00',
    capacity: 2,
    recurring: false,
    recurrenceCount: 1
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      // Safe date parsing for Safari
      const start = new Date(formData.date + 'T' + formData.startTime + ':00');
      const end = new Date(formData.date + 'T' + formData.endTime + ':00');
      
      const shifts = [];
      // Simple random ID for recurrence grouping to avoid crypto issues in some environments
      const recurrenceGroupId = formData.recurring ? Math.random().toString(36).substring(2) + Date.now().toString(36) : null;

      // Create main shift
      shifts.push({
        group_id: group.id,
        title: formData.title,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        capacity_needed: parseInt(formData.capacity),
        recurrence_group_id: recurrenceGroupId
      });

      // Handle simple weekly recurrence
      if (formData.recurring && formData.recurrenceCount > 1) {
        for (let i = 1; i < formData.recurrenceCount; i++) {
           const nextStart = addDays(start, i * 7); // Weekly
           const nextEnd = addDays(end, i * 7);
           shifts.push({
             group_id: group.id,
             title: formData.title,
             start_time: nextStart.toISOString(),
             end_time: nextEnd.toISOString(),
             capacity_needed: parseInt(formData.capacity),
             recurrence_group_id: recurrenceGroupId
           });
        }
      }

      await base44.entities.ModShift.bulkCreate(shifts);
      
      // Notify mods (optional, maybe just create for now)
      // await base44.functions.invoke('notifyMods', { action: 'notify_available', groupId: group.id, modEmails: ... })
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['modShifts']);
      setOpen(false);
      alert('Shifts created!');
    }
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4 mr-2" /> Add Shift
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Schedule Stream Shift</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Mods Needed</Label>
              <Input type="number" min="1" value={formData.capacity} onChange={e => setFormData({...formData, capacity: e.target.value})} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Time</Label>
              <Input type="time" value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>End Time</Label>
              <Input type="time" value={formData.endTime} onChange={e => setFormData({...formData, endTime: e.target.value})} />
            </div>
          </div>
          
          <div className="flex items-center justify-between border p-3 rounded-lg bg-gray-50">
             <Label className="cursor-pointer">Repeat Weekly?</Label>
             <input type="checkbox" checked={formData.recurring} onChange={e => setFormData({...formData, recurring: e.target.checked})} className="w-4 h-4" />
          </div>
          
          {formData.recurring && (
             <div className="space-y-2">
               <Label>For how many weeks?</Label>
               <Select value={formData.recurrenceCount.toString()} onValueChange={v => setFormData({...formData, recurrenceCount: parseInt(v)})}>
                 <SelectTrigger><SelectValue /></SelectTrigger>
                 <SelectContent>
                   <SelectItem value="2">2 Weeks</SelectItem>
                   <SelectItem value="4">4 Weeks</SelectItem>
                   <SelectItem value="8">8 Weeks</SelectItem>
                   <SelectItem value="12">12 Weeks</SelectItem>
                 </SelectContent>
               </Select>
             </div>
          )}
        </div>
        <DialogFooter>
          <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Creating...' : 'Create Shifts'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ScheduleView({ group, isAdmin, currentUser }) {
  const { data: shifts = [] } = useQuery({
    queryKey: ['modShifts', group.id],
    queryFn: () => base44.entities.ModShift.filter({ group_id: group.id }, 'start_time', 50)
  });

  // Simple list view for now, grouped by date
  const grouped = useMemo(() => {
    const g = {};
    shifts.forEach(s => {
      const dateKey = format(new Date(s.start_time), 'yyyy-MM-dd');
      if (!g[dateKey]) g[dateKey] = [];
      g[dateKey].push(s);
    });
    return Object.entries(g).sort((a, b) => a[0].localeCompare(b[0]));
  }, [shifts]);

  if (shifts.length === 0) return <EmptyState />;

  return (
    <div className="space-y-8">
      {grouped.map(([date, dayShifts]) => (
        <div key={date} className="space-y-3">
          <h3 className="font-semibold text-gray-500 sticky top-0 bg-gray-50/95 backdrop-blur p-2 rounded-lg border-b z-10">
            {format(new Date(date), 'EEEE, MMMM do')}
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            {dayShifts.map(shift => (
              <ShiftCard key={shift.id} shift={shift} isAdmin={isAdmin} currentUser={currentUser} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ShiftCard({ shift, isAdmin, currentUser }) {
  const queryClient = useQueryClient();
  const { data: assignments = [] } = useQuery({
    queryKey: ['shiftAssignments', shift.id],
    queryFn: () => base44.entities.ModAssignment.filter({ shift_id: shift.id })
  });

  const myAssignment = assignments.find(a => a.user_email === currentUser.email);
  const acceptedCount = assignments.filter(a => a.status === 'accepted').length;
  const isFull = acceptedCount >= shift.capacity_needed;

  const joinMutation = useMutation({
    mutationFn: () => base44.entities.ModAssignment.create({
      shift_id: shift.id,
      user_email: currentUser.email,
      status: 'accepted', // Auto accept for now if open
      assigned_by: currentUser.email
    }),
    onSuccess: () => queryClient.invalidateQueries(['shiftAssignments', shift.id])
  });

  const leaveMutation = useMutation({
    mutationFn: (id) => base44.entities.ModAssignment.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['shiftAssignments', shift.id])
  });

  const deleteShiftMutation = useMutation({
    mutationFn: () => base44.entities.ModShift.delete(shift.id),
    onSuccess: () => queryClient.invalidateQueries(['modShifts'])
  });

  return (
    <Card className="border-l-4 border-l-indigo-500 shadow-sm">
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h4 className="font-bold text-gray-900">{shift.title}</h4>
            <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
              <Clock className="w-4 h-4" />
              {format(new Date(shift.start_time), 'h:mm a')} - {format(new Date(shift.end_time), 'h:mm a')}
            </div>
          </div>
          <div className="text-right">
             <Badge variant={isFull ? "secondary" : "outline"} className={isFull ? "bg-gray-100 text-gray-500" : "text-green-600 border-green-200 bg-green-50"}>
               {acceptedCount} / {shift.capacity_needed} Mods
             </Badge>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 items-center">
           {assignments.map(a => (
             <div key={a.id} className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-full text-xs">
                <div className="w-4 h-4 rounded-full bg-indigo-200 flex items-center justify-center text-indigo-700 text-[10px] font-bold">
                  {a.user_email[0].toUpperCase()}
                </div>
                <span className="truncate max-w-[100px]">{a.user_email}</span>
             </div>
           ))}
        </div>

        <div className="mt-4 pt-4 border-t flex justify-between items-center">
           <div>
             {myAssignment ? (
               <Button variant="outline" size="sm" onClick={() => leaveMutation.mutate(myAssignment.id)} className="text-red-600 hover:bg-red-50 border-red-200">
                 Leave Shift
               </Button>
             ) : (
               !isFull && (
                 <Button size="sm" onClick={() => joinMutation.mutate()} className="bg-green-600 hover:bg-green-700">
                   Claim Shift
                 </Button>
               )
             )}
           </div>
           
           {isAdmin && (
             <Button variant="ghost" size="sm" onClick={() => deleteShiftMutation.mutate()} className="text-gray-400 hover:text-red-600">
               <Trash2 className="w-4 h-4" />
             </Button>
           )}
        </div>
      </CardContent>
    </Card>
  );
}

function OpenShiftsView({ group, currentUser }) {
  // Logic: Filter shifts where count < capacity AND user is not assigned
  // For simplicity reusing ScheduleView with visual cues or filtering in query
  // Let's implement a filtered query if possible or client side filter
  const { data: shifts = [] } = useQuery({
    queryKey: ['modShifts', group.id],
    queryFn: () => base44.entities.ModShift.filter({ group_id: group.id, status: 'open' }) // Assuming 'open' status maintenance
  });
  
  // Client side filtering for 'not assigned' requires fetching all assignments which is heavy.
  // We'll rely on the Card logic to show "Claim" button.
  
  return <ScheduleView group={group} isAdmin={false} currentUser={currentUser} />;
}

function MyShiftsView({ group, currentUser }) {
  // We need to fetch assignments first
  const { data: myAssignments = [] } = useQuery({
    queryKey: ['myAssignments', group.id, currentUser.email],
    queryFn: () => base44.entities.ModAssignment.filter({ user_email: currentUser.email })
  });

  const shiftIds = myAssignments.map(a => a.shift_id);
  
  const { data: shifts = [] } = useQuery({
    queryKey: ['myShiftDetails', shiftIds],
    queryFn: async () => {
       if (shiftIds.length === 0) return [];
       // Bulk fetch logic needed or Promise.all. 
       // Filter doesn't support 'in' array easily in this SDK version usually? 
       // We'll do Promise.all for now or improved backend support.
       // Actually filter supports simple queries. We might need loop.
       const results = await Promise.all(shiftIds.map(id => base44.entities.ModShift.filter({ id })));
       return results.flat().filter(s => s.group_id === group.id); // Ensure group match
    },
    enabled: shiftIds.length > 0
  });

  if (shifts.length === 0) return <EmptyState message="You haven't signed up for any shifts yet." />;

  return (
    <div className="grid gap-4 md:grid-cols-2">
       {shifts.sort((a,b) => new Date(a.start_time) - new Date(b.start_time)).map(shift => (
         <ShiftCard key={shift.id} shift={shift} isAdmin={false} currentUser={currentUser} />
       ))}
    </div>
  );
}

function ModReportsView({ group }) {
  // Fetch all past shifts
  // Calculate total hours per mod
  const { data: shifts = [] } = useQuery({
    queryKey: ['pastShifts', group.id],
    queryFn: () => base44.entities.ModShift.filter({ group_id: group.id }) // Should date filter ideally
  });

  // We need assignments for ALL shifts to calc stats
  // This is potentially heavy. 
  // Optimization: Create a backend function `generateModReport` as planned?
  // Let's stick to client side for MVP if data is small.
  
  // Placeholder UI
  return (
    <div className="text-center py-12 bg-gray-50 rounded-lg">
       <Filter className="w-12 h-12 mx-auto text-gray-300 mb-2" />
       <h3 className="text-lg font-medium">Reports Coming Soon</h3>
       <p className="text-gray-500">Track mod attendance and hours here.</p>
    </div>
  );
}

function EmptyState({ message = "No shifts scheduled." }) {
  return (
    <div className="text-center py-12 border-2 border-dashed rounded-xl bg-gray-50/50">
      <Calendar className="w-12 h-12 mx-auto text-gray-300 mb-3" />
      <p className="text-gray-500">{message}</p>
    </div>
  );
}