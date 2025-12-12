import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Calendar, Clock, ExternalLink, Swords, Video, Users, GraduationCap, Zap, Settings, Edit } from 'lucide-react';
import { format, parseISO, isToday, isTomorrow } from 'date-fns';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const platformIcons = {
  TikTok: Video,
  Instagram: Video,
  Discord: Users,
  YouTube: Video,
  Zoom: Users,
  Other: Calendar
};

const eventTypeDetector = (title, notes) => {
  const text = `${title} ${notes}`.toLowerCase();
  if (text.includes('battle') || text.includes('box battle')) return { icon: Swords, color: 'from-red-500 to-rose-600', label: 'Battle' };
  if (text.includes('training') || text.includes('class') || text.includes('workshop') || text.includes('learn')) return { icon: GraduationCap, color: 'from-blue-500 to-indigo-600', label: 'Training' };
  if (text.includes('collab') || text.includes('co-host')) return { icon: Users, color: 'from-purple-500 to-pink-600', label: 'Collab' };
  return { icon: Calendar, color: 'from-amber-500 to-orange-600', label: 'Event' };
};

const colorSchemes = {
  red: {
    border: 'border-red-500',
    bg: 'from-red-50 via-orange-50 to-amber-50',
    header: 'from-red-600 to-rose-600',
    itemBorder: 'border-red-200'
  },
  orange: {
    border: 'border-orange-500',
    bg: 'from-orange-50 via-amber-50 to-yellow-50',
    header: 'from-orange-600 to-amber-600',
    itemBorder: 'border-orange-200'
  },
  pink: {
    border: 'border-pink-500',
    bg: 'from-pink-50 via-rose-50 to-purple-50',
    header: 'from-pink-600 to-rose-600',
    itemBorder: 'border-pink-200'
  },
  purple: {
    border: 'border-purple-500',
    bg: 'from-purple-50 via-violet-50 to-indigo-50',
    header: 'from-purple-600 to-violet-600',
    itemBorder: 'border-purple-200'
  },
  amber: {
    border: 'border-amber-500',
    bg: 'from-amber-50 via-yellow-50 to-orange-50',
    header: 'from-amber-600 to-yellow-600',
    itemBorder: 'border-amber-200'
  },
  rose: {
    border: 'border-rose-500',
    bg: 'from-rose-50 via-pink-50 to-red-50',
    header: 'from-rose-600 to-pink-600',
    itemBorder: 'border-rose-200'
  }
};

