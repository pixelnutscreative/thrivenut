import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Sparkles, Target, Briefcase, Heart, Users, Building2, Baby, FolderOpen,
  ChevronRight, ImageOff
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { motion } from 'framer-motion';
import { useTheme } from '../components/shared/useTheme';

const visionBoardCategories = [
  { id: 'all', label: 'All', icon: Sparkles },
  { id: 'personal', label: 'Personal', icon: Heart },
  { id: 'business', label: 'Business', icon: Briefcase },
  { id: 'family', label: 'Family', icon: Users },
  { id: 'project', label: 'Projects', icon: FolderOpen },
  { id: 'nonprofit', label: 'Nonprofit', icon: Building2 },
  { id: 'child', label: 'For a Child', icon: Baby },
  { id: 'other', label: 'Other', icon: Target },
];

const categoryColors = {
  spiritual: 'bg-purple-100 text-purple-800',
  health: 'bg-green-100 text-green-800',
  personal: 'bg-blue-100 text-blue-800',
  financial: 'bg-yellow-100 text-yellow-800',
  relationship: 'bg-pink-100 text-pink-800',
  learning: 'bg-orange-100 text-orange-800',
  career: 'bg-indigo-100 text-indigo-800',
  creative: 'bg-teal-100 text-teal-800',
  other: 'bg-gray-100 text-gray-800'
};

export default function VisionBoard() {
  const [user, setUser] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const { isDark, bgClass, textClass, primaryColor, accentColor } = useTheme();

  React.useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: goals = [] } = useQuery({
    queryKey: ['goals', user?.email],
    queryFn: () => base44.entities.Goal.filter({ status: 'active', created_by: user.email }, '-created_date'),
    enabled: !!user,
  });

  // Filter goals that have vision images
  const goalsWithImages = goals.filter(g => g.vision_image_url);
  
  // Filter by selected category
  const filteredGoals = selectedCategory === 'all' 
    ? goalsWithImages 
    : goalsWithImages.filter(g => g.vision_board_category === selectedCategory);

  // Group goals by vision board category for the overview
  const goalsByCategory = visionBoardCategories.slice(1).reduce((acc, cat) => {
    acc[cat.id] = goalsWithImages.filter(g => g.vision_board_category === cat.id);
    return acc;
  }, {});

  // Also include uncategorized goals (have image but no vision_board_category)
  const uncategorizedGoals = goalsWithImages.filter(g => !g.vision_board_category);

  return (
    <div className={`min-h-screen ${bgClass} ${isDark ? 'text-gray-100' : ''} p-4 md:p-8`}>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 
              className="text-4xl font-bold bg-clip-text text-transparent mb-2"
              style={{ backgroundImage: `linear-gradient(to right, ${primaryColor || '#8B5CF6'}, ${accentColor || '#EC4899'})` }}
            >
              ✨ My Vision Board
            </h1>
            <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
              Visualize your dreams and goals
            </p>
          </div>
          <Link to={createPageUrl('Goals')}>
            <Button variant="outline" className="gap-2">
              <Target className="w-4 h-4" />
              Manage Goals
            </Button>
          </Link>
        </div>

        {goalsWithImages.length === 0 ? (
          <Card className={`${isDark ? 'bg-gray-800 border-gray-700' : ''}`}>
            <CardContent className="p-12 text-center">
              <ImageOff className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className={`text-xl font-semibold mb-2 ${textClass}`}>No Vision Board Images Yet</h3>
              <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                Add vision images to your goals to build your vision board!
              </p>
              <Link to={createPageUrl('Goals')}>
                <Button className="mt-4 bg-gradient-to-r from-purple-600 to-pink-600">
                  Go to Goals
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Category Tabs */}
            <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
              <TabsList className="flex flex-wrap gap-1 h-auto p-1 bg-white/50 backdrop-blur">
                {visionBoardCategories.map(cat => {
                  const Icon = cat.icon;
                  const count = cat.id === 'all' 
                    ? goalsWithImages.length 
                    : goalsByCategory[cat.id]?.length || 0;
                  
                  if (cat.id !== 'all' && count === 0) return null;
                  
                  return (
                    <TabsTrigger 
                      key={cat.id} 
                      value={cat.id}
                      className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white"
                    >
                      <Icon className="w-4 h-4" />
                      {cat.label}
                      {count > 0 && (
                        <span className="text-xs opacity-75">({count})</span>
                      )}
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              {/* Vision Board Grid */}
              <TabsContent value={selectedCategory} className="mt-6">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {filteredGoals.map((goal, index) => (
                    <motion.div
                      key={goal.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Link to={`${createPageUrl('Goals')}`}>
                        <Card className={`overflow-hidden group cursor-pointer hover:shadow-xl transition-all hover:-translate-y-1 ${isDark ? 'bg-gray-800 border-gray-700' : ''}`}>
                          <div className="aspect-square relative overflow-hidden">
                            <img 
                              src={goal.vision_image_url} 
                              alt={goal.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform">
                              <Badge className={`${categoryColors[goal.category]} border-0 text-xs`}>
                                {goal.category}
                              </Badge>
                            </div>
                          </div>
                          <CardContent className="p-3">
                            <h3 className={`font-semibold text-sm line-clamp-2 ${textClass}`}>
                              {goal.title}
                            </h3>
                            {goal.target_date && (
                              <p className="text-xs text-gray-500 mt-1">
                                Target: {new Date(goal.target_date).toLocaleDateString()}
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      </Link>
                    </motion.div>
                  ))}
                </div>

                {/* Uncategorized section */}
                {selectedCategory === 'all' && uncategorizedGoals.length > 0 && (
                  <div className="mt-8">
                    <h3 className={`text-lg font-semibold mb-4 ${textClass}`}>
                      Uncategorized Vision Items
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                      {uncategorizedGoals.map((goal, index) => (
                        <motion.div
                          key={goal.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <Link to={`${createPageUrl('Goals')}`}>
                            <Card className={`overflow-hidden group cursor-pointer hover:shadow-xl transition-all hover:-translate-y-1 ${isDark ? 'bg-gray-800 border-gray-700' : ''}`}>
                              <div className="aspect-square relative overflow-hidden">
                                <img 
                                  src={goal.vision_image_url} 
                                  alt={goal.title}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                />
                              </div>
                              <CardContent className="p-3">
                                <h3 className={`font-semibold text-sm line-clamp-2 ${textClass}`}>
                                  {goal.title}
                                </h3>
                              </CardContent>
                            </Card>
                          </Link>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </div>
  );
}