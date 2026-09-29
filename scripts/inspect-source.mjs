import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, getDocs, collection } from 'firebase/firestore';

const sourceConfig = {
  projectId: "polished-entropy-bsmzh",
  appId: "1:646173414950:web:284d72652c51f5c8c9b8e7",
  apiKey: "AIzaSyCwdZlAvJyt5lz13eTDYqwv7KihMt2OoHs",
  authDomain: "polished-entropy-bsmzh.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-mathsatyourfinge-031b8821-5af5-417b-a2dd-18814d304e5d",
};

const app = initializeApp(sourceConfig, 'source');
const db = getFirestore(app, sourceConfig.firestoreDatabaseId);

async function inspectSource() {
  console.log('Inspecting source database:');
  const collectionsToCheck = [
    'settings',
    'custom_resources',
    'coupons',
    'notifications',
    'analytics',
    'users',
    'orders',
    'ai_queries'
  ];

  const settingDocs = [
    'page_text',
    'branding',
    'gateway',
    'categories',
    'theme',
    'social',
    'seo',
    'ads',
    'admins'
  ];

  for (const sId of settingDocs) {
    try {
      const snap = await getDoc(doc(db, 'settings', sId));
      if (snap.exists()) {
        console.log(`[FOUND] settings/${sId}:`, JSON.stringify(snap.data()).substring(0, 100) + '...');
      } else {
        console.log(`[EMPTY] settings/${sId}`);
      }
    } catch (e) {
      console.log(`[ERROR] settings/${sId}:`, e.message);
    }
  }

  for (const colName of collectionsToCheck) {
    if (colName === 'settings') continue;
    try {
      const snap = await getDocs(collection(db, colName));
      console.log(`[COLLECTION] ${colName}: found ${snap.size} documents`);
    } catch (e) {
      console.log(`[ERROR] collection ${colName}:`, e.message);
    }
  }

  process.exit(0);
}

inspectSource().catch(err => {
  console.error('Fatal inspect error:', err);
  process.exit(1);
});
