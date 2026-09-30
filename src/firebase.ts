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
  arrayUnion,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// CRITICAL: Database initialized with firestoreDatabaseId (or default)
export const db =
  firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
    ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
    : getFirestore(app);
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
  role?: 'admin' | 'superadmin' | 'faculty' | 'student';
  isPro: boolean;
  proPlan?: string;
  bookmarks?: string[];
  downloads?: StudentDownloadItem[];
  preferredCurrency?: string;
  createdAt: string;
  updatedAt?: string;
}

// Student Download Interfaces
export interface StudentDownloadItem {
  id: string;
  resourceId?: string;
  title: string;
  grade?: string;
  topic?: string;
  format?: string;
  tier?: 'free' | 'pro';
  size: string;
  downloadUrl?: string;
  downloadedAt: string;
}

export interface StudentDownloadRecord extends StudentDownloadItem {
  userId: string;
  userEmail: string;
  userName: string;
  userPhoto?: string;
  ip?: string;
  device?: string;
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

    // Clear any temporary local dev session when real Google Sign-In succeeds
    clearDemoSession();

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
  } catch (error: any) {
    if (error?.code === 'auth/unauthorized-domain') {
      const currentHost = typeof window !== 'undefined' ? window.location.hostname : '';
      const consoleLink = `https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/settings`;
      error.unauthorizedDomain = currentHost;
      error.consoleLink = consoleLink;
      console.warn(
        `[Firebase Auth Warning] Domain "${currentHost}" is not in the Firebase Authorized Domains list for project "${firebaseConfig.projectId}".\n` +
        `To authorize, visit: ${consoleLink} and add "${currentHost}" under Authorized Domains.`
      );
    } else if (error?.code !== 'auth/popup-closed-by-user' && error?.code !== 'auth/cancelled-popup-request') {
      console.error('Google Sign-In Error:', error);
    }
    throw error;
  }
}

