
import React from 'react';
import { Button } from '@/components/ui/button';
import { LoginDetail } from './types';
import { Badge } from '@/components/ui/badge';
import { User, KeyRound, Trash2, RotateCcw } from 'lucide-react';
import { getSerialNumber } from '@/components/admin/AdminTablePagination';

interface UserTableProps {
  users: LoginDetail[];
  onDelete: (user: LoginDetail) => void;
  onChangePassword: (user: LoginDetail) => void;
  onRestore: (user: LoginDetail) => void;
  isDeletedView: boolean;
  currentPage: number;
  pageSize: number;
}

export const UserTable: React.FC<UserTableProps> = ({ 
  users, 
  onDelete, 
  onChangePassword, 
  onRestore,
  isDeletedView,
  currentPage,
  pageSize
}) => {
  return (
    <div className="border rounded-lg overflow-x-auto">
      <table className="w-full text-[11px]">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="text-left py-2 px-3 font-medium w-12">S.No.</th>
            <th className="text-left py-2 px-3 font-medium">Name</th>
            <th className="text-left py-2 px-3 font-medium">Email</th>
            <th className="text-left py-2 px-3 font-medium">Role</th>
            <th className="text-right py-2 px-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user, index) => (
            <tr key={user.email} className="border-b last:border-0 hover:bg-muted/30">
              <td className="py-1.5 px-3 text-muted-foreground">{getSerialNumber(index, currentPage, pageSize)}</td>
              <td className="py-1.5 px-3">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
                    <User className="h-3 w-3 text-muted-foreground" />
                  </div>
                  <span className="font-medium">{user.name}</span>
                </div>
              </td>
              <td className="py-1.5 px-3 text-muted-foreground">{user.email}</td>
              <td className="py-1.5 px-3">
                <Badge 
                  variant={user.role === 'admin' ? 'default' : 'secondary'} 
                  className="text-[10px] capitalize"
                >
                  {user.role}
                </Badge>
              </td>
              <td className="py-1.5 px-3 text-right">
                <div className="flex items-center justify-end gap-1">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 text-[10px] px-2 gap-1"
                    onClick={() => onChangePassword(user)}
                  >
                    <KeyRound className="h-3 w-3" />
                    Password
                  </Button>
                  {isDeletedView ? (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 text-[10px] px-2 gap-1 text-green-600 hover:text-green-700 hover:bg-green-50"
                      onClick={() => onRestore(user)}
                    >
                      <RotateCcw className="h-3 w-3" />
                      Restore
                    </Button>
                  ) : (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 text-[10px] px-2 gap-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => onDelete(user)}
                    >
                      <Trash2 className="h-3 w-3" />
                      Delete
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
