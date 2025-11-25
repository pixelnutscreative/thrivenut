import React from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { GripVertical, Lock } from 'lucide-react';

const allFeatures = [
  { id: 'tiktok', name: 'TikTok', description: 'Content goals, engagement & contacts', requiresTikTokAccess: true },
  { id: 'gifter', name: 'Gifter Songs', description: 'Track gifters & generate songs', requiresTikTokAccess: true },
  { id: 'goals', name: 'Personal Goals', description: 'Goal tracking for all areas' },
  { id: 'journal', name: 'Daily Journal', description: 'Reflections and AI reframing' },
  { id: 'wellness', name: 'Wellness Tracker', description: 'Water, sleep, mood & self-care' },
  { id: 'supplements', name: 'Supplements & Vitamins', description: 'Track daily supplements' },
  { id: 'medications', name: 'Medications', description: 'Medication tracking' },
  { id: 'mental_health', name: 'Mental Health', description: 'Mental health support' },
  { id: 'people', name: 'My People', description: 'Contacts & birthdays' },
  { id: 'pets', name: 'Pet Care', description: 'Pet schedules & activities' },
  { id: 'care_reminders', name: 'Care Reminders', description: 'Reminders for others' },
];

export default function FeatureOrderManager({ enabledModules, featureOrder, onChange }) {
  // Build ordered list: use featureOrder if available, otherwise use default order
  const getOrderedFeatures = () => {
    if (featureOrder && featureOrder.length > 0) {
      // Start with features in the saved order
      const ordered = featureOrder
        .map(id => allFeatures.find(f => f.id === id))
        .filter(Boolean);
      
      // Add any new features that aren't in the saved order
      const orderedIds = new Set(featureOrder);
      allFeatures.forEach(f => {
        if (!orderedIds.has(f.id)) {
          ordered.push(f);
        }
      });
      
      return ordered;
    }
    return allFeatures;
  };

  const orderedFeatures = getOrderedFeatures();

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(orderedFeatures);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    onChange({
      featureOrder: items.map(f => f.id)
    });
  };

  const toggleFeature = (featureId, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const newEnabled = enabledModules.includes(featureId)
      ? enabledModules.filter(id => id !== featureId)
      : [...enabledModules, featureId];
    
    onChange({ enabledModules: newEnabled });
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600 mb-4">
        Drag to reorder features in the menu. Check/uncheck to enable or disable.
      </p>
      
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="features">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
              {orderedFeatures.map((feature, index) => (
                <Draggable key={feature.id} draggableId={feature.id} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`transition-shadow ${snapshot.isDragging ? 'shadow-lg' : ''}`}
                    >
                      <Card className={`${enabledModules.includes(feature.id) ? 'border-purple-300 bg-purple-50/50' : 'border-gray-200'}`}>
                        <CardContent className="p-3 flex items-center gap-3">
                          <div
                            {...provided.dragHandleProps}
                            className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
                          >
                            <GripVertical className="w-5 h-5" />
                          </div>
                          
                          <Checkbox
                            checked={enabledModules.includes(feature.id)}
                            onCheckedChange={(checked) => {
                              toggleFeature(feature.id);
                            }}
                            onClick={(e) => e.stopPropagation()}
                          />
                          
                          <div className="flex-1">
                            <p className="font-medium text-sm">{feature.name}</p>
                            <p className="text-xs text-gray-500">{feature.description}</p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}