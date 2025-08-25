import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  SafeAreaView,
  Alert,
  Modal,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { TruckInfo, MaintenanceSchedule, BreakdownReport } from '../../types/Driver';

const { width, height } = Dimensions.get('window');

interface TruckMaintenanceProps {
  onBack: () => void;
}

const TruckMaintenance: React.FC<TruckMaintenanceProps> = ({ onBack }) => {
  const [truckInfo, setTruckInfo] = useState<TruckInfo | null>(null);
  const [maintenanceSchedule, setMaintenanceSchedule] = useState<MaintenanceSchedule[]>([]);
  const [showBreakdownModal, setShowBreakdownModal] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [breakdownDescription, setBreakdownDescription] = useState('');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [isLoadingAI, setIsLoadingAI] = useState(false);

  const symptoms = [
    'Engine making unusual noise',
    'Engine overheating',
    'Transmission problems',
    'Brake issues',
    'Electrical problems',
    'Steering difficulties',
    'Unusual vibrations',
    'Oil leakage',
    'Coolant leakage',
    'Battery issues',
    'Tire problems',
    'Fuel system issues',
  ];

  useEffect(() => {
    loadTruckData();
  }, []);

  const loadTruckData = () => {
    // Hardcoded truck data
    const mockTruck: TruckInfo = {
      id: 'TRK001',
      licensePlate: 'CAB-1234',
      model: 'Isuzu D-Max',
      year: 2020,
      mileage: 45000,
      lastMaintenanceDate: '2024-07-15',
      nextMaintenanceDate: '2024-08-30',
      maintenanceStatus: 'due_soon',
      fuelLevel: 75,
      engineHours: 2100
    };

    const mockSchedule: MaintenanceSchedule[] = [
      {
        id: 'MS001',
        type: 'oil_change',
        description: 'Engine oil and filter change',
        dueDate: '2024-08-30',
        dueMileage: 50000,
        priority: 'high',
        completed: false
      },
      {
        id: 'MS002',
        type: 'tire_rotation',
        description: 'Rotate and balance tires',
        dueDate: '2024-09-15',
        dueMileage: 52000,
        priority: 'medium',
        completed: false
      },
      {
        id: 'MS003',
        type: 'brake_inspection',
        description: 'Brake pads and disc inspection',
        dueDate: '2024-10-01',
        dueMileage: 55000,
        priority: 'high',
        completed: false
      },
      {
        id: 'MS004',
        type: 'general_inspection',
        description: 'Complete vehicle inspection',
        dueDate: '2024-11-01',
        dueMileage: 60000,
        priority: 'medium',
        completed: false
      }
    ];

    setTruckInfo(mockTruck);
    setMaintenanceSchedule(mockSchedule);
  };

  const handleSymptomToggle = (symptom: string) => {
    setSelectedSymptoms(prev => 
      prev.includes(symptom)
        ? prev.filter(s => s !== symptom)
        : [...prev, symptom]
    );
  };

  const getAISuggestions = async () => {
    setIsLoadingAI(true);
    
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Hardcoded AI suggestions based on symptoms
    let suggestions: string[] = [];
    
    if (selectedSymptoms.includes('Engine making unusual noise')) {
      suggestions.push('Check engine oil level and quality - low or dirty oil can cause unusual noises');
      suggestions.push('Inspect fan belts for wear or looseness - damaged belts create squealing sounds');
      suggestions.push('Examine air filter - clogged filter can cause engine to work harder and make noise');
    }
    
    if (selectedSymptoms.includes('Engine overheating')) {
      suggestions.push('Check coolant level immediately - low coolant is the most common cause');
      suggestions.push('Inspect radiator for blockages or damage - clean debris from radiator fins');
      suggestions.push('Verify thermostat operation - faulty thermostat can prevent proper cooling');
      suggestions.push('Check for coolant leaks under the vehicle');
    }
    
    if (selectedSymptoms.includes('Brake issues')) {
      suggestions.push('Check brake fluid level - low fluid indicates potential leak or worn pads');
      suggestions.push('Listen for grinding sounds - indicates brake pads need immediate replacement');
      suggestions.push('Test brake pedal feel - spongy pedal suggests air in brake lines');
      suggestions.push('Inspect brake discs for scoring or warping');
    }
    
    if (selectedSymptoms.includes('Electrical problems')) {
      suggestions.push('Check battery terminals for corrosion - clean with baking soda solution');
      suggestions.push('Test battery voltage - should read 12.6V when engine off');
      suggestions.push('Inspect fuses for any blown units - replace if necessary');
      suggestions.push('Check alternator belt tension and condition');
    }
    
    if (selectedSymptoms.includes('Transmission problems')) {
      suggestions.push('Check transmission fluid level and color - dark or burnt fluid needs changing');
      suggestions.push('Listen for unusual noises during gear changes');
      suggestions.push('Monitor for slipping or delayed engagement');
      suggestions.push('Avoid heavy loads until professionally inspected');
    }
    
    if (selectedSymptoms.includes('Oil leakage')) {
      suggestions.push('Locate source of leak - check under vehicle after parking');
      suggestions.push('Monitor oil level frequently - top up as needed to prevent engine damage');
      suggestions.push('Check oil drain plug and filter for proper sealing');
      suggestions.push('Schedule immediate inspection if leak is significant');
    }
    
    // Add general safety suggestions
    suggestions.push('If problem persists or worsens, stop driving immediately and contact dispatch');
    suggestions.push('Document all symptoms with photos if possible for mechanic reference');
    suggestions.push('Keep emergency contact numbers readily available');
    
    setAiSuggestions(suggestions);
    setIsLoadingAI(false);
    setShowAIAssistant(true);
  };

  const submitBreakdownReport = () => {
    if (!breakdownDescription.trim() || selectedSymptoms.length === 0) {
      Alert.alert('Error', 'Please provide description and select at least one symptom');
      return;
    }

    const report: BreakdownReport = {
      id: `BR${Date.now()}`,
      truckId: truckInfo?.id || '',
      driverId: 'DR001',
      timestamp: new Date().toISOString(),
      location: {
        latitude: 6.9271,
        longitude: 79.8612,
        address: 'Colombo 03, Sri Lanka'
      },
      description: breakdownDescription,
      symptoms: selectedSymptoms,
      severity: selectedSymptoms.length > 3 ? 'severe' : selectedSymptoms.length > 1 ? 'moderate' : 'minor',
      status: 'reported',
      aiSuggestions: aiSuggestions
    };

    Alert.alert(
      'Breakdown Report Submitted',
      'Your breakdown report has been submitted. Emergency assistance will be dispatched if needed.',
      [
        {
          text: 'OK',
          onPress: () => {
            setShowBreakdownModal(false);
            setShowAIAssistant(false);
            setBreakdownDescription('');
            setSelectedSymptoms([]);
            setAiSuggestions([]);
          }
        }
      ]
    );
  };

  const getMaintenanceStatusColor = (status: TruckInfo['maintenanceStatus']) => {
    switch (status) {
      case 'good':
        return '#16A34A';
      case 'due_soon':
        return '#F59E0B';
      case 'overdue':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const getMaintenanceStatusText = (status: TruckInfo['maintenanceStatus']) => {
    switch (status) {
      case 'good':
        return 'Good';
      case 'due_soon':
        return 'Due Soon';
      case 'overdue':
        return 'Overdue';
      default:
        return 'Unknown';
    }
  };

  const getPriorityColor = (priority: MaintenanceSchedule['priority']) => {
    switch (priority) {
      case 'critical':
        return '#EF4444';
      case 'high':
        return '#F59E0B';
      case 'medium':
        return '#3B82F6';
      case 'low':
        return '#6B7280';
      default:
        return '#6B7280';
    }
  };

  if (!truckInfo) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#8B5CF6', '#7C3AED']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Truck Maintenance</Text>
          <TouchableOpacity style={styles.menuButton}>
            <Ionicons name="settings" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.truckInfoHeader}>
          <Text style={styles.truckPlate}>{truckInfo.licensePlate}</Text>
          <Text style={styles.truckModel}>{truckInfo.model} ({truckInfo.year})</Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Truck Status Overview */}
        <View style={styles.statusCard}>
          <Text style={styles.cardTitle}>Vehicle Status</Text>
          
          <View style={styles.statusGrid}>
            <View style={styles.statusItem}>
              <Ionicons name="speedometer" size={24} color="#3B82F6" />
              <Text style={styles.statusLabel}>Fuel Level</Text>
              <Text style={styles.statusValue}>{truckInfo.fuelLevel}%</Text>
            </View>
            
            <View style={styles.statusItem}>
              <Ionicons name="analytics" size={24} color="#6B7280" />
              <Text style={styles.statusLabel}>Mileage</Text>
              <Text style={styles.statusValue}>{truckInfo.mileage.toLocaleString()}km</Text>
            </View>
            
            <View style={styles.statusItem}>
              <Ionicons name="time" size={24} color="#6B7280" />
              <Text style={styles.statusLabel}>Engine Hours</Text>
              <Text style={styles.statusValue}>{truckInfo.engineHours}h</Text>
            </View>
            
            <View style={styles.statusItem}>
              <Ionicons name="build" size={24} color={getMaintenanceStatusColor(truckInfo.maintenanceStatus)} />
              <Text style={styles.statusLabel}>Maintenance</Text>
              <Text style={[styles.statusValue, { color: getMaintenanceStatusColor(truckInfo.maintenanceStatus) }]}>
                {getMaintenanceStatusText(truckInfo.maintenanceStatus)}
              </Text>
            </View>
          </View>
        </View>

        {/* Emergency Breakdown Report */}
        <View style={styles.emergencyCard}>
          <View style={styles.emergencyHeader}>
            <Ionicons name="warning" size={24} color="#EF4444" />
            <Text style={styles.emergencyTitle}>Emergency Breakdown</Text>
          </View>
          <Text style={styles.emergencyDescription}>
            Report any breakdown or mechanical issue immediately
          </Text>
          <TouchableOpacity 
            style={styles.emergencyButton}
            onPress={() => setShowBreakdownModal(true)}
          >
            <Ionicons name="alert-circle" size={20} color="#FFFFFF" />
            <Text style={styles.emergencyButtonText}>Report Breakdown</Text>
          </TouchableOpacity>
        </View>

        {/* Maintenance Schedule */}
        <View style={styles.scheduleCard}>
          <Text style={styles.cardTitle}>Maintenance Schedule</Text>
          
          {maintenanceSchedule.map((item) => (
            <View key={item.id} style={styles.scheduleItem}>
              <View style={styles.scheduleHeader}>
                <View style={styles.scheduleInfo}>
                  <Text style={styles.scheduleDescription}>{item.description}</Text>
                  <Text style={styles.scheduleDue}>Due: {item.dueDate} ({item.dueMileage.toLocaleString()}km)</Text>
                </View>
                <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) }]}>
                  <Text style={styles.priorityText}>{item.priority.toUpperCase()}</Text>
                </View>
              </View>
              
              {!item.completed && (
                <TouchableOpacity 
                  style={styles.scheduleButton}
                  onPress={() => Alert.alert('Schedule Maintenance', 'Contact fleet manager to schedule this maintenance.')}
                >
                  <Text style={styles.scheduleButtonText}>Schedule</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>

        {/* Maintenance History */}
        <View style={styles.historyCard}>
          <Text style={styles.cardTitle}>Recent Maintenance</Text>
          
          <View style={styles.historyItem}>
            <View style={styles.historyInfo}>
              <Text style={styles.historyDescription}>Engine oil and filter change</Text>
              <Text style={styles.historyDate}>Completed: {truckInfo.lastMaintenanceDate}</Text>
            </View>
            <Ionicons name="checkmark-circle" size={24} color="#16A34A" />
          </View>
          
          <View style={styles.historyItem}>
            <View style={styles.historyInfo}>
              <Text style={styles.historyDescription}>Tire rotation and balancing</Text>
              <Text style={styles.historyDate}>Completed: 2024-06-20</Text>
            </View>
            <Ionicons name="checkmark-circle" size={24} color="#16A34A" />
          </View>
          
          <View style={styles.historyItem}>
            <View style={styles.historyInfo}>
              <Text style={styles.historyDescription}>Brake inspection</Text>
              <Text style={styles.historyDate}>Completed: 2024-05-10</Text>
            </View>
            <Ionicons name="checkmark-circle" size={24} color="#16A34A" />
          </View>
        </View>
      </ScrollView>

      {/* Breakdown Report Modal */}
      <Modal
        visible={showBreakdownModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowBreakdownModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Report Breakdown</Text>
              <TouchableOpacity onPress={() => setShowBreakdownModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.sectionTitle}>Describe the Problem</Text>
              <TextInput
                style={styles.descriptionInput}
                placeholder="Describe what happened and current situation..."
                multiline
                numberOfLines={4}
                value={breakdownDescription}
                onChangeText={setBreakdownDescription}
              />

              <Text style={styles.sectionTitle}>Select Symptoms</Text>
              <View style={styles.symptomsContainer}>
                {symptoms.map((symptom) => (
                  <TouchableOpacity
                    key={symptom}
                    style={[
                      styles.symptomChip,
                      selectedSymptoms.includes(symptom) && styles.selectedSymptomChip
                    ]}
                    onPress={() => handleSymptomToggle(symptom)}
                  >
                    <Text style={[
                      styles.symptomText,
                      selectedSymptoms.includes(symptom) && styles.selectedSymptomText
                    ]}>
                      {symptom}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity 
                style={styles.aiButton}
                onPress={getAISuggestions}
                disabled={selectedSymptoms.length === 0 || isLoadingAI}
              >
                <Ionicons name="bulb" size={20} color="#FFFFFF" />
                <Text style={styles.aiButtonText}>
                  {isLoadingAI ? 'Getting AI Suggestions...' : 'Get AI Assistance'}
                </Text>
              </TouchableOpacity>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.submitButton}
                onPress={submitBreakdownReport}
              >
                <Text style={styles.submitButtonText}>Submit Report</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* AI Assistant Modal */}
      <Modal
        visible={showAIAssistant}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAIAssistant(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>AI Maintenance Assistant</Text>
              <TouchableOpacity onPress={() => setShowAIAssistant(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.aiHeader}>
                <Ionicons name="bulb" size={32} color="#F59E0B" />
                <Text style={styles.aiTitle}>Suggested Solutions</Text>
              </View>

              {aiSuggestions.map((suggestion, index) => (
                <View key={index} style={styles.suggestionItem}>
                  <View style={styles.suggestionNumber}>
                    <Text style={styles.suggestionNumberText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.suggestionText}>{suggestion}</Text>
                </View>
              ))}

              <View style={styles.aiDisclaimer}>
                <Ionicons name="information-circle" size={20} color="#6B7280" />
                <Text style={styles.disclaimerText}>
                  These are AI-generated suggestions. For serious issues, always consult with a qualified mechanic.
                </Text>
              </View>
            </ScrollView>
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
  header: {
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  menuButton: {
    padding: 4,
  },
  truckInfoHeader: {
    alignItems: 'center',
  },
  truckPlate: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  truckModel: {
    fontSize: 16,
    color: '#E0E7FF',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statusItem: {
    alignItems: 'center',
    width: '48%',
    marginBottom: 16,
  },
  statusLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
    marginBottom: 4,
  },
  statusValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  emergencyCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  emergencyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  emergencyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#EF4444',
    marginLeft: 12,
  },
  emergencyDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  emergencyButton: {
    backgroundColor: '#EF4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
  },
  emergencyButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 8,
  },
  scheduleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  scheduleItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 16,
    marginBottom: 16,
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  scheduleInfo: {
    flex: 1,
  },
  scheduleDescription: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 4,
  },
  scheduleDue: {
    fontSize: 14,
    color: '#6B7280',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 12,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  scheduleButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  scheduleButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  historyInfo: {
    flex: 1,
  },
  historyDescription: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 4,
  },
  historyDate: {
    fontSize: 12,
    color: '#6B7280',
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
    paddingTop: 20,
    maxHeight: height * 0.9,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalBody: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 12,
  },
  descriptionInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    textAlignVertical: 'top',
    marginBottom: 8,
  },
  symptomsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  symptomChip: {
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
  },
  selectedSymptomChip: {
    backgroundColor: '#3B82F6',
  },
  symptomText: {
    fontSize: 12,
    color: '#6B7280',
  },
  selectedSymptomText: {
    color: '#FFFFFF',
  },
  aiButton: {
    backgroundColor: '#F59E0B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  aiButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 8,
  },
  modalActions: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  submitButton: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 16,
  },
  aiTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 12,
  },
  suggestionItem: {
    flexDirection: 'row',
    marginBottom: 16,
    paddingRight: 16,
  },
  suggestionNumber: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  suggestionNumberText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  suggestionText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  aiDisclaimer: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    marginBottom: 32,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 8,
    lineHeight: 16,
  },
});

export default TruckMaintenance;
