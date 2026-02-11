const mongoose = require('mongoose');
require('dotenv').config();

async function createIndexes() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;
    
    console.log('📊 Creating/checking indexes...\n');
    
    // Helper function to create index safely
    async function createIndexSafe(collection, indexSpec, options = {}) {
      try {
        await db.collection(collection).createIndex(indexSpec, options);
        console.log(`✅ Created: ${collection}.${JSON.stringify(indexSpec)}`);
      } catch (error) {
        if (error.code === 86) {
          console.log(`ℹ️  Already exists: ${collection}.${JSON.stringify(indexSpec)}`);
        } else {
          console.error(`❌ Error on ${collection}:`, error.message);
        }
      }
    }
    
    // Critical indexes for speed
    await createIndexSafe('blocks', { entityId: 1, index: 1 }, { name: 'entityId_index_compound' });
    await createIndexSafe('blocks', { hash: 1 }, { unique: true, name: 'hash_unique' });
    await createIndexSafe('auditcheckpoints', { blockIndex: 1, createdAt: -1 }, { name: 'blockIndex_createdAt' });
    await createIndexSafe('blocks', { dataType: 1, index: -1 }, { name: 'dataType_index' });
    await createIndexSafe('blocks', { timestamp: -1 }, { name: 'timestamp_desc' });
    
    console.log('\n✅ Index setup complete!');
    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createIndexes().then(() => process.exit(0));