import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Bell, Check, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LiveReminders() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    prefer_text: false,
    prefer_email: true
  });
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  // Check if user already signed up
  const { data: existingSignup } = useQuery({
    queryKey: ['liveReminderSignup', user?.email],
    queryFn: async () => {
      const signups = await base44.entities.LiveReminderSignup.filter({ created_by: user.email });
      return signups[0] || null;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (existingSignup) {
      setFormData({
        email: existingSignup.email || '',
        phone: existingSignup.phone || '',
        prefer_text: existingSignup.prefer_text || false,
        prefer_email: existingSignup.prefer_email !== false
      });
      setSubmitted(true);
    }
  }, [existingSignup]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (existingSignup) {
        return await base44.entities.LiveReminderSignup.update(existingSignup.id, data);
      }
      return await base44.entities.LiveReminderSignup.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['liveReminderSignup'] });
      setSubmitted(true);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Never Miss a Live!</h1>
          <p className="text-gray-600">Get notified when @pixelnutscreative goes live on TikTok</p>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-t-xl">
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Live Reminder Signup
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {submitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8"
              >
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">You're Signed Up!</h3>
                <p className="text-gray-600 mb-4">
                  You'll get notified before @pixelnutscreative goes live.
                </p>
                <Button
                  variant="outline"
                  onClick={() => setSubmitted(false)}
                >
                  Update My Info
                </Button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number (for text reminders)</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="(555) 123-4567"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>

                <div className="space-y-3">
                  <Label>How would you like to be notified?</Label>
                  <div className="flex flex-col gap-3">
                    <div 
                      className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                      onClick={() => setFormData({ ...formData, prefer_email: !formData.prefer_email })}
                    >
                      <Checkbox checked={formData.prefer_email} />
                      <span>Email me before lives</span>
                    </div>
                    <div 
                      className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                      onClick={() => setFormData({ ...formData, prefer_text: !formData.prefer_text })}
                    >
                      <Checkbox checked={formData.prefer_text} />
                      <span>Text me before lives</span>
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  disabled={saveMutation.isPending || (!formData.email && !formData.phone)}
                >
                  {saveMutation.isPending ? 'Saving...' : existingSignup ? 'Update My Info' : 'Sign Me Up!'}
                </Button>
              </form>
            )}

            <div className="mt-6 pt-6 border-t text-center">
              <a
                href="https://tiktok.com/@pixelnutscreative"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700"
              >
                <ExternalLink className="w-4 h-4" />
                Follow @pixelnutscreative on TikTok
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}