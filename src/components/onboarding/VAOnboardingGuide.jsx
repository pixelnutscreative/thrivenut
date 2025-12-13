import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, Lock, FileEdit, CheckCircle2 } from 'lucide-react';

export default function VAOnboardingGuide({ isOpen, onClose }) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            VA / MOD Permissions Guide
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Permissions Overview */}
          <div>
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              What VAs Can Do
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <p>View all Content Cards and Campaign Timelines</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <p>Complete workflow checklists and add assets</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <p>Edit Content Cards they are assigned to</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <p>Use Batch Mode for efficient processing</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-600">✓</span>
                <p>Launch tools and work on content creation</p>
              </div>
            </div>
          </div>

          {/* Lock Behavior */}
          <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-600" />
              Understanding Locks
            </h3>
            <div className="space-y-2 text-sm text-gray-700">
              <p><strong>Script Lock:</strong> When enabled, VAs cannot edit scripts or captions (read-only)</p>
              <p><strong>Assets Lock:</strong> When enabled, VAs cannot add/remove assets</p>
              <p><strong>Edit Lock:</strong> When enabled, the entire Content Card becomes view-only</p>
              <p className="text-amber-700 mt-2">💡 Locks protect finalized content while still allowing workflow progress</p>
            </div>
          </div>

          {/* Change Request Process */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <FileEdit className="w-4 h-4 text-blue-600" />
              Change Request Process
            </h3>
            <div className="space-y-2 text-sm text-gray-700">
              <p>When content is locked, VAs can still request changes by:</p>
              <ol className="list-decimal list-inside space-y-1 ml-2 mt-2">
                <li>Clicking "Request Change" button</li>
                <li>Describing the needed changes</li>
                <li>Submitting for Owner/Admin review</li>
                <li>Receiving approval or feedback</li>
              </ol>
              <p className="text-blue-700 mt-2">💡 This ensures controlled editing without blocking workflow</p>
            </div>
          </div>

          {/* Campaign Timeline Access */}
          <div>
            <h3 className="font-semibold text-sm mb-2">Campaign Timeline Access</h3>
            <p className="text-sm text-gray-600">
              VAs have <Badge variant="outline">Read-Only</Badge> access to Campaign Timelines. 
              They can view phase organization and click to open Content Cards, but cannot modify campaign structure.
            </p>
          </div>

          <Button onClick={onClose} className="w-full">
            Got It
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}