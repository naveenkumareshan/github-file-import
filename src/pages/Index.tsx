import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  BookOpen, Hotel, Wifi, Shield, Clock, Coffee,
  Star, Users, ChevronRight, Leaf, CheckCircle
} from 'lucide-react';
import inhalestaysLogo from '@/assets/inhalestays-logo.png';
import { useAuth } from '@/contexts/AuthContext';

export default function Index() {
  const { user, isAuthenticated } = useAuth();

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  return (
    <div className="flex flex-col bg-background">
      {/* ── Hero ── */}
      <section className="relative bg-gradient-to-br from-primary via-primary/90 to-accent/80 text-white px-3 pt-4 pb-8 overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-secondary/20 rounded-full translate-y-1/2 -translate-x-1/4 blur-xl pointer-events-none" />

        <div className="relative max-w-lg mx-auto">
          <div className="flex items-center gap-2 mb-2">
            <img src={inhalestaysLogo} alt="InhaleStays" className="w-7 h-7 object-contain bg-white rounded-lg p-0.5" />
            <p className="text-white/80 text-[13px] font-medium">
              {isAuthenticated && user?.name ? `${greeting}, ${user.name.split(' ')[0]} 👋` : `${greeting} 👋`}
            </p>
          </div>

          <h1 className="text-xl font-bold leading-tight mb-1.5">
            Your Perfect Study Space
          </h1>
          <p className="text-white/75 text-[12px] mb-4 max-w-xs">
            Book reading rooms &amp; hostels designed for focused study and comfort.
          </p>

          {/* Quick Stats */}
          <div className="flex gap-2 mb-5">
            {[
              { label: '500+', sub: 'Students' },
              { label: '50+', sub: 'Rooms' },
              { label: '24/7', sub: 'Access' },
            ].map((s) => (
              <div key={s.sub} className="flex-1 bg-white/10 rounded-xl py-2 text-center">
                <p className="font-bold text-[13px] leading-none">{s.label}</p>
                <p className="text-white/70 text-[10px] mt-0.5">{s.sub}</p>
              </div>
            ))}
          </div>

          {/* CTA Tiles */}
          <div className="grid grid-cols-2 gap-2.5">
            <Link to="/cabins" className="block">
              <div className="bg-white text-primary rounded-2xl p-3 flex flex-col items-center gap-1.5 shadow-lg active:scale-95 transition-transform">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-primary" />
                </div>
                <span className="font-semibold text-[12px] text-center leading-tight">Book Reading Room</span>
                <ChevronRight className="w-3.5 h-3.5 text-primary/60" />
              </div>
            </Link>
            <Link to="/hostels" className="block">
              <div className="bg-secondary text-white rounded-2xl p-3 flex flex-col items-center gap-1.5 shadow-lg active:scale-95 transition-transform">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Hotel className="w-5 h-5 text-white" />
                </div>
                <span className="font-semibold text-[12px] text-center leading-tight">Find a Hostel</span>
                <ChevronRight className="w-3.5 h-3.5 text-white/60" />
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Why Choose Us ── */}
      <section className="px-3 py-4 bg-background">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-1.5 mb-3">
            <Leaf className="w-3.5 h-3.5 text-primary" />
            <h2 className="font-semibold text-[15px] text-foreground">Why InhaleStays?</h2>
          </div>

          <div className="flex gap-2.5 overflow-x-auto pb-2 -mx-3 px-3 scrollbar-hide">
            {[
              { icon: BookOpen, title: 'Premium Spaces', desc: 'Quiet, well-equipped rooms for focused study.', color: 'bg-primary/10 text-primary' },
              { icon: Shield, title: 'Safe & Secure', desc: '24/7 CCTV and secure access.', color: 'bg-secondary/10 text-secondary' },
              { icon: Clock, title: 'Open 24/7', desc: 'Study at any hour — always accessible.', color: 'bg-accent/30 text-primary' },
              { icon: Wifi, title: 'High-Speed WiFi', desc: 'Blazing fast internet at every desk.', color: 'bg-primary/10 text-primary' },
              { icon: Coffee, title: 'Amenities', desc: 'Ergonomic seating & charging points.', color: 'bg-secondary/10 text-secondary' },
            ].map((f) => (
              <Card key={f.title} className="flex-shrink-0 w-36 border-0 shadow-sm bg-card">
                <CardContent className="p-3 flex flex-col gap-1.5">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${f.color}`}>
                    <f.icon className="w-4 h-4" />
                  </div>
                  <p className="font-semibold text-[12px] text-foreground leading-tight">{f.title}</p>
                  <p className="text-muted-foreground text-[11px] leading-relaxed">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="px-3 py-4 bg-muted/40">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-1.5 mb-3">
            <Users className="w-3.5 h-3.5 text-secondary" />
            <h2 className="font-semibold text-[15px] text-foreground">How It Works</h2>
          </div>

          <div className="flex gap-2.5 overflow-x-auto pb-2 -mx-3 px-3 scrollbar-hide">
            {[
              { step: '1', title: 'Choose a Room', desc: 'Browse reading rooms or hostels near you.', from: 'from-primary', to: 'to-primary/60' },
              { step: '2', title: 'Select Your Seat', desc: 'Pick your favourite spot from the layout.', from: 'from-secondary', to: 'to-secondary/60' },
              { step: '3', title: 'Confirm & Enjoy', desc: 'Pay, receive confirmation, and arrive!', from: 'from-accent', to: 'to-accent/60' },
            ].map((s) => (
              <Card key={s.step} className="flex-shrink-0 w-40 border-0 shadow-sm bg-card">
                <CardContent className="p-3 flex flex-col gap-2">
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${s.from} ${s.to} flex items-center justify-center text-white font-bold text-[13px] shadow-sm`}>
                    {s.step}
                  </div>
                  <p className="font-semibold text-[12px] text-foreground">{s.title}</p>
                  <p className="text-muted-foreground text-[11px] leading-relaxed">{s.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="px-3 py-4 bg-background">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-1.5 mb-3">
            <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
            <h2 className="font-semibold text-[15px] text-foreground">What Students Say</h2>
          </div>

          <div className="flex gap-2.5 overflow-x-auto pb-2 -mx-3 px-3 scrollbar-hide">
            {[
              { name: 'Arjun Patel', role: 'Engineering Student', initial: 'A', review: 'Perfect quiet environment for studying. Booking is super easy!', color: 'bg-primary' },
              { name: 'Priya Sharma', role: 'CA Aspirant', initial: 'P', review: 'Amazing WiFi speed. Using InhaleStays for 6 months now!', color: 'bg-secondary' },
              { name: 'Rahul Kumar', role: 'Medical Student', initial: 'R', review: 'Clean, comfortable, affordable. 24/7 access is perfect.', color: 'bg-accent' },
            ].map((t) => (
              <Card key={t.name} className="flex-shrink-0 w-56 border-0 shadow-sm bg-card">
                <CardContent className="p-3 flex flex-col gap-1.5">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                  <p className="text-muted-foreground text-[11px] leading-relaxed">"{t.review}"</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className={`w-7 h-7 ${t.color} rounded-lg flex items-center justify-center text-white text-[10px] font-bold`}>
                      {t.initial}
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-foreground">{t.name}</p>
                      <p className="text-[10px] text-muted-foreground">{t.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="px-3 py-6 bg-gradient-to-br from-primary to-primary/80 text-white">
        <div className="max-w-lg mx-auto text-center space-y-3">
          <CheckCircle className="w-8 h-8 mx-auto text-secondary" />
          <h2 className="font-bold text-base">Ready to get started?</h2>
          <p className="text-white/75 text-[12px]">Join hundreds of students who trust InhaleStays for their study space.</p>
          <Link to="/cabins">
            <Button className="bg-white text-primary hover:bg-white/90 rounded-xl px-6 py-3 text-[13px] font-semibold shadow-lg w-full max-w-xs mx-auto">
              Explore Reading Rooms
              <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
