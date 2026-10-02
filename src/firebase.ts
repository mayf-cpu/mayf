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
      const cleanEmail = (user.email || '').toLowerCase().trim();
      let assignedRole: 'superadmin' | 'admin' | 'faculty' | undefined;

      // Check if user is in hardcoded list
      if (INITIAL_ADMIN_EMAILS.some((e) => e.toLowerCase().trim() === cleanEmail)) {
        assignedRole = cleanEmail === PRIMARY_SUPERADMIN_EMAIL ? 'superadmin' : 'admin';
      }

      // Check cached assigned admins
      const cachedAdmins = getCachedAssignedAdmins();
      const foundInCache = cachedAdmins.find((a) => a.email.toLowerCase().trim() === cleanEmail);
      if (foundInCache) {
        assignedRole = foundInCache.role;
      } else if (cleanEmail) {
        // Query Firestore admins live
        try {
          const adminDoc = await getDoc(doc(db, 'admins', cleanEmail));
          if (adminDoc.exists()) {
            const data = adminDoc.data();
            assignedRole = data.role || 'admin';
            saveCachedAssignedAdmins([
              ...cachedAdmins.filter((a) => a.email.toLowerCase().trim() !== cleanEmail),
              {
                email: cleanEmail,
                role: assignedRole || 'admin',
                displayName: user.displayName || cleanEmail.split('@')[0],
                assignedBy: 'Live Check',
                assignedAt: new Date().toISOString(),
              },
            ]);
          }
        } catch {}
      }

      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        const initialProfile: UserProfile = {
          userId: user.uid,
          email: user.email || '',
          displayName: user.displayName || 'Math Student',
          photoURL: user.photoURL || '',
          grade: 'Class 9',
          isPro: false,
          role: assignedRole,
          bookmarks: ['res-quad-class10'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await setDoc(userRef, initialProfile);
        recordLocalUser(initialProfile);
      } else {
        const existing = snap.data() as UserProfile;
        if (assignedRole && existing.role !== assignedRole) {
          existing.role = assignedRole;
          await updateDoc(userRef, { role: assignedRole, updatedAt: new Date().toISOString() });
        }
        recordLocalUser(existing);
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

  // Only sync to Firestore if authenticated
  if (auth.currentUser) {
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
          setDoc(userRef, profile).catch(() => {});
        }
      })
      .catch(() => {});
  }

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
  // If not signed into Firebase Auth or UID is a demo session, don't trigger unauthenticated Firestore listeners
  if (!auth.currentUser || auth.currentUser.uid !== userId) {
    return () => {};
  }
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
    (_err) => {
      // Graceful fallback without noisy console warnings
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
  const mergedMap = new Map<string, AdminUserRecord>();
  getCachedAssignedAdmins().forEach((a) => mergedMap.set(a.email.toLowerCase().trim(), a));

  // 1. Fetch from server-side persistent endpoint
  try {
    const res = await fetch('/api/admin/roles');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.admins)) {
        data.admins.forEach((item: AdminUserRecord) => {
          if (item?.email) {
            mergedMap.set(item.email.toLowerCase().trim(), item);
          }
        });
      }
    }
  } catch (_apiErr) {
    // Non-blocking fallback
  }

  // 2. Fetch from Firestore settings/admins
  try {
    const docRef = doc(db, 'settings', 'admins');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      if (Array.isArray(data.items) && data.items.length > 0) {
        data.items.forEach((item: AdminUserRecord) => {
          if (item?.email) {
            mergedMap.set(item.email.toLowerCase().trim(), item);
          }
        });
      }
    }
  } catch (_e) {
    // Graceful fallback
  }

  // 3. Fetch from Firestore admins collection
  try {
    const adminsCol = collection(db, 'admins');
    const snap = await getDocs(adminsCol);
    snap.forEach((d) => {
      const data = d.data() as AdminUserRecord;
      if (data?.email) {
        mergedMap.set(data.email.toLowerCase().trim(), {
          email: data.email.toLowerCase().trim(),
          role: data.role || 'admin',
          displayName: data.displayName || data.email.split('@')[0],
          assignedBy: data.assignedBy || 'System',
          assignedAt: data.assignedAt || new Date().toISOString(),
          notes: data.notes || '',
        });
      }
    });
  } catch (_e) {
    // Graceful fallback
  }

  const result = Array.from(mergedMap.values());
  saveCachedAssignedAdmins(result);
  return result;
}

