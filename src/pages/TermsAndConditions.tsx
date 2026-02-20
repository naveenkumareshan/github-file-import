import React from 'react';
import { FileText, CreditCard, UserCheck, AlertTriangle, RotateCcw, Scale } from 'lucide-react';

const sections = [
  {
    icon: UserCheck,
    title: 'Eligibility',
    content: 'You must be at least 16 years old to use our services. By registering, you confirm that the information you provide is accurate and complete.',
  },
  {
    icon: CreditCard,
    title: 'Payments & Bookings',
    content: 'All bookings are subject to availability and payment confirmation. Prices include applicable taxes. We reserve the right to modify pricing with prior notice.',
  },
  {
    icon: RotateCcw,
    title: 'Cancellations & Refunds',
    content: 'Cancellations made 48 hours before the start date are eligible for a full refund. Cancellations made within 48 hours may be subject to a cancellation fee. No-shows are non-refundable.',
  },
  {
    icon: AlertTriangle,
    title: 'Rules of Conduct',
    content: 'Users must maintain a quiet and respectful environment. Any damage to property, disruptive behavior, or violation of our code of conduct may result in immediate termination of your booking without refund.',
  },
  {
    icon: Scale,
    title: 'Liability',
    content: 'InhaleStays is not liable for loss or theft of personal belongings. We provide a safe environment, but users are responsible for their own property.',
  },
  {
    icon: FileText,
    title: 'Contact',
    content: 'For questions about these Terms, please contact us at legal@inhalestays.com.',
  },
];

export default function TermsAndConditions() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="bg-gradient-to-br from-secondary to-secondary/70 text-secondary-foreground px-4 pt-6 pb-8">
        <div className="max-w-lg mx-auto">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-3">
            <FileText className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold mb-1">Terms &amp; Conditions</h1>
          <p className="text-secondary-foreground/75 text-[13px]">Last updated: January 2025</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-3">
        <div className="bg-card rounded-2xl border p-4">
          <p className="text-[13px] text-muted-foreground leading-relaxed">
            By accessing or using InhaleStays, you agree to be bound by these Terms and Conditions. Please read them carefully before using our services.
          </p>
        </div>

        {sections.map((s) => (
          <div key={s.title} className="bg-card rounded-2xl border p-4">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-8 h-8 bg-secondary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <s.icon className="w-4 h-4 text-secondary" />
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
