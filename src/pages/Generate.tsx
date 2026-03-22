import { useState, useRef, useEffect } from "react";
import { Sparkles, Wand2, Settings, Loader2, Download, Upload, X, Image as ImageIcon, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useImageGeneration } from "@/hooks/useImageGeneration";
import { validateImageFile, fileToBase64, getImageUrl, getErrorMessage } from "@/lib/api-utils";
import { api, type GenerateImageParams, type Preset, type ApplyPresetParams } from "@/lib/api";

const Generate = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [shotType, setShotType] = useState<GenerateImageParams['shot_type']>('lifestyle');
  const [productDescription, setProductDescription] = useState("");
  const [selectedPreset, setSelectedPreset] = useState<Preset | null>(null);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [isLoadingPresets, setIsLoadingPresets] = useState(false);
  const [isApplyingPreset, setIsApplyingPreset] = useState(false);
  const [presetGeneratedImage, setPresetGeneratedImage] = useState<any>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { generate, isGenerating, generatedImage } = useImageGeneration();
  
  // Use preset generated image if available, otherwise use regular generated image
  const displayImage = presetGeneratedImage || generatedImage;
  const isProcessing = isGenerating || isApplyingPreset;

  // Load presets on mount
  useEffect(() => {
    loadPresets();
    
    // Check if preset was selected from Presets page
    const storedPreset = sessionStorage.getItem("selectedPreset");
    if (storedPreset) {
      try {
        const preset = JSON.parse(storedPreset);
        setSelectedPreset(preset);
        setShotType(preset.shot_type as GenerateImageParams['shot_type']);
        sessionStorage.removeItem("selectedPreset");
      } catch (err) {
        // Invalid preset data, ignore
      }
    }
  }, []);

  const loadPresets = async () => {
    setIsLoadingPresets(true);
    try {
      const data = await api.getPresets();
      setPresets(data);
    } catch (err) {
      // Silently fail - presets are optional
    } finally {
      setIsLoadingPresets(false);
    }
  };

  const processFile = async (file: File) => {
    // Validate file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      toast.error(validation.error || "Invalid file");
      return;
    }

    setSelectedFile(file);
    
    // Create preview
    try {
      const preview = await fileToBase64(file);
      setFilePreview(preview);
    } catch (error) {
      toast.error("Failed to create preview");
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      await processFile(file);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleGenerate = async () => {
    if (!selectedFile) {
      toast.error("Please select a product image");
      return;
    }

    // If preset is selected, use preset application
    if (selectedPreset) {
      setIsApplyingPreset(true);
      setPresetGeneratedImage(null);
      try {
        const params: ApplyPresetParams = {
          preset_id: selectedPreset.id,
          product_image: selectedFile,
          product_description: productDescription.trim() || undefined,
        };
        const result = await api.applyPreset(params);
        setPresetGeneratedImage(result);
        toast.success("Image generated successfully with preset!");
      } catch (error) {
        toast.error(getErrorMessage(error));
      } finally {
        setIsApplyingPreset(false);
      }
      return;
    }

    // Regular generation without preset
    if (!shotType) {
      toast.error("Please select a shot type");
      return;
    }
    
    await generate({
      product_image: selectedFile,
      shot_type: shotType,
      product_description: productDescription.trim() || undefined,
    });
  };

  const handlePresetChange = (presetId: string) => {
    if (presetId === "none") {
      setSelectedPreset(null);
      return;
    }
    const preset = presets.find(p => p.id.toString() === presetId);
    if (preset) {
      setSelectedPreset(preset);
      setShotType(preset.shot_type as GenerateImageParams['shot_type']);
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Generate</h1>
        <p className="text-muted-foreground">Transform your ideas into stunning images with LensFuse.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="space-y-6">
          {/* File Upload */}
          <div className="glass rounded-xl p-6">
            <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-3">
              <Upload className="w-4 h-4 text-primary" />
              Product Image
            </label>
            
            {!selectedFile ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
                  isDragging
                    ? "border-primary bg-primary/10 scale-[1.02]"
                    : "border-border/50 hover:border-primary/50"
                }`}
              >
                <ImageIcon className={`w-12 h-12 mx-auto mb-3 transition-colors ${
                  isDragging ? "text-primary" : "text-muted-foreground"
                }`} />
                <p className={`text-sm mb-1 transition-colors ${
                  isDragging ? "text-primary font-medium" : "text-foreground"
                }`}>
                  {isDragging ? "Drop your image here" : "Click to upload or drag and drop"}
                </p>
                <p className="text-xs text-muted-foreground">PNG, JPG, JPEG (max 5MB)</p>
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="relative">
                <div className="relative rounded-lg overflow-hidden border border-border/50">
                  <img
                    src={filePreview || ""}
                    alt="Preview"
                    className="w-full h-48 object-cover"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={handleRemoveFile}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">{selectedFile.name}</p>
              </div>
            )}
          </div>

          {/* Preset Selector */}
          {presets.length > 0 && (
            <div className="glass rounded-xl p-6">
              <Label className="flex items-center gap-2 text-sm font-medium text-foreground mb-3">
                <Bookmark className="w-4 h-4 text-primary" />
                Use Preset (Optional)
              </Label>
              <Select
                value={selectedPreset?.id.toString() || "none"}
                onValueChange={handlePresetChange}
                disabled={isLoadingPresets}
              >
                <SelectTrigger className="bg-secondary/50 border-border/50">
                  <SelectValue placeholder="Select a preset" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Preset (Custom Settings)</SelectItem>
                  {presets.map((preset) => (
                    <SelectItem key={preset.id} value={preset.id.toString()}>
                      {preset.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedPreset && (
                <div className="mt-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <p className="text-sm font-medium text-foreground">{selectedPreset.name}</p>
                  {selectedPreset.description && (
                    <p className="text-xs text-muted-foreground mt-1">{selectedPreset.description}</p>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 h-6 text-xs"
                    onClick={() => setSelectedPreset(null)}
                  >
                    Clear Preset
                  </Button>
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                Apply a saved preset or use custom settings below
              </p>
            </div>
          )}

          {/* Shot Type Selector - Only show if no preset selected */}
          {!selectedPreset && (
            <div className="glass rounded-xl p-6">
              <Label className="flex items-center gap-2 text-sm font-medium text-foreground mb-3">
                <Settings className="w-4 h-4 text-primary" />
                Shot Type
              </Label>
              <Select
                value={shotType}
                onValueChange={(value) => setShotType(value as GenerateImageParams['shot_type'])}
              >
                <SelectTrigger className="bg-secondary/50 border-border/50">
                  <SelectValue placeholder="Select shot type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lifestyle">Lifestyle</SelectItem>
                  <SelectItem value="hero">Hero</SelectItem>
                  <SelectItem value="flat_lay">Flat Lay</SelectItem>
                  <SelectItem value="context">Context</SelectItem>
                  <SelectItem value="white_background">White Background</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-2">
                Choose the style of product photography you want
              </p>
            </div>
          )}

          {/* Product Description */}
          <div className="glass rounded-xl p-6">
            <Label className="flex items-center gap-2 text-sm font-medium text-foreground mb-3">
              <Sparkles className="w-4 h-4 text-primary" />
              Product Description (Optional)
            </Label>
            <Textarea
              value={productDescription}
              onChange={(e) => setProductDescription(e.target.value)}
              placeholder="Describe your product (e.g., 'A sleek smartphone with premium finish')"
              className="min-h-[100px] bg-secondary/50 border-border/50 resize-none focus:ring-primary/50"
              maxLength={400}
            />
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-muted-foreground">
                {productDescription.length}/400 characters
              </span>
            </div>
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={isProcessing || !selectedFile || (!selectedPreset && !shotType)}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium h-12"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4 mr-2" />
                Generate Image
              </>
            )}
          </Button>
        </div>

        {/* Preview Section */}
        <div className="glass rounded-xl p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <label className="text-sm font-medium text-foreground">Generated Image</label>
            {displayImage && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const url = displayImage.generated_image_url || displayImage.url || '';
                  if (url) {
                    window.open(getImageUrl(url), '_blank');
                  }
                }}
                className="text-sm"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            )}
          </div>
          <div className="flex-1 min-h-[400px] rounded-lg bg-secondary/30 border border-border/30 flex items-center justify-center overflow-hidden">
            {isProcessing ? (
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center animate-pulse-glow">
                  <Sparkles className="w-8 h-8 text-primary" />
                </div>
                <p className="text-muted-foreground">Creating your masterpiece...</p>
                <p className="text-sm text-muted-foreground/60 mt-2">This may take a few moments</p>
              </div>
            ) : displayImage ? (
              <div className="w-full h-full flex flex-col">
                <img
                  src={getImageUrl(displayImage.generated_image_url || displayImage.url || '')}
                  alt={displayImage.user_intent || displayImage.prompt || 'Generated image'}
                  className="w-full flex-1 object-contain"
                />
                {displayImage.user_intent && (
                  <p className="text-sm text-muted-foreground mt-4 p-3 bg-secondary/50 rounded">
                    {displayImage.user_intent}
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center px-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
                  <Wand2 className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">Your generated image will appear here</p>
                <p className="text-sm text-muted-foreground/60 mt-2">Upload an image, select a shot type, and click generate</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Generate;