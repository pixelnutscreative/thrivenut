import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Image as ImageIcon, Download, Copy, RefreshCw } from 'lucide-react';
import { useTheme } from '../components/shared/useTheme';

export default function AIImageGenerator() {
  const { bgClass } = useTheme();
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultUrl, setResultUrl] = useState(null);
  const [error, setError] = useState(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setLoading(true);
    setError(null);
    setResultUrl(null);

    try {
      const response = await base44.integrations.Core.GenerateImage({
        prompt: prompt,
      });
      
      if (response && response.url) {
        setResultUrl(response.url);
      } else {
        throw new Error('No image URL returned');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to generate image. Please try again with a different prompt.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen ${bgClass} p-4 md:p-8`}>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Image Generator</h1>
          <p className="text-gray-600">Turn your ideas into visuals instantly.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Input Section */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="text-lg">Describe your image</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="A futuristic city with flying cars at sunset, cyberpunk style..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[150px] resize-none text-base"
              />
              
              {error && (
                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">
                  {error}
                </div>
              )}

              <Button 
                onClick={handleGenerate} 
                disabled={loading || !prompt.trim()}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-6 text-lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Creating Magic...
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-5 h-5 mr-2" />
                    Generate Image
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Result Section */}
          <Card className="min-h-[400px] flex flex-col">
            <CardHeader>
              <CardTitle className="text-lg">Result</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col items-center justify-center p-6 bg-gray-50/50 rounded-b-xl">
              {loading ? (
                <div className="text-center space-y-4">
                  <div className="relative w-24 h-24 mx-auto">
                    <div className="absolute inset-0 border-4 border-purple-200 rounded-full animate-pulse"></div>
                    <div className="absolute inset-0 border-4 border-t-purple-600 rounded-full animate-spin"></div>
                  </div>
                  <p className="text-gray-500 animate-pulse">Painting pixels...</p>
                </div>
              ) : resultUrl ? (
                <div className="w-full space-y-4">
                  <div className="relative group rounded-lg overflow-hidden shadow-lg border border-gray-200">
                    <img 
                      src={resultUrl} 
                      alt="Generated result" 
                      className="w-full h-auto object-contain max-h-[500px] bg-white"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => window.open(resultUrl, '_blank')}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Open Full Size
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        navigator.clipboard.writeText(resultUrl);
                        alert('URL copied!');
                      }}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-400">
                  <ImageIcon className="w-16 h-16 mx-auto mb-3 opacity-20" />
                  <p>Your creation will appear here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}