export default function UrgentEventsCard({ events, publicCalendarEvents, alertColor = 'red', onColorChange, userEmail }) {
  const queryClient = useQueryClient();
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [customColor, setCustomColor] = useState({ type: 'solid', solid: '#ef4444', gradientStart: '#ef4444', gradientEnd: '#dc2626' });
  const [editingEvent, setEditingEvent] = useState(null);
  
  if (!events || events.length === 0) return null;

  // Check if alertColor is custom (hex/gradient)
  const isCustomColor = alertColor && (alertColor.startsWith('#') || alertColor.startsWith('linear-gradient'));
  const colors = isCustomColor ? {
    border: 'border-gray-400',
    bg: 'from-gray-50 via-white to-gray-50',
    header: alertColor.startsWith('linear-gradient') ? alertColor.replace('linear-gradient', 'linear-gradient(to right,') : `linear-gradient(to right, ${alertColor}, ${alertColor})`,
    itemBorder: 'border-gray-200'
  } : (colorSchemes[alertColor] || colorSchemes.red);

  const updateEventMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.entities.ExternalEvent.update(data.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['urgentEvents'] });
      setEditingEvent(null);
    },
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6"
    >
      <Card className={`border-4 ${colors.border} shadow-2xl bg-gradient-to-r ${colors.bg}`}>
        <CardHeader 
          className="text-white pb-3"
          style={isCustomColor ? { background: colors.header } : {}}
          {...(!isCustomColor && { className: `bg-gradient-to-r ${colors.header} text-white pb-3` })}
        >
          <CardTitle className="flex items-center justify-between text-xl">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 animate-pulse" />
              🔥 Today's Important Events - DO NOT MISS!
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowColorPicker(true)}
              className="h-8 w-8 p-0 hover:bg-white/20"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-3">
          {events.map((event, idx) => {
            const eventDate = parseISO(event.date);
            const isEventToday = isToday(eventDate);
            const isEventTomorrow = isTomorrow(eventDate);
            const eventType = eventTypeDetector(event.title, event.notes || '');
            const EventIcon = eventType.icon;
            const PlatformIcon = platformIcons[event.platform] || Calendar;

            return (
              <motion.div
                key={event.id || idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`p-4 bg-white rounded-xl border-2 ${colors.itemBorder} shadow-md hover:shadow-lg transition-all`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${eventType.color} flex items-center justify-center flex-shrink-0`}>
                      <EventIcon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-bold text-gray-900 text-lg">{event.title}</h3>
                        {isEventToday && (
                          <Badge className="bg-red-600 text-white animate-pulse">TODAY</Badge>
                        )}
                        {isEventTomorrow && (
                          <Badge className="bg-orange-600 text-white">TOMORROW</Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-3 text-sm text-gray-600 mb-2 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(eventDate, 'EEE, MMM d')}
                        </span>
                        {event.time && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {event.time}
                          </span>
                        )}
                        {event.platform && (
                          <Badge variant="outline" className="text-xs">
                            <PlatformIcon className="w-3 h-3 mr-1" />
                            {event.platform}
                          </Badge>
                        )}
                      </div>

                      {event.host_username && (
                        <p className="text-sm text-gray-700 mb-1">
                          <span className="font-medium">Host:</span> @{event.host_username}
                        </p>
                      )}

                      {event.notes && (
                        <p className="text-sm text-gray-600 italic">{event.notes}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingEvent(event)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    {event.link && (
                      <Button
                        size="sm"
                        onClick={() => window.open(event.link, '_blank')}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                      >
                        <ExternalLink className="w-4 h-4 mr-1" />
                        Join
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}

          {/* Public Calendar Events */}
          {publicCalendarEvents && publicCalendarEvents.length > 0 && (
            <>
              <div className="border-t-2 border-orange-200 pt-3 mt-3">
                <p className="text-sm font-semibold text-orange-800 mb-2 flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Pixel Nuts Events
                </p>
              </div>
              {publicCalendarEvents.map((event, idx) => (
                <motion.div
                  key={`pub-${idx}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: (events.length + idx) * 0.1 }}
                  className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200"
                >
                  <h4 className="font-semibold text-gray-900">{event.summary}</h4>
                  <div className="flex items-center gap-3 text-xs text-gray-600 mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {event.start}
                    </span>
                  </div>
                  {event.description && (
                    <p className="text-xs text-gray-600 mt-1">{event.description}</p>
                  )}
                  {event.location && (
                    <a href={event.location} target="_blank" rel="noopener noreferrer" className="text-xs text-purple-600 hover:underline mt-1 inline-block">
                      Join Link →
                    </a>
                  )}
                </motion.div>
              ))}
            </>
          )}
        </CardContent>
      </Card>

      {/* Color Picker Dialog */}
      <Dialog open={showColorPicker} onOpenChange={setShowColorPicker}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Urgent Alert Color</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-6">
            <div>
              <p className="text-sm text-gray-600 mb-4">Preset Colors</p>
              <div className="grid grid-cols-3 gap-3">
                {Object.keys(colorSchemes).map(color => (
                  <button
                    key={color}
                    onClick={() => {
                      onColorChange(color);
                      setShowColorPicker(false);
                    }}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      alertColor === color 
                        ? `${colorSchemes[color].border} bg-gradient-to-r ${colorSchemes[color].bg}` 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`w-12 h-12 mx-auto rounded-lg bg-gradient-to-r ${colorSchemes[color].header} mb-2`}></div>
                    <p className="text-xs font-medium text-center capitalize">{color}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Color Section */}
            <div className="border-t pt-4 space-y-3">
              <Label className="font-semibold">Custom Color</Label>
              
              {/* Type Toggle */}
              <div className="flex gap-2">
                <Button
                  variant={customColor.type === 'solid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCustomColor({ ...customColor, type: 'solid' })}
                >
                  Solid
                </Button>
                <Button
                  variant={customColor.type === 'gradient' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCustomColor({ ...customColor, type: 'gradient' })}
                >
                  Gradient
                </Button>
              </div>

              {customColor.type === 'solid' ? (
                <div className="flex gap-2 items-center">
                  <Input
                    type="color"
                    value={customColor.solid}
                    onChange={(e) => setCustomColor({ ...customColor, solid: e.target.value })}
                    className="w-16 h-10 p-1"
                  />
                  <Input
                    value={customColor.solid}
                    onChange={(e) => setCustomColor({ ...customColor, solid: e.target.value })}
                    placeholder="#ef4444"
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-2 items-center">
                    <Label className="w-16 text-xs">Start:</Label>
                    <Input
                      type="color"
                      value={customColor.gradientStart}
                      onChange={(e) => setCustomColor({ ...customColor, gradientStart: e.target.value })}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      value={customColor.gradientStart}
                      onChange={(e) => setCustomColor({ ...customColor, gradientStart: e.target.value })}
                      placeholder="#ef4444"
                    />
                  </div>
                  <div className="flex gap-2 items-center">
                    <Label className="w-16 text-xs">End:</Label>
                    <Input
                      type="color"
                      value={customColor.gradientEnd}
                      onChange={(e) => setCustomColor({ ...customColor, gradientEnd: e.target.value })}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      value={customColor.gradientEnd}
                      onChange={(e) => setCustomColor({ ...customColor, gradientEnd: e.target.value })}
                      placeholder="#dc2626"
                    />
                  </div>
                </div>
              )}

              {/* Preview */}
              <div 
                className="h-16 rounded-lg flex items-center justify-center text-white font-bold"
                style={{ 
                  background: customColor.type === 'solid' 
                    ? customColor.solid 
                    : `linear-gradient(135deg, ${customColor.gradientStart}, ${customColor.gradientEnd})`
                }}
              >
                Preview
              </div>

              <Button
                onClick={() => {
                  const colorValue = customColor.type === 'solid'
                    ? customColor.solid
                    : `linear-gradient(135deg, ${customColor.gradientStart}, ${customColor.gradientEnd})`;
                  onColorChange(colorValue);
                  setShowColorPicker(false);
                }}
                className="w-full"
              >
                Apply Custom Color
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Event Dialog */}
      <Dialog open={!!editingEvent} onOpenChange={() => setEditingEvent(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
          </DialogHeader>
          {editingEvent && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Event Title</Label>
                <Input
                  value={editingEvent.title}
                  onChange={(e) => setEditingEvent({ ...editingEvent, title: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={editingEvent.date}
                    onChange={(e) => setEditingEvent({ ...editingEvent, date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Time (24h format)</Label>
                  <Input
                    type="time"
                    value={editingEvent.time}
                    onChange={(e) => setEditingEvent({ ...editingEvent, time: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Platform</Label>
                <Select 
                  value={editingEvent.platform}
                  onValueChange={(v) => setEditingEvent({ ...editingEvent, platform: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TikTok">TikTok</SelectItem>
                    <SelectItem value="Instagram">Instagram</SelectItem>
                    <SelectItem value="Discord">Discord</SelectItem>
                    <SelectItem value="YouTube">YouTube</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Host Username</Label>
                <Input
                  value={editingEvent.host_username}
                  onChange={(e) => setEditingEvent({ ...editingEvent, host_username: e.target.value })}
                  placeholder="@username"
                />
              </div>
              <div className="space-y-2">
                <Label>Link (optional)</Label>
                <Input
                  value={editingEvent.link || ''}
                  onChange={(e) => setEditingEvent({ ...editingEvent, link: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Notes (optional)</Label>
                <Textarea
                  value={editingEvent.notes || ''}
                  onChange={(e) => setEditingEvent({ ...editingEvent, notes: e.target.value })}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => updateEventMutation.mutate(editingEvent)}
                  disabled={updateEventMutation.isPending}
                  className="flex-1"
                >
                  Save Changes
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setEditingEvent(null)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}