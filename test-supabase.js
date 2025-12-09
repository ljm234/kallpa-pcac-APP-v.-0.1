// Quick test to verify Supabase connection - FIXED VERSION
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://fpkbfjjqxiquhbspimhh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZwa2JmampxeGlxdWhic3BpbWhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyOTE2MzMsImV4cCI6MjA3ODg2NzYzM30.wbHOBeiJFt3QMe4rj2qTrfzxFtvJVgefVMWeGTlEhwk';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testConnection() {
  console.log('\n🔍 Testing Supabase Connection (FIXED)...\n');
  
  try {
    // Test 1: Read from kallpa_cases (using updated_at)
    const { data: cases, error: casesError } = await supabase
      .from('kallpa_cases')
      .select('id, title, updated_at, metadata')
      .order('updated_at', { ascending: false })
      .limit(5);
    
    if (casesError) {
      console.log('❌ ERROR reading kallpa_cases:', casesError);
    } else {
      console.log(`✅ SUCCESS! Found ${cases.length} saved cases in database:`);
      cases.forEach((c, i) => {
        const eventCount = c.metadata?.events?.length || 0;
        console.log(`   ${i+1}. "${c.title}" - ${eventCount} events - ${new Date(c.updated_at).toLocaleString()}`);
      });
    }
    
    // Test 2: Try inserting a test case (NO created_at)
    console.log('\n🧪 Testing INSERT (no created_at)...');
    const testCase = {
      title: 'TEST CASE - DELETE ME',
      notes: 'This is a test',
      clinic_type: 'Test',
      language: 'en',
      metadata: {
        events: [
          { content: 'Test line 1', role: 'speaker', timestamp: 0 },
          { content: 'Test line 2', role: 'speaker', timestamp: 1000 }
        ]
      }
    };
    
    const { data: inserted, error: insertError } = await supabase
      .from('kallpa_cases')
      .insert([testCase])
      .select()
      .single();
    
    if (insertError) {
      console.log('❌ ERROR inserting:', insertError);
    } else {
      console.log('✅ INSERT SUCCESS! Created case:', inserted.id);
      console.log('   Events saved:', inserted.metadata?.events?.length || 0);
      
      // Clean up - delete the test case
      await supabase.from('kallpa_cases').delete().eq('id', inserted.id);
      console.log('✅ Cleaned up test case');
    }
    
  } catch (error) {
    console.log('❌ UNEXPECTED ERROR:', error);
  }
}

testConnection();
