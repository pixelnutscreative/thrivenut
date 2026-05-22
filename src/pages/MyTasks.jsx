import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Upload, X, Check, Table, LayoutTemplate, Send, Settings, Trash2, Edit2, Loader2, GripVertical, Sparkles, Search } from 'lucide-react';
import { toast } from 'sonner';

export default function MyTasks() {
  const queryClient = useQueryClient();
  const [view, setView] = useState('kanban');
  
  // Filtering & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [subcategoryFilter, setSubcategoryFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Bulk Edit
  const [selectedTasks, setSelectedTasks] = useState([]);

  // Sheet / Edit
  const [editingTask, setEditingTask] = useState(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // New task inline
  const [addingTaskCol, setAddingTaskCol] = useState(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  // Settings
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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

  const { data: tasks = [], isLoading: loadingTasks } = useQuery({
    queryKey: ['creator_tasks'],
    queryFn: () => base44.entities.CreatorTask.filter({ created_by: user?.email }, '-updated_date'),
    enabled: !!user
  });

  const { data: statuses = [], isLoading: loadingStatuses } = useQuery({
    queryKey: ['task_statuses'],
    queryFn: async () => {
      const res = await base44.entities.TaskStatus.filter({ created_by: user?.email }, 'order');
      if (res.length === 0 && user) {
        // Seed defaults
        const defaults = [
          { name: 'New', order: 0, color: '#24C4D6' },
          { name: 'Active', order: 1, color: '#60a5fa' },
          { name: 'To Do', order: 2, color: '#e2e8f0' },
          { name: 'In Progress', order: 3, color: '#fef08a' },
          { name: 'Done', order: 4, color: '#A7E063' },
          { name: 'On Hold', order: 5, color: '#fca5a5' }
        ];
        await base44.entities.TaskStatus.bulkCreate(defaults);
        return base44.entities.TaskStatus.filter({ created_by: user.email }, 'order');
      }
      return res;
    },
    enabled: !!user
  });

  const { data: priorities = [], isLoading: loadingPriorities } = useQuery({
    queryKey: ['task_priorities'],
    queryFn: async () => {
      const res = await base44.entities.TaskPriority.filter({ created_by: user?.email }, 'level');
      if (res.length === 0 && user) {
        const defaults = [
          { name: 'Urgent', level: 0, color: '#A7E063' },
          { name: 'Normal', level: 1, color: '#e2e8f0' },
          { name: 'When You Get To It', level: 2, color: '#f3f4f6' }
        ];
        await base44.entities.TaskPriority.bulkCreate(defaults);
        return base44.entities.TaskPriority.filter({ created_by: user.email }, 'level');
      }
      return res;
    },
    enabled: !!user
  });

  const { data: categories = [], isLoading: loadingCategories } = useQuery({
    queryKey: ['task_categories'],
    queryFn: async () => {
      const res = await base44.entities.TaskCategory.filter({ created_by: user?.email }, '-created_date');
      if (res.length === 0 && user) {
        const defaults = [
          { name: 'Content', color: '#24C4D6' },
          { name: 'Admin', color: '#cbd5e1' }
        ];
        await base44.entities.TaskCategory.bulkCreate(defaults);
        return base44.entities.TaskCategory.filter({ created_by: user.email }, '-created_date');
      }
      return res;
    },
    enabled: !!user
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.CreatorTask.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creator_tasks'] });
      setAddingTaskCol(null);
      setNewTaskTitle('');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CreatorTask.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creator_tasks'] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.CreatorTask.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creator_tasks'] });
      setIsSheetOpen(false);
      toast.success("Task deleted");
    }
  });

  const bulkCreateMutation = useMutation({
    mutationFn: (tasks) => base44.entities.CreatorTask.bulkCreate(tasks),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creator_tasks'] });
      setIsImportOpen(false);
      setImportStep(1);
      setCsvData([]);
      toast.success("Tasks imported successfully!");
    }
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ ids, updates }) => {
      for (const id of ids) {
        await base44.entities.CreatorTask.update(id, updates);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creator_tasks'] });
      setSelectedTasks([]);
      toast.success("Tasks updated");
    }
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids) => {
      for (const id of ids) {
        await base44.entities.CreatorTask.delete(id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creator_tasks'] });
      setSelectedTasks([]);
      toast.success("Tasks deleted");
    }
  });

  // Derived Category Lists
  const parentCategories = useMemo(() => categories.filter(c => !c.parent_category_id), [categories]);
  const subCategories = useMemo(() => categories.filter(c => c.parent_category_id), [categories]);

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      if (searchQuery) {
         const q = searchQuery.toLowerCase();
         const matchTitle = t.title?.toLowerCase().includes(q);
         const matchDetails = t.details?.toLowerCase().includes(q);
         if (!matchTitle && !matchDetails) return false;
      }
      if (categoryFilter !== 'All' && t.category_id !== categoryFilter) return false;
      if (subcategoryFilter !== 'All' && t.subcategory_id !== subcategoryFilter) return false;
      if (priorityFilter !== 'All' && t.priority_id !== priorityFilter) return false;
      if (statusFilter !== 'All' && t.status_id !== statusFilter) return false;
      return true;
    });
  }, [tasks, searchQuery, categoryFilter, subcategoryFilter, priorityFilter, statusFilter]);

  const columns = useMemo(() => {
    const cols = {};
    statuses.forEach(s => cols[s.id] = []);
    
    // Group tasks
    filteredTasks.forEach(t => {
      const sid = t.status_id;
      if (cols[sid]) cols[sid].push(t);
      else if (statuses.length > 0) cols[statuses[0].id].push(t); // fallback to first
    });
    return cols;
  }, [filteredTasks, statuses]);

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const { source, destination, draggableId } = result;
    if (source.droppableId !== destination.droppableId) {
      updateMutation.mutate({
        id: draggableId,
        data: { status_id: destination.droppableId }
      });
    }
  };

  const handleInlineAdd = (status_id) => {
    if (!newTaskTitle.trim()) return;
    createMutation.mutate({
      title: newTaskTitle,
      status_id,
      priority_id: priorities.length > 0 ? priorities.find(p => p.name === 'Normal')?.id || priorities[0].id : null,
      source: 'Manual'
    });
  };

  const sendToPixelBoard = async (task) => {
    try {
      await base44.entities.PixelBoard.create({
        title: task.title,
        details: task.details || '',
        question_type: 'Task',
        status: '💬 New',
        asked_by: 'Nikole',
        nikole_read: false,
        pixel_read: false
      });
      updateMutation.mutate({
        id: task.id,
        data: { send_to_pixelboard: true }
      });
      toast.success("Sent to Daisy's inbox!");
    } catch (e) {
      console.error(e);
      toast.error("Failed to send to PixelBoard");
    }
  };

  const openTask = (task) => {
    const newStatus = statuses.find(s => s.name === 'New');
    const activeStatus = statuses.find(s => s.name === 'Active') || statuses.find(s => s.name === 'To Do');
    
    if (newStatus && activeStatus && task.status_id === newStatus.id) {
      task.status_id = activeStatus.id;
      updateMutation.mutate({ id: task.id, data: { status_id: activeStatus.id } });
    }

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
        status_id: editingTask.status_id,
        priority_id: editingTask.priority_id,
        category_id: editingTask.category_id,
        subcategory_id: editingTask.subcategory_id,
        custom_fields: editingTask.custom_fields
      }
    });
    setIsSheetOpen(false);
  };

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

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const parsed = parseCSV(evt.target.result);
      if (parsed.length > 0) {
        setCsvHeaders(parsed[0]);
        setCsvData(parsed.slice(1));
        
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
    
    // First, let's gather all unique categories, statuses, priorities from the CSV
    const newCategories = new Set();
    const newStatuses = new Set();
    const newPriorities = new Set();

    csvData.forEach(row => {
      row.forEach((cell, idx) => {
        const mapping = columnMapping[idx];
        if (!mapping || mapping.type === 'skip' || !cell.trim()) return;
        const val = cell.trim();
        if (mapping.value === 'category') newCategories.add(val);
        if (mapping.value === 'status') newStatuses.add(val);
        if (mapping.value === 'priority') newPriorities.add(val);
      });
    });

    // Create missing entities
    const catsMap = { ...Object.fromEntries(categories.map(c => [c.name.toLowerCase(), c.id])) };
    const statMap = { ...Object.fromEntries(statuses.map(c => [c.name.toLowerCase(), c.id])) };
    const prioMap = { ...Object.fromEntries(priorities.map(c => [c.name.toLowerCase(), c.id])) };

    for (const cat of newCategories) {
      if (!catsMap[cat.toLowerCase()]) {
        const created = await base44.entities.TaskCategory.create({ name: cat, color: '#cbd5e1' });
        catsMap[cat.toLowerCase()] = created.id;
      }
    }
    for (const stat of newStatuses) {
      if (!statMap[stat.toLowerCase()]) {
        const created = await base44.entities.TaskStatus.create({ name: stat, order: 99, color: '#e2e8f0' });
        statMap[stat.toLowerCase()] = created.id;
      }
    }
    for (const prio of newPriorities) {
      if (!prioMap[prio.toLowerCase()]) {
        const created = await base44.entities.TaskPriority.create({ name: prio, level: 99, color: '#e2e8f0' });
        prioMap[prio.toLowerCase()] = created.id;
      }
    }

    // Now map rows to tasks
    const newTasks = csvData.map(row => {
      const task = {
        title: 'Untitled Task',
        source: 'CSV Import',
        custom_fields: {}
      };
      
      row.forEach((cell, idx) => {
        const mapping = columnMapping[idx];
        if (!mapping || mapping.type === 'skip') return;
        
        const val = cell.trim();
        if (mapping.type === 'field') {
          if (mapping.value === 'title' && val) task.title = val;
          if (mapping.value === 'details' && val) task.details = val;
          if (mapping.value === 'status' && val) task.status_id = statMap[val.toLowerCase()];
          if (mapping.value === 'priority' && val) task.priority_id = prioMap[val.toLowerCase()];
          if (mapping.value === 'category' && val) task.category_id = catsMap[val.toLowerCase()];
        } else if (mapping.type === 'custom') {
          if (val && mapping.name) {
            task.custom_fields[mapping.name] = val;
          }
        }
      });

      // Default status if none
      if (!task.status_id && statuses.length > 0) task.status_id = statuses[0].id;
      
      return task;
    });

    const validTasks = newTasks.filter(t => t.title !== 'Untitled Task' || Object.keys(t.custom_fields).length > 0 || t.details);
    
    await bulkCreateMutation.mutateAsync(validTasks);
    queryClient.invalidateQueries({ queryKey: ['task_categories'] });
    queryClient.invalidateQueries({ queryKey: ['task_statuses'] });
    queryClient.invalidateQueries({ queryKey: ['task_priorities'] });
    setIsImporting(false);
  };

  const getStatus = (id) => statuses.find(s => s.id === id);
  const getPriority = (id) => priorities.find(p => p.id === id);
  const getCategory = (id) => categories.find(c => c.id === id);

  const availableSubsForEditing = useMemo(() => {
    if (!editingTask?.category_id) return [];
    return subCategories.filter(s => s.parent_category_id === editingTask.category_id);
  }, [editingTask?.category_id, subCategories]);

  // Remove chips 
  const removeFilter = (filterType) => {
    if (filterType === 'category') { setCategoryFilter('All'); setSubcategoryFilter('All'); }
    if (filterType === 'subcategory') setSubcategoryFilter('All');
    if (filterType === 'priority') setPriorityFilter('All');
    if (filterType === 'status') setStatusFilter('All');
  };

  if (loadingTasks || loadingStatuses || loadingPriorities || loadingCategories) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="w-8 h-8 text-[#24C4D6] animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans">
      <div className="max-w-[1400px] mx-auto space-y-6">
        
        {/* Header & Search */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">My Tasks</h1>
            <p className="text-slate-500 mt-1">Manage and organize your content creator tasks.</p>
          </div>
          <div className="flex-1 max-w-md w-full relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <Input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks..." 
              className="pl-9 bg-slate-50 border-slate-200"
            />
          </div>
          <div className="flex items-center gap-3">
            <Button 
              onClick={() => setIsSettingsOpen(true)}
              variant="outline"
              className="text-slate-600 font-medium"
            >
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
            <Button 
              onClick={() => setIsImportOpen(true)}
              className="bg-[#24C4D6] hover:bg-[#1db0c0] text-white shadow-sm font-medium"
            >
              <Upload className="w-4 h-4 mr-2" />
              Import CSV
            </Button>
          </div>
        </div>

        {/* Filter Bar & View Toggle */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-4 w-full xl:w-auto">
            <div className="flex items-center gap-2">
              <div className="flex bg-slate-100 p-1 rounded-lg shrink-0">
                <button 
                  onClick={() => setView('kanban')} 
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${view === 'kanban' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <LayoutTemplate className="w-4 h-4 inline-block md:mr-1.5" />
                  <span className="hidden md:inline">Kanban</span>
                </button>
                <button 
                  onClick={() => setView('list')} 
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${view === 'list' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <Table className="w-4 h-4 inline-block md:mr-1.5" />
                  <span className="hidden md:inline">List</span>
                </button>
              </div>
            </div>

            <div className="h-6 w-px bg-slate-200 hidden xl:block" />
            
            <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[140px] bg-slate-50 border-none h-9">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Categories</SelectItem>
                  {parentCategories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>

              {categoryFilter !== 'All' && subCategories.filter(s => s.parent_category_id === categoryFilter).length > 0 && (
                <Select value={subcategoryFilter} onValueChange={setSubcategoryFilter}>
                  <SelectTrigger className="w-[140px] bg-slate-50 border-none h-9">
                    <SelectValue placeholder="Subcategory" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Subcategories</SelectItem>
                    {subCategories.filter(s => s.parent_category_id === categoryFilter).map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}

              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-[140px] bg-slate-50 border-none h-9">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Priorities</SelectItem>
                  {priorities.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>

              {view === 'list' && (
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px] bg-slate-50 border-none h-9">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Statuses</SelectItem>
                    {statuses.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {/* Active Filter Chips */}
          <div className="flex flex-wrap gap-2 w-full xl:w-auto xl:justify-end">
             {categoryFilter !== 'All' && (
               <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700">
                 Category: {getCategory(categoryFilter)?.name}
                 <button onClick={() => removeFilter('category')}><X className="w-3 h-3 hover:text-indigo-900" /></button>
               </span>
             )}
             {subcategoryFilter !== 'All' && (
               <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700">
                 Sub: {getCategory(subcategoryFilter)?.name}
                 <button onClick={() => removeFilter('subcategory')}><X className="w-3 h-3 hover:text-indigo-900" /></button>
               </span>
             )}
             {priorityFilter !== 'All' && (
               <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-rose-50 text-rose-700">
                 Priority: {getPriority(priorityFilter)?.name}
                 <button onClick={() => removeFilter('priority')}><X className="w-3 h-3 hover:text-rose-900" /></button>
               </span>
             )}
             {statusFilter !== 'All' && view === 'list' && (
               <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700">
                 Status: {getStatus(statusFilter)?.name}
                 <button onClick={() => removeFilter('status')}><X className="w-3 h-3 hover:text-emerald-900" /></button>
               </span>
             )}
          </div>
        </div>

        {/* Bulk Action Toolbar (List View Only) */}
        {view === 'list' && selectedTasks.length > 0 && (
          <div className="flex items-center gap-4 p-3 bg-[#24C4D6]/10 border border-[#24C4D6]/20 rounded-xl shadow-sm animate-in fade-in slide-in-from-top-2">
            <span className="text-sm font-semibold text-[#1e9ba8]">{selectedTasks.length} selected</span>
            <div className="h-4 w-px bg-[#24C4D6]/30" />
            
            <Select onValueChange={(val) => bulkUpdateMutation.mutate({ ids: selectedTasks, updates: { status_id: val } })}>
              <SelectTrigger className="h-8 w-[130px] bg-white text-xs border-[#24C4D6]/30 text-slate-700"><SelectValue placeholder="Set Status" /></SelectTrigger>
              <SelectContent>{statuses.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
            </Select>

            <Select onValueChange={(val) => bulkUpdateMutation.mutate({ ids: selectedTasks, updates: { priority_id: val } })}>
              <SelectTrigger className="h-8 w-[130px] bg-white text-xs border-[#24C4D6]/30 text-slate-700"><SelectValue placeholder="Set Priority" /></SelectTrigger>
              <SelectContent>{priorities.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
            </Select>

            <Select onValueChange={(val) => bulkUpdateMutation.mutate({ ids: selectedTasks, updates: { category_id: val, subcategory_id: null } })}>
              <SelectTrigger className="h-8 w-[140px] bg-white text-xs border-[#24C4D6]/30 text-slate-700"><SelectValue placeholder="Set Category" /></SelectTrigger>
              <SelectContent>{parentCategories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>

            <Button size="sm" variant="destructive" className="h-8 ml-auto" onClick={() => {
              if (confirm(`Delete ${selectedTasks.length} tasks?`)) bulkDeleteMutation.mutate(selectedTasks);
            }}>
              <Trash2 className="w-4 h-4 mr-1.5" /> Delete
            </Button>
          </div>
        )}

        {/* KANBAN VIEW */}
        {view === 'kanban' && (
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="flex gap-6 overflow-x-auto pb-4 items-start h-[calc(100vh-280px)]">
              {statuses.map(status => (
                <div key={status.id} className="flex flex-col gap-3 min-w-[300px] w-[300px] shrink-0 h-full">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: status.color || '#cbd5e1' }} />
                      {status.name}
                    </h3>
                    <span className="bg-slate-200 text-slate-600 text-xs font-bold px-2 py-1 rounded-full">
                      {columns[status.id]?.length || 0}
                    </span>
                  </div>
                  
                  <Droppable droppableId={status.id}>
                    {(provided) => (
                      <div 
                        {...provided.droppableProps} 
                        ref={provided.innerRef}
                        className="flex-1 bg-slate-100/50 rounded-xl p-2 overflow-y-auto"
                      >
                        {(columns[status.id] || []).map((task, idx) => {
                          const cat = getCategory(task.category_id);
                          const sub = getCategory(task.subcategory_id);
                          const prio = getPriority(task.priority_id);
                          const cardColor = sub?.color || cat?.color || 'transparent';
                          
                          return (
                            <Draggable key={task.id} draggableId={task.id} index={idx}>
                              {(provided) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className="mb-3"
                                >
                                  <Card 
                                    className={`bg-white border-y border-r border-l-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer group relative overflow-hidden ${status.name === 'On Hold' ? 'opacity-50 bg-slate-50' : ''}`}
                                    onClick={() => openTask(task)}
                                  >
                                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${status.name === 'On Hold' ? 'opacity-50' : ''}`} style={{ backgroundColor: cardColor !== 'transparent' ? cardColor : '#e2e8f0' }} />
                                    <CardContent className="p-4 pl-5 flex flex-col gap-3">
                                      <div className="flex justify-between items-start gap-2 relative">
                                        <h4 className={`font-medium text-sm leading-snug pr-6 ${status.name === 'On Hold' ? 'text-slate-500' : 'text-slate-800'}`}>{task.title}</h4>
                                        {status.name === 'New' && (
                                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#24C4D6] rounded-full shadow-[0_0_8px_rgba(36,196,214,0.8)] animate-pulse flex items-center justify-center">
                                            <Sparkles className="w-2 h-2 text-white" />
                                          </div>
                                        )}
                                      </div>
                                      
                                      <div className="flex flex-wrap gap-2 mt-auto">
                                        {cat && (
                                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md tracking-wider"
                                                style={{ backgroundColor: `${cat.color}20`, color: cat.color }}>
                                            {cat.name}
                                          </span>
                                        )}
                                        {sub && (
                                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md tracking-wider"
                                                style={{ backgroundColor: `${sub.color}20`, color: sub.color }}>
                                            {sub.name}
                                          </span>
                                        )}
                                        {prio && (
                                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider"
                                                style={{ backgroundColor: `${prio.color}20`, color: prio.color }}>
                                            {prio.name}
                                          </span>
                                        )}
                                      </div>

                                      <div className="flex justify-between items-center mt-1 border-t border-slate-50 pt-2">
                                        {task.send_to_pixelboard ? (
                                          <span className="flex items-center text-[10px] font-bold text-[#24C4D6] bg-[#24C4D6]/10 px-1.5 py-0.5 rounded">
                                            ✅ Sent to PixelBoard
                                          </span>
                                        ) : (
                                          <button 
                                            className="flex items-center text-[10px] font-semibold text-slate-400 hover:text-[#24C4D6] transition-colors opacity-0 group-hover:opacity-100"
                                            onClick={(e) => { e.stopPropagation(); sendToPixelBoard(task); }}
                                          >
                                            📬 Send to PixelBoard
                                          </button>
                                        )}
                                      </div>
                                    </CardContent>
                                  </Card>
                                </div>
                              )}
                            </Draggable>
                          )
                        })}
                        {provided.placeholder}
                        
                        {addingTaskCol === status.id ? (
                          <div className="bg-white p-3 rounded-lg border border-[#24C4D6] shadow-sm">
                            <Input 
                              autoFocus
                              placeholder="Task title..."
                              value={newTaskTitle}
                              onChange={e => setNewTaskTitle(e.target.value)}
                              onKeyDown={e => e.key === 'Enter' && handleInlineAdd(status.id)}
                              className="h-8 text-sm mb-2"
                            />
                            <div className="flex gap-2">
                              <Button size="sm" className="h-7 text-xs bg-[#24C4D6] hover:bg-[#1db0c0]" onClick={() => handleInlineAdd(status.id)}>Add</Button>
                              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setAddingTaskCol(null)}>Cancel</Button>
                            </div>
                          </div>
                        ) : (
                          <button 
                            className="flex items-center justify-center w-full py-2 text-sm text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 rounded-lg transition-colors"
                            onClick={() => { setAddingTaskCol(status.id); setNewTaskTitle(''); }}
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
                    <th className="px-4 py-4 w-12 text-center">
                      <input 
                        type="checkbox" 
                        className="rounded border-slate-300 text-[#24C4D6] focus:ring-[#24C4D6]"
                        checked={selectedTasks.length === filteredTasks.length && filteredTasks.length > 0}
                        onChange={e => {
                          if (e.target.checked) setSelectedTasks(filteredTasks.map(t => t.id));
                          else setSelectedTasks([]);
                        }}
                      />
                    </th>
                    <th className="px-4 py-4">Title</th>
                    <th className="px-4 py-4">Category</th>
                    <th className="px-4 py-4">Subcategory</th>
                    <th className="px-4 py-4">Priority</th>
                    <th className="px-4 py-4">Status</th>
                    <th className="px-4 py-4">Details</th>
                    <th className="px-4 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTasks.map(task => {
                    const cat = getCategory(task.category_id);
                    const sub = getCategory(task.subcategory_id);
                    const prio = getPriority(task.priority_id);
                    return (
                      <tr key={task.id} className={`hover:bg-slate-50 transition-colors group ${selectedTasks.includes(task.id) ? 'bg-slate-50' : ''} ${getStatus(task.status_id)?.name === 'On Hold' ? 'opacity-50' : ''}`}>
                        <td className="px-4 py-4 text-center">
                          <input 
                            type="checkbox"
                            className="rounded border-slate-300 text-[#24C4D6] focus:ring-[#24C4D6]"
                            checked={selectedTasks.includes(task.id)}
                            onChange={e => {
                              if (e.target.checked) setSelectedTasks([...selectedTasks, task.id]);
                              else setSelectedTasks(selectedTasks.filter(id => id !== task.id));
                            }}
                          />
                        </td>
                        <td className="px-4 py-4 font-medium text-slate-800">
                          <button onClick={() => openTask(task)} className="hover:text-[#24C4D6] hover:underline text-left">
                            {task.title}
                          </button>
                        </td>
                        <td className="px-4 py-4">
                          {cat && (
                            <span className="text-[10px] font-bold px-2 py-1 rounded-md"
                                  style={{ backgroundColor: `${cat.color}20`, color: cat.color }}>
                              {cat.name}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          {sub && (
                            <span className="text-[10px] font-bold px-2 py-1 rounded-md"
                                  style={{ backgroundColor: `${sub.color}20`, color: sub.color }}>
                              {sub.name}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          {prio && (
                            <span className="text-[10px] font-bold px-2 py-1 rounded-md uppercase"
                                  style={{ backgroundColor: `${prio.color}20`, color: prio.color }}>
                              {prio.name}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <Select 
                            value={task.status_id} 
                            onValueChange={(val) => updateMutation.mutate({ id: task.id, data: { status_id: val }})}
                          >
                            <SelectTrigger className="h-8 text-xs w-[140px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {statuses.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-4 py-4 text-slate-500 max-w-[200px] truncate">
                          {task.details || '-'}
                        </td>
                        <td className="px-4 py-4 text-right">
                          {task.send_to_pixelboard ? (
                            <span className="inline-flex items-center text-[10px] font-bold text-[#24C4D6] bg-[#24C4D6]/10 px-1.5 py-0.5 rounded whitespace-nowrap">
                              ✅ Sent to PixelBoard
                            </span>
                          ) : (
                            <Button size="sm" variant="ghost" className="text-[#24C4D6] h-8 opacity-0 group-hover:opacity-100 whitespace-nowrap" onClick={() => sendToPixelBoard(task)}>
                              📬 Send to PixelBoard
                            </Button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                  {filteredTasks.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                        No tasks found. Try adjusting filters or create a new task!
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
            <div className="flex justify-between items-center">
              <SheetTitle className="text-2xl text-slate-800">Task Details</SheetTitle>
              {editingTask && (
                <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-50 hover:text-red-600" onClick={() => {
                  if (confirm('Delete this task?')) deleteMutation.mutate(editingTask.id);
                }}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
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
                  <Select value={editingTask.status_id || ''} onValueChange={v => setEditingTask({...editingTask, status_id: v})}>
                    <SelectTrigger className="bg-white"><SelectValue placeholder="Select Status" /></SelectTrigger>
                    <SelectContent>
                      {statuses.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-600">Priority</label>
                  <Select value={editingTask.priority_id || ''} onValueChange={v => setEditingTask({...editingTask, priority_id: v})}>
                    <SelectTrigger className="bg-white"><SelectValue placeholder="Select Priority" /></SelectTrigger>
                    <SelectContent>
                      {priorities.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-600">Category</label>
                  <Select value={editingTask.category_id || ''} onValueChange={v => setEditingTask({...editingTask, category_id: v === 'none' ? null : v, subcategory_id: null})}>
                    <SelectTrigger className="bg-white"><SelectValue placeholder="No Category" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Category</SelectItem>
                      {parentCategories.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                {availableSubsForEditing.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-600">Subcategory</label>
                    <Select value={editingTask.subcategory_id || ''} onValueChange={v => setEditingTask({...editingTask, subcategory_id: v === 'none' ? null : v})}>
                      <SelectTrigger className="bg-white"><SelectValue placeholder="No Subcategory" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Subcategory</SelectItem>
                        {availableSubsForEditing.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}
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

              <div className="space-y-3 pt-4 border-t border-slate-200">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-semibold text-slate-600">Custom Fields</h4>
                  <Button variant="ghost" size="sm" className="h-7 text-xs text-[#24C4D6]" onClick={() => {
                    const name = prompt("New custom field name:");
                    if (name) {
                      setEditingTask({
                        ...editingTask,
                        custom_fields: { ...editingTask.custom_fields, [name]: '' }
                      });
                    }
                  }}>
                    <Plus className="w-3 h-3 mr-1" /> Add Field
                  </Button>
                </div>
                
                {Object.entries(editingTask.custom_fields || {}).map(([key, val]) => (
                  <div key={key} className="space-y-1 relative group">
                    <label className="text-xs text-slate-500 uppercase">{key}</label>
                    <Input 
                      value={val} 
                      onChange={e => setEditingTask({
                        ...editingTask, 
                        custom_fields: { ...editingTask.custom_fields, [key]: e.target.value }
                      })}
                      className="bg-white h-9"
                    />
                    <button 
                      className="absolute right-2 top-6 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600"
                      onClick={() => {
                        const newFields = { ...editingTask.custom_fields };
                        delete newFields[key];
                        setEditingTask({ ...editingTask, custom_fields: newFields });
                      }}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="pt-6">
                <Button onClick={saveTask} className="w-full bg-[#24C4D6] hover:bg-[#1db0c0]">Save Changes</Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Settings Modal */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl text-slate-800">Task Settings</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="categories" className="mt-4">
            <TabsList className="grid grid-cols-3 w-full max-w-md">
              <TabsTrigger value="categories">Categories & Subs</TabsTrigger>
              <TabsTrigger value="statuses">Statuses</TabsTrigger>
              <TabsTrigger value="priorities">Priorities</TabsTrigger>
            </TabsList>

            <TabsContent value="categories" className="space-y-6 pt-4">
              <div className="grid gap-6">
                {parentCategories.map(cat => (
                  <div key={cat.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-3">
                      <input 
                        type="color" 
                        defaultValue={cat.color || '#24C4D6'} 
                        onBlur={e => base44.entities.TaskCategory.update(cat.id, { color: e.target.value }).then(() => queryClient.invalidateQueries(['task_categories']))}
                        className="w-8 h-8 rounded cursor-pointer border-0 p-0 shrink-0"
                      />
                      <Input 
                        defaultValue={cat.name}
                        onBlur={e => {
                          if (e.target.value !== cat.name) {
                            base44.entities.TaskCategory.update(cat.id, { name: e.target.value }).then(() => queryClient.invalidateQueries(['task_categories']))
                          }
                        }}
                        className="bg-white flex-1 font-semibold text-slate-800"
                      />
                      <Button variant="ghost" size="icon" className="text-red-500" onClick={() => {
                        if (confirm("Delete category and its subcategories?")) {
                          base44.entities.TaskCategory.delete(cat.id).then(() => queryClient.invalidateQueries(['task_categories']));
                        }
                      }}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Subcategories inside this parent */}
                    <div className="pl-11 pt-3 space-y-2">
                      {subCategories.filter(s => s.parent_category_id === cat.id).map(sub => (
                        <div key={sub.id} className="flex items-center gap-3">
                          <div className="w-4 h-px bg-slate-300" />
                          <input 
                            type="color" 
                            defaultValue={sub.color || cat.color || '#cbd5e1'} 
                            onBlur={e => base44.entities.TaskCategory.update(sub.id, { color: e.target.value }).then(() => queryClient.invalidateQueries(['task_categories']))}
                            className="w-6 h-6 rounded cursor-pointer border-0 p-0 shrink-0"
                          />
                          <Input 
                            defaultValue={sub.name}
                            onBlur={e => {
                              if (e.target.value !== sub.name) {
                                base44.entities.TaskCategory.update(sub.id, { name: e.target.value }).then(() => queryClient.invalidateQueries(['task_categories']))
                              }
                            }}
                            className="bg-white h-8 text-sm flex-1"
                          />
                          <Button variant="ghost" size="sm" className="text-slate-400 hover:text-red-500 h-8 px-2" onClick={() => {
                            if (confirm("Delete subcategory?")) {
                              base44.entities.TaskCategory.delete(sub.id).then(() => queryClient.invalidateQueries(['task_categories']));
                            }
                          }}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                      <div className="flex items-center gap-3 pl-7">
                        <Button variant="ghost" size="sm" className="text-[#24C4D6] hover:bg-[#24C4D6]/10 h-8" onClick={() => {
                          base44.entities.TaskCategory.create({ name: 'New Subcategory', parent_category_id: cat.id, color: cat.color })
                            .then(() => queryClient.invalidateQueries(['task_categories']));
                        }}>
                          <Plus className="w-3 h-3 mr-1" /> Add Subcategory
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                
                <Button variant="outline" className="border-dashed h-12" onClick={() => {
                  base44.entities.TaskCategory.create({ name: 'New Category', color: '#cbd5e1' })
                    .then(() => queryClient.invalidateQueries(['task_categories']));
                }}>
                  <Plus className="w-4 h-4 mr-2" /> Add Parent Category
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="statuses" className="space-y-4 pt-4">
              <div className="grid gap-3">
                {statuses.map((stat, idx) => (
                  <div key={stat.id} className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="text-slate-400 w-4 font-mono text-xs">{idx + 1}</span>
                    <input 
                      type="color" 
                      defaultValue={stat.color || '#e2e8f0'} 
                      onBlur={e => base44.entities.TaskStatus.update(stat.id, { color: e.target.value }).then(() => queryClient.invalidateQueries(['task_statuses']))}
                      className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                    />
                    <Input 
                      defaultValue={stat.name}
                      onBlur={e => {
                        if (e.target.value !== stat.name) {
                          base44.entities.TaskStatus.update(stat.id, { name: e.target.value }).then(() => queryClient.invalidateQueries(['task_statuses']))
                        }
                      }}
                      className="bg-white flex-1"
                    />
                    <Button variant="ghost" size="icon" className="text-red-500" onClick={() => {
                      if (confirm("Delete status? Note: tasks with this status might disappear from kanban.")) {
                        base44.entities.TaskStatus.delete(stat.id).then(() => queryClient.invalidateQueries(['task_statuses']));
                      }
                    }}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" className="border-dashed" onClick={() => {
                  base44.entities.TaskStatus.create({ name: 'New Status', order: statuses.length, color: '#e2e8f0' })
                    .then(() => queryClient.invalidateQueries(['task_statuses']));
                }}>
                  <Plus className="w-4 h-4 mr-2" /> Add Status
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="priorities" className="space-y-4 pt-4">
              <div className="grid gap-3">
                {priorities.map((prio, idx) => (
                  <div key={prio.id} className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="text-slate-400 w-4 font-mono text-xs">{idx + 1}</span>
                    <input 
                      type="color" 
                      defaultValue={prio.color || '#e2e8f0'} 
                      onBlur={e => base44.entities.TaskPriority.update(prio.id, { color: e.target.value }).then(() => queryClient.invalidateQueries(['task_priorities']))}
                      className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                    />
                    <Input 
                      defaultValue={prio.name}
                      onBlur={e => {
                        if (e.target.value !== prio.name) {
                          base44.entities.TaskPriority.update(prio.id, { name: e.target.value }).then(() => queryClient.invalidateQueries(['task_priorities']))
                        }
                      }}
                      className="bg-white flex-1"
                    />
                    <Button variant="ghost" size="icon" className="text-red-500" onClick={() => {
                      if (confirm("Delete priority?")) {
                        base44.entities.TaskPriority.delete(prio.id).then(() => queryClient.invalidateQueries(['task_priorities']));
                      }
                    }}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" className="border-dashed" onClick={() => {
                  base44.entities.TaskPriority.create({ name: 'New Priority', level: priorities.length, color: '#e2e8f0' })
                    .then(() => queryClient.invalidateQueries(['task_priorities']));
                }}>
                  <Plus className="w-4 h-4 mr-2" /> Add Priority
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* CSV Import Modal */}
      <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl text-slate-800">Import Tasks from CSV</DialogTitle>
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
                <p className="text-sm text-slate-600 bg-blue-50 p-3 rounded-lg">Map your CSV columns to Task fields. Unmapped columns will be imported as custom fields if named.</p>
                <div className="max-h-[50vh] overflow-y-auto pr-2 space-y-3">
                  {csvHeaders.map((header, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <div className="w-1/3 font-medium text-sm text-slate-700 truncate" title={header}>{header}</div>
                      <div className="flex-1 flex gap-2">
                        <Select 
                          value={columnMapping[idx]?.type + (columnMapping[idx]?.type === 'field' ? `:${columnMapping[idx]?.value}` : '')}
                          onValueChange={(val) => {
                            if (val === 'skip') setColumnMapping({...columnMapping, [idx]: { type: 'skip' }});
                            else if (val === 'custom') setColumnMapping({...columnMapping, [idx]: { type: 'custom', name: header }});
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
                  Missing categories, statuses, and priorities will be auto-created!
                </p>
                <div className="flex justify-center gap-3 pt-6">
                  <Button variant="outline" onClick={() => setImportStep(2)} disabled={isImporting}>Back</Button>
                  <Button 
                    className="bg-[#24C4D6] hover:bg-[#1db0c0]" 
                    onClick={executeImport}
                    disabled={isImporting}
                  >
                    {isImporting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Importing...</> : 'Start Import'}
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