// Demo / Development Student Session Helpers (for preview environments before domain authorization)
export function createDemoStudentSession(
  customEmail?: string,
  customName?: string,
  grade: string = 'Class 10'
): any {
  const email = customEmail || 'sachinagrawal16@gmail.com';
  const isOwner = email.toLowerCase().includes('sachin') || email.toLowerCase().includes('admin');
  const displayName = customName || (isOwner ? 'Sachin Agrawal (Admin)' : 'Math Student');
  const uid = `demo_${btoa(email).replace(/=/g, '').toLowerCase()}`;

  const mockUser: any = {
    uid,
    email,
    displayName,
    photoURL: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(displayName)}`,
    emailVerified: true,
    isAnonymous: false,
  };

  try {
    localStorage.setItem('maths_dev_session', JSON.stringify(mockUser));
  } catch (e) {
    // ignore
  }

  // Also persist user document in Firestore so queries and records work seamlessly
  const userRef = doc(db, 'users', uid);
  getDoc(userRef)
    .then((snap) => {
      if (!snap.exists()) {
        const profile: UserProfile = {
          userId: uid,
          email,
          displayName,
          photoURL: mockUser.photoURL,
          grade,
          isPro: true,
          bookmarks: ['res-quad-class10'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setDoc(userRef, profile).catch((e) => console.warn('Demo profile Firestore sync:', e));
      }
    })
    .catch(() => {});

  return mockUser;
}

export function getLocalDemoSession(): any | null {
  try {
    const raw = localStorage.getItem('maths_dev_session');
    if (raw) return JSON.parse(raw);
  } catch {
    return null;
  }
  return null;
}

export function clearDemoSession(): void {
  try {
    localStorage.removeItem('maths_dev_session');
  } catch {
    // ignore
  }
}

// Sign Out
export async function logOut(): Promise<void> {
  clearDemoSession();
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
export { firebaseConfig };

export interface AdminUserRecord {
  email: string;
  role: 'superadmin' | 'admin' | 'faculty';
  assignedBy: string;
  assignedAt: string;
  displayName?: string;
  notes?: string;
}

export const PRIMARY_SUPERADMIN_EMAIL = 'sachinagrawal16@gmail.com';

export const INITIAL_ADMIN_EMAILS = [
  'sachinagrawal16@gmail.com',
  'sachin.itig@gmail.com',
  '2026vivekkushwah@gmail.com',
  'vivekkushwah@gmail.com',
  'admin@mathsatyourfingertips.com',
  'ntnagrawal146@gmail.com',
];

export const ADMIN_EMAILS = INITIAL_ADMIN_EMAILS;
export const MASTER_ADMIN_PASSCODE = 'MATHS2025';

const ADMINS_LOCAL_KEY = 'maths_portal_assigned_admin_roles_v2';

export function getCachedAssignedAdmins(): AdminUserRecord[] {
  try {
    const raw = localStorage.getItem(ADMINS_LOCAL_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    // ignore
  }

  // Return default bootstrap admins
  return [
    {
      email: PRIMARY_SUPERADMIN_EMAIL,
      role: 'superadmin',
      assignedBy: 'System Bootstrap',
      assignedAt: '2025-01-01T00:00:00.000Z',
      displayName: 'Primary System Administrator',
      notes: 'Superadministrator with full permanent privileges',
    },
    ...INITIAL_ADMIN_EMAILS.filter((e) => e !== PRIMARY_SUPERADMIN_EMAIL).map((email) => ({
      email,
      role: 'admin' as const,
      assignedBy: 'System Provisioning',
      assignedAt: '2025-01-01T00:00:00.000Z',
      displayName: email.split('@')[0],
      notes: 'Verified Educator / Faculty Admin',
    })),
  ];
}

export function saveCachedAssignedAdmins(admins: AdminUserRecord[]): void {
  try {
    localStorage.setItem(ADMINS_LOCAL_KEY, JSON.stringify(admins));
    window.dispatchEvent(new CustomEvent('admins-updated', { detail: admins }));
  } catch (e) {
    // ignore
  }
}

export async function loadAssignedAdminsFromFirestore(): Promise<AdminUserRecord[]> {
  try {
    const docRef = doc(db, 'settings', 'admins');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      if (Array.isArray(data.items) && data.items.length > 0) {
        saveCachedAssignedAdmins(data.items);
        return data.items;
      }
    }
  } catch (e) {
    console.warn('Could not load assigned admins from Firestore:', e);
  }
  return getCachedAssignedAdmins();
}

export async function saveAssignedAdminsToFirestore(admins: AdminUserRecord[]): Promise<void> {
  saveCachedAssignedAdmins(admins);
  try {
    const docRef = doc(db, 'settings', 'admins');
    await setDoc(
      docRef,
      {
        items: admins,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'settings/admins');
  }
}

export function isUserAdmin(user: User | null, profile?: UserProfile | null): boolean {
  if (!user || !user.email) return false;
  const cleanEmail = user.email.toLowerCase().trim();
  if (cleanEmail === PRIMARY_SUPERADMIN_EMAIL.toLowerCase().trim()) return true;

  if (profile && (profile.role === 'admin' || profile.role === 'superadmin')) {
    return true;
  }

  const currentAdmins = getCachedAssignedAdmins();
  return currentAdmins.some((a) => a.email.toLowerCase().trim() === cleanEmail);
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
    if (userOrders.length > 0) {
      return userOrders.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    }
  } catch (err) {
    console.warn('Could not fetch user orders from Firestore, reading local fallback:', err);
  }

  // Local fallback
  try {
    const localRaw = localStorage.getItem('maths_portal_local_orders');
    if (localRaw) {
      const parsed = JSON.parse(localRaw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.filter((o: any) => o.userId === userId || !o.userId);
      }
    }
  } catch {
    // ignore
  }

  return [];
}

// Fetch all captured orders from Firestore
export async function fetchAllOrders(): Promise<OrderRecord[]> {
  let cloudOrders: OrderRecord[] = [];
  try {
    const ordersRef = collection(db, 'orders');
    const q = query(ordersRef, orderBy('createdAt', 'desc'), limit(50));
    const snap = await getDocs(q);
    cloudOrders = snap.docs.map((d) => d.data() as OrderRecord);
  } catch (err) {
    console.warn('Could not fetch all orders from cloud (may be permissions or initial empty state):', err);
  }

  // Merge any local orders not yet reflected in cloud
  try {
    const localRaw = localStorage.getItem('maths_portal_local_orders');
    if (localRaw) {
      const parsed: OrderRecord[] = JSON.parse(localRaw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const cloudIds = new Set(cloudOrders.map((o) => o.orderId));
        const missingLocal = parsed.filter((o) => !cloudIds.has(o.orderId));
        return [...cloudOrders, ...missingLocal].sort((a, b) =>
          (b.createdAt || '').localeCompare(a.createdAt || '')
        );
      }
    }
  } catch {
    // ignore
  }

  return cloudOrders;
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

// Save Custom Page Content & Blocks Text Config to Firestore Settings
export async function savePageTextSettingsToFirestore(pageTextData: any): Promise<void> {
  const settingsRef = doc(db, 'settings', 'pageContent');
  try {
    await setDoc(settingsRef, {
      ...pageTextData,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'settings/pageContent');
  }
}

// Load Custom Page Content & Blocks Text Config from Firestore Settings
export async function loadPageTextSettingsFromFirestore(): Promise<any | null> {
  try {
    const settingsRef = doc(db, 'settings', 'pageContent');
    const snap = await getDoc(settingsRef);
    if (snap.exists()) {
      return snap.data();
    }
  } catch (error) {
    console.warn('Could not load page text settings from Firestore:', error);
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
  imageUrl?: string;
  thumbnailUrl?: string;
  fileType?: 'file' | 'image' | 'video';
  fileName?: string;
  fileSize?: string;
  youtubeId?: string;
  facebookVideoUrl?: string;
  videoUrl?: string;
  videoPlatform?: 'youtube' | 'facebook' | 'direct';
  embedHtml?: string;
  description?: string;
  views: number;
  downloads: number;
  createdAt: string;
  updatedAt?: string;
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

// AI Teacher Query Log Records
export interface AiQueryRecord {
  id: string;
  userId: string;
  userEmail: string;
  userName?: string;
  grade: string;
  topic?: string;
  queryText: string;
  hasImage: boolean;
  imagePreview?: string;
  solution: string;
  modelUsed?: string;
  createdAt: string;
}

export async function saveAiQueryRecord(record: AiQueryRecord): Promise<void> {
  // Always save to localStorage backup for immediate availability
  try {
    const existingRaw = localStorage.getItem('maths_hub_ai_queries') || localStorage.getItem('mayf_ai_queries');
    const existing: AiQueryRecord[] = existingRaw ? JSON.parse(existingRaw) : [];
    const updated = [record, ...existing.filter((q) => q.id !== record.id)].slice(0, 100);
    localStorage.setItem('maths_hub_ai_queries', JSON.stringify(updated));
  } catch (e) {
    console.warn('LocalStorage save error for AI query:', e);
  }

  // Save to Firestore
  try {
    const docRef = doc(db, 'ai_queries', record.id);
    await setDoc(docRef, {
      ...record,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('Firestore save error for ai_queries (fallback stored locally):', err);
  }
}

export async function fetchStudentAiQueries(userId: string): Promise<AiQueryRecord[]> {
  try {
    const qCol = collection(db, 'ai_queries');
    const qSnap = await getDocs(qCol);
    const results: AiQueryRecord[] = [];
    qSnap.forEach((d) => {
      const data = d.data() as AiQueryRecord;
      if (data.userId === userId) {
        results.push({ ...data, id: d.id });
      }
    });
    if (results.length > 0) {
      results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return results;
    }
  } catch (err) {
    console.warn('Error fetching student AI queries from Firestore, reading local cache:', err);
  }

  try {
    const local = localStorage.getItem('maths_hub_ai_queries') || localStorage.getItem('mayf_ai_queries');
    if (local) {
      const parsed: AiQueryRecord[] = JSON.parse(local);
      return parsed.filter((q) => q.userId === userId);
    }
  } catch (e) {
    // ignore
  }

  return [];
}

export async function fetchAllAiQueries(): Promise<AiQueryRecord[]> {
  try {
    const qCol = collection(db, 'ai_queries');
    const qSnap = await getDocs(qCol);
    const results: AiQueryRecord[] = [];
    qSnap.forEach((d) => {
      results.push({ ...(d.data() as AiQueryRecord), id: d.id });
    });
    if (results.length > 0) {
      results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return results;
    }
  } catch (err) {
    console.warn('Error fetching all AI queries from Firestore, using local cache:', err);
  }

  try {
    const local = localStorage.getItem('maths_hub_ai_queries') || localStorage.getItem('mayf_ai_queries');
    if (local) {
      return JSON.parse(local);
    }
  } catch (e) {
    // ignore
  }

  return [];
}

export async function deleteAiQueryRecord(queryId: string): Promise<void> {
  try {
    const docRef = doc(db, 'ai_queries', queryId);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn('Error deleting AI query from Firestore:', err);
  }

  try {
    const local = localStorage.getItem('maths_hub_ai_queries') || localStorage.getItem('mayf_ai_queries');
    if (local) {
      const parsed: AiQueryRecord[] = JSON.parse(local);
      const filtered = parsed.filter((q) => q.id !== queryId);
      localStorage.setItem('maths_hub_ai_queries', JSON.stringify(filtered));
    }
  } catch (e) {
    // ignore
  }
}

// Full Migration / Synchronization from Previous Database
import previousDatabaseExport from './data/previousDatabaseExport.json';

export async function migrateAndRestoreLegacyDatabaseData(): Promise<{ success: boolean; message: string; details: any }> {
  try {
    const results: any = {};

    // 1. Sync Page Content & Custom Texts
    if (previousDatabaseExport.settings?.pageContent) {
      const pageTextRef = doc(db, 'settings', 'pageContent');
      await setDoc(pageTextRef, {
        ...previousDatabaseExport.settings.pageContent,
        migratedAt: new Date().toISOString(),
      }, { merge: true });
      try {
        localStorage.setItem('maths_hub_page_text_v1', JSON.stringify(previousDatabaseExport.settings.pageContent));
        window.dispatchEvent(new CustomEvent('page-text-changed', { detail: previousDatabaseExport.settings.pageContent }));
      } catch (e) {}
      results.pageContent = 'Synchronized';
    }

    // 2. Sync Branding & Assets (Logo, Icons, Badges)
    if (previousDatabaseExport.settings?.branding) {
      const brandingRef = doc(db, 'settings', 'branding');
      await setDoc(brandingRef, {
        ...previousDatabaseExport.settings.branding,
        migratedAt: new Date().toISOString(),
      }, { merge: true });
      try {
        localStorage.setItem('maths_hub_branding_config', JSON.stringify(previousDatabaseExport.settings.branding));
        window.dispatchEvent(new CustomEvent('branding-changed', { detail: previousDatabaseExport.settings.branding }));
      } catch (e) {}
      results.branding = 'Synchronized';
    }

    // 3. Sync Theme & Design Layout
    if (previousDatabaseExport.settings?.theme) {
      const themeRef = doc(db, 'settings', 'theme');
      await setDoc(themeRef, {
        ...previousDatabaseExport.settings.theme,
        migratedAt: new Date().toISOString(),
      }, { merge: true });
      try {
        localStorage.setItem('maths_hub_theme_config', JSON.stringify(previousDatabaseExport.settings.theme));
        window.dispatchEvent(new CustomEvent('theme-changed', { detail: previousDatabaseExport.settings.theme }));
      } catch (e) {}
      results.theme = 'Synchronized';
    }

    // 4. Sync Payment Gateway Config
    if (previousDatabaseExport.settings?.paymentGateway) {
      const gwRef = doc(db, 'settings', 'paymentGateway');
      await setDoc(gwRef, {
        ...previousDatabaseExport.settings.paymentGateway,
        migratedAt: new Date().toISOString(),
      }, { merge: true });
      try {
        localStorage.setItem('maths_hub_gateway_config', JSON.stringify(previousDatabaseExport.settings.paymentGateway));
      } catch (e) {}
      results.paymentGateway = 'Synchronized';
    }

    // 5. Sync Notifications
    if (Array.isArray(previousDatabaseExport.notifications) && previousDatabaseExport.notifications.length > 0) {
      for (const notif of previousDatabaseExport.notifications) {
        const notifRef = doc(db, 'notifications', notif.id);
        await setDoc(notifRef, notif, { merge: true });
      }
      try {
        localStorage.setItem('maths_portal_notifications', JSON.stringify(previousDatabaseExport.notifications));
        window.dispatchEvent(new CustomEvent('notifications-changed', { detail: previousDatabaseExport.notifications }));
      } catch (e) {}
      results.notifications = `${previousDatabaseExport.notifications.length} notifications migrated`;
    }

    return {
      success: true,
      message: 'All custom text, branding, theme, and gateway settings from the previous database have been successfully imported and saved into your new Firestore database!',
      details: results,
    };
  } catch (err: any) {
    console.error('Migration error:', err);
    return {
      success: false,
      message: err?.message || 'Failed to migrate data to Firestore database',
      details: null,
    };
  }
}

// -------------------------------------------------------------
// STUDENT DOWNLOADS ACTIVITY & PROFILE HISTORY TRACKING
// -------------------------------------------------------------

const LOCAL_ADMIN_DOWNLOADS_KEY = 'maths_hub_admin_download_records_v1';

export const INITIAL_SAMPLE_DOWNLOADS: StudentDownloadRecord[] = [
  {
    id: 'dl-sample-1',
    userId: 'usr_aarav_sharma',
    userEmail: 'aarav.sharma24@gmail.com',
    userName: 'Aarav Sharma',
    userPhoto: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=160&auto=format&fit=crop&q=80',
    resourceId: 'res-quad-class10',
    title: 'Class 10: Quadratic Equations 2-Min Concept & Derivation Sheet',
    grade: 'Class 10',
    topic: 'Quadratic Equations',
    format: 'Formula Sheets (1-Pager)',
    tier: 'free',
    size: '2.4 MB',
    downloadedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    device: 'Chrome on MacOS',
  },
  {
    id: 'dl-sample-2',
    userId: 'usr_diya_patel',
    userEmail: 'diya.patel99@gmail.com',
    userName: 'Diya Patel',
    userPhoto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=160&auto=format&fit=crop&q=80',
    resourceId: 'res-poly-class9',
    title: 'Class 9: Polynomial Identities & Remainder Theorem Notes',
    grade: 'Class 9',
    topic: 'Real Numbers & Polynomials',
    format: 'Handcrafted Notes (PDF)',
    tier: 'free',
    size: '3.1 MB',
    downloadedAt: new Date(Date.now() - 48 * 60 * 1000).toISOString(),
    device: 'Mobile Safari on iOS',
  },
  {
    id: 'dl-sample-3',
    userId: 'usr_ananya_iyer',
    userEmail: 'ananya.iyer.school@gmail.com',
    userName: 'Ananya Iyer',
    userPhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80',
    resourceId: 'res-trig-class10',
    title: 'Class 10: Trigonometric Ratios & Angle Table Rapid Sheet',
    grade: 'Class 10',
    topic: 'Trigonometry',
    format: 'Formula Sheets (1-Pager)',
    tier: 'free',
    size: '1.9 MB',
    downloadedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    device: 'Chrome on Windows 11',
  },
  {
    id: 'dl-sample-4',
    userId: 'usr_rohan_verma',
    userEmail: 'rohan.v.maths@gmail.com',
    userName: 'Rohan Verma',
    userPhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&auto=format&fit=crop&q=80',
    resourceId: 'res-triangles-pro',
    title: 'Class 10: Triangles BPT & Similarity Theorem Proofs Masterclass',
    grade: 'Class 10',
    topic: 'Triangles & Circles',
    format: 'Handcrafted Notes (PDF)',
    tier: 'pro',
    size: '4.8 MB',
    downloadedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    device: 'Chrome on Android Phone',
  },
  {
    id: 'dl-sample-5',
    userId: 'usr_kabir_singh',
    userEmail: 'kabir.singh.cbse@gmail.com',
    userName: 'Kabir Singh',
    userPhoto: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=160&auto=format&fit=crop&q=80',
    resourceId: 'res-mensuration-class8',
    title: 'Class 8: Surface Area & Volume 3D Models Summary',
    grade: 'Class 8',
    topic: 'Surface Areas & Volumes',
    format: 'Formula Sheets (1-Pager)',
    tier: 'free',
    size: '2.2 MB',
    downloadedAt: new Date(Date.now() - 9 * 60 * 60 * 1000).toISOString(),
    device: 'Firefox on Linux',
  },
];

/**
 * Record a student download event in Firestore & Local storage
 */
export async function recordStudentDownload(record: StudentDownloadRecord): Promise<void> {
  // 1. Update Student's Local Storage History
  try {
    const userStorageKey = `maths_hub_student_downloads_${record.userId}`;
    const rawExisting = localStorage.getItem(userStorageKey);
    let userDownloads: StudentDownloadItem[] = rawExisting ? JSON.parse(rawExisting) : [];
    // Prepend new item, remove duplicates of same resource if downloaded today
    const downloadItem: StudentDownloadItem = {
      id: record.id,
      resourceId: record.resourceId,
      title: record.title,
      grade: record.grade,
      topic: record.topic,
      format: record.format,
      tier: record.tier,
      size: record.size,
      downloadUrl: record.downloadUrl,
      downloadedAt: record.downloadedAt,
    };
    userDownloads = [downloadItem, ...userDownloads.filter((d) => d.title !== record.title)];
    localStorage.setItem(userStorageKey, JSON.stringify(userDownloads));
  } catch (err) {
    console.warn('Local student download save warning:', err);
  }

  // 2. Update Admin Global Download Records in Local Storage
  try {
    const rawAdmin = localStorage.getItem(LOCAL_ADMIN_DOWNLOADS_KEY);
    let adminRecords: StudentDownloadRecord[] = rawAdmin ? JSON.parse(rawAdmin) : INITIAL_SAMPLE_DOWNLOADS;
    adminRecords = [record, ...adminRecords.filter((r) => r.id !== record.id)];
    localStorage.setItem(LOCAL_ADMIN_DOWNLOADS_KEY, JSON.stringify(adminRecords));
  } catch (err) {
    console.warn('Admin local storage warning:', err);
  }

  // 3. Write to Firestore `student_downloads` collection
  try {
    const dlDocRef = doc(db, 'student_downloads', record.id);
    await setDoc(dlDocRef, record);
  } catch (firestoreErr) {
    // If student_downloads collection write is restricted or offline, write to analytics collection
    try {
      const analyticsRef = doc(db, 'analytics', `dl_${record.id}`);
      await setDoc(analyticsRef, record);
    } catch (fallbackErr) {
      console.warn('Firestore download record sync fallback:', fallbackErr);
    }
  }

  // 4. Update Student's profile document `users/{userId}` with this download
  try {
    const userDocRef = doc(db, 'users', record.userId);
    const itemToAppend: StudentDownloadItem = {
      id: record.id,
      resourceId: record.resourceId,
      title: record.title,
      grade: record.grade,
      topic: record.topic,
      format: record.format,
      tier: record.tier,
      size: record.size,
      downloadUrl: record.downloadUrl,
      downloadedAt: record.downloadedAt,
    };
    await setDoc(
      userDocRef,
      {
        downloads: arrayUnion(itemToAppend),
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (profileErr) {
    console.warn('Student profile downloads array update notice:', profileErr);
  }

  // 5. Dispatch Custom Events for Instant UI reactivity across student profile & admin panel
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('student-download-recorded', { detail: record }));
    window.dispatchEvent(new CustomEvent('student-downloads-changed'));
  }
}

/**
 * Fetch all download activity records for the Admin Panel
 */
export async function fetchAllStudentDownloadRecords(): Promise<StudentDownloadRecord[]> {
  const recordsMap = new Map<string, StudentDownloadRecord>();

  // Seed with initial sample records
  INITIAL_SAMPLE_DOWNLOADS.forEach((r) => recordsMap.set(r.id, r));

  // Load from local storage
  try {
    const rawLocal = localStorage.getItem(LOCAL_ADMIN_DOWNLOADS_KEY);
    if (rawLocal) {
      const parsed: StudentDownloadRecord[] = JSON.parse(rawLocal);
      parsed.forEach((r) => recordsMap.set(r.id, r));
    }
  } catch (e) {
    console.warn('Error reading admin downloads from localStorage:', e);
  }

  // Attempt to load from Firestore student_downloads collection
  try {
    const q = query(collection(db, 'student_downloads'), orderBy('downloadedAt', 'desc'), limit(150));
    const snap = await getDocs(q);
    snap.forEach((d) => {
      const data = d.data() as StudentDownloadRecord;
      if (data && data.id) {
        recordsMap.set(data.id, data);
      }
    });
  } catch (fsErr) {
    // Also check analytics collection fallback
    try {
      const snap2 = await getDocs(collection(db, 'analytics'));
      snap2.forEach((d) => {
        if (d.id.startsWith('dl_')) {
          const data = d.data() as StudentDownloadRecord;
          if (data && data.id) {
            recordsMap.set(data.id, data);
          }
        }
      });
    } catch (e2) {
      console.warn('Error reading cloud student downloads:', e2);
    }
  }

  return Array.from(recordsMap.values()).sort(
    (a, b) => new Date(b.downloadedAt).getTime() - new Date(a.downloadedAt).getTime()
  );
}

/**
 * Fetch download history for a specific student profile
 */
export async function fetchStudentProfileDownloads(userId: string): Promise<StudentDownloadItem[]> {
  const itemsMap = new Map<string, StudentDownloadItem>();

  // 1. Read local storage for this user
  try {
    const userStorageKey = `maths_hub_student_downloads_${userId}`;
    const rawLocal = localStorage.getItem(userStorageKey);
    if (rawLocal) {
      const parsed: StudentDownloadItem[] = JSON.parse(rawLocal);
      parsed.forEach((item) => itemsMap.set(item.title, item));
    }
  } catch (e) {
    console.warn('User local downloads read error:', e);
  }

  // 2. Read from Firestore user profile document
  try {
    const userDocRef = doc(db, 'users', userId);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      const data = snap.data();
      if (Array.isArray(data.downloads)) {
        data.downloads.forEach((item: StudentDownloadItem) => {
          itemsMap.set(item.title, item);
        });
      }
    }
  } catch (e) {
    console.warn('User cloud downloads read error:', e);
  }

  return Array.from(itemsMap.values()).sort(
    (a, b) => new Date(b.downloadedAt).getTime() - new Date(a.downloadedAt).getTime()
  );
}




