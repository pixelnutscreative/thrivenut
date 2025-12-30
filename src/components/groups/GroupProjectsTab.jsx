import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';
import { Plus, Play, Square, Clock, Calendar, User, FileText, Trash2, CheckCircle2, Circle, MoreVertical, FileDown, Pencil, History } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable'; 
import EditTaskDialog from './EditTaskDialog';

// Helper for permissions
const isVirtualAssistant = (role) => role === 'virtual-assistant';
const isOwnerOrAdmin = (role) => ['owner', 'admin', 'client'].includes(role);

export default function GroupProjectsTab({ group, currentUser, myMembership }) {
  const queryClient = useQueryClient();
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [isTimeReportOpen, setIsTimeReportOpen] = useState(false);
  
  // Projects Query
  const { data: projects = [] } = useQuery({
    queryKey: ['groupProjects', group.id],
    queryFn: () => base44.entities.GroupProject.filter({ group_id: group.id }),
  });

  // Set default active project
  useEffect(() => {
    if (projects.length > 0 && !activeProjectId) {
      setActiveProjectId(projects[0].id);
    }
  }, [projects]);

  return (
    <div className="flex h-[calc(100vh-200px)] min-h-[600px] gap-6">
      {/* Sidebar - Projects List */}
      <div className="w-64 flex-shrink-0 flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-lg">Projects</h3>
          {isOwnerOrAdmin(myMembership.role) && (
            <AddProjectDialog groupId={group.id} />
          )}
        </div>
        <div className="flex-1 overflow-y-auto space-y-2 pr-2">
          {projects.map(project => (
            <div
              key={project.id}
              onClick={() => setActiveProjectId(project.id)}
              className={`p-3 rounded-lg cursor-pointer transition-colors ${
                activeProjectId === project.id 
                  ? 'bg-purple-100 text-purple-900 border-l-4 border-purple-600' 
                  : 'bg-white hover:bg-gray-50 border border-transparent'
              }`}
            >
              <div className="font-medium truncate">{project.title}</div>
              <div className="text-xs text-gray-500 mt-1 flex justify-between">
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                  project.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-gray-100'
                }`}>
                  {project.status}
                </span>
              </div>
            </div>
          ))}
          {projects.length === 0 && (
            <div className="text-center p-4 text-gray-500 text-sm italic">
              No projects yet.
            </div>
          )}
        </div>
      </div>

      {/* Main Content - Tasks */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border overflow-hidden flex flex-col">
        {activeProjectId ? (
          <ProjectDetail 
            projectId={activeProjectId} 
            group={group}
            currentUser={currentUser}
            myMembership={myMembership}
            onOpenReport={() => setIsTimeReportOpen(true)}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            Select a project to view tasks
          </div>
        )}
      </div>

      {/* Time Report Modal */}
      {isTimeReportOpen && (
        <TimeReportModal 
          isOpen={isTimeReportOpen} 
          onClose={() => setIsTimeReportOpen(false)} 
          groupId={group.id} 
          projects={projects}
        />
      )}
    </div>
  );
}

function ProjectDetail({ projectId, group, currentUser, myMembership, onOpenReport }) {
  const queryClient = useQueryClient();
  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => (await base44.entities.GroupProject.filter({ id: projectId }))[0]
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['projectTasks', projectId],
    queryFn: () => base44.entities.GroupTask.filter({ project_id: projectId }, 'sort_order'),
    enabled: !!projectId
  });
  
  // Calculate total time for this project
  const { data: timeEntries = [] } = useQuery({
    queryKey: ['projectTime', projectId],
    queryFn: () => base44.entities.TimeEntry.filter({ project_id: projectId }),
    enabled: !!projectId
  });

  const totalHoursLogged = timeEntries.reduce((sum, entry) => sum + (entry.hours || 0), 0);

  return (
    <>
      {/* Header */}
      <div className="p-6 border-b bg-gray-50">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{project?.title}</h2>
            <p className="text-gray-500 mt-1 text-sm max-w-2xl">{project?.description}</p>
          </div>
          <div className="flex gap-2">
             {isOwnerOrAdmin(myMembership.role) && (
               <Button variant="outline" size="sm" onClick={onOpenReport}>
                 <FileText className="w-4 h-4 mr-2" /> Time Report
               </Button>
             )}
             <AddTaskDialog projectId={projectId} group={group} currentUser={currentUser} />
          </div>
        </div>

        {/* Project Hours Overview */}
        <div className="mt-6 bg-white rounded-lg border p-4 shadow-sm flex justify-between items-center">
          <div>
            <h4 className="font-semibold text-sm text-gray-700">Total Project Hours</h4>
            <p className="text-xs text-gray-500">Time logged on this project</p>
          </div>
          <div className="text-xl font-bold text-gray-900">
            {totalHoursLogged.toFixed(2)}h
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-white">
        {tasks.map(task => (
           <TaskCard 
           key={task.id} 
           task={task} 
           currentUser={currentUser}
           group={group}
           projectId={projectId}
           canEdit={isOwnerOrAdmin(myMembership.role) || (task.created_by === currentUser?.email)} 
           />
        ))}
        {tasks.length === 0 && (
          <div className="text-center py-10 text-gray-400">
             No tasks created yet.
          </div>
        )}
      </div>
    </>
  );
}

function TaskCard({ task, currentUser, group, projectId, canEdit }) {
  const queryClient = useQueryClient();
  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [elapsed, setElapsed] = useState(0); // for visual update
  
  // Timer effect
  useEffect(() => {
    let interval;
    if (isRunning && startTime) {
      interval = setInterval(() => {
        setElapsed(Date.now() - startTime);
      }, 1000);
    } else {
      setElapsed(0);
    }
    return () => clearInterval(interval);
  }, [isRunning, startTime]);

  const updateTaskMutation = useMutation({
    mutationFn: (data) => base44.entities.GroupTask.update(task.id, data),
    onSuccess: () => queryClient.invalidateQueries(['projectTasks', projectId])
  });

  const logTimeMutation = useMutation({
    mutationFn: (entry) => base44.entities.TimeEntry.create(entry),
    onSuccess: () => queryClient.invalidateQueries(['projectTime', projectId])
  });

  const toggleTimer = async () => {
    if (isRunning) {
      // Stop
      const hours = (Date.now() - startTime) / 3600000; // ms to hours
      if (hours > 0.001) { // avoid accidental clicks
         await logTimeMutation.mutateAsync({
           task_id: task.id,
           project_id: projectId,
           user_email: currentUser.email,
           hours: parseFloat(hours.toFixed(4)),
           date: new Date().toISOString().split('T')[0],
           is_manual: false,
           description: "Timer log"
         });
      }
      setIsRunning(false);
      setStartTime(null);
    } else {
      // Start
      setStartTime(Date.now());
      setIsRunning(true);
    }
  };
  
  const statusColors = {
    'todo': 'bg-gray-100 text-gray-600',
    'in-progress': 'bg-blue-100 text-blue-600',
    'review': 'bg-amber-100 text-amber-600',
    'completed': 'bg-green-100 text-green-600 line-through opacity-70'
  };

  return (
    <div className={`border rounded-lg p-4 flex items-center gap-4 hover:shadow-sm transition-shadow ${task.status === 'completed' ? 'bg-gray-50' : 'bg-white'}`}>
      <Checkbox 
        checked={task.status === 'completed'}
        onCheckedChange={(checked) => updateTaskMutation.mutate({ status: checked ? 'completed' : 'todo' })}
      />
      
      <div className="flex-1 min-w-0">
         <div className={`font-medium ${task.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900'}`}>
           {task.title}
         </div>
         <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
            {task.assignee_email && (
              <span className="flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded-full">
                <User className="w-3 h-3" /> {task.assignee_email}
              </span>
            )}
            {task.due_date && (
               <span className="flex items-center gap-1 text-red-500">
                 <Calendar className="w-3 h-3" /> {format(new Date(task.due_date), 'MMM d')}
               </span>
            )}
            <span className={`px-2 py-0.5 rounded-full ${statusColors[task.status] || statusColors.todo}`}>
               {task.status}
            </span>
         </div>
      </div>

      <div className="flex items-center gap-2">
         {/* Timer Visual */}
         {isRunning && (
            <div className="font-mono text-sm text-red-600 font-bold animate-pulse">
               {new Date(elapsed).toISOString().substr(11, 8)}
            </div>
         )}
         
         {/* Timer Button */}
         {task.status !== 'completed' && (
           <Button 
             size="icon"
             variant={isRunning ? "destructive" : "outline"} 
             className={`h-10 w-10 rounded-full shadow-sm ${isRunning ? 'animate-pulse' : ''}`}
             onClick={toggleTimer}
             title={isRunning ? "Stop Timer" : "Start Timer"}
           >
             {isRunning ? <Square className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 ml-0.5 fill-current" />}
           </Button>
         )}

         <ManualTimeDialog task={task} projectId={projectId} currentUser={currentUser} />

         <EditTaskDialog 
           task={task} 
           projectId={projectId} 
           group={group} // Need group to fetch members
           currentUser={currentUser}
           canEdit={canEdit} 
         />
      </div>
    </div>
  );
}

function AddProjectDialog({ groupId }) {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState({ title: '', description: '', status: 'active' });

  const mutation = useMutation({
    mutationFn: (proj) => base44.entities.GroupProject.create({ ...proj, group_id: groupId }),
    onSuccess: () => {
      queryClient.invalidateQueries(['groupProjects', groupId]);
      setIsOpen(false);
      setData({ title: '', description: '', status: 'active' });
    }
  });

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline"><Plus className="w-4 h-4" /></Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>New Project</DialogTitle></DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Title</label>
            <Input value={data.title} onChange={e => setData({...data, title: e.target.value})} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea value={data.description} onChange={e => setData({...data, description: e.target.value})} />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => mutation.mutate(data)} disabled={!data.title}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}



function AddTaskDialog({ projectId, group, currentUser }) {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState({ title: '', assignee_email: '', due_date: '', estimated_hours: '' });

  // Fetch members to assign
  const { data: members = [] } = useQuery({
    queryKey: ['groupMembers', group.id],
    queryFn: () => base44.entities.CreatorGroupMember.filter({ group_id: group.id, status: 'active' })
  });

  const mutation = useMutation({
    mutationFn: (task) => base44.entities.GroupTask.create({ 
      ...task, 
      project_id: projectId,
      estimated_hours: parseFloat(task.estimated_hours) || 0,
      status: 'todo',
      created_by: currentUser?.email
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['projectTasks', projectId]);
      setIsOpen(false);
      setData({ title: '', assignee_email: '', due_date: '', estimated_hours: '' });
    }
  });

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><Plus className="w-4 h-4 mr-2" /> Add Task</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>New Task</DialogTitle></DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Task Title</label>
            <Input value={data.title} onChange={e => setData({...data, title: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
               <label className="text-sm font-medium">Assignee</label>
               <Select value={data.assignee_email} onValueChange={v => setData({...data, assignee_email: v})}>
                 <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                 <SelectContent>
                   {members.map(m => (
                     <SelectItem key={m.id} value={m.user_email}>{m.user_email}</SelectItem>
                   ))}
                 </SelectContent>
               </Select>
             </div>
             <div className="space-y-2">
               <label className="text-sm font-medium">Due Date</label>
               <Input type="date" value={data.due_date} onChange={e => setData({...data, due_date: e.target.value})} />
             </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => mutation.mutate(data)} disabled={!data.title}>Add Task</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ManualTimeDialog({ task, projectId, currentUser }) {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState({ hours: '', date: new Date().toISOString().split('T')[0], description: '' });

  const mutation = useMutation({
    mutationFn: (entry) => base44.entities.TimeEntry.create({
      ...entry,
      task_id: task.id,
      project_id: projectId,
      user_email: currentUser.email,
      hours: parseFloat(entry.hours),
      is_manual: true
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['projectTime', projectId]);
      setIsOpen(false);
      setData({ hours: '', date: new Date().toISOString().split('T')[0], description: '' });
    }
  });

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost" className="h-10 w-10 rounded-full hover:bg-gray-100" title="Log Time Manually">
          <Plus className="w-5 h-5 text-gray-500" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Log Time</DialogTitle></DialogHeader>
        <div className="space-y-4 py-4">
           <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
               <label className="text-sm font-medium">Hours</label>
               <Input type="number" step="0.25" value={data.hours} onChange={e => setData({...data, hours: e.target.value})} />
             </div>
             <div className="space-y-2">
               <label className="text-sm font-medium">Date</label>
               <Input type="date" value={data.date} onChange={e => setData({...data, date: e.target.value})} />
             </div>
           </div>
           <div className="space-y-2">
             <label className="text-sm font-medium">Description</label>
             <Textarea value={data.description} onChange={e => setData({...data, description: e.target.value})} />
           </div>
        </div>
        <DialogFooter>
          <Button onClick={() => mutation.mutate(data)} disabled={!data.hours}>Log Time</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TimeReportModal({ isOpen, onClose, groupId, projects }) {
  // Fetch all time entries for these projects
  const { data: allEntries = [] } = useQuery({
     queryKey: ['groupTimeEntries', groupId],
     queryFn: async () => {
        // We can't query by list of project IDs easily in one go unless we loop or have a 'group_id' on TimeEntry. 
        // We don't have 'group_id' on TimeEntry, but we have 'project_id'. 
        // Best approach: fetch all projects, then fetch entries for each.
        const promises = projects.map(p => base44.entities.TimeEntry.filter({ project_id: p.id }));
        const results = await Promise.all(promises);
        return results.flat();
     },
     enabled: isOpen && projects.length > 0
  });

  const exportPDF = () => {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(20);
    doc.text("Time Summary Report", 14, 22);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);
    
    // Summary Table
    const byUser = {};
    allEntries.forEach(e => {
       if (!byUser[e.user_email]) byUser[e.user_email] = 0;
       byUser[e.user_email] += e.hours;
    });

    const summaryData = Object.entries(byUser).map(([email, hours]) => [email, `${hours.toFixed(2)}h`]);
    
    doc.autoTable({
      startY: 40,
      head: [['User', 'Total Hours']],
      body: summaryData,
      theme: 'striped',
      headStyles: { fillColor: [100, 100, 255] }
    });

    // Detailed Table
    const detailsData = allEntries
      .sort((a,b) => new Date(b.date) - new Date(a.date))
      .map(e => {
        const proj = projects.find(p => p.id === entry.project_id);
        return [
          e.date,
          e.user_email,
          proj?.title || 'Unknown',
          e.description || '-',
          `${e.hours}h`
        ];
      });

    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 15,
      head: [['Date', 'User', 'Project', 'Description', 'Hours']],
      body: detailsData,
      theme: 'grid',
      headStyles: { fillColor: [66, 66, 66] },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 40 },
        2: { cellWidth: 30 },
        3: { cellWidth: 'auto' },
        4: { cellWidth: 20, halign: 'right' }
      }
    });

    doc.save("time-report.pdf");
  };

  const totalHours = allEntries.reduce((sum, e) => sum + e.hours, 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Time Summary Report</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
           <div className="flex justify-between items-center p-4 bg-gray-100 rounded-lg">
              <div>
                <div className="text-sm text-gray-500">Total Project Hours</div>
                <div className="text-2xl font-bold">{totalHours.toFixed(2)}h</div>
              </div>
              <Button onClick={exportPDF}>
                 <FileDown className="w-4 h-4 mr-2" /> Export PDF
              </Button>
           </div>
           
           <div className="max-h-64 overflow-y-auto border rounded-md">
              <table className="w-full text-sm">
                 <thead className="bg-gray-50 border-b">
                   <tr>
                     <th className="p-2 text-left">Date</th>
                     <th className="p-2 text-left">User</th>
                     <th className="p-2 text-left">Project</th>
                     <th className="p-2 text-right">Hours</th>
                   </tr>
                 </thead>
                 <tbody>
                   {allEntries.sort((a,b) => new Date(b.date) - new Date(a.date)).map(entry => {
                      const proj = projects.find(p => p.id === entry.project_id);
                      return (
                        <tr key={entry.id} className="border-b last:border-0">
                           <td className="p-2">{entry.date}</td>
                           <td className="p-2 truncate max-w-[150px]">{entry.user_email}</td>
                           <td className="p-2 truncate max-w-[150px]">{proj?.title || 'Unknown'}</td>
                           <td className="p-2 text-right font-mono">{entry.hours}</td>
                        </tr>
                      );
                   })}
                 </tbody>
              </table>
           </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}