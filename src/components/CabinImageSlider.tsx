
import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Expand } from 'lucide-react';
import { getImageUrl } from '@/lib/utils';
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem, 
  CarouselNext, 
  CarouselPrevious 
} from "@/components/ui/carousel";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface CabinImageSliderProps {
  images: string[];
  className?: string;
}

export function CabinImageSlider({ images, className = '' }: CabinImageSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [api, setApi] = useState<any>(null);

  // If no images, show placeholder
  const imagesToShow = images.length > 0 
    ? images 
    : ['/placeholder.svg'];

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? imagesToShow.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === imagesToShow.length - 1 ? 0 : prev + 1));
  };

  const handleThumbnailClick = (index: number) => {
    setCurrentIndex(index);
    // If we have an API reference, scroll to the selected slide
    if (api) {
      api.scrollTo(index);
    }
  };

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  // Update carousel when currentIndex changes via thumbnails
  useEffect(() => {
    if (api) {
      api.scrollTo(currentIndex);
    }
  }, [currentIndex, api]);

  return (
    <div className={`${className} space-y-3`}>
      {/* Main carousel */}
      <Carousel 
        className="w-full relative" 
        setApi={setApi}
        opts={{
          loop: true,
          align: "start",
        }}
      >
        <CarouselContent>
          {imagesToShow.map((image, index) => (
            <CarouselItem key={index}>
              <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-muted">
                <img 
                  src={getImageUrl(image)} 
                  alt="" 
                  className="w-full h-full object-cover"
                  onClick={openModal}
                />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        
        {imagesToShow.length > 1 && (
          <>
            <CarouselPrevious 
              className="absolute left-2 -translate-y-1/2 bg-black/30 text-white hover:bg-black/50 border-none"
              onClick={() => {
                setCurrentIndex(prev => prev === 0 ? imagesToShow.length - 1 : prev - 1);
              }}
            />
            <CarouselNext 
              className="absolute right-2 -translate-y-1/2 bg-black/30 text-white hover:bg-black/50 border-none" 
              onClick={() => {
                setCurrentIndex(prev => prev === imagesToShow.length - 1 ? 0 : prev + 1);
              }}
            />
          </>
        )}
        
        <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-md">
          {currentIndex + 1} / {imagesToShow.length}
        </div>
      </Carousel>

      {/* Thumbnails */}
      {imagesToShow.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {imagesToShow.map((image, index) => (
            <div 
              key={index}
              className={`
                w-20 h-20 flex-shrink-0 rounded-md overflow-hidden border-2 cursor-pointer
                ${index === currentIndex ? 'border-primary' : 'border-transparent'}
                hover:opacity-90 transition-all
              `}
              onClick={() => handleThumbnailClick(index)}
            >
              <img 
                src={getImageUrl(image)} 
                alt={`Thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      )}

      {/* Fullscreen modal */}
      <Dialog open={isModalOpen} onOpenChange={closeModal}>
        <DialogContent className="max-w-4xl w-[90vw] p-1 bg-black border-none">
          <div className="relative h-[80vh] flex items-center justify-center">
            <img 
              src={getImageUrl(imagesToShow[currentIndex])} 
              alt="" 
              className="max-h-full max-w-full object-contain"
            />
            
            {imagesToShow.length > 1 && (
              <>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="absolute left-2 h-10 w-10 rounded-full bg-black/50 text-white hover:bg-black/70"
                  onClick={handlePrevious}
                >
                  <ChevronLeft size={20} />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="absolute right-2 h-10 w-10 rounded-full bg-black/50 text-white hover:bg-black/70"
                  onClick={handleNext}
                >
                  <ChevronRight size={20} />
                </Button>
              </>
            )}
            
            <div className="absolute bottom-4 right-4 bg-black/50 text-white text-sm px-3 py-1 rounded-md">
              {currentIndex + 1} / {imagesToShow.length}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
