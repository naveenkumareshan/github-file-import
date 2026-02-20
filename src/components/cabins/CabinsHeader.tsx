
import React from 'react';
import { BookOpen } from 'lucide-react';

export const CabinsHeader: React.FC = () => {
  return (
    <div className="text-center space-y-4">
      <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 text-sm">
        <BookOpen className="w-4 h-4" />
        <span>Premium Reading Spaces</span>
      </div>
      <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold">
        Our <span className="text-brand-green-light">Reading Rooms</span>
      </h1>
      <p className="text-white/85 max-w-2xl mx-auto text-lg">
        Browse our selection of reading rooms designed for different needs and preferences.
        Find the perfect space for your focused reading time.
      </p>
    </div>
  );
};