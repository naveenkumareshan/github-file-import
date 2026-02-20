
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { BookOpen, Wifi, Shield, Clock, Coffee, Star, Users, MapPin, ChevronRight, Leaf, Home } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import inhalestaysLogo from '@/assets/inhalestays-logo.png';

interface SiteSettings {
  siteName: string;
  siteDescription: string;
  logoUrl: string;
  enabledMenus: {
    bookings: boolean;
    hostel: boolean;
    laundry: boolean;
    roomSharing: boolean;
    about: boolean;
  };
}

export default function Index() {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  const [settings] = useState<SiteSettings>({
    siteName: 'Inhalestays',
    siteDescription: 'Book your perfect stay',
    logoUrl: '',
    enabledMenus: {
      bookings: true,
      hostel: true,
      laundry: true,
      roomSharing: true,
      about: true,
    }
  });

  const handleFindNearMe = () => {
    if (navigator.geolocation) {
      toast({
        title: "Finding your location",
        description: "Please allow location access if prompted"
      });
      
      navigator.geolocation.getCurrentPosition(
        () => {
          navigate('/hostels?nearby=true');
        },
        (error) => {
          console.error('Geolocation error:', error);
          toast({
            title: "Location access denied",
            description: "We couldn't access your location. Please enable location services.",
            variant: "destructive"
          });
        }
      );
    } else {
      toast({
        title: "Location not supported",
        description: "Your browser doesn't support geolocation.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navigation />
      
      <div className="flex-1">
        {/* Hero Section */}
        <section className="relative min-h-[90vh] overflow-hidden bg-gradient-hero">
          {/* Decorative Elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-20 right-10 w-64 h-64 bg-brand-teal/20 rounded-full blur-3xl" />
            <div className="absolute bottom-20 left-10 w-80 h-80 bg-brand-green/20 rounded-full blur-3xl" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand-blue-light/10 rounded-full blur-3xl" />
          </div>
          
          <div className="container mx-auto px-4 py-16 lg:py-24 relative z-10 flex items-center min-h-[90vh]">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center w-full">
              {/* Left Content */}
              <div className="text-white space-y-8 animate-fade-in">
                <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 text-sm">
                  <Home className="w-4 h-4 text-brand-teal-light" />
                  <span>Your Home Away From Home</span>
                </div>
                
                <div className="space-y-4">
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight tracking-tight">
                    Find Your Perfect
                    <span className="block text-brand-green-light">Reading Space</span>
                  </h1>
                  <p className="text-lg sm:text-xl text-white/85 max-w-lg leading-relaxed">
                    Discover comfortable, quiet reading rooms designed for focused study, productivity, and peace of mind.
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link to="/cabins">
                    <Button 
                      size="lg" 
                      className="w-full sm:w-auto bg-secondary hover:bg-secondary/90 text-secondary-foreground px-8 py-6 text-lg rounded-xl shadow-brand hover:shadow-brand-lg transition-brand group"
                    >
                      Book Reading Room
                      <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                  <Link to="/about">
                    <Button 
                      variant="outline" 
                      size="lg" 
                      className="w-full sm:w-auto border-2 border-white/30 bg-white/5 backdrop-blur-sm text-white hover:bg-white/15 hover:border-white/50 px-8 py-6 text-lg rounded-xl transition-brand"
                    >
                      Learn More
                    </Button>
                  </Link>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-6 pt-8 border-t border-white/10">
                  <div className="text-center sm:text-left">
                    <div className="text-3xl sm:text-4xl font-bold text-brand-green-light">500+</div>
                    <div className="text-white/70 text-sm sm:text-base">Happy Students</div>
                  </div>
                  <div className="text-center sm:text-left">
                    <div className="text-3xl sm:text-4xl font-bold text-brand-teal-light">50+</div>
                    <div className="text-white/70 text-sm sm:text-base">Reading Rooms</div>
                  </div>
                  <div className="text-center sm:text-left">
                    <div className="text-3xl sm:text-4xl font-bold text-brand-green-light">24/7</div>
                    <div className="text-white/70 text-sm sm:text-base">Available</div>
                  </div>
                </div>
              </div>

              {/* Right Content - Visual */}
              <div className="relative hidden lg:block">
                <div className="relative z-10">
                  <div className="relative rounded-3xl overflow-hidden shadow-brand-lg">
                    <img 
                      src="https://images.unsplash.com/photo-1507842217343-583bb7270b66?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                      alt="Modern reading room"
                      className="w-full h-[500px] object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-brand-navy/40 to-transparent" />
                  </div>
                </div>
                
                {/* Floating Cards */}
                <div className="absolute -bottom-6 -left-6 bg-card rounded-2xl p-5 shadow-card-hover animate-float z-20">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-secondary-foreground" />
                    </div>
                    <div>
                      <div className="font-semibold text-foreground">Quiet Environment</div>
                      <div className="text-sm text-muted-foreground">Perfect for studying</div>
                    </div>
                  </div>
                </div>
                
                <div className="absolute -top-6 -right-6 bg-card rounded-2xl p-5 shadow-card-hover animate-float z-20" style={{ animationDelay: '1s' }}>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center">
                      <Wifi className="w-6 h-6 text-accent-foreground" />
                    </div>
                    <div>
                      <div className="font-semibold text-foreground">High-Speed WiFi</div>
                      <div className="text-sm text-muted-foreground">Always connected</div>
                    </div>
                  </div>
                </div>

                {/* Logo Badge */}
                <div className="absolute top-1/2 -left-12 -translate-y-1/2 bg-white rounded-2xl p-4 shadow-brand animate-float z-20" style={{ animationDelay: '0.5s' }}>
                  <img src={inhalestaysLogo} alt="InhaleStays" className="w-16 h-16 object-contain" />
                </div>
              </div>
            </div>
          </div>

          {/* Wave Separator */}
          <div className="absolute bottom-0 left-0 right-0">
            <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
              <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="hsl(200, 20%, 98%)"/>
            </svg>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 lg:py-28 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16 space-y-4">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-2 text-sm font-medium">
                <Leaf className="w-4 h-4" />
                Why Choose Us
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground">
                Why Choose <span className="text-primary">InhaleStays</span>?
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Experience the perfect blend of comfort, productivity, and convenience in our premium reading spaces.
              </p>
            </div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
              {[
                { icon: BookOpen, title: 'Premium Spaces', description: 'Modern, well-equipped rooms designed specifically for focused reading and studying.', color: 'primary' },
                { icon: Shield, title: 'Secure & Safe', description: '24/7 security and safe environment for all visitors with CCTV monitoring.', color: 'secondary' },
                { icon: Clock, title: '24/7 Available', description: 'Access your reading space anytime with our flexible booking system.', color: 'accent' },
                { icon: Coffee, title: 'Premium Amenities', description: 'High-speed WiFi, comfortable seating, charging points, and refreshments.', color: 'primary' }
              ].map((feature, index) => (
                <Card key={index} className="group border-0 shadow-card hover:shadow-card-hover transition-brand hover-lift bg-card">
                  <CardContent className="p-8 text-center">
                    <div className={`w-16 h-16 bg-${feature.color}/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform`}>
                      <feature.icon className={`w-8 h-8 text-${feature.color}`} />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-3">{feature.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20 lg:py-28 bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16 space-y-4">
              <div className="inline-flex items-center gap-2 bg-secondary/10 text-secondary rounded-full px-4 py-2 text-sm font-medium">
                <Users className="w-4 h-4" />
                Simple Process
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground">
                How It <span className="text-secondary">Works</span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Booking your perfect reading space is simple and straightforward.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8 lg:gap-12 max-w-5xl mx-auto relative">
              {/* Connection Lines */}
              <div className="hidden md:block absolute top-16 left-1/4 right-1/4 h-1 bg-gradient-to-r from-primary via-secondary to-accent rounded-full" />
              
              {[
                { step: 1, title: 'Choose Your Room', description: 'Browse our selection of reading rooms and choose one that fits your needs.', gradient: 'from-primary to-brand-blue-light' },
                { step: 2, title: 'Select Your Seat', description: 'View the room layout and select your preferred seat from available options.', gradient: 'from-secondary to-brand-green-light' },
                { step: 3, title: 'Confirm & Enjoy', description: 'Complete your booking, receive confirmation, and arrive to enjoy!', gradient: 'from-accent to-brand-teal-light' }
              ].map((item, index) => (
                <div key={index} className="text-center relative z-10">
                  <div className={`w-20 h-20 bg-gradient-to-br ${item.gradient} rounded-2xl flex items-center justify-center text-white font-bold text-2xl mx-auto mb-6 shadow-brand rotate-3 hover:rotate-0 transition-transform`}>
                    {item.step}
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-4">{item.title}</h3>
                  <p className="text-muted-foreground text-lg leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-20 lg:py-28 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16 space-y-4">
              <div className="inline-flex items-center gap-2 bg-accent/20 text-primary rounded-full px-4 py-2 text-sm font-medium">
                <Star className="w-4 h-4" />
                Testimonials
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground">
                What Our <span className="text-accent-foreground">Users Say</span>
              </h2>
              <p className="text-lg text-muted-foreground">Real experiences from our satisfied customers</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {[
                { name: 'Arjun Patel', role: 'Engineering Student', initial: 'A', color: 'primary', review: 'Perfect quiet environment for studying. The rooms are well-maintained and the booking system is super easy to use.' },
                { name: 'Priya Sharma', role: 'CA Aspirant', initial: 'P', color: 'secondary', review: "Amazing facilities and great WiFi speed. I've been using InhaleStays for 6 months now and it's been fantastic." },
                { name: 'Rahul Kumar', role: 'Medical Student', initial: 'R', color: 'accent', review: 'Clean, comfortable, and affordable. The 24/7 availability is perfect for my irregular study schedule.' }
              ].map((testimonial, index) => (
                <Card key={index} className="border-0 shadow-card hover:shadow-card-hover transition-brand bg-card">
                  <CardContent className="p-8">
                    <div className="flex items-center mb-4">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                      ))}
                    </div>
                    <p className="text-muted-foreground mb-6 leading-relaxed">"{testimonial.review}"</p>
                    <div className="flex items-center">
                      <div className={`w-12 h-12 bg-${testimonial.color} rounded-xl flex items-center justify-center text-${testimonial.color}-foreground font-bold mr-4`}>
                        {testimonial.initial}
                      </div>
                      <div>
                        <div className="font-semibold text-foreground">{testimonial.name}</div>
                        <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 lg:py-28 bg-gradient-hero text-white relative overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-10 right-20 w-40 h-40 bg-brand-green/20 rounded-full blur-3xl" />
            <div className="absolute bottom-10 left-20 w-60 h-60 bg-brand-teal/20 rounded-full blur-3xl" />
          </div>
          
          <div className="container mx-auto px-4 text-center relative z-10">
            <div className="max-w-3xl mx-auto space-y-8">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
                Ready to Find Your <span className="text-brand-green-light">Perfect Reading Space</span>?
              </h2>
              <p className="text-xl text-white/85 leading-relaxed">
                Join hundreds of satisfied students who have transformed their study experience with InhaleStays.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/cabins">
                  <Button 
                    size="lg" 
                    className="w-full sm:w-auto bg-white text-primary hover:bg-white/90 px-10 py-6 text-lg rounded-xl shadow-brand hover:shadow-brand-lg transition-brand group"
                  >
                    Get Started Today
                    <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link to="/about">
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="w-full sm:w-auto border-2 border-white/30 bg-transparent text-white hover:bg-white/10 px-10 py-6 text-lg rounded-xl transition-brand"
                  >
                    Contact Us
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
      
      <Footer />
    </div>
  );
}