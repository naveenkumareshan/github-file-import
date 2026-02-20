
import { useAuth as useAuthContext } from '../contexts/AuthContext';

// This is a wrapper hook that just re-exports the context hook
// to maintain backwards compatibility with existing code
export const useAuth = useAuthContext;

// Add a User type so TypeScript knows the shape of the user object
export interface User {
  id?: string;
  _id?: string;  // Support for both id formats
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
  vendorId?: string;
  vendorIds?: string[];
}
