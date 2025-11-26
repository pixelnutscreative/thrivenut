import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { shareGifterData } from '../components/gifter/useGifterSharing';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, Loader2, Sparkles, Check, X, Trophy, Medal, Award, ImageIcon, UserCheck, HelpCircle, Star, Plus } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { format, startOfWeek } from 'date-fns';
import { motion } from 'framer-motion';

export default function GiftScreenshotImport() {
  const queryClient = useQueryClient();
  const [selectedWeek, setSelectedWeek] = useState(format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd'));
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: preferences } = useQuery({
    queryKey: ['preferences', user?.email],
    queryFn: async () => {
      const prefs = await base44.entities.UserPreferences.filter({ user_email: user.email });
      return prefs[0] || null;
    },
    enabled: !!user,
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ['tiktokContacts', user?.email],
    queryFn: () => base44.entities.TikTokContact.filter({ created_by: user.email }, 'display_name'),
    enabled: !!user,
  });

  // Fetch ALL contacts across system for matching
  const { data: allContacts = [] } = useQuery({
    queryKey: ['allTiktokContacts'],
    queryFn: () => base44.entities.TikTokContact.list('username'),
  });

  const gifters = contacts.filter(c => c.is_gifter);

  // Gift library is shared across all users
  const { data: gifts = [] } = useQuery({
    queryKey: ['gifts'],
    queryFn: () => base44.entities.Gift.list('name'),
  });

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setError(null);
    setExtractedData(null);
    setUploading(true);
    setPreviewUrls([]);
    setCurrentImageIndex(0);

    try {
      // Show previews and upload all files
      const previews = [];
      const uploadedUrls = [];
      
      for (const file of files) {
        // Create preview
        const preview = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.readAsDataURL(file);
        });
        previews.push(preview);
        
        // Upload file
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        uploadedUrls.push(file_url);
      }
      
      setPreviewUrls(previews);
      setUploading(false);
      setAnalyzing(true);

      // Use AI to extract data from all screenshots
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze these TikTok gifting leaderboard screenshots and extract the top gifters.
        
Look for:
- Usernames (usually start with @)
- Display names / screen names
- Their placement (1st, 2nd, 3rd place)
- Any gift names visible

${files.length > 1 ? `There are ${files.length} images - combine the data from all of them, avoiding duplicates.` : ''}

Return the data in the specified JSON format. If you can't find certain information, leave it as null.
Extract up to 3 gifters (1st, 2nd, 3rd place).

