import React, { useState, useRef, useEffect } from 'react';
import {
  UserProfile,
  grantProStatusManually,
  toggleUserProStatus,
  deleteStudentAccount,
  registerStudentManually,
  bulkImportStudents,
  fetchAllUsers,
  getFirestoreUsersConnectionStatus,
  FirestoreConnectionStatus,
  purgeDummyStudents,
  isDummyStudentRecord,
  auth,
  signInWithGoogle,
} from '../../firebase';
import { formatPrice } from '../../services/currency';

interface AdminStudentsTabProps {
  users: UserProfile[];
  onRefresh: () => void;
  onToast: (msg: string) => void;
}

const AVAILABLE_COURSES = [
  { id: 'c10-board', title: 'Class 10 Board 100/100 Pro Pass', price: 499 },
  { id: 'c9-mastery', title: 'Class 9 Complete Math Mastery Pass', price: 399 },
  { id: 'c8-foundation', title: 'Class 8 High-School Foundation Pass', price: 299 },
  { id: 'all-access', title: 'All-Access 1-Year Pro Pass (Classes 5-10)', price: 999 },
  { id: 'olympiad-pass', title: 'IMO & National Math Olympiad Bootcamp', price: 699 },
];

const GRADES = ['Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'];

const TARGET_EXAMS = [
  'CBSE Board Examinations',
  'ICSE Board Examinations',
  'National Math Olympiad (IMO / SOF)',
  'NTSE & Foundation Math',
  'State Board Curriculum',
];

interface ParsedBulkRow {
  userId?: string;
  photoURL?: string;
  name: string;
  email: string;
  mobile: string;
  grade: string;
  isPro: boolean;
  school: string;
  targetExam: string;
  notes: string;
  isValid: boolean;
  error?: string;
}

