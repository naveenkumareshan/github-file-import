import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from '@/hooks/use-toast';
import { User, Mail, Phone, MapPin, Camera, UserCheck, Building2, GraduationCap, PhoneIcon, MailIcon, AlertTriangle } from 'lucide-react';
import { userProfileService } from '@/api/userProfileService';
import { ImageUpload } from '../ImageUpload';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ProfileData {
  name: string;
  email: string;
  phone: string;
  alternatePhone: string;
  address: string;
  bio: string;
  courseStudying: string;
  collegeStudied: string;
  parentMobileNumber: string;
  userId: string;
  profilePicture: string;
  profileEditCount: number;
  remainingEdits?: number;
  remainingPhotoEdits?: number;
  gender:  string;
  city: string;
  state: string;
  pincode: string;
  dateOfBirth : string,
  coursePreparingFor: string;
}

export const ProfileManagement = () => {
  const [profile, setProfile] = useState<ProfileData>({
    name: '',
    email: '',
    phone: '',
    address: '',
    bio: '',
    courseStudying: '',
    collegeStudied: '',
    parentMobileNumber: '',
    userId: '',
    profilePicture: '',
    profileEditCount: 0,
    remainingPhotoEdits:0,
    gender:  '',
    city: '',
    state: '',
    pincode: '',
    alternatePhone: '',
    dateOfBirth : null,
    coursePreparingFor : ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await userProfileService.getUserProfile();
      if (response.success) {
        setProfile(response.data);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive"
      });
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const response = await userProfileService.updateProfile(profile);
      if (response.success) {
        toast({
          title: "Success",
          description: "Profile updated successfully"
        });
        setIsEditing(false);
      }else{
         toast({
          title: "Error",
          description: "Failed to update profile",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error updating profile:', error?.response?.data?.message);
      toast({
        title: "Error",
        description: error?.response?.data?.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (url: string) => {
    try {
      // const response = await userProfileService.uploadProfilePicture(url);
      // if (response.success) {
        setProfile(prev => ({ ...prev, profilePicture: url }));
        toast({
          title: "Success",
          description: "Profile picture updated successfully"
        });
      // }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Error",
        description: "Failed to upload profile picture",
        variant: "destructive"
      });
    }
  };
  const canEdit = profile.profileEditCount < 2;
  const remainingEdits = 2 - profile.profileEditCount;
  const remainingPhotoEdits = 2 - profile.remainingPhotoEdits;
  

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
 <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Management
          </CardTitle>
          
          {!canEdit && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                You have reached the maximum number of profile edits (2). No further changes are allowed.
              </AlertDescription>
            </Alert>
          )}
          
          {canEdit && remainingEdits <= 1 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                You have {remainingEdits} edit{remainingEdits !== 1 ? 's' : ''} remaining for your profile.
              </AlertDescription>
            </Alert>
          )}
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-6">
            {/* Profile Picture */}
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="h-32 w-32">
                <AvatarImage src={import.meta.env.VITE_BASE_URL+profile.profilePicture} alt={profile.name} />
                <AvatarFallback className="text-2xl">
                  {profile.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {(isEditing && remainingPhotoEdits <= 1) && (
                <div>
                   <ImageUpload
                      onUpload={handleImageUpload}
                      maxCount={1}
                    />
                </div>
              )}
            </div>

            {/* Profile Form */}
            <div className="flex-1 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">UserId : </Label> {profile.userId}
                </div>
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={profile.name}
                    onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                    disabled={!isEditing}
                  />
                </div>
                
                <div>
                  <Label htmlFor="email" className="flex items-center gap-1">
                    <MailIcon className="h-4 w-4" />Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                    disabled={!isEditing}
                  />
                </div>
                
                <div>
                   <Label htmlFor="phone" className="flex items-center gap-1">
                    <PhoneIcon className="h-4 w-4" />Phone
                  </Label>
                  <Input
                    id="phone"
                    value={profile.phone}
                    onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                   <Label htmlFor="phone" className="flex items-center gap-1">
                    <PhoneIcon className="h-4 w-4" />Alternate Phone
                  </Label>
                  <Input
                    id="alternativePhone"
                    value={profile.alternatePhone}
                    onChange={(e) => setProfile(prev => ({ ...prev, alternatePhone: e.target.value }))}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="courseStudying" className="flex items-center gap-1">
                    <GraduationCap className="h-4 w-4" />
                    DOB
                  </Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={profile.dateOfBirth}
                    onChange={(e) => setProfile(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="courseStudying" className="flex items-center gap-1">
                    <GraduationCap className="h-4 w-4" />
                    Course Preparing for
                  </Label>
                  <Input
                    id="coursePreparingFor"
                    value={profile.coursePreparingFor}
                    onChange={(e) => setProfile(prev => ({ ...prev, coursePreparingFor: e.target.value }))}
                    disabled={!isEditing}
                    placeholder="e.g., NEET"
                  />
                </div>
                <div>
                  <Label htmlFor="courseStudying" className="flex items-center gap-1">
                    <GraduationCap className="h-4 w-4" />
                    Course Studying
                  </Label>
                  <Input
                    id="courseStudying"
                    value={profile.courseStudying}
                    onChange={(e) => setProfile(prev => ({ ...prev, courseStudying: e.target.value }))}
                    disabled={!isEditing}
                    placeholder="e.g., B.Tech Computer Science"
                  />
                </div>
                <div>
                  <Label htmlFor="collegeStudied" className="flex items-center gap-1">
                    <Building2 className="h-4 w-4" />
                    College/University
                  </Label>
                  <Input
                    id="collegeStudied"
                    value={profile.collegeStudied}
                    onChange={(e) => setProfile(prev => ({ ...prev, collegeStudied: e.target.value }))}
                    disabled={!isEditing}
                    placeholder="Name of your college/university"
                  />
                </div>
                
                <div>
                  <Label htmlFor="parentMobileNumber" className="flex items-center gap-1">
                    <UserCheck className="h-4 w-4" />
                    Parent/Guardian Mobile
                  </Label>
                  <Input
                    id="parentMobileNumber"
                    value={profile.parentMobileNumber}
                    onChange={(e) => setProfile(prev => ({ ...prev, parentMobileNumber: e.target.value }))}
                    disabled={!isEditing}
                    placeholder="Emergency contact number"
                  />
                </div>
                
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={profile.address}
                    onChange={(e) => setProfile(prev => ({ ...prev, address: e.target.value }))}
                    disabled={!isEditing}
                    placeholder="Address"
                  />
                </div>
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={profile.city}
                    onChange={(e) =>
                      setProfile((prev) => ({ ...prev, city: e.target.value }))
                    }
                    disabled={!isEditing}
                     placeholder="City"
                  />
                </div>

                <div>
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={profile.state}
                    onChange={(e) =>
                      setProfile((prev) => ({ ...prev, state: e.target.value }))
                    }
                    disabled={!isEditing}
                    placeholder="State"

                  />
                </div>

                <div>
                  <Label htmlFor="pincode">Pincode</Label>
                  <Input
                    id="pincode"
                    value={profile.pincode}
                    onChange={(e) =>
                      setProfile((prev) => ({ ...prev, pincode: e.target.value }))
                    }
                    disabled={!isEditing}
                    placeholder="Pincode"

                  />
                </div>
                <div className="space-y-2">
                    <Label>Gender</Label>
                    <div className="flex items-center justify-center space-x-6 py-2">
                      <button 
                        type="button"
                        className={`flex flex-col items-center space-y-1 ${
                          profile.gender === 'male' ? 'text-blue-600' : 'text-muted-foreground'
                        }`}
                        onClick={() => setProfile(prev => ({ ...prev, gender:'male' }))}
                        disabled={!isEditing}
                      >
                        <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                          profile.gender === 'male' ? 'bg-blue-100 border-2 border-blue-500' : 'bg-muted'
                        }`}>
                          <User className="h-6 w-6 text-blue-500" />
                        </div>
                        <span className="text-sm font-medium">Male</span>
                      </button>
                      
                      <button 
                        type="button"
                        className={`flex flex-col items-center space-y-1 ${
                          profile.gender === 'female' ? 'text-pink-600' : 'text-muted-foreground'
                        }`}
                        disabled={!isEditing}
                        onClick={() => setProfile(prev => ({ ...prev, gender:'female' }))}
                      >
                        <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                          profile.gender === 'female' ? 'bg-pink-100 border-2 border-pink-500' : 'bg-muted'
                        }`}>
                          <User className="h-6 w-6 text-pink-500" />
                        </div>
                        <span className="text-sm font-medium">Female</span>
                      </button>
                    </div>
                  </div>
              </div>
              
              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={profile.bio}
                  onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                  disabled={!isEditing}
                  placeholder="Tell us about yourself..."
                  rows={3}
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                {!isEditing ? (
                  <Button onClick={() => setIsEditing(true)}>
                    Edit Profile
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false);
                        loadProfile();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={isLoading}
                    >
                      {isLoading ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};