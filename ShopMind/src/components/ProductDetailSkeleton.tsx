import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import ShimmerLoader from './ShimmerLoader';

const { width } = Dimensions.get('window');

const ProductDetailSkeleton: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* Image Skeleton */}
      <View style={styles.imageContainer}>
        <ShimmerLoader width={width} height={400} borderRadius={0} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Category Badge */}
        <ShimmerLoader width={100} height={24} borderRadius={12} />
        
        {/* Title */}
        <View style={{ marginTop: 16 }}>
          <ShimmerLoader width="90%" height={28} borderRadius={8} />
          <View style={{ height: 8 }} />
          <ShimmerLoader width="70%" height={28} borderRadius={8} />
        </View>

        {/* Rating */}
        <View style={{ marginTop: 16, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <ShimmerLoader width={120} height={20} borderRadius={10} />
          <ShimmerLoader width={80} height={20} borderRadius={10} />
        </View>

        {/* Price */}
        <View style={{ marginTop: 20 }}>
          <ShimmerLoader width={60} height={16} borderRadius={8} />
          <View style={{ height: 8 }} />
          <ShimmerLoader width={140} height={36} borderRadius={10} />
        </View>

        {/* Stock */}
        <View style={{ marginTop: 16 }}>
          <ShimmerLoader width={150} height={20} borderRadius={10} />
        </View>

        {/* Description */}
        <View style={{ marginTop: 24 }}>
          <ShimmerLoader width={100} height={20} borderRadius={10} />
          <View style={{ height: 12 }} />
          <ShimmerLoader width="100%" height={14} borderRadius={7} />
          <View style={{ height: 8 }} />
          <ShimmerLoader width="95%" height={14} borderRadius={7} />
          <View style={{ height: 8 }} />
          <ShimmerLoader width="85%" height={14} borderRadius={7} />
        </View>

        {/* Quantity and Add to Cart */}
        <View style={{ marginTop: 32, flexDirection: 'row', gap: 12 }}>
          <ShimmerLoader width={120} height={50} borderRadius={25} />
          <View style={{ flex: 1 }}>
            <ShimmerLoader width="100%" height={50} borderRadius={25} />
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  imageContainer: {
    width: width,
    height: 400,
    backgroundColor: '#E5E7EB',
  },
  content: {
    padding: 20,
  },
});

export default ProductDetailSkeleton;
