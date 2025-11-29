import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Check, ExternalLink, Video, MessageSquare, FileText, Edit, Trash2, X, Mail } from 'lucide-react';

const ALL_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const FULL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const contentFormats = ["duet", "sync", "training", "series", "Q&A", "tutorial", "unboxing", "haul"];

export default function WeeklyGoalCard({ goal, onEditPosts, onEditLives, onEditEngagement, onToggleDayComplete, onUpdateItem, onDeleteItem }) {
  const [editingItem, setEditingItem] = useState(null); // { type, index, data }
  if (!goal) {
    return (
      <Card className="shadow-md">
        <CardContent className="p-8 text-center">
          <p className="text-gray-600 mb-4">No schedule set for this week yet</p>
          <div className="flex flex-wrap justify-center gap-2">
                    <Button onClick={onEditPosts} variant="outline" className="border-purple-300 text-purple-700">
                      <Plus className="w-4 h-4 mr-2" /> Content Creation Time
                    </Button>
                    <Button onClick={onEditLives} variant="outline" className="border-pink-300 text-pink-700">
                      <Plus className="w-4 h-4 mr-2" /> LIVE Session
                    </Button>
                    <Button onClick={onEditEngagement} variant="outline" className="border-teal-300 text-teal-700">
                      <Plus className="w-4 h-4 mr-2" /> Engagement Time
                    </Button>
                  </div>
        </CardContent>
      </Card>
    );
  }

  const hasScheduledItems = (goal.scheduled_posts?.length > 0 || goal.scheduled_lives?.length > 0 || goal.scheduled_engagement?.length > 0);

  return (
    <Card className="shadow-md">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl">This Week's Content Schedule</CardTitle>
        <div className="flex flex-wrap gap-2">
          <Button onClick={onEditPosts} variant="outline" size="sm" className="border-purple-300 text-purple-700 hover:bg-purple-50">
            <Plus className="w-3 h-3 mr-1" /> Content Time
          </Button>
          <Button onClick={onEditLives} variant="outline" size="sm" className="border-pink-300 text-pink-700 hover:bg-pink-50">
            <Plus className="w-3 h-3 mr-1" /> LIVE
          </Button>
          <Button onClick={onEditEngagement} variant="outline" size="sm" className="border-teal-300 text-teal-700 hover:bg-teal-50">
            <Plus className="w-3 h-3 mr-1" /> Engage
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasScheduledItems ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Posts */}
            {goal.scheduled_posts?.map((schedule, index) => (
              <ScheduleCard
                key={`post-${index}`}
                type="post"
                icon={<FileText className="w-4 h-4" />}
                schedule={schedule}
                index={index}
                field="scheduled_posts"
                onToggleDay={onToggleDayComplete}
                onEdit={(field, idx, data) => setEditingItem({ type: 'post', field, index: idx, data: { ...data } })}
                onDelete={onDeleteItem}
              />
            ))}
            
            {/* Lives */}
            {goal.scheduled_lives?.map((schedule, index) => (
              <ScheduleCard
                key={`live-${index}`}
                type="live"
                icon={<Video className="w-4 h-4" />}
                schedule={schedule}
                index={index}
                field="scheduled_lives"
                onToggleDay={onToggleDayComplete}
                onEdit={(field, idx, data) => setEditingItem({ type: 'live', field, index: idx, data: { ...data } })}
                onDelete={onDeleteItem}
              />
            ))}
            
            {/* Engagement */}
            {goal.scheduled_engagement?.map((schedule, index) => (
              <ScheduleCard
                key={`engagement-${index}`}
                type="engagement"
                icon={<MessageSquare className="w-4 h-4" />}
                schedule={schedule}
                index={index}
                field="scheduled_engagement"
                onToggleDay={onToggleDayComplete}
                onEdit={(field, idx, data) => setEditingItem({ type: 'engagement', field, index: idx, data: { ...data } })}
                onDelete={onDeleteItem}
              />
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No activities scheduled yet. Click Edit to add some!</p>
        )}

        {goal.notes && (
          <div className="mt-4 p-4 bg-purple-50 rounded-lg">
            <p className="text-sm font-medium text-gray-700 mb-1">Weekly Notes:</p>
            <p className="text-sm text-gray-600">{goal.notes}</p>
          </div>
        )}
      </CardContent>

      {/* Inline Edit Dialog */}
      <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit {editingItem?.type === 'post' ? 'Post' : editingItem?.type === 'live' ? 'Live' : 'Engagement'}</DialogTitle>
          </DialogHeader>
          {editingItem && (
            <div className="space-y-4 py-2">
              {/* Days selector */}
              <div>
                <Label className="text-sm">Days</Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {FULL_DAYS.map(day => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => {
                        const days = editingItem.data.days || [];
                        const updated = days.includes(day) ? days.filter(d => d !== day) : [...days, day];
                        setEditingItem({ ...editingItem, data: { ...editingItem.data, days: updated } });
                      }}
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        (editingItem.data.days || []).includes(day) ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {day.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm">Time</Label>
                  <Input
                    type="time"
                    value={editingItem.data.time || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, data: { ...editingItem.data, time: e.target.value } })}
                  />
                </div>
                {editingItem.type !== 'engagement' && (
                  <div>
                    <Label className="text-sm">Title</Label>
                    <Input
                      value={editingItem.data.title || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, data: { ...editingItem.data, title: e.target.value } })}
                    />
                  </div>
                )}
              </div>

              {editingItem.type !== 'engagement' && (
                <div>
                  <Label className="text-sm">Description</Label>
                  <Textarea
                    value={editingItem.data.description || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, data: { ...editingItem.data, description: e.target.value } })}
                    rows={2}
                  />
                </div>
              )}

              {editingItem.type === 'live' && (
                <div>
                  <Label className="text-sm">Audience</Label>
                  <Select
                    value={editingItem.data.audience_restriction || 'all_ages'}
                    onValueChange={(v) => setEditingItem({ ...editingItem, data: { ...editingItem.data, audience_restriction: v } })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all_ages">All Ages</SelectItem>
                      <SelectItem value="18+">18+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {editingItem.type === 'post' && (
                <div>
                  <Label className="text-sm">Content Formats</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {contentFormats.map(format => (
                      <button
                        key={format}
                        type="button"
                        onClick={() => {
                          const formats = editingItem.data.content_formats || [];
                          const updated = formats.includes(format) ? formats.filter(f => f !== format) : [...formats, format];
                          setEditingItem({ ...editingItem, data: { ...editingItem.data, content_formats: updated } });
                        }}
                        className={`px-2 py-1 rounded text-xs ${
                          (editingItem.data.content_formats || []).includes(format) ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {format}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={editingItem.data.is_recurring || false}
                    onCheckedChange={(c) => setEditingItem({ ...editingItem, data: { ...editingItem.data, is_recurring: c } })}
                  />
                  <span className="text-sm">🔄 Recurring</span>
                </label>
                {editingItem.type === 'live' && (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={editingItem.data.is_shareable || false}
                      onCheckedChange={(c) => setEditingItem({ ...editingItem, data: { ...editingItem.data, is_shareable: c } })}
                    />
                    <span className="text-sm">📢 Share</span>
                  </label>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingItem(null)}>Cancel</Button>
            <Button 
              onClick={() => {
                if (onUpdateItem && editingItem) {
                  onUpdateItem(editingItem.field, editingItem.index, editingItem.data);
                  setEditingItem(null);
                }
              }}
              className="bg-purple-600"
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function ScheduleCard({ type, icon, schedule, index, field, onToggleDay, onEdit, onDelete }) {
  const typeStyles = {
    post: { bg: 'bg-purple-50', border: 'border-purple-200', accent: 'text-purple-600', label: 'Post' },
    live: { bg: 'bg-pink-50', border: 'border-pink-200', accent: 'text-pink-600', label: 'Live' },
    engagement: { bg: 'bg-teal-50', border: 'border-teal-200', accent: 'text-teal-600', label: 'Engagement' }
  };
  
  const style = typeStyles[type];
  const scheduledDays = schedule.days || (schedule.day_of_week ? [schedule.day_of_week] : []);
  const completedDays = schedule.completed_days || [];
  
  // Check if all scheduled days are completed
  const allComplete = scheduledDays.length > 0 && scheduledDays.every(day => completedDays.includes(day));

  return (
    <div className={`rounded-xl border-2 ${style.border} ${style.bg} p-4 space-y-3`}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className={style.accent}>{icon}</span>
          <span className={`font-semibold ${style.accent}`}>{style.label}</span>
          {schedule.is_recurring && (
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">🔄 Recurring</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <span className="text-sm font-medium text-gray-600 mr-2">{schedule.time || '--:--'}</span>
          {onEdit && (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(field, index, schedule)}>
              <Edit className="w-3.5 h-3.5 text-gray-500" />
            </Button>
          )}
          {onDelete && (
            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-700" onClick={() => onDelete(field, index)}>
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>
      
      {/* Title & Description */}
      {schedule.title && (
        <p className={`font-medium text-gray-800 ${allComplete ? 'line-through text-gray-400' : ''}`}>
          {schedule.title}
        </p>
      )}
      {schedule.description && (
        <p className="text-sm text-gray-600">{schedule.description}</p>
      )}
      
      {/* Audience for lives */}
      {type === 'live' && schedule.audience_restriction && (
        <span className={`text-xs ${schedule.audience_restriction === '18+' ? 'text-red-600' : 'text-green-600'}`}>
          Audience: {schedule.audience_restriction === '18+' ? '18+' : 'All Ages'}
        </span>
      )}
      
      {/* Content formats for posts */}
      {type === 'post' && schedule.content_formats?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {schedule.content_formats.map(format => (
            <span key={format} className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
              {format}
            </span>
          ))}
        </div>
      )}
      
      {/* TikTok Shop Items */}
      {schedule.tiktok_shop_items?.length > 0 && (
        <div className="space-y-1">
          {schedule.tiktok_shop_items.map((item, i) => (
            <a 
              key={i} 
              href={item.url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-xs text-blue-500 hover:underline flex items-center gap-1"
            >
              🛍️ {item.name || "Shop Item"}
              <ExternalLink className="w-3 h-3" />
            </a>
          ))}
        </div>
      )}
      
      {/* Day checkboxes */}
      <div className="pt-2 border-t border-gray-200">
        <p className="text-xs text-gray-500 mb-2">Mark completed days:</p>
        <div className="flex flex-wrap gap-1">
          {ALL_DAYS.map((dayShort, dayIndex) => {
            const fullDay = FULL_DAYS[dayIndex];
            const isScheduled = scheduledDays.includes(fullDay);
            const isCompleted = completedDays.includes(fullDay);
            
            if (!isScheduled) {
              return (
                <div 
                  key={dayShort} 
                  className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center text-xs text-gray-300"
                >
                  {dayShort}
                </div>
              );
            }
            
            return (
              <button
                key={dayShort}
                onClick={() => onToggleDay && onToggleDay(field, index, fullDay)}
                className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-medium transition-all ${
                  isCompleted 
                    ? 'bg-green-500 text-white' 
                    : 'bg-white border-2 border-gray-300 text-gray-600 hover:border-green-400'
                }`}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : dayShort}
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Status badges */}
      {(schedule.added_to_tiktok_events || schedule.posted_in_discord || schedule.shared_to_story || schedule.is_shareable) && (
        <div className="flex flex-wrap gap-1 pt-1">
          {schedule.is_shareable && (
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">📢 Shared</span>
          )}
          {schedule.added_to_tiktok_events && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">✅ TikTok</span>
          )}
          {schedule.posted_in_discord && (
            <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">💬 Discord</span>
          )}
          {schedule.shared_to_story && (
            <span className="text-xs bg-pink-100 text-pink-700 px-2 py-0.5 rounded">📖 Story</span>
          )}
        </div>
      )}
    </div>
  );
}