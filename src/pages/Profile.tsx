import React from 'react';
import { Footer } from '../components/Footer';
import { ProfileManagement } from '../components/profile/ProfileManagement';

const Profile = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <ProfileManagement />
      </div>
    </div>
  );
};

export default Profile;
