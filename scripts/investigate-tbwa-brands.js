import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceKey);

async function investigateTBWABrands() {
  console.log('🔍 INVESTIGATING TBWA BRAND ISSUE');
  console.log('='.repeat(60));

  // First, let's see what brands actually exist
  const { data: allBrands } = await supabase
    .from('brands')
    .select('id, name, is_tbwa_client')
    .order('name');

  console.log(`📊 Total brands in database: ${allBrands?.length}`);
  console.log('\n📋 FIRST 20 BRANDS:');
  
  allBrands?.slice(0, 20).forEach((brand, index) => {
    const tbwaStatus = brand.is_tbwa_client === true ? '✨' : brand.is_tbwa_client === false ? '🏢' : '❓';
    console.log(`   ${index + 1}. ${tbwaStatus} ${brand.name} (ID: ${brand.id})`);
  });

  // Check for TBWA target brands specifically
  const tbwaTargets = [
    'Alaska', 'Alpine', 'Cow Bell', 'Krem-Top',
    'Oishi', 'Smart C+', 'Gourmet Picks', 'Crispy Patata',
    'Champion', 'Calla', 'Hana', 'Pride',
    'Del Monte', 'S&W', 'Today\'s', 'Fit \'n Right',
    'Winston', 'Camel', 'Mevius', 'LD', 'Mighty'
  ];

  console.log('\n🎯 SEARCHING FOR TBWA TARGET BRANDS:');
  let foundCount = 0;

  for (const target of tbwaTargets) {
    const { data: matches } = await supabase
      .from('brands')
      .select('id, name, is_tbwa_client')
      .ilike('name', `%${target}%`);

    if (matches && matches.length > 0) {
      foundCount += matches.length;
      console.log(`   ✅ "${target}": Found ${matches.length} matches`);
      matches.forEach(match => {
        const status = match.is_tbwa_client === true ? '✨' : match.is_tbwa_client === false ? '🏢' : '❓';
        console.log(`      ${status} ${match.name} (ID: ${match.id})`);
      });
    } else {
      console.log(`   ❌ "${target}": No matches found`);
    }
  }

  console.log(`\n📊 Total TBWA target brands found: ${foundCount}`);

  // Now let's try to update them specifically
  console.log('\n🔧 ATTEMPTING TO UPDATE TBWA BRANDS:');

  let updatedCount = 0;
  for (const target of tbwaTargets) {
    try {
      const { data: updateResult, error } = await supabase
        .from('brands')
        .update({ is_tbwa_client: true })
        .ilike('name', `%${target}%`)
        .select('id, name');

      if (error) {
        console.log(`   ❌ Error updating "${target}": ${error.message}`);
      } else if (updateResult && updateResult.length > 0) {
        updatedCount += updateResult.length;
        console.log(`   ✅ Updated "${target}": ${updateResult.length} brands`);
        updateResult.forEach(brand => {
          console.log(`      ✨ ${brand.name} (ID: ${brand.id})`);
        });
      } else {
        console.log(`   ⚠️ No brands found for "${target}"`);
      }
    } catch (err) {
      console.log(`   ❌ Exception updating "${target}": ${err.message}`);
    }
  }

  // Final verification
  console.log('\n📊 FINAL VERIFICATION:');
  
  const { count: tbwaCount } = await supabase
    .from('brands')
    .select('*', { count: 'exact', head: true })
    .eq('is_tbwa_client', true);

  const { data: tbwaBrands } = await supabase
    .from('brands')
    .select('name')
    .eq('is_tbwa_client', true);

  console.log(`✨ TBWA Brands Count: ${tbwaCount}`);
  
  if (tbwaBrands && tbwaBrands.length > 0) {
    console.log('✨ TBWA Brand Names:');
    tbwaBrands.forEach((brand, index) => {
      console.log(`   ${index + 1}. ${brand.name}`);
    });
  }

  // Check the column structure
  console.log('\n🔍 CHECKING COLUMN STRUCTURE:');
  const { data: sampleBrand } = await supabase
    .from('brands')
    .select('*')
    .limit(1);

  if (sampleBrand && sampleBrand.length > 0) {
    console.log('📋 Brand table columns:');
    Object.keys(sampleBrand[0]).forEach(col => {
      console.log(`   - ${col}: ${typeof sampleBrand[0][col]} (${sampleBrand[0][col]})`);
    });
  }

  return updatedCount;
}

investigateTBWABrands();