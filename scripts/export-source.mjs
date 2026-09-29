import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, getDocs, collection } from 'firebase/firestore';
import fs from 'fs';

const sourceConfig = {
  projectId: "polished-entropy-bsmzh",
  appId: "1:646173414950:web:284d72652c51f5c8c9b8e7",
  apiKey: "AIzaSyCwdZlAvJyt5lz13eTDYqwv7KihMt2OoHs",
  authDomain: "polished-entropy-bsmzh.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-mathsatyourfinge-031b8821-5af5-417b-a2dd-18814d304e5d",
};

const app = initializeApp(sourceConfig, 'source');
const db = getFirestore(app, sourceConfig.firestoreDatabaseId);

async function dumpAll() {
  const exported = {
    settings: {},
    notifications: [],
    custom_resources: [],
    coupons: [],
  };

  const settingDocs = [
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

  for (const s of settingDocs) {
    try {
      const snap = await getDoc(doc(db, 'settings', s));
      if (snap.exists()) {
        exported.settings[s] = snap.data();
        console.log(`Saved settings/${s}`);
      }
    } catch(e) {
      console.warn(`Error settings/${s}:`, e.message);
    }
  }

  try {
    const notifs = await getDocs(collection(db, 'notifications'));
    notifs.forEach(d => {
      exported.notifications.push({ id: d.id, ...d.data() });
    });
    console.log(`Saved ${exported.notifications.length} notifications`);
  } catch(e) {
    console.warn('Error notifications:', e.message);
  }

  try {
    const res = await getDocs(collection(db, 'custom_resources'));
    res.forEach(d => {
      exported.custom_resources.push({ id: d.id, ...d.data() });
    });
    console.log(`Saved ${exported.custom_resources.length} custom_resources`);
  } catch(e) {
    console.warn('Error custom_resources:', e.message);
  }

  try {
    const c = await getDocs(collection(db, 'coupons'));
    c.forEach(d => {
      exported.coupons.push({ id: d.id, ...d.data() });
    });
    console.log(`Saved ${exported.coupons.length} coupons`);
  } catch(e) {
    console.warn('Error coupons:', e.message);
  }

  fs.writeFileSync('src/data/previousDatabaseExport.json', JSON.stringify(exported, null, 2), 'utf-8');
  console.log('Successfully saved to src/data/previousDatabaseExport.json');
  process.exit(0);
}

dumpAll().catch(e => {
  console.error('Fatal dump error:', e);
  process.exit(1);
});
