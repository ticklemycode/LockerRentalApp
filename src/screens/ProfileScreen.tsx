import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { AppDispatch, RootState } from '../store';
import { logoutUser, updateProfile } from '../store/authSlice';
import { validateEmail } from '../utils/helpers';
import { Booking } from '../types';

interface EditProfileData {
  firstName: string;
  lastName: string;
  phone: string;
}

const ProfileScreen: React.FC = () => {
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editData, setEditData] = useState<EditProfileData>({
    firstName: '',
    lastName: '',
    phone: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const dispatch = useDispatch<AppDispatch>();
  const { user, isLoading } = useSelector((state: RootState) => state.auth);
  const { bookings } = useSelector((state: RootState) => state.booking);

  useEffect(() => {
    if (user) {
      setEditData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phoneNumber || '',
      });
    }
  }, [user]);

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => dispatch(logoutUser()),
        },
      ]
    );
  };

  const validateEditForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!editData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!editData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (editData.phone && !/^\+?[\d\s\-\(\)]+$/.test(editData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveProfile = async () => {
    if (!validateEditForm()) {
      return;
    }

    try {
      await dispatch(updateProfile(editData));
      setEditModalVisible(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update profile');
    }
  };

  const updateEditField = (field: keyof EditProfileData, value: string) => {
    setEditData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const getBookingStats = () => {
    const totalBookings = bookings?.length || 0;
    const activeBookings = bookings?.filter((b: Booking) => b.status === 'active').length || 0;
    const completedBookings = bookings?.filter((b: Booking) => b.status === 'completed').length || 0;
    const cancelledBookings = bookings?.filter((b: Booking) => b.status === 'cancelled').length || 0;

    return { totalBookings, activeBookings, completedBookings, cancelledBookings };
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.profileInfo}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.firstName?.charAt(0)?.toUpperCase()}{user?.lastName?.charAt(0)?.toUpperCase()}
          </Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user?.firstName} {user?.lastName}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          {user?.phoneNumber && <Text style={styles.userPhone}>{user.phoneNumber}</Text>}
        </View>
      </View>
      
      <TouchableOpacity
        style={styles.editButton}
        onPress={() => setEditModalVisible(true)}
      >
        <Ionicons name="pencil" size={16} color="#2E86AB" />
        <Text style={styles.editButtonText}>Edit</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStats = () => {
    const stats = getBookingStats();

    return (
      <View style={styles.statsContainer}>
        <Text style={styles.sectionTitle}>Booking Statistics</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.totalBookings}</Text>
            <Text style={styles.statLabel}>Total Bookings</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.activeBookings}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.completedBookings}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.cancelledBookings}</Text>
            <Text style={styles.statLabel}>Cancelled</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderMenuOptions = () => (
    <View style={styles.menuContainer}>
      <Text style={styles.sectionTitle}>Account</Text>
      
      <TouchableOpacity style={styles.menuItem}>
        <Ionicons name="card-outline" size={20} color="#666" />
        <Text style={styles.menuItemText}>Payment Methods</Text>
        <Ionicons name="chevron-forward" size={16} color="#ccc" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.menuItem}>
        <Ionicons name="notifications-outline" size={20} color="#666" />
        <Text style={styles.menuItemText}>Notifications</Text>
        <Ionicons name="chevron-forward" size={16} color="#ccc" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.menuItem}>
        <Ionicons name="shield-outline" size={20} color="#666" />
        <Text style={styles.menuItemText}>Privacy & Security</Text>
        <Ionicons name="chevron-forward" size={16} color="#ccc" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.menuItem}>
        <Ionicons name="help-circle-outline" size={20} color="#666" />
        <Text style={styles.menuItemText}>Help & Support</Text>
        <Ionicons name="chevron-forward" size={16} color="#ccc" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.menuItem}>
        <Ionicons name="document-text-outline" size={20} color="#666" />
        <Text style={styles.menuItemText}>Terms & Conditions</Text>
        <Ionicons name="chevron-forward" size={16} color="#ccc" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.menuItem}>
        <Ionicons name="information-circle-outline" size={20} color="#666" />
        <Text style={styles.menuItemText}>About</Text>
        <Ionicons name="chevron-forward" size={16} color="#ccc" />
      </TouchableOpacity>
    </View>
  );

  const renderEditModal = () => (
    <Modal
      visible={editModalVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setEditModalVisible(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setEditModalVisible(false)}>
            <Text style={styles.cancelButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Edit Profile</Text>
          <TouchableOpacity 
            onPress={handleSaveProfile}
            disabled={isLoading}
          >
            <Text style={[styles.saveButton, isLoading && styles.disabledButton]}>
              {isLoading ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>First Name</Text>
            <TextInput
              style={[styles.input, errors.firstName && styles.inputError]}
              value={editData.firstName}
              onChangeText={(value) => updateEditField('firstName', value)}
              placeholder="Enter first name"
              autoCapitalize="words"
            />
            {errors.firstName && <Text style={styles.errorText}>{errors.firstName}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Last Name</Text>
            <TextInput
              style={[styles.input, errors.lastName && styles.inputError]}
              value={editData.lastName}
              onChangeText={(value) => updateEditField('lastName', value)}
              placeholder="Enter last name"
              autoCapitalize="words"
            />
            {errors.lastName && <Text style={styles.errorText}>{errors.lastName}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Phone (Optional)</Text>
            <TextInput
              style={[styles.input, errors.phone && styles.inputError]}
              value={editData.phone}
              onChangeText={(value) => updateEditField('phone', value)}
              placeholder="Enter phone number"
              keyboardType="phone-pad"
            />
            {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, styles.disabledInput]}
              value={user?.email}
              editable={false}
            />
            <Text style={styles.helperText}>Email cannot be changed</Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {renderHeader()}
      {renderStats()}
      {renderMenuOptions()}
      
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="#E74C3C" />
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>

      {renderEditModal()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2E86AB',
    padding: 20,
    paddingBottom: 30,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 2,
  },
  userPhone: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  editButtonText: {
    color: '#2E86AB',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  statsContainer: {
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E86AB',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  menuContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 40,
    paddingVertical: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  logoutText: {
    fontSize: 16,
    color: '#E74C3C',
    fontWeight: '600',
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  cancelButton: {
    fontSize: 16,
    color: '#666',
  },
  saveButton: {
    fontSize: 16,
    color: '#2E86AB',
    fontWeight: '600',
  },
  disabledButton: {
    color: '#ccc',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: '#e74c3c',
  },
  disabledInput: {
    backgroundColor: '#f8f9fa',
    color: '#666',
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 12,
    marginTop: 4,
  },
  helperText: {
    color: '#666',
    fontSize: 12,
    marginTop: 4,
  },
});

export default ProfileScreen;
