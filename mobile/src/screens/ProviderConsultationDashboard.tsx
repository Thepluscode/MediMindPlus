/**
 * Provider Consultation Dashboard
 * View upcoming appointments, patient information, and manage consultations
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Typography, LoadingSpinner } from '../components/ui';
import { theme } from '../theme/theme';

const API_BASE_URL = 'http://localhost:3000/api';

interface Consultation {
  id: string;
  patient_first_name: string;
  patient_last_name: string;
  patient_email: string;
  scheduled_start: string;
  scheduled_end: string;
  status: string;
  consultation_type: string;
  reason_for_visit: string;
  vitals_shared: boolean;
  vitals_snapshot?: any;
}

const ProviderConsultationDashboard = ({ navigation, route }: any) => {
  const { providerId } = route.params;

  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('SCHEDULED');
  const [error, setError] = useState<string | null>(null);

  const statusFilters = [
    { label: 'Upcoming', value: 'SCHEDULED' },
    { label: 'In Progress', value: 'IN_PROGRESS' },
    { label: 'Completed', value: 'COMPLETED' },
    { label: 'All', value: '' },
  ];

  useEffect(() => {
    fetchConsultations();
  }, [selectedStatus]);

  const fetchConsultations = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        setError('Authentication required');
        return;
      }

      const params: any = {};
      if (selectedStatus) {
        params.status = selectedStatus;
      }

      const response = await axios.get(
        `${API_BASE_URL}/consultations/provider/${providerId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params,
        }
      );

      if (response.data.success) {
        setConsultations(response.data.data.consultations);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch consultations');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchConsultations();
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return '#3B82F6';
      case 'IN_PROGRESS':
        return '#10B981';
      case 'COMPLETED':
        return '#6B7280';
      case 'CANCELLED':
        return '#EF4444';
      case 'NO_SHOW':
        return '#F59E0B';
      default:
        return '#6B7280';
    }
  };

  const formatConsultationType = (type: string) => {
    return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const handleJoinConsultation = (consultation: Consultation) => {
    if (consultation.status === 'SCHEDULED') {
      // Check if it's time for the consultation (within 15 minutes)
      const scheduledTime = new Date(consultation.scheduled_start).getTime();
      const now = Date.now();
      const fifteenMinutes = 15 * 60 * 1000;

      if (now < scheduledTime - fifteenMinutes) {
        Alert.alert(
          'Too Early',
          'You can join the consultation up to 15 minutes before the scheduled time.'
        );
        return;
      }
    }

    navigation.navigate('VideoConsultationRoom', {
      consultationId: consultation.id,
      isProvider: true,
    });
  };

  const handleViewDetails = (consultation: Consultation) => {
    navigation.navigate('ConsultationDetails', {
      consultationId: consultation.id,
      isProvider: true,
    });
  };

  const handleMarkNoShow = async (consultationId: string) => {
    Alert.alert(
      'Mark as No-Show',
      'Are you sure you want to mark this patient as a no-show?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('authToken');
              await axios.post(
                `${API_BASE_URL}/consultations/${consultationId}/no-show`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
              );

              Alert.alert('Success', 'Consultation marked as no-show');
              fetchConsultations();
            } catch (err) {
              Alert.alert('Error', 'Failed to mark as no-show');
            }
          },
        },
      ]
    );
  };

  if (loading && !refreshing) {
    return (
      <LoadingSpinner
        fullScreen
        size="large"
        text="Loading consultations..."
        color={theme.colors.primary}
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Typography variant="h2" weight="bold" style={styles.headerTitle}>
          My Consultations
        </Typography>
        <Typography variant="body" color="secondary" style={styles.headerSubtitle}>
          Manage your appointments and patient care
        </Typography>
      </View>

      {/* Status Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterSection}>
        {statusFilters.map((filter) => (
          <TouchableOpacity
            key={filter.value}
            style={[
              styles.filterChip,
              selectedStatus === filter.value && styles.filterChipActive,
            ]}
            onPress={() => setSelectedStatus(filter.value)}
            accessibilityRole="button"
            accessibilityLabel={`Filter ${filter.label} consultations`}
            accessibilityState={{ selected: selectedStatus === filter.value }}
          >
            <Typography
              variant="body"
              weight="medium"
              style={[
                styles.filterChipText,
                selectedStatus === filter.value && styles.filterChipTextActive,
              ]}
            >
              {filter.label}
            </Typography>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Error Message */}
      {error && (
        <View style={styles.errorContainer}>
          <Typography variant="body" style={styles.errorText}>{error}</Typography>
        </View>
      )}

      {/* Consultations List */}
      <ScrollView
        style={styles.consultationList}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {consultations.length === 0 ? (
          <View style={styles.emptyState}>
            <Typography variant="body" weight="semibold" style={styles.emptyStateText}>
              No consultations found
            </Typography>
            <Typography variant="body" color="secondary" style={styles.emptyStateSubtext}>
              {selectedStatus === 'SCHEDULED'
                ? 'No upcoming appointments'
                : 'Try selecting a different filter'}
            </Typography>
          </View>
        ) : (
          consultations.map((consultation) => {
            const { date, time } = formatDateTime(consultation.scheduled_start);
            return (
              <View key={consultation.id} style={styles.consultationCard}>
                {/* Card Header */}
                <View style={styles.cardHeader}>
                  <View>
                    <Typography variant="body" weight="bold" style={styles.patientName}>
                      {consultation.patient_first_name} {consultation.patient_last_name}
                    </Typography>
                    <Typography variant="caption" color="secondary" style={styles.patientEmail}>
                      {consultation.patient_email}
                    </Typography>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(consultation.status) },
                    ]}
                  >
                    <Typography variant="caption" weight="semibold" style={styles.statusBadgeText}>
                      {consultation.status}
                    </Typography>
                  </View>
                </View>

                {/* Consultation Details */}
                <View style={styles.cardBody}>
                  <View style={styles.detailRow}>
                    <Typography variant="body" color="secondary" style={styles.detailLabel}>
                      📅 Date:
                    </Typography>
                    <Typography variant="body" weight="medium" style={styles.detailValue}>
                      {date}
                    </Typography>
                  </View>
                  <View style={styles.detailRow}>
                    <Typography variant="body" color="secondary" style={styles.detailLabel}>
                      🕐 Time:
                    </Typography>
                    <Typography variant="body" weight="medium" style={styles.detailValue}>
                      {time}
                    </Typography>
                  </View>
                  <View style={styles.detailRow}>
                    <Typography variant="body" color="secondary" style={styles.detailLabel}>
                      🩺 Type:
                    </Typography>
                    <Typography variant="body" weight="medium" style={styles.detailValue}>
                      {formatConsultationType(consultation.consultation_type)}
                    </Typography>
                  </View>
                  <View style={styles.detailRow}>
                    <Typography variant="body" color="secondary" style={styles.detailLabel}>
                      📝 Reason:
                    </Typography>
                    <Typography variant="body" weight="medium" style={styles.detailValue} numberOfLines={2}>
                      {consultation.reason_for_visit}
                    </Typography>
                  </View>

                  {consultation.vitals_shared && (
                    <View style={styles.vitalsIndicator}>
                      <Typography variant="caption" weight="semibold" style={styles.vitalsIndicatorText}>
                        ❤️ Patient shared vitals
                      </Typography>
                    </View>
                  )}
                </View>

                {/* Card Actions */}
                <View style={styles.cardActions}>
                  {consultation.status === 'SCHEDULED' && (
                    <>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.joinButton]}
                        onPress={() => handleJoinConsultation(consultation)}
                        accessibilityRole="button"
                        accessibilityLabel={`Join call with ${consultation.patient_first_name} ${consultation.patient_last_name}`}
                      >
                        <Typography variant="body" weight="semibold" style={styles.actionButtonText}>
                          Join Call
                        </Typography>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.secondaryButton]}
                        onPress={() => handleMarkNoShow(consultation.id)}
                        accessibilityRole="button"
                        accessibilityLabel="Mark as no-show"
                      >
                        <Typography variant="body" weight="semibold" style={styles.secondaryButtonText}>
                          No-Show
                        </Typography>
                      </TouchableOpacity>
                    </>
                  )}

                  {consultation.status === 'IN_PROGRESS' && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.joinButton]}
                      onPress={() => handleJoinConsultation(consultation)}
                      accessibilityRole="button"
                      accessibilityLabel="Rejoin ongoing consultation"
                    >
                      <Typography variant="body" weight="semibold" style={styles.actionButtonText}>
                        Rejoin Call
                      </Typography>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={[styles.actionButton, styles.secondaryButton]}
                    onPress={() => handleViewDetails(consultation)}
                    accessibilityRole="button"
                    accessibilityLabel="View consultation details"
                  >
                    <Typography variant="body" weight="semibold" style={styles.secondaryButtonText}>
                      View Details
                    </Typography>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    marginTop: theme.spacing.lg,
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  header: {
    backgroundColor: theme.colors.white,
    padding: theme.spacing.xl,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  headerSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  filterSection: {
    backgroundColor: theme.colors.white,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  filterChip: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: 20,
    backgroundColor: theme.colors.background,
    marginRight: theme.spacing.sm,
  },
  filterChipActive: {
    backgroundColor: theme.colors.primary,
  },
  filterChipText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: theme.colors.white,
  },
  errorContainer: {
    backgroundColor: theme.colors.errorLight,
    padding: theme.spacing.sm,
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 14,
    textAlign: 'center',
  },
  consultationList: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: theme.colors.textLight,
  },
  consultationCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.lg,
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.background,
  },
  patientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  patientEmail: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.lg,
  },
  statusBadgeText: {
    color: theme.colors.white,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  cardBody: {
    marginBottom: theme.spacing.lg,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: theme.spacing.sm,
  },
  detailLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    width: 80,
  },
  detailValue: {
    fontSize: 14,
    color: theme.colors.textPrimary,
    fontWeight: '500',
    flex: 1,
  },
  vitalsIndicator: {
    backgroundColor: theme.colors.successLight,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.sm,
  },
  vitalsIndicatorText: {
    color: theme.colors.success,
    fontSize: 13,
    fontWeight: '600',
  },
  cardActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  actionButton: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  joinButton: {
    backgroundColor: theme.colors.primary,
  },
  actionButtonText: {
    color: theme.colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  secondaryButtonText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ProviderConsultationDashboard;
