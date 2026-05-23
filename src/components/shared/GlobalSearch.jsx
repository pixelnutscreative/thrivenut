import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Search, Loader2, FileText, Calendar, Link as LinkIcon, Users, ChevronRight } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';

export default function GlobalSearch({ userEmail }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const { data: tasks = [] } = useQuery({
    queryKey: ['search_tasks', userEmail],
    queryFn: () => base44.entities.Task.filter({ created_by: userEmail }),
    enabled: open,
  });

  const { data: resources = [] } = useQuery({
    queryKey: ['search_resources', userEmail],
    queryFn: () => base44.entities.UserResource.filter({ user_email: userEmail }),
    enabled: open,
  });

  const { data: events = [] } = useQuery({
    queryKey: ['search_events'],
    queryFn: () => base44.entities.GroupEvent.list(),
    enabled: open,
  });

  const { data: groups = [] } = useQuery({
    queryKey: ['search_groups'],
    queryFn: () => base44.entities.CreatorGroup.list(),
    enabled: open,
  });

  const results = React.useMemo(() => {
    if (!query.trim() || query.length < 2) return [];
    
    const q = query.toLowerCase();
    const matchedTasks = tasks.filter(t => t.title?.toLowerCase().includes(q)).slice(0, 3).map(t => ({ ...t, _type: 'Task', icon: FileText, path: 'Tasks' }));
    const matchedResources = resources.filter(r => r.title?.toLowerCase().includes(q)).slice(0, 3).map(r => ({ ...r, _type: 'Resource', icon: LinkIcon, path: 'MyResources' }));
    const matchedEvents = events.filter(e => e.title?.toLowerCase().includes(q)).slice(0, 3).map(e => ({ ...e, _type: 'Event', icon: Calendar, path: `CreatorGroups?id=${e.group_id}&tab=events` }));
    const matchedGroups = groups.filter(g => g.name?.toLowerCase().includes(q)).slice(0, 3).map(g => ({ ...g, _type: 'Group', icon: Users, path: `CreatorGroups?id=${g.id}`, title: g.name }));

    return [...matchedTasks, ...matchedResources, ...matchedEvents, ...matchedGroups];
  }, [query, tasks, resources, events, groups]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500">
          <Search className="w-5 h-5" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center border-b px-3">
          <Search className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
          <Input 
            value={query} 
            onChange={e => setQuery(e.target.value)} 
            placeholder="Search tasks, resources, events..." 
            className="border-0 focus-visible:ring-0 px-0 h-12 shadow-none"
            autoFocus
          />
        </div>
        <div className="max-h-80 overflow-y-auto p-2">
          {query.length > 1 ? (
            results.length > 0 ? (
              <div className="space-y-1">
                {results.map((res, i) => {
                  const Icon = res.icon;
                  return (
                    <Link 
                      key={i} 
                      to={createPageUrl(res.path)} 
                      onClick={() => setOpen(false)}
                      className="flex items-center justify-between p-2 hover:bg-gray-100 rounded-lg transition-colors group"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="p-1.5 bg-gray-100 text-gray-500 rounded-md group-hover:bg-white group-hover:text-purple-600 transition-colors">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="truncate">
                          <div className="text-sm font-medium text-gray-900 truncate">{res.title}</div>
                          <div className="text-[10px] text-gray-400 uppercase tracking-wider">{res._type}</div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-purple-600" />
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="py-6 text-center text-sm text-gray-500">No results found for "{query}"</div>
            )
          ) : (
            <div className="py-6 text-center text-sm text-gray-400">Type at least 2 characters to search...</div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}