import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from '@/hooks/use-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { User, MailIcon, GraduationCap, Shield, AlertTriangle, Pencil, X, Check, LogOut, FileText, Lock, BookMarked, ChevronRight, Info } from 'lucide-react';
import { userProfileService } from '@/api/userProfileService';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { bookingsService } from '@/api/bookingsService';
import { format } from 'date-fns';

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

const statusColor: Record<string, string> = {
  completed: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  failed: 'bg-red-100 text-red-700',
  cancelled: 'bg-muted text-muted-foreground',
};

// Section field maps — which fields belong to which section
const SECTION_FIELDS: Record<string, (keyof ProfileData)[]> = {
  account: ['name', 'email', 'phone', 'alternate_phone', 'gender'],
  personal: ['date_of_birth', 'address', 'city', 'state', 'pincode'],
  academic: ['course_preparing_for', 'course_studying', 'college_studied', 'parent_mobile_number', 'bio'],
};

export const ProfileManagement = () => {
  const { logout } = useAuth();
  const [profile, setProfile] = useState<ProfileData>(defaultProfile);
  const [isLoading, setIsLoading] = useState(false);

  // Per-section editing
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [sectionDraft, setSectionDraft] = useState<Partial<ProfileData>>({});

  // Bookings
  const [bookings, setBookings] = useState<any[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);

  // Password change state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    loadProfile();
    loadBookings();
  }, []);

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
      }
    } catch {
      console.error('Failed to load profile data');
    }
  };

  const loadBookings = async () => {
    try {
      const res = await bookingsService.getUserBookings();
      if (res.success && Array.isArray(res.data)) {
        setBookings(res.data.slice(0, 2));
      }
    } finally {
      setLoadingBookings(false);
    }
  };

  const startEdit = (section: string) => {
    const fields = SECTION_FIELDS[section] || [];
    const draft: Partial<ProfileData> = {};
    fields.forEach((f) => { (draft as any)[f] = (profile as any)[f]; });
    setSectionDraft(draft);
    setEditingSection(section);
  };

  const cancelEdit = () => {
    setSectionDraft({});
    setEditingSection(null);
  };

  const saveSection = async (section: string) => {
    setIsLoading(true);
    try {
      const merged = { ...profile, ...sectionDraft };
      const response = await userProfileService.updateProfile(merged);
      if (response.success) {
        toast({ title: 'Saved', description: 'Section updated successfully' });
        setProfile(merged);
        setEditingSection(null);
        setSectionDraft({});
      } else {
        toast({ title: 'Error', description: 'Failed to update', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to update', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
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

  // Field helper — reads from sectionDraft when that section is being edited
  const field = (id: keyof ProfileData, label: string, section: string, type = 'text', placeholder = '') => {
    const isActive = editingSection === section;
    const value = isActive && id in sectionDraft ? (sectionDraft as any)[id] : (profile[id] as string) || '';
    return (
      <div key={id}>
        <Label htmlFor={id} className="text-[12px] mb-1 block">{label}</Label>
        <Input
          id={id}
          type={type}
          value={value}
          onChange={(e) => isActive && setSectionDraft(prev => ({ ...prev, [id]: e.target.value }))}
          disabled={!isActive}
          placeholder={placeholder}
          className="h-9 text-[13px]"
        />
      </div>
    );
  };

  // Section header with edit/save/cancel controls
  const SectionControls = ({ section }: { section: string }) => {
    const isActive = editingSection === section;
    return (
      <div className="flex items-center gap-1 ml-auto" onClick={(e) => e.stopPropagation()}>
        {!isActive ? (
          <button
            type="button"
            onClick={() => startEdit(section)}
            className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-muted transition-colors"
          >
            <Pencil className="h-3 w-3 text-muted-foreground" />
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={cancelEdit}
              className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-muted transition-colors"
            >
              <X className="h-3 w-3 text-muted-foreground" />
            </button>
            <button
              type="button"
              onClick={() => saveSection(section)}
              disabled={isLoading}
              className="h-7 px-2 rounded-lg flex items-center gap-1 bg-primary text-primary-foreground text-[11px] font-medium hover:bg-primary/90 transition-colors"
            >
              <Check className="h-3 w-3" /> {isLoading ? '…' : 'Save'}
            </button>
          </>
        )}
      </div>
    );
  };

  const initials = profile.name?.charAt(0)?.toUpperCase() || '?';

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
          {profile.profile_edit_count >= 2 && (
            <p className="text-[10px] text-destructive mt-0.5">Profile edit limit reached</p>
          )}
        </div>
      </div>

      {/* My Bookings — between avatar and sections */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-[13px] font-semibold text-foreground flex items-center gap-1.5">
            <BookMarked className="h-3.5 w-3.5 text-primary" /> My Bookings
          </p>
          <Link to="/student/bookings" className="text-[12px] text-primary flex items-center gap-0.5 font-medium">
            View All <ChevronRight className="h-3 w-3" />
          </Link>
        </div>

        {loadingBookings ? (
          <div className="space-y-2">
            <Skeleton className="h-14 w-full rounded-2xl" />
            <Skeleton className="h-14 w-full rounded-2xl" />
          </div>
        ) : bookings.length === 0 ? (
          <Card className="rounded-2xl border-dashed border-2 border-muted bg-transparent">
            <CardContent className="py-5 text-center">
              <p className="text-[12px] text-muted-foreground">No bookings yet.</p>
              <Link to="/cabins" className="text-[12px] text-primary font-medium mt-1 block">
                Browse reading rooms →
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {bookings.map((b) => (
              <Card key={b.id} className="rounded-2xl border-0 shadow-sm bg-card">
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <BookMarked className="w-4 h-4 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-semibold text-foreground truncate">
                      {(b.cabins as any)?.name || 'Reading Room'} — Seat #{b.seat_number || '—'}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {b.start_date ? format(new Date(b.start_date), 'd MMM') : '—'} → {b.end_date ? format(new Date(b.end_date), 'd MMM yyyy') : '—'}
                    </p>
                  </div>
                  <span className={`flex-shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full ${statusColor[b.payment_status] || 'bg-muted text-muted-foreground'}`}>
                    {b.payment_status}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Accordion sections */}
      <Accordion type="multiple" defaultValue={['account']} className="space-y-2">
        {/* Section 1 — Account */}
        <AccordionItem value="account" className="bg-card rounded-2xl border px-4 data-[state=open]:shadow-sm">
          <AccordionTrigger className="text-[13px] font-semibold py-3 hover:no-underline">
            <span className="flex items-center gap-2 flex-1"><User className="h-3.5 w-3.5 text-primary" /> Account Info</span>
            <SectionControls section="account" />
          </AccordionTrigger>
          <AccordionContent className="space-y-3 pb-4">
            {editingSection === 'account' && profile.profile_edit_count >= 1 && (
              <Alert>
                <AlertTriangle className="h-3.5 w-3.5" />
                <AlertDescription className="text-[12px]">
                  {2 - profile.profile_edit_count} edit{2 - profile.profile_edit_count !== 1 ? 's' : ''} remaining.
                </AlertDescription>
              </Alert>
            )}
            {/* Gender selector */}
            <div className="space-y-1.5">
              <Label className="text-[12px]">Gender</Label>
              <div className="flex gap-3">
                {['male', 'female'].map(g => {
                  const isActive = editingSection === 'account';
                  const val = isActive && 'gender' in sectionDraft ? sectionDraft.gender : profile.gender;
                  return (
                    <button
                      key={g}
                      type="button"
                      onClick={() => isActive && setSectionDraft(prev => ({ ...prev, gender: g }))}
                      disabled={!isActive}
                      className={`flex flex-col items-center gap-1 ${val === g ? (g === 'male' ? 'text-blue-600' : 'text-pink-600') : 'text-muted-foreground'}`}
                    >
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                        val === g
                          ? g === 'male' ? 'bg-blue-100 border-2 border-blue-500' : 'bg-pink-100 border-2 border-pink-500'
                          : 'bg-muted'
                      }`}>
                        <User className={`h-5 w-5 ${g === 'male' ? 'text-blue-500' : 'text-pink-500'}`} />
                      </div>
                      <span className="text-[11px] font-medium capitalize">{g}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {field('name', 'Full Name', 'account')}
              {field('email', 'Email', 'account', 'email')}
              {field('phone', 'Phone', 'account')}
              {field('alternate_phone', 'Alternate Phone', 'account')}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Section 2 — Personal Info */}
        <AccordionItem value="personal" className="bg-card rounded-2xl border px-4 data-[state=open]:shadow-sm">
          <AccordionTrigger className="text-[13px] font-semibold py-3 hover:no-underline">
            <span className="flex items-center gap-2 flex-1"><MailIcon className="h-3.5 w-3.5 text-primary" /> Personal Info</span>
            <SectionControls section="personal" />
          </AccordionTrigger>
          <AccordionContent className="space-y-3 pb-4">
            <div className="grid grid-cols-1 gap-3">
              {field('date_of_birth', 'Date of Birth', 'personal', 'date')}
              {field('address', 'Address', 'personal')}
              {field('city', 'City', 'personal')}
              {field('state', 'State', 'personal')}
              {field('pincode', 'Pincode', 'personal')}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Section 3 — Academic Info */}
        <AccordionItem value="academic" className="bg-card rounded-2xl border px-4 data-[state=open]:shadow-sm">
          <AccordionTrigger className="text-[13px] font-semibold py-3 hover:no-underline">
            <span className="flex items-center gap-2 flex-1"><GraduationCap className="h-3.5 w-3.5 text-primary" /> Academic Info</span>
            <SectionControls section="academic" />
          </AccordionTrigger>
          <AccordionContent className="space-y-3 pb-4">
            <div className="grid grid-cols-1 gap-3">
              {field('course_preparing_for', 'Preparing For', 'academic', 'text', 'e.g., NEET, JEE')}
              {field('course_studying', 'Course Studying', 'academic', 'text', 'e.g., B.Tech')}
              {field('college_studied', 'College / University', 'academic', 'text', 'Name of your college')}
              {field('parent_mobile_number', 'Parent / Guardian Mobile', 'academic', 'text', 'Emergency contact')}
              <div>
                <Label htmlFor="bio" className="text-[12px] mb-1 block">Bio</Label>
                <Textarea
                  id="bio"
                  value={editingSection === 'academic' && 'bio' in sectionDraft ? sectionDraft.bio || '' : profile.bio}
                  onChange={(e) => editingSection === 'academic' && setSectionDraft(prev => ({ ...prev, bio: e.target.value }))}
                  disabled={editingSection !== 'academic'}
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

      {/* Legal links */}
      <div className="flex items-center justify-center gap-4 pt-1">
        <Link to="/about" className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors">
          <Info className="h-3 w-3" /> About
        </Link>
        <span className="text-muted-foreground text-[11px]">·</span>
        <Link to="/privacy-policy" className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors">
          <Lock className="h-3 w-3" /> Privacy
        </Link>
        <span className="text-muted-foreground text-[11px]">·</span>
        <Link to="/terms" className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors">
          <FileText className="h-3 w-3" /> Terms
        </Link>
      </div>

      {/* Logout */}
      <Button
        variant="outline"
        className="w-full rounded-2xl h-11 text-[13px] text-destructive border-destructive/30 hover:bg-destructive/5 gap-2"
        onClick={logout}
      >
        <LogOut className="h-4 w-4" /> Logout
      </Button>
    </div>
  );
};
