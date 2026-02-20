
import React from 'react';
import { Button } from '@/components/ui/button';
import { LoginDetail } from './types';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { User, MapPin } from 'lucide-react';

interface UserTableProps {
  users: LoginDetail[];
  onDelete: (user: LoginDetail) => void;
  onChangePassword: (user: LoginDetail) => void;
  onRestore: (user: LoginDetail) => void;
  isDeletedView: boolean;
}

export const UserTable: React.FC<UserTableProps> = ({ 
  users, 
  onDelete, 
  onChangePassword, 
  onRestore,
  isDeletedView 
}) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b">
            <th className="text-left py-2 px-4">User</th>
            <th className="text-left py-2 px-4">Email</th>
            <th className="text-left py-2 px-4">Role</th>
            <th className="text-left py-2 px-4">Address</th>
            <th className="text-right py-2 px-4">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => {
            // Get user additional details from localStorage
            const userGender = localStorage.getItem(`${user.email}_gender`) || 
                              localStorage.getItem('userGender') || '';
            const userImage = localStorage.getItem(`${user.email}_profileImage`) || 
                             localStorage.getItem('userProfileImage') || '';
            const userAddressStr = localStorage.getItem('userAddress');
            const userAddress = userAddressStr ? JSON.parse(userAddressStr) : null;
            
            return (
              <tr key={user.email} className="border-b hover:bg-muted/50">
                <td className="py-2 px-4">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      {userImage ? (
                        <AvatarImage src={userImage} alt={user.name} />
                      ) : (
                        <AvatarFallback className={userGender === 'female' ? 'bg-pink-100 text-pink-500' : 'bg-blue-100 text-blue-500'}>
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <span>{user.name}</span>
                  </div>
                </td>
                <td className="py-2 px-4">{user.email}</td>
                <td className="py-2 px-4 capitalize">
                  <span className={`inline-block py-1 px-2 rounded-full text-xs ${
                    user.role === 'admin' 
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="py-2 px-4">
                  {userAddress ? (
                    <div className="flex items-center space-x-1 text-xs">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate max-w-[200px]">
                        {userAddress.city}, {userAddress.state}
                      </span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-xs">No address</span>
                  )}
                </td>
                <td className="py-2 px-4 text-right">
                  <div className="flex justify-end space-x-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => onChangePassword(user)}
                    >
                      Change Password
                    </Button>
                    {isDeletedView ? (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        onClick={() => onRestore(user)}
                      >
                        Restore
                      </Button>
                    ) : (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => onDelete(user)}
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
