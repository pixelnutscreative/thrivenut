import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Loader2, CheckCircle, Clock, XCircle, Send, Phone } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SuperFanAccess() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [tiktokUsername, setTiktokUsername] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState('');

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

  const { data: existingRequest } = useQuery({
    queryKey: ['superfanRequest', user?.email],
    queryFn: async () => {
      const requests = await base44.entities.SuperFanRequest.filter({ user_email: user.email }, '-created_date');
      return requests[0] || null;
    },
    enabled: !!user,
  });

  const submitRequestMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.entities.SuperFanRequest.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['superfanRequest'] });
      setScreenshotUrl('');
      setTiktokUsername('');
    },
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setScreenshotUrl(file_url);
    } catch (error) {
      alert('Failed to upload screenshot');
    }
    setUploading(false);
  };

  const handleSubmit = () => {
    if (!screenshotUrl || !tiktokUsername) {
      alert('Please upload a screenshot and enter your TikTok username');
      return;
    }

    submitRequestMutation.mutate({
      user_email: user.email,
      tiktok_username: tiktokUsername.replace('@', ''),
      screenshot_url: screenshotUrl,
      status: 'pending'
    });
  };

  // If already approved
  if (preferences?.tiktok_access_approved) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-teal-50 to-blue-50 p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          <Card className="border-2 border-green-300">
            <CardContent className="p-8 text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-green-700 mb-2">TikTok Features Unlocked!</h1>
              <p className="text-gray-600">You have full access to all TikTok features.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-800">Unlock TikTok Features</h1>
          <p className="text-gray-600 mt-2">Become a SuperFan to access TikTok tools!</p>
        </div>

        {/* Instructions */}
        <Card className="bg-gradient-to-r from-purple-100 to-pink-100 border-purple-200">
          <CardContent className="p-6">
            <h2 className="font-bold text-lg text-purple-800 mb-3">How to Get Access</h2>
            <ol className="list-decimal list-inside space-y-2 text-purple-700">
              <li>Subscribe to become a SuperFan on @PixelNutsCreative's TikTok</li>
              <li>Take a screenshot showing your active SuperFan status</li>
              <li>Upload the screenshot below</li>
              <li>Wait for approval (usually within 24 hours)</li>
            </ol>
            
            <div className="mt-4 p-3 bg-white/50 rounded-lg">
              <p className="text-sm text-purple-600 flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Questions? Text me at <strong>949.762.8878</strong>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Request Status */}
        {existingRequest && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className={`border-2 ${
              existingRequest.status === 'pending' ? 'border-amber-300 bg-amber-50' :
              existingRequest.status === 'approved' ? 'border-green-300 bg-green-50' :
              'border-red-300 bg-red-50'
            }`}>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  {existingRequest.status === 'pending' && <Clock className="w-8 h-8 text-amber-500" />}
                  {existingRequest.status === 'approved' && <CheckCircle className="w-8 h-8 text-green-500" />}
                  {existingRequest.status === 'denied' && <XCircle className="w-8 h-8 text-red-500" />}
                  
                  <div className="flex-1">
                    <h3 className="font-bold text-lg">
                      {existingRequest.status === 'pending' && 'Request Pending'}
                      {existingRequest.status === 'approved' && 'Request Approved!'}
                      {existingRequest.status === 'denied' && 'Request Denied'}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {existingRequest.status === 'pending' && "We're reviewing your SuperFan screenshot. Check back soon!"}
                      {existingRequest.status === 'approved' && 'Your TikTok features are now unlocked!'}
                      {existingRequest.status === 'denied' && (existingRequest.admin_notes || 'Please submit a valid SuperFan screenshot.')}
                    </p>
                  </div>
                  
                  {existingRequest.screenshot_url && (
                    <img 
                      src={existingRequest.screenshot_url} 
                      alt="Your screenshot" 
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Submit New Request */}
        {(!existingRequest || existingRequest.status === 'denied') && (
          <Card>
            <CardHeader>
              <CardTitle>Submit SuperFan Proof</CardTitle>
              <CardDescription>Upload a screenshot showing your active SuperFan subscription</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Your TikTok Username</Label>
                <Input
                  placeholder="@username"
                  value={tiktokUsername}
                  onChange={(e) => setTiktokUsername(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>SuperFan Screenshot</Label>
                <div 
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-400 transition-colors cursor-pointer"
                  onClick={() => document.getElementById('screenshot-upload').click()}
                >
                  {uploading ? (
                    <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto" />
                  ) : screenshotUrl ? (
                    <div className="space-y-2">
                      <img src={screenshotUrl} alt="Screenshot preview" className="max-h-48 mx-auto rounded-lg" />
                      <p className="text-sm text-green-600">Screenshot uploaded! Click to change.</p>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600">Click to upload screenshot</p>
                      <p className="text-xs text-gray-400">PNG, JPG up to 10MB</p>
                    </>
                  )}
                </div>
                <input
                  id="screenshot-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

              <Button
                onClick={handleSubmit}
                disabled={!screenshotUrl || !tiktokUsername || submitRequestMutation.isPending}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                {submitRequestMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                Submit for Review
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}