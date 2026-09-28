import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  orderBy,
  limit,
  getDocFromServer,
  onSnapshot,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// CRITICAL: Database initialized with firestoreDatabaseId
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Configure Google Provider
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// Validate Connection to Firestore on boot
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is currently offline or unreachable.');
    }
  }
}
testConnection();

// Standard Error Handler per Firebase Skill
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// User Profile Interface
export interface UserProfile {
  userId: string;
  email: string;
  displayName: string;
  photoURL?: string;
  grade: string;
  targetExam?: string;
  schoolName?: string;
  mobileNumber?: string;
  countryCode?: string;
  phoneNumber?: string;
  whatsappAlerts?: boolean;
  mobileRegisteredAt?: string;
  hasJoinedSocial?: boolean;
  isPro: boolean;
  proPlan?: string;
  bookmarks?: string[];
  preferredCurrency?: string;
  createdAt: string;
  updatedAt?: string;
}

// Update complete User Profile details
export async function updateUserProfile(
  userId: string,
  profileData: Partial<UserProfile>
): Promise<void> {
  const userRef = doc(db, 'users', userId);
  try {
    await setDoc(userRef, {
      ...profileData,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
  }
}

// Update Student Mobile Number
export async function updateUserMobileNumber(
  userId: string,
  countryCode: string,
  mobileNumber: string,
  grade?: string,
  whatsappAlerts: boolean = true
): Promise<void> {
  const userRef = doc(db, 'users', userId);
  const cleanMobile = mobileNumber.trim();
  const cleanCode = countryCode.trim();
  const fullPhone = `${cleanCode} ${cleanMobile}`.trim();
  
  const updateData: Partial<UserProfile> = {
    countryCode: cleanCode,
    mobileNumber: cleanMobile,
    phoneNumber: fullPhone,
    whatsappAlerts,
    mobileRegisteredAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (grade) {
    updateData.grade = grade;
  }

  try {
    await updateDoc(userRef, updateData);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
  }
}

// Update Student Joined Social State
export async function updateUserJoinedSocial(
  userId: string,
  joined: boolean = true
): Promise<void> {
  const userRef = doc(db, 'users', userId);
  try {
    await updateDoc(userRef, {
      hasJoinedSocial: joined,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
  }
}

// Sign in with Google Popup
export async function signInWithGoogle(): Promise<User> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    // Check if user document already exists or create new
    const userRef = doc(db, 'users', user.uid);
    try {
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        const initialProfile: UserProfile = {
          userId: user.uid,
          email: user.email || '',
          displayName: user.displayName || 'Math Student',
          photoURL: user.photoURL || '',
          grade: 'Class 9',
          isPro: false,
          bookmarks: ['res-quad-class10'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await setDoc(userRef, initialProfile);
      }
    } catch (dbErr) {
      console.warn('Initial profile sync: ', dbErr);
    }

    return user;
  } catch (error) {
    console.error('Google Sign-In Error:', error);
    throw error;
  }
}

// Sign Out
export async function logOut(): Promise<void> {
  await fbSignOut(auth);
}

// Listen to user profile
export function subscribeToUserProfile(
  userId: string,
  onProfile: (profile: UserProfile | null) => void
) {
  const userRef = doc(db, 'users', userId);
  return onSnapshot(
    userRef,
    (docSnap) => {
      if (docSnap.exists()) {
        onProfile(docSnap.data() as UserProfile);
      } else {
        onProfile(null);
      }
    },
    (err) => {
      console.warn('Profile subscription warning: ', err.message);
    }
  );
}

// Save Razorpay Order to Firestore
export async function saveRazorpayOrder(orderData: {
  orderId: string;
  userId: string;
  plan: string;
  amount: number;
  currency: string;
  paymentId: string;
  status: string;
}) {
  const orderRef = doc(db, 'orders', orderData.orderId);
  try {
    await setDoc(orderRef, {
      ...orderData,
      createdAt: new Date().toISOString(),
    });

    // Also upgrade the user's Pro status in their profile
    const userRef = doc(db, 'users', orderData.userId);
    await updateDoc(userRef, {
      isPro: true,
      proPlan: orderData.plan,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `orders/${orderData.orderId}`);
  }
}

// Admin Support & Credentials
export const ADMIN_EMAILS = ['sachin.itig@gmail.com'];
export const MASTER_ADMIN_PASSCODE = 'MATHS2025';

export function isUserAdmin(user: User | null): boolean {
  if (!user || !user.email) return false;
  return ADMIN_EMAILS.includes(user.email.toLowerCase().trim());
}

export interface OrderRecord {
  orderId: string;
  userId: string;
  userEmail?: string;
  plan: string;
  amount: number;
  currency: string;
  paymentId: string;
  status: string;
  createdAt: string;
}

// Fetch user's personal captured orders from Firestore
export async function fetchUserOrders(userId: string): Promise<OrderRecord[]> {
  try {
    const ordersRef = collection(db, 'orders');
    const snap = await getDocs(ordersRef);
    const all = snap.docs.map((d) => d.data() as OrderRecord);
    const userOrders = all.filter((o) => o.userId === userId);
    return userOrders.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  } catch (err) {
    console.warn('Could not fetch user orders:', err);
    return [];
  }
}

// Fetch all captured orders from Firestore
export async function fetchAllOrders(): Promise<OrderRecord[]> {
  try {
    const ordersRef = collection(db, 'orders');
    const q = query(ordersRef, orderBy('createdAt', 'desc'), limit(50));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as OrderRecord);
  } catch (err) {
    console.warn('Could not fetch all orders (may be permissions or initial empty state):', err);
    return [];
  }
}

// Fetch all registered students
export async function fetchAllUsers(): Promise<UserProfile[]> {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, limit(50));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as UserProfile);
  } catch (err) {
    console.warn('Could not fetch users list:', err);
    return [];
  }
}

// Save Gateway Config to Firestore Settings
export async function saveGatewaySettingsToFirestore(settingsData: any): Promise<void> {
  const settingsRef = doc(db, 'settings', 'paymentGateway');
  try {
    await setDoc(settingsRef, {
      ...settingsData,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'settings/paymentGateway');
  }
}

// Load Gateway Config from Firestore Settings
export async function loadGatewaySettingsFromFirestore(): Promise<any | null> {
  try {
    const settingsRef = doc(db, 'settings', 'paymentGateway');
    const snap = await getDoc(settingsRef);
    if (snap.exists()) {
      return snap.data();
    }
  } catch (error) {
    console.warn('Could not load gateway settings from Firestore:', error);
  }
  return null;
}

// Save Branding & Assets Config to Firestore Settings
export async function saveBrandingSettingsToFirestore(brandingData: any): Promise<void> {
  const settingsRef = doc(db, 'settings', 'branding');
  try {
    await setDoc(settingsRef, {
      ...brandingData,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'settings/branding');
  }
}

// Load Branding & Assets Config from Firestore Settings
export async function loadBrandingSettingsFromFirestore(): Promise<any | null> {
  try {
    const settingsRef = doc(db, 'settings', 'branding');
    const snap = await getDoc(settingsRef);
    if (snap.exists()) {
      return snap.data();
    }
  } catch (error) {
    console.warn('Could not load branding settings from Firestore:', error);
  }
  return null;
}

// Admin manual Pro subscription grant
export async function grantProStatusManually(userId: string, plan: string = 'Admin All-Access Pass'): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      isPro: true,
      proPlan: plan,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
  }
}

// Admin toggle user Pro status
export async function toggleUserProStatus(userId: string, isPro: boolean, plan: string = 'Class 10 Board Prep'): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      isPro,
      proPlan: isPro ? plan : null,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
  }
}

