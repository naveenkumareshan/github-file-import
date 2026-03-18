
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import {
  Phone, ArrowRight, CheckCircle2, Building, Hotel, UtensilsCrossed, Shirt,
  Users, MapPin, TrendingUp, BarChart2, Shield, Clock, Zap, Star,
  Smartphone, CreditCard, ClipboardCheck, Bell, ChevronDown, Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';

const PROPERTY_TYPES = [
  { key: 'reading_room', label: 'Reading Room', icon: Building, gradient: 'from-brand-blue to-brand-blue-light' },
  { key: 'hostel', label: 'Hostel / PG', icon: Hotel, gradient: 'from-brand-green to-brand-teal' },
  { key: 'mess', label: 'Mess / Food', icon: UtensilsCrossed, gradient: 'from-orange-500 to-amber-400' },
  { key: 'laundry', label: 'Laundry', icon: Shirt, gradient: 'from-purple-600 to-pink-500' },
];

const FEATURES: Record<string, { title: string; desc: string; icon: React.ComponentType<any> }[]> = {
  reading_room: [
    { title: 'Seat Map & Layout', desc: 'Visual seat management with real-time availability tracking', icon: MapPin },
    { title: 'Booking Automation', desc: 'Online bookings with auto-renewals and payment tracking', icon: Clock },
    { title: 'Due Management', desc: 'Automated due generation, payment reminders & collection', icon: CreditCard },
    { title: 'Attendance via QR', desc: 'QR-based attendance with live PIN for overdue students', icon: ClipboardCheck },
  ],
  hostel: [
    { title: 'Bed Map & Room View', desc: 'Floor-wise bed mapping with occupancy visualization', icon: Hotel },
    { title: 'Sharing Types', desc: 'Flexible 1/2/3/4-sharing with per-bed pricing', icon: Users },
    { title: 'Deposit Management', desc: 'Security deposits with refund tracking', icon: Shield },
    { title: 'Food Integration', desc: 'Link mess services directly to hostel bookings', icon: UtensilsCrossed },
  ],
  mess: [
    { title: 'Meal Subscriptions', desc: 'Daily, weekly, monthly plans with meal-type options', icon: UtensilsCrossed },
    { title: 'Attendance Tracking', desc: 'QR-based meal check-ins with meal-type auto-detection', icon: ClipboardCheck },
    { title: 'Menu Management', desc: 'Weekly rotating menus visible to subscribers', icon: Star },
    { title: 'Due & Receipt System', desc: 'Automated billing with receipt generation', icon: CreditCard },
  ],
  laundry: [
    { title: 'Order Management', desc: 'Track pickup, wash, iron, and delivery stages', icon: Shirt },
    { title: 'Item-wise Pricing', desc: 'Configurable pricing per item category', icon: CreditCard },
    { title: 'Agent Dashboard', desc: 'Dedicated mobile-friendly agent interface', icon: Smartphone },
    { title: 'Complaint Handling', desc: 'Built-in complaint system with resolution tracking', icon: Bell },
  ],
};

const PROCESS_STEPS = [
  { step: '01', title: 'Request a Demo', desc: 'Fill the form below with your details', color: 'from-brand-blue to-brand-blue-light' },
  { step: '02', title: 'We Call You', desc: 'Our team reaches out within 24 hours', color: 'from-brand-green to-brand-green-light' },
  { step: '03', title: 'Setup & Onboard', desc: 'We configure your property in under 48 hours', color: 'from-brand-teal to-brand-teal-light' },
  { step: '04', title: 'Go Live', desc: 'Start managing bookings and collecting payments', color: 'from-orange-500 to-amber-400' },
];

const FAQS = [
  { q: 'How much does it cost to partner?', a: 'We offer flexible plans starting from free. Contact us for a custom quote based on your property size and needs.' },
  { q: 'How long does setup take?', a: 'Typically under 48 hours. We handle the complete setup — rooms, seats, pricing, and payment configuration.' },
  { q: 'Do I need technical knowledge?', a: 'Not at all! Our platform is designed for non-technical users. We also provide training and ongoing support.' },
  { q: 'Can I manage multiple properties?', a: 'Yes! You can manage reading rooms, hostels, mess, and laundry — all from one dashboard.' },
  { q: 'What payment methods are supported?', a: 'We support UPI, bank transfer, cash, and online payments via Razorpay integration.' },
  { q: 'Is there a mobile app?', a: 'Yes, students get a mobile-optimized web app. Partners get a full dashboard accessible from any device.' },
];

const PHONE_NUMBER = '+919876543210';

const STATS = [
  { value: '100+', label: 'Active Partners', bg: 'from-brand-blue to-brand-blue-light', icon: Users },
  { value: '25+', label: 'Cities', bg: 'from-brand-green to-brand-green-light', icon: MapPin },
  { value: '10,000+', label: 'Students Served', bg: 'from-brand-teal to-brand-teal-light', icon: Star },
  { value: '₹2Cr+', label: 'Revenue Processed', bg: 'from-orange-500 to-amber-400', icon: TrendingUp },
];

const WHY_ITEMS = [
  {
    icon: Star,
    title: "India's First Student Ecosystem",
    desc: "The only platform built exclusively for the Indian student housing market — covering reading rooms, hostels, mess, and laundry under one roof.",
    border: 'border-l-brand-blue',
    iconBg: 'from-brand-blue to-brand-blue-light',
  },
  {
    icon: MapPin,
    title: "Built for Bharat",
    desc: "Designed for Indian workflows: UPI payments, WhatsApp notifications, and pricing models that match how Indian students live.",
    border: 'border-l-brand-green',
    iconBg: 'from-brand-green to-brand-green-light',
  },
  {
    icon: Zap,
    title: "End-to-End, Not Piecemeal",
    desc: "No more juggling spreadsheets, WhatsApp groups, and cash registers. One dashboard to manage everything.",
    border: 'border-l-brand-teal',
    iconBg: 'from-brand-teal to-brand-teal-light',
  },
  {
    icon: Smartphone,
    title: "Student-First Experience",
    desc: "Students discover, book, pay, and manage their stay from their phone — the way Gen Z expects.",
    border: 'border-l-purple-500',
    iconBg: 'from-purple-500 to-pink-500',
  },
];

const COMMON_FEATURES = [
  { icon: BarChart2, title: 'Reports & Analytics', desc: 'Revenue, occupancy, and booking reports' },
  { icon: Bell, title: 'Notifications', desc: 'WhatsApp & email alerts for bookings' },
  { icon: Shield, title: 'Secure Payments', desc: 'Razorpay integration with settlement tracking' },
  { icon: Users, title: 'Employee Management', desc: 'Role-based access for your team' },
  { icon: Smartphone, title: 'Mobile First', desc: 'Works perfectly on any device' },
  { icon: Zap, title: 'Instant Setup', desc: 'Go live within 48 hours' },
];

const PartnerWithUs: React.FC = () => {
  const formRef = useRef<HTMLDivElement>(null);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', city: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [featureFilter, setFeatureFilter] = useState('reading_room');

  const scrollToForm = () => formRef.current?.scrollIntoView({ behavior: 'smooth' });

  const toggleType = (key: string) => {
    setSelectedTypes(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) {
      toast({ title: 'Please fill required fields', variant: 'destructive' });
      return;
    }
    if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, '').slice(-10))) {
      toast({ title: 'Please enter a valid 10-digit phone number', variant: 'destructive' });
      return;
    }
    if (selectedTypes.length === 0) {
      toast({ title: 'Please select at least one property type', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from('partner_enquiries' as any).insert({
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim() || null,
        city: formData.city.trim() || null,
        property_types: selectedTypes,
        message: formData.message.trim() || null,
      });
      if (error) throw error;
      toast({ title: '🎉 Demo request submitted!', description: 'Our team will reach out to you within 24 hours.' });
      setFormData({ name: '', phone: '', email: '', city: '', message: '' });
      setSelectedTypes([]);
    } catch (err: any) {
      toast({ title: 'Something went wrong', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-hero py-20 md:py-28 px-4">
        {/* Decorative blobs */}
        <div className="absolute top-10 left-10 w-72 h-72 bg-brand-teal/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-brand-green/15 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-blue-light/10 rounded-full blur-3xl" />

        <div className="max-w-4xl mx-auto text-center space-y-8 relative z-10">
          <Badge className="bg-white/15 text-white border-white/25 text-sm px-5 py-1.5 backdrop-blur-sm animate-fade-in">
            <Sparkles className="h-3.5 w-3.5 mr-1.5" />
            🇮🇳 India's First Complete Student Living Ecosystem
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight animate-fade-in">
            India's First{' '}
            <span className="bg-gradient-to-r from-brand-teal-light via-brand-green-light to-brand-teal bg-clip-text text-transparent">
              All-in-One Platform
            </span>
            <br />for Student Living
          </h1>
          <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto animate-fade-in">
            The only platform in India that unifies reading rooms, hostels, PGs, mess, and laundry — so you can automate bookings, collect payments, and delight students from a single dashboard.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in">
            <Button
              size="lg"
              onClick={scrollToForm}
              className="gap-2 w-full sm:w-auto bg-white text-brand-navy hover:bg-white/90 font-semibold text-base px-8 shadow-brand-lg hover-lift"
            >
              Request a Demo <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="gap-2 w-full sm:w-auto border-white/40 text-white hover:bg-white/15 backdrop-blur-sm text-base px-8"
            >
              <a href={`tel:${PHONE_NUMBER}`}>
                <Phone className="h-4 w-4" /> Call Us Now
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-14 px-4 -mt-10 relative z-20">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          {STATS.map((s, i) => (
            <div
              key={s.label}
              className={`bg-gradient-to-br ${s.bg} rounded-2xl p-5 text-center text-white shadow-brand hover-lift animate-fade-in`}
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <s.icon className="h-6 w-6 mx-auto mb-2 opacity-70" />
              <p className="text-2xl md:text-3xl font-bold">{s.value}</p>
              <p className="text-sm opacity-85 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why InhaleStays */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto space-y-10">
          <div className="text-center space-y-3">
            <Badge className="bg-gradient-to-r from-brand-blue to-brand-teal text-white border-0 text-sm px-5 py-1.5">
              Why InhaleStays?
            </Badge>
            <h2 className="text-2xl md:text-4xl font-bold text-foreground">
              India's Only <span className="gradient-text">End-to-End</span> Student Ecosystem
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              No other platform in India covers the entire student living journey — from study spaces to food to laundry.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            {WHY_ITEMS.map((item, i) => (
              <Card
                key={i}
                className={`border-l-4 ${item.border} shadow-card hover:shadow-card-hover transition-all duration-300 hover:scale-[1.02] animate-fade-in`}
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <CardContent className="p-6 flex gap-4 items-start">
                  <div className={`p-2.5 rounded-xl bg-gradient-to-br ${item.iconBg} shrink-0`}>
                    <item.icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-base">{item.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{item.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 bg-gradient-subtle">
        <div className="max-w-4xl mx-auto space-y-10">
          <div className="text-center space-y-3">
            <h2 className="text-2xl md:text-4xl font-bold text-foreground">
              Everything You Need, <span className="gradient-text">In One Platform</span>
            </h2>
            <p className="text-muted-foreground">Select your property type to see relevant features</p>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            {PROPERTY_TYPES.map(pt => (
              <Button
                key={pt.key}
                size="sm"
                onClick={() => setFeatureFilter(pt.key)}
                className={`gap-2 transition-all duration-300 ${
                  featureFilter === pt.key
                    ? `bg-gradient-to-r ${pt.gradient} text-white border-0 shadow-brand scale-105`
                    : 'bg-white text-muted-foreground border border-border hover:shadow-card'
                }`}
              >
                <pt.icon className="h-4 w-4" /> {pt.label}
              </Button>
            ))}
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {FEATURES[featureFilter]?.map((f, i) => {
              const pt = PROPERTY_TYPES.find(p => p.key === featureFilter)!;
              return (
                <Card
                  key={i}
                  className="border-t-4 border-t-transparent shadow-card hover:shadow-card-hover transition-all duration-300 hover:scale-[1.02] animate-fade-in overflow-hidden"
                  style={{
                    borderTopColor: featureFilter === 'reading_room' ? '#1E5A8A'
                      : featureFilter === 'hostel' ? '#6BBF59'
                      : featureFilter === 'mess' ? '#f97316'
                      : '#a855f7',
                    animationDelay: `${i * 0.08}s`,
                  }}
                >
                  <CardContent className="p-5 flex gap-4 items-start">
                    <div className={`p-2.5 rounded-xl bg-gradient-to-br ${pt.gradient} shrink-0`}>
                      <f.icon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{f.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{f.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Common features */}
          <div className="grid sm:grid-cols-3 gap-4 pt-4">
            {COMMON_FEATURES.map((f, i) => (
              <div key={i} className="flex gap-3 items-start p-4 rounded-xl bg-white shadow-card hover:shadow-card-hover transition-all duration-300 hover:scale-[1.02]">
                <div className="p-2 rounded-lg bg-gradient-brand shrink-0">
                  <f.icon className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm">{f.title}</p>
                  <p className="text-xs text-muted-foreground">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto space-y-10">
          <div className="text-center space-y-3">
            <h2 className="text-2xl md:text-4xl font-bold text-foreground">
              How It <span className="gradient-text">Works</span>
            </h2>
            <p className="text-muted-foreground">Get started in just 4 simple steps</p>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6 relative">
            {/* Connecting line (desktop only) */}
            <div className="hidden md:block absolute top-10 left-[12%] right-[12%] h-0.5 bg-gradient-to-r from-brand-blue via-brand-green to-brand-teal opacity-30" />
            {PROCESS_STEPS.map((s, i) => (
              <div
                key={i}
                className="text-center space-y-3 relative animate-fade-in"
                style={{ animationDelay: `${i * 0.15}s` }}
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${s.color} text-white flex items-center justify-center mx-auto text-lg font-bold shadow-brand relative z-10`}>
                  {s.step}
                </div>
                <h3 className="font-semibold text-foreground text-base">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Form */}
      <section className="py-16 px-4 relative overflow-hidden" ref={formRef} id="demo-form">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand-blue/5 via-transparent to-brand-teal/5" />
        <div className="absolute top-0 right-0 w-72 h-72 bg-brand-green/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-brand-blue/10 rounded-full blur-3xl" />

        <div className="max-w-lg mx-auto space-y-6 relative z-10">
          <div className="text-center space-y-3">
            <Badge className="bg-gradient-to-r from-brand-green to-brand-teal text-white border-0 text-sm px-5 py-1.5">
              Free Demo
            </Badge>
            <h2 className="text-2xl md:text-4xl font-bold text-foreground">
              Request a <span className="gradient-text">Free Demo</span>
            </h2>
            <p className="text-muted-foreground text-sm">
              Fill in your details and we'll get back to you within 24 hours
            </p>
          </div>

          <Card className="shadow-brand-lg border-t-4 border-t-brand-blue overflow-hidden">
            <div className="h-2 bg-gradient-brand w-full" />
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground">Name *</label>
                  <Input
                    value={formData.name}
                    onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                    placeholder="Your full name"
                    maxLength={100}
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Phone *</label>
                  <Input
                    value={formData.phone}
                    onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))}
                    placeholder="10-digit mobile number"
                    maxLength={15}
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Email</label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                    placeholder="your@email.com"
                    maxLength={255}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">City</label>
                  <Input
                    value={formData.city}
                    onChange={e => setFormData(p => ({ ...p, city: e.target.value }))}
                    placeholder="Which city are you based in?"
                    maxLength={100}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Property Type(s) *</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {PROPERTY_TYPES.map(pt => (
                      <button
                        key={pt.key}
                        type="button"
                        onClick={() => toggleType(pt.key)}
                        className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border transition-all duration-300 ${
                          selectedTypes.includes(pt.key)
                            ? `bg-gradient-to-r ${pt.gradient} text-white border-transparent shadow-brand scale-105`
                            : 'bg-background text-muted-foreground border-border hover:border-primary/50 hover:shadow-card'
                        }`}
                      >
                        <pt.icon className="h-3.5 w-3.5" /> {pt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Message</label>
                  <Textarea
                    value={formData.message}
                    onChange={e => setFormData(p => ({ ...p, message: e.target.value }))}
                    placeholder="Tell us about your property or requirements..."
                    maxLength={1000}
                    rows={3}
                    className="mt-1"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full gap-2 bg-gradient-brand hover:opacity-90 text-white font-semibold text-base py-3 shadow-brand hover-lift"
                  disabled={submitting}
                >
                  {submitting ? 'Submitting...' : 'Request Demo'}
                  {!submitting && <ArrowRight className="h-4 w-4" />}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-4 bg-gradient-subtle">
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="text-center space-y-3">
            <h2 className="text-2xl md:text-4xl font-bold text-foreground">
              Frequently Asked <span className="gradient-text">Questions</span>
            </h2>
          </div>
          <Accordion type="single" collapsible className="w-full space-y-3">
            {FAQS.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="bg-white rounded-xl border shadow-card px-5 data-[state=open]:shadow-card-hover transition-shadow duration-300"
              >
                <AccordionTrigger className="text-left font-medium hover:text-brand-blue transition-colors">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="relative overflow-hidden py-16 px-4 bg-gradient-hero text-white">
        <div className="absolute top-0 right-0 w-80 h-80 bg-brand-teal/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-green/15 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        <div className="max-w-2xl mx-auto text-center space-y-5 relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold">Ready to Transform Your Business?</h2>
          <p className="text-white/80 text-lg">Join 100+ partners who trust InhaleStays to manage their properties</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              onClick={scrollToForm}
              className="gap-2 w-full sm:w-auto bg-white text-brand-navy hover:bg-white/90 font-semibold px-8 shadow-brand-lg hover-lift"
            >
              Get Started Free <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="gap-2 w-full sm:w-auto border-white/30 text-white hover:bg-white/15 backdrop-blur-sm px-8"
            >
              <a href={`tel:${PHONE_NUMBER}`}>
                <Phone className="h-4 w-4" /> {PHONE_NUMBER}
              </a>
            </Button>
          </div>
          <p className="text-sm text-white/60 pt-2">
            Already a partner? <Link to="/partner/login" className="underline text-white/80 hover:text-white">Sign in</Link>
          </p>
        </div>
      </section>
    </div>
  );
};

export default PartnerWithUs;
