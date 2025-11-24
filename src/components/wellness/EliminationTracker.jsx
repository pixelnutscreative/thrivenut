import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Ban, Plus, X, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const gradeOptions = [
  { id: 'great', label: '🌟 Great', description: 'Fully avoided', color: 'bg-green-100 border-green-500 text-green-700' },
  { id: 'good', label: '👍 Good', description: 'Mostly avoided', color: 'bg-blue-100 border-blue-500 text-blue-700' },
  { id: 'okay', label: '😐 Okay', description: 'Some intake', color: 'bg-yellow-100 border-yellow-500 text-yellow-700' },
  { id: 'struggled', label: '💪 Struggled', description: 'Working on it', color: 'bg-orange-100 border-orange-500 text-orange-700' },
];

export default function EliminationTracker({ 
  itemsToEliminate = [], 
  eliminationGrades = [],
  onUpdateGrades,
  onUpdateItems,
  showItemManager = false
}) {
  const [newItem, setNewItem] = useState('');

  const handleAddItem = () => {
    if (newItem.trim() && !itemsToEliminate.includes(newItem.trim().toLowerCase())) {
      onUpdateItems([...itemsToEliminate, newItem.trim().toLowerCase()]);
      setNewItem('');
    }
  };

  const handleRemoveItem = (item) => {
    onUpdateItems(itemsToEliminate.filter(i => i !== item));
  };

  const handleGrade = (item, grade) => {
    const existingIndex = eliminationGrades.findIndex(g => g.item === item);
    let newGrades;
    if (existingIndex >= 0) {
      newGrades = [...eliminationGrades];
      newGrades[existingIndex] = { item, grade };
    } else {
      newGrades = [...eliminationGrades, { item, grade }];
    }
    onUpdateGrades(newGrades);
  };

  const getGradeForItem = (item) => {
    return eliminationGrades.find(g => g.item === item)?.grade;
  };

  if (itemsToEliminate.length === 0 && !showItemManager) {
    return null;
  }

  return (
    <Card className="shadow-lg border-0 bg-gradient-to-br from-red-50 to-orange-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Ban className="w-6 h-6 text-red-500" />
          Trying to Reduce
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {showItemManager && (
          <div className="space-y-3 pb-4 border-b">
            <p className="text-sm text-gray-600">Add things you're trying to cut back on:</p>
            <div className="flex gap-2">
              <Input
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                placeholder="e.g., soda, sugar, salt, oil..."
                onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
              />
              <Button onClick={handleAddItem} size="icon">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {itemsToEliminate.map(item => (
                <Badge key={item} variant="secondary" className="flex items-center gap-1 capitalize">
                  {item}
                  <button onClick={() => handleRemoveItem(item)} className="ml-1 hover:text-red-500">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {itemsToEliminate.length > 0 && (
          <div className="space-y-4">
            <p className="text-sm font-medium text-gray-700">How did you do today?</p>
            <AnimatePresence>
              {itemsToEliminate.map((item, index) => {
                const currentGrade = getGradeForItem(item);
                return (
                  <motion.div
                    key={item}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium capitalize text-gray-800">{item}</span>
                      {currentGrade && (
                        <Badge className={gradeOptions.find(g => g.id === currentGrade)?.color}>
                          {gradeOptions.find(g => g.id === currentGrade)?.label}
                        </Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {gradeOptions.map(grade => (
                        <button
                          key={grade.id}
                          onClick={() => handleGrade(item, grade.id)}
                          className={`p-2 rounded-lg border-2 text-xs transition-all ${
                            currentGrade === grade.id
                              ? grade.color + ' border-2'
                              : 'border-gray-200 hover:border-gray-300 bg-white'
                          }`}
                        >
                          <div className="font-medium">{grade.label.split(' ')[0]}</div>
                          <div className="text-gray-500 text-[10px]">{grade.description}</div>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </CardContent>
    </Card>
  );
}