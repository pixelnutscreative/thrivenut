import React, { useState, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Plus, Upload, MoreVertical, X, Check, ArrowRight, Table, LayoutTemplate, Tag, Send, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

const KANBAN_COLUMNS = ["To Do", "In Progress", "Done", "On Hold"];
const PRIORITIES = ["Urgent", "Normal", "When You Get To It"];

const parseCSV = (text) => {
  const lines = text.split(/\r?\n/);
  return lines.map(line => {
    const row = [];
    let cur = '';
    let inQuote = false;
    for (let i = 0; i < line.length; i++) {
      if (line[i] === '"') {
        if (i < line.length - 1 && line[i+1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuote = !inQuote;
        }
      } else if (line[i] === ',' && !inQuote) {
        row.push(cur);
        cur = '';
      } else {
        cur += line[i];
      }
    }
    row.push(cur);
    return row;
  }).filter(row => row.some(cell => cell.trim() !== ''));
};

export default function MyTasks() {
  const queryClient = useQueryClient();
  const [view, setView] = useState('kanban');
  
  // Filtering
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');

  // Sheet / Edit
  const [editingTask, setEditingTask] = useState(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // New task inline
  const [addingTaskCol, setAddingTaskCol] = useState(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  // CSV Import State
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importStep, setImportStep] = useState(1);
  const [csvData, setCsvData] = useState([]);
  const [csvHeaders, setCsvHeaders] = useState([]);
  const [columnMapping, setColumnMapping] = useState({});
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef(null);

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me()
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['my_tasks'],
    queryFn: () => base44.entities.Task.filter({ created_by: user?.email }, '-updated_date'),
    enabled: !!user
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Task.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my_tasks'] });
      setAddingTaskCol(null);
      setNewTaskTitle('');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Task.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my_tasks'] });
    }
  });

  const bulkCreateMutation = useMutation({
    mutationFn: (tasks) => base44.entities.Task.bulkCreate(tasks),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my_tasks'] });
      setIsImportOpen(false);
      setImportStep(1);
      setCsvData([]);
      toast.success("Tasks imported successfully!");
    }
  });

  const categories = useMemo(() => {
    const cats = new Set(tasks.map(t => t.category).filter(Boolean));
    return ['All', ...Array.from(cats)];
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      if (categoryFilter !== 'All' && t.category !== categoryFilter) return false;
      if (priorityFilter !== 'All' && t.priority !== priorityFilter) return false;
      return true;
    });
  }, [tasks, categoryFilter, priorityFilter]);

  const columns = useMemo(() => {
    const cols = {
      "To Do": [], "In Progress": [], "Done": [], "On Hold": []
    };
    filteredTasks.forEach(t => {
      const s = t.status || "To Do";
      if (cols[s]) cols[s].push(t);
      else cols["To Do"].push(t);
    });
    return cols;
  }, [filteredTasks]);

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const { source, destination, draggableId } = result;
    if (source.droppableId !== destination.droppableId) {
      updateMutation.mutate({
        id: draggableId,
        data: { status: destination.droppableId }
      });
    }
  };

  const handleInlineAdd = (status) => {
    if (!newTaskTitle.trim()) return;
    createMutation.mutate({
      title: newTaskTitle,
      status,
      priority: "Normal",
      created_by: user?.email
    });
  };

  const sendToPixelBoard = (task) => {
    updateMutation.mutate({
      id: task.id,
      data: { send_to_pixelboard: true }
    });
    toast.success("Sent to PixelBoard!");
  };

  const openTask = (task) => {
    setEditingTask({ ...task, custom_fields: task.custom_fields || {} });
    setIsSheetOpen(true);
  };

  const saveTask = () => {
    if (!editingTask) return;
    updateMutation.mutate({
      id: editingTask.id,
      data: {
        title: editingTask.title,
        details: editingTask.details,
        status: editingTask.status,
        priority: editingTask.priority,
        category: editingTask.category,
        custom_fields: editingTask.custom_fields
      }
    });
    setIsSheetOpen(false);
  };

  // CSV Import Logic
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const parsed = parseCSV(evt.target.result);
      if (parsed.length > 0) {
        setCsvHeaders(parsed[0]);
        setCsvData(parsed.slice(1));
        
        // Auto-map some fields
        const initialMap = {};
        parsed[0].forEach((header, idx) => {
          const h = header.toLowerCase();
          if (h.includes('title') || h.includes('name') || h.includes('task')) initialMap[idx] = { type: 'field', value: 'title' };
          else if (h.includes('detail') || h.includes('desc') || h.includes('note')) initialMap[idx] = { type: 'field', value: 'details' };
          else if (h.includes('status') || h.includes('state')) initialMap[idx] = { type: 'field', value: 'status' };
          else if (h.includes('priority')) initialMap[idx] = { type: 'field', value: 'priority' };
          else if (h.includes('category')) initialMap[idx] = { type: 'field', value: 'category' };
          else initialMap[idx] = { type: 'skip' };
        });
        setColumnMapping(initialMap);
        setImportStep(2);
      }
    };
    reader.readAsText(file);
  };

  const executeImport = async () => {
    setIsImporting(true);
    const newTasks = csvData.map(row => {
      const task = {
        title: 'Untitled Task',
        status: 'To Do',
        priority: 'Normal',
        source: 'CSV Import',
        custom_fields: {}
      };
      
      row.forEach((cell, idx) => {
        const mapping = columnMapping[idx];
        if (!mapping || mapping.type === 'skip') return;
        
        const val = cell.trim();
        if (mapping.type === 'field') {
          if (mapping.value === 'status' && !KANBAN_COLUMNS.includes(val)) return;
          if (mapping.value === 'priority' && !PRIORITIES.includes(val)) return;
          if (val) task[mapping.value] = val;
        } else if (mapping.type === 'custom') {
          if (val && mapping.name) {
            task.custom_fields[mapping.name] = val;
          }
        }
      });
      return task;
    });

    // Filter out completely empty rows
    const validTasks = newTasks.filter(t => t.title !== 'Untitled Task' || Object.keys(t.custom_fields).length > 0 || t.details);
    
    await bulkCreateMutation.mutateAsync(validTasks);
    setIsImporting(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">My Tasks</h1>
            <p className="text-slate-500 mt-1">Manage and organize your content creator tasks.</p>
          </div>
          <Button 
            onClick={() => setIsImportOpen(true)}
            className="bg-[#24C4D6] hover:bg-[#1db0c0] text-white shadow-sm font-medium"
          >
            <Upload className="w-4 h-4 mr-2" />
            Import CSV
          </Button>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-500">View:</span>
              <div className="flex bg-slate-100 p-1 rounded-lg">
                <button 
                  onClick={() => setView('kanban')} 
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${view === 'kanban' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <LayoutTemplate className="w-4 h-4 inline-block mr-1.5" />
                  Kanban
                </button>
                <button 
                  onClick={() => setView('list')} 
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${view === 'list' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <Table className="w-4 h-4 inline-block mr-1.5" />
                  List
                </button>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[140px] bg-slate-50 border-none">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[140px] bg-slate-50 border-none">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Priorities</SelectItem>
                {PRIORITIES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* KANBAN VIEW */}
        {view === 'kanban' && (
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
              {KANBAN_COLUMNS.map(col => (
                <div key={col} className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-slate-700">{col}</h3>
                    <span className="bg-slate-200 text-slate-600 text-xs font-bold px-2 py-1 rounded-full">
                      {columns[col].length}
                    </span>
                  </div>
                  
                  <Droppable droppableId={col}>
                    {(provided) => (
                      <div 
                        {...provided.droppableProps} 
                        ref={provided.innerRef}
                        className="min-h-[200px] bg-slate-100/50 rounded-xl p-2"
                      >
                        {columns[col].map((task, idx) => (
                          <Draggable key={task.id} draggableId={task.id} index={idx}>
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className="mb-3"
                              >
                                <Card 
                                  className="bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                                  onClick={() => openTask(task)}
                                >
                                  <CardContent className="p-4 flex flex-col gap-3">
                                    <div className="flex justify-between items-start gap-2">
                                      <h4 className="font-medium text-slate-800 text-sm leading-snug">{task.title}</h4>
                                    </div>
                                    
                                    <div className="flex flex-wrap gap-2 mt-auto">
                                      {task.category && (
                                        <span className="bg-[#24C4D6]/10 text-[#24C4D6] text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
                                          {task.category}
                                        </span>
                                      )}
                                      {task.priority === 'Urgent' && (
                                        <span className="bg-[#A7E063]/20 text-[#6ea42a] text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
                                          Urgent
                                        </span>
                                      )}
                                      {task.priority === 'Normal' && (
                                        <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
                                          Normal
                                        </span>
                                      )}
                                    </div>

                                    <div className="flex justify-between items-center mt-1 border-t border-slate-50 pt-2">
                                      {task.send_to_pixelboard ? (
                                        <span className="flex items-center text-[10px] font-bold text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded">
                                          <Sparkles className="w-3 h-3 mr-1" />
                                          PixelBoard
                                        </span>
                                      ) : (
                                        <button 
                                          className="flex items-center text-[10px] font-semibold text-slate-400 hover:text-[#24C4D6] transition-colors opacity-0 group-hover:opacity-100"
                                          onClick={(e) => { e.stopPropagation(); sendToPixelBoard(task); }}
                                        >
                                          <Send className="w-3 h-3 mr-1" />
                                          Send to PixelBoard
                                        </button>
                                      )}
                                    </div>
                                  </CardContent>
                                </Card>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                        
                        {addingTaskCol === col ? (
                          <div className="bg-white p-3 rounded-lg border border-[#24C4D6] shadow-sm">
                            <Input 
                              autoFocus
                              placeholder="Task title..."
                              value={newTaskTitle}
                              onChange={e => setNewTaskTitle(e.target.value)}
                              onKeyDown={e => e.key === 'Enter' && handleInlineAdd(col)}
                              className="h-8 text-sm mb-2"
                            />
                            <div className="flex gap-2">
                              <Button size="sm" className="h-7 text-xs bg-[#24C4D6] hover:bg-[#1db0c0]" onClick={() => handleInlineAdd(col)}>Add</Button>
                              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setAddingTaskCol(null)}>Cancel</Button>
                            </div>
                          </div>
                        ) : (
                          <button 
                            className="flex items-center justify-center w-full py-2 text-sm text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 rounded-lg transition-colors"
                            onClick={() => { setAddingTaskCol(col); setNewTaskTitle(''); }}
                          >
                            <Plus className="w-4 h-4 mr-1" /> Add Task
                          </button>
                        )}
                      </div>
                    )}
                  </Droppable>
                </div>
              ))}
            </div>
          </DragDropContext>
        )}

        {/* LIST VIEW */}
        {view === 'list' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4">Title</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Priority</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Details</th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTasks.map(task => (
                    <tr key={task.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-4 font-medium text-slate-800">
                        <button onClick={() => openTask(task)} className="hover:text-[#24C4D6] hover:underline text-left">
                          {task.title}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        {task.category && (
                          <span className="bg-[#24C4D6]/10 text-[#24C4D6] text-[10px] font-bold px-2 py-1 rounded-md uppercase">
                            {task.category}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase ${
                          task.priority === 'Urgent' ? 'bg-[#A7E063]/20 text-[#6ea42a]' : 
                          task.priority === 'Normal' ? 'bg-slate-100 text-slate-500' : 'bg-blue-50 text-blue-500'
                        }`}>
                          {task.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Select 
                          value={task.status} 
                          onValueChange={(val) => updateMutation.mutate({ id: task.id, data: { status: val }})}
                        >
                          <SelectTrigger className="h-8 text-xs w-[130px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {KANBAN_COLUMNS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-6 py-4 text-slate-500 max-w-[200px] truncate">
                        {task.details || '-'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {!task.send_to_pixelboard && (
                          <Button size="sm" variant="ghost" className="text-[#24C4D6] h-8 opacity-0 group-hover:opacity-100" onClick={() => sendToPixelBoard(task)}>
                            <Send className="w-4 h-4" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredTasks.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                        No tasks found. Create one to get started!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Task Edit Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="sm:max-w-md w-full overflow-y-auto bg-slate-50/50">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-2xl text-slate-800">Edit Task</SheetTitle>
          </SheetHeader>
          
          {editingTask && (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-600">Title</label>
                <Input 
                  value={editingTask.title} 
                  onChange={e => setEditingTask({...editingTask, title: e.target.value})}
                  className="bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-600">Status</label>
                  <Select value={editingTask.status} onValueChange={v => setEditingTask({...editingTask, status: v})}>
                    <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {KANBAN_COLUMNS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-600">Priority</label>
                  <Select value={editingTask.priority} onValueChange={v => setEditingTask({...editingTask, priority: v})}>
                    <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PRIORITIES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-600">Category</label>
                <Input 
                  value={editingTask.category || ''} 
                  onChange={e => setEditingTask({...editingTask, category: e.target.value})}
                  placeholder="e.g. Content, Admin, Social..."
                  className="bg-white"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-600">Details</label>
                <Textarea 
                  value={editingTask.details || ''} 
                  onChange={e => setEditingTask({...editingTask, details: e.target.value})}
                  rows={4}
                  className="bg-white"
                />
              </div>

              {Object.keys(editingTask.custom_fields || {}).length > 0 && (
                <div className="space-y-3 pt-4 border-t border-slate-200">
                  <h4 className="text-sm font-semibold text-slate-600">Custom Fields</h4>
                  {Object.entries(editingTask.custom_fields).map(([key, val]) => (
                    <div key={key} className="space-y-1">
                      <label className="text-xs text-slate-500 uppercase">{key}</label>
                      <Input 
                        value={val} 
                        onChange={e => setEditingTask({
                          ...editingTask, 
                          custom_fields: { ...editingTask.custom_fields, [key]: e.target.value }
                        })}
                        className="bg-white h-8"
                      />
                    </div>
                  ))}
                </div>
              )}

              <Button onClick={saveTask} className="w-full bg-[#24C4D6] hover:bg-[#1db0c0] mt-6">Save Changes</Button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* CSV Import Modal */}
      <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Import Tasks from CSV</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            {importStep === 1 && (
              <div className="space-y-4">
                <div 
                  className="border-2 border-dashed border-slate-200 rounded-xl p-12 text-center hover:bg-slate-50 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-10 h-10 text-[#24C4D6] mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-700">Click to upload CSV</h3>
                  <p className="text-sm text-slate-500 mt-1">or drag and drop here</p>
                  <input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                </div>
              </div>
            )}

            {importStep === 2 && (
              <div className="space-y-6">
                <p className="text-sm text-slate-600 bg-blue-50 p-3 rounded-lg">Map your CSV columns to Task fields. Unmapped columns will be ignored.</p>
                <div className="max-h-[50vh] overflow-y-auto pr-2 space-y-3">
                  {csvHeaders.map((header, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <div className="w-1/3 font-medium text-sm text-slate-700 truncate" title={header}>{header}</div>
                      <div className="flex-1 flex gap-2">
                        <Select 
                          value={columnMapping[idx]?.type + (columnMapping[idx]?.type === 'field' ? `:${columnMapping[idx]?.value}` : '')}
                          onValueChange={(val) => {
                            if (val === 'skip') setColumnMapping({...columnMapping, [idx]: { type: 'skip' }});
                            else if (val === 'custom') setColumnMapping({...columnMapping, [idx]: { type: 'custom', name: header, fieldType: 'Short Text' }});
                            else setColumnMapping({...columnMapping, [idx]: { type: 'field', value: val.split(':')[1] }});
                          }}
                        >
                          <SelectTrigger className="bg-white">
                            <SelectValue placeholder="Select field..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="skip" className="text-slate-400 italic">Skip Column</SelectItem>
                            <SelectItem value="field:title">Task Title</SelectItem>
                            <SelectItem value="field:details">Details</SelectItem>
                            <SelectItem value="field:status">Status</SelectItem>
                            <SelectItem value="field:priority">Priority</SelectItem>
                            <SelectItem value="field:category">Category</SelectItem>
                            <SelectItem value="custom" className="text-indigo-600 font-medium">+ Add as Custom Field</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        {columnMapping[idx]?.type === 'custom' && (
                          <Input 
                            value={columnMapping[idx].name} 
                            onChange={e => setColumnMapping({
                              ...columnMapping, 
                              [idx]: { ...columnMapping[idx], name: e.target.value }
                            })}
                            className="bg-white w-1/2"
                            placeholder="Field Name"
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <Button variant="outline" onClick={() => setImportStep(1)}>Back</Button>
                  <Button className="bg-[#24C4D6] hover:bg-[#1db0c0]" onClick={() => setImportStep(3)}>Continue</Button>
                </div>
              </div>
            )}

            {importStep === 3 && (
              <div className="space-y-6 text-center py-8">
                <div className="w-16 h-16 bg-[#24C4D6]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-[#24C4D6]" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800">Ready to Import!</h3>
                <p className="text-slate-600 max-w-sm mx-auto">
                  You are about to import <strong>{csvData.length}</strong> tasks with <strong>{Object.values(columnMapping).filter(m => m.type !== 'skip').length}</strong> mapped columns.
                </p>
                <div className="flex justify-center gap-3 pt-6">
                  <Button variant="outline" onClick={() => setImportStep(2)} disabled={isImporting}>Back</Button>
                  <Button 
                    className="bg-[#24C4D6] hover:bg-[#1db0c0]" 
                    onClick={executeImport}
                    disabled={isImporting}
                  >
                    {isImporting ? 'Importing...' : 'Start Import'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}