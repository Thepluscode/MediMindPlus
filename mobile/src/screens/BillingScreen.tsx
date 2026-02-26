/**
 * Billing & Subscription Management Screen
 *
 * Modern UI for managing subscriptions, viewing invoices, and updating payment methods
 * Design: Purple gradient theme (#9333ea → #7c3aed) with glass morphism cards
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Typography, LoadingSpinner } from '../components/ui';
import { theme } from '../theme/theme';

const { width } = Dimensions.get('window');

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  interval: 'month' | 'year';
  features: string[];
  stripePriceId: string;
}

interface Subscription {
  id: string;
  planId: string;
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete';
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

interface Invoice {
  id: string;
  amount: number;
  status: 'paid' | 'open' | 'draft' | 'void' | 'uncollectible';
  dueDate: string;
  paidAt?: string;
  invoiceUrl: string;
  invoicePdf: string;
}

export default function BillingScreen({ navigation }: any) {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'plans' | 'subscription' | 'invoices'>('plans');
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [processingPlanId, setProcessingPlanId] = useState<string | null>(null);

  useEffect(() => {
    fetchBillingData();
  }, []);

  const fetchBillingData = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';

      // Fetch plans
      const plansResponse = await fetch(`${API_URL}/api/billing/plans`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const plansData = await plansResponse.json();
      if (plansData.success) {
        setPlans(plansData.data);
      }

      // Fetch current subscription (mock for now)
      setCurrentSubscription({
        id: 'sub_123',
        planId: 'basic',
        status: 'active',
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        cancelAtPeriodEnd: false
      });

      // Fetch invoices (mock for now)
      setInvoices([
        {
          id: 'inv_1',
          amount: 2900,
          status: 'paid',
          dueDate: new Date().toISOString(),
          paidAt: new Date().toISOString(),
          invoiceUrl: 'https://stripe.com/invoice/1',
          invoicePdf: 'https://stripe.com/invoice/1.pdf'
        },
        {
          id: 'inv_2',
          amount: 2900,
          status: 'paid',
          dueDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          paidAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          invoiceUrl: 'https://stripe.com/invoice/2',
          invoicePdf: 'https://stripe.com/invoice/2.pdf'
        }
      ]);

      setLoading(false);
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', 'Failed to load billing data. Please try again.');
    }
  };

  const handleSubscribe = async (planId: string) => {
    try {
      setProcessingPlanId(planId);

      // In production: Show Stripe payment sheet
      Alert.alert(
        'Subscribe to Plan',
        'This will open Stripe payment form. In production, integrate @stripe/stripe-react-native',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Continue',
            onPress: async () => {
              // Mock subscription creation
              await new Promise(r => setTimeout(r, 1500));

              setCurrentSubscription({
                id: 'sub_new',
                planId,
                status: 'active',
                currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                cancelAtPeriodEnd: false
              });

              Alert.alert('Success', 'Subscription activated!');
              setActiveTab('subscription');
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to process subscription');
    } finally {
      setProcessingPlanId(null);
    }
  };

  const handleChangePlan = async (newPlanId: string) => {
    Alert.alert(
      'Change Plan',
      'Are you sure you want to change your subscription plan? Changes will be prorated.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Change Plan',
          onPress: async () => {
            try {
              setProcessingPlanId(newPlanId);
              await new Promise(r => setTimeout(r, 1000));

              if (currentSubscription) {
                setCurrentSubscription({ ...currentSubscription, planId: newPlanId });
              }

              Alert.alert('Success', 'Plan changed successfully!');
            } catch (error) {
              Alert.alert('Error', 'Failed to change plan');
            } finally {
              setProcessingPlanId(null);
            }
          }
        }
      ]
    );
  };

  const handleCancelSubscription = () => {
    Alert.alert(
      'Cancel Subscription',
      'Your subscription will remain active until the end of the current billing period.',
      [
        { text: 'Keep Subscription', style: 'cancel' },
        {
          text: 'Cancel',
          style: 'destructive',
          onPress: async () => {
            if (currentSubscription) {
              setCurrentSubscription({ ...currentSubscription, cancelAtPeriodEnd: true });
            }
            Alert.alert('Subscription Canceled', 'You will retain access until the end of your billing period.');
          }
        }
      ]
    );
  };

  const renderPlanCard = (plan: SubscriptionPlan, isCurrentPlan: boolean) => {
    const isProcessing = processingPlanId === plan.id;

    return (
      <View key={plan.id} style={[styles.planCard, isCurrentPlan && styles.currentPlanCard]}>
        {isCurrentPlan && (
          <View style={styles.currentPlanBadge}>
            <Typography variant="caption" weight="semibold" style={styles.currentPlanBadgeText}>
              Current Plan
            </Typography>
          </View>
        )}

        <Typography variant="h3" weight="bold" style={styles.planName}>
          {plan.name}
        </Typography>
        <Typography variant="body" color="secondary" style={styles.planDescription}>
          {plan.description}
        </Typography>

        <View style={styles.priceContainer}>
          <Typography variant="h1" weight="bold" style={styles.priceAmount}>
            ${(plan.price / 100).toFixed(2)}
          </Typography>
          <Typography variant="body" color="secondary" style={styles.priceInterval}>
            /{plan.interval}
          </Typography>
        </View>

        <View style={styles.featuresContainer}>
          {plan.features.map((feature, index) => (
            <View key={index} style={styles.featureRow}>
              <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} importantForAccessibility="no" accessible={false} />
              <Typography variant="body" style={styles.featureText}>
                {feature}
              </Typography>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={[
            styles.planButton,
            isCurrentPlan && styles.planButtonCurrent,
            isProcessing && styles.planButtonProcessing
          ]}
          onPress={() => {
            if (isCurrentPlan) {
              // Already subscribed
              return;
            } else if (currentSubscription) {
              handleChangePlan(plan.id);
            } else {
              handleSubscribe(plan.id);
            }
          }}
          disabled={isProcessing || isCurrentPlan}
          accessibilityRole="button"
          accessibilityLabel={isCurrentPlan ? `Current plan: ${plan.name}` : `Subscribe to ${plan.name}`}
          accessibilityHint={isCurrentPlan ? 'This is your current subscription plan' : currentSubscription ? 'Switch to this subscription plan' : 'Subscribe to this plan'}
          accessibilityState={{ disabled: isProcessing || isCurrentPlan }}
        >
          {isProcessing ? (
            <LoadingSpinner size="small" color="white" />
          ) : (
            <Typography variant="body" weight="semibold" style={styles.planButtonText}>
              {isCurrentPlan ? 'Current Plan' : currentSubscription ? 'Switch Plan' : 'Subscribe'}
            </Typography>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  const renderSubscriptionTab = () => {
    if (!currentSubscription) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="card-outline" size={64} color={theme.colors.primary} importantForAccessibility="no" accessible={false} />
          <Typography variant="h3" weight="semibold" style={styles.emptyText}>
            No active subscription
          </Typography>
          <Typography variant="body" color="secondary" style={styles.emptySubtext}>
            Choose a plan to get started
          </Typography>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => setActiveTab('plans')}
            accessibilityRole="button"
            accessibilityLabel="View available subscription plans"
            accessibilityHint="Switch to plans tab to see subscription options"
          >
            <Typography variant="body" weight="semibold" style={styles.emptyButtonText}>
              View Plans
            </Typography>
          </TouchableOpacity>
        </View>
      );
    }

    const currentPlan = plans.find(p => p.id === currentSubscription.planId);
    const statusColors: Record<string, string> = {
      active: '#10b981',
      trialing: '#3b82f6',
      past_due: '#f59e0b',
      canceled: '#ef4444',
      incomplete: '#6b7280'
    };

    return (
      <View style={styles.subscriptionContainer}>
        <View style={styles.subscriptionCard}>
          <View style={styles.subscriptionHeader}>
            <Typography variant="h3" weight="bold" style={styles.subscriptionTitle}>
              {currentPlan?.name}
            </Typography>
            <View style={[styles.statusBadge, { backgroundColor: statusColors[currentSubscription.status] }]}>
              <Typography variant="caption" weight="semibold" style={styles.statusBadgeText}>
                {currentSubscription.status.toUpperCase()}
              </Typography>
            </View>
          </View>

          <View style={styles.subscriptionDetail}>
            <Ionicons name="calendar-outline" size={20} color={theme.colors.textSecondary} importantForAccessibility="no" accessible={false} />
            <Typography variant="body" style={styles.subscriptionDetailText}>
              Renews on {new Date(currentSubscription.currentPeriodEnd).toLocaleDateString()}
            </Typography>
          </View>

          <View style={styles.subscriptionDetail}>
            <Ionicons name="cash-outline" size={20} color={theme.colors.textSecondary} importantForAccessibility="no" accessible={false} />
            <Typography variant="body" style={styles.subscriptionDetailText}>
              ${((currentPlan?.price || 0) / 100).toFixed(2)}/{currentPlan?.interval}
            </Typography>
          </View>

          {currentSubscription.cancelAtPeriodEnd && (
            <View style={styles.cancelWarning}>
              <Ionicons name="warning-outline" size={20} color={theme.colors.warning} importantForAccessibility="no" accessible={false} />
              <Typography variant="body" style={styles.cancelWarningText}>
                Subscription will cancel on {new Date(currentSubscription.currentPeriodEnd).toLocaleDateString()}
              </Typography>
            </View>
          )}

          <View style={styles.subscriptionActions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonSecondary]}
              onPress={() => setActiveTab('plans')}
              accessibilityRole="button"
              accessibilityLabel="Change subscription plan"
              accessibilityHint="Switch to plans tab to change your subscription"
            >
              <Typography variant="body" weight="semibold" style={styles.actionButtonTextSecondary}>
                Change Plan
              </Typography>
            </TouchableOpacity>

            {!currentSubscription.cancelAtPeriodEnd && (
              <TouchableOpacity
                style={[styles.actionButton, styles.actionButtonDanger]}
                onPress={handleCancelSubscription}
                accessibilityRole="button"
                accessibilityLabel="Cancel subscription"
                accessibilityHint="Cancel your subscription at the end of the billing period"
              >
                <Typography variant="body" weight="semibold" style={styles.actionButtonText}>
                  Cancel
                </Typography>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderInvoicesTab = () => {
    if (invoices.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="document-text-outline" size={64} color={theme.colors.primary} importantForAccessibility="no" accessible={false} />
          <Typography variant="h3" weight="semibold" style={styles.emptyText}>
            No invoices yet
          </Typography>
          <Typography variant="body" color="secondary" style={styles.emptySubtext}>
            Your billing history will appear here
          </Typography>
        </View>
      );
    }

    return (
      <View style={styles.invoicesContainer}>
        {invoices.map((invoice) => (
          <View key={invoice.id} style={styles.invoiceCard}>
            <View style={styles.invoiceHeader}>
              <View>
                <Typography variant="h3" weight="bold" style={styles.invoiceAmount}>
                  ${(invoice.amount / 100).toFixed(2)}
                </Typography>
                <Typography variant="body" color="secondary" style={styles.invoiceDate}>
                  {new Date(invoice.dueDate).toLocaleDateString()}
                </Typography>
              </View>

              <View style={[
                styles.invoiceStatusBadge,
                { backgroundColor: invoice.status === 'paid' ? theme.colors.success : theme.colors.textSecondary }
              ]}>
                <Typography variant="caption" weight="semibold" style={styles.invoiceStatusText}>
                  {invoice.status.toUpperCase()}
                </Typography>
              </View>
            </View>

            <TouchableOpacity
              style={styles.downloadButton}
              onPress={() => {
                // In production: Open invoice PDF
                Alert.alert('Download Invoice', 'Opening invoice PDF...');
              }}
              accessibilityRole="button"
              accessibilityLabel={`Download invoice for ${(invoice.amount / 100).toFixed(2)} dollars`}
              accessibilityHint="Download PDF copy of this invoice"
            >
              <Ionicons name="download-outline" size={20} color={theme.colors.primary} importantForAccessibility="no" accessible={false} />
              <Typography variant="body" weight="semibold" style={styles.downloadButtonText}>
                Download PDF
              </Typography>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <LoadingSpinner
        fullScreen
        size="large"
        text="Loading billing information..."
        color={theme.colors.primary}
      />
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={theme.gradients.primary.colors}
        style={styles.header}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          accessibilityHint="Return to previous screen"
        >
          <Ionicons name="arrow-back" size={24} color="#fff" importantForAccessibility="no" accessible={false} />
        </TouchableOpacity>

        <Typography variant="h1" weight="bold" style={styles.headerTitle}>
          Billing & Subscriptions
        </Typography>
        <Typography variant="body" style={styles.headerSubtitle}>
          Manage your account and payments
        </Typography>
      </LinearGradient>

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'plans' && styles.tabActive]}
          onPress={() => setActiveTab('plans')}
          accessibilityRole="tab"
          accessibilityLabel="View subscription plans"
          accessibilityState={{ selected: activeTab === 'plans' }}
        >
          <Ionicons
            name="pricetag"
            size={20}
            color={activeTab === 'plans' ? theme.colors.primary : theme.colors.textSecondary}
            importantForAccessibility="no"
            accessible={false}
          />
          <Typography
            variant="body"
            weight="medium"
            style={[styles.tabText, activeTab === 'plans' && styles.tabTextActive]}
          >
            Plans
          </Typography>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'subscription' && styles.tabActive]}
          onPress={() => setActiveTab('subscription')}
          accessibilityRole="tab"
          accessibilityLabel="View current subscription"
          accessibilityState={{ selected: activeTab === 'subscription' }}
        >
          <Ionicons
            name="card"
            size={20}
            color={activeTab === 'subscription' ? theme.colors.primary : theme.colors.textSecondary}
            importantForAccessibility="no"
            accessible={false}
          />
          <Typography
            variant="body"
            weight="medium"
            style={[styles.tabText, activeTab === 'subscription' && styles.tabTextActive]}
          >
            Subscription
          </Typography>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'invoices' && styles.tabActive]}
          onPress={() => setActiveTab('invoices')}
          accessibilityRole="tab"
          accessibilityLabel="View invoices"
          accessibilityState={{ selected: activeTab === 'invoices' }}
        >
          <Ionicons
            name="document-text"
            size={20}
            color={activeTab === 'invoices' ? theme.colors.primary : theme.colors.textSecondary}
            importantForAccessibility="no"
            accessible={false}
          />
          <Typography
            variant="body"
            weight="medium"
            style={[styles.tabText, activeTab === 'invoices' && styles.tabTextActive]}
          >
            Invoices
          </Typography>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} accessibilityLabel="Billing content" accessibilityRole="scrollview">
        {activeTab === 'plans' && (
          <View style={styles.plansContainer}>
            {plans.map(plan => renderPlanCard(plan, currentSubscription?.planId === plan.id))}
          </View>
        )}

        {activeTab === 'subscription' && renderSubscriptionTab()}
        {activeTab === 'invoices' && renderInvoicesTab()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 30,
    paddingHorizontal: 20
  },
  backButton: {
    marginBottom: 20
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)'
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.primary
  },
  tabText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: '500'
  },
  tabTextActive: {
    color: theme.colors.primary
  },
  content: {
    flex: 1
  },
  plansContainer: {
    padding: 20,
    gap: 20
  },
  planCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.xl,
    padding: 24,
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    position: 'relative'
  },
  currentPlanCard: {
    borderWidth: 2,
    borderColor: theme.colors.primary
  },
  currentPlanBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.lg
  },
  currentPlanBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600'
  },
  planName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 8
  },
  planDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 20
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 24
  },
  priceAmount: {
    fontSize: 40,
    fontWeight: 'bold',
    color: theme.colors.primary
  },
  priceInterval: {
    fontSize: 18,
    color: theme.colors.textSecondary,
    marginLeft: 4
  },
  featuresContainer: {
    gap: 12,
    marginBottom: 24
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  featureText: {
    fontSize: 15,
    color: theme.colors.text,
    flex: 1
  },
  planButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center'
  },
  planButtonCurrent: {
    backgroundColor: theme.colors.textSecondary
  },
  planButtonProcessing: {
    opacity: 0.7
  },
  planButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600'
  },
  subscriptionContainer: {
    padding: 20
  },
  subscriptionCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.xl,
    padding: 24,
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3
  },
  subscriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  subscriptionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.lg
  },
  statusBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600'
  },
  subscriptionDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12
  },
  subscriptionDetailText: {
    fontSize: 16,
    color: theme.colors.text
  },
  cancelWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fef3c7',
    padding: 12,
    borderRadius: theme.borderRadius.md,
    marginTop: 12,
    marginBottom: 20
  },
  cancelWarningText: {
    flex: 1,
    fontSize: 14,
    color: '#92400e'
  },
  subscriptionActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center'
  },
  actionButtonSecondary: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  actionButtonDanger: {
    backgroundColor: theme.colors.error
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600'
  },
  actionButtonTextSecondary: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '600'
  },
  invoicesContainer: {
    padding: 20,
    gap: 16
  },
  invoiceCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: 20,
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  invoiceAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 4
  },
  invoiceDate: {
    fontSize: 14,
    color: theme.colors.textSecondary
  },
  invoiceStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.lg
  },
  invoiceStatusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600'
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md
  },
  downloadButtonText: {
    color: theme.colors.primary,
    fontSize: 15,
    fontWeight: '600'
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: 20,
    marginBottom: 8
  },
  emptySubtext: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24
  },
  emptyButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: theme.borderRadius.lg
  },
  emptyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600'
  }
});