// Delete student account by Admin
export async function deleteStudentAccount(userId: string): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId);
    await deleteDoc(userRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `users/${userId}`);
  }
}

// Coupon / Offers Data & Methods
export interface CouponRecord {
  id: string;
  code: string;
  discountType: 'percent' | 'flat';
  discountValue: number;
  maxUses: number;
  usedCount: number;
  expiresAt: string;
  isActive: boolean;
  createdAt: string;
}

export async function fetchCoupons(): Promise<CouponRecord[]> {
  try {
    const colRef = collection(db, 'coupons');
    const q = query(colRef, orderBy('createdAt', 'desc'), limit(50));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ ...d.data(), id: d.id } as CouponRecord));
  } catch (e) {
    console.warn('Could not fetch coupons:', e);
    return [];
  }
}

export async function saveCouponToFirestore(coupon: CouponRecord): Promise<void> {
  const docRef = doc(db, 'coupons', coupon.id);
  await setDoc(docRef, coupon, { merge: true });
}

export async function deleteCouponFromFirestore(couponId: string): Promise<void> {
  const docRef = doc(db, 'coupons', couponId);
  await deleteDoc(docRef);
}

// Notification & Broadcast Announcements
export interface NotificationRecord {
  id: string;
  title: string;
  message: string;
  targetAudience: 'all' | 'free' | 'pro' | 'class9' | 'class10';
  actionUrl?: string;
  createdAt: string;
  createdBy: string;
  tag?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  targetGrade?: string;
}

export async function fetchNotifications(): Promise<NotificationRecord[]> {
  try {
    const colRef = collection(db, 'notifications');
    const q = query(colRef, orderBy('createdAt', 'desc'), limit(50));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ ...d.data(), id: d.id } as NotificationRecord));
  } catch (e) {
    console.warn('Could not fetch notifications:', e);
    return [];
  }
}

export async function sendNotificationToFirestore(notification: NotificationRecord): Promise<void> {
  const docRef = doc(db, 'notifications', notification.id);
  await setDoc(docRef, notification, { merge: true });
}

export async function deleteNotificationFromFirestore(notificationId: string): Promise<void> {
  const docRef = doc(db, 'notifications', notificationId);
  await deleteDoc(docRef);
}

