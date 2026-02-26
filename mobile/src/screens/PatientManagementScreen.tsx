import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { Icon, SearchBar } from 'react-native-elements';
import { Typography, LoadingSpinner, Card } from '../components/ui';
import { theme } from '../theme/theme';
import providerAPI, { PatientSummary } from '../services/providerAPI';

interface PatientManagementScreenProps {
  navigation: any;
  route?: any;
}

const PatientManagementScreen: React.FC<PatientManagementScreenProps> = ({ navigation, route }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<PatientSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<string>(route?.params?.filter || 'all');

  useEffect(() => {
    loadPatients();
  }, []);

  useEffect(() => {
    filterPatients();
  }, [searchQuery, patients, filter]);

  const loadPatients = async () => {
    try {
      setLoading(true);
      const data = await providerAPI.getPatients();
      setPatients(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPatients();
    setRefreshing(false);
  };

  const filterPatients = () => {
    let filtered = [...patients];

    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (patient) =>
          patient.firstName.toLowerCase().includes(query) ||
          patient.lastName.toLowerCase().includes(query) ||
          patient.email.toLowerCase().includes(query)
      );
    }

    // Apply filters
    if (filter === 'critical') {
      filtered = filtered.filter((patient) => patient.riskScore && patient.riskScore > 70);
    } else if (filter === 'recent') {
      filtered = filtered.filter((patient) => patient.lastVisit);
      filtered.sort((a, b) => {
        if (!a.lastVisit) return 1;
        if (!b.lastVisit) return -1;
        return new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime();
      });
    } else if (filter === 'upcoming') {
      filtered = filtered.filter((patient) => patient.upcomingAppointment);
    }

    setFilteredPatients(filtered);
  };

  const getRiskColor = (riskScore?: number): string => {
    if (!riskScore) return '#4CAF50';
    if (riskScore >= 70) return '#F44336';
    if (riskScore >= 40) return '#FF9800';
    return '#4CAF50';
  };

  if (loading) {
    return (
      <LoadingSpinner
        fullScreen
        size="large"
        text="Loading patients..."
        color={theme.colors.primary}
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Icon name="arrow-back" type="material" color={theme.colors.primary} importantForAccessibility="no" accessible={false} />
        </TouchableOpacity>
        <Typography variant="h3" weight="bold" style={styles.headerTitle}>
          Patient Management
        </Typography>
        <View style={{ width: 40 }} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <SearchBar
          placeholder="Search patients..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          platform="default"
          containerStyle={styles.searchBarContainer}
          inputContainerStyle={styles.searchInputContainer}
        />
      </View>

      {/* Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContainer}
      >
        <TouchableOpacity
          style={[styles.filterChip, filter === 'all' && styles.filterChipActive]}
          onPress={() => setFilter('all')}
          accessibilityRole="button"
          accessibilityLabel={`Show all patients, ${filter === 'all' ? 'selected' : 'not selected'}`}
          accessibilityState={{ selected: filter === 'all' }}
        >
          <Typography variant="body" weight="semibold" style={[styles.filterChipText, filter === 'all' && styles.filterChipTextActive]}>
            All ({patients.length})
          </Typography>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, filter === 'critical' && styles.filterChipActive]}
          onPress={() => setFilter('critical')}
          accessibilityRole="button"
          accessibilityLabel={`Show critical patients, ${filter === 'critical' ? 'selected' : 'not selected'}`}
          accessibilityState={{ selected: filter === 'critical' }}
        >
          <Icon name="warning" type="material" size={16} color={filter === 'critical' ? theme.colors.textInverse : theme.colors.textSecondary} importantForAccessibility="no" accessible={false} />
          <Typography variant="body" weight="semibold" style={[styles.filterChipText, filter === 'critical' && styles.filterChipTextActive]}>
            Critical
          </Typography>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, filter === 'recent' && styles.filterChipActive]}
          onPress={() => setFilter('recent')}
          accessibilityRole="button"
          accessibilityLabel={`Show recent visits, ${filter === 'recent' ? 'selected' : 'not selected'}`}
          accessibilityState={{ selected: filter === 'recent' }}
        >
          <Icon name="history" type="material" size={16} color={filter === 'recent' ? theme.colors.textInverse : theme.colors.textSecondary} importantForAccessibility="no" accessible={false} />
          <Typography variant="body" weight="semibold" style={[styles.filterChipText, filter === 'recent' && styles.filterChipTextActive]}>
            Recent Visits
          </Typography>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, filter === 'upcoming' && styles.filterChipActive]}
          onPress={() => setFilter('upcoming')}
          accessibilityRole="button"
          accessibilityLabel={`Show upcoming appointments, ${filter === 'upcoming' ? 'selected' : 'not selected'}`}
          accessibilityState={{ selected: filter === 'upcoming' }}
        >
          <Icon name="event" type="material" size={16} color={filter === 'upcoming' ? theme.colors.textInverse : theme.colors.textSecondary} importantForAccessibility="no" accessible={false} />
          <Typography variant="body" weight="semibold" style={[styles.filterChipText, filter === 'upcoming' && styles.filterChipTextActive]}>
            Upcoming
          </Typography>
        </TouchableOpacity>
      </ScrollView>

      {/* Patient List */}
      <ScrollView
        style={styles.listContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        accessibilityLabel="Patient list"
        accessibilityRole="scrollview"
      >
        {filteredPatients.length > 0 ? (
          filteredPatients.map((patient) => (
            <TouchableOpacity
              key={patient.id}
              onPress={() => navigation.navigate('PatientDetails', { patientId: patient.id })}
              accessibilityRole="button"
              accessibilityLabel={`View details for ${patient.firstName} ${patient.lastName}`}
              accessibilityHint="Tap to view patient details and medical records"
            >
              <Card elevated elevation="sm" padding="md" style={styles.patientCard}>
                <View style={styles.patientCardContent}>
                  {/* Avatar */}
                  <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
                    <Typography variant="body" weight="bold" style={styles.avatarText}>
                      {patient.firstName.charAt(0)}{patient.lastName.charAt(0)}
                    </Typography>
                  </View>

                  {/* Patient Info */}
                  <View style={styles.patientInfo}>
                    <Typography variant="h4" weight="bold" style={styles.patientName}>
                      {patient.firstName} {patient.lastName}
                    </Typography>

                    <View style={styles.patientDetailRow}>
                      <Icon name="cake" type="material" size={14} color={theme.colors.textSecondary} importantForAccessibility="no" accessible={false} />
                      <Typography variant="body" color="secondary" style={styles.patientDetailText}>
                        {new Date(patient.dateOfBirth).toLocaleDateString()}
                      </Typography>
                    </View>

                    {patient.phone && (
                      <View style={styles.patientDetailRow}>
                        <Icon name="phone" type="material" size={14} color={theme.colors.textSecondary} importantForAccessibility="no" accessible={false} />
                        <Typography variant="body" color="secondary" style={styles.patientDetailText}>
                          {patient.phone}
                        </Typography>
                      </View>
                    )}

                    {patient.lastVisit && (
                      <View style={styles.patientDetailRow}>
                        <Icon name="history" type="material" size={14} color={theme.colors.textSecondary} importantForAccessibility="no" accessible={false} />
                        <Typography variant="body" color="secondary" style={styles.patientDetailText}>
                          Last visit: {new Date(patient.lastVisit).toLocaleDateString()}
                        </Typography>
                      </View>
                    )}

                    {patient.upcomingAppointment && (
                      <View style={styles.patientDetailRow}>
                        <Icon name="event" type="material" size={14} color={theme.colors.success} importantForAccessibility="no" accessible={false} />
                        <Typography variant="body" style={[styles.patientDetailText, { color: theme.colors.success }]}>
                          Next: {new Date(patient.upcomingAppointment).toLocaleDateString()}
                        </Typography>
                      </View>
                    )}

                    {/* Conditions */}
                    {patient.conditions && patient.conditions.length > 0 && (
                      <View style={styles.conditionsContainer}>
                        {patient.conditions.slice(0, 3).map((condition, index) => (
                          <View key={index} style={styles.conditionChip}>
                            <Typography variant="caption" weight="semibold" style={styles.conditionText}>
                              {condition}
                            </Typography>
                          </View>
                        ))}
                        {patient.conditions.length > 3 && (
                          <Typography variant="caption" color="secondary" style={styles.moreText}>
                            +{patient.conditions.length - 3} more
                          </Typography>
                        )}
                      </View>
                    )}
                  </View>

                  {/* Risk Score */}
                  {patient.riskScore !== undefined && (
                    <View style={styles.riskContainer}>
                      <View
                        style={[
                          styles.riskCircle,
                          { backgroundColor: getRiskColor(patient.riskScore) },
                        ]}
                      >
                        <Typography variant="body" weight="bold" style={styles.riskScore}>
                          {patient.riskScore}%
                        </Typography>
                      </View>
                      <Typography variant="caption" color="secondary" style={styles.riskLabel}>
                        Risk
                      </Typography>
                    </View>
                  )}

                  {/* Chevron */}
                  <Icon name="chevron-right" type="material" color={theme.colors.border} size={24} importantForAccessibility="no" accessible={false} />
                </View>
              </Card>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Icon name="search-off" type="material" size={64} color={theme.colors.border} importantForAccessibility="no" accessible={false} />
            <Typography variant="h4" weight="semibold" color="secondary" style={styles.emptyText}>
              No patients found
            </Typography>
            <Typography variant="body" color="secondary" style={styles.emptySubtext}>
              Try adjusting your search or filters
            </Typography>
          </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    padding: theme.spacing.xs,
  },
  headerTitle: {
    marginBottom: 0,
  },
  searchContainer: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.xs,
  },
  searchBarContainer: {
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    borderBottomWidth: 0,
    padding: 0,
  },
  searchInputContainer: {
    backgroundColor: theme.colors.background,
  },
  filterScroll: {
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: 20,
    backgroundColor: theme.colors.background,
    marginRight: theme.spacing.xs,
  },
  filterChipActive: {
    backgroundColor: theme.colors.info,
  },
  filterChipText: {
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.xs,
  },
  filterChipTextActive: {
    color: theme.colors.textInverse,
  },
  listContainer: {
    flex: 1,
  },
  patientCard: {
    marginHorizontal: theme.spacing.md,
    marginVertical: theme.spacing.xs,
  },
  patientCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
  },
  avatarText: {
    color: theme.colors.textInverse,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    marginBottom: theme.spacing.xs,
  },
  patientDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  patientDetailText: {
    marginLeft: theme.spacing.xs,
  },
  conditionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: theme.spacing.xs,
    alignItems: 'center',
  },
  conditionChip: {
    backgroundColor: theme.colors.info + '20',
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: theme.spacing.xs / 2,
    borderRadius: theme.borderRadius.sm,
    marginRight: theme.spacing.xs,
    marginBottom: theme.spacing.xs / 2,
  },
  conditionText: {
    color: theme.colors.info,
  },
  moreText: {
    fontStyle: 'italic',
  },
  riskContainer: {
    alignItems: 'center',
    marginLeft: theme.spacing.sm,
    marginRight: theme.spacing.xs,
  },
  riskCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.xs / 2,
  },
  riskScore: {
    color: theme.colors.textInverse,
  },
  riskLabel: {},
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: theme.spacing.md,
  },
  emptySubtext: {
    marginTop: theme.spacing.xs,
  },
});

export default PatientManagementScreen;
