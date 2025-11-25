import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus, X } from 'lucide-react';

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const contentFormats = ["duet", "sync", "training", "series", "Q&A", "tutorial", "unboxing", "haul"];

export default function GoalEditModal({ isOpen, onClose, currentGoal, onSave }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    scheduled_posts: currentGoal?.scheduled_posts || [],
    scheduled_lives: currentGoal?.scheduled_lives || [],
    scheduled_engagement: currentGoal?.scheduled_engagement || [],
    notes: currentGoal?.notes || ''
  });

  const handleSave = async () => {
    setLoading(true);
    await onSave(formData);
    setLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Set Your Weekly Content Schedule</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Scheduled Posts */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Scheduled Posts</h3>
            {formData.scheduled_posts.map((schedule, index) => (
              <div key={index} className="space-y-3 border-2 p-4 rounded-lg bg-gray-50">
                <div className="flex items-center gap-2">
                  <Select
                    value={schedule.day_of_week}
                    onValueChange={(value) => {
                      const newSchedules = [...formData.scheduled_posts];
                      newSchedules[index].day_of_week = value;
                      setFormData({ ...formData, scheduled_posts: newSchedules });
                    }}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Day" />
                    </SelectTrigger>
                    <SelectContent>
                      {daysOfWeek.map(day => <SelectItem key={day} value={day}>{day}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Input
                    type="time"
                    value={schedule.time}
                    onChange={(e) => {
                      const newSchedules = [...formData.scheduled_posts];
                      newSchedules[index].time = e.target.value;
                      setFormData({ ...formData, scheduled_posts: newSchedules });
                    }}
                    className="w-[120px]"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      const newSchedules = formData.scheduled_posts.filter((_, i) => i !== index);
                      setFormData({ ...formData, scheduled_posts: newSchedules });
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm">Post Title (Optional)</Label>
                    <Input
                      placeholder="Post title"
                      value={schedule.title || ''}
                      onChange={(e) => {
                        const newSchedules = [...formData.scheduled_posts];
                        newSchedules[index].title = e.target.value;
                        setFormData({ ...formData, scheduled_posts: newSchedules });
                      }}
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Description (Optional)</Label>
                    <Input
                      placeholder="Post description"
                      value={schedule.description || ''}
                      onChange={(e) => {
                        const newSchedules = [...formData.scheduled_posts];
                        newSchedules[index].description = e.target.value;
                        setFormData({ ...formData, scheduled_posts: newSchedules });
                      }}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Content Formats</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {contentFormats.map(format => (
                      <div key={format} className="flex items-center space-x-2">
                        <Checkbox
                          id={`post-format-${index}-${format}`}
                          checked={schedule.content_formats?.includes(format)}
                          onCheckedChange={(checked) => {
                            const newSchedules = [...formData.scheduled_posts];
                            const currentFormats = newSchedules[index].content_formats || [];
                            newSchedules[index].content_formats = checked
                              ? [...currentFormats, format]
                              : currentFormats.filter(f => f !== format);
                            setFormData({ ...formData, scheduled_posts: newSchedules });
                          }}
                        />
                        <Label htmlFor={`post-format-${index}-${format}`} className="text-xs">{format}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setFormData({ ...formData, scheduled_posts: [...formData.scheduled_posts, { day_of_week: 'Monday', time: '09:00', completed: false, content_formats: [] }] })
              }
            >
              <Plus className="h-4 w-4 mr-2" /> Add Post Schedule
            </Button>
          </div>

          {/* Scheduled Lives */}
          <div className="space-y-3 mt-6 border-t pt-6">
            <h3 className="font-semibold text-lg">Scheduled Lives</h3>
            {formData.scheduled_lives.map((schedule, index) => (
              <div key={index} className="space-y-3 border-2 p-4 rounded-lg bg-purple-50">
                <div className="flex items-center gap-2">
                  <Select
                    value={schedule.day_of_week}
                    onValueChange={(value) => {
                      const newSchedules = [...formData.scheduled_lives];
                      newSchedules[index].day_of_week = value;
                      setFormData({ ...formData, scheduled_lives: newSchedules });
                    }}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Day" />
                    </SelectTrigger>
                    <SelectContent>
                      {daysOfWeek.map(day => <SelectItem key={day} value={day}>{day}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Input
                    type="time"
                    value={schedule.time}
                    onChange={(e) => {
                      const newSchedules = [...formData.scheduled_lives];
                      newSchedules[index].time = e.target.value;
                      setFormData({ ...formData, scheduled_lives: newSchedules });
                    }}
                    className="w-[120px]"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      const newSchedules = formData.scheduled_lives.filter((_, i) => i !== index);
                      setFormData({ ...formData, scheduled_lives: newSchedules });
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm">Live Title</Label>
                    <Input
                      placeholder="Live title"
                      value={schedule.title || ''}
                      onChange={(e) => {
                        const newSchedules = [...formData.scheduled_lives];
                        newSchedules[index].title = e.target.value;
                        setFormData({ ...formData, scheduled_lives: newSchedules });
                      }}
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Audience</Label>
                    <Select
                      value={schedule.audience_restriction || 'all_ages'}
                      onValueChange={(value) => {
                        const newSchedules = [...formData.scheduled_lives];
                        newSchedules[index].audience_restriction = value;
                        setFormData({ ...formData, scheduled_lives: newSchedules });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all_ages">All Ages</SelectItem>
                        <SelectItem value="18+">18+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label className="text-sm">Description</Label>
                  <Textarea
                    placeholder="Live description"
                    value={schedule.description || ''}
                    onChange={(e) => {
                      const newSchedules = [...formData.scheduled_lives];
                      newSchedules[index].description = e.target.value;
                      setFormData({ ...formData, scheduled_lives: newSchedules });
                    }}
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">TikTok Shop Items</Label>
                  {schedule.tiktok_shop_items?.map((item, itemIndex) => (
                    <div key={itemIndex} className="flex items-center gap-2">
                      <Input
                        placeholder="Item Name"
                        value={item.name}
                        onChange={(e) => {
                          const newSchedules = [...formData.scheduled_lives];
                          newSchedules[index].tiktok_shop_items[itemIndex].name = e.target.value;
                          setFormData({ ...formData, scheduled_lives: newSchedules });
                        }}
                        className="flex-1"
                      />
                      <Input
                        placeholder="TikTok Shop URL"
                        value={item.url}
                        onChange={(e) => {
                          const newSchedules = [...formData.scheduled_lives];
                          newSchedules[index].tiktok_shop_items[itemIndex].url = e.target.value;
                          setFormData({ ...formData, scheduled_lives: newSchedules });
                        }}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          const newSchedules = [...formData.scheduled_lives];
                          newSchedules[index].tiktok_shop_items = newSchedules[index].tiktok_shop_items.filter((_, i) => i !== itemIndex);
                          setFormData({ ...formData, scheduled_lives: newSchedules });
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newSchedules = [...formData.scheduled_lives];
                      if (!newSchedules[index].tiktok_shop_items) {
                        newSchedules[index].tiktok_shop_items = [];
                      }
                      newSchedules[index].tiktok_shop_items.push({ url: '', name: '' });
                      setFormData({ ...formData, scheduled_lives: newSchedules });
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" /> Add Shop Item
                  </Button>
                </div>

                <div className="flex flex-wrap gap-3 pt-2 border-t">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`shareable-${index}`}
                      checked={schedule.is_shareable || false}
                      onCheckedChange={(checked) => {
                        const newSchedules = [...formData.scheduled_lives];
                        newSchedules[index].is_shareable = checked;
                        setFormData({ ...formData, scheduled_lives: newSchedules });
                      }}
                    />
                    <Label htmlFor={`shareable-${index}`} className="text-sm font-semibold text-purple-700">📢 Share with Community</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`recurring-${index}`}
                      checked={schedule.is_recurring || false}
                      onCheckedChange={(checked) => {
                        const newSchedules = [...formData.scheduled_lives];
                        newSchedules[index].is_recurring = checked;
                        setFormData({ ...formData, scheduled_lives: newSchedules });
                      }}
                    />
                    <Label htmlFor={`recurring-${index}`} className="text-sm">Recurring Weekly</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`tiktok-events-${index}`}
                      checked={schedule.added_to_tiktok_events || false}
                      onCheckedChange={(checked) => {
                        const newSchedules = [...formData.scheduled_lives];
                        newSchedules[index].added_to_tiktok_events = checked;
                        setFormData({ ...formData, scheduled_lives: newSchedules });
                      }}
                    />
                    <Label htmlFor={`tiktok-events-${index}`} className="text-sm">Added to TikTok Events</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`discord-${index}`}
                      checked={schedule.posted_in_discord || false}
                      onCheckedChange={(checked) => {
                        const newSchedules = [...formData.scheduled_lives];
                        newSchedules[index].posted_in_discord = checked;
                        setFormData({ ...formData, scheduled_lives: newSchedules });
                      }}
                    />
                    <Label htmlFor={`discord-${index}`} className="text-sm">Posted in Discord</Label>
                  </div>
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setFormData({ ...formData, scheduled_lives: [...formData.scheduled_lives, { day_of_week: 'Monday', time: '12:00', completed: false, tiktok_shop_items: [], audience_restriction: 'all_ages' }] })
              }
            >
              <Plus className="h-4 w-4 mr-2" /> Add Live Schedule
            </Button>
          </div>

          {/* Scheduled Engagement */}
          <div className="space-y-3 mt-6 border-t pt-6">
            <h3 className="font-semibold text-lg">Scheduled Engagement</h3>
            {formData.scheduled_engagement.map((schedule, index) => (
              <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <Select
                  value={schedule.day_of_week}
                  onValueChange={(value) => {
                    const newSchedules = [...formData.scheduled_engagement];
                    newSchedules[index].day_of_week = value;
                    setFormData({ ...formData, scheduled_engagement: newSchedules });
                  }}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Day" />
                  </SelectTrigger>
                  <SelectContent>
                    {daysOfWeek.map(day => <SelectItem key={day} value={day}>{day}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input
                  type="time"
                  value={schedule.time}
                  onChange={(e) => {
                    const newSchedules = [...formData.scheduled_engagement];
                    newSchedules[index].time = e.target.value;
                    setFormData({ ...formData, scheduled_engagement: newSchedules });
                  }}
                  className="w-[120px]"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    const newSchedules = formData.scheduled_engagement.filter((_, i) => i !== index);
                    setFormData({ ...formData, scheduled_engagement: newSchedules });
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setFormData({ ...formData, scheduled_engagement: [...formData.scheduled_engagement, { day_of_week: 'Monday', time: '10:00', completed: false }] })
              }
            >
              <Plus className="h-4 w-4 mr-2" /> Add Engagement Schedule
            </Button>
          </div>

          <div className="space-y-2 mt-6 border-t pt-6">
            <Label htmlFor="notes">Weekly Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              placeholder="Any notes or reminders for this week..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading} className="bg-purple-600 hover:bg-purple-700">
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save Schedule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}