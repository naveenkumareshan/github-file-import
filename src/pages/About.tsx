
import React from "react";
import { Navigation } from "../components/Navigation";
import { Footer } from "../components/Footer";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Target, Eye, BookOpen, Building2, Users, Shield, ChevronRight, Heart, Leaf, Home } from "lucide-react";
import inhalestaysLogo from '@/assets/inhalestays-logo.png';

const About = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />

      {/* Hero Section */}
      <section className="relative py-16 lg:py-24 bg-gradient-hero text-white overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-10 right-20 w-40 h-40 bg-brand-green/20 rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-20 w-60 h-60 bg-brand-teal/20 rounded-full blur-3xl" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 text-sm">
              <Heart className="w-4 h-4 text-brand-green-light" />
              <span>About Us</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold">
              About <span className="text-brand-green-light">InhaleStays</span>
            </h1>
            <p className="text-white/85 text-lg max-w-2xl mx-auto">
              Your Home Away From Home - Building futures through thoughtfully curated student living spaces.
            </p>
          </div>
        </div>
        
        {/* Wave Separator */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 80L60 73.3C120 66.7 240 53.3 360 46.7C480 40 600 40 720 43.3C840 46.7 960 53.3 1080 56.7C1200 60 1320 60 1380 60L1440 60V80H1380C1320 80 1200 80 1080 80C960 80 840 80 720 80C600 80 480 80 360 80C240 80 120 80 60 80H0Z" fill="hsl(200, 20%, 98%)"/>
          </svg>
        </div>
      </section>

      <div className="flex-1">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto space-y-12">
            
            {/* Our Story */}
            <Card className="border-0 shadow-card overflow-hidden">
              <CardContent className="p-8 lg:p-10">
                <div className="flex items-start gap-6">
                  <div className="hidden sm:flex w-16 h-16 bg-primary/10 rounded-2xl items-center justify-center flex-shrink-0">
                    <Building2 className="w-8 h-8 text-primary" />
                  </div>
                  <div className="space-y-4">
                    <h2 className="text-2xl font-bold text-foreground">Our Story</h2>
                    <p className="text-muted-foreground leading-relaxed">
                      Founded in 2025 by a visionary group, InhaleStays, an initiative of <b>DIGIM TECHNOLOGIES PRIVATE LIMITED</b>, was born out of a commitment to redefine student living. Recognizing the growing need for safe, supportive, and thoughtfully curated spaces, we set out to create more than just accommodation—we're building a community.
                    </p>
                    <p className="text-muted-foreground leading-relaxed">
                      From quiet reading nooks that encourage focus to vibrant common areas that foster meaningful connections, every aspect of InhaleStays is intentionally designed with student comfort, security, and well-being at its core. Our goal is to ensure that students don't just stay with us—they thrive with us.
                    </p>
                    <p className="text-muted-foreground leading-relaxed">
                      Backed by strong operational values and a technology-driven approach, InhaleStays aims to become a trusted name in student living across India.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Mission & Vision */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-0 shadow-card hover:shadow-card-hover transition-brand">
                <CardContent className="p-8">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center">
                      <Target className="w-6 h-6 text-secondary" />
                    </div>
                    <h2 className="text-xl font-bold text-foreground">Our Mission</h2>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    To provide students with more than just a place to stay. We aim to offer an environment that supports academic growth, personal well-being, and a sense of belonging—creating a true home away from home.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-card hover:shadow-card-hover transition-brand">
                <CardContent className="p-8">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center">
                      <Eye className="w-6 h-6 text-primary" />
                    </div>
                    <h2 className="text-xl font-bold text-foreground">Our Vision</h2>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    To become India's most trusted name in student housing by setting a new benchmark for comfort, convenience, and care. We envision a future where every student has access to quality accommodation that empowers them to thrive.
                  </p>
                </CardContent>
              </Card>
            </div>
            
            {/* Reading Rooms */}
            <Card className="border-0 shadow-card bg-gradient-to-br from-primary/5 to-secondary/5">
              <CardContent className="p-8 lg:p-10">
                <div className="flex items-start gap-6">
                  <div className="hidden sm:flex w-16 h-16 bg-primary/10 rounded-2xl items-center justify-center flex-shrink-0">
                    <BookOpen className="w-8 h-8 text-primary" />
                  </div>
                  <div className="space-y-4">
                    <h2 className="text-2xl font-bold text-foreground">Our Reading Rooms</h2>
                    <p className="text-muted-foreground leading-relaxed">
                      At InhaleStays, we understand the importance of focus and peace when it comes to learning. Our reading rooms are quiet, well-lit, and ergonomically designed to provide the perfect setting for study and reflection. Open 24/7, they're built to match your academic rhythm—whether you're an early riser or a midnight scholar.
                    </p>
                    <div className="grid sm:grid-cols-3 gap-4 pt-4">
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-2 h-2 bg-secondary rounded-full" />
                        <span className="text-muted-foreground">24/7 Access</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-2 h-2 bg-secondary rounded-full" />
                        <span className="text-muted-foreground">Quiet Environment</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-2 h-2 bg-secondary rounded-full" />
                        <span className="text-muted-foreground">Ergonomic Design</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* PG Hostel */}
            <Card className="border-0 shadow-card">
              <CardContent className="p-8 lg:p-10">
                <div className="flex items-start gap-6">
                  <div className="hidden sm:flex w-16 h-16 bg-accent/20 rounded-2xl items-center justify-center flex-shrink-0">
                    <Home className="w-8 h-8 text-primary" />
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <h2 className="text-2xl font-bold text-foreground">PG Hostel Stay</h2>
                      <span className="bg-secondary/10 text-secondary text-xs font-medium px-3 py-1 rounded-full">Coming Soon</span>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">
                      Our PG hostels are more than just rooms—they're safe havens. With a focus on hygiene, security, and comfort, every InhaleStays hostel is staffed with friendly professionals and equipped with modern amenities. We offer a range of accommodation options to suit different budgets, ensuring every student finds their fit.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Join Community */}
            <Card className="border-0 shadow-brand-lg bg-gradient-hero text-white overflow-hidden">
              <CardContent className="p-8 lg:p-10 relative">
                <div className="absolute top-0 right-0 w-40 h-40 bg-brand-green/20 rounded-full blur-3xl" />
                <div className="relative z-10 text-center space-y-6">
                  <div className="flex justify-center mb-4">
                    <img src={inhalestaysLogo} alt="InhaleStays" className="w-20 h-20 object-contain bg-white rounded-2xl p-2" />
                  </div>
                  <h2 className="text-2xl font-bold">Join the InhaleStays Community</h2>
                  <p className="text-white/85 max-w-xl mx-auto">
                    We're not just providing rooms—we're building futures. Welcome to stress-free student living.
                  </p>
                  <Link to="/cabins">
                    <Button 
                      size="lg" 
                      className="bg-white text-primary hover:bg-white/90 px-8 py-6 text-lg rounded-xl shadow-brand hover:shadow-brand-lg transition-brand group"
                    >
                      Explore Our Reading Rooms
                      <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default About;