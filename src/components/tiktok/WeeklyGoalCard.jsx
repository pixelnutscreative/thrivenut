import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Video, ShoppingBag, MessageCircle, Edit, Check, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

export default function WeeklyGoalCard({ goal, onEdit, onIncrement, onToggleScheduleComplete }) {
  if (!goal) {
    return (
      <Card className="shadow-md">
        <CardContent className="p-8 text-center">
          <p className="text-gray-600 mb-4">No goals set for this week yet</p>
          <Button onClick={onEdit} className="bg-purple-600 hover:bg-purple-700">
            <Plus className="w-4 h-4 mr-2" />
            Set This Week's Goals
          </Button>
        </CardContent>
      </Card>
    );
  }

  const goalItems = [
    {
      icon: Video,
      label: 'Posts',
      completed: goal.posts_completed,
      total: goal.posts_goal,
      key: 'posts',
      color: 'text-purple-600'
    },
    {
      icon: Video,
      label: 'Lives',
      completed: goal.lives_completed,
      total: goal.lives_goal,
      key: 'lives',
      color: 'text-pink-600'
    },
    {
      icon: ShoppingBag,
      label: 'Shop Lives',
      completed: goal.shop_lives_completed,
      total: goal.shop_lives_goal,
      key: 'shop_lives',
      color: 'text-orange-600'
    },
    {
      icon: MessageCircle,
      label: 'Engagement',
      completed: goal.engagement_completed,
      total: goal.engagement_goal,
      key: 'engagement',
      color: 'text-blue-600'
    }
  ];

  return (
    <Card className="shadow-md">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl">This Week's Content Goals</CardTitle>
        <Button onClick={onEdit} variant="outline" size="sm">
          <Edit className="w-4 h-4 mr-2" />
          Edit
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {goalItems.map((item, index) => {
          const Icon = item.icon;
          const percentage = item.total > 0 ? (item.completed / item.total) * 100 : 0;
          
          return (
            <motion.div
              key={item.key}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className={`w-5 h-5 ${item.color}`} />
                  <span className="font-medium">{item.label}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold">
                    {item.completed}/{item.total}
                  </span>
                  {item.completed < item.total && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 w-8 p-0"
                      onClick={() => onIncrement(item.key)}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
              <Progress value={percentage} className="h-2" />
            </motion.div>
          );
        })}

        {/* Scheduled Items */}
        {(goal.scheduled_posts?.length > 0 || goal.scheduled_lives?.length > 0 || goal.scheduled_engagement?.length > 0) && (
          <div className="mt-6 pt-6 border-t space-y-3">
            <h4 className="font-semibold text-gray-700">Scheduled Activities</h4>
            {goal.scheduled_posts?.map((schedule, index) => (
              <ScheduledItem
                key={`post-${index}`}
                type="Post"
                schedule={schedule}
                onToggleComplete={() => onToggleScheduleComplete('scheduled_posts', index)}
              />
            ))}
            {goal.scheduled_lives?.map((schedule, index) => (
              <ScheduledItem
                key={`live-${index}`}
                type="Live"
                schedule={schedule}
                onToggleComplete={() => onToggleScheduleComplete('scheduled_lives', index)}
                contentFormats={schedule.content_formats}
                tiktokShopItems={schedule.tiktok_shop_items}
                title={schedule.title}
                description={schedule.description}
                startTime={schedule.start_time}
                duration={schedule.duration}
                audienceRestriction={schedule.audience_restriction}
                videoGuideUrl={schedule.video_guide_url}
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
  startTime,
  duration,
  audienceRestriction,
  videoGuideUrl,
  isRecurring,
  addedToTikTokEvents,
  postedInDiscord
}) {
  return (
    <div className="flex flex-col gap-2 p-3 border rounded-lg bg-white">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Checkbox checked={schedule.completed} onCheckedChange={onToggleComplete} />
          <div>
            <p className="font-medium text-gray-800">
              {type} on {schedule.day_of_week} at {schedule.time}
            </p>
            {title && <p className="text-sm text-gray-600 font-semibold mt-1">{title}</p>}
            {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
            {startTime && duration && (
              <p className="text-xs text-gray-600 mt-1">
                Start: {startTime} | Duration: {duration}
              </p>
            )}
            {audienceRestriction && (
              <p className="text-xs text-purple-600 mt-1">
                Audience: {audienceRestriction === '18+' ? '18+' : 'All Ages'}
              </p>
            )}
            {contentFormats && contentFormats.length > 0 && (
              <p className="text-xs text-gray-600 mt-1">Formats: {contentFormats.join(', ')}</p>
            )}
            {videoGuideUrl && (
              <a 
                href={videoGuideUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-xs text-blue-500 hover:underline flex items-center gap-1 mt-1"
              >
                📚 Watch Guide
                <ExternalLink className="w-3 h-3" />
              </a>
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
      
      {type === 'Live' && (
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