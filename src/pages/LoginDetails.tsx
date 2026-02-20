
import React, { useState } from 'react';
import { Navigation } from '../components/Navigation';
import { LoginDetailsCard } from '../components/admin/LoginDetailsCard';
import { LoginDetail } from '../components/admin/login-details/types';
import { toast } from '@/hooks/use-toast';

const LoginDetails = () => {
  // Mock login details for both students and admins with correct structure
  const [adminUsers, setAdminUsers] = useState<LoginDetail[]>([
    { name: "Admin User", email: "admin@inhalestays.com", role: "admin", password: "admin123", isDeleted: false },
    { name: "Manager User", email: "manager@inhalestays.com", role: "admin", password: "manager456", isDeleted: false },
  ]);

  const [studentUsers, setStudentUsers] = useState<LoginDetail[]>([
    { name: "Amit Kumar", email: "amit@example.com", role: "student", password: "student123", isDeleted: false },
    { name: "Priya Sharma", email: "priya@example.com", role: "student", password: "student456", isDeleted: false },
    { name: "Rahul Singh", email: "rahul@example.com", role: "student", password: "student789", isDeleted: false },
    { name: "Sunita Patel", email: "sunita@example.com", role: "student", password: "sunita123", isDeleted: false },
    { name: "Vikram Mehta", email: "vikram@example.com", role: "student", password: "vikram456", isDeleted: false },
    { name: "Neha Gupta", email: "neha@example.com", role: "student", password: "neha789", isDeleted: false },
    { name: "Rajesh Kumar", email: "rajesh@example.com", role: "student", password: "rajesh123", isDeleted: false }
  ]);

  // Handler functions
  const handleAddUser = (userType: 'admin' | 'student') => (user: LoginDetail) => {
    if (userType === 'admin') {
      setAdminUsers([...adminUsers, { ...user, isDeleted: false }]);
      toast({
        title: "Admin Added",
        description: `${user.name} has been added successfully.`
      });
    } else {
      setStudentUsers([...studentUsers, { ...user, isDeleted: false }]);
      toast({
        title: "Student Added",
        description: `${user.name} has been added successfully.`
      });
    }
  };

  const handleDeleteUser = (userType: 'admin' | 'student') => (user: LoginDetail) => {
    const updateUser = (u: LoginDetail) => 
      u.email === user.email ? { ...u, isDeleted: true } : u;
    
    if (userType === 'admin') {
      setAdminUsers(adminUsers.map(updateUser));
      toast({
        title: "Admin Deleted",
        description: `${user.name} has been moved to deleted.`
      });
    } else {
      setStudentUsers(studentUsers.map(updateUser));
      toast({
        title: "Student Deleted",
        description: `${user.name} has been moved to deleted.`
      });
    }
  };

  const handleRestoreUser = (userType: 'admin' | 'student') => (user: LoginDetail) => {
    const updateUser = (u: LoginDetail) => 
      u.email === user.email ? { ...u, isDeleted: false } : u;
    
    if (userType === 'admin') {
      setAdminUsers(adminUsers.map(updateUser));
      toast({
        title: "Admin Restored",
        description: `${user.name} has been restored successfully.`
      });
    } else {
      setStudentUsers(studentUsers.map(updateUser));
      toast({
        title: "Student Restored",
        description: `${user.name} has been restored successfully.`
      });
    }
  };

  const handleChangePassword = (userType: 'admin' | 'student') => (userId: string, newPassword: string) => {
    const updatePassword = (u: LoginDetail) => 
      u.email === userId ? { ...u, password: newPassword } : u;
    
    if (userType === 'admin') {
      setAdminUsers(adminUsers.map(updatePassword));
    } else {
      setStudentUsers(studentUsers.map(updatePassword));
    }
  };

  return (
    <div className="min-h-screen bg-accent/30">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-cabin-dark">Login Details</h1>
          <p className="text-cabin-dark/70">All available login credentials for testing</p>
        </div>
        
        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-serif font-bold mb-4">Admin Accounts</h2>
            <p className="text-muted-foreground mb-4">Demo accounts for testing the admin portal</p>
            <LoginDetailsCard 
              users={adminUsers}
              onAddUser={handleAddUser('admin')}
              onDeleteUser={handleDeleteUser('admin')}
              onRestoreUser={handleRestoreUser('admin')}
              onChangePassword={handleChangePassword('admin')}
            />
          </div>
          
          <div>
            <h2 className="text-xl font-serif font-bold mb-4">Student Accounts</h2>
            <p className="text-muted-foreground mb-4">Demo accounts for testing the student portal</p>
            <LoginDetailsCard 
              users={studentUsers}
              onAddUser={handleAddUser('student')}
              onDeleteUser={handleDeleteUser('student')}
              onRestoreUser={handleRestoreUser('student')}
              onChangePassword={handleChangePassword('student')}
            />
          </div>
        </div>
      </div>
      
      <footer className="bg-cabin-dark text-white py-8 mt-12">
        <div className="container mx-auto px-4">
          <div className="border-t border-white/20 mt-8 pt-8 text-center text-white/50 text-sm">
            <p>© 2025 Inhalestays. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LoginDetails;
