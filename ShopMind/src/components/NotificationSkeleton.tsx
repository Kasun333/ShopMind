import React from 'react';
import { View, StyleSheet } from 'react-native';
import ShimmerLoader from './ShimmerLoader';

const NotificationSkeleton: React.FC = () => {
  return (
    <View style={styles.skeletonCard}>
      <View style={styles.headerRow}>
        <ShimmerLoader height={40} width={40} borderRadius={20} />
        <View style={styles.contentSkeleton}>
          <ShimmerLoader height={16} width="60%" borderRadius={6} style={styles.titleSkeleton} />
          <ShimmerLoader height={12} width="40%" borderRadius={6} />
        </View>
        <ShimmerLoader height={12} width={50} borderRadius={6} />
      </View>
      <ShimmerLoader height={36} width="100%" borderRadius={8} style={styles.messageSkeleton} />
    </View>
  );
};

const styles = StyleSheet.create({
  skeletonCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F3F5',
    shadowColor: 'rgba(0, 0, 0, 0.08)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  contentSkeleton: {
    flex: 1,
    marginLeft: 12,
  },
  titleSkeleton: {
    marginBottom: 6,
  },
  messageSkeleton: {
    marginTop: 4,
  },
});

export default NotificationSkeleton;
