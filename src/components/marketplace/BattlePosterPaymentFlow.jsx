import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Upload, Copy, CheckCircle, Loader2, AlertCircle, DollarSign } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';

export default function BattlePosterPaymentFlow({ 
  request, 
  winnerSubmission,
  onClose 
}) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState('payment_details'); // payment_details, proof_upload, completed
  const [proofFile, setProofFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [paymentProofUrl, setPaymentProofUrl] = useState(null);

  const uploadProofMutation = useMutation({
    mutationFn: async (file) => {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      return file_url;
    },
    onSuccess: (url) => {
      setPaymentProofUrl(url);
      submitPaymentProofMutation.mutate(url);
    }
  });

  const submitPaymentProofMutation = useMutation({
    mutationFn: async (proofUrl) => {
      // Update request with payment proof and mark as completed
      await base44.entities.ContentRequest.update(request.id, {
        payment_proof_url: proofUrl,
        payment_verified_date: new Date().toISOString(),
        fulfillment_status: 'completed',
        payment_status: 'released_to_creator'
      });

      // Update submission to winner status
      await base44.entities.ContentSubmission.update(winnerSubmission.id, {
        status: 'winner'
      });

      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contentRequests'] });
      queryClient.invalidateQueries({ queryKey: ['contentSubmissions'] });
      setStep('completed');
    }
  });

  const handleProofUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setProofFile(file);
    setUploading(true);
    uploadProofMutation.mutate(file);
  };

  const copyPayPalEmail = () => {
    navigator.clipboard.writeText(request.creator_paypal_email);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>🎨 Complete Payment for Winning Design</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {step === 'payment_details' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Amount to Pay:</p>
                      <p className="text-3xl font-bold text-blue-600">${request.final_price}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Creator's PayPal Email:</p>
                      <div className="flex gap-2 items-center bg-white p-3 rounded border border-blue-200">
                        <code className="flex-1 text-sm font-mono break-all">
                          {request.creator_paypal_email}
                        </code>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={copyPayPalEmail}
                          className="text-blue-600 hover:bg-blue-100"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 p-3 rounded text-sm text-amber-800">
                      <p className="font-semibold mb-1">📤 Next Steps:</p>
                      <ol className="list-decimal list-inside space-y-1 text-xs">
                        <li>Send ${request.final_price} via PayPal to the email above</li>
                        <li>Take a screenshot of your payment confirmation</li>
                        <li>Upload the screenshot below</li>
                      </ol>
                    </div>

                    <Button
                      onClick={() => setStep('proof_upload')}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      I've Sent the Payment →
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === 'proof_upload' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <Card className="bg-green-50 border-green-200">
                <CardContent className="pt-6 space-y-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 mb-2">
                      Upload Payment Proof Screenshot
                    </p>
                    <p className="text-xs text-gray-600 mb-4">
                      Show the PayPal confirmation email or transaction receipt
                    </p>
                  </div>

                  {paymentProofUrl ? (
                    <div className="bg-white p-3 rounded border border-green-200">
                      <div className="flex items-center gap-2 text-green-700">
                        <CheckCircle className="w-5 h-5" />
                        <span className="text-sm font-medium">Screenshot uploaded</span>
                      </div>
                      <img 
                        src={paymentProofUrl} 
                        alt="Payment proof" 
                        className="mt-3 max-h-40 rounded"
                      />
                    </div>
                  ) : (
                    <label className="block">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleProofUpload}
                        disabled={uploading}
                        className="hidden"
                      />
                      <div className="border-2 border-dashed border-green-300 rounded-lg p-6 text-center hover:border-green-400 cursor-pointer transition-colors">
                        {uploading ? (
                          <div className="flex flex-col items-center gap-2">
                            <Loader2 className="w-6 h-6 text-green-600 animate-spin" />
                            <p className="text-sm text-green-700">Uploading...</p>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2">
                            <Upload className="w-6 h-6 text-green-600" />
                            <p className="text-sm font-medium text-gray-900">Click to upload screenshot</p>
                            <p className="text-xs text-gray-500">PNG, JPG up to 10MB</p>
                          </div>
                        )}
                      </div>
                    </label>
                  )}

                  {submitPaymentProofMutation.isPending && (
                    <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-3 rounded">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Verifying payment...</span>
                    </div>
                  )}

                  <Button
                    onClick={() => setStep('completed')}
                    disabled={!paymentProofUrl || submitPaymentProofMutation.isPending}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    {submitPaymentProofMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Confirm & Complete'
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === 'completed' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-4"
            >
              <div className="text-center py-6">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Payment Complete! 🎉</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Your final artwork is ready to download and use in your battle.
                </p>
              </div>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Your Artwork Files</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {winnerSubmission.additional_files && winnerSubmission.additional_files.length > 0 ? (
                    <div className="space-y-2">
                      {winnerSubmission.additional_files.map((file, idx) => (
                        <a
                          key={idx}
                          href={file.file_url}
                          download
                          className="block p-2 bg-gray-100 hover:bg-gray-200 rounded text-sm text-blue-600 truncate"
                        >
                          📥 {file.file_type}
                        </a>
                      ))}
                    </div>
                  ) : (
                    <a
                      href={winnerSubmission.unwatermarked_image_url}
                      download
                      className="block p-2 bg-gray-100 hover:bg-gray-200 rounded text-sm text-blue-600 truncate"
                    >
                      📥 Download Artwork
                    </a>
                  )}
                </CardContent>
              </Card>

              <Button
                onClick={onClose}
                className="w-full"
              >
                Done
              </Button>
            </motion.div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}