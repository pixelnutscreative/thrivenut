import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus, X, ExternalLink } from 'lucide-react';

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const contentFormats = ["duet", "sync", "training", "series", "Q&A", "tutorial", "unboxing", "haul"];

export default function GoalEditModal({ isOpen, onClose, currentGoal, onSave }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    posts_goal: currentGoal?.posts_goal || 0,
    lives_goal: currentGoal?.lives_goal || 0,
    shop_lives_goal: currentGoal?.shop_lives_goal || 0,
    engagement_goal: currentGoal?.engagement_goal || 0,
    tiktok_username: currentGoal?.tiktok_username || '',
    allow_in_directory: currentGoal?.allow_in_directory || false,
    allow_search_by_username: currentGoal?.allow_search_by_username || false,
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
          <DialogTitle>Set Your Weekly Content Goals</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Sharing Settings */}
          <div className="space-y-3 p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
            <h3 className="font-semibold text-lg text-purple-900">📢 Share Your Schedule</h3>
            
            <div className="space-y-2">
              <Label htmlFor="tiktok-username">Your TikTok Username</Label>
              <Input
                id="tiktok-username"
                placeholder="@username or username"
                value={formData.tiktok_username}
                onChange={(e) => setFormData({...formData, tiktok_username: e.target.value.replace('@', '')})}
              />
              <p className="text-xs text-gray-600">Required to share your schedule with other ThriveNut users</p>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="allow-directory"
                checked={formData.allow_in_directory}
                onCheckedChange={(checked) => setFormData({...formData, allow_in_directory: checked})}
              />
              <Label htmlFor="allow-directory" className="text-sm">
                Show in Community Directory
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="allow-search"
                checked={formData.allow_search_by_username}
                onCheckedChange={(checked) => setFormData({...formData, allow_search_by_username: checked})}
              />
              <Label htmlFor="allow-search" className="text-sm">
                Allow search by TikTok username
              </Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="posts">Number of Posts</Label>
            <Input
              id="posts"
              type="number"
              min="0"
              value={formData.posts_goal}
              onChange={(e) => setFormData({...formData, posts_goal: parseInt(e.target.value) || 0})}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lives">Number of Lives</Label>
            <Input
              id="lives"
              type="number"
              min="0"
              value={formData.lives_goal}
              onChange={(e) => setFormData({...formData, lives_goal: parseInt(e.target.value) || 0})}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="shop_lives">TT Shop Lives</Label>
            <Input
              id="shop_lives"
              type="number"
              min="0"
              value={formData.shop_lives_goal}
              onChange={(e) => setFormData({...formData, shop_lives_goal: parseInt(e.target.value) || 0})}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="engagement">Engagement Actions</Label>
            <Input
              id="engagement"
              type="number"
              min="0"
              value={formData.engagement_goal}
              onChange={(e) => setFormData({...formData, engagement_goal: parseInt(e.target.value) || 0})}
              placeholder="Comments, DMs, etc."
            />
          </div>

          {/* Scheduled Posts */}
          <div className="space-y-3 mt-6 border-t pt-6">
            <h3 className="font-semibold text-lg">Scheduled Posts</h3>
            {formData.scheduled_posts.map((schedule, index) => (
              <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
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
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setFormData({ ...formData, scheduled_posts: [...formData.scheduled_posts, { day_of_week: 'Monday', time: '09:00', completed: false }] })
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
                    <Label className="text-sm">Start Time</Label>
                    <Input
                      placeholder="e.g., 7:00 PM"
                      value={schedule.start_time || ''}
                      onChange={(e) => {
                        const newSchedules = [...formData.scheduled_lives];
                        newSchedules[index].start_time = e.target.value;
                        setFormData({ ...formData, scheduled_lives: newSchedules });
                      }}
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Duration</Label>
                    <Input
                      placeholder="e.g., 1 hour"
                      value={schedule.duration || ''}
                      onChange={(e) => {
                        const newSchedules = [...formData.scheduled_lives];
                        newSchedules[index].duration = e.target.value;
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

                <div>
                  <Label className="text-sm">Video Guide URL (Optional)</Label>
                  <Input
                    placeholder="https://..."
                    value={schedule.video_guide_url || ''}
                    onChange={(e) => {
                      const newSchedules = [...formData.scheduled_lives];
                      newSchedules[index].video_guide_url = e.target.value;
                      setFormData({ ...formData, scheduled_lives: newSchedules });
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Content Formats</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {contentFormats.map(format => (
                      <div key={format} className="flex items-center space-x-2">
                        <Checkbox
                          id={`live-format-${index}-${format}`}
                          checked={schedule.content_formats?.includes(format)}
                          onCheckedChange={(checked) => {
                            const newSchedules = [...formData.scheduled_lives];
                            const currentFormats = newSchedules[index].content_formats || [];
                            newSchedules[index].content_formats = checked
                              ? [...currentFormats, format]
                              : currentFormats.filter(f => f !== format);
                            setFormData({ ...formData, scheduled_lives: newSchedules });
                          }}
                        />
                        <Label htmlFor={`live-format-${index}-${format}`} className="text-xs">{format}</Label>
                      </div>
                    ))}
                  </div>
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
                setFormData({ ...formData, scheduled_lives: [...formData.scheduled_lives, { day_of_week: 'Monday', time: '12:00', completed: false, content_formats: [], tiktok_shop_items: [], audience_restriction: 'all_ages' }] })
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
            Save Goals
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}