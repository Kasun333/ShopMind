import React from 'react';
import { View, StyleSheet } from 'react-native';
import ShimmerLoader from './ShimmerLoader';

const CartItemSkeleton: React.FC = () => {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {/* Image */}
        <ShimmerLoader width={70} height={70} borderRadius={12} />
        
        {/* Details */}
        <View style={styles.details}>
          <ShimmerLoader width="80%" height={16} borderRadius={8} />
          <View style={{ height: 8 }} />
          <ShimmerLoader width="50%" height={14} borderRadius={7} />
          <View style={{ height: 8 }} />
          <ShimmerLoader width="40%" height={14} borderRadius={7} />
        </View>
        
        {/* Quantity Controls */}
        <View style={styles.quantitySection}>
          <ShimmerLoader width={30} height={30} borderRadius={15} />
          <View style={{ height: 8 }} />
          <ShimmerLoader width={30} height={20} borderRadius={10} />
          <View style={{ height: 8 }} />
          <ShimmerLoader width={30} height={30} borderRadius={15} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  details: {
    flex: 1,
    marginLeft: 12,
  },
  quantitySection: {
    alignItems: 'center',
    marginLeft: 12,
  },
});

export default CartItemSkeleton;
