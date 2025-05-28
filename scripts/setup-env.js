#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🚀 Environment Setup for Retail Insights Dashboard\n');

const envPath = path.join(process.cwd(), '.env');
const envExamplePath = path.join(process.cwd(), '.env.example');

// Check if .env already exists
if (fs.existsSync(envPath)) {
  console.log('⚠️  .env file already exists!');
  rl.question('Do you want to overwrite it? (y/N): ', (answer) => {
    if (answer.toLowerCase() !== 'y') {
      console.log('✅ Keeping existing .env file');
      process.exit(0);
    }
    createEnvFile();
  });
} else {
  createEnvFile();
}

function createEnvFile() {
  console.log('\n📝 Please provide your configuration:\n');
  
  const questions = [
    {
      key: 'VITE_SUPABASE_URL',
      question: 'Supabase Project URL: ',
      required: true
    },
    {
      key: 'VITE_SUPABASE_ANON_KEY',
      question: 'Supabase Anon Key: ',
      required: true
    },
    {
      key: 'VITE_SENTRY_DSN',
      question: 'Sentry DSN (optional, press Enter to skip): ',
      required: false
    }
  ];
  
  const config = {};
  let currentIndex = 0;
  
  function askQuestion() {
    if (currentIndex >= questions.length) {
      // Write the .env file
      const envContent = Object.entries(config)
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');
      
      fs.writeFileSync(envPath, envContent);
      console.log('\n✅ .env file created successfully!');
      console.log('🎉 You can now run: npm run dev');
      rl.close();
      return;
    }
    
    const { key, question, required } = questions[currentIndex];
    rl.question(question, (answer) => {
      if (required && !answer) {
        console.log('❌ This field is required!');
        askQuestion();
      } else {
        if (answer) config[key] = answer;
        currentIndex++;
        askQuestion();
      }
    });
  }
  
  askQuestion();
}