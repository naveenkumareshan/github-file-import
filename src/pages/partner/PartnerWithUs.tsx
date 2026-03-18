
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
  Smartphone, CreditCard, ClipboardCheck, Bell, ChevronDown
} from 'lucide-react';
import { Link } from 'react-router-dom';

const PROPERTY_TYPES = [
  { key: 'reading_room', label: 'Reading Room', icon: Building, color: 'bg-primary/10 text-primary' },
  { key: 'hostel', label: 'Hostel / PG', icon: Hotel, color: 'bg-secondary/10 text-secondary' },
  { key: 'mess', label: 'Mess / Food', icon: UtensilsCrossed, color: 'bg-orange-100 text-orange-700' },
  { key: 'laundry', label: 'Laundry', icon: Shirt, color: 'bg-purple-100 text-purple-700' },
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
  { step: '01', title: 'Request a Demo', desc: 'Fill the form below with your details' },
  { step: '02', title: 'We Call You', desc: 'Our team reaches out within 24 hours' },
  { step: '03', title: 'Setup & Onboard', desc: 'We configure your property in under 48 hours' },
  { step: '04', title: 'Go Live', desc: 'Start managing bookings and collecting payments' },
];

const FAQS = [
  { q: 'How much does it cost to partner?', a: 'We offer flexible	    plans starting from free. Contact us for a custom quote based on your property size and needs.' },
  { q: 'How long does setup take?', a: 'Typically under 48 hours. We handle the complete setup — rooms, seats, pricing, and payment configuration.' },
  { q: 'Do I need technical knowledge?', a: 'Not at all! Our platform is designed for non-technical users. We also provide training and ongoing support.' },
  { q: 'Can I manage multiple properties?', a: 'Yes! You can manage reading rooms, hostels, mess, and laundry — all from one dashboard.' },
  { q: 'What payment methods are supported?', a: 'We support UPI, bank transfer, cash, and online payments via Razorpay integration.' },
  { q: 'Is there a mobile app?', a: 'Yes, students get a mobile-optimized web app. Partners get a full dashboard accessible from any device.' },
];

const PHONE_NUMBER = '+919876543210';

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
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-secondary/5 py-16 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <Badge className="bg-secondary/10 text-secondary border-secondary/20 text-sm px-4 py-1">
            🇮🇳 India's First Complete Student Living Ecosystem
          </Badge>
          <h1 className="text-3xl md:text-5xl font-bold text-foreground leading-tight">
            India's First <span className="text-primary">All-in-One Platform</span> for Student Living
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            The only platform in India that unifies reading rooms, hostels, PGs, mess, and laundry — so you can automate bookings, collect payments, and delight students from a single dashboard.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button size="lg" onClick={scrollToForm} className="gap-2 w-full sm:w-auto">
              Request a Demo <ArrowRight className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" asChild className="gap-2 w-full sm:w-auto">
              <a href={`tel:${PHONE_NUMBER}`}>
                <Phone className="h-4 w-4" /> Call Us Now
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 px-4 border-b">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { value: '100+', label: 'Active Partners' },
            { value: '25+', label: 'Cities' },
            { value: '10,000+', label: 'Students Served' },
            { value: '₹2Cr+', label: 'Revenue Processed' },
          ].map(s => (
            <div key={s.label}>
              <p className="text-2xl md:text-3xl font-bold text-primary">{s.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              Everything You Need, In One Platform
            </h2>
            <p className="text-muted-foreground">Select your property type to see relevant features</p>
          </div>

          <div className="flex flex-wrap justify-center gap-2">
            {PROPERTY_TYPES.map(pt => (
              <Button
                key={pt.key}
                variant={featureFilter === pt.key ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFeatureFilter(pt.key)}
                className="gap-2"
              >
                <pt.icon className="h-4 w-4" /> {pt.label}
              </Button>
            ))}
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {FEATURES[featureFilter]?.map((f, i) => (
              <Card key={i} className="border-border/50">
                <CardContent className="p-5 flex gap-4 items-start">
                  <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                    <f.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{f.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{f.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Common features */}
          <div className="grid sm:grid-cols-3 gap-4 pt-4">
            {[
              { icon: BarChart2, title: 'Reports & Analytics', desc: 'Revenue, occupancy, and booking reports' },
              { icon: Bell, title: 'Notifications', desc: 'WhatsApp & email alerts for bookings' },
              { icon: Shield, title: 'Secure Payments', desc: 'Razorpay integration with settlement tracking' },
              { icon: Users, title: 'Employee Management', desc: 'Role-based access for your team' },
              { icon: Smartphone, title: 'Mobile First', desc: 'Works perfectly on any device' },
              { icon: Zap, title: 'Instant Setup', desc: 'Go live within 48 hours' },
            ].map((f, i) => (
              <div key={i} className="flex gap-3 items-start p-3">
                <f.icon className="h-5 w-5 text-secondary shrink-0 mt-0.5" />
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
      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-4xl mx-auto space-y-8">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-foreground">
            How It Works
          </h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6">
            {PROCESS_STEPS.map((s, i) => (
              <div key={i} className="text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto text-lg font-bold">
                  {s.step}
                </div>
                <h3 className="font-semibold text-foreground">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Form */}
      <section className="py-16 px-4" ref={formRef} id="demo-form">
        <div className="max-w-lg mx-auto space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              Request a Free Demo
            </h2>
            <p className="text-muted-foreground text-sm">
              Fill in your details and we'll get back to you within 24 hours
            </p>
          </div>

          <Card>
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
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">City</label>
                  <Input
                    value={formData.city}
                    onChange={e => setFormData(p => ({ ...p, city: e.target.value }))}
                    placeholder="Which city are you based in?"
                    maxLength={100}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Property Type(s) *</label>
                  <div className="flex flex-wrap gap-2 mt-1.5">
                    {PROPERTY_TYPES.map(pt => (
                      <button
                        key={pt.key}
                        type="button"
                        onClick={() => toggleType(pt.key)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-colors ${
                          selectedTypes.includes(pt.key)
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-background text-muted-foreground border-border hover:border-primary/50'
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
                  />
                </div>
                <Button type="submit" className="w-full gap-2" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Request Demo'}
                  {!submitting && <ArrowRight className="h-4 w-4" />}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-2xl mx-auto space-y-6">
          <h2 className="text-2xl font-bold text-center text-foreground">
            Frequently Asked Questions
          </h2>
          <Accordion type="single" collapsible className="w-full">
            {FAQS.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`}>
                <AccordionTrigger className="text-left">{faq.q}</AccordionTrigger>
                <AccordionContent>{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-12 px-4 bg-primary text-primary-foreground">
        <div className="max-w-2xl mx-auto text-center space-y-4">
          <h2 className="text-2xl font-bold">Ready to Transform Your Business?</h2>
          <p className="opacity-90">Join 100+ partners who trust InhaleStays to manage their properties</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button size="lg" variant="secondary" onClick={scrollToForm} className="gap-2 w-full sm:w-auto">
              Get Started Free <ArrowRight className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" asChild className="gap-2 w-full sm:w-auto border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
              <a href={`tel:${PHONE_NUMBER}`}>
                <Phone className="h-4 w-4" /> {PHONE_NUMBER}
              </a>
            </Button>
          </div>
          <p className="text-sm opacity-70 pt-2">
            Already a partner? <Link to="/partner/login" className="underline">Sign in</Link>
          </p>
        </div>
      </section>
    </div>
  );
};

export default PartnerWithUs;
