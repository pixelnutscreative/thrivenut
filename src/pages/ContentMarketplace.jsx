import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Plus, Briefcase, Package, ShoppingBag, Sparkles, Loader2, Clock, DollarSign } from 'lucide-react';
import { useTheme } from '../components/shared/useTheme';
import { getEffectiveUserEmail } from '../components/admin/ImpersonationBanner';
import RequestContentModal from '../components/marketplace/RequestContentModal';
import MyRequestsTab from '../components/marketplace/MyRequestsTab';
import SubmitDesignModal from '../components/marketplace/SubmitDesignModal';
import MarketplaceStoreTab from '../components/marketplace/MarketplaceStoreTab';

export default function ContentMarketplace() {
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const { bgClass, textClass, subtextClass, primaryColor, accentColor, user, effectiveEmail, preferences, isLoading } = useTheme();

  // Check if user has AI tools access
  const hasAIAccess = preferences?.ai_platform === 'pixels_toolbox' || 
                      preferences?.ai_platform === 'lets_go_nuts' ||
                      preferences?.has_nuts_and_bots;

  // Fetch open requests
  const { data: openRequests = [] } = useQuery({
    queryKey: ['openContentRequests'],
    queryFn: () => base44.entities.ContentRequest.filter({ status: 'open' }, '-created_date'),
  });

  // Fetch my requests
  const { data: myRequests = [] } = useQuery({
    queryKey: ['myContentRequests', effectiveEmail],
    queryFn: () => base44.entities.ContentRequest.filter({ requester_email: effectiveEmail }, '-created_date'),
    enabled: !!effectiveEmail,
  });

  if (isLoading) {
    return (
      <div className={`min-h-screen ${bgClass} flex items-center justify-center`}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: primaryColor }} />
      </div>
    );
  }

  const gradientStyle = { background: `linear-gradient(to right, ${primaryColor}, ${accentColor})` };

  return (
    <div className={`min-h-screen ${bgClass} p-4 md:p-8`}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className={`text-3xl font-bold ${textClass} flex items-center gap-2`}>
              <Briefcase className="w-8 h-8" style={{ color: primaryColor }} />
              Content Marketplace
            </h1>
            <p className={`${subtextClass} mt-1`}>
              Request custom content or earn by creating for the community
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowRequestModal(true)}
              className="text-white"
              style={gradientStyle}
            >
              <Plus className="w-4 h-4 mr-2" />
              Request Content
            </Button>
            {hasAIAccess && (
              <Button
                onClick={() => setShowSubmitModal(true)}
                variant="outline"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Submit Design
              </Button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg" style={{ backgroundColor: `${primaryColor}20` }}>
                  <Clock className="w-6 h-6" style={{ color: primaryColor }} />
                </div>
                <div>
                  <p className={`text-2xl font-bold ${textClass}`}>{openRequests.length}</p>
                  <p className={`text-sm ${subtextClass}`}>Open Requests</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg" style={{ backgroundColor: `${accentColor}20` }}>
                  <DollarSign className="w-6 h-6" style={{ color: accentColor }} />
                </div>
                <div>
                  <p className={`text-2xl font-bold ${textClass}`}>
                    ${openRequests.reduce((sum, r) => sum + (r.budget || 0), 0)}
                  </p>
                  <p className={`text-sm ${subtextClass}`}>Total Bounty</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-green-100">
                  <Package className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className={`text-2xl font-bold ${textClass}`}>{myRequests.length}</p>
                  <p className={`text-sm ${subtextClass}`}>My Requests</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="browse" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="browse">
              <Briefcase className="w-4 h-4 mr-2" />
              Browse Requests
            </TabsTrigger>
            <TabsTrigger value="my-requests">
              <Package className="w-4 h-4 mr-2" />
              My Requests
            </TabsTrigger>
            <TabsTrigger value="store">
              <ShoppingBag className="w-4 h-4 mr-2" />
              Design Store
            </TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="space-y-4 mt-6">
            {!hasAIAccess && (
              <Card className="bg-amber-50 border-amber-200">
                <CardContent className="pt-6">
                  <p className="text-amber-800 text-sm">
                    ℹ️ You need Pixel's AI Toolbox or Let's Go Nuts access to submit designs and earn money!
                  </p>
                </CardContent>
              </Card>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              {openRequests.map(request => (
                <Card key={request.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{request.title}</CardTitle>
                        <p className={`text-sm ${subtextClass} mt-1`}>{request.description}</p>
                      </div>
                      <Badge style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}>
                        ${request.budget}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {request.duration_days || Math.floor(request.duration_hours / 24) || 1}d
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {request.request_type?.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedRequest(request);
                          setShowSubmitModal(true);
                        }}
                        disabled={!hasAIAccess}
                      >
                        Submit Design
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {openRequests.length === 0 && (
              <div className="text-center py-12">
                <Briefcase className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className={subtextClass}>No open requests yet. Be the first to post one!</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="my-requests" className="mt-6">
            <MyRequestsTab 
              userEmail={effectiveEmail}
              primaryColor={primaryColor}
              accentColor={accentColor}
            />
          </TabsContent>

          <TabsContent value="store" className="mt-6">
            <MarketplaceStoreTab
              userEmail={effectiveEmail}
              primaryColor={primaryColor}
              accentColor={accentColor}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Modals */}
      <RequestContentModal
        isOpen={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        userEmail={effectiveEmail}
        primaryColor={primaryColor}
        accentColor={accentColor}
      />

      <SubmitDesignModal
        isOpen={showSubmitModal}
        onClose={() => {
          setShowSubmitModal(false);
          setSelectedRequest(null);
        }}
        request={selectedRequest}
        userEmail={effectiveEmail}
        userName={user?.full_name}
        primaryColor={primaryColor}
        accentColor={accentColor}
      />
    </div>
  );
}