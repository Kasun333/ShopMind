import * as React from 'react';
import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { User } from '../../types/User';
import { VehicleDetails, DriverAssignment } from '../../types/Driver';
import { driverService } from '../../services/driverService';

interface VehicleScreenProps {
  user: User;
  token: string;
}

const VehicleScreen: React.FC<VehicleScreenProps> = ({
  user,
  token,
}) => {
  const [vehicleDetails, setVehicleDetails] = useState<VehicleDetails | null>(null);
  const [assignment, setAssignment] = useState<DriverAssignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);

  useEffect(() => {
    loadVehicleData();
  }, []);

  const loadVehicleData = async () => {
    setLoading(true);
    try {
      // First get driver details to get driverId
      const driverResponse = await driverService.getDriverByUserId(parseInt(user.id), token);
      if (driverResponse.success) {
        const driverId = driverResponse.data.driverId;
        
        // Get driver assignments
        const assignmentResponse = await driverService.getDriverAssignments(driverId, token);
        if (assignmentResponse.success && assignmentResponse.data.length > 0) {
          const activeAssignment = assignmentResponse.data.find(a => a.status === 'ACTIVE');
          if (activeAssignment) {
            setAssignment(activeAssignment);
            
            // Get vehicle details
            const vehicleResponse = await driverService.getVehicleDetails(activeAssignment.vehicleId, token);
            if (vehicleResponse.success) {
              setVehicleDetails(vehicleResponse.data);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error loading vehicle data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'available':
        return '#16A34A';
      case 'in_use':
        return '#F59E0B';
      case 'maintenance':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const getStatusText = (status: string) => {
    return status.replace('_', ' ').toUpperCase();
  };

  const getMaintenanceStatus = () => {
    if (!vehicleDetails) return { status: 'unknown', color: '#6B7280', text: 'Unknown' };
    
    const nextMaintenance = new Date(vehicleDetails.nextMaintenance);
    const today = new Date();
    const daysUntilMaintenance = Math.ceil((nextMaintenance.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilMaintenance < 0) {
      return { status: 'overdue', color: '#EF4444', text: 'Overdue' };
    } else if (daysUntilMaintenance <= 7) {
      return { status: 'due_soon', color: '#F59E0B', text: 'Due Soon' };
    } else {
      return { status: 'good', color: '#16A34A', text: 'Good' };
    }
  };

  const maintenanceStatus = getMaintenanceStatus();

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Ionicons name="car-outline" size={48} color="#6B7280" />
          <Text style={styles.loadingText}>Loading vehicle details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <LinearGradient
            colors={['#3B82F6', '#1D4ED8']}
            style={styles.headerGradient}
          >
            <View style={styles.headerContent}>
              <View style={styles.headerLeft}>
                <Ionicons name="car-sport" size={32} color="#FFFFFF" />
                <View style={styles.headerText}>
                  <Text style={styles.headerTitle}>My Vehicle</Text>
                  <Text style={styles.headerSubtitle}>Vehicle Information</Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Vehicle Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="car" size={24} color="#3B82F6" />
            <Text style={styles.cardTitle}>Vehicle Status</Text>
          </View>
          
          {vehicleDetails ? (
            <View style={styles.statusContent}>
              <View style={styles.statusRow}>
                <View style={styles.statusItem}>
                  <Text style={styles.statusLabel}>Status</Text>
                  <View style={styles.statusBadge}>
                    <View style={[styles.statusDot, { backgroundColor: getStatusColor(vehicleDetails.status) }]} />
                    <Text style={[styles.statusText, { color: getStatusColor(vehicleDetails.status) }]}>
                      {getStatusText(vehicleDetails.status)}
                    </Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.vehicleInfo}>
                <Text style={styles.vehicleNumber}>{vehicleDetails.vehicleNumber}</Text>
                <Text style={styles.vehicleModel}>{vehicleDetails.year} {vehicleDetails.make} {vehicleDetails.model}</Text>
              </View>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="car-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>No Vehicle Assigned</Text>
              <Text style={styles.emptyMessage}>You don't have an assigned vehicle at the moment.</Text>
            </View>
          )}
        </View>

        {/* Vehicle Details */}
        {vehicleDetails && (
          <View style={styles.detailsCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="information-circle" size={24} color="#8B5CF6" />
              <Text style={styles.cardTitle}>Vehicle Details</Text>
            </View>
            
            <View style={styles.detailsContent}>
              <View style={styles.detailRow}>
                <View style={styles.detailItem}>
                  <Ionicons name="speedometer" size={20} color="#6B7280" />
                  <Text style={styles.detailLabel}>Type</Text>
                  <Text style={styles.detailValue}>{vehicleDetails.vehicleType}</Text>
                </View>
                
                <View style={styles.detailItem}>
                  <Ionicons name="cube" size={20} color="#6B7280" />
                  <Text style={styles.detailLabel}>Capacity</Text>
                  <Text style={styles.detailValue}>{vehicleDetails.capacity} tons</Text>
                </View>
              </View>
              
              <View style={styles.detailRow}>
                <View style={styles.detailItem}>
                  <Ionicons name="build" size={20} color={maintenanceStatus.color} />
                  <Text style={styles.detailLabel}>Maintenance</Text>
                  <Text style={[styles.detailValue, { color: maintenanceStatus.color }]}>
                    {maintenanceStatus.text}
                  </Text>
                </View>
                
                <View style={styles.detailItem}>
                  <Ionicons name="calendar" size={20} color="#6B7280" />
                  <Text style={styles.detailLabel}>Next Service</Text>
                  <Text style={styles.detailValue}>
                    {new Date(vehicleDetails.nextMaintenance).toLocaleDateString()}
                  </Text>
                </View>
              </View>
              
              <TouchableOpacity 
                style={styles.maintenanceButton}
                onPress={() => setShowMaintenanceModal(true)}
              >
                <Ionicons name="construct" size={20} color="#FFFFFF" />
                <Text style={styles.maintenanceButtonText}>View Maintenance Details</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Assignment Details */}
        {assignment && (
          <View style={styles.assignmentCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="clipboard" size={24} color="#10B981" />
              <Text style={styles.cardTitle}>Assignment Details</Text>
            </View>
            
            <View style={styles.assignmentContent}>
              <View style={styles.assignmentRow}>
                <View style={styles.assignmentItem}>
                  <Text style={styles.assignmentLabel}>Assigned Date</Text>
                  <Text style={styles.assignmentValue}>
                    {new Date(assignment.assignedAt).toLocaleDateString()}
                  </Text>
                </View>
                
                <View style={styles.assignmentItem}>
                  <Text style={styles.assignmentLabel}>Assignment ID</Text>
                  <Text style={styles.assignmentValue}>#{assignment.assignmentId}</Text>
                </View>
              </View>
              
              {assignment.notes && (
                <View style={styles.notesContainer}>
                  <Text style={styles.notesLabel}>Notes</Text>
                  <Text style={styles.notesText}>{assignment.notes}</Text>
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Maintenance Details Modal */}
      <Modal
        visible={showMaintenanceModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowMaintenanceModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Maintenance Details</Text>
              <TouchableOpacity onPress={() => setShowMaintenanceModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {vehicleDetails && (
              <ScrollView style={styles.modalBody}>
                <View style={styles.maintenanceSection}>
                  <Text style={styles.sectionTitle}>Maintenance Schedule</Text>
                  
                  <View style={styles.maintenanceItem}>
                    <View style={styles.maintenanceHeader}>
                      <Ionicons name="calendar-outline" size={20} color="#6B7280" />
                      <Text style={styles.maintenanceLabel}>Last Maintenance</Text>
                    </View>
                    <Text style={styles.maintenanceValue}>
                      {new Date(vehicleDetails.lastMaintenance).toLocaleDateString()}
                    </Text>
                  </View>
                  
                  <View style={styles.maintenanceItem}>
                    <View style={styles.maintenanceHeader}>
                      <Ionicons name="calendar" size={20} color={maintenanceStatus.color} />
                      <Text style={styles.maintenanceLabel}>Next Maintenance</Text>
                    </View>
                    <Text style={[styles.maintenanceValue, { color: maintenanceStatus.color }]}>
                      {new Date(vehicleDetails.nextMaintenance).toLocaleDateString()}
                    </Text>
                  </View>
                  
                  <View style={styles.maintenanceItem}>
                    <View style={styles.maintenanceHeader}>
                      <Ionicons name="alert-circle" size={20} color={maintenanceStatus.color} />
                      <Text style={styles.maintenanceLabel}>Status</Text>
                    </View>
                    <Text style={[styles.maintenanceValue, { color: maintenanceStatus.color }]}>
                      {maintenanceStatus.text}
                    </Text>
                  </View>
                </View>

                <View style={styles.vehicleInfoSection}>
                  <Text style={styles.sectionTitle}>Vehicle Information</Text>
                  
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Vehicle Number:</Text>
                    <Text style={styles.infoValue}>{vehicleDetails.vehicleNumber}</Text>
                  </View>
                  
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Make & Model:</Text>
                    <Text style={styles.infoValue}>{vehicleDetails.make} {vehicleDetails.model}</Text>
                  </View>
                  
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Year:</Text>
                    <Text style={styles.infoValue}>{vehicleDetails.year}</Text>
                  </View>
                  
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Type:</Text>
                    <Text style={styles.infoValue}>{vehicleDetails.vehicleType}</Text>
                  </View>
                  
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Capacity:</Text>
                    <Text style={styles.infoValue}>{vehicleDetails.capacity} tons</Text>
                  </View>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    marginBottom: 20,
  },
  headerGradient: {
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#E2E8F0',
    marginTop: 2,
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 12,
  },
  statusContent: {
    marginTop: 8,
  },
  statusRow: {
    marginBottom: 16,
  },
  statusItem: {
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  vehicleInfo: {
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  vehicleNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  vehicleModel: {
    fontSize: 16,
    color: '#6B7280',
  },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  detailsContent: {
    marginTop: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  detailItem: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  detailLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
  },
  maintenanceButton: {
    backgroundColor: '#8B5CF6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  maintenanceButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  assignmentCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  assignmentContent: {
    marginTop: 8,
  },
  assignmentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  assignmentItem: {
    flex: 1,
    alignItems: 'center',
  },
  assignmentLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  assignmentValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  notesContainer: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  notesLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: '#1F2937',
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  maintenanceSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  maintenanceItem: {
    marginBottom: 16,
  },
  maintenanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  maintenanceLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  maintenanceValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 28,
  },
  vehicleInfoSection: {
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    textAlign: 'right',
  },
});

export default VehicleScreen;
