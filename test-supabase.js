const { createClient } = require('@supabase/supabase-js');
const ws = require('ws');

const supabaseUrl = 'https://fiqxtvddtdmhpvceshxx.supabase.co';
const supabaseKey = 'sb_publishable_dV4Te0sZPZGcrEBEn7EayA_VnRs9Uhj';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
  realtime: { transport: ws }
});

async function testConnection() {
  console.log('Testing Supabase Connection...');
  console.log('URL:', supabaseUrl);

  try {
    const { data, error } = await supabase.from('qr_codes').select('*').limit(5);

    if (error) {
      console.log('Error querying table:', error.message);
    } else {
      console.log('✅ Connection to Supabase successful!');
      console.log('Retrieved data from "qr_codes" table:');
      console.dir(data, { depth: null });
    }
  } catch (err) {
    console.error('Connection Exception:', err.message);
  }
}

testConnection();
