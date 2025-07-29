export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: string;
  accountStatus: string;
  createdAt: string;
  dateOfBirth: string;
  formattedAddress: string;
  latitude: number;
  longitude: number;
  phoneNumber: string;
  profileImageUrl: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  user: User;
  token: string;
}
