import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Upload, Wand2, Plus, Trash2, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function ImageAppBuilder({ primaryColor, accentColor }) {
  const [appIdea, setAppIdea] = useState('');
  const [appNameSuggestions, setAppNameSuggestions] = useState([]);
  const [generatingNames, setGeneratingNames] = useState(false);
  const [appName, setAppName] = useState('');
  const [appDescription, setAppDescription] = useState('');
  const [generatingDescription, setGeneratingDescription] = useState(false);
  const [appIcon, setAppIcon] = useState(null);
  const [generatingIcon, setGeneratingIcon] = useState(false);
  const [iconPrompt, setIconPrompt] = useState('');
  const [iconStyle, setIconStyle] = useState('');
  const [inputFields, setInputFields] = useState([]);
  const [generatingFields, setGeneratingFields] = useState(false);
  const [draftId, setDraftId] = useState(null);
  const [saving, setSaving] = useState(false);

  const generateAppNames = async () => {
    if (!appIdea.trim()) return;
    
    setGeneratingNames(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate 7 creative, catchy app names for an AI image generator app. The user's idea is: "${appIdea}". Return ONLY a JSON array of 7 strings, nothing else. Example format: ["AppName1", "AppName2", "AppName3", "AppName4", "AppName5", "AppName6", "AppName7"]`,
        response_json_schema: {
          type: "object",
          properties: {
            names: {
              type: "array",
              items: { type: "string" },
              minItems: 7,
              maxItems: 7
            }
          },
          required: ["names"]
        }
      });
      setAppNameSuggestions(response.names || []);
    } catch (error) {
      console.error('Error generating names:', error);
    } finally {
      setGeneratingNames(false);
    }
  };

  const selectAppName = async (name) => {
    setAppName(name);
    setGeneratingDescription(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Create a polished, professional app description for an AI image generator app called "${name}". The app concept is: "${appIdea}". Write a concise 2-3 sentence description that clearly explains what the app does and its value. Be specific and compelling. Match the tone and style to the app name.`,
      });
      setAppDescription(response);
      
      // Auto-generate icon from name and description
      if (response) {
        generateIconFromDescription(name, response);
      }
    } catch (error) {
      console.error('Error generating description:', error);
    } finally {
      setGeneratingDescription(false);
    }
  };

  const generateIconFromDescription = async (name, description) => {
    setGeneratingIcon(true);
    try {
      const iconPromptText = `App icon for "${name}". Visual symbol representing: ${description}. Simple icon design, centered object/symbol, no text, flat style, clean, professional`;
      console.log('Generating icon with prompt:', iconPromptText);
      
      const response = await base44.integrations.Core.GenerateImage({
        prompt: iconPromptText
      });
      
      console.log('Icon response:', response);
      
      if (response?.url) {
        setAppIcon(response.url);
        console.log('Icon set to:', response.url);
      } else {
        console.error('No image URL in response:', response);
      }
    } catch (error) {
      console.error('Error generating icon:', error);
      alert('Failed to generate icon. Check console for details.');
    } finally {
      setGeneratingIcon(false);
    }
  };

  const generateCustomIcon = async () => {
    if (!iconPrompt.trim()) return;
    
    setGeneratingIcon(true);
    try {
      console.log('Generating custom icon...');
      const fullPrompt = `${iconPrompt}. ${iconStyle || 'app icon style, clean, modern'}`;
      const response = await base44.integrations.Core.GenerateImage({
        prompt: fullPrompt
      });
      
      console.log('Custom icon response:', response);
      
      if (response?.url) {
        setAppIcon(response.url);
        console.log('Custom icon set to:', response.url);
      } else {
        console.error('No image URL in response:', response);
      }
    } catch (error) {
      console.error('Error generating icon:', error);
      alert('Failed to generate icon. Check console for details.');
    } finally {
      setGeneratingIcon(false);
    }
  };

  const generateInputFields = async () => {
    if (!appDescription.trim()) return;
    
    setGeneratingFields(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `For the AI image generation app "${appName}" with description: "${appDescription}". 

Suggest 4-6 essential input fields that users should provide before generating images. Be SUPER CREATIVE and think outside the box!

For each field include:
- label: clear, creative field name
- type: one of: text, textarea, text_overlay, image, image_reference, url, fixed_url, toggle, number, dropdown, file_upload, language, slider
- required: true or false
- placeholder: helpful, inspiring example text
- options: For dropdown types, provide 8-15 CREATIVE, DIVERSE options that users can customize. Think broadly and imaginatively!
- min/max/step: for slider type (be creative with ranges)

Examples of creative dropdown options:
- Art styles: "Cyberpunk Neon", "Watercolor Dreams", "80s Retro Vibes", "Minimalist Zen", "Gothic Fantasy", "Pop Art Explosion", etc.
- Moods: "Mysterious & Dark", "Bright & Cheerful", "Nostalgic", "Futuristic", "Whimsical", "Dramatic", "Serene", etc.
- Color palettes: "Sunset Warmth", "Ocean Blues", "Forest Greens", "Monochrome", "Pastel Rainbow", "Neon Glow", etc.

Return as JSON.`,
        response_json_schema: {
          type: "object",
          properties: {
            fields: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  label: { type: "string" },
                  type: { type: "string" },
                  required: { type: "boolean" },
                  placeholder: { type: "string" },
                  options: { type: "array", items: { type: "string" } },
                  min: { type: "number" },
                  max: { type: "number" },
                  step: { type: "number" }
                },
                required: ["label", "type", "required"]
              }
            }
          },
          required: ["fields"]
        }
      });
      
      const newFields = response.fields.map((f, i) => ({
        id: Date.now() + i,
        ...f
      }));
      setInputFields(newFields);
    } catch (error) {
      console.error('Error generating fields:', error);
    } finally {
      setGeneratingFields(false);
    }
  };

  const addInputField = () => {
    setInputFields([...inputFields, {
      id: Date.now(),
      label: '',
      type: 'text',
      required: true,
      placeholder: ''
    }]);
  };

  const removeInputField = (id) => {
    setInputFields(inputFields.filter(f => f.id !== id));
  };

  const updateField = (id, key, value) => {
    setInputFields(inputFields.map(f => 
      f.id === id ? {...f, [key]: value} : f
    ));
  };

  const addDropdownOption = (fieldId) => {
    setInputFields(inputFields.map(f => {
      if (f.id === fieldId) {
        return {...f, options: [...(f.options || []), '']};
      }
      return f;
    }));
  };

  const updateDropdownOption = (fieldId, optionIndex, value) => {
    setInputFields(inputFields.map(f => {
      if (f.id === fieldId) {
        const newOptions = [...(f.options || [])];
        newOptions[optionIndex] = value;
        return {...f, options: newOptions};
      }
      return f;
    }));
  };

  const removeDropdownOption = (fieldId, optionIndex) => {
    setInputFields(inputFields.map(f => {
      if (f.id === fieldId) {
        return {...f, options: (f.options || []).filter((_, i) => i !== optionIndex)};
      }
      return f;
    }));
  };

  const saveDraft = async () => {
    setSaving(true);
    try {
      const draftData = {
        name: appName || 'Untitled App',
        description: appDescription,
        app_icon_url: appIcon,
        app_type: 'image',
        config_json: {
          appIdea,
          inputFields,
          iconPrompt,
          iconStyle
        },
        is_published: false,
        approval_status: 'draft'
      };

      if (draftId) {
        await base44.entities.AIApp.update(draftId, draftData);
      } else {
        const newDraft = await base44.entities.AIApp.create(draftData);
        setDraftId(newDraft.id);
      }
      alert('Draft saved successfully!');
    } catch (error) {
      console.error('Error saving draft:', error);
      alert('Failed to save draft');
    } finally {
      setSaving(false);
    }
  };

  const saveAndTest = async () => {
    if (!appName.trim()) {
      alert('Please provide an app name');
      return;
    }
    if (inputFields.length === 0) {
      alert('Please add at least one input field');
      return;
    }

    setSaving(true);
    try {
      const appData = {
        name: appName,
        description: appDescription,
        app_icon_url: appIcon,
        app_type: 'image',
        config_json: {
          appIdea,
          inputFields,
          iconPrompt,
          iconStyle
        },
        is_published: false,
        approval_status: 'draft'
      };

      let savedApp;
      if (draftId) {
        await base44.entities.AIApp.update(draftId, appData);
        savedApp = { id: draftId, ...appData };
      } else {
        savedApp = await base44.entities.AIApp.create(appData);
        setDraftId(savedApp.id);
      }

      // Trigger onSave callback if provided
      if (window.onAppSaved) {
        window.onAppSaved(savedApp);
      }
      
      alert('App saved successfully! Opening preview...');
    } catch (error) {
      console.error('Error saving app:', error);
      alert('Failed to save app');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* App Info Section */}
      <Card>
        <CardHeader>
          <CardTitle>App Information</CardTitle>
          <CardDescription>Basic details about your image generation app</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>App Idea *</Label>
            <div className="flex gap-2">
              <Input 
                value={appIdea}
                onChange={(e) => setAppIdea(e.target.value)}
                placeholder="Briefly describe your app idea..."
                className="flex-1"
              />
              <Button 
                onClick={generateAppNames}
                disabled={!appIdea.trim() || generatingNames}
                style={{ background: `linear-gradient(to right, ${primaryColor}, ${accentColor})` }}
              >
                {generatingNames ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Wand2 className="w-4 h-4 mr-2" />
                    Generate Names
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* App Name Suggestions */}
          {appNameSuggestions.length > 0 && (
            <div>
              <Label>Choose an App Name *</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                {appNameSuggestions.map((name, idx) => (
                  <Button
                    key={idx}
                    variant={appName === name ? 'default' : 'outline'}
                    onClick={() => selectAppName(name)}
                    className="text-sm"
                    style={appName === name ? { background: `linear-gradient(to right, ${primaryColor}, ${accentColor})` } : {}}
                  >
                    {name}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div>
            <Label>App Name * {appName && '(or edit selected)'}</Label>
            <Input 
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              placeholder="Select a name above or type your own..."
            />
          </div>

          <div>
            <Label>App Description (editable)</Label>
            <Textarea 
              value={appDescription}
              onChange={(e) => setAppDescription(e.target.value)}
              placeholder="Generated description will appear here..."
              rows={3}
            />
          </div>

          {/* App Icon */}
          <div>
            <Label>App Icon</Label>
            <div className="flex gap-4 items-start">
              {/* Icon Preview - Always show when icon exists or is loading */}
              <div className="w-32 h-32 border-2 rounded-lg overflow-hidden flex items-center justify-center bg-gray-50">
                {generatingIcon ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                    <p className="text-xs text-gray-500">Generating...</p>
                  </div>
                ) : appIcon ? (
                  <img src={appIcon} alt="App icon" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center p-4">
                    <Sparkles className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-xs text-gray-400">Icon will appear here</p>
                  </div>
                )}
                </div>

                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Manual Upload */}
                <label className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        const { file_url } = await base44.integrations.Core.UploadFile({ file });
                        setAppIcon(file_url);
                      } catch (error) {
                        console.error('Error uploading icon:', error);
                      }
                    }}
                  />
                  <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600 mb-1">Upload Icon</p>
                  <p className="text-xs text-gray-400">PNG, JPG (Square)</p>
                </label>

                {/* AI Generated */}
                <div className="border-2 border-dashed rounded-lg p-4" style={{ borderColor: primaryColor }}>
                  <div className="flex items-center gap-2 mb-3">
                    <Wand2 className="w-4 h-4" style={{ color: primaryColor }} />
                    <p className="text-sm font-medium">Custom Icon</p>
                  </div>
                  <Input 
                    value={iconPrompt}
                    onChange={(e) => setIconPrompt(e.target.value)}
                    placeholder="Describe the icon you want..."
                    className="mb-2"
                  />
                  <Input 
                    value={iconStyle}
                    onChange={(e) => setIconStyle(e.target.value)}
                    placeholder="Style: flat, 3D, minimalist..."
                  />
                  <Button 
                    size="sm" 
                    className="w-full mt-3"
                    onClick={generateCustomIcon}
                    disabled={!iconPrompt.trim() || generatingIcon}
                    style={{ background: `linear-gradient(to right, ${primaryColor}, ${accentColor})` }}
                  >
                    {generatingIcon ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Input Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Input Fields Configuration</CardTitle>
              <CardDescription>Define what inputs users will provide</CardDescription>
            </div>
            <Button 
              size="sm"
              onClick={generateInputFields}
              disabled={!appDescription.trim() || generatingFields}
              style={{ background: `linear-gradient(to right, ${primaryColor}, ${accentColor})` }}
            >
              {generatingFields ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Wand2 className="w-4 h-4 mr-2" />
                  Generate with AI
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {inputFields.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
              <p className="text-gray-500 mb-4">No input fields yet. Add fields or let AI suggest them.</p>
              <Button onClick={addInputField} variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Add Input Field
              </Button>
            </div>
          ) : (
            <>
              {inputFields.map(field => (
                <div key={field.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Field Label</Label>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => removeInputField(field.id)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <Input 
                   placeholder="e.g., Product Name"
                   value={field.label}
                   onChange={(e) => updateField(field.id, 'label', e.target.value)}
                  />
                  <div>
                   <Label className="text-xs">Placeholder Text</Label>
                   <Input 
                     placeholder="Hint text for users..."
                     value={field.placeholder || ''}
                     onChange={(e) => updateField(field.id, 'placeholder', e.target.value)}
                     className="text-sm"
                   />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                   <div>
                     <Label className="text-xs">Field Type</Label>
                     <Select value={field.type} onValueChange={(val) => updateField(field.id, 'type', val)}>
                       <SelectTrigger>
                         <SelectValue />
                       </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="text">Text</SelectItem>
                         <SelectItem value="textarea">Long Text</SelectItem>
                         <SelectItem value="text_overlay">Text Overlay (Spell-Checked)</SelectItem>
                         <SelectItem value="image">Image</SelectItem>
                         <SelectItem value="image_reference">Image Reference (with Strength)</SelectItem>
                         <SelectItem value="url">URL</SelectItem>
                         <SelectItem value="fixed_url">Fixed URL</SelectItem>
                         <SelectItem value="toggle">Toggle</SelectItem>
                         <SelectItem value="number">Number</SelectItem>
                         <SelectItem value="dropdown">Dropdown</SelectItem>
                         <SelectItem value="file_upload">File Upload</SelectItem>
                         <SelectItem value="language">Language</SelectItem>
                         <SelectItem value="slider">Slider</SelectItem>
                       </SelectContent>
                     </Select>
                   </div>
                   <div>
                     <Label className="text-xs">Required</Label>
                     <Select value={field.required ? 'yes' : 'no'} onValueChange={(val) => updateField(field.id, 'required', val === 'yes')}>
                       <SelectTrigger>
                         <SelectValue />
                       </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="yes">Yes</SelectItem>
                         <SelectItem value="no">No</SelectItem>
                       </SelectContent>
                     </Select>
                   </div>
                  </div>

                  {/* Dropdown Options */}
                  {field.type === 'dropdown' && (
                   <div className="border-t pt-3 space-y-2">
                     <Label className="text-xs">Dropdown Options</Label>
                     {(field.options || []).map((option, idx) => (
                       <div key={idx} className="flex gap-2">
                         <Input 
                           value={option}
                           onChange={(e) => updateDropdownOption(field.id, idx, e.target.value)}
                           placeholder={`Option ${idx + 1}`}
                           className="text-sm"
                         />
                         <Button 
                           size="sm" 
                           variant="ghost"
                           onClick={() => removeDropdownOption(field.id, idx)}
                           className="text-red-500"
                         >
                           <Trash2 className="w-4 h-4" />
                         </Button>
                       </div>
                     ))}
                     <Button 
                       size="sm" 
                       variant="outline" 
                       onClick={() => addDropdownOption(field.id)}
                       className="w-full"
                     >
                       <Plus className="w-4 h-4 mr-2" />
                       Add Option
                     </Button>
                   </div>
                  )}

                  {/* Slider Settings */}
                  {field.type === 'slider' && (
                   <div className="border-t pt-3 grid grid-cols-3 gap-2">
                     <div>
                       <Label className="text-xs">Min</Label>
                       <Input 
                         type="number"
                         value={field.min || 0}
                         onChange={(e) => updateField(field.id, 'min', Number(e.target.value))}
                         className="text-sm"
                       />
                     </div>
                     <div>
                       <Label className="text-xs">Max</Label>
                       <Input 
                         type="number"
                         value={field.max || 100}
                         onChange={(e) => updateField(field.id, 'max', Number(e.target.value))}
                         className="text-sm"
                       />
                     </div>
                     <div>
                       <Label className="text-xs">Step</Label>
                       <Input 
                         type="number"
                         value={field.step || 1}
                         onChange={(e) => updateField(field.id, 'step', Number(e.target.value))}
                         className="text-sm"
                       />
                     </div>
                   </div>
                  )}
                  </div>
              ))}
              <Button onClick={addInputField} variant="outline" className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Add Another Field
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={saveDraft} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          Save Draft
        </Button>
        <Button 
          onClick={saveAndTest} 
          disabled={saving}
          style={{ background: `linear-gradient(to right, ${primaryColor}, ${accentColor})` }}
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
          Save & Test App
        </Button>
      </div>
    </div>
  );
}