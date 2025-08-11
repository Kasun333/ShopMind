import React from 'react';
import { User } from '../types/User';
import StoreKeeperNavigation from '../navigation/StoreKeeperNavigation';

interface StoreKeeperScreenProps {
  user: User;
  token: string;
  onLogout: () => void;
}

const StoreKeeperScreen: React.FC<StoreKeeperScreenProps> = ({ user, token, onLogout }) => {
  return (
    <StoreKeeperNavigation user={user} token={token} onLogout={onLogout} />
  );
};

export default StoreKeeperScreen;
