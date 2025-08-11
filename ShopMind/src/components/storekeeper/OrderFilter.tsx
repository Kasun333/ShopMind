import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  Dimensions,
} from 'react-native';
import { OrderFilters } from '../../types/Order';

const { width } = Dimensions.get('window');

interface OrderFilterProps {
  filters: OrderFilters;
  onFiltersChange: (filters: OrderFilters) => void;
}

const OrderFilter: React.FC<OrderFilterProps> = ({ filters, onFiltersChange }) => {
  const [showModal, setShowModal] = useState(false);
  const [tempFilters, setTempFilters] = useState<OrderFilters>(filters);

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'preparing', label: 'Preparing' },
    { value: 'ready', label: 'Ready' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  const paymentStatusOptions = [
    { value: '', label: 'All Payment Status' },
    { value: 'pending', label: 'Pending' },
    { value: 'paid', label: 'Paid' },
    { value: 'failed', label: 'Failed' },
    { value: 'refunded', label: 'Refunded' },
  ];

  const priorityOptions = [
    { value: '', label: 'All Priority' },
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' },
  ];

  const applyFilters = () => {
    onFiltersChange(tempFilters);
    setShowModal(false);
  };

  const clearFilters = () => {
    const clearedFilters: OrderFilters = {};
    setTempFilters(clearedFilters);
    onFiltersChange(clearedFilters);
    setShowModal(false);
  };

  const updateTempFilter = (key: keyof OrderFilters, value: string) => {
    setTempFilters(prev => ({
      ...prev,
      [key]: value || undefined,
    }));
  };

  const getActiveFiltersCount = () => {
    return Object.values(filters).filter(value => value && value.length > 0).length;
  };

  return (
    <View style={styles.container}>
      {/* Search Input */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search orders..."
          placeholderTextColor="#94A3B8"
          value={filters.searchText || ''}
          onChangeText={(text) => onFiltersChange({ ...filters, searchText: text })}
        />
      </View>

      {/* Filter Button */}
      <TouchableOpacity
        style={[styles.filterButton, getActiveFiltersCount() > 0 && styles.filterButtonActive]}
        onPress={() => setShowModal(true)}
      >
        <Text style={[styles.filterText, getActiveFiltersCount() > 0 && styles.filterTextActive]}>
          🔍 Filter {getActiveFiltersCount() > 0 && `(${getActiveFiltersCount()})`}
        </Text>
      </TouchableOpacity>

      {/* Filter Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Orders</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Order Status Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Order Status</Text>
                <View style={styles.optionsContainer}>
                  {statusOptions.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.optionButton,
                        tempFilters.status === option.value && styles.optionButtonActive
                      ]}
                      onPress={() => updateTempFilter('status', option.value)}
                    >
                      <Text style={[
                        styles.optionText,
                        tempFilters.status === option.value && styles.optionTextActive
                      ]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Payment Status Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Payment Status</Text>
                <View style={styles.optionsContainer}>
                  {paymentStatusOptions.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.optionButton,
                        tempFilters.paymentStatus === option.value && styles.optionButtonActive
                      ]}
                      onPress={() => updateTempFilter('paymentStatus', option.value)}
                    >
                      <Text style={[
                        styles.optionText,
                        tempFilters.paymentStatus === option.value && styles.optionTextActive
                      ]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Priority Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Priority</Text>
                <View style={styles.optionsContainer}>
                  {priorityOptions.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.optionButton,
                        tempFilters.priority === option.value && styles.optionButtonActive
                      ]}
                      onPress={() => updateTempFilter('priority', option.value)}
                    >
                      <Text style={[
                        styles.optionText,
                        tempFilters.priority === option.value && styles.optionTextActive
                      ]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Date Range Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Date Range</Text>
                <View style={styles.dateInputsContainer}>
                  <View style={styles.dateInputContainer}>
                    <Text style={styles.dateLabel}>From</Text>
                    <TextInput
                      style={styles.dateInput}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor="#94A3B8"
                      value={tempFilters.dateFrom || ''}
                      onChangeText={(text) => updateTempFilter('dateFrom', text)}
                    />
                  </View>
                  <View style={styles.dateInputContainer}>
                    <Text style={styles.dateLabel}>To</Text>
                    <TextInput
                      style={styles.dateInput}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor="#94A3B8"
                      value={tempFilters.dateTo || ''}
                      onChangeText={(text) => updateTempFilter('dateTo', text)}
                    />
                  </View>
                </View>
              </View>
            </ScrollView>

            {/* Modal Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
                <Text style={styles.clearButtonText}>Clear All</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyButton} onPress={applyFilters}>
                <Text style={styles.applyButtonText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  searchContainer: {
    marginBottom: 12,
  },
  searchInput: {
    height: 48,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#0F172A',
  },
  filterButton: {
    height: 40,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  filterButtonActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  closeButton: {
    fontSize: 20,
    color: '#64748B',
    fontWeight: '600',
  },
  modalBody: {
    padding: 20,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 20,
  },
  optionButtonActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  optionTextActive: {
    color: '#FFFFFF',
  },
  dateInputsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  dateInputContainer: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
    marginBottom: 6,
  },
  dateInput: {
    height: 44,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#0F172A',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  clearButton: {
    flex: 1,
    height: 48,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
  applyButton: {
    flex: 1,
    height: 48,
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default OrderFilter;
