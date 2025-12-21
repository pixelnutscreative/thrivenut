import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Check, UserPlus, Shield, CreditCard, ArrowRight, Sparkles, Users } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useTheme } from '../components/shared/useTheme';
import { useMutation } from '@tanstack/react-query';

export default function ParentChildSetup() {
  const { bgClass, textClass, cardBgClass, primaryColor, accentColor } = useTheme();

  const checkoutMutation = useMutation({
    mutationFn: async (quantity) => {
      const res = await base44.functions.invoke('createChildCheckout', { quantity });
      return res.data;
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    }
  });

  const steps = [
    {
      title: "1. Create a Family Profile",
      description: "Go to the 'Family Members' page and add a profile for your child.",
      icon: UserPlus
    },
    {
      title: "2. Activate Kid Mode",
      description: "Toggle 'Enable Kid Mode' in their profile settings. This gives them a safe, simplified dashboard.",
      icon: Sparkles
    },
    {
      title: "3. Link an Account (Optional)",
      description: "If they have their own device, create a free ThriveNut account for them and link it to their profile using their email.",
      icon: Shield
    },
    {
      title: "4. Subscribe",
      description: "Activate their premium features (Journal, Goals, Tasks) with a Child Add-on subscription.",
      icon: CreditCard
    }
  ];

  return (
    <div className={`min-h-screen ${bgClass} ${textClass} p-4 md:p-8`}>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Set Up Your Child's Account
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Give your child the tools to thrive! Track goals, express gratitude, and build healthy habits in a safe, fun environment.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className={`${cardBgClass} border-purple-200`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-purple-500" />
                Why Add a Child Account?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                {[
                  "Safe, simplified 'Kid Mode' dashboard",
                  "Fun Journal with mood tracking & doodles",
                  "Goal setting with rewards & confetti",
                  "Chore tracking connected to your parent account",
                  "Private prayer requests & gratitude log",
                  "No ads, no social media, fully parent-managed"
                ].map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="bg-green-100 p-1 rounded-full mt-0.5">
                      <Check className="w-4 h-4 text-green-600" />
                    </div>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className={`${cardBgClass} border-pink-200`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-6 h-6 text-pink-500" />
                Simple Pricing
              </CardTitle>
              <CardDescription>Add as many children as you need</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center py-4 bg-gray-50 rounded-xl">
                <span className="text-4xl font-bold text-gray-900">$5</span>
                <span className="text-gray-500">/child per month</span>
              </div>
              
              <div className="space-y-3">
                <Button 
                  className="w-full text-lg h-12"
                  style={{ background: `linear-gradient(to right, ${primaryColor}, ${accentColor})` }}
                  onClick={() => checkoutMutation.mutate(1)}
                  disabled={checkoutMutation.isPending}
                >
                  Subscribe 1 Child ($5/mo)
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => checkoutMutation.mutate(2)}
                  disabled={checkoutMutation.isPending}
                >
                  Subscribe 2 Children ($10/mo)
                </Button>
                 <Button 
                  variant="ghost" 
                  className="w-full text-sm text-gray-500"
                  onClick={() => window.location.href = '/FamilyMembers'}
                >
                  Manage Family Profiles <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-center">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-4">
            {steps.map((step, index) => (
              <Card key={index} className="relative overflow-hidden border-t-4 border-purple-400">
                <CardContent className="p-6 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mb-4">
                    <step.icon className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="font-bold text-lg">{step.title}</h3>
                  <p className="text-sm text-gray-600">{step.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="flex justify-center pt-8">
           <Button 
            variant="link"
            className="text-gray-500"
            onClick={() => window.location.href = '/Support'}
          >
            Need help setting this up? Contact Support
          </Button>
        </div>
      </div>
    </div>
  );
}