import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Twitter, Facebook, Linkedin, Mail, Copy, Smartphone, Link as LinkIcon, Check } from 'lucide-react';

export default function ShareDialog({ open, onOpenChange, item }) {
  const [copied, setCopied] = useState(false);
  const [copiedContent, setCopiedContent] = useState(false);

  if (!item) return null;

  const shareUrl = item.link || window.location.href;
  const shareText = `Check out this ${item.type}: ${item.title}`;
  const fullContent = `${item.title}\n\n${item.content || item.description || ''}\n\n${shareUrl}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyContent = () => {
    navigator.clipboard.writeText(fullContent);
    setCopiedContent(true);
    setTimeout(() => setCopiedContent(false), 2000);
  };

  const socialLinks = [
    { 
      name: 'Twitter', 
      icon: Twitter, 
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
      color: 'bg-sky-500 hover:bg-sky-600 text-white'
    },
    { 
      name: 'Facebook', 
      icon: Facebook, 
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      color: 'bg-blue-600 hover:bg-blue-700 text-white'
    },
    { 
      name: 'LinkedIn', 
      icon: Linkedin, 
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
      color: 'bg-blue-700 hover:bg-blue-800 text-white'
    },
    {
      name: 'Email',
      icon: Mail,
      url: `mailto:?subject=${encodeURIComponent(item.title)}&body=${encodeURIComponent(shareText + '\n\n' + shareUrl)}`,
      color: 'bg-gray-500 hover:bg-gray-600 text-white'
    },
    {
        name: 'SMS',
        icon: Smartphone,
        url: `sms:?body=${encodeURIComponent(shareText + ' ' + shareUrl)}`,
        color: 'bg-green-500 hover:bg-green-600 text-white'
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share {item.type}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 py-4">
          {socialLinks.map((link) => (
            <a 
              key={link.name}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center justify-center gap-2 p-3 rounded-lg font-medium transition-colors ${link.color}`}
            >
              <link.icon className="w-4 h-4" />
              {link.name}
            </a>
          ))}
        </div>
        
        <div className="space-y-3 border-t pt-4">
            <Button 
                variant="outline" 
                className="w-full justify-between"
                onClick={handleCopyLink}
            >
                <span className="flex items-center gap-2">
                    <LinkIcon className="w-4 h-4" /> Copy Link Only
                </span>
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </Button>
            
            <Button 
                variant="outline" 
                className="w-full justify-between"
                onClick={handleCopyContent}
            >
                 <span className="flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Copy Full Content
                </span>
                {copiedContent ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}