IMPORTANT: For each username, also generate a "suggested_phonetic" field with how you think it would be pronounced naturally in English for a song. 
For example: "sheri_d_777" would be "Sheri D Seven Seven Seven", "craftymom_02" would be "Crafty Mom Oh Two", "123john" would be "One Two Three John".`,
        file_urls: uploadedUrls,
        response_json_schema: {
          type: "object",
          properties: {
            gifters: {
              type: "array",
              items: {
                type: "object",
                properties: {
                   rank: { type: "string", enum: ["1st", "2nd", "3rd"] },
                   username: { type: "string", description: "TikTok username without @" },
                   screen_name: { type: "string", description: "Display name shown" },
                   suggested_phonetic: { type: "string", description: "How the username/name would be pronounced for a song" },
                   gift_name: { type: "string", description: "Name of gift if visible" }
                 }
              }
            },
            confidence: { type: "string", enum: ["high", "medium", "low"] },
            notes: { type: "string", description: "Any notes about the extraction" }
          }
        }
      });

      // Enhance extracted data with matches from existing contacts
      const enhancedGifters = result.gifters?.map(gifter => {
        const username = gifter.username?.toLowerCase()?.replace('@', '');
        const screenName = gifter.screen_name?.toLowerCase();
        
        // Find matches in all contacts
        const exactMatch = allContacts.find(c => 
          c.username?.toLowerCase() === username
        );
        
        // Partial match on username or screen name
        const partialMatches = allContacts.filter(c => {
          if (!username && !screenName) return false;
          const cUsername = c.username?.toLowerCase() || '';
          const cDisplayName = c.display_name?.toLowerCase() || '';
          
          // Check if extracted username is contained in or contains the contact username
          const usernameMatch = username && (
            cUsername.includes(username) || username.includes(cUsername)
          );
          // Check screen name similarity
          const screenNameMatch = screenName && (
            cDisplayName.includes(screenName) || screenName.includes(cDisplayName)
          );
          
          return usernameMatch || screenNameMatch;
        }).slice(0, 3); // Limit to top 3 suggestions
        
        return {
          ...gifter,
          matched_contact: exactMatch || null,
          suggested_contacts: exactMatch ? [] : partialMatches,
          // Pre-fill from exact match, or use AI suggestion
          screen_name: exactMatch?.display_name || gifter.screen_name,
          phonetic: exactMatch?.phonetic || gifter.suggested_phonetic || '',
          username: exactMatch?.username || gifter.username,
          selected: true // Default to selected for import
        };
      }) || [];

      setExtractedData({ ...result, gifters: enhancedGifters });
      setAnalyzing(false);
    } catch (err) {
      console.error('Error processing screenshot:', err);
      setError('Failed to process screenshots. Please try again.');
      setUploading(false);
      setAnalyzing(false);
    }
  };

  const createEntriesMutation = useMutation({
    mutationFn: async (entries) => {
      const promises = entries.map(async (entry) => {
        // Find or create gifter
        let gifter = gifters.find(g => 
          g.username?.toLowerCase() === entry.username?.toLowerCase() ||
          g.screen_name?.toLowerCase() === entry.screen_name?.toLowerCase()
        );

        if (!gifter && entry.username) {
          gifter = await base44.entities.TikTokContact.create({
            username: entry.username,
            screen_name: entry.screen_name || entry.username,
            display_name: entry.screen_name || entry.username,
            phonetic: entry.phonetic || '',
            is_gifter: true
          });
        }

        if (!gifter) return null;

        // Find gift if specified
        let gift = entry.gift_name 
          ? gifts.find(g => g.name?.toLowerCase().includes(entry.gift_name?.toLowerCase()))
          : null;

        // Create entry
        return base44.entities.GiftingEntry.create({
          gifter_id: gifter.id,
          gifter_username: gifter.username,
          gifter_screen_name: gifter.screen_name,
          gifter_phonetic: gifter.phonetic,
          gift_id: gift?.id || '',
          gift_name: gift?.name || entry.gift_name || 'Unknown',
          rank: entry.rank,
          week: selectedWeek
        });
      });

      return Promise.all(promises.filter(Boolean));
    },
    onSuccess: async (results) => {
      queryClient.invalidateQueries({ queryKey: ['giftingEntries'] });
      queryClient.invalidateQueries({ queryKey: ['tiktokContacts'] });
      
      // Share the imported data
      const rankEmoji = { '1st': '🥇', '2nd': '🥈', '3rd': '🥉' };
      const importedList = results
        .filter(Boolean)
        .map(r => `${rankEmoji[r.rank] || '⭐'} ${r.gifter_screen_name} (@${r.gifter_username}) - ${r.gift_name}`)
        .join('\n');
      
      await shareGifterData(
        preferences,
        `📸 AI Screenshot Import - ${format(new Date(selectedWeek), 'MMM d, yyyy')}`,
        `Gifters imported from screenshot:\n\n${importedList}\n\n---\nFrom ThriveNut AI Screenshot Import`
      );
      
      setExtractedData(null);
      setPreviewUrls([]);
      setCurrentImageIndex(0);
    },
  });

  const handleConfirmImport = () => {
    const selectedGifters = extractedData?.gifters?.filter(g => g.selected);
    if (!selectedGifters?.length) return;
    createEntriesMutation.mutate(selectedGifters);
  };

  const updateExtractedGifter = (index, field, value) => {
    setExtractedData(prev => ({
      ...prev,
      gifters: prev.gifters.map((g, i) => 
        i === index ? { ...g, [field]: value } : g
      )
    }));
  };

  const removeExtractedGifter = (index) => {
    setExtractedData(prev => ({
      ...prev,
      gifters: prev.gifters.filter((_, i) => i !== index)
    }));
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
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-purple-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-purple-500" />
            AI Screenshot Import
          </h1>
          <p className="text-gray-600 mt-1">Upload your TikTok leaderboard screenshots and let AI extract the gifter data</p>
        </div>

        {/* Week Selector */}
        <Card>
          <CardContent className="p-4">
            <Label>Week to Import Into</Label>
            <Input
              type="date"
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(e.target.value)}
              className="mt-2 max-w-xs"
            />
          </CardContent>
        </Card>

        {/* Upload Area */}
        <Card className="border-2 border-dashed border-purple-300 bg-purple-50/50">
          <CardContent className="p-8">
            <div className="text-center">
              {previewUrls.length > 0 ? (
                <div className="space-y-4">
                  <div className="relative">
                    <img 
                      src={previewUrls[currentImageIndex]} 
                      alt={`Screenshot ${currentImageIndex + 1}`} 
                      className="max-h-64 mx-auto rounded-lg shadow-lg"
                    />
                    {previewUrls.length > 1 && (
                      <div className="flex items-center justify-center gap-2 mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentImageIndex(i => Math.max(0, i - 1))}
                          disabled={currentImageIndex === 0}
                        >
                          ←
                        </Button>
                        <span className="text-sm text-gray-600">
                          {currentImageIndex + 1} of {previewUrls.length}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentImageIndex(i => Math.min(previewUrls.length - 1, i + 1))}
                          disabled={currentImageIndex === previewUrls.length - 1}
                        >
                          →
                        </Button>
                      </div>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setPreviewUrls([]);
                      setCurrentImageIndex(0);
                      setExtractedData(null);
                    }}
                  >
                    Upload Different Images
                  </Button>
                </div>
              ) : (
                <>
                  <ImageIcon className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    Upload Leaderboard Screenshots
                  </h3>
                  <p className="text-gray-500 mb-4 text-sm">
                    Upload one or more screenshots of your TikTok gifting leaderboard
                  </p>
                  <label className="cursor-pointer">
                    <Input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Button asChild disabled={uploading || analyzing}>
                      <span className="bg-purple-600 hover:bg-purple-700">
                        {uploading ? (
                          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...</>
                        ) : (
                          <><Upload className="w-4 h-4 mr-2" /> Choose Screenshots</>
                        )}
                      </span>
                    </Button>
                  </label>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Analyzing State */}
        {analyzing && (
          <Card>
            <CardContent className="p-8 text-center">
              <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700">Analyzing Screenshot...</h3>
              <p className="text-gray-500 text-sm">AI is extracting gifter information</p>
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {error && (
          <Alert className="bg-red-50 border-red-200">
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {/* Extracted Data Review */}
        {extractedData && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-500" />
                Review Extracted Data
              </CardTitle>
              <CardDescription>
                {extractedData.confidence === 'high' ? '✅ High confidence' : 
                 extractedData.confidence === 'medium' ? '⚠️ Medium confidence - please verify' :
                 '❓ Low confidence - please check carefully'}
                {extractedData.notes && ` • ${extractedData.notes}`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {extractedData.gifters?.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No gifters detected in the screenshot</p>
              ) : (
                <>
                  {extractedData.gifters?.map((gifter, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`p-4 rounded-lg space-y-3 border-2 transition-all cursor-pointer ${
                        gifter.selected 
                          ? 'bg-teal-50 border-teal-400 shadow-md' 
                          : 'bg-white border-gray-200'
                      }`}
                      onClick={() => updateExtractedGifter(index, 'selected', !gifter.selected)}
                    >
                      <div className="flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
                        <div 
                          className="flex items-center gap-3 cursor-pointer" 
                          onClick={() => updateExtractedGifter(index, 'selected', !gifter.selected)}
                        >
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                            gifter.selected 
                              ? 'bg-teal-500 border-teal-500' 
                              : 'border-gray-300 bg-white'
                          }`}>
                            {gifter.selected && <Check className="w-4 h-4 text-white" />}
                          </div>
                          {gifter.is_shoutout ? (
                            <>
                              <Star className="w-5 h-5 text-amber-500" />
                              <span className="font-semibold text-amber-700">Special Shoutout</span>
                            </>
                          ) : (
                            <>
                              {getRankIcon(gifter.rank)}
                              <span className="font-semibold">{gifter.rank} Place</span>
                            </>
                          )}
                          {gifter.selected && (
                            <Badge className="bg-teal-100 text-teal-700 text-xs">Selected</Badge>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeExtractedGifter(index);
                          }}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      {/* Match status */}
                      {gifter.matched_contact && (
                        <div className="flex items-center gap-2 text-green-700 bg-green-50 p-2 rounded-lg text-sm">
                          <UserCheck className="w-4 h-4" />
                          <span>Matched to existing contact: <strong>@{gifter.matched_contact.username}</strong></span>
                          {gifter.matched_contact.phonetic && (
                            <Badge variant="secondary" className="text-xs">Has phonetic</Badge>
                          )}
                        </div>
                      )}
                      
                      {/* Suggestions if no exact match */}
                      {!gifter.matched_contact && gifter.suggested_contacts?.length > 0 && (
                        <div className="bg-amber-50 p-2 rounded-lg">
                          <div className="flex items-center gap-2 text-amber-700 text-sm mb-2">
                            <HelpCircle className="w-4 h-4" />
                            <span>Possible matches found:</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {gifter.suggested_contacts.map((suggestion, sIdx) => (
                              <Badge
                                key={sIdx}
                                variant="outline"
                                className="cursor-pointer hover:bg-amber-100 border-amber-300"
                                onClick={() => {
                                  updateExtractedGifter(index, 'username', suggestion.username);
                                  updateExtractedGifter(index, 'screen_name', suggestion.display_name || suggestion.username);
                                  if (suggestion.phonetic) {
                                    updateExtractedGifter(index, 'phonetic', suggestion.phonetic);
                                  }
                                  // Mark as matched
                                  setExtractedData(prev => ({
                                    ...prev,
                                    gifters: prev.gifters.map((g, i) => 
                                      i === index ? { ...g, matched_contact: suggestion, suggested_contacts: [] } : g
                                    )
                                  }));
                                }}
                              >
                                @{suggestion.username}
                                {suggestion.display_name && ` (${suggestion.display_name})`}
                                {suggestion.phonetic && ' 🎵'}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="grid md:grid-cols-4 gap-3">
                        <div>
                          <Label className="text-xs">Username</Label>
                          <Input
                            value={gifter.username || ''}
                            onChange={(e) => updateExtractedGifter(index, 'username', e.target.value)}
                            placeholder="@username"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Display Name</Label>
                          <Input
                            value={gifter.screen_name || ''}
                            onChange={(e) => updateExtractedGifter(index, 'screen_name', e.target.value)}
                            placeholder="Screen name"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Phonetic 🎵</Label>
                          <Input
                            value={gifter.phonetic || ''}
                            onChange={(e) => updateExtractedGifter(index, 'phonetic', e.target.value)}
                            placeholder="For songs"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Gift</Label>
                          <Input
                            value={gifter.gift_name || ''}
                            onChange={(e) => updateExtractedGifter(index, 'gift_name', e.target.value)}
                            placeholder="Gift name"
                          />
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  {/* Honorable Mention / Special Shoutout */}
                  <div className="border-t pt-4 mt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Star className="w-5 h-5 text-amber-500" />
                      <span className="font-semibold text-gray-700">Add Special Shoutout (Optional)</span>
                    </div>
                    <p className="text-sm text-gray-500 mb-3">
                      Honorable mention for someone who did something amazing this week
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setExtractedData(prev => ({
                          ...prev,
                          gifters: [...prev.gifters, {
                            rank: 'shoutout',
                            username: '',
                            screen_name: '',
                            phonetic: '',
                            gift_name: '',
                            selected: true,
                            is_shoutout: true
                          }]
                        }));
                      }}
                      className="border-amber-300 text-amber-700 hover:bg-amber-50"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Special Shoutout
                    </Button>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setExtractedData(null);
                        setPreviewUrls([]);
                        setCurrentImageIndex(0);
                      }}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleConfirmImport}
                      disabled={createEntriesMutation.isPending || !extractedData.gifters?.filter(g => g.selected).length}
                      className="flex-1 bg-purple-600 hover:bg-purple-700"
                    >
                      {createEntriesMutation.isPending ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Importing...</>
                      ) : (
                        <><Check className="w-4 h-4 mr-2" /> Import {extractedData.gifters?.filter(g => g.selected).length} Selected</>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Success Message */}
        {createEntriesMutation.isSuccess && (
          <Alert className="bg-green-50 border-green-200">
            <Check className="w-4 h-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Successfully imported gifters! They've been added to the week of {format(new Date(selectedWeek), 'MMM d, yyyy')}.
            </AlertDescription>
          </Alert>
        )}

        {/* Tips */}
        <Card className="bg-purple-50/50">
          <CardHeader>
            <CardTitle className="text-sm">Tips for Best Results</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-600 space-y-1">
            <p>• Take a clear screenshot of the leaderboard</p>
            <p>• Make sure usernames and rankings are visible</p>
            <p>• The AI works best with TikTok's standard leaderboard format</p>
            <p>• Always review the extracted data before importing</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}