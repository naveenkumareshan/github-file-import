
import React from 'react';
import { useForm } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ChangePasswordFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (newPassword: string) => void;
  username: string;
}

export const ChangePasswordForm: React.FC<ChangePasswordFormProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  username 
}) => {
  const form = useForm({
    defaultValues: {
      newPassword: ''
    }
  });

  const handleSubmit = (data: { newPassword: string }) => {
    onSubmit(data.newPassword);
    form.reset();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change Password</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-2">
          <div>
            <p className="text-sm mb-4">
              Changing password for: <span className="font-medium">{username}</span>
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <Input 
              id="newPassword"
              type="password"
              {...form.register('newPassword', { required: true })}
            />
          </div>
          
          <DialogFooter>
            <Button type="submit" className="bg-cabin-dark text-white hover:bg-black">
              Update Password
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
