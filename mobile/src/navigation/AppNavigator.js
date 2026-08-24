import React from 'react';

import {
  NavigationContainer,
} from '@react-navigation/native';

import {
  createNativeStackNavigator,
} from '@react-navigation/native-stack';

import {
  createBottomTabNavigator,
} from '@react-navigation/bottom-tabs';

import {
  Ionicons,
} from '@expo/vector-icons';

import {
  useAuth,
} from '../context/AuthContext';

import {
  colors,
} from '../theme/theme';


// =====================================================
// AUTH SCREENS
// =====================================================

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import OtpVerificationScreen from '../screens/OtpVerificationScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';


// =====================================================
// MAIN SCREENS
// =====================================================

import DashboardScreen from '../screens/DashboardScreen';
import HomeScreen from '../screens/HomeScreen';
import SearchScreen from '../screens/SearchScreen';
import ListingDetailScreen from '../screens/ListingDetailScreen';
import CreateListingScreen from '../screens/CreateListingScreen';
import MessagesScreen from '../screens/MessagesScreen';
import ChatScreen from '../screens/ChatScreen';
import ProfileScreen from '../screens/ProfileScreen';
import MyListingsScreen from '../screens/MyListingsScreen';


// =====================================================
// NAVIGATORS
// =====================================================

const AuthStack =
  createNativeStackNavigator();

const RootStack =
  createNativeStackNavigator();

const Tab =
  createBottomTabNavigator();


// =====================================================
// AUTH NAVIGATOR
// =====================================================

function AuthNavigator() {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >

      <AuthStack.Screen
        name="Login"
        component={LoginScreen}
      />

      <AuthStack.Screen
        name="Register"
        component={RegisterScreen}
      />

      <AuthStack.Screen
        name="OtpVerification"
        component={OtpVerificationScreen}
      />

      <AuthStack.Screen
        name="ForgotPassword"
        component={ForgotPasswordScreen}
      />

      <AuthStack.Screen
        name="ResetPassword"
        component={ResetPasswordScreen}
      />

    </AuthStack.Navigator>
  );
}


// =====================================================
// TAB ICONS
// =====================================================

const TAB_ICONS = {
  Dashboard: 'grid-outline',
  Marketplace: 'storefront-outline',
  Search: 'search-outline',
  Messages: 'chatbubble-ellipses-outline',
  CreateListing: 'add-circle-outline',
};


// =====================================================
// MAIN TABS
// =====================================================

function MainTabs() {

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({

        headerShown: true,

        headerStyle: {
          backgroundColor:
            colors.surface,
        },

        headerTitleStyle: {
          fontWeight: '700',
          color:
            colors.textPrimary,
        },

        headerShadowVisible: false,

        tabBarActiveTintColor:
          colors.primary,

        tabBarInactiveTintColor:
          colors.textMuted,

        tabBarIcon: ({
          color,
          size,
        }) => (

          <Ionicons
            name={
              TAB_ICONS[
                route.name
              ] ||
              'ellipse-outline'
            }

            size={
              size - 2
            }

            color={
              color
            }
          />

        ),
      })}
    >

      {/* =================================================
          DASHBOARD
      ================================================= */}

      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          title: 'Dashboard',
        }}
      />


      {/* =================================================
          MARKETPLACE
      ================================================= */}

      <Tab.Screen
        name="Marketplace"
        component={HomeScreen}
        options={{
          title: 'Marketplace',
          headerShown: false,
        }}
      />


      {/* =================================================
          SEARCH
      ================================================= */}

      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{
          title: 'Smart Search',
        }}
      />


      {/* =================================================
          MESSAGES
      ================================================= */}

      <Tab.Screen
        name="Messages"
        component={MessagesScreen}
        options={{
          title: 'Messages',
          headerShown: false,
        }}
      />


      {/* =================================================
          CREATE LISTING
      ================================================= */}

      <Tab.Screen
        name="CreateListing"
        component={CreateListingScreen}
        options={{
          title: 'Sell a Device',
        }}
      />

    </Tab.Navigator>
  );
}


// =====================================================
// MAIN NAVIGATOR
// =====================================================

function MainNavigator() {

  return (
    <RootStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor:
            colors.surface,
        },

        headerTitleStyle: {
          fontWeight: '700',
          color:
            colors.textPrimary,
        },

        headerShadowVisible: false,
      }}
    >

      {/* =================================================
          MAIN TABS
      ================================================= */}

      <RootStack.Screen
        name="Tabs"
        component={MainTabs}
        options={{
          headerShown: false,
        }}
      />


      {/* =================================================
          LISTING DETAIL
      ================================================= */}

      <RootStack.Screen
        name="ListingDetail"
        component={ListingDetailScreen}
        options={{
          title: 'Listing',
        }}
      />


      {/* =================================================
          CHAT
      ================================================= */}

      <RootStack.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          title: 'Chat',
        }}
      />


      {/* =================================================
          MY LISTINGS
      ================================================= */}

      <RootStack.Screen
        name="MyListings"
        component={MyListingsScreen}
        options={{
          title: 'My Listings',
        }}
      />


      {/* =================================================
          PROFILE
      ================================================= */}

      <RootStack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Your Profile',
        }}
      />

    </RootStack.Navigator>
  );
}


// =====================================================
// APP NAVIGATOR
// =====================================================

export default function AppNavigator() {

  const {
    user,
    loading,
  } = useAuth();


  // ===================================================
  // AUTH LOADING
  // ===================================================

  if (loading) {
    return null;
  }


  // ===================================================
  // NAVIGATION
  // ===================================================

  return (

    <NavigationContainer>

      {user ? (

        <MainNavigator />

      ) : (

        <AuthNavigator />

      )}

    </NavigationContainer>

  );
}