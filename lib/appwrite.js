// lib/appwrite.js
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Supabase project credentials
const SUPABASE_URL = 'https://fpkbfjjqxiquhbspimhh.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZwa2JmampxeGlxdWhic3BpbWhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyOTE2MzMsImV4cCI6MjA3ODg2NzYzM30.wbHOBeiJFt3QMe4rj2qTrfzxFtvJVgefVMWeGTlEhwk';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});

// ---------- Auth helpers ----------

// Assignment name: createUser
export async function createUser({ email, password, username }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // store username in auth metadata
      data: { username },
    },
  });

  if (error) throw error;

  const user = data.user;

  if (user) {
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert(
        {
          id: user.id,
          username,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );

    if (profileError) {
      console.log(
        'Profile upsert error (non-fatal, auth still succeeded):',
        profileError.message
      );
    }
  }

  return data; // { user, session }
}

// Assignment name: signIn
export async function signIn({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data; // { user, session }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user;
}

export const signUpWithEmail = createUser;
export const signInWithEmail = signIn;

// ---------- Video storage helpers ----------

export async function uploadVideo({ fileUri, userId }) {
  const path = `${userId}/${Date.now()}.mp4`;

  const response = await fetch(fileUri);
  const blob = await response.blob();

  const { data, error } = await supabase.storage
    .from('videos')
    .upload(path, blob, {
      contentType: 'video/mp4',
      upsert: false,
    });

  if (error) throw error;
  return data;
}

export async function listVideos() {
  const { data, error } = await supabase.storage.from('videos').list('', {
    limit: 100,
    sortBy: { column: 'created_at', order: 'desc' },
  });

  if (error) throw error;
  return data;
}
