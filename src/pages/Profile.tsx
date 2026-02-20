import React from 'react';
import { ProfileManagement } from '../components/profile/ProfileManagement';

const Profile = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <ProfileManagement />
      </div>
    </div>
  );
};

export default Profile;
