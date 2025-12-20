import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MessageSquare, TrendingUp, ChevronRight, Loader2, Link as LinkIcon } from 'lucide-react';
import { createPageUrl } from '../../utils';
import { Link } from 'react-router-dom';
import CryptoTickerWidget from '../widgets/CryptoTickerWidget';

export default function GroupWidget({ widget, userEmail }) {
  const { groupId, config } = widget;
  
  const { data: group, isLoading } = useQuery({
    queryKey: ['group', groupId],
    queryFn: async () => {
      const groups = await base44.entities.CreatorGroup.filter({ id: groupId });
      return groups[0] || null;
    }
  });

  const { data: events = [] } = useQuery({
    queryKey: ['groupEvents', groupId],
    queryFn: () => base44.entities.GroupEvent.filter({ group_id: groupId }, 'start_time', 3),
    enabled: !!group
  });

  const { data: posts = [] } = useQuery({
    queryKey: ['groupPosts', groupId],
    queryFn: () => base44.entities.GroupPost.filter({ group_id: groupId }, '-created_date', 1),
    enabled: !!group
  });
  
  // Also check for user membership to verify access if needed, but dashboard usually implies access.

  if (isLoading) {
    return (
      <Card className="h-full flex items-center justify-center p-6">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </Card>
    );
  }

  if (!group) return null;

  const showEvents = !config?.hideEvents;
  const showFeed = !config?.hideFeed;
  const showTicker = !config?.hideTicker && group.crypto_tickers?.length > 0;

  return (
    <Card className="h-full flex flex-col hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            {group.logo_url && (
              <img src={group.logo_url} alt="" className="w-6 h-6 rounded-full object-cover" />
            )}
            <Link to={`${createPageUrl('CreatorGroups')}?id=${group.id}`} className="hover:underline">
              {group.name}
            </Link>
          </CardTitle>
          <Badge variant="outline" className="text-xs">Group</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-4">
        
        {showEvents && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Upcoming Events
            </h4>
            {events.length > 0 ? (
              <div className="space-y-2">
                {events.map(event => (
                  <div key={event.id} className="text-sm border-l-2 border-purple-200 pl-3 py-1">
                    <p className="font-medium text-gray-800">{event.title}</p>
                    <p className="text-xs text-gray-500">{new Date(event.start_time).toLocaleDateString()} at {new Date(event.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic">No upcoming events</p>
            )}
          </div>
        )}

        {showFeed && posts.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
              <MessageSquare className="w-3 h-3" /> Latest Post
            </h4>
            <div className="bg-gray-50 p-3 rounded-lg text-sm">
              <p className="font-medium text-gray-800 truncate">{posts[0].title}</p>
              <div 
                className="text-gray-600 text-xs line-clamp-2 mt-1" 
                dangerouslySetInnerHTML={{ __html: posts[0].content }} 
              />
            </div>
          </div>
        )}

        {showTicker && (
          <div className="space-y-2">
             <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Market Watch
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {group.crypto_tickers.slice(0, 4).map((ticker, idx) => (
                <div key={idx} className="bg-gray-900 text-white p-2 rounded text-xs flex justify-between items-center">
                  <span className="font-bold">{ticker.symbol}</span>
                  {/* Simplified ticker display without full widget logic for now */}
                  <span className="text-green-400">$...</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <Link 
          to={`${createPageUrl('CreatorGroups')}?id=${group.id}`}
          className="block w-full text-center text-sm text-[var(--primary-color)] hover:underline mt-4 pt-2 border-t"
        >
          View Group Dashboard
        </Link>
      </CardContent>
    </Card>
  );
}