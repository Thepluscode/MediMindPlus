import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { Typography, LoadingSpinner, Card } from '../components/ui';
import { RootStackParamList } from '../types/navigation';
import { theme } from '../theme/theme';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

type ClearCacheScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, 'ClearCache'>;
};

interface CacheSize {
  images: number;
  data: number;
  documents: number;
  total: number;
}

interface CacheItem {
  id: string;
  label: string;
  icon: string;
  size: number;
  color: string;
  type: 'images' | 'data' | 'documents';
}

const ClearCacheScreen: React.FC<ClearCacheScreenProps> = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState<string | null>(null);
  const [cacheSize, setCacheSize] = useState<CacheSize | null>(null);

  useEffect(() => {
    loadCacheSize();
  }, []);

  const loadCacheSize = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('authToken');

      if (!token) {
        Alert.alert('Error', 'Authentication required');
        navigation.goBack();
        return;
      }

      const response = await axios.get('http://localhost:3000/api/settings/cache/size', {
        headers: { Authorization: `Bearer ${token}` },
      });

      setCacheSize(response.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load cache information');
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleClearCache = async (type?: 'images' | 'data' | 'documents') => {
    const typeLabel = type ? type.charAt(0).toUpperCase() + type.slice(1) : 'All';

    Alert.alert(
      `Clear ${typeLabel} Cache`,
      `Are you sure you want to clear ${type ? typeLabel.toLowerCase() + ' cache' : 'all cached data'}? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              setClearing(type || 'all');
              const token = await AsyncStorage.getItem('authToken');

              if (!token) {
                Alert.alert('Error', 'Authentication required');
                return;
              }

              await axios.post(
                'http://localhost:3000/api/settings/cache/clear',
                { type: type || 'all' },
                {
                  headers: { Authorization: `Bearer ${token}` },
                }
              );

              Alert.alert('Success', `${typeLabel} cache cleared successfully`);
              await loadCacheSize();
            } catch (error) {
              Alert.alert('Error', 'Failed to clear cache');
            } finally {
              setClearing(null);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <LoadingSpinner
        fullScreen
        size="large"
        text="Loading cache information..."
        color={theme.colors.primary}
      />
    );
  }

  if (!cacheSize) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="alert-circle-outline" size={64} color={theme.colors.textSecondary} />
        <Typography variant="body" color="secondary" style={styles.errorText}>
          Failed to load cache information
        </Typography>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={loadCacheSize}
          accessibilityRole="button"
          accessibilityLabel="Try again to load cache information"
        >
          <Typography variant="body" weight="semibold" style={styles.retryButtonText}>
            Try Again
          </Typography>
        </TouchableOpacity>
      </View>
    );
  }

  const cacheItems: CacheItem[] = [
    {
      id: 'images',
      label: 'Images Cache',
      icon: 'images-outline',
      size: cacheSize.images,
      color: '#2196F3',
      type: 'images',
    },
    {
      id: 'data',
      label: 'App Data Cache',
      icon: 'server-outline',
      size: cacheSize.data,
      color: '#4CAF50',
      type: 'data',
    },
    {
      id: 'documents',
      label: 'Documents Cache',
      icon: 'document-text-outline',
      size: cacheSize.documents,
      color: '#FF9800',
      type: 'documents',
    },
  ];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={theme.gradients.primary.colors}
        start={theme.gradients.primary.start}
        end={theme.gradients.primary.end}
        style={styles.header}
      >
        <View style={styles.iconContainer}>
          <Ionicons name="sync" color="white" size={60} />
        </View>
        <Typography variant="h2" weight="bold" style={styles.headerTitle}>
          Clear Cache
        </Typography>
        <Typography variant="body" style={styles.headerSubtitle}>
          Free up storage space
        </Typography>
      </LinearGradient>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Card style={styles.totalCard}>
            <View style={styles.totalHeader}>
              <Ionicons name="pie-chart-outline" size={48} color={theme.colors.primary} />
              <View style={styles.totalInfo}>
                <Typography variant="body" color="secondary" style={styles.totalLabel}>
                  Total Cache Size
                </Typography>
                <Typography variant="h1" weight="bold" style={styles.totalSize}>
                  {formatBytes(cacheSize.total)}
                </Typography>
              </View>
            </View>
            <Typography variant="body" color="secondary" style={styles.totalDescription}>
              Clearing cache can help improve app performance and free up storage space on your
              device.
            </Typography>
          </Card>

          <Card style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Ionicons name="information-circle" size={24} color="#2196F3" />
              <Typography variant="body" weight="bold" style={styles.infoTitle}>
                What is Cache?
              </Typography>
            </View>
            <Typography variant="body" color="secondary" style={styles.infoText}>
              Cache stores temporary files to make the app load faster. Clearing it won't delete
              your personal data, but may temporarily slow down the app until the cache rebuilds.
            </Typography>
          </Card>

          <View style={styles.section}>
            <Typography variant="h3" weight="semibold" style={styles.sectionTitle}>
              Cache by Category
            </Typography>

            {cacheItems.map((item) => (
              <Card key={item.id} style={styles.cacheCard}>
                <View style={styles.cacheHeader}>
                  <View
                    style={[styles.cacheIconContainer, { backgroundColor: `${item.color}20` }]}
                  >
                    <Ionicons name={item.icon as any} size={32} color={item.color} />
                  </View>
                  <View style={styles.cacheInfo}>
                    <Typography variant="body" weight="semibold" style={styles.cacheLabel}>
                      {item.label}
                    </Typography>
                    <Typography variant="h3" weight="bold" style={styles.cacheSize}>
                      {formatBytes(item.size)}
                    </Typography>
                  </View>
                </View>
                <View style={styles.cacheProgress}>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          backgroundColor: item.color,
                          width: `${Math.min((item.size / cacheSize.total) * 100, 100)}%`,
                        },
                      ]}
                    />
                  </View>
                  <Typography variant="body" weight="semibold" style={styles.progressText}>
                    {Math.round((item.size / cacheSize.total) * 100)}%
                  </Typography>
                </View>
                <TouchableOpacity
                  style={[
                    styles.clearButton,
                    { backgroundColor: item.color },
                    (clearing !== null || item.size === 0) && styles.clearButtonDisabled,
                  ]}
                  onPress={() => handleClearCache(item.type)}
                  disabled={clearing !== null || item.size === 0}
                  accessibilityRole="button"
                  accessibilityLabel={`Clear ${item.label.replace(' Cache', '')} cache`}
                  accessibilityState={{ disabled: clearing !== null || item.size === 0 }}
                >
                  {clearing === item.type ? (
                    <LoadingSpinner color="white" size="small" />
                  ) : (
                    <>
                      <Ionicons
                        name="trash-outline"
                        color="white"
                        size={20}
                        style={{ marginRight: 10 }}
                      />
                      <Typography variant="body" weight="semibold" style={styles.clearButtonText}>
                        Clear {item.label.replace(' Cache', '')}
                      </Typography>
                    </>
                  )}
                </TouchableOpacity>
              </Card>
            ))}
          </View>

          <Card style={styles.clearAllCard}>
            <View style={styles.clearAllHeader}>
              <Ionicons name="trash-bin" size={32} color="#F44336" />
              <Typography variant="h3" weight="bold" style={styles.clearAllTitle}>
                Clear All Cache
              </Typography>
            </View>
            <Typography variant="body" color="secondary" style={styles.clearAllDescription}>
              Clear all cached data at once. This includes images, app data, and documents cache.
            </Typography>
            <TouchableOpacity
              style={[
                styles.clearAllButton,
                (clearing !== null || cacheSize.total === 0) && styles.clearAllButtonDisabled,
              ]}
              onPress={() => handleClearCache()}
              disabled={clearing !== null || cacheSize.total === 0}
              accessibilityRole="button"
              accessibilityLabel="Clear all cache"
              accessibilityState={{ disabled: clearing !== null || cacheSize.total === 0 }}
            >
              {clearing === 'all' ? (
                <LoadingSpinner color="white" size="small" />
              ) : (
                <>
                  <Ionicons
                    name="refresh"
                    color="white"
                    size={20}
                    style={{ marginRight: 10 }}
                  />
                  <Typography variant="body" weight="bold" style={styles.clearAllButtonText}>
                    Clear All Cache
                  </Typography>
                </>
              )}
            </TouchableOpacity>
          </Card>

          <Card style={styles.tipsCard}>
            <Typography variant="h3" weight="bold" style={styles.tipsTitle}>
              Tips for Managing Cache
            </Typography>
            <View style={styles.tipsDivider} />
            <View style={styles.tipRow}>
              <Ionicons
                name="bulb-outline"
                size={20}
                color={theme.colors.primary}
                style={styles.tipIcon}
              />
              <Typography variant="body" color="secondary" style={styles.tipText}>
                Clear cache regularly to maintain optimal app performance
              </Typography>
            </View>
            <View style={styles.tipRow}>
              <Ionicons
                name="bulb-outline"
                size={20}
                color={theme.colors.primary}
                style={styles.tipIcon}
              />
              <Typography variant="body" color="secondary" style={styles.tipText}>
                Clearing cache won't affect your saved appointments or health data
              </Typography>
            </View>
            <View style={styles.tipRow}>
              <Ionicons
                name="bulb-outline"
                size={20}
                color={theme.colors.primary}
                style={styles.tipIcon}
              />
              <Typography variant="body" color="secondary" style={styles.tipText}>
                The app may temporarily run slower after clearing cache
              </Typography>
            </View>
            <View style={styles.tipRow}>
              <Ionicons
                name="bulb-outline"
                size={20}
                color={theme.colors.primary}
                style={styles.tipIcon}
              />
              <Typography variant="body" color="secondary" style={styles.tipText}>
                You'll need to re-download images and documents
              </Typography>
            </View>
          </Card>

          <View style={styles.refreshContainer}>
            <Typography variant="body" color="secondary" style={styles.refreshText}>
              Cache information updated
            </Typography>
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={loadCacheSize}
              accessibilityRole="button"
              accessibilityLabel="Refresh cache information"
            >
              <Ionicons
                name="refresh"
                color={theme.colors.primary}
                size={18}
                style={{ marginRight: 8 }}
              />
              <Typography variant="body" weight="medium" style={styles.refreshButtonTitle}>
                Refresh
              </Typography>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.xxl,
    paddingVertical: theme.spacing.sm,
  },
  retryButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl,
    paddingHorizontal: theme.spacing.lg,
  },
  iconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.white,
    marginBottom: theme.spacing.sm,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  totalCard: {
    borderRadius: theme.borderRadius.xl,
    marginBottom: theme.spacing.lg,
    backgroundColor: '#F3E5F5',
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  totalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  totalInfo: {
    marginLeft: theme.spacing.lg,
    flex: 1,
  },
  totalLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  totalSize: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  totalDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  infoCard: {
    borderRadius: theme.borderRadius.xl,
    marginBottom: theme.spacing.xxl,
    backgroundColor: '#E3F2FD',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginLeft: theme.spacing.sm,
  },
  infoText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  section: {
    marginBottom: theme.spacing.xxl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.lg,
  },
  cacheCard: {
    borderRadius: theme.borderRadius.xl,
    marginBottom: theme.spacing.lg,
  },
  cacheHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  cacheIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.lg,
  },
  cacheInfo: {
    flex: 1,
  },
  cacheLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  cacheSize: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
  },
  cacheProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    overflow: 'hidden',
    marginRight: theme.spacing.sm,
  },
  progressFill: {
    height: '100%',
    borderRadius: theme.borderRadius.sm,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    width: 45,
    textAlign: 'right',
  },
  clearButton: {
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.sm,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  clearButtonDisabled: {
    opacity: 0.5,
  },
  clearAllCard: {
    borderRadius: theme.borderRadius.xl,
    backgroundColor: '#FFEBEE',
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
    marginBottom: theme.spacing.lg,
  },
  clearAllHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  clearAllTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F44336',
    marginLeft: theme.spacing.sm,
  },
  clearAllDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    marginBottom: theme.spacing.lg,
  },
  clearAllButton: {
    backgroundColor: '#F44336',
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearAllButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  clearAllButtonDisabled: {
    opacity: 0.5,
  },
  tipsCard: {
    borderRadius: theme.borderRadius.xl,
    backgroundColor: '#FFF9C4',
    marginBottom: theme.spacing.lg,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  tipsDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginBottom: theme.spacing.lg,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  tipIcon: {
    marginRight: theme.spacing.sm,
    marginTop: 2,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  refreshContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  refreshText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  refreshButton: {
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  refreshButtonTitle: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
});

export default ClearCacheScreen;
