
import React, { useState } from 'react';
import { LoginDetail } from './types';
import { UserTable } from './UserTable';
import { AdminTablePagination } from '@/components/admin/AdminTablePagination';

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
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  if (users.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground text-sm">No users found.</p>
      </div>
    );
  }

  const paginatedUsers = users.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div>
      <UserTable 
        users={paginatedUsers} 
        onChangePassword={onChangePassword} 
        onDelete={onDelete} 
        onRestore={onRestore}
        isDeletedView={isDeletedView}
        currentPage={currentPage}
        pageSize={pageSize}
      />
      <AdminTablePagination
        currentPage={currentPage}
        totalItems={users.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={(s) => { setPageSize(s); setCurrentPage(1); }}
      />
    </div>
  );
};

export default UserSection;