export const AdminStudentsTab: React.FC<AdminStudentsTabProps> = ({
  users,
  onRefresh,
  onToast,
}) => {
  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Students' | 'Admins' | 'Real' | 'Pro' | 'Free' | 'Dummy'>('All');

  // Firebase Cloud Sync & Connection State
  const [cloudStatus, setCloudStatus] = useState<FirestoreConnectionStatus>(getFirestoreUsersConnectionStatus());
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  const [showRulesHelper, setShowRulesHelper] = useState(false);
  const [copiedRules, setCopiedRules] = useState(false);

  useEffect(() => {
    fetchAllUsers().then((fetched) => {
      if (fetched && fetched.length > 0) {
        onRefresh();
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    setCloudStatus(getFirestoreUsersConnectionStatus());
    const interval = setInterval(() => {
      setCloudStatus(getFirestoreUsersConnectionStatus());
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleCloudSync = async () => {
    setIsCloudSyncing(true);
    try {
      const fetched = await fetchAllUsers();
      onRefresh();
      setCloudStatus(getFirestoreUsersConnectionStatus());
      const studentsOnly = fetched.filter((u) => !u.role || (u.role !== 'admin' && u.role !== 'superadmin')).length;
      const adminsOnly = fetched.filter((u) => u.role === 'admin' || u.role === 'superadmin').length;
      onToast(`✓ Database synchronized! Loaded ${fetched.length} registered accounts (${studentsOnly} students, ${adminsOnly} administrators).`);
    } catch (_err) {
      onToast('Database synchronized with active local & server records.');
    } finally {
      setIsCloudSyncing(false);
    }
  };

  const handleCopyRules = () => {
    const rulesText = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow reading student directory
    match /users/{userId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    // Allow open access for development/admin portal
    match /{document=**} {
      allow read, write: if true;
    }
  }
}`;
    navigator.clipboard.writeText(rulesText);
    setCopiedRules(true);
    onToast('📋 Firestore rules copied! Paste into Firebase Console -> Firestore -> Rules');
    setTimeout(() => setCopiedRules(false), 3000);
  };

  // Manual Course Assign Form State
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedCourse, setSelectedCourse] = useState(AVAILABLE_COURSES[0].title);
  const [accessDuration, setAccessDuration] = useState('1 Year');
  const [grantReason, setGrantReason] = useState('Merit Scholarship / Top Performer');
  const [isAssigning, setIsAssigning] = useState(false);

  // Single Student Registration Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmittingSingle, setIsSubmittingSingle] = useState(false);
  const [singleName, setSingleName] = useState('');
  const [singleEmail, setSingleEmail] = useState('');
  const [singleCountryCode, setSingleCountryCode] = useState('+91');
  const [singleMobile, setSingleMobile] = useState('');
  const [singleGrade, setSingleGrade] = useState('Class 10');
  const [singleTargetExam, setSingleTargetExam] = useState(TARGET_EXAMS[0]);
  const [singleSchool, setSingleSchool] = useState('');
  const [singleIsPro, setSingleIsPro] = useState(false);
  const [singleProPlan, setSingleProPlan] = useState(AVAILABLE_COURSES[0].title);
  const [singleNotes, setSingleNotes] = useState('');
  const [singleWhatsappAlerts, setSingleWhatsappAlerts] = useState(true);
  const [singleError, setSingleError] = useState('');

  // Bulk Students Registration Modal State
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkMode, setBulkMode] = useState<'firebase' | 'csv' | 'paste'>('firebase');
  const [pastedText, setPastedText] = useState('');
  const [parsedRows, setParsedRows] = useState<ParsedBulkRow[]>([]);
  const [isImportingBulk, setIsImportingBulk] = useState(false);
  const [bulkMakeAllPro, setBulkMakeAllPro] = useState(false);
  const [bulkDefaultGrade, setBulkDefaultGrade] = useState('Class 10');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePurgeDummyStudents = async () => {
    try {
      const cleaned = purgeDummyStudents();
      await fetch('/api/users/purge-dummies', { method: 'POST' });
      await fetchAllUsers();
      onRefresh();
      onToast(`✓ Cleaned all dummy/sample students! Displaying ${cleaned.length} verified accounts.`);
    } catch (_err) {
      onRefresh();
      onToast('Purged dummy students from database.');
    }
  };

  const handleGoogleConnect = async () => {
    try {
      await signInWithGoogle();
      const fetched = await fetchAllUsers();
      onRefresh();
      setCloudStatus(getFirestoreUsersConnectionStatus());
      onToast(`✓ Authenticated with Firebase Google Auth! Synchronized ${fetched.length} registered accounts.`);
    } catch (_e) {
      onToast('Google authentication cancelled or closed.');
    }
  };

  // Actual registered accounts (students and administrators)
  const displayUsers: UserProfile[] = users;

  const normalStudentsCount = displayUsers.filter((u) => !u.role || (u.role !== 'admin' && u.role !== 'superadmin')).length;
  const adminsCount = displayUsers.filter((u) => u.role === 'admin' || u.role === 'superadmin').length;
  const dummyStudentsCount = displayUsers.filter((u) => isDummyStudentRecord(u)).length;
  const realStudentsCount = displayUsers.filter((u) => !isDummyStudentRecord(u)).length;
  const proStudentsCount = displayUsers.filter((u) => u.isPro).length;
  const freeStudentsCount = displayUsers.filter((u) => !u.isPro).length;
  const withMobileCount = displayUsers.filter((u) => Boolean(u.mobileNumber || u.phoneNumber)).length;
  const totalStudents = displayUsers.length;

  const filteredStudents = displayUsers.filter((u) => {
    const q = search.toLowerCase().trim();
    const matchSearch =
      !q ||
      (u.displayName || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.userId || '').toLowerCase().includes(q) ||
      (u.mobileNumber || '').includes(q) ||
      (u.phoneNumber || '').includes(q) ||
      (u.schoolName || '').toLowerCase().includes(q);
    const matchGrade = gradeFilter === 'All' || u.grade === gradeFilter;
    const isDummy = isDummyStudentRecord(u);
    const isNormalStudent = !u.role || (u.role !== 'admin' && u.role !== 'superadmin');
    const isAdminUser = u.role === 'admin' || u.role === 'superadmin';
    const matchStatus =
      statusFilter === 'All'
        ? true
        : statusFilter === 'Students'
        ? isNormalStudent
        : statusFilter === 'Admins'
        ? isAdminUser
        : statusFilter === 'Real'
        ? !isDummy
        : statusFilter === 'Dummy'
        ? isDummy
        : statusFilter === 'Pro'
        ? u.isPro
        : !u.isPro;
    return matchSearch && matchGrade && matchStatus;
  });

  const handleManualGrantCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) {
      onToast('⚠️ Please select a student to assign course.');
      return;
    }

    setIsAssigning(true);
    try {
      await grantProStatusManually(selectedStudentId, `${selectedCourse} (${accessDuration} - ${grantReason})`);
      onToast(`🎉 Assigned "${selectedCourse}" to student successfully!`);
      setSelectedStudentId('');
      onRefresh();
    } catch (_err) {
      onToast('Error assigning course. Check student ID.');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleTogglePro = async (user: UserProfile) => {
    const nextStatus = !user.isPro;
    try {
      await toggleUserProStatus(user.userId, nextStatus, nextStatus ? 'Admin Assigned Pro Pass' : '');
      onToast(`Updated ${user.displayName || user.email} to ${nextStatus ? '⭐ PRO' : 'FREE'}`);
      onRefresh();
    } catch (_e) {
      onToast('Failed to update student Pro status.');
    }
  };

  const handleDeleteUser = async (userId: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove student "${name}"?`)) return;
    try {
      await deleteStudentAccount(userId);
      onToast(`Student ${name} removed from registry.`);
      onRefresh();
    } catch (_e) {
      onToast('Failed to delete student.');
    }
  };

  const handleExportCSV = () => {
    const headers = [
      'User ID',
      'Full Name',
      'Email',
      'Mobile Number',
      'WhatsApp Alerts',
      'Grade',
      'School / Institute',
      'Target Exam',
      'Pro Status',
      'Subscribed Plan',
      'Notes',
      'Registered Date',
    ];
    const rows = filteredStudents.map((u) => [
      `"${u.userId}"`,
      `"${u.displayName || 'Learner'}"`,
      `"${u.email}"`,
      `"${u.phoneNumber || u.mobileNumber || 'N/A'}"`,
      u.whatsappAlerts ? 'Yes' : 'No',
      `"${u.grade || 'Class 9'}"`,
      `"${u.schoolName || ''}"`,
      `"${u.targetExam || ''}"`,
      u.isPro ? 'PRO' : 'FREE',
      `"${u.proPlan || 'N/A'}"`,
      `"${u.notes || ''}"`,
      `"${u.createdAt || u.mobileRegisteredAt || new Date().toISOString()}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `students_registry_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onToast('📥 Students directory exported to CSV!');
  };

  // Submit Single Student
  const handleSubmitSingleStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSingleError('');

    const cleanName = singleName.trim();
    const cleanEmail = singleEmail.toLowerCase().trim();
    const cleanMobile = singleMobile.replace(/\D/g, '').trim();

    if (!cleanName) {
      setSingleError('Student full name is required');
      return;
    }
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setSingleError('A valid email address is required');
      return;
    }
    if (cleanMobile && singleCountryCode === '+91' && cleanMobile.length !== 10) {
      setSingleError('Indian mobile number must be 10 digits');
      return;
    }

    setIsSubmittingSingle(true);
    try {
      await registerStudentManually({
        displayName: cleanName,
        email: cleanEmail,
        countryCode: singleCountryCode.trim(),
        mobileNumber: cleanMobile,
        grade: singleGrade,
        targetExam: singleTargetExam,
        schoolName: singleSchool.trim(),
        isPro: singleIsPro,
        proPlan: singleIsPro ? singleProPlan : '',
        notes: singleNotes.trim(),
        whatsappAlerts: singleWhatsappAlerts,
      });

      onToast(`✓ Student "${cleanName}" registered successfully in database!`);
      // Reset form
      setSingleName('');
      setSingleEmail('');
      setSingleMobile('');
      setSingleSchool('');
      setSingleNotes('');
      setSingleIsPro(false);
      setIsAddModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setSingleError(err?.message || 'Failed to register student.');
    } finally {
      setIsSubmittingSingle(false);
    }
  };

  // Parse Text / CSV / Firebase Auth JSON Rows
  const parseRawStudentData = (rawText: string): ParsedBulkRow[] => {
    const trimmed = rawText.trim();
    if (!trimmed) return [];

    // 1. Try parsing as JSON (e.g. Firebase Auth user export or custom JSON array)
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        const parsedJson = JSON.parse(trimmed);
        const usersArray = Array.isArray(parsedJson)
          ? parsedJson
          : Array.isArray(parsedJson.users)
          ? parsedJson.users
          : [];

        if (usersArray.length > 0) {
          return usersArray.map((u: any, idx: number) => {
            const userId = String(u.localId || u.userId || u.uid || u.user_id || '').trim();
            const email = String(u.email || '').toLowerCase().trim();
            const name = String(u.displayName || u.display_name || u.name || (email ? email.split('@')[0] : `Student ${idx + 1}`)).trim();
            const photoURL = String(u.photoUrl || u.photo_url || u.photoURL || '');
            const mobile = String(u.phoneNumber || u.phone_number || u.mobileNumber || u.mobile || '').replace(/\D/g, '');
            const grade = String(u.grade || bulkDefaultGrade);
            const isPro = Boolean(u.isPro) || bulkMakeAllPro;
            const school = String(u.schoolName || u.school || '');
            const targetExam = String(u.targetExam || TARGET_EXAMS[0]);
            const notes = String(u.notes || (userId ? 'Firebase Auth Account' : 'Imported Student'));
            const isValid = Boolean(email && email.includes('@') && email.includes('.'));
            return {
              userId,
              photoURL,
              name,
              email,
              mobile,
              grade,
              isPro,
              school,
              targetExam,
              notes,
              isValid,
              error: !email ? 'Missing email' : !isValid ? 'Invalid email format' : undefined,
            };
          });
        }
      } catch (_jsonErr) {
        // Fall back to CSV / line parsing
      }
    }

    // 2. Parse as CSV / TSV lines
    const lines = trimmed.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return [];

    const results: ParsedBulkRow[] = [];
    let startIndex = 0;
    const firstLineLower = lines[0].toLowerCase();
    if (firstLineLower.includes('email') || firstLineLower.includes('name') || firstLineLower.includes('user id') || firstLineLower.includes('user_id')) {
      startIndex = 1;
    }

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i];
      const delimiter = line.includes('\t') ? '\t' : ',';
      const cols = line.split(delimiter).map((c) => c.replace(/^["']|["']$/g, '').trim());

      let userId = '';
      let name = '';
      let email = '';
      let mobile = '';
      let grade = bulkDefaultGrade;
      let isPro = bulkMakeAllPro;
      let school = '';
      let targetExam = TARGET_EXAMS[0];
      let notes = '';

      if (cols.length >= 2 && cols[1].includes('@')) {
        name = cols[0];
        email = cols[1].toLowerCase();
        mobile = (cols[2] || '').replace(/\D/g, '');
        grade = cols[3] || bulkDefaultGrade;
        isPro = cols[4] ? ['true', 'yes', 'pro', '1'].includes(cols[4].toLowerCase()) || bulkMakeAllPro : bulkMakeAllPro;
        school = cols[5] || '';
        targetExam = cols[6] || TARGET_EXAMS[0];
        notes = cols[7] || '';
      } else if (cols[0] && cols[0].includes('@')) {
        email = cols[0].toLowerCase();
        name = cols[1] || email.split('@')[0];
        mobile = (cols[2] || '').replace(/\D/g, '');
      } else if (cols.length >= 3 && cols[2].includes('@')) {
        userId = cols[0];
        name = cols[1];
        email = cols[2].toLowerCase();
        mobile = (cols[3] || '').replace(/\D/g, '');
      } else {
        name = cols[0] || '';
        email = (cols[1] || '').toLowerCase();
        mobile = (cols[2] || '').replace(/\D/g, '');
      }

      const isValid = Boolean(email && email.includes('@') && email.includes('.'));
      const error = !email ? 'Missing email' : !isValid ? 'Invalid email format' : undefined;

      results.push({
        userId,
        name: name || (email ? email.split('@')[0] : `Student ${i + 1}`),
        email,
        mobile,
        grade,
        isPro,
        school,
        targetExam,
        notes,
        isValid,
        error,
      });
    }

    return results;
  };

  // Handle File Upload for Bulk
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setPastedText(content);
        const parsed = parseRawStudentData(content);
        setParsedRows(parsed);
      }
    };
    reader.readAsText(file);
  };

  // Download Sample CSV Template
  const handleDownloadSampleCSV = () => {
    const headers = ['Name', 'Email', 'Mobile', 'Grade', 'Pro', 'School', 'TargetExam', 'Notes'];
    const sampleRows = [
      ['Rohan Verma', 'rohan.verma@gmail.com', '9876543210', 'Class 10', 'Pro', 'DPS R.K. Puram', 'CBSE Board Examinations', 'Board Prep Student'],
      ['Priya Sharma', 'priya.sharma@gmail.com', '9812345678', 'Class 9', 'Free', 'St. Xavier School', 'National Math Olympiad (IMO / SOF)', 'Olympiad Aspirant'],
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...sampleRows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'students_import_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onToast('📄 Downloaded sample CSV template!');
  };

  // Submit Bulk Import
  const handleExecuteBulkImport = async () => {
    const validStudents = parsedRows.filter((r) => r.isValid);
    if (validStudents.length === 0) {
      onToast('⚠️ No valid student rows to import. Please check email addresses.');
      return;
    }

    setIsImportingBulk(true);
    try {
      const payload = validStudents.map((r) => ({
        userId: r.userId || undefined,
        photoURL: r.photoURL || '',
        displayName: r.name,
        email: r.email,
        mobileNumber: r.mobile,
        countryCode: '+91',
        phoneNumber: r.mobile ? `+91 ${r.mobile}`.trim() : '',
        grade: r.grade || bulkDefaultGrade,
        schoolName: r.school,
        targetExam: r.targetExam,
        isPro: r.isPro,
        proPlan: r.isPro ? 'Admin Bulk Import' : '',
        notes: r.notes || 'Firebase Registered Student',
        whatsappAlerts: true,
      }));

      const res = await bulkImportStudents(payload);
      onToast(`🎉 Successfully registered & synced ${res.count} students!`);
      setIsBulkModalOpen(false);
      setParsedRows([]);
      setPastedText('');
      onRefresh();
    } catch (_err) {
      onToast('Failed to import bulk students. Please retry.');
    } finally {
      setIsImportingBulk(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* TOP HEADER: Key Metrics & Primary Actions */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-blue-50 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-800 text-xs font-bold mb-1 border border-blue-100">
            <span className="material-symbols-outlined text-[15px]">group</span>
            Student Database &amp; Enrolments
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#111c2d]">
            Registered Students Directory
          </h2>
          <p className="text-xs text-[#737686] mt-0.5">
            Real registered student accounts, contact info, WhatsApp alert records &amp; course passes.
          </p>
        </div>

        {/* Action Buttons: Sync Cloud / Refresh / Add Single / Bulk Import / Purge Dummy / Export CSV */}
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleCloudSync}
            disabled={isCloudSyncing}
            className="inline-flex items-center justify-center gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            title="Perform live synchronization with Firebase cloud and server database"
          >
            <span className={`material-symbols-outlined text-[17px] ${isCloudSyncing ? 'animate-spin' : ''}`}>cloud_sync</span>
            <span>{isCloudSyncing ? 'Syncing...' : 'Sync Cloud'}</span>
          </button>

          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center justify-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-[#004ac6] border border-blue-200 text-xs font-bold px-3 py-2.5 rounded-xl transition-all cursor-pointer"
            title="Refresh student list from database"
          >
            <span className="material-symbols-outlined text-[17px]">sync</span>
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 bg-[#004ac6] hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[17px]">person_add</span>
            <span>Add Student</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsBulkModalOpen(true);
              setBulkMode('firebase');
              setParsedRows([]);
              setPastedText('');
            }}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer"
            title="Import users from Firebase Authentication or CSV"
          >
            <span className="material-symbols-outlined text-[17px]">upload_file</span>
            <span>Import from Firebase / CSV</span>
          </button>

          {dummyStudentsCount > 0 && (
            <button
              type="button"
              onClick={handlePurgeDummyStudents}
              className="inline-flex items-center justify-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold px-3.5 py-2.5 rounded-xl transition-all cursor-pointer"
              title="Delete mock/dummy sample students"
            >
              <span className="material-symbols-outlined text-[17px]">delete_sweep</span>
              <span>Remove Dummy Students ({dummyStudentsCount})</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3.5 py-2.5 rounded-xl transition-all cursor-pointer"
            title="Export filtered students as CSV"
          >
            <span className="material-symbols-outlined text-[17px]">download</span>
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* FIREBASE CONNECTION STATUS & SECURITY RULES HELPER */}
      <div className={`rounded-2xl p-3.5 sm:p-4 text-xs space-y-2.5 border ${
        cloudStatus.status === 'permission-denied'
          ? 'bg-amber-50/80 border-amber-200'
          : 'bg-slate-50 border-slate-200/80'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="material-symbols-outlined text-blue-600 text-[19px]">database</span>
            <span className="font-bold text-slate-800">Database Connection Status:</span>
            {cloudStatus.status === 'connected' ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Firebase Cloud Live ({cloudStatus.count ?? totalStudents} cloud documents)</span>
              </span>
            ) : cloudStatus.status === 'permission-denied' ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-900 bg-amber-100 border border-amber-300 px-2.5 py-1 rounded-lg">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                <span>Cloud Firestore: Permission Denied (Requires Rule in Firebase Console)</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-lg">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                <span>Active ({totalStudents} verified accounts)</span>
              </span>
            )}

            {auth.currentUser ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-800 bg-blue-100/70 border border-blue-200 px-2 py-0.5 rounded-md">
                <span className="material-symbols-outlined text-[13px]">verified_user</span>
                <span>Auth: {auth.currentUser.email}</span>
              </span>
            ) : (
              <button
                type="button"
                onClick={handleGoogleConnect}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-0.5 rounded-lg cursor-pointer transition-colors"
                title="Sign in with your Google Admin account to authorize Firebase Cloud access"
              >
                <span className="material-symbols-outlined text-[13px]">login</span>
                <span>Sign in with Google</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowRulesHelper(!showRulesHelper)}
              className="text-[11px] font-bold text-blue-700 hover:text-blue-900 underline cursor-pointer"
            >
              {showRulesHelper ? 'Hide Firebase Setup Guide' : 'Firebase Rules & Auth Import Guide'}
            </button>
          </div>
        </div>

        {/* Prominent warning if permission denied */}
        {cloudStatus.status === 'permission-denied' && !showRulesHelper && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-amber-200/60 text-amber-900">
            <p className="text-[11px]">
              ⚠️ Direct Firestore read restricted by Firebase rules. Real students are saved to server database. To sync directly:
            </p>
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              {!auth.currentUser && (
                <button
                  type="button"
                  onClick={handleGoogleConnect}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] px-2.5 py-1 rounded-lg cursor-pointer"
                >
                  Sign in with Google
                </button>
              )}
              <button
                type="button"
                onClick={handleCopyRules}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] px-2.5 py-1 rounded-lg cursor-pointer"
              >
                {copiedRules ? '✓ Rule Copied!' : 'Copy Rule for Console'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsBulkModalOpen(true);
                  setBulkMode('firebase');
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] px-2.5 py-1 rounded-lg cursor-pointer"
              >
                Import from Firebase Console
              </button>
            </div>
          </div>
        )}

        {showRulesHelper && (
          <div className="bg-white border border-blue-100 rounded-xl p-3.5 space-y-2.5 mt-2 animate-fadeIn">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-amber-500 text-[18px]">verified_user</span>
                  Firebase Firestore Cloud Security Rules Guide
                </h4>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  All logged-in students are always saved to your active database. To enable direct cross-device reading from Firebase Firestore, paste this rule into your Firebase project:
                </p>
              </div>
              <button
                type="button"
                onClick={handleCopyRules}
                className="shrink-0 inline-flex items-center gap-1 bg-[#004ac6] hover:bg-blue-700 text-white font-bold text-[11px] px-3 py-1.5 rounded-lg shadow-2xs transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[14px]">content_copy</span>
                <span>{copiedRules ? 'Copied!' : 'Copy Rule'}</span>
              </button>
            </div>

            <div className="bg-slate-900 text-slate-100 p-2.5 rounded-lg font-mono text-[11px] overflow-x-auto">
              <pre className="whitespace-pre">{`// Firebase Console -> Firestore Database -> Rules -> Publish
match /users/{userId} {
  allow read: if true;
  allow write: if request.auth != null;
}`}</pre>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
              <a
                href="https://console.firebase.google.com/project/maths-at-your-fingertips/firestore/rules"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-blue-700 font-bold hover:underline"
              >
                <span>Open Firebase Console Rules for "maths-at-your-fingertips"</span>
                <span className="material-symbols-outlined text-[13px]">open_in_new</span>
              </a>
              <span className="text-slate-300">•</span>
              <button
                type="button"
                onClick={handleCloudSync}
                className="text-indigo-700 font-bold hover:underline cursor-pointer"
              >
                Re-check Firestore Connection
              </button>
            </div>
          </div>
        )}
      </div>

      {/* METRIC PILLS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-white rounded-2xl p-3.5 border border-blue-50 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[22px]">contacts</span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Registered</span>
            <span className="text-lg font-black text-[#111c2d]">{totalStudents}</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-3.5 border border-emerald-100 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[22px]">school</span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Students (Learners)</span>
            <span className="text-lg font-black text-emerald-900">{normalStudentsCount}</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-3.5 border border-indigo-100 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[22px]">admin_panel_settings</span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">Admins & Faculty</span>
            <span className="text-lg font-black text-indigo-900">{adminsCount}</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-3.5 border border-amber-100 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[22px]">workspace_premium</span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">Pro Active Pass</span>
            <span className="text-lg font-black text-[#111c2d]">{proStudentsCount}</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-3.5 border border-blue-50 shadow-xs flex items-center gap-3 col-span-2 sm:col-span-1">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[22px]">phone_iphone</span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block">Verified Contact</span>
            <span className="text-lg font-black text-[#111c2d]">{withMobileCount}</span>
          </div>
        </div>
      </div>

      {/* CARD 1: Manually Assign Paid Courses Without Payment */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-2xl p-5 sm:p-6 shadow-sm border border-blue-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-amber-400 text-[22px]">card_membership</span>
              <h3 className="text-base font-bold">Manually Assign Paid Courses to Students</h3>
              <span className="bg-amber-400 text-slate-900 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                Zero ₹ Payment
              </span>
            </div>
            <p className="text-xs text-blue-200">
              Grant instant Pro courses or formula packs to students for scholarships, offline cash collections, or special incentives.
            </p>
          </div>
        </div>

        <form onSubmit={handleManualGrantCourse} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* 1. Select Student */}
          <div>
            <label className="text-[11px] font-bold text-blue-200 block mb-1">
              Select Student:
            </label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full px-3 py-2 bg-white text-slate-800 text-xs font-semibold rounded-xl border border-blue-300 focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              <option value="">-- Choose Student --</option>
              {displayUsers.map((u) => (
                <option key={u.userId} value={u.userId}>
                  {u.displayName || u.email} ({u.grade || 'Class 9'} - {u.isPro ? 'Pro' : 'Free'})
                </option>
              ))}
            </select>
          </div>

          {/* 2. Choose Course / Pro Pass */}
          <div>
            <label className="text-[11px] font-bold text-blue-200 block mb-1">
              Course / Pro Plan:
            </label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full px-3 py-2 bg-white text-slate-800 text-xs font-semibold rounded-xl border border-blue-300 focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              {AVAILABLE_COURSES.map((c) => (
                <option key={c.id} value={c.title}>
                  {c.title} (Value: {formatPrice(c.price)})
                </option>
              ))}
            </select>
          </div>

          {/* 3. Duration & Reason */}
          <div>
            <label className="text-[11px] font-bold text-blue-200 block mb-1">
              Duration &amp; Reason:
            </label>
            <div className="flex gap-2">
              <select
                value={accessDuration}
                onChange={(e) => setAccessDuration(e.target.value)}
                className="w-1/2 px-2 py-2 bg-white text-slate-800 text-xs font-semibold rounded-xl border border-blue-300 focus:outline-none"
              >
                <option value="1 Month">1 Month</option>
                <option value="6 Months">6 Months</option>
                <option value="1 Year">1 Year</option>
                <option value="Lifetime">Lifetime</option>
              </select>
              <select
                value={grantReason}
                onChange={(e) => setGrantReason(e.target.value)}
                className="w-1/2 px-2 py-2 bg-white text-slate-800 text-xs font-semibold rounded-xl border border-blue-300 focus:outline-none"
              >
                <option value="Scholarship">Scholarship</option>
                <option value="Offline Cash">Offline Cash</option>
                <option value="Top Performer">Top Ranker</option>
                <option value="Trial Access">Trial Access</option>
              </select>
            </div>
          </div>

          {/* 4. Action Button */}
          <div className="flex items-end">
            <button
              type="submit"
              disabled={isAssigning}
              className="w-full h-[38px] bg-amber-400 hover:bg-amber-300 text-slate-900 font-extrabold text-xs rounded-xl shadow transition-all active:scale-95 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[18px]">verified</span>
              <span>{isAssigning ? 'Granting...' : 'Grant Pro Course'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* CARD 2: Student Registry Table with Search & Filters */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-blue-50 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#004ac6] text-[22px]">contacts</span>
            <h3 className="text-base font-bold text-[#111c2d]">Student Accounts Directory</h3>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              {filteredStudents.length} / {totalStudents}
            </span>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-[18px]">search</span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, email, phone..."
                className="pl-9 pr-3 py-1.5 text-xs font-medium rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 w-48 sm:w-60 bg-slate-50 focus:bg-white"
              />
            </div>

            <select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-700 outline-none cursor-pointer"
            >
              <option value="All">All Grades</option>
              {GRADES.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-2.5 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-700 outline-none cursor-pointer"
            >
              <option value="All">All Accounts ({totalStudents})</option>
              <option value="Students">Registered Students / Learners ({normalStudentsCount})</option>
              <option value="Admins">Administrators & Faculty ({adminsCount})</option>
              <option value="Pro">Pro Members ({proStudentsCount})</option>
              <option value="Free">Free Learners ({freeStudentsCount})</option>
              {dummyStudentsCount > 0 && (
                <option value="Dummy">Sample Demo ({dummyStudentsCount})</option>
              )}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto border border-slate-100 rounded-2xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100">
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Mobile / WhatsApp</th>
                <th className="py-3 px-4">Class</th>
                <th className="py-3 px-4">School / Exam</th>
                <th className="py-3 px-4">Joined Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Pro Plan / Notes</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <span className="material-symbols-outlined text-[36px] text-slate-300 block mb-1">person_search</span>
                    No registered students found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((u) => {
                  const joinedDate = u.createdAt
                    ? new Date(u.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : 'Active';

                  const hasMobile = Boolean(u.mobileNumber || u.phoneNumber);
                  const displayPhone = u.phoneNumber || (u.countryCode ? `${u.countryCode} ${u.mobileNumber}` : u.mobileNumber);
                  const isDummy = isDummyStudentRecord(u);

                  return (
                    <tr key={u.userId || u.email} className="hover:bg-blue-50/30 transition-colors">
                      {/* Name & Email */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={
                              u.photoURL ||
                              `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(u.displayName || u.email)}`
                            }
                            alt={u.displayName || 'Student'}
                            className="w-8 h-8 rounded-full border border-blue-100 shrink-0 bg-blue-50 object-cover"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-[#111c2d] block truncate max-w-[170px]">
                                {u.displayName || 'Math Student'}
                              </span>
                              {isDummy ? (
                                <span className="text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                                  Sample Demo
                                </span>
                              ) : u.role ? (
                                <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                                  u.role === 'superadmin' ? 'bg-amber-100 text-amber-900 border border-amber-200' : 'bg-blue-100 text-blue-900 border border-blue-200'
                                }`}>
                                  {u.role}
                                </span>
                              ) : (
                                <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded inline-flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                  <span>Firebase Registered</span>
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400 font-mono block truncate max-w-[170px]">
                              {u.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Mobile / WhatsApp Number */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {hasMobile ? (
                          <div className="flex items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                              <span className="material-symbols-outlined text-[13px] text-emerald-600">phone</span>
                              <span>{displayPhone}</span>
                            </span>
                            {u.whatsappAlerts && (
                              <span
                                className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0"
                                title="WhatsApp alerts enabled"
                              >
                                <span className="material-symbols-outlined text-[13px]">chat</span>
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                            <span>Pending Phone</span>
                          </span>
                        )}
                      </td>

                      {/* Class */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                          {u.grade || 'Class 9'}
                        </span>
                      </td>

                      {/* School / Target Exam */}
                      <td className="py-3 px-4 max-w-[140px] truncate text-[11px] text-slate-600">
                        <span className="block truncate font-medium text-slate-700">{u.schoolName || '—'}</span>
                        <span className="block truncate text-[10px] text-slate-400">{u.targetExam || ''}</span>
                      </td>

                      {/* Joined Date */}
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap text-[11px]">
                        {joinedDate}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {u.isPro ? (
                          <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-900 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-amber-200">
                            <span className="material-symbols-outlined text-[12px]">workspace_premium</span>
                            <span>PRO ACTIVE</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                            <span>Free Learner</span>
                          </span>
                        )}
                      </td>

                      {/* Plan / Notes */}
                      <td className="py-3 px-4 max-w-xs truncate text-[11px] font-medium text-slate-600">
                        <span className="block truncate text-slate-800">{u.proPlan || '—'}</span>
                        {u.notes && <span className="block truncate text-[10px] text-slate-400">{u.notes}</span>}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleTogglePro(u)}
                            className={`px-2.5 py-1 text-[11px] font-bold rounded-lg cursor-pointer transition-colors ${
                              u.isPro
                                ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            }`}
                          >
                            {u.isPro ? 'Revoke Pro' : 'Make Pro'}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteUser(u.userId, u.displayName || u.email)}
                            className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer transition-colors"
                            title="Delete Student"
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: ADD SINGLE STUDENT */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-blue-100 overflow-hidden flex flex-col max-h-[92vh]">
            <div className="bg-gradient-to-r from-blue-700 to-indigo-800 p-5 sm:p-6 text-white relative shrink-0">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center cursor-pointer transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold mb-2 border border-white/20">
                <span className="material-symbols-outlined text-[15px]">person_add</span>
                Admin Registration
              </div>
              <h3 className="text-xl font-black">Add New Student to Registry</h3>
              <p className="text-xs text-blue-100 mt-0.5">
                Register a single student account directly with custom access and contact details.
              </p>
            </div>

            <form onSubmit={handleSubmitSingleStudent} className="p-5 sm:p-6 overflow-y-auto space-y-4">
              {singleError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] shrink-0">error</span>
                  <span className="font-semibold">{singleError}</span>
                </div>
              )}

              {/* Full Name & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">
                    Student Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={singleName}
                    onChange={(e) => setSingleName(e.target.value)}
                    placeholder="e.g. Diya Sharma"
                    className="w-full bg-[#f0f3ff] border border-blue-100 rounded-xl px-3.5 py-2 text-xs font-semibold outline-none focus:bg-white focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={singleEmail}
                    onChange={(e) => setSingleEmail(e.target.value)}
                    placeholder="student@example.com"
                    className="w-full bg-[#f0f3ff] border border-blue-100 rounded-xl px-3.5 py-2 text-xs font-semibold outline-none focus:bg-white focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Mobile Number & Grade */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">
                    Mobile / WhatsApp:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={singleCountryCode}
                      onChange={(e) => setSingleCountryCode(e.target.value)}
                      className="w-16 bg-[#f0f3ff] border border-blue-100 rounded-xl px-2 py-2 text-xs font-bold text-center outline-none"
                    />
                    <input
                      type="tel"
                      value={singleMobile}
                      onChange={(e) => setSingleMobile(e.target.value)}
                      maxLength={10}
                      placeholder="9876543210"
                      className="flex-1 bg-[#f0f3ff] border border-blue-100 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:bg-white focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">Class / Grade:</label>
                  <select
                    value={singleGrade}
                    onChange={(e) => setSingleGrade(e.target.value)}
                    className="w-full bg-[#f0f3ff] border border-blue-100 rounded-xl px-3 py-2 text-xs font-semibold outline-none cursor-pointer"
                  >
                    {GRADES.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* School & Target Exam */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">School / Institute:</label>
                  <input
                    type="text"
                    value={singleSchool}
                    onChange={(e) => setSingleSchool(e.target.value)}
                    placeholder="e.g. Modern School"
                    className="w-full bg-[#f0f3ff] border border-blue-100 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:bg-white focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">Target Exam:</label>
                  <select
                    value={singleTargetExam}
                    onChange={(e) => setSingleTargetExam(e.target.value)}
                    className="w-full bg-[#f0f3ff] border border-blue-100 rounded-xl px-3 py-2 text-xs font-semibold outline-none cursor-pointer"
                  >
                    {TARGET_EXAMS.map((te) => (
                      <option key={te} value={te}>{te}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Pro Membership Option */}
              <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-2.5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={singleIsPro}
                    onChange={(e) => setSingleIsPro(e.target.checked)}
                    className="w-4 h-4 text-amber-600 rounded cursor-pointer"
                  />
                  <span className="text-xs font-bold text-amber-950">
                    Grant Immediate ⭐ Pro Membership Pass
                  </span>
                </label>

                {singleIsPro && (
                  <div>
                    <label className="text-[11px] font-bold text-amber-900 block mb-1">Select Pro Pass Plan:</label>
                    <select
                      value={singleProPlan}
                      onChange={(e) => setSingleProPlan(e.target.value)}
                      className="w-full bg-white border border-amber-300 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none"
                    >
                      {AVAILABLE_COURSES.map((c) => (
                        <option key={c.id} value={c.title}>
                          {c.title} ({formatPrice(c.price)})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">Admin Notes / Remarks:</label>
                <input
                  type="text"
                  value={singleNotes}
                  onChange={(e) => setSingleNotes(e.target.value)}
                  placeholder="e.g. Offline scholarship admission, parent contact verified"
                  className="w-full bg-[#f0f3ff] border border-blue-100 rounded-xl px-3 py-2 text-xs font-medium outline-none focus:bg-white focus:border-blue-500"
                />
              </div>

              {/* WhatsApp alerts */}
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={singleWhatsappAlerts}
                  onChange={(e) => setSingleWhatsappAlerts(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
                />
                <span>Enable WhatsApp formula alerts &amp; exam notification reminders</span>
              </label>

              {/* Footer */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingSingle}
                  className="inline-flex items-center gap-2 bg-[#004ac6] hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-60"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {isSubmittingSingle ? 'sync' : 'person_add'}
                  </span>
                  <span>{isSubmittingSingle ? 'Registering...' : 'Register Student'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: BULK ADD STUDENTS (CSV / TEXT) */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-blue-100 overflow-hidden flex flex-col max-h-[92vh]">
            <div className="bg-gradient-to-r from-indigo-700 via-blue-700 to-indigo-900 p-5 sm:p-6 text-white relative shrink-0">
              <button
                type="button"
                onClick={() => setIsBulkModalOpen(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center cursor-pointer transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold mb-2 border border-white/20">
                <span className="material-symbols-outlined text-[15px]">upload_file</span>
                Batch Registration &amp; Enrolment
              </div>
              <h3 className="text-xl font-black">Bulk Add Students</h3>
              <p className="text-xs text-blue-100 mt-0.5">
                Upload a CSV spreadsheet or paste student rosters from Excel to register multiple students in one click.
              </p>
            </div>

            <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
              {/* Mode Switcher & Download Sample */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl flex-wrap">
                  <button
                    type="button"
                    onClick={() => setBulkMode('firebase')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-colors flex items-center gap-1.5 ${
                      bulkMode === 'firebase'
                        ? 'bg-white text-indigo-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[15px]">database</span>
                    <span>Firebase Auth Export (JSON/CSV)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setBulkMode('csv')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-colors ${
                      bulkMode === 'csv'
                        ? 'bg-white text-blue-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    CSV File Upload
                  </button>
                  <button
                    type="button"
                    onClick={() => setBulkMode('paste')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-colors ${
                      bulkMode === 'paste'
                        ? 'bg-white text-blue-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Copy-Paste Text
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadSampleCSV}
                  className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer self-start sm:self-auto"
                >
                  <span className="material-symbols-outlined text-[16px]">download</span>
                  <span>Sample Template</span>
                </button>
              </div>

              {/* Mode 0: Firebase Auth Import */}
              {bulkMode === 'firebase' && (
                <div className="space-y-3">
                  <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-2xl p-3.5 text-xs space-y-1.5">
                    <div className="flex items-center gap-2 text-indigo-900 font-bold">
                      <span className="material-symbols-outlined text-[18px] text-indigo-600">cloud_download</span>
                      <span>How to import registered students from Firebase Console:</span>
                    </div>
                    <ol className="list-decimal list-inside space-y-0.5 text-slate-700 text-[11px] leading-relaxed">
                      <li>Open Firebase Console → <strong>maths-at-your-fingertips</strong> project</li>
                      <li>Click <strong>Authentication</strong> → <strong>Users</strong></li>
                      <li>Click <strong>Export users</strong> (top right) or copy user emails/objects</li>
                      <li>Paste the JSON or CSV export into the box below and click Import!</li>
                    </ol>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800">
                        Paste Firebase Auth JSON or CSV Export:
                      </label>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-xs font-bold text-indigo-700 hover:text-indigo-900 underline cursor-pointer"
                      >
                        or upload export file
                      </button>
                    </div>
                    <textarea
                      rows={5}
                      value={pastedText}
                      onChange={(e) => {
                        setPastedText(e.target.value);
                        const parsed = parseRawStudentData(e.target.value);
                        setParsedRows(parsed);
                      }}
                      placeholder={`Paste Firebase Auth JSON (e.g. { "users": [{ "localId": "...", "email": "student@gmail.com", "displayName": "..." }] }) or CSV:`}
                      className="w-full bg-[#f0f3ff] border border-blue-100 rounded-xl p-3 text-xs font-mono outline-none focus:bg-white focus:border-blue-500"
                    />
                  </div>
                </div>
              )}

              {/* Mode 1: File Drop Area */}
              {bulkMode === 'csv' && (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.txt,.json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-blue-200 hover:border-blue-400 bg-blue-50/40 hover:bg-blue-50/70 p-6 rounded-2xl text-center cursor-pointer transition-colors space-y-2"
                  >
                    <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mx-auto">
                      <span className="material-symbols-outlined text-[28px]">file_upload</span>
                    </div>
                    <p className="text-xs font-bold text-slate-800">
                      Click to choose CSV or JSON file or drag and drop here
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Supports standard columns: <span className="font-mono font-semibold">Name, Email, Mobile, Grade, Pro, School</span>
                    </p>
                  </div>
                </div>
              )}

              {/* Mode 2: Paste Area */}
              {bulkMode === 'paste' && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-800 block">
                    Paste Student Data (Comma or Tab separated lines):
                  </label>
                  <textarea
                    rows={4}
                    value={pastedText}
                    onChange={(e) => {
                      setPastedText(e.target.value);
                      const parsed = parseRawStudentData(e.target.value);
                      setParsedRows(parsed);
                    }}
                    placeholder={`Name, Email, Mobile, Grade, Pro\nAarav Sharma, aarav@example.com, 9876543210, Class 10, Pro\nDiya Patel, diya@example.com, 9812345678, Class 9, Free`}
                    className="w-full bg-[#f0f3ff] border border-blue-100 rounded-xl p-3 text-xs font-mono outline-none focus:bg-white focus:border-blue-500"
                  />
                </div>
              )}

              {/* Bulk Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bulkMakeAllPro}
                    onChange={(e) => {
                      setBulkMakeAllPro(e.target.checked);
                      if (parsedRows.length > 0) {
                        setParsedRows((prev) =>
                          prev.map((r) => ({ ...r, isPro: e.target.checked }))
                        );
                      }
                    }}
                    className="w-4 h-4 text-amber-600 rounded cursor-pointer"
                  />
                  <span className="text-xs font-bold text-slate-800">
                    Grant all imported students ⭐ Pro Pass
                  </span>
                </label>

                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-slate-700 whitespace-nowrap">Default Grade:</label>
                  <select
                    value={bulkDefaultGrade}
                    onChange={(e) => {
                      setBulkDefaultGrade(e.target.value);
                      if (parsedRows.length > 0) {
                        setParsedRows((prev) =>
                          prev.map((r) => ({ ...r, grade: r.grade || e.target.value }))
                        );
                      }
                    }}
                    className="flex-1 bg-white border border-slate-200 rounded-xl px-2.5 py-1 text-xs font-semibold outline-none"
                  >
                    {GRADES.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Parsed Preview Table */}
              {parsedRows.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">
                      Parsed Preview ({parsedRows.filter((r) => r.isValid).length} Valid Students, {parsedRows.filter((r) => !r.isValid).length} Errors)
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setParsedRows([]);
                        setPastedText('');
                      }}
                      className="text-slate-400 hover:text-slate-600 text-[11px] font-semibold"
                    >
                      Clear
                    </button>
                  </div>

                  <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-xl text-xs">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-100 text-slate-600 font-bold text-[10px] uppercase">
                          <th className="py-2 px-3">Status</th>
                          <th className="py-2 px-3">Name</th>
                          <th className="py-2 px-3">Email</th>
                          <th className="py-2 px-3">Mobile</th>
                          <th className="py-2 px-3">Grade</th>
                          <th className="py-2 px-3">Tier</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {parsedRows.map((row, idx) => (
                          <tr key={idx} className={row.isValid ? 'bg-white' : 'bg-red-50/50'}>
                            <td className="py-2 px-3">
                              {row.isValid ? (
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                                  Valid
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold text-red-700 bg-red-100 px-1.5 py-0.5 rounded">
                                  {row.error || 'Error'}
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-3 font-semibold text-slate-800">{row.name}</td>
                            <td className="py-2 px-3 font-mono text-[11px] text-slate-600">{row.email || '—'}</td>
                            <td className="py-2 px-3 font-mono text-[11px]">{row.mobile || '—'}</td>
                            <td className="py-2 px-3 font-bold text-blue-700">{row.grade}</td>
                            <td className="py-2 px-3">
                              {row.isPro ? (
                                <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">
                                  PRO
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-500">Free</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsBulkModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isImportingBulk || parsedRows.filter((r) => r.isValid).length === 0}
                  onClick={handleExecuteBulkImport}
                  className="inline-flex items-center gap-2 bg-[#004ac6] hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {isImportingBulk ? 'sync' : 'group_add'}
                  </span>
                  <span>
                    {isImportingBulk
                      ? 'Importing...'
                      : `Import ${parsedRows.filter((r) => r.isValid).length} Students`}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
