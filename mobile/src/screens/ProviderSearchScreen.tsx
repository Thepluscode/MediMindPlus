/**
 * Provider Search & Booking Screen
 * Allows patients to search for healthcare providers and book consultations
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Typography, LoadingSpinner } from '../components/ui';
import { theme } from '../theme/theme';

const API_BASE_URL = 'http://localhost:3000/api';

interface Provider {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  specialty: string;
  subspecialties?: string[];
  years_experience: number;
  bio?: string;
  profile_image_url?: string;
  rating: number;
  total_consultations: number;
  total_reviews: number;
  consultation_fee: number;
  consultation_duration_minutes: number;
  accepted_insurance?: string[];
  languages?: string[];
  accepting_patients: boolean;
}

const ProviderSearchScreen = ({ navigation }: any) => {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [error, setError] = useState<string | null>(null);

  const specialties = [
    'PRIMARY_CARE',
    'CARDIOLOGY',
    'ENDOCRINOLOGY',
    'PSYCHIATRY',
    'DERMATOLOGY',
    'NEUROLOGY',
    'ORTHOPEDICS',
    'PEDIATRICS',
    'OBSTETRICS',
    'EMERGENCY_MEDICINE',
    'INTERNAL_MEDICINE',
    'FAMILY_MEDICINE',
  ];

  useEffect(() => {
    searchProviders();
  }, [selectedSpecialty]);

  const searchProviders = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        setError('Please log in to search providers');
        setLoading(false);
        return;
      }

      const params: any = {
        acceptingPatients: true,
      };

      if (selectedSpecialty) {
        params.specialty = selectedSpecialty;
      }

      const response = await axios.get(`${API_BASE_URL}/consultations/providers/search`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      if (response.data.success) {
        setProviders(response.data.data.providers);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to search providers');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatSpecialty = (specialty: string) => {
    return specialty.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const handleBookAppointment = (provider: Provider) => {
    navigation.navigate('BookAppointment', { provider });
  };

  const filteredProviders = providers.filter(
    (p) =>
      p.first_name.toLowerCase().includes(searchText.toLowerCase()) ||
      p.last_name.toLowerCase().includes(searchText.toLowerCase()) ||
      p.specialty.toLowerCase().includes(searchText.toLowerCase())
  );

  if (loading) {
    return (
      <LoadingSpinner
        fullScreen
        size="large"
        text="Finding providers..."
        color={theme.colors.primary}
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Typography variant="h2" weight="bold" style={styles.headerTitle}>
          Find a Provider
        </Typography>
        <Typography variant="body" color="secondary" style={styles.headerSubtitle}>
          Book video consultations with verified healthcare professionals
        </Typography>
      </View>

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or specialty..."
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      {/* Specialty Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterSection}>
        <TouchableOpacity
          style={[styles.filterChip, !selectedSpecialty && styles.filterChipActive]}
          onPress={() => setSelectedSpecialty('')}
          accessibilityRole="button"
          accessibilityLabel="Show all specialties"
          accessibilityState={{ selected: !selectedSpecialty }}
        >
          <Typography
            variant="body"
            weight="medium"
            style={[styles.filterChipText, !selectedSpecialty && styles.filterChipTextActive]}
          >
            All
          </Typography>
        </TouchableOpacity>
        {specialties.map((specialty) => (
          <TouchableOpacity
            key={specialty}
            style={[styles.filterChip, selectedSpecialty === specialty && styles.filterChipActive]}
            onPress={() => setSelectedSpecialty(specialty)}
            accessibilityRole="button"
            accessibilityLabel={`Filter by ${formatSpecialty(specialty)}`}
            accessibilityState={{ selected: selectedSpecialty === specialty }}
          >
            <Typography
              variant="body"
              weight="medium"
              style={[
                styles.filterChipText,
                selectedSpecialty === specialty && styles.filterChipTextActive,
              ]}
            >
              {formatSpecialty(specialty)}
            </Typography>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Error Message */}
      {error && (
        <View style={styles.errorContainer} accessibilityLiveRegion="assertive">
          <Typography variant="body" style={styles.errorText}>{error}</Typography>
        </View>
      )}

      {/* Provider List */}
      <ScrollView
        style={styles.providerList}
        showsVerticalScrollIndicator={false}
        accessibilityLabel={`${filteredProviders.length} provider${filteredProviders.length !== 1 ? 's' : ''} found`}
        accessibilityLiveRegion="polite"
      >
        {filteredProviders.length === 0 ? (
          <View style={styles.emptyState} accessibilityLiveRegion="polite">
            <Typography variant="body" weight="semibold" style={styles.emptyStateText}>
              No providers found
            </Typography>
            <Typography variant="body" color="secondary" style={styles.emptyStateSubtext}>
              Try adjusting your search or filters
            </Typography>
          </View>
        ) : (
          filteredProviders.map((provider) => (
            <View key={provider.id} style={styles.providerCard}>
              {/* Provider Image */}
              <View style={styles.providerImageContainer}>
                {provider.profile_image_url ? (
                  <Image
                    source={{ uri: provider.profile_image_url }}
                    style={styles.providerImage}
                  />
                ) : (
                  <View style={[styles.providerImage, styles.providerImagePlaceholder]}>
                    <Typography variant="h2" weight="bold" style={styles.providerInitials}>
                      {provider.first_name[0]}
                      {provider.last_name[0]}
                    </Typography>
                  </View>
                )}
              </View>

              {/* Provider Info */}
              <View style={styles.providerInfo}>
                <Typography variant="body" weight="bold" style={styles.providerName}>
                  Dr. {provider.first_name} {provider.last_name}
                </Typography>

                <Typography variant="body" color="secondary" style={styles.providerSpecialty}>
                  {formatSpecialty(provider.specialty)}
                </Typography>

                <View style={styles.providerStats}>
                  <View style={styles.statItem}>
                    <Typography variant="caption" color="secondary" style={styles.statLabel}>
                      Rating:
                    </Typography>
                    <Typography variant="caption" weight="semibold" style={styles.statValue}>
                      ⭐ {provider.rating.toFixed(1)}
                    </Typography>
                  </View>
                  <View style={styles.statItem}>
                    <Typography variant="caption" color="secondary" style={styles.statLabel}>
                      Experience:
                    </Typography>
                    <Typography variant="caption" weight="semibold" style={styles.statValue}>
                      {provider.years_experience} years
                    </Typography>
                  </View>
                  <View style={styles.statItem}>
                    <Typography variant="caption" color="secondary" style={styles.statLabel}>
                      Consultations:
                    </Typography>
                    <Typography variant="caption" weight="semibold" style={styles.statValue}>
                      {provider.total_consultations}
                    </Typography>
                  </View>
                </View>

                {provider.bio && (
                  <Typography variant="body" color="secondary" style={styles.providerBio} numberOfLines={2}>
                    {provider.bio}
                  </Typography>
                )}

                <View style={styles.providerFooter}>
                  <View>
                    <Typography variant="caption" color="secondary" style={styles.feeLabel}>
                      Consultation Fee
                    </Typography>
                    <Typography variant="body" weight="bold" style={styles.feeValue}>
                      {formatCurrency(provider.consultation_fee)} / {provider.consultation_duration_minutes} min
                    </Typography>
                  </View>

                  <TouchableOpacity
                    style={styles.bookButton}
                    onPress={() => handleBookAppointment(provider)}
                    accessibilityRole="button"
                    accessibilityLabel={`Book appointment with Dr. ${provider.first_name} ${provider.last_name}`}
                  >
                    <Typography variant="body" weight="semibold" style={styles.bookButtonText}>
                      Book Now
                    </Typography>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
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
  searchSection: {
    backgroundColor: theme.colors.white,
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  searchInput: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.sm,
    fontSize: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
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
  providerList: {
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
  providerCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: 'row',
  },
  providerImageContainer: {
    marginRight: theme.spacing.lg,
  },
  providerImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  providerImagePlaceholder: {
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  providerInitials: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
  providerInfo: {
    flex: 1,
  },
  providerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  providerSpecialty: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  providerStats: {
    flexDirection: 'row',
    marginBottom: theme.spacing.sm,
  },
  statItem: {
    marginRight: theme.spacing.lg,
  },
  statLabel: {
    fontSize: 11,
    color: theme.colors.textLight,
  },
  statValue: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  providerBio: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
    lineHeight: 18,
  },
  providerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  feeLabel: {
    fontSize: 11,
    color: theme.colors.textLight,
  },
  feeValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.success,
  },
  bookButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  bookButtonText: {
    color: theme.colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ProviderSearchScreen;