export async function saveAssignedAdminsToFirestore(admins: AdminUserRecord[]): Promise<void> {
  saveCachedAssignedAdmins(admins);
  
  // 1. Persist to server backend API (guarantees cross-device & cross-browser persistence)
  for (const admin of admins) {
    try {
      await fetch('/api/admin/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(admin),
      });
    } catch (_serverErr) {}
  }

  // 2. Write to settings/admins in Firestore
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
    console.warn('saveAssignedAdminsToFirestore settings error:', err);
  }

  // 3. Also write individual documents in admins/{email} so security rules and live checks verify instantaneously
  for (const admin of admins) {
    try {
      const emailDoc = admin.email.toLowerCase().trim();
      const adminDocRef = doc(db, 'admins', emailDoc);
      await setDoc(adminDocRef, {
        email: emailDoc,
        role: admin.role,
        displayName: admin.displayName || emailDoc.split('@')[0],
        assignedBy: admin.assignedBy || 'System',
        assignedAt: admin.assignedAt || new Date().toISOString(),
        notes: admin.notes || '',
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    } catch (_docErr) {
      // non-blocking
    }
  }

  // 4. Update existing users with this email to reflect their new assigned role
  try {
    const localUsers = getLocalUsers();
    let hasLocalUpdates = false;
    for (const admin of admins) {
      const emailDoc = admin.email.toLowerCase().trim();
      localUsers.forEach((u) => {
        if (u.email.toLowerCase().trim() === emailDoc && u.role !== admin.role) {
          u.role = admin.role;
          hasLocalUpdates = true;
          try {
            updateDoc(doc(db, 'users', u.userId), { role: admin.role, updatedAt: new Date().toISOString() }).catch(() => {});
          } catch {}
        }
      });
    }
    if (hasLocalUpdates) {
      saveLocalUsers(localUsers);
    }
  } catch {}
}

export async function deleteAssignedAdminFromFirestore(email: string): Promise<void> {
  const cleanEmail = email.toLowerCase().trim();
  // 1. Delete on server backend
  try {
    await fetch(`/api/admin/roles/${encodeURIComponent(cleanEmail)}`, {
      method: 'DELETE',
    });
  } catch (_e) {}

  // 2. Delete in Firestore
  try {
    await deleteDoc(doc(db, 'admins', cleanEmail));
  } catch (_e) {
    // non-blocking
  }
}

export async function checkIsUserAdminLive(email: string | null | undefined): Promise<boolean> {
  if (!email) return false;
  const cleanEmail = email.toLowerCase().trim();
  if (INITIAL_ADMIN_EMAILS.some((e) => e.toLowerCase().trim() === cleanEmail)) return true;

  const cached = getCachedAssignedAdmins();
  if (cached.some((a) => a.email.toLowerCase().trim() === cleanEmail)) return true;

  // 1. Verify with backend server API (immediate, reliable cross-browser check)
  try {
    const res = await fetch('/api/admin/roles/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.isAdmin) {
        const newAdmin: AdminUserRecord = {
          email: cleanEmail,
          role: data.role || 'admin',
          displayName: data.admin?.displayName || cleanEmail.split('@')[0],
          assignedBy: data.admin?.assignedBy || 'Live Check',
          assignedAt: data.admin?.assignedAt || new Date().toISOString(),
          notes: data.admin?.notes || '',
        };
        saveCachedAssignedAdmins([...cached.filter((c) => c.email.toLowerCase().trim() !== cleanEmail), newAdmin]);
        return true;
      }
    }
  } catch (_serverErr) {}

  // 2. Check Firestore admins/{cleanEmail}
  try {
    const adminDoc = await getDoc(doc(db, 'admins', cleanEmail));
    if (adminDoc.exists()) {
      const data = adminDoc.data();
      const newAdmin: AdminUserRecord = {
        email: cleanEmail,
        role: data.role || 'admin',
        displayName: data.displayName || cleanEmail.split('@')[0],
        assignedBy: data.assignedBy || 'Live Check',
        assignedAt: data.assignedAt || new Date().toISOString(),
        notes: data.notes || '',
      };
      saveCachedAssignedAdmins([...cached.filter((c) => c.email.toLowerCase().trim() !== cleanEmail), newAdmin]);
      return true;
    }
  } catch (_e) {}

  // 3. Check Firestore settings/admins
  try {
    const settingsSnap = await getDoc(doc(db, 'settings', 'admins'));
    if (settingsSnap.exists()) {
      const data = settingsSnap.data();
      if (Array.isArray(data.items)) {
        if (data.items.some((a: any) => a.email && a.email.toLowerCase().trim() === cleanEmail)) {
          saveCachedAssignedAdmins(data.items);
          return true;
        }
      }
    }
  } catch (_e) {}

  return false;
}

