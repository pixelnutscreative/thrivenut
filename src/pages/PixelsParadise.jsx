import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Palette, Sparkles, Wand2, Image, Type, Layers } from 'lucide-react';

const resourceCategories = [
  {
    title: 'AI Tools',
    icon: Wand2,
    color: 'from-purple-500 to-pink-500',
    items: [
      { name: 'Magai', description: 'Browser-based AI assistant with custom personalities', link: 'https://magai.co/?via=blue', badge: '🔥 Recommended' },
      { name: 'Suno', description: 'Create amazing songs with AI ($10/mo for rights)', link: 'https://suno.com/invite/@iamnikolewithak' },
      { name: 'Kling AI', description: 'Images to video and so much more!', link: 'https://klingai.com/h5-app/invitation?code=7BRNCEDRHUZE' },
      { name: 'ElevenLabs', description: 'Create audio, sound effects, voice clones, music', link: 'https://try.elevenlabs.io/vit4ewk7bgyi' },
      { name: 'Glam', description: 'Animate your logo with AI + pretty pics', link: 'https://glam.onelink.me/OCYu/qi44plg8', badge: '📱 App' },
    ]
  },
  {
    title: 'Creative Tools',
    icon: Palette,
    color: 'from-teal-500 to-cyan-500',
    items: [
      { name: 'Base44', description: 'Create no-code apps + sites', link: 'https://base44.pxf.io/c/5371887/2049275/25619?subId1=blue&trafcat=base' },
      { name: 'Video Express', description: 'Turn images to videos - $179 one time, unlimited!', link: 'https://paykstrt.com/50942/156400', badge: '💎 One-Time' },
      { name: 'Talking Photos', description: 'Make cartoon pics talk - $97 one time!', link: 'https://paykstrt.com/52357/156400', badge: '💎 One-Time' },
      { name: 'Artistly', description: 'AI graphics + tools - $149 one time, unlimited!', link: 'https://paykstrt.com/52357/156400', badge: '💎 One-Time' },
    ]
  },
  {
    title: 'Business & Learning',
    icon: Image,
    color: 'from-orange-500 to-amber-500',
    items: [
      { name: 'The Nuts + Bots', description: 'White label High Level for your business + AI tools', link: 'https://thenutsandbots.com/pricing', badge: '⚡ All-in-One' },
      { name: "Let's Go Nuts", description: 'Community app (Apple & Play Store)', link: 'https://keenkard.com/letsgonuts', badge: '📱 App' },
      { name: 'AI Filmmaking', description: 'Join the Skool community - $5/month', link: 'https://keenkard.com/aifilmmaking' },
      { name: 'MailChimp', description: 'Email marketing - FREE account', link: 'https://login.mailchimp.com/signup/?plan=free_monthly_plan_v0&locale=en', badge: '🆓 Free' },
      { name: 'Bellator Life', description: 'Digital vending machines for passive income', link: 'https://bellatorlife.com/register?reference=iamnikolewithak' },
      { name: 'Dreams Resources', description: 'Business resources & tools', link: 'https://dreamsresources.com/join/?refid=AA5551', badge: '🆓 Free' },
    ]
  }
];

export default function PixelsParadise() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-cyan-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-cyan-500 bg-clip-text text-transparent flex items-center justify-center gap-3">
            <Sparkles className="w-10 h-10 text-purple-500" />
            Pixel's Paradise
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Essential design tools, AI resources, and everything you need to create amazing content. 
            Curated by PixelNutsCreative.
          </p>
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={() => window.open('https://pixelnutscreative.com/links', '_blank')}
          >
            View Full Resource Page <ExternalLink className="w-4 h-4" />
          </Button>
        </div>

        {/* Resource Categories */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resourceCategories.map((category) => {
            const Icon = category.icon;
            return (
              <Card key={category.title} className="bg-white/80 backdrop-blur overflow-hidden">
                <div className={`h-2 bg-gradient-to-r ${category.color}`} />
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon className="w-5 h-5" />
                    {category.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {category.items.map((item) => (
                    <a
                      key={item.name}
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-gray-800">{item.name}</p>
                          <p className="text-sm text-gray-500">{item.description}</p>
                        </div>
                        {item.badge && (
                          <Badge variant="secondary" className="text-xs">
                            {item.badge}
                          </Badge>
                        )}
                      </div>
                    </a>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Coming Soon Section */}
        <Card className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
          <CardContent className="p-8 text-center">
            <Sparkles className="w-12 h-12 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">AI Tools & Subscriptions Coming Soon!</h2>
            <p className="opacity-90">
              Subscribe directly through ThriveNut to access exclusive AI-powered design tools.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}