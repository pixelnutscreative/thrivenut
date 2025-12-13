import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Clock, Users, Crown, Heart, Loader2, Download, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function MyRequestsTab({ userEmail, primaryColor, accentColor }) {
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [viewingSubmissions, setViewingSubmissions] = useState(null);

  const { data: myRequests = [] } = useQuery({
    queryKey: ['myContentRequests', userEmail],
    queryFn: () => base44.entities.ContentRequest.filter({ requester_email: userEmail }, '-created_date'),
    enabled: !!userEmail,
  });

  const { data: submissions = [] } = useQuery({
    queryKey: ['requestSubmissions', viewingSubmissions?.id],
    queryFn: () => base44.entities.ContentSubmission.filter({ request_id: viewingSubmissions.id }, '-created_date'),
    enabled: !!viewingSubmissions,
  });

  const selectWinnerMutation = useMutation({
    mutationFn: async ({ requestId, submissionId }) => {
      // Mark submission as selected
      await base44.entities.ContentSubmission.update(submissionId, { is_selected: true });
      // Update request status
      await base44.entities.ContentRequest.update(requestId, { 
        status: 'completed',
        selected_submission_id: submissionId,
        payment_status: 'released_to_creator'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myContentRequests'] });
      queryClient.invalidateQueries({ queryKey: ['requestSubmissions'] });
      setViewingSubmissions(null);
    },
  });

  const voteMutation = useMutation({
    mutationFn: async (submissionId) => {
      const submission = submissions.find(s => s.id === submissionId);
      const hasVoted = submission.voted_by?.includes(userEmail);
      
      if (hasVoted) {
        // Remove vote
        await base44.entities.ContentSubmission.update(submissionId, {
          community_votes: (submission.community_votes || 0) - 1,
          voted_by: submission.voted_by.filter(email => email !== userEmail)
        });
      } else {
        // Add vote
        await base44.entities.ContentSubmission.update(submissionId, {
          community_votes: (submission.community_votes || 0) + 1,
          voted_by: [...(submission.voted_by || []), userEmail]
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requestSubmissions'] });
    },
  });

  return (
    <div className="space-y-4">
      {myRequests.map(request => {
        const isComplete = request.status === 'completed';
        const submissionCount = submissions.filter(s => s.request_id === request.id).length;
        
        return (
          <Card key={request.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{request.title}</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">{request.description}</p>
                </div>
                <Badge 
                  className={isComplete ? 'bg-green-100 text-green-700' : ''}
                  style={!isComplete ? { backgroundColor: `${primaryColor}20`, color: primaryColor } : {}}
                >
                  {request.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {request.duration_hours}h
                  </span>
                  <span className="font-semibold text-green-600">${request.budget}</span>
                  {request.deadline && (
                    <span className="text-xs">
                      Deadline: {format(new Date(request.deadline), 'MMM d, h:mm a')}
                    </span>
                  )}
                </div>
                <Button
                  size="sm"
                  onClick={() => setViewingSubmissions(request)}
                  variant="outline"
                >
                  <Users className="w-4 h-4 mr-1" />
                  View Submissions ({submissionCount})
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {myRequests.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">You haven't requested any content yet</p>
        </div>
      )}

      {/* Submissions Viewer */}
      <Dialog open={!!viewingSubmissions} onOpenChange={() => setViewingSubmissions(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review Submissions</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold">{viewingSubmissions?.title}</h3>
              <p className="text-sm text-gray-600 mt-1">{viewingSubmissions?.description}</p>
            </div>

            {submissions.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500">No submissions yet</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {submissions.map(submission => {
                  const hasVoted = submission.voted_by?.includes(userEmail);
                  
                  return (
                    <Card key={submission.id} className={submission.is_selected ? 'border-2 border-green-500' : ''}>
                      <CardContent className="pt-4">
                        <div className="space-y-3">
                          <img 
                            src={submission.image_url} 
                            alt="Submission" 
                            className="w-full rounded-lg"
                          />
                          
                          <div>
                            <p className="text-sm text-gray-600">{submission.description}</p>
                            <p className="text-xs text-gray-500 mt-1">By {submission.creator_name}</p>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant={hasVoted ? 'default' : 'outline'}
                              onClick={() => voteMutation.mutate(submission.id)}
                              disabled={voteMutation.isPending}
                            >
                              <Heart className={`w-4 h-4 mr-1 ${hasVoted ? 'fill-current' : ''}`} />
                              {submission.community_votes || 0}
                            </Button>

                            {!submission.is_selected && viewingSubmissions.status === 'open' && (
                              <Button
                                size="sm"
                                onClick={() => selectWinnerMutation.mutate({ 
                                  requestId: viewingSubmissions.id, 
                                  submissionId: submission.id 
                                })}
                                disabled={selectWinnerMutation.isPending}
                                className="text-white"
                                style={{ background: `linear-gradient(to right, ${primaryColor}, ${accentColor})` }}
                              >
                                <Crown className="w-4 h-4 mr-1" />
                                Select Winner
                              </Button>
                            )}

                            {submission.is_selected && (
                              <>
                                <Badge className="bg-green-100 text-green-700">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Winner!
                                </Badge>
                                <Button
                                  size="sm"
                                  onClick={() => window.open(submission.unwatermarked_image_url, '_blank')}
                                >
                                  <Download className="w-4 h-4 mr-1" />
                                  Download
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}