export function isUserAdmin(user: User | null, profile?: UserProfile | null): boolean {
  if (!user || !user.email) return false;
  const cleanEmail = user.email.toLowerCase().trim();
  if (INITIAL_ADMIN_EMAILS.some((e) => e.toLowerCase().trim() === cleanEmail)) return true;

  if (profile && (profile.role === 'admin' || profile.role === 'superadmin' || profile.role === 'faculty')) {
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
  } catch (_err) {
    // Fall back to local storage
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
  } catch (_err) {
    // Fallback to local storage if permissions or empty
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

const LOCAL_USERS_KEY = 'maths_hub_local_registered_students_v1';

export function getLocalUsers(): UserProfile[] {
  try {
    const raw = localStorage.getItem(LOCAL_USERS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}

export function saveLocalUsers(users: UserProfile[]): void {
  try {
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
  } catch {}
}

export function recordLocalUser(profile: UserProfile): void {
  try {
    const existing = getLocalUsers();
    const updated = [profile, ...existing.filter((u) => u.userId !== profile.userId && u.email !== profile.email)];
    saveLocalUsers(updated);
  } catch {}
}

// Fetch all registered students
export async function fetchAllUsers(): Promise<UserProfile[]> {
  const uMap = new Map<string, UserProfile>();

  // 1. Fetch from Firestore users collection
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, limit(200));
    const snap = await getDocs(q);
    snap.docs.forEach((d) => {
      const u = d.data() as UserProfile;
      if (u && (u.userId || u.email)) {
        uMap.set(u.userId || u.email, u);
      }
    });
  } catch (_err) {
    // Graceful fallback
  }

  // 2. Merge local storage users
  const localUsers = getLocalUsers();
  localUsers.forEach((u) => {
    if (u && (u.userId || u.email) && !uMap.has(u.userId || u.email)) {
      uMap.set(u.userId || u.email, u);
    }
  });

  // 3. Reconcile students who have completed downloads
  try {
    const dlRecords = await fetchAllStudentDownloadRecords();
    dlRecords.forEach((dl) => {
      const key = dl.userId || dl.userEmail;
      if (key && !uMap.has(key) && !uMap.has(dl.userId) && !uMap.has(dl.userEmail)) {
        const studentProfile: UserProfile = {
          userId: dl.userId,
          email: dl.userEmail || '',
          displayName: dl.userName || 'Student',
          photoURL: dl.userPhoto || '',
          grade: dl.grade || 'Class 9',
          isPro: dl.tier === 'pro',
          bookmarks: [],
          createdAt: dl.downloadedAt || new Date().toISOString(),
          updatedAt: dl.downloadedAt || new Date().toISOString(),
        };
        uMap.set(dl.userId, studentProfile);
      }
    });
  } catch (_dlErr) {}

  const merged = Array.from(uMap.values());
  if (merged.length > 0) {
    saveLocalUsers(merged);
  }
  return merged;
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
  } catch (_error) {
    // Graceful fallback to local config
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
  } catch (_error) {
    // Graceful fallback
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
  } catch (_error) {
    // Graceful fallback
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
  } catch (_e) {
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
  } catch (_e) {
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
  } catch (_e) {
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
  } catch (_e) {
    // Graceful fallback
  }
  return null;
}

// Domain Redirection & Canonical Rules
export interface RedirectRuleSettings {
  enabled: boolean;
  sourceDomain: string; // e.g., 'www.mayf.co.in'
  targetDomain: string; // e.g., 'mayf.co.in'
  statusCode: 301 | 302;
  enforceHttps: boolean;
  preservePathAndQuery: boolean;
  autoClientFallback: boolean;
  updatedAt?: string;
  lastTestedAt?: string;
  lastTestStatus?: 'success' | 'warning' | 'error';
  lastTestMessage?: string;
}

export const DEFAULT_REDIRECT_SETTINGS: RedirectRuleSettings = {
  enabled: true,
  sourceDomain: 'www.mayf.co.in',
  targetDomain: 'mayf.co.in',
  statusCode: 301,
  enforceHttps: true,
  preservePathAndQuery: true,
  autoClientFallback: true,
};

export async function saveRedirectRuleSettingsToFirestore(settings: RedirectRuleSettings): Promise<void> {
  const docRef = doc(db, 'settings', 'redirect_rules');
  await setDoc(docRef, { ...settings, updatedAt: new Date().toISOString() }, { merge: true });
}

export async function loadRedirectRuleSettingsFromFirestore(): Promise<RedirectRuleSettings | null> {
  try {
    const docRef = doc(db, 'settings', 'redirect_rules');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as RedirectRuleSettings;
    }
  } catch (_e) {
    // Graceful fallback
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
  } catch (_e) {
    // Graceful fallback
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
  } catch (_e) {
    // Graceful fallback
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
  } catch (_e) {
    // Graceful fallback
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
  } catch (_e) {
    // Non-blocking local storage fallback
  }

  // Save to Firestore if authenticated
  if (auth.currentUser) {
    try {
      const docRef = doc(db, 'ai_queries', record.id);
      await setDoc(docRef, {
        ...record,
        updatedAt: new Date().toISOString(),
      });
    } catch (_err) {
      // Non-blocking Firestore fallback
    }
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
  } catch (_err) {
    // Graceful fallback to local cache
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
  } catch (_err) {
    // Graceful fallback to local cache
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
  } catch (_err) {
    // Graceful fallback
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

const LOCAL_ADMIN_DOWNLOADS_KEY = 'maths_hub_admin_download_records_v2';

export const INITIAL_SAMPLE_DOWNLOADS: StudentDownloadRecord[] = [];

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
  } catch (_err) {
    // Graceful fallback
  }

  // 2. Update Admin Global Download Records in Local Storage
  try {
    const rawAdmin = localStorage.getItem(LOCAL_ADMIN_DOWNLOADS_KEY);
    let adminRecords: StudentDownloadRecord[] = rawAdmin ? JSON.parse(rawAdmin) : INITIAL_SAMPLE_DOWNLOADS;
    adminRecords = [record, ...adminRecords.filter((r) => r.id !== record.id)];
    localStorage.setItem(LOCAL_ADMIN_DOWNLOADS_KEY, JSON.stringify(adminRecords));
  } catch (_err) {
    // Graceful fallback
  }

  // 3. Write to Firestore `student_downloads` collection
  try {
    const dlDocRef = doc(db, 'student_downloads', record.id);
    await setDoc(dlDocRef, record);
  } catch (_firestoreErr) {
    // If student_downloads collection write is restricted or offline, write to analytics collection
    try {
      const analyticsRef = doc(db, 'analytics', `dl_${record.id}`);
      await setDoc(analyticsRef, record);
    } catch (_fallbackErr) {
      // Graceful fallback
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
  } catch (_profileErr) {
    // Graceful fallback
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

  // Clean out any legacy v1 key with dummy sample records
  try {
    if (typeof localStorage !== 'undefined' && localStorage.getItem('maths_hub_admin_download_records_v1')) {
      localStorage.removeItem('maths_hub_admin_download_records_v1');
    }
  } catch (_e) {}

  // Load from local storage
  try {
    const rawLocal = localStorage.getItem(LOCAL_ADMIN_DOWNLOADS_KEY);
    if (rawLocal) {
      const parsed: StudentDownloadRecord[] = JSON.parse(rawLocal);
      parsed.forEach((r) => recordsMap.set(r.id, r));
    }
  } catch (_e) {
    // Graceful fallback
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
  } catch (_fsErr) {
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
    } catch (_e2) {
      // Graceful fallback
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
  } catch (_e) {
    // Graceful fallback
  }

  // 2. Read from Firestore user profile document if authenticated
  if (auth.currentUser && auth.currentUser.uid === userId) {
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
    } catch (_e) {
      // Graceful fallback
    }
  }

  return Array.from(itemsMap.values()).sort(
    (a, b) => new Date(b.downloadedAt).getTime() - new Date(a.downloadedAt).getTime()
  );
}




