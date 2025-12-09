import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Lightbulb, Cloud, Heart, Utensils, StickyNote, Trash2, Check, 
  Calendar, Clock, Sparkles, Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../components/shared/useTheme';

const noteTypeConfig = {
  idea: { icon: Lightbulb, label: 'Ideas', color: 'bg-yellow-100 text-yellow-800', emoji: '💡' },
  negative_thought: { icon: Cloud, label: 'Reframes', color: 'bg-purple-100 text-purple-800', emoji: '☁️' },
  gratitude: { icon: Heart, label: 'Gratitude', color: 'bg-red-100 text-red-800', emoji: '❤️' },
  food: { icon: Utensils, label: 'Food Log', color: 'bg-orange-100 text-orange-800', emoji: '🍽️' },
  note: { icon: StickyNote, label: 'Notes', color: 'bg-green-100 text-green-800', emoji: '📝' },
  task: { icon: Check, label: 'Tasks', color: 'bg-teal-100 text-teal-800', emoji: '✅' },
};

export default function QuickNotes() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const { bgClass, textClass, cardBgClass, primaryColor, accentColor } = useTheme();

  React.useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ['quickNotes', user?.email],
    queryFn: () => base44.entities.QuickNote.filter({ created_by: user.email }, '-created_date'),
    enabled: !!user,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.QuickNote.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['quickNotes'] }),
  });

  const markProcessedMutation = useMutation({
    mutationFn: (id) => base44.entities.QuickNote.update(id, { is_processed: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['quickNotes'] }),
  });

  const filteredNotes = activeTab === 'all' 
    ? notes 
    : notes.filter(n => n.type === activeTab);

  const groupedByDate = filteredNotes.reduce((acc, note) => {
    const date = format(new Date(note.created_date), 'yyyy-MM-dd');
    if (!acc[date]) acc[date] = [];
    acc[date].push(note);
    return acc;
  }, {});

  // Count by type
  const typeCounts = notes.reduce((acc, note) => {
    acc[note.type] = (acc[note.type] || 0) + 1;
    return acc;
  }, {});

  if (isLoading) {
    return (
      <div className={`min-h-screen ${bgClass} flex items-center justify-center`}>
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${bgClass} p-4 md:p-8`}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 
            className="text-3xl font-bold bg-clip-text text-transparent mb-2"
            style={{ backgroundImage: `linear-gradient(to right, ${primaryColor || '#8B5CF6'}, ${accentColor || '#EC4899'})` }}
          >
            📝 My Quick Notes
          </h1>
          <p className="text-gray-600">
            All your ideas, gratitudes, tasks, and captured thoughts
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex flex-wrap gap-1 h-auto p-1">
            <TabsTrigger value="all" className="gap-1">
              <Sparkles className="w-4 h-4" />
              All ({notes.length})
            </TabsTrigger>
            {Object.entries(noteTypeConfig).map(([type, config]) => {
              const count = typeCounts[type] || 0;
              if (count === 0) return null;
              const Icon = config.icon;
              return (
                <TabsTrigger key={type} value={type} className="gap-1">
                  <Icon className="w-4 h-4" />
                  {config.label} ({count})
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {filteredNotes.length === 0 ? (
              <Card className={cardBgClass}>
                <CardContent className="p-12 text-center">
                  <StickyNote className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className={`text-xl font-semibold mb-2 ${textClass}`}>No notes yet</h3>
                  <p className="text-gray-600">
                    Use the quick actions bar to capture ideas, gratitudes, tasks, and more!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedByDate).map(([date, dateNotes]) => (
                  <div key={date}>
                    <div className="flex items-center gap-2 mb-3">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <h3 className={`font-semibold ${textClass}`}>
                        {format(new Date(date), 'EEEE, MMMM d, yyyy')}
                      </h3>
                    </div>
                    <div className="space-y-3">
                      <AnimatePresence>
                        {dateNotes.map((note, index) => {
                          const config = noteTypeConfig[note.type] || noteTypeConfig.note;
                          const Icon = config.icon;
                          
                          return (
                            <motion.div
                              key={note.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, x: -100 }}
                              transition={{ delay: index * 0.05 }}
                            >
                              <Card className={`${cardBgClass} ${note.is_processed ? 'opacity-60' : ''}`}>
                                <CardContent className="p-4">
                                  <div className="flex items-start gap-4">
                                    <div className={`w-10 h-10 rounded-xl ${config.color.split(' ')[0]} flex items-center justify-center flex-shrink-0`}>
                                      <span className="text-lg">{config.emoji}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1">
                                        <Badge className={`${config.color} border-0 text-xs`}>
                                          {config.label}
                                        </Badge>
                                        <span className="text-xs text-gray-400">
                                          {format(new Date(note.created_date), 'h:mm a')}
                                        </span>
                                        {note.is_processed && (
                                          <Badge variant="outline" className="text-xs">
                                            <Check className="w-3 h-3 mr-1" />
                                            Processed
                                          </Badge>
                                        )}
                                      </div>
                                      <p className={`${textClass} whitespace-pre-wrap`}>{note.content}</p>
                                      {note.reframe && (
                                        <div className="mt-2 p-2 bg-purple-50 rounded-lg">
                                          <p className="text-sm text-purple-800">
                                            <strong>Reframe:</strong> {note.reframe}
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex gap-1 flex-shrink-0">
                                      {!note.is_processed && (
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => markProcessedMutation.mutate(note.id)}
                                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                          title="Mark as processed"
                                        >
                                          <Check className="w-4 h-4" />
                                        </Button>
                                      )}
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => deleteMutation.mutate(note.id)}
                                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}