import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BookOpen, Hotel, Wifi, Shield, Clock, Coffee,
  Star, Users, ChevronRight, Leaf, CheckCircle,
  ClipboardList, Shirt, BookMarked, UtensilsCrossed,
} from 'lucide-react';

const WHY_FEATURES = [
  { icon: BookOpen, title: 'Premium Spaces', desc: 'Quiet, well-equipped rooms for focused study.', color: 'bg-primary/10 text-primary' },
  { icon: Shield, title: 'Safe & Secure', desc: '24/7 CCTV and secure access control.', color: 'bg-secondary/10 text-secondary' },
  { icon: Clock, title: 'Open 24/7', desc: 'Study at any hour — always accessible.', color: 'bg-accent/30 text-primary' },
  { icon: Wifi, title: 'High-Speed WiFi', desc: 'Blazing fast internet at every desk.', color: 'bg-primary/10 text-primary' },
  { icon: Coffee, title: 'Amenities', desc: 'Ergonomic seating & charging points.', color: 'bg-secondary/10 text-secondary' },
];

const WhyCarousel: React.FC = () => {
  const [idx, setIdx] = useState(0);
  const next = useCallback(() => setIdx((i) => (i + 1) % WHY_FEATURES.length), []);

  useEffect(() => {
    const t = setInterval(next, 5000);
    return () => clearInterval(t);
  }, [next]);

  const f = WHY_FEATURES[idx];
  return (
    <div className="space-y-2">
      <div className="relative overflow-hidden rounded-2xl">
        <Card className="border-0 shadow-sm bg-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${f.color}`}>
              <f.icon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-[13px] text-foreground">{f.title}</p>
              <p className="text-muted-foreground text-[11px] mt-0.5 leading-relaxed">{f.desc}</p>
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Dot indicators */}
      <div className="flex justify-center gap-1.5">
        {WHY_FEATURES.map((_, i) => (
          <button
            key={i}
            onClick={() => setIdx(i)}
            className={`h-1.5 rounded-full transition-all duration-300 ${i === idx ? 'w-4 bg-primary' : 'w-1.5 bg-muted-foreground/30'}`}
          />
        ))}
      </div>
    </div>
  );
};
import inhalestaysLogo from '@/assets/inhalestays-logo.png';
import { useAuth } from '@/contexts/AuthContext';
import { bookingsService } from '@/api/bookingsService';
import { differenceInDays, format } from 'date-fns';
import { HomeBanner } from '@/components/home/HomeBanner';

