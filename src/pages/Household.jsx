import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Home, List, FileText, Save, Plus, Trash2 } from 'lucide-react';
import { useTheme } from '../components/shared/useTheme';
import CleaningTasks from './CleaningTasks';

export default function Household() {
  const { bgClass, textClass, cardBgClass, user } = useTheme();
  const [activeTab, setActiveTab] = useState('cleaning');
  const queryClient = useQueryClient();
  const [newRule, setNewRule] = useState('');

  // Fetch household rules (stored as a special entity type or just reuse QuickNotes with a category?)
  // Let's reuse QuickNotes with category 'Household Rule' for simplicity
  const { data: rules = [] } = useQuery({
    queryKey: ['householdRules', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const results = await base44.entities.QuickNote.filter({ type: 'household_rule', created_by: user.email });
      return results;
    },
    enabled: !!user?.email
  });

  const createRuleMutation = useMutation({
    mutationFn: (content) => base44.entities.QuickNote.create({
      content,
      type: 'household_rule',
      title: 'Rule'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['householdRules'] });
      setNewRule('');
    }
  });

  const deleteRuleMutation = useMutation({
    mutationFn: (id) => base44.entities.QuickNote.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['householdRules'] });
    }
  });

  return (
    <div className={`min-h-screen ${bgClass} p-4 md:p-8`}>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-orange-100 rounded-xl">
            <Home className="w-8 h-8 text-orange-600" />
          </div>
          <div>
            <h1 className={`text-3xl font-bold ${textClass}`}>Household</h1>
            <p className="text-gray-500">Manage your home, cleaning, and rules.</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full md:w-[400px] grid-cols-2">
            <TabsTrigger value="cleaning">
              <Sparkles className="w-4 h-4 mr-2" />
              Cleaning Tasks
            </TabsTrigger>
            <TabsTrigger value="rules">
              <FileText className="w-4 h-4 mr-2" />
              House Rules
            </TabsTrigger>
          </TabsList>

          <TabsContent value="cleaning" className="mt-6">
            <CleaningTasks embedded={true} />
          </TabsContent>

          <TabsContent value="rules" className="mt-6">
            <div className="grid gap-6 md:grid-cols-3">
              {/* Add Rule Card */}
              <Card className="md:col-span-1 h-fit">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="w-5 h-5 text-orange-500" />
                    Add New Rule
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder="e.g., No shoes in the house..."
                    value={newRule}
                    onChange={(e) => setNewRule(e.target.value)}
                    rows={4}
                  />
                  <Button 
                    onClick={() => createRuleMutation.mutate(newRule)}
                    disabled={!newRule.trim() || createRuleMutation.isPending}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    Add Rule
                  </Button>
                </CardContent>
              </Card>

              {/* Rules List */}
              <div className="md:col-span-2 space-y-4">
                {rules.length === 0 ? (
                  <div className="text-center p-12 bg-white/50 rounded-xl border-2 border-dashed border-gray-200">
                    <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-gray-500">No household rules set yet.</p>
                  </div>
                ) : (
                  rules.map((rule, idx) => (
                    <Card key={rule.id} className="relative group hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold">
                            {idx + 1}
                          </div>
                          <p className="text-lg text-gray-800 flex-1">{rule.content}</p>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteRuleMutation.mutate(rule.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}