import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  RefreshCw, ExternalLink, Search, ChevronDown, ChevronUp, 
  Plus, Loader2, ListTodo, Filter
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

export default function NotionTaskPicker({ userEmail, onAddToDay }) {
  const queryClient = useQueryClient();
  const today = format(new Date(), 'yyyy-MM-dd');
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isSyncing, setIsSyncing] = useState(false);

  // Fetch cached Notion tasks from our database
  const { data: cachedTasks = [], isLoading: loadingCached } = useQuery({
    queryKey: ['notionTasks', userEmail],
    queryFn: () => base44.entities.NotionTask.filter({ created_by: userEmail }),
    enabled: !!userEmail,
  });

  // Fetch tasks scheduled for today
  const { data: todaysTasks = [] } = useQuery({
    queryKey: ['notionTasksToday', today, userEmail],
    queryFn: () => base44.entities.NotionTask.filter({ 
      scheduled_for_date: today, 
      created_by: userEmail 
    }),
    enabled: !!userEmail,
  });

  const [syncError, setSyncError] = useState(null);

  // Sync from Notion
  const syncMutation = useMutation({
    mutationFn: async () => {
      setIsSyncing(true);
      setSyncError(null);
      const response = await base44.functions.invoke('fetchNotionTasks', {});
      
      console.log('Notion sync response:', response.data);
      
      if (response.data.error) {
        throw new Error(response.data.details || response.data.error);
      }
      
      const notionTasks = response.data.tasks || [];
      
      // Upsert tasks into our database
      for (const task of notionTasks) {
        const existing = cachedTasks.find(t => t.notion_id === task.notion_id);
        if (existing) {
          await base44.entities.NotionTask.update(existing.id, task);
        } else {
          await base44.entities.NotionTask.create(task);
        }
      }
      
      return notionTasks;
    },
    onSuccess: (tasks) => {
      queryClient.invalidateQueries({ queryKey: ['notionTasks'] });
      setIsSyncing(false);
      console.log(`Synced ${tasks.length} tasks from Notion`);
    },
    onError: (error) => {
      console.error('Sync error:', error);
      setSyncError(error.message);
      setIsSyncing(false);
    }
  });

  // Schedule task for today
  const scheduleTaskMutation = useMutation({
    mutationFn: async (taskId) => {
      return await base44.entities.NotionTask.update(taskId, {
        scheduled_for_date: today
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notionTasks'] });
      queryClient.invalidateQueries({ queryKey: ['notionTasksToday'] });
    }
  });

  // Unschedule task
  const unscheduleTaskMutation = useMutation({
    mutationFn: async (taskId) => {
      return await base44.entities.NotionTask.update(taskId, {
        scheduled_for_date: null
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notionTasks'] });
      queryClient.invalidateQueries({ queryKey: ['notionTasksToday'] });
    }
  });

  // Toggle task completion
  const toggleCompleteMutation = useMutation({
    mutationFn: async ({ taskId, completed }) => {
      return await base44.entities.NotionTask.update(taskId, {
        completed_in_app: completed
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notionTasks'] });
      queryClient.invalidateQueries({ queryKey: ['notionTasksToday'] });
    }
  });

  // Get unique categories and statuses for filters
  const categories = [...new Set(cachedTasks.map(t => t.category).filter(Boolean))];
  const statuses = [...new Set(cachedTasks.map(t => t.status).filter(Boolean))];

  // Filter tasks
  const filteredTasks = cachedTasks.filter(task => {
    // Don't show tasks already scheduled for today in the picker
    if (task.scheduled_for_date === today) return false;
    
    const matchesSearch = !searchQuery || 
      task.title?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || task.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-50 to-indigo-50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ListTodo className="w-5 h-5 text-indigo-500" />
            Notion Tasks
            <Badge variant="secondary" className="ml-2">{cachedTasks.length}</Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => syncMutation.mutate()}
              disabled={isSyncing}
              className="h-8"
            >
              {isSyncing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              <span className="ml-1 hidden sm:inline">Sync</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8"
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Sync error display */}
        {syncError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            <p className="font-medium">Sync failed:</p>
            <p className="mt-1">{syncError}</p>
          </div>
        )}

        {/* Today's scheduled tasks */}
        {todaysTasks.length > 0 && (
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-600 mb-2">Today's Notion Tasks</p>
            <div className="space-y-2">
              {todaysTasks.map(task => (
                <div 
                  key={task.id}
                  className={`flex items-center gap-3 p-2 rounded-lg bg-white border ${
                    task.completed_in_app ? 'border-green-300 bg-green-50' : 'border-gray-200'
                  }`}
                >
                  <Checkbox
                    checked={task.completed_in_app}
                    onCheckedChange={(checked) => 
                      toggleCompleteMutation.mutate({ taskId: task.id, completed: checked })
                    }
                  />
                  <div className={`flex-1 min-w-0 ${task.completed_in_app ? 'line-through text-gray-400' : ''}`}>
                    <p className="text-sm font-medium truncate">{task.title || 'Untitled Task'}</p>
                    {task.status && (
                      <p className="text-xs text-gray-500">{task.status}</p>
                    )}
                  </div>
                  {task.category && (
                    <Badge variant="outline" className="text-xs shrink-0">{task.category}</Badge>
                  )}
                  {task.notion_url && (
                    <a
                      href={task.notion_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 hover:bg-gray-100 rounded shrink-0"
                      title="Open in Notion"
                    >
                      <ExternalLink className="w-3 h-3 text-gray-400" />
                    </a>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => unscheduleTaskMutation.mutate(task.id)}
                    className="h-6 px-2 text-xs text-gray-400 hover:text-red-500 shrink-0"
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Expandable task picker */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              {/* Filters */}
              <div className="flex flex-wrap gap-2 mb-3">
                <div className="flex-1 min-w-[150px]">
                  <Input
                    placeholder="Search tasks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-8"
                  />
                </div>
                {categories.length > 0 && (
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-[130px] h-8">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {statuses.length > 0 && (
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[120px] h-8">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      {statuses.map(status => (
                        <SelectItem key={status} value={status}>{status}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Task list */}
              <div className="max-h-[300px] overflow-y-auto space-y-2">
                {loadingCached ? (
                  <div className="text-center py-4 text-gray-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Loading tasks...
                  </div>
                ) : filteredTasks.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    {cachedTasks.length === 0 ? (
                      <>
                        <p>No tasks synced yet.</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => syncMutation.mutate()}
                          className="mt-2"
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Sync from Notion
                        </Button>
                      </>
                    ) : (
                      <p>No tasks match your filters.</p>
                    )}
                  </div>
                ) : (
                  filteredTasks.slice(0, 50).map(task => (
                    <div
                      key={task.id}
                      className="flex items-center gap-2 p-2 rounded-lg bg-white border border-gray-200 hover:border-indigo-300 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-700 truncate">{task.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {task.status && (
                            <Badge variant="outline" className="text-xs">{task.status}</Badge>
                          )}
                          {task.category && (
                            <Badge variant="secondary" className="text-xs">{task.category}</Badge>
                          )}
                          {task.priority && (
                            <Badge 
                              className={`text-xs ${
                                task.priority?.toLowerCase?.().includes('high') ? 'bg-red-100 text-red-700' :
                                task.priority?.toLowerCase?.().includes('low') ? 'bg-green-100 text-green-700' :
                                'bg-yellow-100 text-yellow-700'
                              }`}
                            >
                              {task.priority}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => scheduleTaskMutation.mutate(task.id)}
                        className="h-7 px-2"
                      >
                        <Plus className="w-4 h-4" />
                        <span className="ml-1 hidden sm:inline">Add</span>
                      </Button>
                      {task.notion_url && (
                        <a
                          href={task.notion_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 hover:bg-gray-100 rounded"
                        >
                          <ExternalLink className="w-4 h-4 text-gray-400" />
                        </a>
                      )}
                    </div>
                  ))
                )}
                {filteredTasks.length > 50 && (
                  <p className="text-center text-sm text-gray-500 py-2">
                    Showing 50 of {filteredTasks.length} tasks. Use filters to narrow down.
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!isExpanded && cachedTasks.length > 0 && (
          <p className="text-sm text-gray-500 text-center">
            Click to expand and pick tasks for today
          </p>
        )}
      </CardContent>
    </Card>
  );
}