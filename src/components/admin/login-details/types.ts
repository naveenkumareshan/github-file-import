
export interface LoginDetail {
  name: string;
  email: string;
  role: 'admin' | 'student';
  password: string;
  isDeleted?: boolean;
}
