import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, Plus, Trash2, Wand2, Music, PenTool, FileText, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MomentsTabContent({ formData, setFormData, isProfile = false }) {
  const [isAdding, setIsAdding] = useState(false);
  const [newMoment, setNewMoment] = useState({
    date: '',
    title: '',
    type: 'Funny',
    story: ''
  });

  // Support both key names for compatibility
  const moments = formData.memorable_moments || formData.moments || [];

  const handleAddMoment = () => {
    if (!newMoment.title) return;
    
    const moment = {
      id: Date.now().toString(),
      ...newMoment,
      description: newMoment.story // Map story to description for compatibility
    };

    const newMomentsList = [moment, ...moments];
    
    setFormData({
      ...formData,
      moments: newMomentsList,
      memorable_moments: newMomentsList // Update both keys
    });

    setNewMoment({
      date: '',
      title: '',
      type: 'Funny',
      story: ''
    });
    setIsAdding(false);
  };

  const removeMoment = (id) => {
    const filtered = moments.filter(m => m.id !== id);
    setFormData({
      ...formData,
      moments: filtered,
      memorable_moments: filtered
    });
  };

  const momentTypes = ['Funny', 'Milestone', 'Sweet', 'Serious', 'Other'];

  return (
    <div className="space-y-6">
      {/* Header & Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Camera className="w-4 h-4 text-pink-500" /> 
            Memorable Moments
          </h3>
          <p className="text-xs text-gray-500">Track special times to use for creating personal messages later.</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => setIsAdding(!isAdding)}>
          <Plus className="w-4 h-4 mr-2" /> Add Memory
        </Button>
      </div>

      {/* Add Moment Form */}
      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card className="border-pink-100 bg-pink-50/30 mb-4">
              <CardContent className="pt-4 space-y-3">
                <div className="grid grid-cols-12 gap-3">
                  <div className="col-span-4">
                    <Label className="text-xs">Date</Label>
                    <Input 
                      type="date" 
                      value={newMoment.date} 
                      onChange={(e) => setNewMoment({...newMoment, date: e.target.value})} 
                      className="bg-white h-8 text-xs"
                    />
                  </div>
                  <div className="col-span-5">
                    <Label className="text-xs">Title</Label>
                    <Input 
                      placeholder="Beach Day..." 
                      value={newMoment.title} 
                      onChange={(e) => setNewMoment({...newMoment, title: e.target.value})} 
                      className="bg-white h-8 text-xs"
                    />
                  </div>
                  <div className="col-span-3">
                    <Label className="text-xs">Type</Label>
                    <Select 
                      value={newMoment.type} 
                      onValueChange={(v) => setNewMoment({...newMoment, type: v})}
                    >
                      <SelectTrigger className="bg-white h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {momentTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Story / Details</Label>
                  <Textarea 
                    placeholder="What happened? Why was it special?" 
                    value={newMoment.story} 
                    onChange={(e) => setNewMoment({...newMoment, story: e.target.value})} 
                    className="bg-white text-xs min-h-[80px]"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button size="sm" variant="ghost" onClick={() => setIsAdding(false)} className="h-7 text-xs">Cancel</Button>
                  <Button size="sm" onClick={handleAddMoment} disabled={!newMoment.title} className="h-7 text-xs bg-pink-600 hover:bg-pink-700 text-white">Save Moment</Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Moments List */}
      <div className="space-y-3">
        {moments.length === 0 && !isAdding && (
          <div className="text-center p-6 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
            <Camera className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No memorable moments added yet.</p>
          </div>
        )}

        {moments.map((moment) => (
          <div key={moment.id} className="group relative p-4 bg-white rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-all">
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button size="icon" variant="ghost" className="h-6 w-6 text-gray-400 hover:text-red-500" onClick={() => removeMoment(moment.id)}>
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold text-pink-600 uppercase tracking-wider">{moment.type}</span>
              <span className="text-xs text-gray-400">•</span>
              <span className="text-xs text-gray-500">{moment.date || 'No date'}</span>
            </div>
            <h4 className="font-medium text-gray-800 mb-1">{moment.title}</h4>
            {(moment.story || moment.description) && <p className="text-sm text-gray-600 leading-relaxed">{moment.story || moment.description}</p>}
          </div>
        ))}
      </div>

      {/* AI Content Generator (Placeholder) */}
      <div className="pt-6 border-t border-gray-100">
        <h3 className="text-sm font-semibold flex items-center gap-2 mb-3 text-purple-700">
          <Wand2 className="w-4 h-4" /> 
          AI Content Generator
        </h3>
        <div className="grid grid-cols-3 gap-3">
          <Button variant="outline" className="h-auto py-3 flex flex-col gap-1 border-purple-100 hover:bg-purple-50 hover:text-purple-700">
            <MessageCircle className="w-4 h-4" />
            <span className="text-xs">Letter</span>
          </Button>
          <Button variant="outline" className="h-auto py-3 flex flex-col gap-1 border-purple-100 hover:bg-purple-50 hover:text-purple-700">
            <PenTool className="w-4 h-4" />
            <span className="text-xs">Poem</span>
          </Button>
          <Button variant="outline" className="h-auto py-3 flex flex-col gap-1 border-purple-100 hover:bg-purple-50 hover:text-purple-700">
            <Music className="w-4 h-4" />
            <span className="text-xs">Song Lyrics</span>
          </Button>
        </div>
      </div>
    </div>
  );
}