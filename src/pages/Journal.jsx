import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Calendar, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

const moodTags = [
  { value: 'grateful', label: 'Grateful', emoji: '🙏', color: 'bg-green-100 text-green-800' },
  { value: 'reflective', label: 'Reflective', emoji: '🤔', color: 'bg-purple-100 text-purple-800' },
  { value: 'excited', label: 'Excited', emoji: '🎉', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'anxious', label: 'Anxious', emoji: '😰', color: 'bg-orange-100 text-orange-800' },
  { value: 'peaceful', label: 'Peaceful', emoji: '☮️', color: 'bg-blue-100 text-blue-800' },
  { value: 'motivated', label: 'Motivated', emoji: '💪', color: 'bg-red-100 text-red-800' },
  { value: 'tired', label: 'Tired', emoji: '😴', color: 'bg-gray-100 text-gray-800' }
];

export default function Journal() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    title: '',
    content: '',
    mood_tag: 'grateful'
  });

  React.useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: entries } = useQuery({
    queryKey: ['journalEntries'],
    queryFn: async () => {
      return await base44.entities.JournalEntry.list('-date', 20);
    },
    enabled: !!user,
  });

  const createEntryMutation = useMutation({
    mutationFn: async (entryData) => {
      return await base44.entities.JournalEntry.create(entryData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journalEntries'] });
      setFormData({
        date: format(new Date(), 'yyyy-MM-dd'),
        title: '',
        content: '',
        mood_tag: 'grateful'
      });
    },
  });

  const handleSubmit = () => {
    if (!formData.content.trim()) return;
    createEntryMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2 flex items-center gap-3">
            <BookOpen className="w-10 h-10 text-purple-600" />
            My Journal
          </h1>
          <p className="text-gray-600">Your private space for thoughts and reflections</p>
        </motion.div>

        {/* New Entry Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="shadow-lg border-0 bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                New Entry
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Date</label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Mood</label>
                  <Select value={formData.mood_tag} onValueChange={(val) => setFormData({...formData, mood_tag: val})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {moodTags.map(tag => (
                        <SelectItem key={tag.value} value={tag.value}>
                          <span className="mr-2">{tag.emoji}</span>
                          {tag.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Title (Optional)</label>
                <Input
                  placeholder="Give your entry a title..."
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Your thoughts...</label>
                <Textarea
                  placeholder="What's on your mind today?"
                  value={formData.content}
                  onChange={(e) => setFormData({...formData, content: e.target.value})}
                  rows={8}
                  className="resize-none"
                />
              </div>

              <Button 
                onClick={handleSubmit}
                disabled={!formData.content.trim() || createEntryMutation.isPending}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 h-12 text-lg"
              >
                Save Entry
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Previous Entries */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Calendar className="w-6 h-6" />
            Previous Entries
          </h2>

          {entries && entries.length > 0 ? (
            <div className="space-y-4">
              {entries.map((entry, index) => {
                const moodTag = moodTags.find(tag => tag.value === entry.mood_tag);
                return (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="shadow-md hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="text-sm text-gray-500 mb-1">
                              {format(new Date(entry.date), 'EEEE, MMMM d, yyyy')}
                            </p>
                            {entry.title && (
                              <h3 className="text-xl font-bold text-gray-800">{entry.title}</h3>
                            )}
                          </div>
                          {moodTag && (
                            <Badge className={`${moodTag.color} border-0`}>
                              <span className="mr-1">{moodTag.emoji}</span>
                              {moodTag.label}
                            </Badge>
                          )}
                        </div>
                        <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                          {entry.content}
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <Card className="shadow-md">
              <CardContent className="p-12 text-center">
                <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500 text-lg">No journal entries yet</p>
                <p className="text-gray-400">Start writing to capture your thoughts and memories</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}