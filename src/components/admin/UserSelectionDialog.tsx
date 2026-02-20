
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Users, X } from 'lucide-react';
import { adminUsersService } from '@/api/adminUsersService';
import { toast } from '@/hooks/use-toast';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
}

interface UserSelectionDialogProps {
  selectedUsers: string[];
  onUsersChange: (userIds: string[]) => void;
  trigger: React.ReactNode;
  title: string;
  description?: string;
}

export const UserSelectionDialog: React.FC<UserSelectionDialogProps> = ({
  selectedUsers,
  onUsersChange,
  trigger,
  title,
  description
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [tempSelectedUsers, setTempSelectedUsers] = useState<string[]>(selectedUsers);

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
      setTempSelectedUsers(selectedUsers);
    }
  }, [isOpen, selectedUsers]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await adminUsersService.getUsers({
        search: searchTerm || undefined,
        role: 'student'
      });

      if (response.success) {
        setUsers(response.data || []);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch users",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchTerm) {
      const timeoutId = setTimeout(() => {
        fetchUsers();
      }, 300);
      return () => clearTimeout(timeoutId);
    } else {
      fetchUsers();
    }
  }, [searchTerm]);

  const handleUserToggle = (userId: string) => {
    setTempSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSave = () => {
    onUsersChange(tempSelectedUsers);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setTempSelectedUsers(selectedUsers);
    setIsOpen(false);
  };

  const getSelectedUserNames = () => {
    return users
      .filter(user => selectedUsers.includes(user._id))
      .map(user => user.name);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </DialogHeader>
        
        <div className="space-y-4">
          {selectedUsers.length > 0 && (
            <div>
              <Label className="text-sm font-medium">Selected Users ({selectedUsers.length})</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {getSelectedUserNames().map((name, index) => (
                  <Badge key={index} variant="secondary">
                    {name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="search">Search Users</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Search by name or email"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <ScrollArea className="h-[300px] border rounded-md p-4">
            {loading ? (
              <div className="text-center py-8">Loading users...</div>
            ) : users.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No users found
              </div>
            ) : (
              <div className="space-y-2">
                {users.map((user) => (
                  <div key={user._id} className="flex items-center space-x-2 p-2 hover:bg-muted/50 rounded">
                    <Checkbox
                      checked={tempSelectedUsers.includes(user._id)}
                      onCheckedChange={() => handleUserToggle(user._id)}
                    />
                    <div className="flex-1">
                      <div className="font-medium">{user.name}</div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                    </div>
                    <Badge variant="outline">{user.role}</Badge>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Selection ({tempSelectedUsers.length})
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
