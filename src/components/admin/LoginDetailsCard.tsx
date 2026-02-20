
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { AddUserForm } from './login-details/AddUserForm';
import UserSection from './login-details/UserSection';
import { LoginDetail } from './login-details/types';
import { ChangePasswordForm } from './login-details/ChangePasswordForm';

export interface LoginDetailsCardProps {
  users: LoginDetail[];
  onAddUser: (user: LoginDetail) => void;
  onDeleteUser: (user: LoginDetail) => void;
  onRestoreUser: (user: LoginDetail) => void;
  onChangePassword: (userId: string, newPassword: string) => void;
}

export const LoginDetailsCard: React.FC<LoginDetailsCardProps> = ({
  users,
  onAddUser,
  onDeleteUser,
  onRestoreUser,
  onChangePassword,
}) => {
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<LoginDetail | null>(null);

  const activeUsers = users.filter(user => !user.isDeleted);
  const deletedUsers = users.filter(user => user.isDeleted);

  const handlePasswordChange = (user: LoginDetail) => {
    setSelectedUser(user);
    setIsChangePasswordModalOpen(true);
  };

  const handlePasswordSubmit = (newPassword: string) => {
    if (selectedUser) {
      onChangePassword(selectedUser.email, newPassword);
      toast({
        title: "Password Changed",
        description: `Password updated for ${selectedUser.name}`,
      });
      setIsChangePasswordModalOpen(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>User Login Details</CardTitle>
        <Button onClick={() => setIsAddUserModalOpen(true)}>Add User</Button>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="active">
          <TabsList className="mb-4">
            <TabsTrigger value="active">Active Users ({activeUsers.length})</TabsTrigger>
            <TabsTrigger value="deleted">Deleted Users ({deletedUsers.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="active">
            <UserSection 
              users={activeUsers} 
              onChangePassword={handlePasswordChange} 
              onDelete={onDeleteUser} 
              onRestore={onRestoreUser}
              isDeletedView={false}
            />
          </TabsContent>
          <TabsContent value="deleted">
            <UserSection 
              users={deletedUsers} 
              onChangePassword={handlePasswordChange} 
              onDelete={onDeleteUser} 
              onRestore={onRestoreUser}
              isDeletedView={true}
            />
          </TabsContent>
        </Tabs>
      </CardContent>

      <AddUserForm 
        isOpen={isAddUserModalOpen}
        onClose={() => setIsAddUserModalOpen(false)}
        onSubmit={onAddUser}
      />

      {selectedUser && (
        <ChangePasswordForm
          isOpen={isChangePasswordModalOpen}
          onClose={() => setIsChangePasswordModalOpen(false)}
          onSubmit={handlePasswordSubmit}
          username={selectedUser.name}
        />
      )}
    </Card>
  );
};
