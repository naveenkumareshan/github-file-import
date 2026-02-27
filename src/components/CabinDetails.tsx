import React, { useRef, useState } from "react";
import { Cabin } from "../pages/BookSeat";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star, Clock } from "lucide-react";
import { ReviewsManager } from "./reviews/ReviewsManager";
import { CabinImageSlider } from './CabinImageSlider';
import { getTimingDisplay, getClosedDaysDisplay, ALL_DAYS, getFullDayName } from '@/utils/timingUtils';


interface CabinDetailsProps {
  cabin: Cabin | null;
}

export const CabinDetails: React.FC<CabinDetailsProps> = ({
  cabin
}) => {
  const [activeTab, setActiveTab] = useState("details");

  if (!cabin) return null;

    // Create an array of images for the slider
  const cabinImages = cabin.imageSrc 
    ? [cabin.imageSrc] 
    : [];
    
    // If cabin has additional images in an array, add them
    if (cabin.images && Array.isArray(cabin.images)) {
      cabinImages.push(...cabin.images);
    }

  return (
    <Card className="bg-white shadow-sm border border-border h-fit">
      <CardContent className="p-4 sm:p-6 h-fit">
        <div className="flex flex-col md:flex-row gap-4 sm:gap-6 items-start">
          
          {/* Left: Image */}
          <div className="w-full md:w-1/2">
            <CabinImageSlider images={cabinImages} />
          </div>
          {/* Right: Cabin Info */}
          <div className="w-full md:w-1/2 flex flex-col">
            <h2 className="text-lg sm:text-xl font-serif font-semibold mb-1 sm:mb-2 text-cabin-dark">
              {cabin.name}
            </h2>

            {/* Price + Category */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-3 sm:mb-4">
              <span className="text-base sm:text-lg font-medium text-cabin-dark">
                ₹{cabin.price}/month
              </span>
              <Badge
                variant="outline"
                className="w-fit bg-cabin-light/50 text-cabin-dark border-none"
              >
                {cabin.category.charAt(0).toUpperCase() + cabin.category.slice(1)}
              </Badge>
            </div>

            {/* Rating */}
            {cabin.averageRating > 0 && (
              <div className="flex items-center flex-wrap gap-2 mb-3">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < Math.floor(cabin.averageRating)
                          ? "fill-yellow-400 text-yellow-400"
                          : i < Math.ceil(cabin.averageRating) &&
                            cabin.averageRating % 1 > 0
                          ? "fill-yellow-400 text-yellow-400 opacity-50"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs sm:text-sm text-muted-foreground">
                  {cabin.averageRating.toFixed(1)} ({cabin.reviewCount} reviews)
                </span>
              </div>
            )}

            {/* Tabs */}
            <Tabs
              defaultValue="details"
              value={activeTab}
              onValueChange={setActiveTab}
              className="mt-1 sm:mt-2"
            >
              <TabsList className="mb-3 sm:mb-4 w-full overflow-x-auto justify-start">
                <TabsTrigger value="details" className="flex-1 sm:flex-none">
                  Details
                </TabsTrigger>
                <TabsTrigger value="reviews" className="flex-1 sm:flex-none">
                  Reviews
                </TabsTrigger>
              </TabsList>

              <TabsContent value="details">
                <p className="text-sm sm:text-base text-cabin-dark/70 mb-3 sm:mb-4">
                  {cabin.description}
                </p>

                {/* Timings */}
                {cabin.openingTime && cabin.closingTime && (
                  <div className="mb-3 sm:mb-4 p-3 bg-muted/50 rounded-lg">
                    <h3 className="text-sm font-medium mb-2 text-foreground flex items-center gap-1.5">
                      <Clock className="h-4 w-4" />
                      Timings
                    </h3>
                    <p className="text-sm text-foreground/80 mb-2">
                      {getTimingDisplay(cabin.openingTime, cabin.closingTime)}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {ALL_DAYS.map(day => {
                        const isOpen = cabin.workingDays?.includes(day) ?? true;
                        return (
                          <span
                            key={day}
                            className={`text-xs px-2 py-1 rounded-md font-medium ${
                              isOpen
                                ? 'bg-primary/10 text-primary'
                                : 'bg-destructive/10 text-destructive line-through'
                            }`}
                          >
                            {day}
                          </span>
                        );
                      })}
                    </div>
                    {getClosedDaysDisplay(cabin.workingDays) && (
                      <p className="text-xs text-destructive/80 mt-2">
                        {getClosedDaysDisplay(cabin.workingDays)}
                      </p>
                    )}
                  </div>
                )}

                <div className="mb-3 sm:mb-4">
                  <h3 className="text-sm sm:text-md font-medium mb-2 text-cabin-dark">
                    Amenities
                  </h3>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {cabin.amenities.map((amenity) => (
                      <li key={amenity} className="flex items-center text-sm">
                        <svg
                          className="w-4 h-4 mr-2 text-cabin-wood shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span className="break-words">{amenity}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </TabsContent>

              <TabsContent value="reviews">
                <ReviewsManager
                  entityType="Cabin"
                  entityId={cabin._id}
                  showForm={true}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
export default CabinDetails;
