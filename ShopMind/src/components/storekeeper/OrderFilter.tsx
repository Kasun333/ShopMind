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
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { OrderFilters } from '../../types/Order';

const { width } = Dimensions.get('window');

interface OrderFilterProps {
  filters: OrderFilters;
  onFiltersChange: (filters: OrderFilters) => void;
}

const OrderFilter: React.FC<OrderFilterProps> = ({ filters, onFiltersChange }) => {
  const [showModal, setShowModal] = useState(false);
  const [tempFilters, setTempFilters] = useState<OrderFilters>(filters);
  
  const currentDate = "2025-08-18 18:25:24";
  const username = "Kasun333";

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
        <View style={styles.searchInputWrapper}>
          <Ionicons name="search-outline" size={20} color="#64748B" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search orders..."
            placeholderTextColor="#94A3B8"
            value={filters.searchText || ''}
            onChangeText={(text) => onFiltersChange({ ...filters, searchText: text })}
          />
        </View>
      </View>

      {/* Filter Button */}
      <TouchableOpacity
        style={styles.filterButton}
        onPress={() => setShowModal(true)}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={getActiveFiltersCount() > 0 ? ['#059669', '#047857'] : ['#ECFDF5', '#D1FAE5']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.filterGradient}
        >
          <Ionicons 
            name="options-outline" 
            size={18} 
            color={getActiveFiltersCount() > 0 ? "#FFFFFF" : "#059669"} 
            style={styles.filterIcon} 
          />
          <Text style={[
            styles.filterText, 
            getActiveFiltersCount() > 0 && styles.filterTextActive
          ]}>
            Filter {getActiveFiltersCount() > 0 && `(${getActiveFiltersCount()})`}
          </Text>
        </LinearGradient>
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
            <LinearGradient
              colors={['#047857', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.modalHeader}
            >
              <Text style={styles.modalTitle}>Filter Orders</Text>
              <TouchableOpacity 
                style={styles.closeButtonContainer}
                onPress={() => setShowModal(false)}
                activeOpacity={0.8}
              >
                <Ionicons name="close-outline" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </LinearGradient>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Order Status Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>
                  <Ionicons name="list-outline" size={18} color="#047857" style={styles.filterLabelIcon} />
                  Order Status
                </Text>
                <View style={styles.optionsContainer}>
                  {statusOptions.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.optionButton,
                        tempFilters.status === option.value && styles.optionButtonActive
                      ]}
                      onPress={() => updateTempFilter('status', option.value)}
                      activeOpacity={0.7}
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
                <Text style={styles.filterLabel}>
                  <Ionicons name="card-outline" size={18} color="#047857" style={styles.filterLabelIcon} />
                  Payment Status
                </Text>
                <View style={styles.optionsContainer}>
                  {paymentStatusOptions.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.optionButton,
                        tempFilters.paymentStatus === option.value && styles.optionButtonActive
                      ]}
                      onPress={() => updateTempFilter('paymentStatus', option.value)}
                      activeOpacity={0.7}
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
                <Text style={styles.filterLabel}>
                  <Ionicons name="flag-outline" size={18} color="#047857" style={styles.filterLabelIcon} />
                  Priority
                </Text>
                <View style={styles.optionsContainer}>
                  {priorityOptions.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.optionButton,
                        tempFilters.priority === option.value && styles.optionButtonActive
                      ]}
                      onPress={() => updateTempFilter('priority', option.value)}
                      activeOpacity={0.7}
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
                <Text style={styles.filterLabel}>
                  <Ionicons name="calendar-outline" size={18} color="#047857" style={styles.filterLabelIcon} />
                  Date Range
                </Text>
                <View style={styles.dateInputsContainer}>
                  <View style={styles.dateInputContainer}>
                    <Text style={styles.dateLabel}>From</Text>
                    <View style={styles.dateInputWrapper}>
                      <Ionicons name="calendar-outline" size={16} color="#64748B" style={styles.dateIcon} />
                      <TextInput
                        style={styles.dateInput}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor="#94A3B8"
                        value={tempFilters.dateFrom || ''}
                        onChangeText={(text) => updateTempFilter('dateFrom', text)}
                      />
                    </View>
                  </View>
                  <View style={styles.dateInputContainer}>
                    <Text style={styles.dateLabel}>To</Text>
                    <View style={styles.dateInputWrapper}>
                      <Ionicons name="calendar-outline" size={16} color="#64748B" style={styles.dateIcon} />
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
              </View>
              
              {/* Modal Info Footer */}
              <View style={styles.modalInfo}>
                <Text style={styles.modalInfoText}>
                  <Ionicons name="time-outline" size={12} color="#64748B" /> {currentDate}
                </Text>
                <Text style={styles.modalInfoText}>
                  <Ionicons name="person-outline" size={12} color="#64748B" /> {username}
                </Text>
              </View>
            </ScrollView>

            {/* Modal Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.clearButton} 
                onPress={clearFilters}
                activeOpacity={0.8}
              >
                <Text style={styles.clearButtonText}>
                  <Ionicons name="trash-outline" size={16} color="#64748B" style={{marginRight: 4}} />
                  Clear All
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.applyButton} 
                onPress={applyFilters}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#059669', '#047857']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.applyGradient}
                >
                  <Text style={styles.applyButtonText}>
                    <Ionicons name="checkmark-outline" size={16} color="#FFFFFF" style={{marginRight: 4}} />
                    Apply Filters
                  </Text>
                </LinearGradient>
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
    borderBottomColor: 'rgba(5, 150, 105, 0.1)',
  },
  searchContainer: {
    marginBottom: 12,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: 'rgba(5, 150, 105, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#0F172A',
  },
  filterButton: {
    height: 44,
    borderRadius: 10,
    overflow: 'hidden',
  },
  filterGradient: {
    height: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterIcon: {
    marginRight: 8,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
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
    maxHeight: '85%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  closeButtonContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBody: {
    padding: 20,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: '#047857',
    marginBottom: 12,
  },
  filterLabelIcon: {
    marginRight: 6,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: 'rgba(5, 150, 105, 0.2)',
    borderRadius: 20,
  },
  optionButtonActive: {
    backgroundColor: '#059669',
    borderColor: '#047857',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#059669',
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
  dateInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: 'rgba(5, 150, 105, 0.2)',
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  dateIcon: {
    marginRight: 8,
  },
  dateInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
  },
  modalInfo: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(5, 150, 105, 0.1)',
    marginTop: 20,
    paddingTop: 16,
    alignItems: 'center',
  },
  modalInfoText: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(5, 150, 105, 0.1)',
  },
  clearButton: {
    flex: 1,
    height: 48,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: 'rgba(5, 150, 105, 0.2)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
    flexDirection: 'row',
    alignItems: 'center',
  },
  applyButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    overflow: 'hidden',
  },
  applyGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default OrderFilter;