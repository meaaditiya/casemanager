const NodeRSA = require('node-rsa');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * Generate RSA key pair for blockchain signing
 * Run this script ONCE during initial setup: node blockchain/utils/generateKeys.js
 */

const generateKeyPair = () => {
  console.log('🔐 Generating RSA key pair for blockchain signing...');

  // Create keys directory if it doesn't exist
  const keysDir = path.join(__dirname, '../keys');
  if (!fs.existsSync(keysDir)) {
    fs.mkdirSync(keysDir, { recursive: true });
    console.log('✅ Created keys directory');
  }

  // Generate 2048-bit RSA key pair
  const key = new NodeRSA({ b: 2048 });
  key.setOptions({ encryptionScheme: 'pkcs1' });

  // Export keys in PEM format
  const privateKey = key.exportKey('private');
  const publicKey = key.exportKey('public');

  // Save private key
  const privateKeyPath = path.join(keysDir, 'private.pem');
  fs.writeFileSync(privateKeyPath, privateKey, { mode: 0o600 }); // Read/write for owner only
  console.log(`✅ Private key saved: ${privateKeyPath}`);

  // Save public key
  const publicKeyPath = path.join(keysDir, 'public.pem');
  fs.writeFileSync(publicKeyPath, publicKey);
  console.log(`✅ Public key saved: ${publicKeyPath}`);

  // Generate fingerprint for public key (for verification)
  const publicKeyFingerprint = crypto
    .createHash('sha256')
    .update(publicKey)
    .digest('hex')
    .substring(0, 16); // First 16 chars

  console.log(`\n🔑 Public Key Fingerprint: ${publicKeyFingerprint}`);
  
  console.log('\n⚠️  IMPORTANT SECURITY NOTES:');
  console.log('1. Keep private.pem SECRET - never commit to Git!');
  console.log('2. Add blockchain/keys/ to .gitignore');
  console.log('3. Backup private.pem securely');
  console.log('4. Public key can be shared freely');
  
  console.log('\n📝 Add to your .env file:');
  console.log(`RSA_PRIVATE_KEY_PATH=./blockchain/keys/private.pem`);
  console.log(`RSA_PUBLIC_KEY_PATH=./blockchain/keys/public.pem`);
  console.log(`RSA_PUBLIC_KEY_FINGERPRINT=${publicKeyFingerprint}`);

  // Create .gitignore in keys directory
  const gitignorePath = path.join(keysDir, '.gitignore');
  fs.writeFileSync(gitignorePath, '# Never commit private keys\nprivate.pem\n*.key\n');
  console.log('\n✅ Created .gitignore in keys directory');

  return {
    privateKeyPath,
    publicKeyPath,
    publicKeyFingerprint
  };
};

// Run if called directly
if (require.main === module) {
  try {
    generateKeyPair();
    console.log('\n✅ Key generation complete!');
  } catch (error) {
    console.error('❌ Error generating keys:', error);
    process.exit(1);
  }
}

module.exports = generateKeyPair;