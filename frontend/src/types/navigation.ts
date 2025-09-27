import { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  Onboarding: undefined;
  Login: undefined;
  Register: undefined;
  Main: NavigatorScreenParams<TabParamList>;
};

export type TabParamList = {
  Dashboard: undefined;
  Reports: undefined;
  Enterprise: undefined;
  Profile: { userId?: string };
  Settings: undefined;
};

export type ScreenProps<T extends keyof RootStackParamList> = {
  navigation: {
    navigate: (screen: keyof RootStackParamList, params?: RootStackParamList[keyof RootStackParamList]) => void;
    goBack: () => void;
  };
  route: {
    params: RootStackParamList[T];
  };
};

export type TabScreenProps<T extends keyof TabParamList> = {
  navigation: {
    navigate: (screen: keyof TabParamList, params?: TabParamList[keyof TabParamList]) => void;
    goBack: () => void;
  };
  route: {
    params: TabParamList[T];
  };
};
