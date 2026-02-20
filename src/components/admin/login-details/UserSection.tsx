
import React from 'react';
import { LoginDetail } from './types';
import { UserTable } from './UserTable';

interface UserSectionProps {
  users: LoginDetail[];
  onChangePassword: (user: LoginDetail) => void;
  onDelete: (user: LoginDetail) => void;
  onRestore: (user: LoginDetail) => void;
  isDeletedView: boolean;
}

const UserSection: React.FC<UserSectionProps> = ({
  users,
  onChangePassword,
  onDelete,
  onRestore,
  isDeletedView
}) => {
  if (users.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No users found.</p>
      </div>
    );
  }

  return (
    <div>
      <UserTable 
        users={users} 
        onChangePassword={onChangePassword} 
        onDelete={onDelete} 
        onRestore={onRestore}
        isDeletedView={isDeletedView}
      />
    </div>
  );
};

export default UserSection;
