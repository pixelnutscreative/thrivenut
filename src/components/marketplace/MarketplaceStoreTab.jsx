import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tantml:react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ShoppingCart, Download, Heart, Sparkles } from 'lucide-react';

export default function MarketplaceStoreTab({ userEmail, primaryColor, accentColor }) {
  const queryClient = useQueryClient();
  const [selectedItem, setSelectedItem] = useState(null);

  // Fetch marketplace items (non-selected submissions that are approved for marketplace)
  const { data: marketplaceItems = [] } = useQuery({
    queryKey: ['marketplaceItems'],
    queryFn: () => base44.entities.ContentSubmission.filter({ 
      available_in_marketplace: true,
      approval_status: 'approved'
    }, '-created_date'),
  });

  const purchaseMutation = useMutation({
    mutationFn: async (submission) => {
      // TODO: Integrate Stripe payment
      // For now, just record the sale
      await base44.entities.ContentMarketplaceSale.create({
        submission_id: submission.id,
        creator_email: submission.creator_email,
        buyer_email: userEmail,
        sale_price: submission.marketplace_price,
        creator_payout: submission.marketplace_price * 0.95, // 95% to creator
        sale_date: new Date().toISOString(),
        payout_status: 'pending'
      });
      
      return submission.unwatermarked_image_url;
    },
    onSuccess: (downloadUrl) => {
      queryClient.invalidateQueries({ queryKey: ['marketplaceSales'] });
      window.open(downloadUrl, '_blank');
      setSelectedItem(null);
    },
  });

  return (
    <div className="space-y-4">
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
        🛍️ Designs that weren't selected are available here! Buy once, download immediately, and the creator gets paid monthly.
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {marketplaceItems.map(item => (
          <Card 
            key={item.id} 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setSelectedItem(item)}
          >
            <div className="aspect-square overflow-hidden">
              <img 
                src={item.image_url} 
                alt="" 
                className="w-full h-full object-cover hover:scale-105 transition-transform"
              />
            </div>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <Badge style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}>
                  ${item.marketplace_price || 5}
                </Badge>
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Heart className="w-3 h-3" />
                  {item.community_votes || 0}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {marketplaceItems.length === 0 && (
        <div className="text-center py-12">
          <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">No designs available in the store yet</p>
        </div>
      )}

      {/* Purchase Modal */}
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent>
          {selectedItem && (
            <>
              <DialogHeader>
                <DialogTitle>Purchase Design</DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <img 
                  src={selectedItem.image_url} 
                  alt="" 
                  className="w-full rounded-lg"
                />
                
                <div>
                  <p className="text-sm text-gray-600 mb-2">{selectedItem.description}</p>
                  <p className="text-xs text-gray-500">By {selectedItem.creator_name}</p>
                </div>

                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    💰 <strong>${selectedItem.marketplace_price || 5}</strong> - Download immediately after purchase!
                  </p>
                </div>

                <Button
                  onClick={() => purchaseMutation.mutate(selectedItem)}
                  disabled={purchaseMutation.isPending}
                  className="w-full text-white"
                  style={{ background: `linear-gradient(to right, ${primaryColor}, ${accentColor})` }}
                >
                  {purchaseMutation.isPending ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
                  ) : (
                    <><Download className="w-4 h-4 mr-2" /> Buy & Download Now</>
                  )}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}