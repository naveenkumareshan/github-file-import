
import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Target, Eye, BookOpen, Building2, Users, Shield, ChevronRight, Heart, Home } from "lucide-react";
import inhalestaysLogo from '@/assets/inhalestays-logo.png';

const About = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hero */}
      <section className="relative py-12 bg-gradient-to-br from-primary via-primary/90 to-accent/80 text-white overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/3 translate-x-1/3 blur-2xl pointer-events-none" />
        <div className="container mx-auto px-4 relative z-10 text-center space-y-3">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 text-sm">
            <Heart className="w-4 h-4" />
            <span>About Us</span>
          </div>
          <h1 className="text-3xl font-bold">About <span className="text-secondary-foreground/90">InhaleStays</span></h1>
          <p className="text-white/80 text-sm max-w-md mx-auto">
            Your Home Away From Home — Building futures through thoughtfully curated student living spaces.
          </p>
        </div>
      </section>

      <div className="flex-1">
        <div className="container mx-auto px-4 py-8 max-w-2xl space-y-6">

          {/* Our Story */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-lg font-bold text-foreground">Our Story</h2>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Founded in 2025, InhaleStays — an initiative of <b>DIGIM TECHNOLOGIES PRIVATE LIMITED</b> — was born out of a commitment to redefine student living. We create more than accommodation — we build community.
              </p>
              <p className="text-muted-foreground text-sm leading-relaxed">
                From quiet reading nooks to vibrant common areas, every aspect is designed with student comfort, security, and well-being at its core.
              </p>
            </CardContent>
          </Card>

          {/* Mission & Vision */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-5 space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-secondary/10 rounded-xl flex items-center justify-center">
                    <Target className="w-5 h-5 text-secondary" />
                  </div>
                  <h2 className="font-bold text-foreground">Our Mission</h2>
                </div>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  To provide an environment that supports academic growth, well-being, and a sense of belonging — a true home away from home.
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-5 space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-accent/20 rounded-xl flex items-center justify-center">
                    <Eye className="w-5 h-5 text-primary" />
                  </div>
                  <h2 className="font-bold text-foreground">Our Vision</h2>
                </div>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  To become India's most trusted name in student housing by setting a new benchmark for comfort, convenience, and care.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Reading Rooms */}
          <Card className="border-0 shadow-sm bg-gradient-to-br from-primary/5 to-secondary/5">
            <CardContent className="p-6 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-lg font-bold text-foreground">Our Reading Rooms</h2>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Quiet, well-lit, and ergonomically designed for focused study. Open 24/7 to match your academic rhythm — early bird or midnight scholar.
              </p>
              <div className="flex flex-wrap gap-3 pt-1">
                {['24/7 Access', 'Quiet Environment', 'Ergonomic Design'].map(f => (
                  <div key={f} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <div className="w-1.5 h-1.5 bg-secondary rounded-full" />
                    {f}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* PG Hostel */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-accent/20 rounded-xl flex items-center justify-center">
                  <Home className="w-5 h-5 text-primary" />
                </div>
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-foreground">PG Hostel Stay</h2>
                  <span className="bg-secondary/10 text-secondary text-[10px] font-medium px-2 py-0.5 rounded-full">Coming Soon</span>
                </div>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Safe havens with focus on hygiene, security, and comfort. Modern amenities and a range of accommodation options to suit every budget.
              </p>
            </CardContent>
          </Card>

          {/* CTA */}
          <Card className="border-0 shadow-brand-lg bg-gradient-to-br from-primary to-primary/80 text-white overflow-hidden">
            <CardContent className="p-6 text-center space-y-4">
              <img src={inhalestaysLogo} alt="InhaleStays" className="w-14 h-14 object-contain bg-white rounded-xl p-2 mx-auto" />
              <h2 className="font-bold text-lg">Join the InhaleStays Community</h2>
              <p className="text-white/80 text-sm">We're not just providing rooms — we're building futures.</p>
              <Link to="/cabins">
                <Button className="bg-white text-primary hover:bg-white/90 rounded-xl px-6 w-full">
                  Explore Reading Rooms
                  <ChevronRight className="ml-1 w-4 h-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default About;
