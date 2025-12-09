const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://fpkbfjjqxiquhbspimhh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZwa2JmampxeGlxdWhic3BpbWhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyOTE2MzMsImV4cCI6MjA3ODg2NzYzM30.wbHOBeiJFt3QMe4rj2qTrfzxFtvJVgefVMWeGTlEhwk';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkSchema() {
  console.log('\n🔍 Checking kallpa_cases table schema...\n');
  
  try {
    // Try to select ALL columns to see what exists
    const { data, error } = await supabase
      .from('kallpa_cases')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ ERROR:', error);
    } else {
      if (data && data.length > 0) {
        console.log('✅ Available columns:');
        console.log(Object.keys(data[0]));
        console.log('\n✅ Sample row:');
        console.log(JSON.stringify(data[0], null, 2));
      } else {
        console.log('⚠️  Table exists but is empty. Cannot determine schema.');
        console.log('   Try inserting minimal data...');
        
        const { data: inserted, error: insertError } = await supabase
          .from('kallpa_cases')
          .insert([{ title: 'Test' }])
          .select('*')
          .single();
        
        if (insertError) {
          console.log('❌ Insert failed:', insertError);
        } else {
          console.log('\n✅ Columns after insert:');
          console.log(Object.keys(inserted));
          
          // Clean up
          await supabase.from('kallpa_cases').delete().eq('id', inserted.id);
        }
      }
    }
  } catch (error) {
    console.log('❌ UNEXPECTED ERROR:', error);
  }
}

checkSchema();
