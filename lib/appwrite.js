// lib/appwrite.js
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

// --- Supabase client config ---
const SUPABASE_URL = 'https://fpkbfjjqxiquhbspimhh.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZwa2JmampxeGlxdWhic3BpbWhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyOTE2MzMsImV4cCI6MjA3ODg2NzYzM30.wbHOBeiJFt3QMe4rj2qTrfzxFtvJVgefVMWeGTlEhwk';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// --------------------------------------------------
// AUTH HELPERS
// --------------------------------------------------

export async function signUpWithEmail({ email, password, username }) {
  // Create auth user in Supabase
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username },
    },
  });

  if (error) {
    console.error('Supabase signUp error:', error);
    throw error;
  }


  return data;
}

export async function signInWithEmail({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error('Supabase signIn error:', error);
    throw error;
  }

  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Supabase signOut error:', error);
    throw error;
  }
}

// --------------------------------------------------
// VIDEO STORAGE HELPERS 
// --------------------------------------------------

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

  if (error) {
    console.error('uploadVideo error:', error);
    throw error;
  }

  return data;
}

export async function listVideos() {
  const { data, error } = await supabase.storage
    .from('videos')
    .list('', {
      limit: 100,
      sortBy: { column: 'created_at', order: 'desc' },
    });

  if (error) {
    console.error('listVideos error:', error);
    throw error;
  }

  return data;
}
