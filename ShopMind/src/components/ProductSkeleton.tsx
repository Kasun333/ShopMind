import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import ShimmerLoader from './ShimmerLoader';

const { width } = Dimensions.get('window');

const ProductSkeleton: React.FC = () => {
  return (
    <View style={styles.skeletonCard}>
      <ShimmerLoader height={120} borderRadius={20} style={styles.imageSkeleton} />
      <View style={styles.contentSkeleton}>
        <ShimmerLoader height={16} borderRadius={6} style={styles.titleSkeleton} />
        <ShimmerLoader height={12} width="80%" borderRadius={6} style={styles.descSkeleton} />
        <View style={styles.footerSkeleton}>
          <ShimmerLoader height={14} width={60} borderRadius={6} />
          <ShimmerLoader height={32} width={32} borderRadius={12} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  skeletonCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F1F3F5',
    shadowColor: 'rgba(0, 0, 0, 0.06)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
    width: (width - 44) / 2,
    overflow: 'hidden',
    marginBottom: 16,
  },
  imageSkeleton: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  contentSkeleton: {
    padding: 14,
  },
  titleSkeleton: {
    marginBottom: 8,
  },
  descSkeleton: {
    marginBottom: 12,
  },
  footerSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
});

export default ProductSkeleton;
