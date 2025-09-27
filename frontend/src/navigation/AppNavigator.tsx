import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { RootStackParamList, TabParamList } from '../types/navigation';

// Screens
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HealthDashboard from '../components/HealthDashboard';
import ReportsScreen from '../screens/ReportsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import EnterpriseScreen from '../screens/EnterpriseScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import { RootState } from '../store/store';

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createStackNavigator<RootStackParamList>();

const AuthStack: React.FC = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Onboarding" component={OnboardingScreen} />
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
  </Stack.Navigator>
);

const MainTabs: React.FC = () => {
  const tabBarIcon = (routeName: keyof TabParamList) => 
    ({ focused, color, size }: { focused: boolean; color: string; size: number }) => {
      let iconName: string;

      switch (routeName) {
        case 'Dashboard':
          iconName = 'dashboard';
          break;
        case 'Reports':
          iconName = 'assessment';
          break;
        case 'Enterprise':
          iconName = 'business';
          break;
        case 'Profile':
          iconName = 'person';
          break;
        case 'Settings':
          iconName = 'settings';
          break;
        default:
          iconName = 'help';
      }

      return <Icon name={iconName} size={size} color={color} />;
    };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: tabBarIcon(route.name as keyof TabParamList),
        tabBarActiveTintColor: '#667eea',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E5EA',
          height: 85,
          paddingBottom: 20,
          paddingTop: 10,
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: -2,
          },
          shadowOpacity: 0.1,
          shadowRadius: 3,
          elevation: 5,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 4,
        },
        headerShown: true,
        headerStyle: {
          backgroundColor: '#667eea',
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 2,
          },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
          elevation: 5,
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 18,
        },
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={HealthDashboard}
        options={{
          title: 'Health Dashboard',
          tabBarLabel: 'Dashboard',
          tabBarIcon: tabBarIcon('Dashboard')
        }}
      />
      <Tab.Screen
        name="Reports"
        component={ReportsScreen}
        options={{
          title: 'Health Reports',
          tabBarLabel: 'Reports',
          tabBarIcon: tabBarIcon('Reports')
        }}
      />
      <Tab.Screen
        name="Enterprise"
        component={EnterpriseScreen}
        options={{
          title: 'Enterprise Platform',
          tabBarLabel: 'Enterprise',
          tabBarIcon: tabBarIcon('Enterprise'),
          tabBarBadge: 'NEW',
          tabBarBadgeStyle: {
            backgroundColor: '#FF3B30',
            color: 'white',
            fontSize: 10,
            fontWeight: 'bold',
          }
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Profile',
          tabBarLabel: 'Profile',
          tabBarIcon: tabBarIcon('Profile')
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: 'Settings',
          tabBarLabel: 'Settings',
          tabBarIcon: tabBarIcon('Settings')
        }}
      />
    </Tab.Navigator>
  );
};

const AppNavigator: React.FC = () => {
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  return isAuthenticated ? <MainTabs /> : <AuthStack />;
};

export default AppNavigator;
