import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, RefreshCw, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function DailyAffirmation({ userName }) {
  const [affirmation, setAffirmation] = useState(null);
  const [loading, setLoading] = useState(true);

  const generateAffirmation = async () => {
    setLoading(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate a single, powerful daily affirmation for someone named ${userName || 'friend'}. 
        
The affirmation should be:
- Personal and warm (use "you" or their name)
- Uplifting and empowering
- Focused on self-worth, capability, or growth
- Between 1-2 sentences
- Suitable for someone who may struggle with self-care or mental health

Examples of good affirmations:
- "You are worthy of love and kindness, especially from yourself."
- "Every small step you take today matters. You're doing better than you think."
- "Your challenges do not define you. Your courage in facing them does."

Return only the affirmation text, nothing else.`,
      });

      setAffirmation(typeof response === 'string' ? response : response.affirmation || response);
    } catch (error) {
      console.error('Error generating affirmation:', error);
      setAffirmation("You are worthy of love, rest, and all good things. Take it one moment at a time. 💜");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generateAffirmation();
  }, [userName]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="shadow-lg border-0 bg-gradient-to-br from-purple-100 via-pink-100 to-amber-100 overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <h3 className="font-semibold text-purple-800">Today's Affirmation</h3>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              <p className="text-xl font-medium text-gray-800 leading-relaxed text-center italic">
                "{affirmation}"
              </p>
              <div className="flex justify-center">
                <Button
                  onClick={generateAffirmation}
                  variant="ghost"
                  size="sm"
                  className="text-purple-600 hover:text-purple-700"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  New Affirmation
                </Button>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}