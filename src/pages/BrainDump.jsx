import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../components/shared/useTheme';
import { format } from 'date-fns';

import { Brain, Trash2, Save, Plus, Tag, Search, Check, ListFilter, Sparkles, Loader2, X, RefreshCw } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

export default function BrainDump() {
  const { bgClass, textClass, cardBgClass, primaryColor, accentColor, user } = useTheme();
  const queryClient = useQueryClient();
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analysisResults, setAnalysisResults] = useState([]);

  const { data: dumps = [] } = useQuery({
    queryKey: ['brainDumps', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return await base44.entities.BrainDump.filter({ is_processed: false, created_by: user.email }, '-created_date');
    },
    enabled: !!user?.email
  });

  const analyzeBrainDump = async () => {
    if (dumps.length === 0) return;
    setIsAnalyzing(true);
    try {
      const dumpTexts = dumps.map(d => `- [ID:${d.id}] ${d.content}`).join('\n');
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze these brain dump items and categorize them into actionable types.
        Items:
        ${dumpTexts}
        
        Return a JSON object with a list of items. Each item should have:
        - original_id (extract from the ID tag)
        - type (one of: 'task', 'goal', 'habit', 'note', 'event')
        - suggested_title (clear, actionable title)
        - suggested_category (e.g. Work, Personal, Health)
        - reasoning (brief why)`,
        response_json_schema: {
          type: "object",
          properties: {
            analysis: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  original_id: { type: "string" },
                  type: { type: "string" },
                  suggested_title: { type: "string" },
                  suggested_category: { type: "string" },
                  reasoning: { type: "string" }
                }
              }
            }
          }
        }
      });
      setAnalysisResults(response.analysis || []);
      setShowAnalysis(true);
    } catch (err) {
      console.error(err);
      alert('Failed to analyze. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const processAnalysisItem = async (item) => {
    // Convert logic based on type
    try {
      if (item.type === 'task') {
        await base44.entities.Task.create({ title: item.suggested_title, category: item.suggested_category, status: 'pending', created_by: user.email });
      } else if (item.type === 'goal') {
        await base44.entities.Goal.create({ title: item.suggested_title, category: item.suggested_category, created_by: user.email });
      } else if (item.type === 'habit') {
        await base44.entities.Habit.create({ title: item.suggested_title, category: item.suggested_category, created_by: user.email });
      } else if (item.type === 'event') {
        await base44.entities.ExternalEvent.create({ title: item.suggested_title, date: new Date().toISOString().split('T')[0], created_by: user.email });
      }
      // Mark original dump as processed
      await base44.entities.BrainDump.update(item.original_id, { is_processed: true });
      
      // Update local state
      setAnalysisResults(prev => prev.filter(r => r.original_id !== item.original_id));
      queryClient.invalidateQueries(['brainDumps']);
    } catch (err) {
      console.error(err);
    }
  };

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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-100 rounded-xl">
              <Brain className="w-8 h-8 text-indigo-600" />
            </div>
            <div>
              <h1 className={`text-3xl font-bold ${textClass}`}>Brain Dump</h1>
              <p className="text-gray-500">Get it out of your head and organize it later.</p>
            </div>
          </div>
          <Button 
            onClick={analyzeBrainDump} 
            disabled={isAnalyzing || dumps.length === 0}
            className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white"
          >
            {isAnalyzing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
            AI Sort & Organize
          </Button>
        </div>

        <Dialog open={showAnalysis} onOpenChange={setShowAnalysis}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>AI Sorting Suggestions</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {analysisResults.length === 0 ? (
                <p className="text-center text-gray-500 py-4">All sorted! 🎉</p>
              ) : (
                analysisResults.map((item, idx) => (
                  <Card key={idx} className="bg-gray-50">
                    <CardContent className="p-4 flex items-start gap-4">
                      <div className={`p-2 rounded-lg shrink-0 ${
                        item.type === 'task' ? 'bg-blue-100 text-blue-600' :
                        item.type === 'goal' ? 'bg-purple-100 text-purple-600' :
                        item.type === 'habit' ? 'bg-green-100 text-green-600' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {item.type === 'task' ? <Check className="w-5 h-5" /> :
                         item.type === 'goal' ? <Tag className="w-5 h-5" /> :
                         item.type === 'habit' ? <RefreshCw className="w-5 h-5" /> :
                         <ListFilter className="w-5 h-5" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold capitalize">{item.type}</span>
                          <span className="text-sm bg-white px-2 rounded border">{item.suggested_category}</span>
                        </div>
                        <p className="font-medium text-gray-900">{item.suggested_title}</p>
                        <p className="text-xs text-gray-500 mt-1">{item.reasoning}</p>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => processAnalysisItem(item)}
                        className="bg-indigo-500 hover:bg-indigo-600 text-white"
                      >
                        Confirm
                      </Button>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>

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