import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { User, MapPin } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export const ProfileCard = () => {
  const { user } = useAuth();
  const [isEditImageOpen, setIsEditImageOpen] = useState(false);
  const [isEditAddressOpen, setIsEditAddressOpen] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [selectedGender, setSelectedGender] = useState(localStorage.getItem('userGender') || '');
  const [address, setAddress] = useState<Address>(() => {
    const savedAddress = localStorage.getItem('userAddress');
    return savedAddress ? JSON.parse(savedAddress) : {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'India'
    };
  });
  
  const profileImage = localStorage.getItem('userProfileImage') || '';
  
  const handleImageUpdate = () => {
    if (newImageUrl.trim()) {
      localStorage.setItem('userProfileImage', newImageUrl);
      toast({
        title: "Profile Updated",
        description: "Your profile image has been updated successfully."
      });
      setIsEditImageOpen(false);
      
      // Save in user activity logs
      const userLogs = JSON.parse(localStorage.getItem('userActivityLogs') || '[]');
      const newLog = {
        id: `log-${Date.now()}`,
        userId: user?.id || "unknown",
        userName: user?.name || "Unknown User",
        userEmail: user?.email || "unknown@example.com",
        activity: "Updated profile picture",
        status: "Completed",
        timestamp: new Date().toISOString()
      };
      localStorage.setItem('userActivityLogs', JSON.stringify([...userLogs, newLog]));
    }
  };
  
  const handleGenderChange = (gender: string) => {
    setSelectedGender(gender);
    localStorage.setItem('userGender', gender);
    
    toast({
      title: "Profile Updated",
      description: "Your gender preference has been saved."
    });
    
    // Save in user activity logs
    const userLogs = JSON.parse(localStorage.getItem('userActivityLogs') || '[]');
    const newLog = {
      id: `log-${Date.now()}`,
      userId: user?.id || "unknown",
      userName: user?.name || "Unknown User",
      userEmail: user?.email || "unknown@example.com",
      activity: "Updated gender preference",
      status: "Completed",
      timestamp: new Date().toISOString()
    };
    localStorage.setItem('userActivityLogs', JSON.stringify([...userLogs, newLog]));
  };
  
  const handleAddressSave = () => {
    // Simple validation
    if (!address.street || !address.city || !address.state || !address.zipCode) {
      toast({
        title: "Validation Error",
        description: "Please fill all required address fields.",
        variant: "destructive"
      });
      return;
    }
    
    localStorage.setItem('userAddress', JSON.stringify(address));
    toast({
      title: "Address Updated",
      description: "Your address has been saved successfully."
    });
    setIsEditAddressOpen(false);
    
    // Save in user activity logs
    const userLogs = JSON.parse(localStorage.getItem('userActivityLogs') || '[]');
    const newLog = {
      id: `log-${Date.now()}`,
      userId: user?.id || "unknown",
      userName: user?.name || "Unknown User",
      userEmail: user?.email || "unknown@example.com",
      activity: "Updated address details",
      status: "Completed",
      timestamp: new Date().toISOString()
    };
    localStorage.setItem('userActivityLogs', JSON.stringify([...userLogs, newLog]));
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
        <CardDescription>Manage your personal details and preferences</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex flex-col items-center space-y-3">
            <Avatar className="h-24 w-24">
              {profileImage ? (
                <AvatarImage src={profileImage} alt={user?.name || "User"} />
              ) : (
                <AvatarFallback className={selectedGender === 'female' ? 'bg-pink-100' : 'bg-blue-100'}>
                  <User className={`h-12 w-12 ${selectedGender === 'female' ? 'text-pink-500' : 'text-blue-500'}`} />
                </AvatarFallback>
              )}
            </Avatar>
            
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={() => setIsEditImageOpen(true)}>
                Change Image
              </Button>
            </div>
            
            <div className="flex items-center space-x-3 mt-2">
              <button 
                className={`h-8 w-8 rounded-full flex items-center justify-center border-2 ${
                  selectedGender === 'male' 
                    ? 'bg-blue-100 border-blue-500' 
                    : 'bg-muted border-transparent'
                }`}
                onClick={() => handleGenderChange('male')}
              >
                <User className="h-4 w-4 text-blue-500" />
              </button>
              <button 
                className={`h-8 w-8 rounded-full flex items-center justify-center border-2 ${
                  selectedGender === 'female' 
                    ? 'bg-pink-100 border-pink-500' 
                    : 'bg-muted border-transparent'
                }`}
                onClick={() => handleGenderChange('female')}
              >
                <User className="h-4 w-4 text-pink-500" />
              </button>
            </div>
          </div>
          
          <div className="flex-1 space-y-4">
            <div>
              <Label className="text-muted-foreground text-sm">Full Name</Label>
              <p className="font-medium">{user?.name || "Student"}</p>
            </div>
            
            <div>
              <Label className="text-muted-foreground text-sm">Email</Label>
              <p className="font-medium">{user?.email || "student@example.com"}</p>
            </div>
            
            <div>
              <div className="flex items-center justify-between">
                <Label className="text-muted-foreground text-sm">Address</Label>
                <Button variant="link" size="sm" className="h-auto p-0" onClick={() => setIsEditAddressOpen(true)}>
                  {address.street ? 'Edit' : 'Add'} Address
                </Button>
              </div>
              
              {address.street ? (
                <div className="flex items-start space-x-2 text-sm">
                  <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p>{address.street}</p>
                    <p>{address.city}, {address.state} {address.zipCode}</p>
                    <p>{address.country}</p>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground italic text-sm">No address added</p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
      
      {/* Edit Image Dialog */}
      <Dialog open={isEditImageOpen} onOpenChange={setIsEditImageOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Profile Image</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="imageUrl">Image URL</Label>
              <Input 
                id="imageUrl" 
                placeholder="https://example.com/your-image.jpg" 
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Enter a URL to an image (jpg, png, etc.)</p>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsEditImageOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleImageUpdate}>
                Update Image
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Edit Address Dialog */}
      <Dialog open={isEditAddressOpen} onOpenChange={setIsEditAddressOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Address</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="street">Street Address</Label>
              <Input 
                id="street" 
                value={address.street}
                onChange={(e) => setAddress({...address, street: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input 
                id="city" 
                value={address.city}
                onChange={(e) => setAddress({...address, city: e.target.value})}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="state">State/Province</Label>
                <Input 
                  id="state" 
                  value={address.state}
                  onChange={(e) => setAddress({...address, state: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="zipCode">ZIP/Postal Code</Label>
                <Input 
                  id="zipCode" 
                  value={address.zipCode}
                  onChange={(e) => setAddress({...address, zipCode: e.target.value})}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input 
                id="country" 
                value={address.country}
                onChange={(e) => setAddress({...address, country: e.target.value})}
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsEditAddressOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddressSave}>
                Save Address
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
