import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, getDocs, collection } from 'firebase/firestore';

const sourceConfig = {
  projectId: "polished-entropy-bsmzh",
  appId: "1:646173414950:web:284d72652c51f5c8c9b8e7",
  apiKey: "AIzaSyCwdZlAvJyt5lz13eTDYqwv7KihMt2OoHs",
  authDomain: "polished-entropy-bsmzh.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-mathsatyourfinge-031b8821-5af5-417b-a2dd-18814d304e5d",
};

const targetConfig = {
  projectId: "maths-at-your-fingertips",
  appId: "1:202928978202:web:6c1cf4f9a8cdd0de3e14a3",
  apiKey: "AIzaSyCxmWreV5y-fLRR_MOVEpFMEAk957ddEUw",
  authDomain: "maths-at-your-fingertips.firebaseapp.com",
  firestoreDatabaseId: "(default)",
};

const sourceApp = initializeApp(sourceConfig, 'source');
const sourceDb = getFirestore(sourceApp, sourceConfig.firestoreDatabaseId);

const targetApp = initializeApp(targetConfig, 'target');
const targetDb = getFirestore(targetApp);

async function testFetchAndWrite() {
  console.log('Testing reading from source:');
  const checkSettings = [
    'pageContent',
    'branding',
    'theme',
    'paymentGateway',
    'categories',
    'social',
    'seo',
    'ads',
    'admins'
  ];

  for (const s of checkSettings) {
    try {
      const snap = await getDoc(doc(sourceDb, 'settings', s));
      if (snap.exists()) {
        const d = snap.data();
        console.log(`[SOURCE FOUND] settings/${s} keys:`, Object.keys(d));
        if (s === 'pageContent') {
          console.log(`[pageContent sample]:`, JSON.stringify(d).substring(0, 300));
        }
      } else {
        console.log(`[SOURCE EMPTY] settings/${s}`);
      }
    } catch (e) {
      console.log(`[SOURCE ERROR] settings/${s}:`, e.message);
    }
  }

  // Check custom_resources, coupons, notifications
  const cols = ['custom_resources', 'coupons', 'notifications', 'analytics'];
  for (const col of cols) {
    try {
      const snap = await getDocs(collection(sourceDb, col));
      console.log(`[SOURCE COLLECTION] ${col}: ${snap.size} items`);
    } catch (e) {
      console.log(`[SOURCE ERROR] col ${col}:`, e.message);
    }
  }

  // Test write to target
  console.log('Testing write to target:');
  try {
    await setDoc(doc(targetDb, 'test', 'migration_check'), {
      timestamp: new Date().toISOString(),
      test: true
    });
    console.log('[TARGET WRITE] Successfully wrote test document to target DB!');
  } catch (e) {
    console.log('[TARGET WRITE ERROR]:', e.message);
  }

  process.exit(0);
}

testFetchAndWrite().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
