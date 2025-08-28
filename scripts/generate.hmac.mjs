import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import url from 'url';

export const generateHmacKey = () => {
  console.log('🔐 Generating HMAC Secret Key...\n');
  
  const hmacKey = crypto.randomBytes(32).toString('hex');
  
  console.log('✅ Generated 256-bit HMAC Key:');
  console.log(`${hmacKey}\n`);
  
  const envPath = path.join(process.cwd(), '.env');
  let envContent = '';
  
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf-8');
    console.log('📄 Found existing .env file');
    
    if (envContent.includes('HMAC_SECRET_KEY=')) {
      console.log('⚠️  HMAC_SECRET_KEY already exists in .env');
      console.log('❓ If you want to replace it, manually update the line:');
      console.log(`   HMAC_SECRET_KEY=${hmacKey}`);
      return;
    }
  } else {
    console.log('📝 Creating new .env file');
  }
  
  const hmacLine = `HMAC_SECRET_KEY=${hmacKey}`;
  if (envContent && !envContent.endsWith('\n')) envContent += '\n';
  envContent += hmacLine + '\n';
  fs.writeFileSync(envPath, envContent);
  
  console.log('✅ HMAC key added to .env file');
  console.log(`📍 Location: ${envPath}`);
};

// Correção para execução direta em ESM (Windows compatível)
if (url.fileURLToPath(import.meta.url) === process.argv[1]) {
  generateHmacKey();
}
