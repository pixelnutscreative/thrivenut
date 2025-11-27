import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Music, Star, Trash2, Copy, Edit, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

export default function SongHistoryModal({ 
  isOpen, 
  onClose, 
  songs = [], 
  isLoading,
  onSelect,
  onDelete,
  onToggleFavorite 
}) {
  const [copied, setCopied] = React.useState(null);

  const handleCopy = async (song, e) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(song.lyrics);
    setCopied(song.id);
    setTimeout(() => setCopied(null), 2000);
  };

  const sortedSongs = [...songs].sort((a, b) => {
    // Favorites first, then by date
    if (a.is_favorite && !b.is_favorite) return -1;
    if (!a.is_favorite && b.is_favorite) return 1;
    return new Date(b.created_date) - new Date(a.created_date);
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Music className="w-5 h-5 text-purple-600" />
            Song History
            <Badge variant="secondary">{songs.length} songs</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-3 py-4">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
          ) : sortedSongs.length === 0 ? (
            <div className="text-center py-12">
              <Music className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No songs generated yet</p>
              <p className="text-sm text-gray-400">Your song history will appear here</p>
            </div>
          ) : (
            sortedSongs.map((song, index) => (
              <motion.div
                key={song.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <Card 
                  className={`cursor-pointer hover:shadow-md transition-all ${
                    song.is_favorite ? 'ring-2 ring-amber-400 bg-amber-50/50' : ''
                  }`}
                  onClick={() => onSelect(song)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="secondary" className="text-xs">
                            {song.song_type_label || song.song_type}
                          </Badge>
                          {song.tone && (
                            <Badge variant="outline" className="text-xs">
                              {song.tone}
                            </Badge>
                          )}
                        </div>
                        {song.title && (
                          <p className="font-semibold text-gray-800 truncate">{song.title}</p>
                        )}
                        <p className="text-sm text-gray-500 line-clamp-2 mt-1">
                          {song.lyrics?.split('\n').slice(0, 2).join(' ').substring(0, 100)}...
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                          {format(new Date(song.created_date), 'MMM d, yyyy h:mm a')}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleFavorite(song);
                          }}
                        >
                          <Star className={`w-4 h-4 ${song.is_favorite ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => handleCopy(song, e)}
                        >
                          {copied === song.id ? (
                            <span className="text-xs text-green-600">✓</span>
                          ) : (
                            <Copy className="w-4 h-4 text-gray-400" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-400 hover:text-red-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm('Delete this song?')) {
                              onDelete(song.id);
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}