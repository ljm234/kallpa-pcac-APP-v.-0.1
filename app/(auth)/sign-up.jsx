// Premium $100,000 Sign-Up Screen
import React, { useState } from 'react';
import { View, Text, Alert, ScrollView, Platform } from 'react-native';
import { Link, Redirect, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import FormField from '../../components/FormField';
import CustomButton from '../../components/CustomButton';
import { createUser } from '../../lib/appwrite';
import { useGlobalContext } from '../../context/GlobalProvider';

const SignUp = () => {
  const router = useRouter();
  const { isAuthLoading, isLoggedIn } = useGlobalContext();
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setValidationError('');
  };

  const handleSignUp = async () => {
    if (isSubmitting) return;
    const username = form.username.trim();
    const email = form.email.trim();
    const password = form.password;

    if (!username || !email || !password) {
      setValidationError('All fields are required');
      Platform.OS === 'web' ? window.alert('All fields required') : Alert.alert('Missing Info', 'Fill in all fields');
      return;
    }
    if (password.length < 6) {
      setValidationError('Password must be 6+ characters');
      Platform.OS === 'web' ? window.alert('Password too short') : Alert.alert('Weak Password', '6+ characters required');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setValidationError('Invalid email address');
      Platform.OS === 'web' ? window.alert('Invalid email') : Alert.alert('Invalid Email', 'Check your email');
      return;
    }

    setIsSubmitting(true);
    try {
      await createUser({ email, password, username });
      Platform.OS === 'web' ? (window.alert('Account created!'), router.replace('/(auth)/sign-in')) : Alert.alert('Success!', 'Account created. Sign in now.', [{ text: 'OK', onPress: () => router.replace('/(auth)/sign-in') }]);
    } catch (error) {
      const msg = error.message || 'Sign up failed';
      setValidationError(msg);
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Sign up failed', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthLoading && isLoggedIn) return <Redirect href="/(tabs)/home" />;

  return (
    <View style={{ flex: 1, backgroundColor: '#0A0E27' }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 60 }}>
          <View style={{ marginBottom: 48, alignItems: 'center' }}>
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
            <Text style={{ fontSize: 38, fontWeight: '900', color: '#FFFFFF', letterSpacing: -1.5, marginBottom: 12 }}>Create Account</Text>
            <Text style={{ fontSize: 17, color: '#8B92A7', textAlign: 'center', lineHeight: 26, fontWeight: '500' }}>Join JM Labs today</Text>
          </View>

          <View style={{ width: '100%', maxWidth: 460 }}>
            <FormField label="Username" title="Username" placeholder="Your username" value={form.username} onChangeText={(v) => handleChange('username', v)} autoCapitalize="none" />
            
            <View style={{ marginTop: 20 }}>
              <FormField label="Email Address" title="Email Address" placeholder="you@example.com" value={form.email} onChangeText={(v) => handleChange('email', v)} keyboardType="email-address" autoCapitalize="none" />
            </View>

            <View style={{ marginTop: 20 }}>
              <FormField label="Password" title="Password" placeholder="Create a strong password" value={form.password} onChangeText={(v) => handleChange('password', v)} secureTextEntry={!showPassword} isPassword onTogglePassword={() => setShowPassword(!showPassword)} />
            </View>

            {validationError ? (
              <View style={{ marginTop: 16, backgroundColor: 'rgba(239, 68, 68, 0.12)', paddingVertical: 14, paddingHorizontal: 18, borderRadius: 14, borderLeftWidth: 4, borderLeftColor: '#EF4444' }}>
                <Text style={{ fontSize: 14, color: '#FCA5A5', fontWeight: '600' }}>{validationError}</Text>
              </View>
            ) : null}

            <View style={{ marginTop: 32 }}>
              <CustomButton title={isSubmitting ? 'Creating Account...' : 'Sign Up'} handlePress={handleSignUp} isLoading={isSubmitting} />
            </View>

            <View style={{ marginTop: 32, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ fontSize: 16, color: '#8B92A7', fontWeight: '500' }}>Already have an account? </Text>
              <Link href="/(auth)/sign-in" style={{ fontSize: 16, color: '#FF9C01', fontWeight: '700' }}>Sign In</Link>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default SignUp;
