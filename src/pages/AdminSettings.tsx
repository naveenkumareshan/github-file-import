
import React from 'react';
import { SiteSettingsForm } from '@/components/admin/SiteSettingsForm';

export default function AdminSettings() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Admin Settings</h1>
      <div className="grid gap-6">
        <SiteSettingsForm />
      </div>
    </div>
  );
}
