
import React from 'react';
import { useForm } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { LoginDetail } from './types';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AddUserFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: LoginDetail) => void;
}

export const AddUserForm: React.FC<AddUserFormProps> = ({ isOpen, onClose, onSubmit }) => {
  const form = useForm<LoginDetail>({
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 'student'
    }
  });

  const handleSubmit = (data: LoginDetail) => {
    onSubmit(data);
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input 
              id="name"
              {...form.register('name', { required: true })}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email"
              type="email"
              {...form.register('email', { required: true })}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input 
              id="password"
              type="password"
              {...form.register('password', { required: true })}
            />
          </div>
          
          <div className="space-y-2">
            <Label>Role</Label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input 
                  type="radio" 
                  value="student" 
                  {...form.register('role')} 
                  defaultChecked
                />
                <span>Student</span>
              </label>
              <label className="flex items-center gap-2">
                <input 
                  type="radio" 
                  value="admin" 
                  {...form.register('role')}
                />
                <span>Admin</span>
              </label>
            </div>
          </div>
          
          <DialogFooter>
            <Button type="submit" className="bg-cabin-dark text-white hover:bg-black">
              Add User
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
