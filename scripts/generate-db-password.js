// Generate a secure database password following the pattern of the existing one
function generateDashboardPassword() {
  console.log('🔐 Generating New Database Password');
  console.log('==================================\n');
  
  // Current pattern: R@nd0mPA$$2025!
  // New pattern: similar but updated for behavioral analytics
  
  const passwords = [
    'D@shb0ardPA$$2025!',
    'R3t@ilPA$$2025!', 
    'Beh@vi0rPA$$2025!',
    'An@lyticsPA$$2025!',
    'D@tab@sePA$$2025!'
  ];
  
  console.log('🎯 Suggested secure passwords (choose one):');
  console.log('===========================================\n');
  
  passwords.forEach((password, index) => {
    console.log(`${index + 1}. ${password}`);
  });
  
  console.log('\n📋 Instructions:');
  console.log('================');
  console.log('1. Choose one of the passwords above');
  console.log('2. Go to: https://supabase.com/dashboard/project/lcoxtanyckjzyxxcsjzz/settings/database');
  console.log('3. Click "Reset Database Password"');
  console.log('4. Enter your chosen password in the "Custom Password" field');
  console.log('5. Click "Update Password"');
  console.log('6. Update your .env file with the new password\n');
  
  console.log('💡 Recommended choice: D@shb0ardPA$$2025!');
  console.log('   (Similar to your existing pattern but updated)\n');
  
  console.log('🔧 After password reset, run:');
  console.log('============================');
  console.log('# Update .env file');
  console.log('echo "DATABASE_PASSWORD=D@shb0ardPA$$2025!" > .env.tmp');
  console.log('sed "s/DATABASE_PASSWORD=.*/DATABASE_PASSWORD=D@shb0ardPA$$2025!/" .env > .env.new && mv .env.new .env');
  console.log('');
  console.log('# Test the connection');
  console.log('supabase db push --linked --password "D@shb0ardPA$$2025!" --dry-run');
  console.log('');
  console.log('# Apply the behavioral analytics migration');
  console.log('supabase db push --linked --password "D@shb0ardPA$$2025!"');
}

generateDashboardPassword();