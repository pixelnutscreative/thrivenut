import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Download, Wand2, ArrowUp, FolderOpen, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import DynamicInput from './DynamicInput';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';

export default function AppPreview({ app, onClose, primaryColor, accentColor }) {
  const [inputs, setInputs] = useState({});
  const [generating, setGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState([]);
  const [selectedSizes, setSelectedSizes] = useState(['9:16']);
  const [customWidth, setCustomWidth] = useState('');
  const [customHeight, setCustomHeight] = useState('');
  const [upscaling, setUpscaling] = useState(false);
  const [promptUsed, setPromptUsed] = useState('');
  const queryClient = useQueryClient();

  const toggleSize = (size) => {
    setSelectedSizes(prev => 
      prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
    );
  };

  // Fetch past outputs for this app
  const { data: pastOutputs = [] } = useQuery({
    queryKey: ['appOutputs', app.id],
    queryFn: () => base44.entities.AIAppOutput.filter({ app_id: app.id }, '-created_date'),
  });

  const getSizeConfig = (sizeKey) => {
    const configs = {
      '9:16': { width: 1080, height: 1920, label: '9:16' },
      '1:1': { width: 1080, height: 1080, label: '1:1' },
      '16:9': { width: 1920, height: 1080, label: '16:9' },
      'fb': { width: 820, height: 312, label: 'FB' },
      'yt': { width: 1280, height: 720, label: 'YT' },
      'li': { width: 1584, height: 396, label: 'LI' },
      'ig': { width: 1080, height: 566, label: 'IG' },
    };
    
    if (sizeKey === 'custom' && customWidth && customHeight) {
      return { 
        width: parseInt(customWidth), 
        height: parseInt(customHeight), 
        label: `${customWidth}×${customHeight}` 
      };
    }
    
    return configs[sizeKey] || configs['9:16'];
  };

  const handleGenerate = async () => {
    setGenerating(true);
    const results = [];
    try {
      // Fetch global context
      const [characters, brands, products] = await Promise.all([
        base44.entities.CharacterReference.list(),
        base44.entities.Brand.list(),
        base44.entities.BrandProduct.list()
      ]);

      const characterRef = localStorage.getItem('selectedCharacterId');
      const brandId = localStorage.getItem('selectedBrandId');
      const productId = localStorage.getItem('selectedProductId');

      const character = characters.find(c => c.id === characterRef);
      const brand = brands.find(b => b.id === brandId);
      const product = products.find(p => p.id === productId);

      // Build base prompt using app's actual name and description
      let basePrompt = `Create an image in the style of "${app.name}": ${app.description}\n\n`;
      
      // Check if text overlay is provided
      let hasTextOverlay = false;
      
      // Add user inputs
      Object.entries(inputs).forEach(([key, value]) => {
        if (value) {
          if (key.toLowerCase().includes('text overlay') || key.toLowerCase().includes('text on image')) {
            basePrompt += `Include this text on the image: "${value}"\n`;
            hasTextOverlay = true;
          } else {
            basePrompt += `${key}: ${value}\n`;
          }
        }
      });
      
      // Explicitly state no text unless user provided it
      if (!hasTextOverlay) {
        basePrompt += `\nIMPORTANT: Do not include any text, words, or letters in the image.`;
      }

      // Add context
      if (character) {
        basePrompt += `\nCharacter Reference: ${character.name} - ${character.description}`;
        if (character.prompt_snippet) basePrompt += `\n${character.prompt_snippet}`;
      }
      if (brand) {
        basePrompt += `\nBrand Style: ${brand.name} - ${brand.description}`;
        if (brand.tone_voice) basePrompt += ` (Tone: ${brand.tone_voice})`;
      }
      if (product) {
        basePrompt += `\nFeaturing Product: ${product.name} - ${product.description}`;
      }

      // Generate ONE base image first
      const firstSize = selectedSizes[0];
      const firstConfig = getSizeConfig(firstSize);
      const firstPrompt = `${basePrompt}\n\nImage dimensions: ${firstConfig.width}x${firstConfig.height}`;
      
      const firstResponse = await base44.integrations.Core.GenerateImage({ prompt: firstPrompt });
      const baseImageUrl = firstResponse.url;
      
      results.push({
        url: baseImageUrl,
        size: firstSize,
        prompt: firstPrompt
      });

      // Save first output
      await base44.entities.AIAppOutput.create({
        app_id: app.id,
        output_url: baseImageUrl,
        prompt_text: firstPrompt,
        character_reference_id: characterRef,
        brand_id: brandId,
        product_id: productId
      });

      // Generate same image in other sizes
      for (let i = 1; i < selectedSizes.length; i++) {
        const sizeKey = selectedSizes[i];
        const sizeConfig = getSizeConfig(sizeKey);
        
        const resizePrompt = `${basePrompt}\n\nResize/recreate this exact same image to ${sizeConfig.width}x${sizeConfig.height} dimensions. Maintain the exact same composition, style, and content.`;
        
        const response = await base44.integrations.Core.GenerateImage({ 
          prompt: resizePrompt,
          existing_image_urls: [baseImageUrl]
        });
        
        results.push({
          url: response.url,
          size: sizeKey,
          prompt: resizePrompt
        });

        // Save output
        await base44.entities.AIAppOutput.create({
          app_id: app.id,
          output_url: response.url,
          prompt_text: resizePrompt,
          character_reference_id: characterRef,
          brand_id: brandId,
          product_id: productId
        });
      }

      setGeneratedImages(results);
      setPromptUsed(basePrompt);
      queryClient.invalidateQueries(['appOutputs', app.id]);
    } catch (error) {
      console.error('Generation error:', error);
      alert('Failed to generate image');
    } finally {
      setGenerating(false);
    }
  };

  const handleUpscale = async (imageUrl) => {
    setUpscaling(true);
    try {
      const upscalePrompt = `Upscale and enhance this image to 4K quality with maximum detail and clarity. ${promptUsed}`;
      const response = await base44.integrations.Core.GenerateImage({ 
        prompt: upscalePrompt,
        existing_image_urls: [imageUrl]
      });
      
      // Update the specific image
      setGeneratedImages(prev => prev.map(img => 
        img.url === imageUrl ? { ...img, url: response.url } : img
      ));
    } catch (error) {
      console.error('Upscale error:', error);
      alert('Failed to upscale image');
    } finally {
      setUpscaling(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl">{app.name}</DialogTitle>
              <p className="text-sm text-gray-600">{app.description}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </DialogHeader>

        <Tabs defaultValue="create" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="create">Create New</TabsTrigger>
            <TabsTrigger value="gallery">
              <FolderOpen className="w-4 h-4 mr-2" />
              The Closet ({pastOutputs.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="space-y-4 mt-4">
            {/* Size Selector - Compact Multi-Select */}
            <div className="border rounded-lg p-3 bg-gray-50">
              <Label className="text-xs font-medium mb-2 block text-gray-600">Image Sizes (select multiple)</Label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {['9:16', '1:1', '16:9', 'fb', 'yt', 'li', 'ig', 'custom'].map(key => {
                  const config = getSizeConfig(key);
                  return (
                    <Button
                      key={key}
                      variant={selectedSizes.includes(key) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => toggleSize(key)}
                      className="text-xs h-7 px-2"
                    >
                      {config.label}
                    </Button>
                  );
                })}
              </div>
              {selectedSizes.includes('custom') && (
                <div className="flex gap-2 items-center">
                  <Input 
                    type="number" 
                    placeholder="Width" 
                    value={customWidth} 
                    onChange={(e) => setCustomWidth(e.target.value)}
                    className="h-8 text-xs"
                  />
                  <span className="text-xs">×</span>
                  <Input 
                    type="number" 
                    placeholder="Height" 
                    value={customHeight} 
                    onChange={(e) => setCustomHeight(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              )}
            </div>

            {/* Dynamic Inputs */}
            {app.config_json?.inputFields?.map(field => (
              <div key={field.id}>
                <DynamicInput
                  field={field}
                  value={inputs[field.label] || ''}
                  onChange={(label, value) => setInputs({ ...inputs, [label]: value })}
                />
              </div>
            ))}

            {/* Generate Button */}
            <Button 
              onClick={handleGenerate}
              disabled={generating}
              className="w-full"
              style={{ background: `linear-gradient(to right, ${primaryColor}, ${accentColor})` }}
            >
              {generating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="w-5 h-5 mr-2" />
                  Generate Image
                </>
              )}
            </Button>

            {/* Results */}
            {generatedImages.length > 0 && (
              <div className="space-y-3">
                <div className="grid gap-3">
                  {generatedImages.map((img, idx) => (
                    <div key={idx} className="border rounded-lg p-3 bg-white">
                      <p className="text-xs font-medium text-gray-500 mb-2">{getSizeConfig(img.size).label}</p>
                      <img src={img.url} alt={`Generated ${img.size}`} className="w-full rounded-lg shadow-lg mb-2" />
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => window.open(img.url, '_blank')}
                          className="flex-1"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                        <Button 
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpscale(img.url)}
                          disabled={upscaling}
                          className="flex-1"
                        >
                          {upscaling ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ArrowUp className="w-4 h-4 mr-2" />}
                          Upscale
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                {promptUsed && (
                  <details className="text-xs bg-gray-50 p-3 rounded">
                    <summary className="cursor-pointer font-medium text-gray-700">View Base Prompt</summary>
                    <p className="mt-2 text-gray-600 whitespace-pre-wrap">{promptUsed}</p>
                  </details>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="gallery" className="mt-4">
            {pastOutputs.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <FolderOpen className="w-16 h-16 mx-auto mb-3 opacity-20" />
                <p>No images yet. Create your first one!</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {pastOutputs.map(output => (
                  <Card key={output.id} className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow">
                    <img 
                      src={output.output_url} 
                      alt="Past output" 
                      className="w-full h-48 object-cover"
                      onClick={() => window.open(output.output_url, '_blank')}
                    />
                    {output.prompt_text && (
                      <details className="p-2 text-xs bg-gray-50">
                        <summary className="cursor-pointer font-medium">Prompt</summary>
                        <p className="mt-1 text-gray-600 line-clamp-3">{output.prompt_text}</p>
                      </details>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}