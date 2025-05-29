import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceKey);

async function fixTBWABrandsCorrect() {
  console.log('🔧 FIXING TBWA BRANDS - CORRECT COLUMN NAME');
  console.log('='.repeat(60));

  // First, let's see what brands actually exist
  const { data: allBrands } = await supabase
    .from('brands')
    .select('id, name, is_tbwa, category')
    .order('name');

  console.log(`📊 Total brands in database: ${allBrands?.length}`);

  // Show current TBWA status
  const currentTBWABrands = allBrands?.filter(b => b.is_tbwa === true) || [];
  console.log(`✨ Current TBWA brands: ${currentTBWABrands.length}`);
  
  if (currentTBWABrands.length > 0) {
    console.log('Current TBWA brands:');
    currentTBWABrands.forEach(brand => {
      console.log(`   ✨ ${brand.name} (${brand.category})`);
    });
  }

  // TBWA target brands based on what we see in the database
  const tbwaTargets = [
    'Alaska', 'Alpine', 'Cow Bell', 'Krem-Top',
    'Oishi', 'Smart C+', 'Gourmet', 'Crispy',
    'Champion', 'Calla', 'Hana', 'Pride',
    'Del Monte', 'S&W', 'Today', 'Fit',
    'Winston', 'Camel', 'Mevius', 'LD', 'Mighty',
    'Marlboro', 'Philip Morris'  // Adding common tobacco brands
  ];

  console.log('\n🎯 UPDATING TBWA TARGET BRANDS (using correct column):');
  let updatedCount = 0;

  for (const target of tbwaTargets) {
    try {
      const { data: updateResult, error } = await supabase
        .from('brands')
        .update({ is_tbwa: true })
        .ilike('name', `%${target}%`)
        .select('id, name, category');

      if (error) {
        console.log(`   ❌ Error updating "${target}": ${error.message}`);
      } else if (updateResult && updateResult.length > 0) {
        updatedCount += updateResult.length;
        console.log(`   ✅ Updated "${target}": ${updateResult.length} brands`);
        updateResult.forEach(brand => {
          console.log(`      ✨ ${brand.name} (${brand.category})`);
        });
      } else {
        console.log(`   ⚠️ No brands found for "${target}"`);
      }
    } catch (err) {
      console.log(`   ❌ Exception updating "${target}": ${err.message}`);
    }
  }

  // Also mark some major competitors as non-TBWA
  console.log('\n🏢 MARKING COMPETITORS (ensuring they are NOT TBWA):');
  const competitors = ['Nestle', 'Unilever', 'Procter', 'Colgate', 'Johnson'];
  
  let competitorCount = 0;
  for (const comp of competitors) {
    try {
      const { data: updateResult, error } = await supabase
        .from('brands')
        .update({ is_tbwa: false })
        .ilike('name', `%${comp}%`)
        .select('id, name');

      if (!error && updateResult && updateResult.length > 0) {
        competitorCount += updateResult.length;
        console.log(`   🏢 Marked "${comp}" as competitor: ${updateResult.length} brands`);
      }
    } catch (err) {
      console.log(`   ⚠️ Could not update "${comp}"`);
    }
  }

  // Final verification with correct column
  console.log('\n📊 FINAL VERIFICATION (using correct column):');
  
  const { count: tbwaCount } = await supabase
    .from('brands')
    .select('*', { count: 'exact', head: true })
    .eq('is_tbwa', true);

  const { count: competitorCount2 } = await supabase
    .from('brands')
    .select('*', { count: 'exact', head: true })
    .eq('is_tbwa', false);

  const { count: unknownCount } = await supabase
    .from('brands')
    .select('*', { count: 'exact', head: true })
    .is('is_tbwa', null);

  const { data: tbwaBrands } = await supabase
    .from('brands')
    .select('name, category')
    .eq('is_tbwa', true)
    .order('name');

  console.log(`✨ TBWA Brands: ${tbwaCount}`);
  console.log(`🏢 Competitor Brands: ${competitorCount2}`);
  console.log(`❓ Unknown Status: ${unknownCount}`);
  
  if (tbwaBrands && tbwaBrands.length > 0) {
    console.log('\n✨ TBWA Brand List:');
    tbwaBrands.forEach((brand, index) => {
      console.log(`   ${index + 1}. ${brand.name} (${brand.category})`);
    });
  }

  // Summary by category
  console.log('\n📊 TBWA BRANDS BY CATEGORY:');
  const categoryBreakdown = {};
  tbwaBrands?.forEach(brand => {
    categoryBreakdown[brand.category] = (categoryBreakdown[brand.category] || 0) + 1;
  });

  Object.entries(categoryBreakdown).forEach(([category, count]) => {
    console.log(`   ${category}: ${count} brands`);
  });

  console.log('\n🎉 TBWA BRAND FIX COMPLETE!');
  console.log(`✅ Updated ${updatedCount} brands to TBWA status`);
  console.log(`🏢 Marked ${competitorCount} competitor brands`);
  
  return { tbwaCount, competitorCount2, updatedCount };
}

fixTBWABrandsCorrect();