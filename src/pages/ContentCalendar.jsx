import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, addDays } from 'date-fns';
import { useTheme } from '../components/shared/useTheme';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';

const platformIcons = {
  TikTok: '🎵',
  YouTube: '▶️',
  Facebook: '👤',
  LinkedIn: '💼',
  Pinterest: '📌',
  Email: '📧',
  SMS: '💬'
};

export default function ContentCalendar() {
  const navigate = useNavigate();
  const { bgClass, primaryColor, accentColor } = useTheme();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month'); // 'month' or 'week'
  const [filterPlatform, setFilterPlatform] = useState('all');
  const [filterBrand, setFilterBrand] = useState('all');
  const [filterCampaign, setFilterCampaign] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const { data: platformOutputs = [] } = useQuery({
    queryKey: ['scheduledOutputs'],
    queryFn: async () => {
      const outputs = await base44.entities.ContentPlatformOutput.list('-schedule_datetime');
      return outputs.filter(o => o.schedule_datetime);
    },
  });

  const { data: contentCards = [] } = useQuery({
    queryKey: ['contentCards'],
    queryFn: () => base44.entities.ContentCard.list(),
  });

  const { data: brands = [] } = useQuery({
    queryKey: ['brands'],
    queryFn: () => base44.entities.Brand.list('name'),
  });

  const { data: campaigns = [] } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => base44.entities.PromotionCampaign.list(),
  });

  const { data: platforms = [] } = useQuery({
    queryKey: ['platformConfigs'],
    queryFn: async () => {
      const data = await base44.entities.PlatformConfig.filter({ is_enabled: true }, 'display_order');
      return data;
    },
  });

  const getCard = (outputId) => {
    const output = platformOutputs.find(o => o.id === outputId);
    return contentCards.find(c => c.id === output?.content_card_id);
  };

  const getBrandColor = (card) => {
    const brand = brands.find(b => b.id === card?.brand_id);
    return brand?.colors?.[0] || primaryColor;
  };

  const filteredOutputs = platformOutputs.filter(output => {
    const card = getCard(output.id);
    if (!card) return false;
    if (filterPlatform !== 'all' && output.platform !== filterPlatform) return false;
    if (filterBrand !== 'all' && card.brand_id !== filterBrand) return false;
    if (filterCampaign !== 'all' && card.campaign_id !== filterCampaign) return false;
    if (filterStatus !== 'all' && card.status !== filterStatus) return false;
    return true;
  });

  const getOutputsForDate = (date) => {
    return filteredOutputs.filter(output => 
      isSameDay(new Date(output.schedule_datetime), date)
    );
  };

  const isOverdue = (output) => {
    const card = getCard(output.id);
    if (!card || card.status === 'posted') return false;
    return new Date(output.schedule_datetime) < new Date();
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  
  // Next 7 days view
  const today = new Date();
  const next7Days = eachDayOfInterval({ start: today, end: addDays(today, 6) });

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const handleToday = () => setCurrentDate(new Date());

  const handleOutputClick = (output) => {
    const card = getCard(output.id);
    if (card) {
      navigate(createPageUrl('ContentCards') + `?edit=${card.id}`);
    }
  };

  return (
    <div className={`min-h-screen ${bgClass} p-6`}>
      <div className="max-w-[1600px] mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Content Calendar</h1>
            <p className="text-sm text-gray-600 mt-1">View scheduled platform outputs</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center border rounded-lg overflow-hidden">
              <Button
                variant={viewMode === 'month' ? 'default' : 'ghost'}
                onClick={() => setViewMode('month')}
                className="rounded-none"
              >
                Month
              </Button>
              <Button
                variant={viewMode === 'week' ? 'default' : 'ghost'}
                onClick={() => setViewMode('week')}
                className="rounded-none"
              >
                Next 7 Days
              </Button>
            </div>
            {viewMode === 'month' && (
              <>
                <Button variant="outline" onClick={handlePrevMonth}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" onClick={handleToday}>Today</Button>
                <Button variant="outline" onClick={handleNextMonth}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4 flex-wrap">
              <Filter className="w-4 h-4 text-gray-500" />
              <Select value={filterPlatform} onValueChange={setFilterPlatform}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Platforms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Platforms</SelectItem>
                  {platforms.map(p => (
                    <SelectItem key={p.platform_id} value={p.platform_id}>{p.display_label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterBrand} onValueChange={setFilterBrand}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Brands" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Brands</SelectItem>
                  {brands.map(b => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterCampaign} onValueChange={setFilterCampaign}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Campaigns" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Campaigns</SelectItem>
                  {campaigns.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="posted">Posted</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Calendar Grid */}
        {viewMode === 'month' ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-center">
                {format(currentDate, 'MMMM yyyy')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Weekday Headers */}
              <div className="grid grid-cols-7 gap-2 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center font-semibold text-sm text-gray-600 py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-2">
                {calendarDays.map(day => {
                  const outputs = getOutputsForDate(day);
                  const isCurrentMonth = isSameMonth(day, currentDate);
                  const isToday = isSameDay(day, new Date());

                  return (
                    <div
                      key={day.toString()}
                      className={`min-h-[120px] p-2 border rounded-lg ${
                        isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                      } ${isToday ? 'border-2 border-purple-500' : 'border-gray-200'}`}
                    >
                      <div className="text-sm font-medium text-gray-700 mb-1">
                        {format(day, 'd')}
                      </div>
                      <div className="space-y-1">
                        {outputs.map(output => {
                          const card = getCard(output.id);
                          if (!card) return null;
                          const brandColor = getBrandColor(card);
                          const outputIsOverdue = isOverdue(output);
                          return (
                            <div
                              key={output.id}
                              onClick={() => handleOutputClick(output)}
                              className={`text-xs p-1.5 rounded cursor-pointer hover:opacity-80 transition-opacity ${
                                outputIsOverdue ? 'ring-2 ring-red-500' : ''
                              }`}
                              style={{ backgroundColor: brandColor + '20', borderLeft: `3px solid ${brandColor}` }}
                            >
                              <div className="flex items-center gap-1 mb-0.5">
                                {outputIsOverdue && <span className="text-red-600 font-bold">⚠️</span>}
                                <span>{platformIcons[output.platform] || '📱'}</span>
                                <span className="font-medium truncate">{card.title}</span>
                              </div>
                              <div className={`text-[10px] ${outputIsOverdue ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>
                                {format(new Date(output.schedule_datetime), 'h:mm a')}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Next 7 Days</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {next7Days.map(day => {
                  const outputs = getOutputsForDate(day);
                  const isToday = isSameDay(day, new Date());
                  
                  return (
                    <div key={day.toString()} className={`p-4 border rounded-lg ${isToday ? 'border-2 border-purple-500 bg-purple-50' : 'border-gray-200 bg-white'}`}>
                      <h3 className="font-semibold text-lg mb-3">
                        {format(day, 'EEEE, MMMM d')}
                        {isToday && <Badge className="ml-2 bg-purple-600">Today</Badge>}
                      </h3>
                      {outputs.length === 0 ? (
                        <p className="text-sm text-gray-500 italic">No scheduled content</p>
                      ) : (
                        <div className="space-y-2">
                          {outputs.map(output => {
                            const card = getCard(output.id);
                            if (!card) return null;
                            const brandColor = getBrandColor(card);
                            const outputIsOverdue = isOverdue(output);
                            return (
                              <div
                                key={output.id}
                                onClick={() => handleOutputClick(output)}
                                className={`p-3 rounded-lg cursor-pointer hover:opacity-80 transition-opacity ${
                                  outputIsOverdue ? 'ring-2 ring-red-500' : ''
                                }`}
                                style={{ backgroundColor: brandColor + '20', borderLeft: `4px solid ${brandColor}` }}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    {outputIsOverdue && <span className="text-red-600 font-bold text-lg">⚠️</span>}
                                    <span className="text-xl">{platformIcons[output.platform] || '📱'}</span>
                                    <div>
                                      <p className="font-semibold">{card.title}</p>
                                      <p className="text-xs text-gray-600">{output.platform}</p>
                                    </div>
                                  </div>
                                  <div className={`text-sm font-medium ${outputIsOverdue ? 'text-red-600' : 'text-gray-700'}`}>
                                    {format(new Date(output.schedule_datetime), 'h:mm a')}
                                    {outputIsOverdue && <span className="block text-xs">OVERDUE</span>}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}