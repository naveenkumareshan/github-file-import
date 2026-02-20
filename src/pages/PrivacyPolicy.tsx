import React from 'react';
import { Shield, Lock, Eye, Database, Bell, Mail } from 'lucide-react';

const sections = [
  {
    icon: Database,
    title: 'Information We Collect',
    content: 'We collect information you provide directly to us, such as your name, email address, phone number, and payment information when you register for an account or make a booking. We also collect usage data automatically.',
  },
  {
    icon: Eye,
    title: 'How We Use Your Information',
    content: 'We use your information to provide, maintain, and improve our services, process transactions, send booking confirmations and reminders, and communicate with you about our services.',
  },
  {
    icon: Lock,
    title: 'Data Security',
    content: 'We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.',
  },
  {
    icon: Bell,
    title: 'Notifications',
    content: 'With your consent, we may send you push notifications about your bookings, upcoming renewals, and promotional offers. You can opt out at any time through your device settings.',
  },
  {
    icon: Mail,
    title: 'Contact Us',
    content: 'If you have questions about this Privacy Policy, please contact us at privacy@inhalestays.com.',
  },
];

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground px-4 pt-6 pb-8">
        <div className="max-w-lg mx-auto">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-3">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold mb-1">Privacy Policy</h1>
          <p className="text-primary-foreground/75 text-[13px]">Last updated: January 2025</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-3">
        <div className="bg-card rounded-2xl border p-4">
          <p className="text-[13px] text-muted-foreground leading-relaxed">
            At InhaleStays, we take your privacy seriously. This policy explains how we collect, use, and safeguard your personal information when you use our platform.
          </p>
        </div>

        {sections.map((s) => (
          <div key={s.title} className="bg-card rounded-2xl border p-4">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <s.icon className="w-4 h-4 text-primary" />
              </div>
              <h2 className="text-[14px] font-semibold text-foreground">{s.title}</h2>
            </div>
            <p className="text-[13px] text-muted-foreground leading-relaxed">{s.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
