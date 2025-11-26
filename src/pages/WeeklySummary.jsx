import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Copy, Download, Loader2, Trophy, Medal, Award, Music, Send, Check, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { getEffectiveUserEmail } from '../components/admin/ImpersonationBanner';

const SUNNY_SONGBIRD_EMAIL = 'sunnysongbird@example.com'; // Replace with actual email

export default function WeeklySummary() {
  const queryClient = useQueryClient();
  
  // Week ending Sunday
  const getWeekEndingSunday = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = day === 0 ? 0 : 7 - day;
    d.setDate(d.getDate() + diff);
    return format(d, 'yyyy-MM-dd');
  };
  
  const [selectedWeek, setSelectedWeek] = useState(getWeekEndingSunday(new Date()));
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [allGood, setAllGood] = useState(false);
  const [user, setUser] = useState(null);
  const [editingEntry, setEditingEntry] = useState(null);
  const [editForm, setEditForm] = useState({ gifter_screen_name: '', gifter_phonetic: '' });

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  // Get effective email (real user or impersonated)
  const effectiveEmail = user ? getEffectiveUserEmail(user.email) : null;

  const { data: preferences } = useQuery({
    queryKey: ['preferences', effectiveEmail],
    queryFn: async () => {
      const prefs = await base44.entities.UserPreferences.filter({ user_email: effectiveEmail });
      return prefs[0] || null;
    },
    enabled: !!effectiveEmail,
  });

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['giftingEntries', selectedWeek, effectiveEmail],
    queryFn: () => base44.entities.GiftingEntry.filter({ week: selectedWeek, created_by: effectiveEmail }),
    enabled: !!effectiveEmail,
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ['tiktokContacts', effectiveEmail],
    queryFn: () => base44.entities.TikTokContact.filter({ created_by: effectiveEmail }),
    enabled: !!effectiveEmail,
  });

  const updateEntryMutation = useMutation({
    mutationFn: async ({ entryId, data }) => {
      // Update the entry
      await base44.entities.GiftingEntry.update(entryId, data);
      
      // Also update the contact if it exists
      const entry = entries.find(e => e.id === entryId);
      if (entry?.gifter_id) {
        const contact = contacts.find(c => c.id === entry.gifter_id);
        if (contact) {
          await base44.entities.TikTokContact.update(contact.id, {
            display_name: data.gifter_screen_name,
            phonetic: data.gifter_phonetic
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['giftingEntries'] });
      queryClient.invalidateQueries({ queryKey: ['tiktokContacts'] });
      setEditingEntry(null);
    },
  });

  const sortedEntries = [...entries].sort((a, b) => {
    const rankOrder = { '1st': 1, '2nd': 2, '3rd': 3 };
    return (rankOrder[a.rank] || 4) - (rankOrder[b.rank] || 4);
  });

  const generateFormattedText = () => {
    if (sortedEntries.length === 0) return '';

    let text = `Thank-you shoutout to our top gifters for the week ending ${format(new Date(selectedWeek), 'MMMM d, yyyy')}!\n\n`;

    sortedEntries.forEach(entry => {
      const rankLabel = entry.rank === '1st' ? '1st Place' : entry.rank === '2nd' ? '2nd Place' : '3rd Place';
      text += `${entry.gift_name} - ${rankLabel}\n`;
      text += `${entry.gifter_screen_name} (@${entry.gifter_username})\n`;
      if (entry.gifter_phonetic) {
        text += `Pronunciation: ${entry.gifter_phonetic}\n`;
      }
      text += '\n';
    });

    return text.trim();
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
    a.download = `thank-you-song-week-ending-${selectedWeek}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSendToSunny = async () => {
    setSending(true);
    try {
      await base44.integrations.Core.SendEmail({
        to: SUNNY_SONGBIRD_EMAIL,
        subject: `Weekly Gifter Summary - Week Ending ${format(new Date(selectedWeek), 'MMM d, yyyy')}`,
        body: formattedText
      });
      setSent(true);
      setTimeout(() => setSent(false), 3000);
    } catch (error) {
      alert('Failed to send email');
    }
    setSending(false);
  };

  const handleEditClick = (entry) => {
    setEditingEntry(entry.id);
    setEditForm({
      gifter_screen_name: entry.gifter_screen_name || '',
      gifter_phonetic: entry.gifter_phonetic || ''
    });
  };

  const handleSaveEdit = () => {
    updateEntryMutation.mutate({
      entryId: editingEntry,
      data: editForm
    });
  };

  const getRankIcon = (rank) => {
    switch (rank) {
      case '1st': return <Trophy className="w-5 h-5 text-yellow-500" />;
      case '2nd': return <Medal className="w-5 h-5 text-gray-400" />;
      case '3rd': return <Award className="w-5 h-5 text-amber-600" />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Weekly Summary</h1>
          <p className="text-gray-600 mt-1">Review and send thank-you song info to Sunny Songbird</p>
        </div>

        {/* Week Selector */}
        <Card>
          <CardContent className="p-4">
            <Label>Week Ending (Sunday)</Label>
            <Input
              type="date"
              value={selectedWeek}
              onChange={(e) => {
                setSelectedWeek(e.target.value);
                setAllGood(false);
              }}
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
            {/* Editable Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Music className="w-5 h-5 text-purple-600" />
                  Week Ending {format(new Date(selectedWeek), 'MMMM d, yyyy')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Gift</TableHead>
                      <TableHead>Place</TableHead>
                      <TableHead>Screen Name</TableHead>
                      <TableHead>Username</TableHead>
                      <TableHead>Phonetic</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedEntries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="font-medium">{entry.gift_name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {getRankIcon(entry.rank)}
                            <span>{entry.rank}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {editingEntry === entry.id ? (
                            <Input
                              value={editForm.gifter_screen_name}
                              onChange={(e) => setEditForm({ ...editForm, gifter_screen_name: e.target.value })}
                              className="h-8"
                            />
                          ) : (
                            entry.gifter_screen_name
                          )}
                        </TableCell>
                        <TableCell className="text-purple-600">@{entry.gifter_username}</TableCell>
                        <TableCell>
                          {editingEntry === entry.id ? (
                            <Input
                              value={editForm.gifter_phonetic}
                              onChange={(e) => setEditForm({ ...editForm, gifter_phonetic: e.target.value })}
                              placeholder="How to pronounce"
                              className="h-8"
                            />
                          ) : (
                            <span className="text-gray-600 italic">{entry.gifter_phonetic || '—'}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {editingEntry === entry.id ? (
                            <div className="flex gap-1">
                              <Button size="sm" onClick={handleSaveEdit} disabled={updateEntryMutation.isPending}>
                                Save
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => setEditingEntry(null)}>
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <Button size="sm" variant="ghost" onClick={() => handleEditClick(entry)}>
                              Edit
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Confirm All Good */}
            {!allGood ? (
              <Card className="border-2 border-dashed border-purple-300">
                <CardContent className="p-6 text-center">
                  <p className="text-gray-600 mb-4">Review the entries above and make any edits needed.</p>
                  <Button
                    onClick={() => setAllGood(true)}
                    className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    All Good - Ready to Share!
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="border-2 border-green-300 bg-green-50">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2 text-green-700">
                      <CheckCircle className="w-5 h-5" />
                      Ready to Share
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-white p-4 rounded-lg border font-mono text-sm whitespace-pre-wrap">
                      {formattedText}
                    </div>
                    
                    <div className="grid grid-cols-3 gap-3">
                      <Button
                        onClick={handleCopy}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        {copied ? 'Copied!' : 'Copy'}
                      </Button>
                      
                      <Button
                        onClick={handleSendToSunny}
                        disabled={sending || sent}
                        className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                      >
                        {sending ? (
                          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending...</>
                        ) : sent ? (
                          <><Check className="w-4 h-4 mr-2" /> Sent!</>
                        ) : (
                          <><Send className="w-4 h-4 mr-2" /> Send to Sunny</>
                        )}
                      </Button>
                      
                      <Button
                        onClick={handleDownload}
                        variant="outline"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
}