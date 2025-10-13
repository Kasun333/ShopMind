import React from 'react';
import { View, StyleSheet } from 'react-native';
import ShimmerLoader from './ShimmerLoader';

const OrderSkeleton: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* Header Row */}
      <View style={styles.headerRow}>
        <View style={styles.leftSection}>
          <ShimmerLoader width={80} height={14} borderRadius={7} />
          <View style={{ height: 6 }} />
          <ShimmerLoader width={120} height={12} borderRadius={6} />
        </View>
        <ShimmerLoader width={70} height={28} borderRadius={14} />
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Product Row */}
      <View style={styles.productRow}>
        <ShimmerLoader width={60} height={60} borderRadius={12} />
        <View style={styles.productInfo}>
          <ShimmerLoader width="80%" height={14} borderRadius={7} />
          <View style={{ height: 8 }} />
          <ShimmerLoader width="60%" height={12} borderRadius={6} />
          <View style={{ height: 8 }} />
          <ShimmerLoader width="40%" height={12} borderRadius={6} />
        </View>
      </View>

      {/* Footer Row */}
      <View style={styles.footerRow}>
        <View style={styles.totalSection}>
          <ShimmerLoader width={60} height={12} borderRadius={6} />
          <View style={{ height: 6 }} />
          <ShimmerLoader width={90} height={16} borderRadius={8} />
        </View>
        <ShimmerLoader width={100} height={36} borderRadius={18} />
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  leftSection: {
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  productRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  totalSection: {
    flex: 1,
  },
});

export default OrderSkeleton;
