
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react';
import { Dialog, DialogContent } from './ui/dialog';
import { Button } from './ui/button';

interface ImageGalleryProps {
  images: string[];
  className?: string;
  showThumbnails?: boolean;
}

export function ImageGallery({ 
  images, 
  className = '', 
  showThumbnails = true 
}: ImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (images.length === 0) {
    return (
      <div className={`bg-gray-100 rounded-md flex items-center justify-center h-64 ${className}`}>
        <p className="text-gray-500">No images available</p>
      </div>
    );
  }

  const handlePrevious = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  return (
    <div className={`space-y-2 ${className}`}>
      <div 
        className="relative rounded-lg overflow-hidden bg-black aspect-video cursor-pointer"
        onClick={openModal}
      >
        <img 
          src={images[currentIndex]} 
          alt={`Gallery image ${currentIndex + 1}`} 
          className="w-full h-full object-contain"
        />
        
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-transparent opacity-0 hover:opacity-100 transition-opacity">
          <div className="absolute top-2 right-2">
            <Button 
              size="icon"
              variant="ghost"
              className="h-8 w-8 rounded-full bg-black/50 text-white hover:bg-black/70"
            >
              <ZoomIn size={16} />
            </Button>
          </div>
        </div>
        
        {images.length > 1 && (
          <>
            <Button 
              variant="ghost" 
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/50 text-white hover:bg-black/70"
              onClick={handlePrevious}
            >
              <ChevronLeft size={16} />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/50 text-white hover:bg-black/70"
              onClick={handleNext}
            >
              <ChevronRight size={16} />
            </Button>
          </>
        )}
        
        <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-md">
          {currentIndex + 1} / {images.length}
        </div>
      </div>

      {showThumbnails && images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <div 
              key={index}
              className={`
                w-16 h-16 flex-shrink-0 rounded-md overflow-hidden border-2 cursor-pointer
                ${index === currentIndex ? 'border-cabin-green' : 'border-transparent'}
              `}
              onClick={() => setCurrentIndex(index)}
            >
              <img 
                src={image} 
                alt={`Thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      )}

      <Dialog open={isModalOpen} onOpenChange={closeModal}>
        <DialogContent className="max-w-4xl w-[90vw] p-1 bg-black border-none">
          <div className="relative h-[80vh] flex items-center justify-center">
            <img 
              src={images[currentIndex]} 
              alt={`Gallery image ${currentIndex + 1}`} 
              className="max-h-full max-w-full object-contain"
            />
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute top-2 right-2 bg-black/50 text-white hover:bg-black/70 rounded-full"
              onClick={closeModal}
            >
              <X size={16} />
            </Button>
            
            {images.length > 1 && (
              <>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="absolute left-2 h-8 w-8 rounded-full bg-black/50 text-white hover:bg-black/70"
                  onClick={handlePrevious}
                >
                  <ChevronLeft size={16} />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="absolute right-2 h-8 w-8 rounded-full bg-black/50 text-white hover:bg-black/70"
                  onClick={handleNext}
                >
                  <ChevronRight size={16} />
                </Button>
              </>
            )}
            
            <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-md">
              {currentIndex + 1} / {images.length}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