/* ─── Authenticated home view ───────────────────────────────────────── */
const AuthenticatedHome: React.FC<{ user: any }> = ({ user }) => {
  const [activeBooking, setActiveBooking] = useState<any>(null);
  const [loadingBooking, setLoadingBooking] = useState(true);
  const navigate = useNavigate();

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  useEffect(() => {
    (async () => {
      try {
        const res = await bookingsService.getCurrentBookings();
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          setActiveBooking(res.data[0]);
        }
      } finally {
        setLoadingBooking(false);
      }
    })();
  }, []);

  const daysLeft = activeBooking
    ? differenceInDays(new Date(activeBooking.end_date), new Date())
    : 0;

  const quickActions = [
    { icon: BookOpen, label: 'Reading Rooms', to: '/cabins', color: 'bg-primary/10 text-primary' },
    { icon: Hotel, label: 'Hostels', to: '/hostels', color: 'bg-secondary/10 text-secondary' },
    { icon: UtensilsCrossed, label: 'Mess', to: '/mess', color: 'bg-accent/30 text-primary' },
    { icon: Shirt, label: 'Laundry', to: '/laundry', color: 'bg-muted text-muted-foreground' },
  ];

  return (
    <div className="flex flex-col bg-background">
      {/* Greeting header */}
      <section className="bg-gradient-to-br from-primary via-primary/90 to-accent/80 text-primary-foreground px-4 pt-5 pb-6">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-2 mb-1">
            <img src={inhalestaysLogo} alt="InhaleStays" className="w-7 h-7 object-contain bg-white rounded-lg p-0.5" />
            <p className="text-primary-foreground/80 text-[12px]">InhaleStays</p>
          </div>
          <h1 className="text-[20px] font-bold leading-tight">
            {greeting}, {user?.name?.split(' ')[0] || 'Student'} 👋
          </h1>
          <p className="text-primary-foreground/70 text-[12px] mt-0.5">{user?.email}</p>
        </div>
      </section>

      <div className="px-4 py-4 max-w-lg mx-auto w-full space-y-4">
        {/* Active booking card */}
        <div>
          <p className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Current Booking</p>
          {loadingBooking ? (
            <Skeleton className="h-24 w-full rounded-2xl" />
          ) : activeBooking ? (
            <Card className="rounded-2xl border-0 shadow-md bg-card">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-foreground truncate">
                      {(activeBooking.cabins as any)?.name || 'Study Room'}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Seat #{activeBooking.seat_number} · Expires {format(new Date(activeBooking.end_date), 'd MMM')}
                    </p>
                    <p className="text-[11px] font-medium text-primary mt-1">
                      {daysLeft > 0 ? `${daysLeft} days remaining` : 'Expires today'}
                    </p>
                  </div>
                  <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                    <BookMarked className="w-5 h-5 text-primary" />
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-3 h-8 text-[12px] rounded-xl w-full"
                  onClick={() => navigate('/student/bookings')}
                >
                  View Details <ChevronRight className="w-3 h-3 ml-1" />
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="rounded-2xl border-dashed border-2 border-muted bg-transparent">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-[13px] font-medium text-foreground">No active booking</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Find a reading room near you</p>
                </div>
                <Link to="/cabins">
                  <Button size="sm" className="h-8 text-[12px] rounded-xl">
                    Book Now <ChevronRight className="w-3 h-3 ml-1" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Quick actions — 2x2 grid */}
        <div>
          <p className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Quick Actions</p>
          <div className="grid grid-cols-2 gap-2.5">
            {quickActions.map((a) => (
              <Link key={a.label} to={a.to} className="block">
                <div className="flex items-center gap-3 p-3 bg-card rounded-2xl border active:scale-95 transition-transform">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${a.color}`}>
                    <a.icon className="w-4 h-4" />
                  </div>
                  <span className="text-[12px] font-medium text-foreground leading-tight">{a.label}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Banner carousel — after quick actions */}
        <HomeBanner />

        {/* Why InhaleStays — auto carousel */}
        <WhyCarousel />
      </div>
    </div>
  );
};

/* ─── Public/guest marketing view ───────────────────────────────────── */
const SERVICES = [
  { icon: BookOpen, title: 'Reading Rooms', desc: 'Premium study spaces with AC, WiFi & ergonomic seating.', to: '/cabins', gradient: 'from-brand-blue to-brand-blue-light' },
  { icon: Hotel, title: 'Hostels', desc: 'Comfortable PG & hostel stays near your campus.', to: '/hostels', gradient: 'from-brand-teal to-brand-teal-light' },
  { icon: UtensilsCrossed, title: 'Mess & Food', desc: 'Hygienic, home-style meals at affordable prices.', to: '/mess', gradient: 'from-brand-green to-brand-green-light' },
  { icon: Shirt, title: 'Laundry', desc: 'Doorstep laundry pickup & delivery service.', to: '/laundry', gradient: 'from-purple-500 to-pink-400' },
];

const WHY_FEATURES_FULL = [
  { icon: BookOpen, title: 'Premium Spaces', desc: 'Quiet, well-equipped rooms designed for focused studying.', border: 'border-l-brand-blue', gradient: 'from-brand-blue to-brand-blue-light' },
  { icon: Shield, title: 'Safe & Secure', desc: '24/7 CCTV surveillance and secure biometric access control.', border: 'border-l-brand-green', gradient: 'from-brand-green to-brand-green-light' },
  { icon: Clock, title: 'Open 24/7', desc: 'Study any time — our spaces are always accessible.', border: 'border-l-brand-teal', gradient: 'from-brand-teal to-brand-teal-light' },
  { icon: Wifi, title: 'High-Speed WiFi', desc: 'Blazing fast internet at every desk and room.', border: 'border-l-purple-500', gradient: 'from-purple-500 to-pink-400' },
  { icon: Coffee, title: 'Modern Amenities', desc: 'Ergonomic furniture, charging points & refreshment zones.', border: 'border-l-orange-500', gradient: 'from-orange-500 to-amber-400' },
];

const GuestHome: React.FC = () => {
  return (
    <div className="flex flex-col bg-background">
      {/* ── Hero Section ── */}
      <section className="relative bg-gradient-hero text-white px-4 pt-8 pb-12 overflow-hidden">
        {/* Floating blobs */}
        <div className="absolute top-6 right-0 w-56 h-56 bg-brand-teal/20 rounded-full blur-3xl animate-float pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-brand-green/15 rounded-full blur-2xl animate-float pointer-events-none" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-1/2 left-1/3 w-28 h-28 bg-brand-blue-light/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative max-w-lg mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1 mb-4 animate-fade-in">
            <Leaf className="w-3.5 h-3.5 text-brand-green-light" />
            <span className="text-[11px] font-semibold tracking-wide uppercase">India's First Student Ecosystem</span>
          </div>

          <div className="flex items-center gap-2 mb-3">
            <img src={inhalestaysLogo} alt="InhaleStays" className="w-9 h-9 object-contain bg-white rounded-xl p-0.5 shadow-lg" />
            <span className="font-bold text-lg">InhaleStays</span>
          </div>

          <h1 className="text-2xl font-bold leading-tight mb-2 animate-fade-in">
            Your Complete<br />Student Living App
          </h1>
          <p className="text-white/75 text-[13px] mb-5 max-w-xs leading-relaxed">
            Reading rooms, hostels, mess & laundry — everything a student needs, in one app.
          </p>

          {/* App download buttons */}
          <div className="flex gap-2.5 mb-6">
            <a href="#" className="flex items-center gap-2 bg-white text-brand-navy rounded-xl px-4 py-2.5 shadow-brand hover:scale-105 transition-all duration-300">
              <Download className="w-4 h-4" />
              <div className="text-left">
                <p className="text-[9px] leading-none text-brand-navy/60">Download on</p>
                <p className="text-[12px] font-bold leading-tight">App Store</p>
              </div>
            </a>
            <a href="#" className="flex items-center gap-2 bg-white text-brand-navy rounded-xl px-4 py-2.5 shadow-brand hover:scale-105 transition-all duration-300">
              <Smartphone className="w-4 h-4" />
              <div className="text-left">
                <p className="text-[9px] leading-none text-brand-navy/60">Get it on</p>
                <p className="text-[12px] font-bold leading-tight">Google Play</p>
              </div>
            </a>
          </div>

          {/* Stats */}
          <div className="flex gap-2">
            {[
              { label: '500+', sub: 'Students', bg: 'bg-brand-blue/30' },
              { label: '50+', sub: 'Rooms', bg: 'bg-brand-green/30' },
              { label: '24/7', sub: 'Access', bg: 'bg-brand-teal/30' },
            ].map((s) => (
              <div key={s.sub} className={`flex-1 ${s.bg} backdrop-blur-sm rounded-xl py-2.5 text-center border border-white/10`}>
                <p className="font-bold text-[15px] leading-none">{s.label}</p>
                <p className="text-white/70 text-[10px] mt-0.5">{s.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Our Services ── */}
      <section className="px-4 py-6 bg-background">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-1.5 mb-1">
            <ClipboardList className="w-4 h-4 text-brand-blue" />
            <h2 className="font-bold text-[16px] text-foreground">Our Services</h2>
          </div>
          <p className="text-muted-foreground text-[12px] mb-4">Everything you need, all in one place.</p>

          <div className="grid grid-cols-2 gap-3">
            {SERVICES.map((s) => (
              <Link key={s.title} to={s.to} className="block">
                <div className={`relative bg-gradient-to-br ${s.gradient} rounded-2xl p-4 text-white shadow-brand hover:scale-105 transition-all duration-300 overflow-hidden min-h-[130px] flex flex-col justify-between`}>
                  <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/3 translate-x-1/3 blur-xl pointer-events-none" />
                  <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mb-2">
                    <s.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-[13px] leading-tight">{s.title}</p>
                    <p className="text-white/80 text-[10px] mt-0.5 leading-snug">{s.desc}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why InhaleStays ── */}
      <section className="px-4 py-6 bg-gradient-subtle">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-1.5 mb-1">
            <Leaf className="w-4 h-4 text-brand-green" />
            <h2 className="font-bold text-[16px] text-foreground">Why InhaleStays?</h2>
          </div>
          <p className="text-muted-foreground text-[12px] mb-4">Trusted by hundreds of students across India.</p>

          <div className="space-y-2.5">
            {WHY_FEATURES_FULL.map((f) => (
              <div key={f.title} className={`flex items-center gap-3 bg-card rounded-2xl p-3.5 border-l-4 ${f.border} shadow-card hover:shadow-card-hover hover:scale-[1.02] transition-all duration-300`}>
                <div className={`w-10 h-10 bg-gradient-to-br ${f.gradient} rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm`}>
                  <f.icon className="w-4.5 h-4.5 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-[13px] text-foreground">{f.title}</p>
                  <p className="text-muted-foreground text-[11px] leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="px-4 py-6 bg-background">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-1.5 mb-1">
            <Users className="w-4 h-4 text-brand-teal" />
            <h2 className="font-bold text-[16px] text-foreground">How It Works</h2>
          </div>
          <p className="text-muted-foreground text-[12px] mb-4">Get started in 3 simple steps.</p>

          <div className="relative space-y-3">
            {/* Connecting line */}
            <div className="absolute left-[22px] top-6 bottom-6 w-0.5 bg-gradient-to-b from-brand-blue via-brand-teal to-brand-green" />

            {[
              { step: '1', title: 'Choose a Service', desc: 'Browse reading rooms, hostels, mess or laundry near you.', gradient: 'from-brand-blue to-brand-blue-light' },
              { step: '2', title: 'Select & Customize', desc: 'Pick your seat, room, meal plan or laundry package.', gradient: 'from-brand-teal to-brand-teal-light' },
              { step: '3', title: 'Confirm & Enjoy', desc: 'Pay securely, get confirmation, and start using!', gradient: 'from-brand-green to-brand-green-light' },
            ].map((s) => (
              <div key={s.step} className="relative flex items-start gap-3.5 pl-0">
                <div className={`relative z-10 w-11 h-11 bg-gradient-to-br ${s.gradient} rounded-xl flex items-center justify-center text-white font-bold text-[14px] shadow-brand flex-shrink-0`}>
                  {s.step}
                </div>
                <div className="bg-card rounded-2xl p-3.5 flex-1 shadow-card border">
                  <p className="font-semibold text-[13px] text-foreground">{s.title}</p>
                  <p className="text-muted-foreground text-[11px] leading-relaxed mt-0.5">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="px-4 py-6 bg-gradient-subtle">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-1.5 mb-3">
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
            <h2 className="font-bold text-[16px] text-foreground">What Students Say</h2>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {[
              { name: 'Arjun Patel', role: 'Engineering Student', initial: 'A', review: 'Perfect quiet environment for studying. Booking is super easy!', gradient: 'from-brand-blue to-brand-blue-light', border: 'border-t-brand-blue' },
              { name: 'Priya Sharma', role: 'CA Aspirant', initial: 'P', review: 'Amazing WiFi speed. Using InhaleStays for 6 months now!', gradient: 'from-brand-green to-brand-green-light', border: 'border-t-brand-green' },
              { name: 'Rahul Kumar', role: 'Medical Student', initial: 'R', review: 'Clean, comfortable, affordable. 24/7 access is perfect.', gradient: 'from-brand-teal to-brand-teal-light', border: 'border-t-brand-teal' },
            ].map((t) => (
              <Card key={t.name} className={`flex-shrink-0 w-60 border-0 border-t-4 ${t.border} shadow-card bg-card`}>
                <CardContent className="p-4 flex flex-col gap-2">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />)}
                  </div>
                  <p className="text-muted-foreground text-[12px] leading-relaxed italic">"{t.review}"</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className={`w-9 h-9 bg-gradient-to-br ${t.gradient} rounded-xl flex items-center justify-center text-white text-[12px] font-bold shadow-sm`}>{t.initial}</div>
                    <div>
                      <p className="text-[12px] font-semibold text-foreground">{t.name}</p>
                      <p className="text-[10px] text-muted-foreground">{t.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── Download App CTA ── */}
      <section className="relative bg-gradient-to-br from-brand-green via-brand-teal to-brand-blue text-white px-4 py-8 overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl animate-float pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-brand-navy/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative max-w-lg mx-auto text-center">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Smartphone className="w-8 h-8" />
          </div>
          <h2 className="font-bold text-lg mb-1">Download the App</h2>
          <p className="text-white/80 text-[12px] mb-5 max-w-xs mx-auto">Get the full InhaleStays experience on your phone. Available on iOS & Android.</p>

          <div className="flex justify-center gap-3">
            <a href="#" className="flex items-center gap-2 bg-white text-brand-navy rounded-xl px-5 py-3 shadow-brand-lg hover:scale-105 transition-all duration-300">
              <Download className="w-4 h-4" />
              <div className="text-left">
                <p className="text-[9px] leading-none text-brand-navy/60">Download on</p>
                <p className="text-[13px] font-bold leading-tight">App Store</p>
              </div>
            </a>
            <a href="#" className="flex items-center gap-2 bg-white text-brand-navy rounded-xl px-5 py-3 shadow-brand-lg hover:scale-105 transition-all duration-300">
              <Smartphone className="w-4 h-4" />
              <div className="text-left">
                <p className="text-[9px] leading-none text-brand-navy/60">Get it on</p>
                <p className="text-[13px] font-bold leading-tight">Google Play</p>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* ── Footer CTA ── */}
      <section className="relative bg-gradient-to-br from-brand-navy to-primary text-white px-4 py-8 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-32 h-32 bg-brand-teal/15 rounded-full blur-2xl pointer-events-none" />

        <div className="relative max-w-lg mx-auto text-center space-y-3">
          <CheckCircle className="w-9 h-9 mx-auto text-brand-green-light" />
          <h2 className="font-bold text-lg">Ready to get started?</h2>
          <p className="text-white/75 text-[12px]">Join hundreds of students who trust InhaleStays for their study space & living needs.</p>
          <Link to="/cabins">
            <Button className="bg-white text-brand-navy hover:bg-white/90 rounded-xl px-6 py-3 text-[13px] font-bold shadow-brand-lg w-full max-w-xs mx-auto mt-2 hover:scale-105 transition-all duration-300">
              Explore Services <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

/* ─── Root export ────────────────────────────────────────────────────── */
export default function Index() {
  const { user, isAuthenticated } = useAuth();

  if (isAuthenticated) {
    const role = user?.role;
    if (role === 'vendor' || role === 'vendor_employee') {
      return <Navigate to="/partner/dashboard" replace />;
    }
    if (role === 'admin' || role === 'super_admin') {
      return <Navigate to="/admin/dashboard" replace />;
    }
    if (role === 'student') {
      return <AuthenticatedHome user={user} />;
    }
  }

  return <GuestHome />;
}
