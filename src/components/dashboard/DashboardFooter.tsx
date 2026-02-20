
import React from 'react';

export const DashboardFooter: React.FC = () => {
  return (
    <footer className="bg-gradient-hero text-white py-8 mt-12">
      <div className="container mx-auto px-4">
        <div className="text-center text-white/60 text-sm">
          <p>© {new Date().getFullYear()} InhaleStays. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};