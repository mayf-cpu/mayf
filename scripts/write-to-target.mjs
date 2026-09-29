import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import fs from 'fs';

const targetConfig = {
  projectId: "maths-at-your-fingertips",
  appId: "1:202928978202:web:6c1cf4f9a8cdd0de3e14a3",
  apiKey: "AIzaSyCxmWreV5y-fLRR_MOVEpFMEAk957ddEUw",
  authDomain: "maths-at-your-fingertips.firebaseapp.com",
  firestoreDatabaseId: "(default)",
};

const targetApp = initializeApp(targetConfig, 'target');
const targetDb = getFirestore(targetApp);

const raw = fs.readFileSync('src/data/previousDatabaseExport.json', 'utf-8');
const exportData = JSON.parse(raw);

async function runDirectWrite() {
  console.log('Attempting write to settings/pageContent on target DB...');
  try {
    await setDoc(doc(targetDb, 'settings', 'pageContent'), exportData.settings.pageContent);
    console.log('SUCCESS writing settings/pageContent!');
  } catch (e) {
    console.log('Error writing settings/pageContent:', e.message);
  }

  try {
    await setDoc(doc(targetDb, 'settings', 'branding'), exportData.settings.branding);
    console.log('SUCCESS writing settings/branding!');
  } catch (e) {
    console.log('Error writing settings/branding:', e.message);
  }

  try {
    await setDoc(doc(targetDb, 'settings', 'theme'), exportData.settings.theme);
    console.log('SUCCESS writing settings/theme!');
  } catch (e) {
    console.log('Error writing settings/theme:', e.message);
  }

  process.exit(0);
}

runDirectWrite().catch(e => {
  console.error(e);
  process.exit(1);
});
