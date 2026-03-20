import { useState, useEffect } from "react";
import { Images, Download, Trash2, ZoomIn, Search, Loader2, Info, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { api, GeneratedImage } from "@/lib/api";
import { toast } from "sonner";
import { getImageUrl, formatDate, getShotTypeLabel, getErrorMessage } from "@/lib/api-utils";

const Gallery = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  const [imageDetails, setImageDetails] = useState<GeneratedImage | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async (search?: string) => {
    setIsLoading(true);
    try {
      const data = await api.getImages(search);
      setImages(data);
    } catch (err) {
      toast.error("Failed to load gallery");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    // Debounce search
    const timer = setTimeout(() => fetchImages(value), 300);
    return () => clearTimeout(timer);
  };

  const handleDelete = async (id: number) => {
    try {
      await api.deleteImage(id);
      setImages((prev) => prev.filter((img) => img.id !== id));
      if (selectedImage?.id === id) {
        setSelectedImage(null);
        setImageDetails(null);
      }
      toast.success("Image deleted");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleImageClick = async (image: GeneratedImage) => {
    setSelectedImage(image);
    setIsLoadingDetails(true);
    try {
      const details = await api.getImage(image.id);
      setImageDetails(details);
    } catch (err) {
      toast.error("Failed to load image details");
      // Fallback to the image from list
      setImageDetails(image);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Gallery</h1>
          <p className="text-muted-foreground">View and Download your generated masterpieces</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search by prompt..."
            className="pl-10 bg-secondary/50 border-border/50"
          />
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : images.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {images.map((image) => (
            <Dialog key={image.id}>
              <div className="group glass rounded-xl overflow-hidden">
                {/* Image */}
                <DialogTrigger asChild>
                  <div 
                    className="aspect-square cursor-pointer relative overflow-hidden"
                    onClick={() => handleImageClick(image)}
                  >
                    <img
                      src={getImageUrl(image.generated_image_url || image.url || '')}
                      alt={image.user_intent || image.prompt || 'Generated image'}
                      className="w-full h-full object-cover"
                    />
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <ZoomIn className="w-8 h-8 text-primary" />
                    </div>
                  </div>
                </DialogTrigger>

                {/* Info */}
                <div className="p-4">
                  <p className="text-sm text-foreground line-clamp-2 mb-2">
                    {image.user_intent || image.prompt || 'No description'}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {formatDate(image.created_at)}
                    </span>
                    <div className="flex gap-1">
                      <a 
                        href={getImageUrl(image.generated_image_url || image.url || '')} 
                        download
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button variant="ghost" size="icon" className="w-8 h-8 text-muted-foreground hover:text-primary">
                          <Download className="w-4 h-4" />
                        </Button>
                      </a>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8 text-muted-foreground hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(image.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal */}
              <DialogContent className="max-w-4xl glass border-border/50 max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Image Details</DialogTitle>
                  <DialogDescription>
                    View full details and metadata for this generated image
                  </DialogDescription>
                </DialogHeader>
                
                {isLoadingDetails ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  </div>
                ) : imageDetails ? (
                  <div className="space-y-6">
                    {/* Image */}
                    <div className="rounded-lg overflow-hidden border border-border/50">
                      <img
                        src={getImageUrl(imageDetails.generated_image_url || imageDetails.url || '')}
                        alt={imageDetails.user_intent || imageDetails.prompt || 'Generated image'}
                        className="w-full h-auto"
                      />
                    </div>

                    {/* Details */}
                    <div className="grid md:grid-cols-2 gap-4">
                      {/* Basic Info */}
                      <div className="space-y-3">
                        <h3 className="font-semibold text-foreground flex items-center gap-2">
                          <Info className="w-4 h-4" />
                          Information
                        </h3>
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Description:</span>
                            <p className="text-foreground mt-1">
                              {imageDetails.user_intent || imageDetails.prompt || 'No description'}
                            </p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Shot Type:</span>
                            <p className="text-foreground mt-1">
                              {getShotTypeLabel(imageDetails.shot_type)}
                            </p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Style:</span>
                            <p className="text-foreground mt-1 capitalize">
                              {imageDetails.style || 'N/A'}
                            </p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Angle:</span>
                            <p className="text-foreground mt-1">
                              {imageDetails.angle || 'N/A'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Metadata */}
                      <div className="space-y-3">
                        <h3 className="font-semibold text-foreground flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          Metadata
                        </h3>
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Generated:</span>
                            <p className="text-foreground mt-1">
                              {formatDate(imageDetails.created_at)}
                            </p>
                          </div>
                          {imageDetails.brand_preset_id && (
                            <div>
                              <span className="text-muted-foreground">Preset ID:</span>
                              <p className="text-foreground mt-1">
                                #{imageDetails.brand_preset_id}
                              </p>
                            </div>
                          )}
                          {imageDetails.structured_prompt && (
                            <div>
                              <span className="text-muted-foreground">Structured Prompt:</span>
                              <pre className="text-xs text-foreground mt-1 p-2 bg-secondary/50 rounded overflow-auto max-h-32">
                                {JSON.stringify(imageDetails.structured_prompt, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-4 border-t border-border/50">
                      <Button
                        onClick={() => {
                          const url = getImageUrl(imageDetails.generated_image_url || imageDetails.url || '');
                          window.open(url, '_blank');
                        }}
                        className="flex-1"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download Image
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => {
                          handleDelete(imageDetails.id);
                          setSelectedImage(null);
                          setImageDetails(null);
                        }}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <p className="text-muted-foreground">Failed to load image details</p>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          ))}
        </div>
      ) : (
        <div className="glass rounded-xl p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
            <Images className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">No images found</h3>
          <p className="text-muted-foreground">
            {searchQuery ? "Try a different search term" : "Start generating to build your gallery"}
          </p>
        </div>
      )}
    </div>
  );
};

export default Gallery;