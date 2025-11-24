import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Copy, Download, Loader2, Trophy, Medal, Award, Music } from 'lucide-react';
import { format, startOfWeek } from 'date-fns';
import { motion } from 'framer-motion';

export default function WeeklySummary() {
  const [selectedWeek, setSelectedWeek] = useState(format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd'));
  const [copied, setCopied] = useState(false);

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['giftingEntries', selectedWeek],
    queryFn: () => base44.entities.GiftingEntry.filter({ week: selectedWeek }),
  });

  const sortedEntries = [...entries].sort((a, b) => {
    const rankOrder = { '1st': 1, '2nd': 2, '3rd': 3 };
    return (rankOrder[a.rank] || 4) - (rankOrder[b.rank] || 4);
  });

  const generateFormattedText = () => {
    if (sortedEntries.length === 0) return '';

    const rankEmoji = { '1st': '🥇', '2nd': '🥈', '3rd': '🥉' };
    const gifts = [...new Set(sortedEntries.map(e => e.gift_name))];

    let text = `Thank-you shoutout to our top gifters this week!\n\n`;

    sortedEntries.forEach(entry => {
      text += `${rankEmoji[entry.rank]} ${entry.gifter_screen_name} (@${entry.gifter_username}) — ${entry.gifter_phonetic || entry.gifter_screen_name}\n`;
    });

    if (gifts.length > 0) {
      text += `\nGifts: ${gifts.join(', ')}`;
    }

    return text;
  };

  const formattedText = generateFormattedText();

  const handleCopy = async () => {
    await navigator.clipboard.writeText(formattedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([formattedText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `thank-you-song-${selectedWeek}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getRankIcon = (rank) => {
    switch (rank) {
      case '1st': return <Trophy className="w-6 h-6 text-yellow-500" />;
      case '2nd': return <Medal className="w-6 h-6 text-gray-400" />;
      case '3rd': return <Award className="w-6 h-6 text-amber-600" />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Weekly Summary</h1>
          <p className="text-gray-600 mt-1">Generate thank-you song text for your top gifters</p>
        </div>

        {/* Week Selector */}
        <Card>
          <CardContent className="p-4">
            <Label>Select Week</Label>
            <Input
              type="date"
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(e.target.value)}
              className="mt-2"
            />
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          </div>
        ) : sortedEntries.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Music className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No gifter entries for this week yet</p>
              <p className="text-sm text-gray-400 mt-2">Add entries in the Gift Entry page</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Visual Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Music className="w-5 h-5 text-purple-600" />
                  Top Gifters - Week of {format(new Date(selectedWeek), 'MMM d, yyyy')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sortedEntries.map((entry, index) => (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`p-4 rounded-xl ${
                        entry.rank === '1st' ? 'bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-200' :
                        entry.rank === '2nd' ? 'bg-gradient-to-r from-gray-50 to-slate-50 border-2 border-gray-200' :
                        'bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        {getRankIcon(entry.rank)}
                        <div className="flex-1">
                          <h3 className="font-bold text-lg">{entry.gifter_screen_name}</h3>
                          <p className="text-purple-600">@{entry.gifter_username}</p>
                          {entry.gifter_phonetic && (
                            <p className="text-sm text-gray-600 italic mt-1">
                              🎵 "{entry.gifter_phonetic}"
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Gift</p>
                          <p className="font-semibold">{entry.gift_name}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Formatted Text Output */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Ready to Copy Text</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={formattedText}
                  readOnly
                  className="min-h-[200px] font-mono text-sm"
                />
                <div className="flex gap-3">
                  <Button
                    onClick={handleCopy}
                    className="flex-1 bg-purple-600 hover:bg-purple-700"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    {copied ? 'Copied!' : 'Copy to Clipboard'}
                  </Button>
                  <Button
                    onClick={handleDownload}
                    variant="outline"
                    className="flex-1"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download .txt
                  </Button>
                </div>
                <p className="text-xs text-gray-500 text-center">
                  Paste this into Sunny Songbird GPT to generate your thank-you song!
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}