// Custom Resources / Content Uploading
export interface CustomResourceRecord {
  id: string;
  title: string;
  grade: string;
  topic: string;
  format: string;
  tier: 'free' | 'pro';
  downloadUrl?: string;
  youtubeId?: string;
  description?: string;
  views: number;
  downloads: number;
  createdAt: string;
}

export async function fetchCustomResources(): Promise<CustomResourceRecord[]> {
  try {
    const colRef = collection(db, 'custom_resources');
    const q = query(colRef, orderBy('createdAt', 'desc'), limit(100));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ ...d.data(), id: d.id } as CustomResourceRecord));
  } catch (e) {
    console.warn('Could not fetch custom resources:', e);
    return [];
  }
}

export async function saveCustomResourceToFirestore(res: CustomResourceRecord): Promise<void> {
  const docRef = doc(db, 'custom_resources', res.id);
  await setDoc(docRef, res, { merge: true });
}

export async function deleteCustomResourceFromFirestore(resId: string): Promise<void> {
  const docRef = doc(db, 'custom_resources', resId);
  await deleteDoc(docRef);
}

// SEO Settings
export interface SeoSettings {
  metaTitle: string;
  metaDescription: string;
  keywords: string;
  ogTitle: string;
  ogDescription: string;
  ogImageUrl: string;
  canonicalUrl: string;
  enableRobotsIndex: boolean;
  structuredDataType: string;
  updatedAt?: string;
}

export const DEFAULT_SEO_SETTINGS: SeoSettings = {
  metaTitle: 'Maths at Your Fingertips - Class 5 - 10 Learning Hub',
  metaDescription: 'Demystifying school mathematics for Class 5 to Class 10 with handcrafted notes, 2-minute formula sheets, NCERT walkthroughs, and animated video lessons.',
  keywords: 'maths notes, class 10 cbse maths, class 9 ncert solutions, formula sheet, pocket formula deck, board exam preparation',
  ogTitle: 'Maths at Your Fingertips - Class 5 - 10 Learning Hub',
  ogDescription: 'Demystifying school mathematics for Class 5 to Class 10 with handcrafted notes, 2-minute formula sheets, NCERT walkthroughs, and animated video lessons.',
  ogImageUrl: 'https://lh3.googleusercontent.com/aida/AEtjO1UjgWp59CcYsKXuqwB2FYHcehNEDlMGhbND9VEHl154aFff2EPvt39mUwZ6qXVc-edHZxj5IPmP7JbzGPqzLaCgdQX4S4GUMQBtC4KxFgHHUCu_55VykewYAvz0ReMRXT-l8SNrEHvxLcCxtTX0zVGZ6bSEQvSxd3WcuoKgXa3gTPPWl-czWwPLaYldf3jK6W4CDevlmvi08ew8Ag-k6FiBm7lx3ROJP5G9hsY15VySSpP-r5sf3fqLFLs',
  canonicalUrl: 'https://mathsatyourfingertips.com',
  enableRobotsIndex: true,
  structuredDataType: 'EducationalOrganization',
};

export async function saveSeoSettingsToFirestore(seoData: SeoSettings): Promise<void> {
  const docRef = doc(db, 'settings', 'seo');
  await setDoc(docRef, { ...seoData, updatedAt: new Date().toISOString() }, { merge: true });
}

export async function loadSeoSettingsFromFirestore(): Promise<SeoSettings | null> {
  try {
    const docRef = doc(db, 'settings', 'seo');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as SeoSettings;
    }
  } catch (e) {
    console.warn('Could not load SEO settings from Firestore:', e);
  }
  return null;
}

// Categories Management
export async function saveCategorySettingsToFirestore(categoriesData: any): Promise<void> {
  const docRef = doc(db, 'settings', 'categories');
  try {
    await setDoc(docRef, {
      items: categoriesData,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'settings/categories');
  }
}

export async function loadCategorySettingsFromFirestore(): Promise<any[] | null> {
  try {
    const docRef = doc(db, 'settings', 'categories');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      return data.items || null;
    }
  } catch (e) {
    console.warn('Could not load category settings from Firestore:', e);
  }
  return null;
}

// Theme & Layout Management
export async function saveThemeSettingsToFirestore(themeData: any): Promise<void> {
  const docRef = doc(db, 'settings', 'theme');
  try {
    await setDoc(docRef, {
      ...themeData,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'settings/theme');
  }
}

export async function loadThemeSettingsFromFirestore(): Promise<any | null> {
  try {
    const docRef = doc(db, 'settings', 'theme');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data();
    }
  } catch (e) {
    console.warn('Could not load theme settings from Firestore:', e);
  }
  return null;
}

// Social Media URLs & Deep-Linking Settings
export async function saveSocialSettingsToFirestore(socialData: any): Promise<void> {
  const docRef = doc(db, 'settings', 'social');
  try {
    await setDoc(docRef, {
      ...socialData,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'settings/social');
  }
}

export async function loadSocialSettingsFromFirestore(): Promise<any | null> {
  try {
    const docRef = doc(db, 'settings', 'social');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data();
    }
  } catch (e) {
    console.warn('Could not load social settings from Firestore:', e);
  }
  return null;
}



