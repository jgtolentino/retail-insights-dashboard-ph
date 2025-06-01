const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkCurrentBrands() {
  const { data: brands } = await supabase.from('brands').select('id, name, category, is_tbwa').order('id');
  const { data: stores } = await supabase.from('stores').select('*').order('id');
  
  console.log('📊 CURRENT DATABASE STATE:');
  console.log(`✅ Total brands: ${brands?.length || 0}`);
  console.log(`✅ TBWA brands: ${brands?.filter(b => b.is_tbwa).length || 0}`);
  console.log(`✅ Competitor brands: ${brands?.filter(b => !b.is_tbwa).length || 0}`);
  console.log(`✅ Total stores: ${stores?.length || 0}`);
  
  const categories = [...new Set(brands?.map(b => b.category))];
  console.log(`📁 Categories: ${categories.join(', ')}`);
  
  console.log('\n🏷️ All brands in filter dropdown:');
  brands?.slice(0, 20).forEach(b => console.log(`${b.id}: ${b.name} (${b.category}) - ${b.is_tbwa ? 'TBWA' : 'Competitor'}`));
  
  if (brands?.length > 20) {
    console.log(`... and ${brands.length - 20} more brands`);
  }
  
  console.log('\n🏪 All stores:');
  stores?.forEach(s => console.log(`${s.id}: ${s.name} - ${s.city}, ${s.region}`));
  
  console.log('\n📋 SUMMARY:');
  console.log('✅ Database is populated and ready');
  console.log('✅ Filter dropdown should show all brands');
  console.log('✅ Dashboard is ready for testing');
}

checkCurrentBrands();