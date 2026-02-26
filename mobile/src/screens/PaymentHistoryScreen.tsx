/**
 * Payment History Screen for MediMindPlus
 * Displays user's payment history and transaction details
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { Typography, LoadingSpinner } from '../components/ui';
import { theme } from '../theme/theme';
import { RootState, AppDispatch } from '../store/store';
import { fetchPaymentHistory } from '../store/slices/paymentSlice';
import { PaymentHistory } from '../types/payment.types';

interface Props {
  navigation: any;
}

const PaymentHistoryScreen: React.FC<Props> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { paymentHistory, isLoading, error } = useSelector(
    (state: RootState) => state.payment
  );

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadPaymentHistory();
  }, []);

  const loadPaymentHistory = async () => {
    try {
      await dispatch(fetchPaymentHistory()).unwrap();
    } catch (error) {
      // Error handled by Redux slice
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPaymentHistory();
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatAmount = (amount: number) => {
    return `$${(amount / 100).toFixed(2)}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return theme.colors.success;
      case 'PENDING':
        return theme.colors.warning;
      case 'REFUNDED':
        return theme.colors.primary;
      case 'FAILED':
        return theme.colors.error;
      default:
        return theme.colors.textLight;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'checkmark-circle';
      case 'PENDING':
        return 'time';
      case 'REFUNDED':
        return 'arrow-undo-circle';
      case 'FAILED':
        return 'close-circle';
      default:
        return 'help-circle';
    }
  };

  const renderPaymentItem = ({ item }: { item: PaymentHistory }) => (
    <TouchableOpacity
      style={styles.paymentCard}
      onPress={() =>
        navigation.navigate('PaymentDetails', { paymentId: item.id })
      }
      accessibilityRole="button"
      accessibilityLabel={`Payment to ${item.providerName}, ${formatAmount(item.amount)}, ${item.status}`}
      accessibilityHint="View detailed payment information and receipt"
    >
      <View style={styles.paymentHeader}>
        <View style={styles.providerInfo}>
          <Typography variant="body" weight="semibold" style={styles.providerName}>
            {item.providerName}
          </Typography>
          <Typography variant="body" color="secondary" style={styles.consultationType}>
            {item.consultationType.replace(/_/g, ' ')}
          </Typography>
        </View>
        <View style={styles.amountContainer}>
          <Typography variant="body" weight="bold" style={styles.amount}>
            {formatAmount(item.amount)}
          </Typography>
        </View>
      </View>

      <View style={styles.paymentFooter}>
        <View style={styles.statusContainer}>
          <Ionicons
            name={getStatusIcon(item.status)}
            size={20}
            color={getStatusColor(item.status)}
          />
          <Typography
            variant="body"
            weight="semibold"
            style={[
              styles.statusText,
              { color: getStatusColor(item.status) },
            ]}
          >
            {item.status}
          </Typography>
        </View>
        <Typography variant="body" color="secondary" style={styles.dateText}>
          {formatDate(item.paymentDate)}
        </Typography>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="receipt-outline" size={80} color={theme.colors.border} />
      <Typography variant="h3" weight="bold" style={styles.emptyTitle}>
        No Payment History
      </Typography>
      <Typography variant="body" color="secondary" style={styles.emptyText}>
        Your payment transactions will appear here
      </Typography>
      <TouchableOpacity
        style={styles.exploreButton}
        onPress={() => navigation.navigate('ProviderSearch')}
        accessibilityRole="button"
        accessibilityLabel="Find a provider"
        accessibilityHint="Search for healthcare providers and book consultations"
      >
        <Typography variant="body" weight="semibold" style={styles.exploreButtonText}>
          Find a Provider
        </Typography>
      </TouchableOpacity>
    </View>
  );

  if (isLoading && !refreshing && paymentHistory.length === 0) {
    return (
      <LoadingSpinner
        fullScreen
        size="large"
        text="Loading payment history..."
        color={theme.colors.primary}
      />
    );
  }

  if (error && paymentHistory.length === 0) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={80} color={theme.colors.error} />
        <Typography variant="h3" weight="bold" style={styles.errorTitle}>
          Error Loading History
        </Typography>
        <Typography variant="body" color="secondary" style={styles.errorText}>
          {error}
        </Typography>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={loadPaymentHistory}
          accessibilityRole="button"
          accessibilityLabel="Retry loading payment history"
          accessibilityHint="Attempt to reload payment history from server"
        >
          <Typography variant="body" weight="semibold" style={styles.retryButtonText}>
            Retry
          </Typography>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Typography variant="h2" weight="bold" style={styles.statValue}>
            {paymentHistory.length}
          </Typography>
          <Typography variant="body" color="secondary" style={styles.statLabel}>
            Total Transactions
          </Typography>
        </View>
        <View style={styles.statCard}>
          <Typography variant="h2" weight="bold" style={styles.statValue}>
            {formatAmount(
              paymentHistory
                .filter((p) => p.status === 'PAID')
                .reduce((sum, p) => sum + p.amount, 0)
            )}
          </Typography>
          <Typography variant="body" color="secondary" style={styles.statLabel}>
            Total Spent
          </Typography>
        </View>
      </View>

      {/* Payment List */}
      <FlatList
        data={paymentHistory}
        renderItem={renderPaymentItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          paymentHistory.length === 0 && styles.listContentEmpty,
        ]}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
        accessibilityLabel="Payment history list"
        accessibilityRole="list"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.error,
    marginTop: theme.spacing.lg,
  },
  errorText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.sm,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: theme.spacing.xl,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
  },
  retryButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    alignItems: 'center',
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  statLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  listContent: {
    padding: theme.spacing.lg,
    paddingTop: 0,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  paymentCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  providerInfo: {
    flex: 1,
  },
  providerName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  consultationType: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
  },
  paymentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: theme.spacing.sm,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: theme.spacing.xs,
  },
  dateText: {
    fontSize: 14,
    color: theme.colors.textLight,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xxl,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.lg,
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.sm,
    textAlign: 'center',
  },
  exploreButton: {
    marginTop: theme.spacing.xl,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
  },
  exploreButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PaymentHistoryScreen;
