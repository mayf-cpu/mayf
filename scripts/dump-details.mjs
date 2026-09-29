import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, getDocs, collection } from 'firebase/firestore';

const sourceConfig = {
  projectId: "polished-entropy-bsmzh",
  appId: "1:646173414950:web:284d72652c51f5c8c9b8e7",
  apiKey: "AIzaSyCwdZlAvJyt5lz13eTDYqwv7KihMt2OoHs",
  authDomain: "polished-entropy-bsmzh.firebaseapp.com",
};

const appNamed = initializeApp(sourceConfig, 'source_named');
const dbNamed = getFirestore(appNamed, "ai-studio-mathsatyourfinge-031b8821-5af5-417b-a2dd-18814d304e5d");

const appDefault = initializeApp(sourceConfig, 'source_default');
const dbDefault = getFirestore(appDefault);

async function dumpDetails() {
  console.log('--- NAMED DB: settings/branding ---');
  const bSnap = await getDoc(doc(dbNamed, 'settings', 'branding'));
  if (bSnap.exists()) {
    console.log(JSON.stringify(bSnap.data(), null, 2));
  } else {
    console.log('None');
  }

  console.log('--- NAMED DB: settings/theme ---');
  const tSnap = await getDoc(doc(dbNamed, 'settings', 'theme'));
  if (tSnap.exists()) {
    console.log(JSON.stringify(tSnap.data(), null, 2));
  } else {
    console.log('None');
  }

  console.log('--- NAMED DB: notifications ---');
  const nSnap = await getDocs(collection(dbNamed, 'notifications'));
  nSnap.forEach(d => console.log(d.id, JSON.stringify(d.data(), null, 2)));

  console.log('--- DEFAULT DB: checking settings and collections ---');
  const settingDocs = ['page_text', 'branding', 'gateway', 'categories', 'theme', 'social', 'seo', 'ads', 'admins'];
  for (const s of settingDocs) {
    try {
      const snap = await getDoc(doc(dbDefault, 'settings', s));
      if (snap.exists()) {
        console.log(`DEFAULT DB: settings/${s} EXISTS:`, JSON.stringify(snap.data()).substring(0, 100));
      }
    } catch(e) {}
  }

  process.exit(0);
}

dumpDetails().catch(err => {
  console.error(err);
  process.exit(1);
});
