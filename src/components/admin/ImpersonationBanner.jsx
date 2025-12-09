import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, X } from 'lucide-react';

export default function ImpersonationBanner() {
  const impersonating = sessionStorage.getItem('impersonating');
  
  if (!impersonating) return null;

  const stopImpersonation = () => {
    sessionStorage.removeItem('impersonating');
    sessionStorage.removeItem('impersonatingStarted');
    window.location.reload();
  };

  // Extract username from identifier
  const displayName = impersonating?.startsWith('managed_') 
    ? `@${impersonating.replace('managed_', '').replace('@thrivenut.app', '')}`
    : (impersonating || '');

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2 flex items-center justify-center gap-4 shadow-lg">
      <AlertTriangle className="w-5 h-5" />
      <span className="font-medium">
        Admin Mode: Acting as <strong>{displayName}</strong>
      </span>
      <Button
        size="sm"
        variant="secondary"
        onClick={stopImpersonation}
        className="bg-white/20 hover:bg-white/30 text-white border-0"
      >
        <X className="w-4 h-4 mr-1" />
        Stop Impersonating
      </Button>
    </div>
  );
}

// Helper to get the current "user" identifier (real or impersonated)
export function getEffectiveUserEmail(realUserEmail) {
  // CRITICAL: Always validate and ensure string before any operations
  if (!realUserEmail || typeof realUserEmail !== 'string' || !realUserEmail.trim()) {
    console.warn('getEffectiveUserEmail called with invalid email:', realUserEmail);
    return null;
  }
  
  if (typeof window === 'undefined' || typeof sessionStorage === 'undefined') {
    return realUserEmail.trim();
  }
  
  try {
    const impersonating = sessionStorage.getItem('impersonating');
    if (impersonating && typeof impersonating === 'string' && impersonating.trim()) {
      return impersonating.trim();
    }
    return realUserEmail.trim();
  } catch (error) {
    console.error('Error in getEffectiveUserEmail:', error);
    return realUserEmail.trim();
  }
}

// Check if currently impersonating
export function isImpersonating() {
  if (typeof window === 'undefined' || typeof sessionStorage === 'undefined') {
    return false;
  }
  try {
    return !!sessionStorage.getItem('impersonating');
  } catch {
    return false;
  }
}