
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '../../contexts/AuthContext';

interface ProfileDialogsProps {
  isChangeNameOpen: boolean;
  setIsChangeNameOpen: (isOpen: boolean) => void;
  isChangePasswordOpen: boolean;
  setIsChangePasswordOpen: (isOpen: boolean) => void;
}

export const ProfileDialogs: React.FC<ProfileDialogsProps> = ({
  isChangeNameOpen,
  setIsChangeNameOpen,
  isChangePasswordOpen,
  setIsChangePasswordOpen
}) => {
  const { user, changeUserName, changeUserPassword } = useAuth();
  const [newName, setNewName] = useState('');
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleChangeName = async () => {
    if (!newName || newName.trim() === '') {
      toast({
        title: "Error",
        description: "Name cannot be empty.",
        variant: "destructive"
      });
      return;
    }
    
    const success = await changeUserName(newName);
    
    if (success) {
      toast({
        title: "Name Updated",
        description: "Your profile has been updated successfully."
      });
      setNewName('');
      setIsChangeNameOpen(false);
    } else {
      toast({
        title: "Error",
        description: "Failed to update name. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleChangePassword = async () => {
    // Validate password fields
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match.",
        variant: "destructive"
      });
      return;
    }
    
    if (passwords.newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long.",
        variant: "destructive"
      });
      return;
    }
    
    // Call the auth context function to update password
    const success = await changeUserPassword(passwords.currentPassword, passwords.newPassword);
    
    if (success) {
      toast({
        title: "Password Updated",
        description: "Your password has been changed successfully."
      });
      setPasswords({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setIsChangePasswordOpen(false);
    } else {
      toast({
        title: "Error",
        description: "Current password is incorrect or an error occurred.",
        variant: "destructive"
      });
    }
  };

  return (
    <>
      {/* Change Name Dialog */}
      <Dialog open={isChangeNameOpen} onOpenChange={setIsChangeNameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Your Name</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="currentName">Current Name</Label>
              <Input id="currentName" value={user?.name || "Student"} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newName">New Name</Label>
              <Input 
                id="newName" 
                value={newName} 
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Enter your new name" 
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsChangeNameOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleChangeName} className="bg-cabin-wood hover:bg-cabin-dark">
                Update Name
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Change Password Dialog */}
      <Dialog open={isChangePasswordOpen} onOpenChange={setIsChangePasswordOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input 
                id="currentPassword" 
                type="password" 
                value={passwords.currentPassword} 
                onChange={(e) => setPasswords({...passwords, currentPassword: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input 
                id="newPassword" 
                type="password"
                value={passwords.newPassword} 
                onChange={(e) => setPasswords({...passwords, newPassword: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input 
                id="confirmPassword" 
                type="password"
                value={passwords.confirmPassword} 
                onChange={(e) => setPasswords({...passwords, confirmPassword: e.target.value})}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsChangePasswordOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleChangePassword} className="bg-cabin-wood hover:bg-cabin-dark">
                Update Password
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
