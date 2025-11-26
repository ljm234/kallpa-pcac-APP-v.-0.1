// Premium $100,000 Sign-In Screen
import React, { useState } from 'react';
import { View, Text, Alert, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, Redirect, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import FormField from '../../components/FormField';
import CustomButton from '../../components/CustomButton';
import { signIn } from '../../lib/appwrite';
import { useGlobalContext } from '../../context/GlobalProvider';

const SignIn = () => {
  const router = useRouter();
  const { isAuthLoading, isLoggedIn, setUser, setIsLoggedIn } = useGlobalContext();
  const [form, setForm] = useState({ email: '', password: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setValidationError('');
  };

  const mapAuthError = (error) => {
    if (!error) return 'Unexpected error';
    const msg = String(error.message || '').toLowerCase();
    if (msg.includes('invalid login credentials')) return 'Email or password is incorrect';
    if (msg.includes('email not confirmed')) return 'Please confirm your email first';
    if (msg.includes('too many requests')) return 'Too many attempts. Wait a minute';
    if (msg.includes('network')) return 'Network error. Check connection';
    return error.message || 'Unexpected error';
  };

  const handleSignIn = async () => {
    if (isSubmitting) return;
    const email = form.email.trim().toLowerCase();
    const password = form.password;

    if (!email || !password) {
      setValidationError('Please fill in both fields');
      Platform.OS === 'web' ? window.alert('Please fill in both fields') : Alert.alert('Missing Info', 'Please fill in both fields');
      return;
    }
    if (password.length < 6) {
      setValidationError('Password must be 6+ characters');
      Platform.OS === 'web' ? window.alert('Password must be 6+ characters') : Alert.alert('Invalid Password', 'Password must be 6+ characters');
      return;
    }
    if (attempts >= 8) {
      Platform.OS === 'web' ? window.alert('Too many attempts') : Alert.alert('Too many attempts', 'Please wait');
      return;
    }

    setIsSubmitting(true);
    try {
      const { user } = await signIn({ email, password });
      setUser(user);
      setIsLoggedIn(true);
      setAttempts(0);
      Platform.OS === 'web' ? (window.alert('Welcome back!'), router.replace('/(tabs)/home')) : Alert.alert('Welcome!', 'Signed in successfully', [{ text: 'OK', onPress: () => router.replace('/(tabs)/home') }]);
    } catch (error) {
      setAttempts((a) => a + 1);
      const friendly = mapAuthError(error);
      Platform.OS === 'web' ? window.alert(friendly) : Alert.alert('Sign in failed', friendly);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthLoading && isLoggedIn) return <Redirect href="/(tabs)/home" />;

  return (
    <View style={{ flex: 1, backgroundColor: '#0A0E27' }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 60 }}>
          <View style={{ marginBottom: 56, alignItems: 'center' }}>
            <LinearGradient
              colors={['#FF9C01', '#FF6B01']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                width: 88, height: 88, borderRadius: 26, alignItems: 'center', justifyContent: 'center', marginBottom: 28,
                ...Platform.select({ web: { boxShadow: '0 20px 40px rgba(255, 156, 1, 0.3)' }, default: { shadowColor: '#FF9C01', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.5, shadowRadius: 20, elevation: 15 } })
              }}
            >
              <Text style={{ fontSize: 44, fontWeight: '900', color: '#FFFFFF' }}>JM</Text>
            </LinearGradient>
            <Text style={{ fontSize: 38, fontWeight: '900', color: '#FFFFFF', letterSpacing: -1.5, marginBottom: 12 }}>Welcome Back</Text>
            <Text style={{ fontSize: 17, color: '#8B92A7', textAlign: 'center', lineHeight: 26, fontWeight: '500' }}>Sign in to continue to JM Labs</Text>
          </View>

          <View style={{ width: '100%', maxWidth: 460 }}>
            <FormField label="Email Address" title="Email Address" placeholder="you@example.com" value={form.email} onChangeText={(v) => handleChange('email', v)} keyboardType="email-address" autoCapitalize="none" />
            <View style={{ marginTop: 20 }}>
              <FormField label="Password" title="Password" placeholder="Enter your password" value={form.password} onChangeText={(v) => handleChange('password', v)} secureTextEntry={!showPassword} isPassword onTogglePassword={() => setShowPassword(!showPassword)} />
            </View>

            {validationError ? (
              <View style={{ marginTop: 16, backgroundColor: 'rgba(239, 68, 68, 0.12)', paddingVertical: 14, paddingHorizontal: 18, borderRadius: 14, borderLeftWidth: 4, borderLeftColor: '#EF4444' }}>
                <Text style={{ fontSize: 14, color: '#FCA5A5', fontWeight: '600' }}>{validationError}</Text>
              </View>
            ) : null}

            <View style={{ marginTop: 32 }}>
              <CustomButton title={isSubmitting ? 'Signing In...' : 'Sign In'} handlePress={handleSignIn} isLoading={isSubmitting} />
            </View>

            <View style={{ marginTop: 32, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ fontSize: 16, color: '#8B92A7', fontWeight: '500' }}>Don't have an account? </Text>
              <Link href="/(auth)/sign-up" style={{ fontSize: 16, color: '#FF9C01', fontWeight: '700' }}>Sign Up</Link>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default SignIn;
