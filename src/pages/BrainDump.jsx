import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Brain, Trash2, Save, Plus, Tag, Search, Check, ListFilter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../components/shared/useTheme';
import { format } from 'date-fns';

export default function BrainDump() {
  const { bgClass, textClass, cardBgClass, primaryColor, accentColor } = useTheme();
  const queryClient = useQueryClient();
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  const { data: dumps = [] } = useQuery({
    queryKey: ['brainDumps'],
    queryFn: async () => {
      const results = await base44.entities.BrainDump.filter({ is_processed: false }, '-created_date');
      return results;
    }
  });

  const createDumpMutation = useMutation({
    mutationFn: (data) => base44.entities.BrainDump.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brainDumps'] });
      setContent('');
      setCategory('');
    }
  });

  const updateDumpMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.BrainDump.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brainDumps'] });
    }
  });

  const deleteDumpMutation = useMutation({
    mutationFn: (id) => base44.entities.BrainDump.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brainDumps'] });
    }
  });

  const handleSave = () => {
    if (!content.trim()) return;
    createDumpMutation.mutate({
      content,
      category: category.trim() || 'General',
      is_processed: false
    });
  };

  const handleProcess = (id) => {
    updateDumpMutation.mutate({ id, data: { is_processed: true } });
  };

  // Extract unique categories
  const categories = [...new Set(dumps.map(d => d.category || 'General'))];

  const filteredDumps = dumps.filter(dump => {
    const matchesSearch = dump.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || (dump.category || 'General') === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className={`min-h-screen ${bgClass} p-4 md:p-8`}>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-100 rounded-xl">
            <Brain className="w-8 h-8 text-indigo-600" />
          </div>
          <div>
            <h1 className={`text-3xl font-bold ${textClass}`}>Brain Dump</h1>
            <p className="text-gray-500">Get it out of your head and organize it later.</p>
          </div>
        </div>

        <Card className={`${cardBgClass} border-indigo-200 shadow-md`}>
          <CardContent className="p-6 space-y-4">
            <Textarea 
              placeholder="What's on your mind? Tasks, ideas, random thoughts..." 
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[120px] text-lg bg-white/50"
            />
            <div className="flex gap-3">
              <Input 
                placeholder="Category (optional)" 
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="max-w-[200px]"
              />
              <Button 
                onClick={handleSave} 
                disabled={!content.trim() || createDumpMutation.isPending}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Thought
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white/50 p-4 rounded-xl backdrop-blur-sm">
          <div className="relative w-full md:w-auto flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input 
              placeholder="Search your thoughts..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-white"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-2 md:pb-0">
            <Button 
              size="sm" 
              variant={filterCategory === 'all' ? 'default' : 'outline'}
              onClick={() => setFilterCategory('all')}
              className={filterCategory === 'all' ? 'bg-indigo-600' : ''}
            >
              All
            </Button>
            {categories.map(cat => (
              <Button 
                key={cat}
                size="sm" 
                variant={filterCategory === cat ? 'default' : 'outline'}
                onClick={() => setFilterCategory(cat)}
                className={filterCategory === cat ? 'bg-indigo-600' : ''}
              >
                {cat}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <AnimatePresence>
            {filteredDumps.map(dump => (
              <motion.div
                key={dump.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                layout
              >
                <Card className="h-full hover:shadow-lg transition-shadow border-l-4 border-l-indigo-400 bg-white">
                  <CardContent className="p-4 flex flex-col h-full justify-between gap-4">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-semibold px-2 py-1 bg-gray-100 rounded-full text-gray-600">
                          {dump.category || 'General'}
                        </span>
                        <span className="text-xs text-gray-400">
                          {format(new Date(dump.created_date), 'MMM d')}
                        </span>
                      </div>
                      <p className="text-gray-800 whitespace-pre-wrap">{dump.content}</p>
                    </div>
                    <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => deleteDumpMutation.mutate(dump.id)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleProcess(dump.id)}
                        className="text-green-600 hover:bg-green-50 border-green-200"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Processed
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
          {filteredDumps.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-400 bg-white/30 rounded-xl border-2 border-dashed border-gray-200">
              <Brain className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>No thoughts found. Start dumping!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}