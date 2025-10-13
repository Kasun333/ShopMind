import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import ShimmerLoader from './ShimmerLoader';

const { width } = Dimensions.get('window');

const DiscountSkeleton: React.FC = () => {
  return (
    <View style={styles.skeletonCard}>
      <View style={styles.headerSkeleton}>
        <ShimmerLoader height={28} width={80} borderRadius={14} />
        <ShimmerLoader height={24} width={120} borderRadius={12} />
      </View>
      <ShimmerLoader height={20} width="70%" borderRadius={6} style={styles.titleSkeleton} />
      <ShimmerLoader height={16} width="50%" borderRadius={6} style={styles.codeSkeleton} />
      <ShimmerLoader height={40} width="100%" borderRadius={6} style={styles.descSkeleton} />
      <View style={styles.divider} />
      <View style={styles.detailsSkeleton}>
        <View style={styles.detailRow}>
          <ShimmerLoader height={14} width={100} borderRadius={4} />
          <ShimmerLoader height={14} width={60} borderRadius={4} />
        </View>
        <View style={styles.detailRow}>
          <ShimmerLoader height={14} width={90} borderRadius={4} />
          <ShimmerLoader height={14} width={70} borderRadius={4} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  skeletonCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F3F5',
    shadowColor: 'rgba(0, 0, 0, 0.08)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  headerSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleSkeleton: {
    marginBottom: 8,
  },
  codeSkeleton: {
    marginBottom: 12,
  },
  descSkeleton: {
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginBottom: 16,
  },
  detailsSkeleton: {
    gap: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});

export default DiscountSkeleton;
