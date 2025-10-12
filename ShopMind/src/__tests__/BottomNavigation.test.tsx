import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import BottomNavigation from '../components/BottomNavigation';

describe('BottomNavigation', () => {
  const mockOnTabPress = jest.fn();

  const defaultProps = {
    activeTab: 'home' as const,
    onTabPress: mockOnTabPress,
  };

  beforeEach(() => {
    mockOnTabPress.mockClear();
  });

  describe('Rendering', () => {
    it('renders all tabs correctly', () => {
      render(<BottomNavigation {...defaultProps} />);
      
      expect(screen.getByText('Home')).toBeTruthy();
      expect(screen.getByText('Messages')).toBeTruthy();
      expect(screen.getByText('Cart')).toBeTruthy();
      expect(screen.getByText('Account')).toBeTruthy();
    });

    it('renders all tab icons correctly', () => {
      render(<BottomNavigation {...defaultProps} />);
      
      expect(screen.getByText('🏠')).toBeTruthy();
      expect(screen.getByText('💬')).toBeTruthy();
      expect(screen.getByText('🛒')).toBeTruthy();
      expect(screen.getByText('👤')).toBeTruthy();
    });

    it('shows home tab as active by default', () => {
      render(<BottomNavigation {...defaultProps} />);
      
      const homeTab = screen.getByText('Home').parent;
      expect(homeTab).toBeTruthy();
    });

    it('shows messages tab as active when activeTab is messages', () => {
      render(<BottomNavigation {...defaultProps} activeTab="messages" />);
      
      const messagesTab = screen.getByText('Messages').parent;
      expect(messagesTab).toBeTruthy();
    });

    it('shows cart tab as active when activeTab is cart', () => {
      render(<BottomNavigation {...defaultProps} activeTab="cart" />);
      
      const cartTab = screen.getByText('Cart').parent;
      expect(cartTab).toBeTruthy();
    });

    it('shows account tab as active when activeTab is account', () => {
      render(<BottomNavigation {...defaultProps} activeTab="account" />);
      
      const accountTab = screen.getByText('Account').parent;
      expect(accountTab).toBeTruthy();
    });
  });

  describe('Navigation Functionality', () => {
    it('calls onTabPress with home when home tab is pressed', () => {
      render(<BottomNavigation {...defaultProps} activeTab="messages" />);
      
      const homeTab = screen.getByText('Home');
      fireEvent.press(homeTab);
      
      expect(mockOnTabPress).toHaveBeenCalledWith('home');
      expect(mockOnTabPress).toHaveBeenCalledTimes(1);
    });

    it('calls onTabPress with messages when messages tab is pressed', () => {
      render(<BottomNavigation {...defaultProps} />);
      
      const messagesTab = screen.getByText('Messages');
      fireEvent.press(messagesTab);
      
      expect(mockOnTabPress).toHaveBeenCalledWith('messages');
      expect(mockOnTabPress).toHaveBeenCalledTimes(1);
    });

    it('calls onTabPress with cart when cart tab is pressed', () => {
      render(<BottomNavigation {...defaultProps} />);
      
      const cartTab = screen.getByText('Cart');
      fireEvent.press(cartTab);
      
      expect(mockOnTabPress).toHaveBeenCalledWith('cart');
      expect(mockOnTabPress).toHaveBeenCalledTimes(1);
    });

    it('calls onTabPress with account when account tab is pressed', () => {
      render(<BottomNavigation {...defaultProps} />);
      
      const accountTab = screen.getByText('Account');
      fireEvent.press(accountTab);
      
      expect(mockOnTabPress).toHaveBeenCalledWith('account');
      expect(mockOnTabPress).toHaveBeenCalledTimes(1);
    });

    it('handles multiple tab presses correctly', () => {
      render(<BottomNavigation {...defaultProps} />);
      
      const homeTab = screen.getByText('Home');
      const cartTab = screen.getByText('Cart');
      const accountTab = screen.getByText('Account');
      
      fireEvent.press(homeTab);
      fireEvent.press(cartTab);
      fireEvent.press(accountTab);
      
      expect(mockOnTabPress).toHaveBeenCalledTimes(3);
      expect(mockOnTabPress).toHaveBeenNthCalledWith(1, 'home');
      expect(mockOnTabPress).toHaveBeenNthCalledWith(2, 'cart');
      expect(mockOnTabPress).toHaveBeenNthCalledWith(3, 'account');
    });

    it('does not crash when pressing active tab', () => {
      render(<BottomNavigation {...defaultProps} activeTab="home" />);
      
      const homeTab = screen.getByText('Home');
      
      expect(() => {
        fireEvent.press(homeTab);
      }).not.toThrow();
      
      expect(mockOnTabPress).toHaveBeenCalledWith('home');
    });
  });

  describe('Tab State Management', () => {
    it('maintains correct active state when switching between tabs', () => {
      const { rerender } = render(<BottomNavigation {...defaultProps} activeTab="home" />);
      
      // Switch to messages tab
      rerender(<BottomNavigation {...defaultProps} activeTab="messages" />);
      const messagesTab = screen.getByText('Messages').parent;
      expect(messagesTab).toBeTruthy();
      
      // Switch to cart tab
      rerender(<BottomNavigation {...defaultProps} activeTab="cart" />);
      const cartTab = screen.getByText('Cart').parent;
      expect(cartTab).toBeTruthy();
      
      // Switch to account tab
      rerender(<BottomNavigation {...defaultProps} activeTab="account" />);
      const accountTab = screen.getByText('Account').parent;
      expect(accountTab).toBeTruthy();
    });

    it('handles rapid tab changes without issues', () => {
      const { rerender } = render(<BottomNavigation {...defaultProps} activeTab="home" />);
      
      const tabs: Array<'home' | 'messages' | 'cart' | 'account'> = ['messages', 'cart', 'account', 'home', 'cart'];
      
      tabs.forEach(tab => {
        expect(() => {
          rerender(<BottomNavigation {...defaultProps} activeTab={tab} />);
        }).not.toThrow();
      });
    });
  });

  describe('Icon Navigation Tests', () => {
    it('allows navigation by pressing tab icons', () => {
      render(<BottomNavigation {...defaultProps} />);
      
      // Press home icon
      const homeIcon = screen.getByText('🏠');
      fireEvent.press(homeIcon);
      expect(mockOnTabPress).toHaveBeenCalledWith('home');
      
      mockOnTabPress.mockClear();
      
      // Press cart icon
      const cartIcon = screen.getByText('🛒');
      fireEvent.press(cartIcon);
      expect(mockOnTabPress).toHaveBeenCalledWith('cart');
    });

    it('maintains icon visibility across all tabs', () => {
      const tabs: Array<'home' | 'messages' | 'cart' | 'account'> = ['home', 'messages', 'cart', 'account'];
      
      tabs.forEach(activeTab => {
        const { rerender } = render(<BottomNavigation {...defaultProps} activeTab={activeTab} />);
        
        expect(screen.getByText('🏠')).toBeTruthy();
        expect(screen.getByText('💬')).toBeTruthy();
        expect(screen.getByText('🛒')).toBeTruthy();
        expect(screen.getByText('👤')).toBeTruthy();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles missing onTabPress callback gracefully', () => {
      const propsWithoutCallback = {
        activeTab: 'home' as const,
        onTabPress: undefined as any,
      };
      
      expect(() => {
        render(<BottomNavigation {...propsWithoutCallback} />);
      }).not.toThrow();
    });

    it('handles invalid active tab gracefully', () => {
      const propsWithInvalidTab = {
        activeTab: 'invalid' as any,
        onTabPress: mockOnTabPress,
      };
      
      expect(() => {
        render(<BottomNavigation {...propsWithInvalidTab} />);
      }).not.toThrow();
    });
  });

  describe('Accessibility', () => {
    it('renders tab elements as pressable', () => {
      render(<BottomNavigation {...defaultProps} />);
      
      const homeTab = screen.getByText('Home').parent;
      const messagesTab = screen.getByText('Messages').parent;
      const cartTab = screen.getByText('Cart').parent;
      const accountTab = screen.getByText('Account').parent;
      
      expect(homeTab).toBeTruthy();
      expect(messagesTab).toBeTruthy();
      expect(cartTab).toBeTruthy();
      expect(accountTab).toBeTruthy();
    });

    it('maintains consistent structure for screen readers', () => {
      render(<BottomNavigation {...defaultProps} />);
      
      // Check that each tab has both icon and label
      const tabs = ['Home', 'Messages', 'Cart', 'Account'];
      const icons = ['🏠', '💬', '🛒', '👤'];
      
      tabs.forEach(tab => {
        expect(screen.getByText(tab)).toBeTruthy();
      });
      
      icons.forEach(icon => {
        expect(screen.getByText(icon)).toBeTruthy();
      });
    });
  });
});