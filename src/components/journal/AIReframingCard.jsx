import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Brain, Loader2, Heart, Lightbulb, RefreshCw, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AIReframingCard({ journalContent, onSaveSuggestions, onSaveReflection }) {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState(null);
  const [userReflection, setUserReflection] = useState('');
  const [showReflection, setShowReflection] = useState(false);

  const getAIReframing = async () => {
    if (!journalContent || journalContent.trim().length < 20) {
      return;
    }

    setLoading(true);
    
    const prompt = `You are a wise, funny, and deeply insightful therapeutic assistant. A user has shared their thoughts. Use NLP principles to help them process this.

User's journal entry:
"${journalContent}"

Your goal is to snap them out of a negative spiral with humor or profound insight, while being deeply supportive.

Please provide a response that includes:

1. **The Vibe Check (Validation)**: Validate them, but make it real. Maybe a bit funny if appropriate, or deeply empathetic. "I hear you, and honestly, that sounds rough."

2. **Perspective Shift (Questions)**: Ask 2-3 NLP-style questions to break the pattern:
   - "Is this thought actually true, or is it just loud?"
   - "If you were watching a movie of your life right now, what would you yell at the screen?"
   - "What happens if you just... drop the rope?"

3. **The Reframe**: Flip the script. Show them how this situation might actually be a hidden blessing, a lesson, or just a ridiculous cosmic joke.

4. **The Forgiveness Protocol**: If this involves another person, remind them: Forgiving isn't for the other person. It's so YOU stop drinking poison and expecting THEM to die. Help them see that holding onto this hurt is only hurting *them*. Suggest they mentally distance themselves from the source of pain if they can't physically leave. "Bless them and release them (way over there)."

5. **One Actionable Step**: Something small they can do right now to cope, heal, or just laugh.

Keep the tone authentic, maybe a little sassy if it fits, but always loving. No generic "I understand you feel sad" robot speak. Be a best friend who happens to be a therapist.`;

    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            validation: { type: "string" },
            perspective_questions: { 
              type: "array", 
              items: { type: "string" } 
            },
            reframing: { type: "string" },
            forgiveness_note: { type: "string" },
            actionable_step: { type: "string" }
          }
        }
      });

      setSuggestions(response);
      if (onSaveSuggestions) {
        onSaveSuggestions(JSON.stringify(response));
      }
    } catch (error) {
      console.error('Error getting AI suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveReflection = () => {
    if (onSaveReflection && userReflection.trim()) {
      onSaveReflection(userReflection);
      setShowReflection(false);
    }
  };

  return (
    <Card className="shadow-lg border-0 bg-gradient-to-br from-indigo-50 to-purple-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Brain className="w-5 h-5 text-indigo-600" />
          Therapeutic Reframing
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Disclaimer */}
        <Alert className="bg-amber-50 border-amber-200">
          <Shield className="w-4 h-4 text-amber-600" />
          <AlertDescription className="text-sm text-amber-800">
            This AI provides supportive suggestions, not professional mental health advice. 
            If you're in crisis, please reach out to a mental health professional or crisis hotline.
          </AlertDescription>
        </Alert>

        {!suggestions && !loading && (
          <div className="text-center py-4">
            <p className="text-gray-600 mb-4">
              Would you like some gentle perspective and reframing suggestions for what you've written?
            </p>
            <Button
              onClick={getAIReframing}
              disabled={!journalContent || journalContent.trim().length < 20}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <Lightbulb className="w-4 h-4 mr-2" />
              Get Supportive Insights
            </Button>
            {(!journalContent || journalContent.trim().length < 20) && (
              <p className="text-sm text-gray-500 mt-2">
                Write a bit more in your journal first (at least 20 characters)
              </p>
            )}
          </div>
        )}

        {loading && (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600 mb-3" />
            <p className="text-gray-600">Generating thoughtful suggestions...</p>
          </div>
        )}

        <AnimatePresence>
          {suggestions && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Validation */}
              <div className="p-4 bg-white rounded-lg shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Heart className="w-4 h-4 text-pink-500" />
                  <h4 className="font-semibold text-gray-800">First, know this...</h4>
                </div>
                <p className="text-gray-700">{suggestions.validation}</p>
              </div>

              {/* Perspective Questions */}
              <div className="p-4 bg-white rounded-lg shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                  <h4 className="font-semibold text-gray-800">Some questions to consider...</h4>
                </div>
                <ul className="space-y-2">
                  {suggestions.perspective_questions?.map((q, i) => (
                    <li key={i} className="text-gray-700 flex items-start gap-2">
                      <span className="text-indigo-500 font-bold">•</span>
                      {q}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Reframing */}
              <div className="p-4 bg-white rounded-lg shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <RefreshCw className="w-4 h-4 text-green-500" />
                  <h4 className="font-semibold text-gray-800">Another way to see this...</h4>
                </div>
                <p className="text-gray-700">{suggestions.reframing}</p>
              </div>

              {/* Forgiveness Note (if provided) */}
              {suggestions.forgiveness_note && suggestions.forgiveness_note.trim() && (
                <div className="p-4 bg-white rounded-lg shadow-sm border-l-4 border-purple-400">
                  <div className="flex items-center gap-2 mb-2">
                    <Heart className="w-4 h-4 text-purple-500" />
                    <h4 className="font-semibold text-gray-800">On letting go...</h4>
                  </div>
                  <p className="text-gray-700">{suggestions.forgiveness_note}</p>
                </div>
              )}

              {/* Actionable Step */}
              <div className="p-4 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">✨</span>
                  <h4 className="font-semibold text-gray-800">One small step you can take...</h4>
                </div>
                <p className="text-gray-700">{suggestions.actionable_step}</p>
              </div>

              {/* User Reflection */}
              {!showReflection ? (
                <Button
                  onClick={() => setShowReflection(true)}
                  variant="outline"
                  className="w-full"
                >
                  Add My Reflection
                </Button>
              ) : (
                <div className="space-y-3">
                  <Textarea
                    placeholder="After reading these suggestions, how do you feel now? What shifted for you?"
                    value={userReflection}
                    onChange={(e) => setUserReflection(e.target.value)}
                    rows={4}
                  />
                  <Button
                    onClick={handleSaveReflection}
                    disabled={!userReflection.trim()}
                    className="w-full bg-indigo-600 hover:bg-indigo-700"
                  >
                    Save My Reflection
                  </Button>
                </div>
              )}

              {/* Try Again */}
              <Button
                onClick={() => {
                  setSuggestions(null);
                  setUserReflection('');
                  setShowReflection(false);
                }}
                variant="ghost"
                size="sm"
                className="w-full text-gray-500"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Get Different Suggestions
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}