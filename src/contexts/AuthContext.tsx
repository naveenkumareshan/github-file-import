import React, { createContext, useState, useEffect, useContext } from 'react';
import { authService } from '../api/authService';
import { v4 as uuidv4 } from 'uuid';

// Define user type
type UserRole = 'admin' | 'student' | 'hostel_manager' | 'super_admin' | 'vendor' | 'vendor_employee';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;        // Added phone property
  profileImage?: string; // Added profileImage property
  permissions?:any;
  vendorId?: string;
  vendorIds?: string[];
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  authChecked: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  SocialLogin: (response:any) => Promise<boolean>;
  registerUser: (name: string, phone: string, email: string, password: string, gender: string, role: string) => Promise<boolean>;
  logout: () => void;
  changeUserName: (newName: string) => Promise<boolean>;
  changeUserPassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  updateUserName: (newName: string) => Promise<boolean>;
  updateUserPassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  updateUserProfile: (data: any) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  authChecked: false,
  isLoading: true,
  login: async () => ({ success: false }),
  SocialLogin: async () => false,
  registerUser: async () => false,
  logout: () => {},
  changeUserName: async () => false,
  changeUserPassword: async () => false,
  updateUserName: async () => false,
  updateUserPassword: async () => false,
  updateUserProfile: async () => false
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
        setAuthChecked(true)
        setIsLoading(false);
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, []);

   const getDeviceInfo = () => {
    const userAgent = navigator.userAgent;
    const platform = navigator.platform;

    const deviceType = /Mobi|Android/i.test(userAgent) ? 'Mobile' : 'Web';

    // Store and reuse a generated device ID
    let deviceId = localStorage.getItem('deviceId');
    if (!deviceId) {
      deviceId = uuidv4();
      localStorage.setItem('deviceId', deviceId);
    }

    const deviceModel = platform || 'Unknown';
    const osVersion = navigator.appVersion || 'Unknown';
    const appVersion = '1.0.0';

    return {
      deviceType,
      deviceId,
      deviceModel,
      osVersion,
      appVersion,
      platform
    };
  }
  
  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const data = await getDeviceInfo();
      const response = await authService.login({ email, password, ...data });
      
      if (response.success && response.token && response.user) {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        setUser(response.user);
        return { success: true,  error:response};
      }
      
      return { 
        success: false, 
        error: response.message || 'Invalid email or password. Please try again.' 
      };
    } catch (error) {
      console.error('Login error:', error);
      
      // Extract error message from different possible error structures
      let errorMessage = 'An error occurred during login. Please try again.';
      
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      return { success: false, error: errorMessage };
    }
  };

  const SocialLogin = async (response): Promise<boolean> => {
    try {
      
      if (response.success && response.token && response.user) {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        setUser(response.user);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const registerUser = async (name: string, phone:string, email: string, password: string,gender:string, role: string): Promise<boolean> => {
    try {
      const response = await authService.register({ name, phone, email, password, gender, role });
      
      if (response.success && response.token) {
        return true;
      }
      return false;
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const changeUserName = async (newName: string): Promise<boolean> => {
    if (user) {
      const response = await authService.updateName({ newName });
      const updatedUser = { ...user, name: newName };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      return true;
    }
    return false;
  };

  const changeUserPassword = async (currentPassword: string, newPassword: string): Promise<boolean> => {
    try {
      const response = await authService.changePassword({ currentPassword, newPassword });
      return response.success;
    } catch (error) {
      console.error('Change password error:', error);
      return false;
    }
  };

  const updateUserName = async (newName: string): Promise<boolean> => {
    return changeUserName(newName);
  };

  const updateUserPassword = async (currentPassword: string, newPassword: string): Promise<boolean> => {
    return changeUserPassword(currentPassword, newPassword);
  };

  const updateUserProfile = async (data: unknown): Promise<boolean> => {
    if (user) {
      console.log("Updating user profile with data:", data);
      return true;
    }
    return false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        authChecked:authChecked,
        isLoading,
        login,
        SocialLogin,
        registerUser,
        logout,
        changeUserName,
        changeUserPassword,
        updateUserName,
        updateUserPassword,
        updateUserProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
