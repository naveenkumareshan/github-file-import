
import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Building2 } from 'lucide-react';
import inhalestaysLogo from '@/assets/inhalestays-logo.png';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-gradient-hero text-white">
      <div className="container mx-auto px-4 py-12 lg:py-16">
        <div className="grid md:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center gap-3">
              <img src={inhalestaysLogo} alt="InhaleStays" className="w-12 h-12 object-contain bg-white rounded-xl p-1" />
              <span className="text-xl font-bold">InhaleStays</span>
            </div>
            <p className="text-white/70 text-sm leading-relaxed">
              Your Home Away From Home. Providing the perfect environment for focused reading, study, and personal growth.
            </p>
          </div>
          
          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4 text-brand-green-light">Quick Links</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/" className="text-white/70 hover:text-white transition-colors text-sm">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/cabins" className="text-white/70 hover:text-white transition-colors text-sm">
                  Reading Rooms
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-white/70 hover:text-white transition-colors text-sm">
                  About Us
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Contact */}
          <div className="md:col-span-2">
            <h4 className="font-semibold mb-4 text-brand-teal-light">Contact Us</h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <Building2 className="w-4 h-4 mt-1 text-brand-green-light flex-shrink-0" />
                <div className="text-white/70">
                  <p className="font-medium text-white">DIGIM TECHNOLOGIES PRIVATE LIMITED</p>
                  <p>Brand: InhaleStays</p>
                  <p>GST Number: 36AAJCD1524A1Z8</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 mt-1 text-brand-green-light flex-shrink-0" />
                <div className="text-white/70">
                  <p>Hilltons Prestige, Padmarao Nagar,</p>
                  <p>Musheerabad, Hyderabad – 500025</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-brand-green-light flex-shrink-0" />
                <span className="text-white/70">7799797961</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="border-t border-white/10 mt-10 pt-8 text-center">
          <p className="text-white/50 text-sm">
            © {new Date().getFullYear()} InhaleStays. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};