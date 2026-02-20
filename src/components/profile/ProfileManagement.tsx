import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from '@/hooks/use-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { User, MailIcon, PhoneIcon, GraduationCap, UserCheck, Building2, Shield, AlertTriangle, Pencil, X, Check } from 'lucide-react';
import { userProfileService } from '@/api/userProfileService';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';

interface ProfileData {
  id?: string;
  name: string;
  email: string;
  phone: string;
  alternate_phone: string;
  address: string;
  bio: string;
  course_studying: string;
  college_studied: string;
  parent_mobile_number: string;
  profile_picture: string;
  profile_edit_count: number;
  gender: string;
  city: string;
  state: string;
  pincode: string;
  date_of_birth: string | null;
  course_preparing_for: string;
}

const defaultProfile: ProfileData = {
  name: '', email: '', phone: '', address: '', bio: '',
  course_studying: '', college_studied: '', parent_mobile_number: '',
  profile_picture: '', profile_edit_count: 0,
  gender: '', city: '', state: '',
  pincode: '', alternate_phone: '', date_of_birth: null,
  course_preparing_for: '',
};

export const ProfileManagement = () => {
  const [profile, setProfile] = useState<ProfileData>(defaultProfile);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [savedProfile, setSavedProfile] = useState<ProfileData>(defaultProfile);

  // Password change state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => { loadProfile(); }, []);

  const loadProfile = async () => {
    try {
      const response = await userProfileService.getUserProfile();
      if (response.success && response.data) {
        const data = response.data as any;
        const mapped: ProfileData = {
          id: data.id,
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          alternate_phone: data.alternate_phone || '',
          address: data.address || '',
          bio: data.bio || '',
          course_studying: data.course_studying || '',
          college_studied: data.college_studied || '',
          parent_mobile_number: data.parent_mobile_number || '',
          profile_picture: data.profile_picture || '',
          profile_edit_count: data.profile_edit_count || 0,
          gender: data.gender || '',
          city: data.city || '',
          state: data.state || '',
          pincode: data.pincode || '',
          date_of_birth: data.date_of_birth || null,
          course_preparing_for: data.course_preparing_for || '',
        };
        setProfile(mapped);
        setSavedProfile(mapped);
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to load profile data', variant: 'destructive' });
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const response = await userProfileService.updateProfile(profile);
      if (response.success) {
        toast({ title: 'Success', description: 'Profile updated successfully' });
        setSavedProfile(profile);
        setIsEditing(false);
      } else {
        toast({ title: 'Error', description: 'Failed to update profile', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to update profile', variant: 'destructive' });
    } finally {
      setIsLoading(false); }
  };

  const handleCancel = () => {
    setProfile(savedProfile);
    setIsEditing(false);
  };

  const handleChangePassword = async () => {
    if (!newPassword || newPassword !== confirmPassword) {
      toast({ title: 'Error', description: 'Passwords do not match', variant: 'destructive' });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: 'Error', description: 'Password must be at least 6 characters', variant: 'destructive' });
      return;
    }
    setIsChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast({ title: 'Success', description: 'Password updated successfully' });
      setNewPassword('');
      setConfirmPassword('');
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Failed to update password', variant: 'destructive' });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const field = (id: keyof ProfileData, label: string, type = 'text', placeholder = '') => (
    <div key={id}>
      <Label htmlFor={id} className="text-[12px] mb-1 block">{label}</Label>
      <Input
        id={id}
        type={type}
        value={(profile[id] as string) || ''}
        onChange={(e) => setProfile(prev => ({ ...prev, [id]: e.target.value }))}
        disabled={!isEditing}
        placeholder={placeholder}
        className="h-9 text-[13px]"
      />
    </div>
  );

  const initials = profile.name?.charAt(0)?.toUpperCase() || '?';
  const canEdit = profile.profile_edit_count < 2;

  return (
    <div className="max-w-lg mx-auto space-y-3 px-3 py-3">
      {/* Header card with avatar */}
      <div className="flex items-center gap-4 bg-card rounded-2xl border p-4">
        <Avatar className="h-16 w-16 flex-shrink-0">
          <AvatarImage src={profile.profile_picture} alt={profile.name} />
          <AvatarFallback className="text-xl bg-primary text-primary-foreground">{initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-semibold text-foreground">{profile.name || 'Your Name'}</p>
          <p className="text-[11px] text-muted-foreground truncate">{profile.email}</p>
          {!canEdit && (
            <p className="text-[10px] text-destructive mt-0.5">Profile edit limit reached</p>
          )}
        </div>
        <div className="flex-shrink-0">
          {!isEditing ? (
            <Button size="sm" variant="outline" onClick={() => setIsEditing(true)} className="h-8 text-[12px] rounded-xl gap-1">
              <Pencil className="h-3 w-3" /> Edit
            </Button>
          ) : (
            <div className="flex gap-1.5">
              <Button size="sm" variant="outline" onClick={handleCancel} className="h-8 text-[12px] rounded-xl gap-1">
                <X className="h-3 w-3" />
              </Button>
              <Button size="sm" onClick={handleSave} disabled={isLoading} className="h-8 text-[12px] rounded-xl gap-1">
                <Check className="h-3 w-3" /> {isLoading ? 'Saving…' : 'Save'}
              </Button>
            </div>
          )}
        </div>
      </div>

      {isEditing && profile.profile_edit_count >= 1 && (
        <Alert>
          <AlertTriangle className="h-3.5 w-3.5" />
          <AlertDescription className="text-[12px]">
            {2 - profile.profile_edit_count} edit{2 - profile.profile_edit_count !== 1 ? 's' : ''} remaining.
          </AlertDescription>
        </Alert>
      )}

      {/* Accordion sections */}
      <Accordion type="multiple" defaultValue={['account']} className="space-y-2">
        {/* Section 1 — Account */}
        <AccordionItem value="account" className="bg-card rounded-2xl border px-4 data-[state=open]:shadow-sm">
          <AccordionTrigger className="text-[13px] font-semibold py-3 hover:no-underline">
            <span className="flex items-center gap-2"><User className="h-3.5 w-3.5 text-primary" /> Account Info</span>
          </AccordionTrigger>
          <AccordionContent className="space-y-3 pb-4">
            {/* Gender selector */}
            <div className="space-y-1.5">
              <Label className="text-[12px]">Gender</Label>
              <div className="flex gap-3">
                {['male', 'female'].map(g => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => isEditing && setProfile(prev => ({ ...prev, gender: g }))}
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
            <div className="grid grid-cols-1 gap-3">
              {field('name', 'Full Name')}
              {field('email', 'Email', 'email')}
              {field('phone', 'Phone')}
              {field('alternate_phone', 'Alternate Phone')}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Section 2 — Personal Info */}
        <AccordionItem value="personal" className="bg-card rounded-2xl border px-4 data-[state=open]:shadow-sm">
          <AccordionTrigger className="text-[13px] font-semibold py-3 hover:no-underline">
            <span className="flex items-center gap-2"><MailIcon className="h-3.5 w-3.5 text-primary" /> Personal Info</span>
          </AccordionTrigger>
          <AccordionContent className="space-y-3 pb-4">
            <div className="grid grid-cols-1 gap-3">
              {field('date_of_birth', 'Date of Birth', 'date')}
              {field('address', 'Address')}
              {field('city', 'City')}
              {field('state', 'State')}
              {field('pincode', 'Pincode')}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Section 3 — Academic Info */}
        <AccordionItem value="academic" className="bg-card rounded-2xl border px-4 data-[state=open]:shadow-sm">
          <AccordionTrigger className="text-[13px] font-semibold py-3 hover:no-underline">
            <span className="flex items-center gap-2"><GraduationCap className="h-3.5 w-3.5 text-primary" /> Academic Info</span>
          </AccordionTrigger>
          <AccordionContent className="space-y-3 pb-4">
            <div className="grid grid-cols-1 gap-3">
              {field('course_preparing_for', 'Preparing For', 'text', 'e.g., NEET, JEE')}
              {field('course_studying', 'Course Studying', 'text', 'e.g., B.Tech')}
              {field('college_studied', 'College / University', 'text', 'Name of your college')}
              {field('parent_mobile_number', 'Parent / Guardian Mobile', 'text', 'Emergency contact')}
              <div>
                <Label htmlFor="bio" className="text-[12px] mb-1 block">Bio</Label>
                <Textarea
                  id="bio"
                  value={profile.bio}
                  onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                  disabled={!isEditing}
                  placeholder="Tell us about yourself…"
                  rows={3}
                  className="text-[13px]"
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Section 4 — Security */}
        <AccordionItem value="security" className="bg-card rounded-2xl border px-4 data-[state=open]:shadow-sm">
          <AccordionTrigger className="text-[13px] font-semibold py-3 hover:no-underline">
            <span className="flex items-center gap-2"><Shield className="h-3.5 w-3.5 text-primary" /> Security</span>
          </AccordionTrigger>
          <AccordionContent className="space-y-3 pb-4">
            <p className="text-[12px] text-muted-foreground">Change your account password.</p>
            <div className="space-y-2">
              <div>
                <Label className="text-[12px] mb-1 block">New Password</Label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New password"
                  className="h-9 text-[13px]"
                />
              </div>
              <div>
                <Label className="text-[12px] mb-1 block">Confirm Password</Label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="h-9 text-[13px]"
                />
              </div>
              <Button
                onClick={handleChangePassword}
                disabled={isChangingPassword || !newPassword}
                className="h-9 text-[13px] rounded-xl w-full"
              >
                {isChangingPassword ? 'Updating…' : 'Update Password'}
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};
