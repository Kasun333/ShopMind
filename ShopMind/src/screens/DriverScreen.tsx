import React from 'react';
import { User } from '../types/User';
import DriverNavigation from '../navigation/DriverNavigation';

interface DriverScreenProps {
  user: User;
  token: string;
  onLogout: () => void;
}

const DriverScreen: React.FC<DriverScreenProps> = ({ user, token, onLogout }) => {
  return (
    <DriverNavigation
      user={user}
      token={token}
      onLogout={onLogout}
    />
  );
};

export default DriverScreen;


