import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from '@/hooks/use-toast';
import { User, MailIcon, PhoneIcon, GraduationCap, UserCheck, Building2, AlertTriangle } from 'lucide-react';
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
  gender: string;
  city: string;
  state: string;
  pincode: string;
  dateOfBirth: string;
  coursePreparingFor: string;
}

export const ProfileManagement = () => {
  const [profile, setProfile] = useState<ProfileData>({
    name: '', email: '', phone: '', address: '', bio: '',
    courseStudying: '', collegeStudied: '', parentMobileNumber: '',
    userId: '', profilePicture: '', profileEditCount: 0,
    remainingPhotoEdits: 0, gender: '', city: '', state: '',
    pincode: '', alternatePhone: '', dateOfBirth: null,
    coursePreparingFor: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => { loadProfile(); }, []);

  const loadProfile = async () => {
    try {
      const response = await userProfileService.getUserProfile();
      if (response.success) setProfile(response.data);
    } catch (error) {
      toast({ title: "Error", description: "Failed to load profile data", variant: "destructive" });
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const response = await userProfileService.updateProfile(profile);
      if (response.success) {
        toast({ title: "Success", description: "Profile updated successfully" });
        setIsEditing(false);
      } else {
        toast({ title: "Error", description: "Failed to update profile", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: error?.response?.data?.message, variant: "destructive" });
    } finally { setIsLoading(false); }
  };

  const handleImageUpload = async (url: string) => {
    try {
      setProfile(prev => ({ ...prev, profilePicture: url }));
      toast({ title: "Success", description: "Profile picture updated successfully" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to upload profile picture", variant: "destructive" });
    }
  };

  const canEdit = profile.profileEditCount < 2;
  const remainingEdits = 2 - profile.profileEditCount;
  const remainingPhotoEdits = 2 - profile.remainingPhotoEdits;

  return (
    <div className="max-w-lg mx-auto space-y-3 px-3 py-3">
      <Card className="rounded-2xl">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-[15px]">
            <User className="h-4 w-4" />
            Profile
          </CardTitle>

          {!canEdit && (
            <Alert variant="destructive" className="mt-2">
              <AlertTriangle className="h-3.5 w-3.5" />
              <AlertDescription className="text-[12px]">
                Maximum profile edits (2) reached. No further changes allowed.
              </AlertDescription>
            </Alert>
          )}

          {canEdit && remainingEdits <= 1 && (
            <Alert className="mt-2">
              <AlertTriangle className="h-3.5 w-3.5" />
              <AlertDescription className="text-[12px]">
                {remainingEdits} edit{remainingEdits !== 1 ? 's' : ''} remaining.
              </AlertDescription>
            </Alert>
          )}
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Avatar row */}
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20 flex-shrink-0">
              <AvatarImage src={import.meta.env.VITE_BASE_URL + profile.profilePicture} alt={profile.name} />
              <AvatarFallback className="text-xl">
                {profile.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-foreground">{profile.name || 'Your Name'}</p>
              <p className="text-[11px] text-muted-foreground truncate">{profile.email}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">ID: {profile.userId}</p>
              {isEditing && remainingPhotoEdits <= 1 && (
                <div className="mt-2">
                  <ImageUpload onUpload={handleImageUpload} maxCount={1} />
                </div>
              )}
            </div>
          </div>

          {/* Gender selector */}
          <div className="space-y-1.5">
            <Label className="text-[12px]">Gender</Label>
            <div className="flex gap-3">
              {['male', 'female'].map(g => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setProfile(prev => ({ ...prev, gender: g }))}
                  disabled={!isEditing}
                  className={`flex flex-col items-center gap-1 ${profile.gender === g ? (g === 'male' ? 'text-blue-600' : 'text-pink-600') : 'text-muted-foreground'}`}
                >
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                    profile.gender === g
                      ? g === 'male' ? 'bg-blue-100 border-2 border-blue-500' : 'bg-pink-100 border-2 border-pink-500'
                      : 'bg-muted'
                  }`}>
                    <User className={`h-5 w-5 ${g === 'male' ? 'text-blue-500' : 'text-pink-500'}`} />
                  </div>
                  <span className="text-[11px] font-medium capitalize">{g}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Form fields — single column */}
          <div className="grid grid-cols-1 gap-3">
            {[
              { id: 'name', label: 'Full Name', value: profile.name, key: 'name', icon: null },
              { id: 'email', label: 'Email', value: profile.email, key: 'email', icon: <MailIcon className="h-3.5 w-3.5" />, type: 'email' },
              { id: 'phone', label: 'Phone', value: profile.phone, key: 'phone', icon: <PhoneIcon className="h-3.5 w-3.5" /> },
              { id: 'alternatePhone', label: 'Alternate Phone', value: profile.alternatePhone, key: 'alternatePhone', icon: <PhoneIcon className="h-3.5 w-3.5" /> },
              { id: 'dateOfBirth', label: 'Date of Birth', value: profile.dateOfBirth, key: 'dateOfBirth', type: 'date' },
              { id: 'coursePreparingFor', label: 'Preparing For', value: profile.coursePreparingFor, key: 'coursePreparingFor', placeholder: 'e.g., NEET', icon: <GraduationCap className="h-3.5 w-3.5" /> },
              { id: 'courseStudying', label: 'Course Studying', value: profile.courseStudying, key: 'courseStudying', placeholder: 'e.g., B.Tech', icon: <GraduationCap className="h-3.5 w-3.5" /> },
              { id: 'collegeStudied', label: 'College/University', value: profile.collegeStudied, key: 'collegeStudied', placeholder: 'Name of your college', icon: <Building2 className="h-3.5 w-3.5" /> },
              { id: 'parentMobileNumber', label: 'Parent/Guardian Mobile', value: profile.parentMobileNumber, key: 'parentMobileNumber', placeholder: 'Emergency contact', icon: <UserCheck className="h-3.5 w-3.5" /> },
              { id: 'address', label: 'Address', value: profile.address, key: 'address' },
              { id: 'city', label: 'City', value: profile.city, key: 'city' },
              { id: 'state', label: 'State', value: profile.state, key: 'state' },
              { id: 'pincode', label: 'Pincode', value: profile.pincode, key: 'pincode' },
            ].map(field => (
              <div key={field.id}>
                <Label htmlFor={field.id} className="flex items-center gap-1 text-[12px] mb-1">
                  {field.icon}{field.label}
                </Label>
                <Input
                  id={field.id}
                  type={(field as any).type || 'text'}
                  value={field.value || ''}
                  onChange={(e) => setProfile(prev => ({ ...prev, [field.key]: e.target.value }))}
                  disabled={!isEditing}
                  placeholder={(field as any).placeholder}
                  className="h-9 text-[13px]"
                />
              </div>
            ))}

            <div>
              <Label htmlFor="bio" className="text-[12px] mb-1 block">Bio</Label>
              <Textarea
                id="bio"
                value={profile.bio}
                onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                disabled={!isEditing}
                placeholder="Tell us about yourself..."
                rows={3}
                className="text-[13px]"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-2 pt-1">
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)} className="h-9 text-[13px] rounded-xl">
                Edit Profile
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => { setIsEditing(false); loadProfile(); }} className="h-9 text-[13px] rounded-xl">
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={isLoading} className="h-9 text-[13px] rounded-xl">
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
