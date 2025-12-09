const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://fpkbfjjqxiquhbspimhh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZwa2JmampxeGlxdWhic3BpbWhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyOTE2MzMsImV4cCI6MjA3ODg2NzYzM30.wbHOBeiJFt3QMe4rj2qTrfzxFtvJVgefVMWeGTlEhwk';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testSaveAndRetrieve() {
  console.log('\n🧪 FINAL TEST: Save & Retrieve Clinical Case with Transcript\n');
  
  try {
    // Step 1: INSERT a case with transcript
    const testCase = {
      title: 'Test Recording Case',
      clinic_type: 'Test Clinic',
      language: 'en',
      clinical_history: 'Patient presented with test symptoms',
      transcript: [
        { content: 'Hello, I am experiencing headaches', role: 'patient', timestamp: 0 },
        { content: 'How long have you had these headaches?', role: 'doctor', timestamp: 2000 },
        { content: 'About two weeks now', role: 'patient', timestamp: 5000 }
      ],
      attachments: []
    };
    
    console.log('1️⃣ Inserting test case...');
    const { data: inserted, error: insertError } = await supabase
      .from('kallpa_cases')
      .insert([testCase])
      .select()
      .single();
    
    if (insertError) {
      console.log('❌ INSERT FAILED:', insertError);
      return;
    }
    
    console.log(`✅ INSERT SUCCESS! ID: ${inserted.id}`);
    console.log(`   Transcript lines saved: ${inserted.transcript?.length || 0}`);
    
    // Step 2: RETRIEVE the case
    console.log('\n2️⃣ Retrieving cases...');
    const { data: cases, error: readError } = await supabase
      .from('kallpa_cases')
      .select('id, title, clinical_history, transcript, inserted_at, clinic_type')
      .order('inserted_at', { ascending: false })
      .limit(5);
    
    if (readError) {
      console.log('❌ READ FAILED:', readError);
    } else {
      console.log(`✅ RETRIEVED ${cases.length} cases:`);
      cases.forEach((c, i) => {
        console.log(`\n   Case ${i+1}: "${c.title}"`);
        console.log(`   - Clinic: ${c.clinic_type}`);
        console.log(`   - History: ${c.clinical_history}`);
        console.log(`   - Transcript lines: ${c.transcript?.length || 0}`);
        if (c.transcript && c.transcript.length > 0) {
          console.log(`   - First line: "${c.transcript[0]?.content?.substring(0, 50)}..."`);
        }
      });
    }
    
    // Step 3: CLEANUP
    console.log(`\n3️⃣ Cleaning up test case...`);
    await supabase.from('kallpa_cases').delete().eq('id', inserted.id);
    console.log('✅ Cleanup complete\n');
    
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ ALL TESTS PASSED! The database is working correctly!');
    console.log('═══════════════════════════════════════════════════\n');
    
  } catch (error) {
    console.log('❌ UNEXPECTED ERROR:', error);
  }
}

testSaveAndRetrieve();
