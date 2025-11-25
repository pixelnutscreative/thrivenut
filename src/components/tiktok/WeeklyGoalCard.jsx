import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Edit, Check, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

export default function WeeklyGoalCard({ goal, onEdit, onToggleScheduleComplete }) {
  if (!goal) {
    return (
      <Card className="shadow-md">
        <CardContent className="p-8 text-center">
          <p className="text-gray-600 mb-4">No schedule set for this week yet</p>
          <Button onClick={onEdit} className="bg-purple-600 hover:bg-purple-700">
            <Plus className="w-4 h-4 mr-2" />
            Set This Week's Schedule
          </Button>
        </CardContent>
      </Card>
    );
  }

  const hasScheduledItems = (goal.scheduled_posts?.length > 0 || goal.scheduled_lives?.length > 0 || goal.scheduled_engagement?.length > 0);

  return (
    <Card className="shadow-md">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl">This Week's Content Schedule</CardTitle>
        <Button onClick={onEdit} variant="outline" size="sm">
          <Edit className="w-4 h-4 mr-2" />
          Edit
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {hasScheduledItems ? (
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-700">Scheduled Activities</h4>
            {goal.scheduled_posts?.map((schedule, index) => (
              <ScheduledItem
                key={`post-${index}`}
                type="Post"
                schedule={schedule}
                onToggleComplete={() => onToggleScheduleComplete('scheduled_posts', index)}
                contentFormats={schedule.content_formats}
                title={schedule.title}
                description={schedule.description}
              />
            ))}
            {goal.scheduled_lives?.map((schedule, index) => (
              <ScheduledItem
                key={`live-${index}`}
                type="Live"
                schedule={schedule}
                onToggleComplete={() => onToggleScheduleComplete('scheduled_lives', index)}
                tiktokShopItems={schedule.tiktok_shop_items}
                title={schedule.title}
                description={schedule.description}
                audienceRestriction={schedule.audience_restriction}
                isRecurring={schedule.is_recurring}
                addedToTikTokEvents={schedule.added_to_tiktok_events}
                postedInDiscord={schedule.posted_in_discord}
              />
            ))}
            {goal.scheduled_engagement?.map((schedule, index) => (
              <ScheduledItem
                key={`engagement-${index}`}
                type="Engagement"
                schedule={schedule}
                onToggleComplete={() => onToggleScheduleComplete('scheduled_engagement', index)}
              />
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No activities scheduled yet. Click Edit to add some!</p>
        )}

        {goal.notes && (
          <div className="mt-6 p-4 bg-purple-50 rounded-lg">
            <p className="text-sm font-medium text-gray-700 mb-1">Weekly Notes:</p>
            <p className="text-sm text-gray-600">{goal.notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ScheduledItem({
  type,
  schedule,
  onToggleComplete,
  contentFormats,
  tiktokShopItems,
  title,
  description,
  audienceRestriction,
  isRecurring,
  addedToTikTokEvents,
  postedInDiscord
}) {
  const typeColors = {
    Post: 'border-l-purple-500',
    Live: 'border-l-pink-500',
    Engagement: 'border-l-blue-500'
  };

  return (
    <div className={`flex flex-col gap-2 p-3 border rounded-lg bg-white border-l-4 ${typeColors[type]}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Checkbox checked={schedule.completed} onCheckedChange={onToggleComplete} />
          <div>
            <p className={`font-medium text-gray-800 ${schedule.completed ? 'line-through text-gray-400' : ''}`}>
              {type} on {schedule.day_of_week} at {schedule.time}
            </p>
            {title && <p className="text-sm text-gray-700 font-semibold mt-1">{title}</p>}
            {description && <p className="text-xs text-gray-600 mt-1">{description}</p>}
            {audienceRestriction && type === 'Live' && (
              <p className="text-xs text-purple-600 mt-1">
                Audience: {audienceRestriction === '18+' ? '18+' : 'All Ages'}
              </p>
            )}
            {contentFormats && contentFormats.length > 0 && type === 'Post' && (
              <p className="text-xs text-gray-600 mt-1">Formats: {contentFormats.map(f => f.charAt(0).toUpperCase() + f.slice(1)).join(', ')}</p>
            )}
            {tiktokShopItems && tiktokShopItems.length > 0 && (
              <div className="mt-1 space-y-1">
                {tiktokShopItems.map((item, index) => (
                  <a 
                    key={index} 
                    href={item.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-xs text-blue-500 hover:underline flex items-center gap-1"
                  >
                    🛍️ {item.name || "TikTok Shop Item"}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
        {schedule.completed && <Check className="h-5 w-5 text-green-500" />}
      </div>
      
      {type === 'Live' && (isRecurring || addedToTikTokEvents || postedInDiscord) && (
        <div className="flex flex-wrap gap-2 ml-8 text-xs">
          {isRecurring && (
            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">🔄 Recurring</span>
          )}
          {addedToTikTokEvents && (
            <span className="px-2 py-1 bg-green-100 text-green-700 rounded">✅ On TikTok</span>
          )}
          {postedInDiscord && (
            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded">💬 Posted in Discord</span>
          )}
        </div>
      )}
    </div>
  );
}