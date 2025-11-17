// app/(tabs)/profile.jsx
import React from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';

import CustomButton from '../../components/CustomButton';
import { signOut } from '../../lib/appwrite';
import { useGlobalContext } from '../../context/GlobalProvider';

function Profile() {
  const router = useRouter();
  const { user, setUser, setIsLoggedIn } = useGlobalContext();

  const handleSignOut = async () => {
    try {
      await signOut();
      setUser(null);
      setIsLoggedIn(false);
      router.replace('/(auth)/sign-in');
    } catch (error) {
      console.error('Sign out failed', error);
      Alert.alert(
        'Sign out failed',
        error?.message ?? 'Unexpected error while signing out.'
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.text}>
          Logged in as:{' '}
          <Text style={{ fontWeight: '600' }}>
            {user?.email ?? 'Unknown user'}
          </Text>
        </Text>

        <CustomButton
          title="Sign out"
          handlePress={handleSignOut}
          isLoading={false}
        />
      </View>
    </SafeAreaView>
  );
}

export default Profile;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  inner: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 12,
  },
  text: {
    fontSize: 16,
    lineHeight: 22,
    color: '#444444',
    marginBottom: 24,
  },
});
