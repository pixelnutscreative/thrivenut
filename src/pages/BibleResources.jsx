import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BookOpen, Search, ExternalLink, Download, Heart } from 'lucide-react';
import { motion } from 'framer-motion';

export default function BibleResources() {
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch resources tagged as "Bible" or in "Bible Resources" category
  // Assuming DesignResource entity is used for resources as per Pixel's Place
  const { data: resources = [], isLoading } = useQuery({
    queryKey: ['bibleResources'],
    queryFn: async () => {
      // Fetch all resources and filter client side if needed, or filter by category if possible
      // Assuming we'll use a category name "Bible" or "Spiritual"
      const allResources = await base44.entities.DesignResource.filter({ is_active: true });
      return allResources.filter(r => 
        r.category === 'Bible' || 
        r.category === 'Spiritual' || 
        r.tags?.includes('bible') ||
        r.title?.toLowerCase().includes('bible')
      );
    }
  });

  const filteredResources = resources.filter(resource => 
    resource.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    resource.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 p-6 md:p-12">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-purple-900 flex items-center gap-3">
              <BookOpen className="w-10 h-10 text-purple-600" />
              Bible Resources
            </h1>
            <p className="text-purple-700 mt-2 text-lg">Tools, guides, and plans to deepen your faith.</p>
          </div>
          
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-3 h-4 w-4 text-purple-400" />
            <Input
              placeholder="Search resources..."
              className="pl-10 bg-white border-purple-200 focus:border-purple-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 bg-white/50 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : filteredResources.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResources.map((resource, idx) => (
              <motion.div
                key={resource.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className="h-full hover:shadow-lg transition-all duration-300 border-purple-100 overflow-hidden group">
                  {resource.thumbnail_url && (
                    <div className="h-48 overflow-hidden bg-gray-100 relative">
                      <img 
                        src={resource.thumbnail_url} 
                        alt={resource.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      {resource.is_free && (
                        <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-sm">
                          FREE
                        </div>
                      )}
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="text-xl text-purple-900 line-clamp-1">{resource.title}</CardTitle>
                    <CardDescription className="line-clamp-2">{resource.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2 mt-auto">
                      {resource.link && (
                        <Button 
                          className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                          onClick={() => window.open(resource.link, '_blank')}
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Open
                        </Button>
                      )}
                      {resource.download_url && (
                        <Button 
                          variant="outline"
                          className="flex-1 border-purple-200 text-purple-700 hover:bg-purple-50"
                          onClick={() => window.open(resource.download_url, '_blank')}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white/50 rounded-3xl border border-dashed border-purple-200">
            <BookOpen className="w-16 h-16 text-purple-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-purple-900">No resources found</h3>
            <p className="text-purple-600 mt-2">Check back soon for new Bible study materials!</p>
          </div>
        )}
      </div>
    </div>
  );
}