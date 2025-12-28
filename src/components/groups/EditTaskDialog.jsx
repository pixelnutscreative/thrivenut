import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pencil, FileText, History } from 'lucide-react';

export default function EditTaskDialog({ task, projectId, group, currentUser, canEdit }) {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState({ 
    title: task.title, 
    description: task.description || '', 
    assignee_email: task.assignee_email || '', 
    due_date: task.due_date ? task.due_date.split('T')[0] : '', 
    estimated_hours: task.estimated_hours || '' 
  });

  // Fetch members
  const { data: members = [] } = useQuery({
    queryKey: ['groupMembers', group.id],
    queryFn: () => base44.entities.CreatorGroupMember.filter({ group_id: group.id, status: 'active' }),
    enabled: isOpen
  });

  // Fetch logs
  const { data: logs = [] } = useQuery({
    queryKey: ['taskLogs', task.id],
    queryFn: () => base44.entities.GroupTaskLog.filter({ task_id: task.id }, '-timestamp'),
    enabled: isOpen
  });

  const mutation = useMutation({
    mutationFn: async (updatedData) => {
      // Create log
      const changes = [];
      if (updatedData.title !== task.title) changes.push(`Title: ${task.title} -> ${updatedData.title}`);
      if (updatedData.description !== (task.description || '')) changes.push(`Description updated`);
      if (updatedData.assignee_email !== (task.assignee_email || '')) changes.push(`Assignee: ${task.assignee_email || 'None'} -> ${updatedData.assignee_email || 'None'}`);
      if (updatedData.due_date !== (task.due_date ? task.due_date.split('T')[0] : '')) changes.push(`Due Date: ${task.due_date || 'None'} -> ${updatedData.due_date || 'None'}`);
      
      if (changes.length > 0) {
        await base44.entities.GroupTaskLog.create({
          task_id: task.id,
          user_email: currentUser.email,
          change_summary: changes.join(', '),
          timestamp: new Date().toISOString()
        });
      }

      return base44.entities.GroupTask.update(task.id, {
        ...updatedData,
        estimated_hours: parseFloat(updatedData.estimated_hours) || 0
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['projectTasks', projectId]);
      queryClient.invalidateQueries(['taskLogs', task.id]);
      setIsOpen(false);
    }
  });

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost" className="h-10 w-10 rounded-full hover:bg-gray-100" title={canEdit ? "Edit Task" : "View Details"}>
          {canEdit ? <Pencil className="w-4 h-4 text-gray-500" /> : <FileText className="w-4 h-4 text-gray-500" />}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{canEdit ? 'Edit Task' : 'Task Details'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input 
                value={data.title} 
                onChange={e => setData({...data, title: e.target.value})} 
                disabled={!canEdit}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea 
                value={data.description} 
                onChange={e => setData({...data, description: e.target.value})} 
                disabled={!canEdit}
                className="min-h-[100px]"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                 <label className="text-sm font-medium">Assignee</label>
                 <Select 
                    value={data.assignee_email} 
                    onValueChange={v => setData({...data, assignee_email: v})}
                    disabled={!canEdit}
                 >
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
                 <Input 
                    type="date" 
                    value={data.due_date} 
                    onChange={e => setData({...data, due_date: e.target.value})} 
                    disabled={!canEdit}
                 />
               </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="text-sm font-bold flex items-center gap-2 mb-3 text-gray-700">
              <History className="w-4 h-4" /> Change Log
            </h4>
            <div className="bg-gray-50 rounded-lg p-4 space-y-3 max-h-60 overflow-y-auto text-sm">
              {logs.map(log => (
                <div key={log.id} className="flex gap-3">
                  <div className="min-w-[4px] w-1 bg-gray-300 rounded-full" />
                  <div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span className="font-medium text-gray-700">{log.user_email}</span>
                      <span>•</span>
                      <span>{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                    <div className="mt-1 text-gray-700">
                      {log.change_summary}
                    </div>
                  </div>
                </div>
              ))}
              {logs.length === 0 && <div className="text-gray-400 italic">No changes recorded yet.</div>}
            </div>
          </div>
        </div>
        <DialogFooter>
          {canEdit && (
            <Button onClick={() => mutation.mutate(data)} disabled={!data.title}>Save Changes</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}