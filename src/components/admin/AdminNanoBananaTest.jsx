import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader, CheckCircle, AlertCircle } from 'lucide-react';

export default function AdminNanoBananaTest() {
  const [prompt, setPrompt] = useState('A beautiful sunset over mountains');
  const [width, setWidth] = useState(768);
  const [height, setHeight] = useState(768);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleTest = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const apiKey = prompt('Enter your Nano Banana API key:');
      if (!apiKey) {
        setError('API key required');
        setLoading(false);
        return;
      }

      const normalizeSize = (size) => {
        const normalized = Math.round(size / 64) * 64;
        return Math.max(512, normalized);
      };

      const normalizedWidth = normalizeSize(width);
      const normalizedHeight = normalizeSize(height);

      const response = await fetch('https://api.nanobanana.ai/v1/images/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt,
          width: normalizedWidth,
          height: normalizedHeight,
          num_inference_steps: 25,
          guidance_scale: 7.5
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error?.message || data.message || JSON.stringify(data));
      } else {
        const imageUrl = data.images?.[0]?.url || data.image?.[0]?.url;
        if (imageUrl) {
          setResult({ url: imageUrl, width: normalizedWidth, height: normalizedHeight });
        } else {
          setError('No image URL in response: ' + JSON.stringify(data));
        }
      }
    } catch (err) {
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Nano Banana API Tester</CardTitle>
          <CardDescription>Test image generation with your API key</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Prompt</label>
            <Input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter image prompt..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Width</label>
              <Input
                type="number"
                value={width}
                onChange={(e) => setWidth(parseInt(e.target.value))}
                step="64"
                min="512"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Height</label>
              <Input
                type="number"
                value={height}
                onChange={(e) => setHeight(parseInt(e.target.value))}
                step="64"
                min="512"
              />
            </div>
          </div>

          <Button onClick={handleTest} disabled={loading} className="w-full">
            {loading && <Loader className="w-4 h-4 mr-2 animate-spin" />}
            {loading ? 'Generating...' : 'Test API'}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-900">Error</h3>
                <p className="text-red-700 text-sm mt-1 break-words">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {result && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6 space-y-4">
            <div className="flex gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-green-900">Success!</h3>
                <p className="text-green-700 text-sm">
                  Generated {result.width}x{result.height} image
                </p>
              </div>
            </div>

            {result.url && (
              <div className="mt-4">
                <img
                  src={result.url}
                  alt="Generated"
                  className="w-full rounded-lg max-h-96 object-cover"
                />
                <a
                  href={result.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-green-600 hover:underline mt-2 block"
                >
                  Open full image →
                </a>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}