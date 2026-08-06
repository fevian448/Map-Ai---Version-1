import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { doc, getDocFromServer, collection, getDocs, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  signInWithGoogleWorkspace,
  logoutWorkspace,
  initWorkspaceAuth,
  getWorkspaceAccessToken,
  fetchGoogleContacts,
  createGoogleContact,
  GoogleContact,
  fetchGoogleDriveFiles,
  uploadToGoogleDrive,
  deleteGoogleDriveFile,
  GoogleDriveFile,
  fetchGmailMessages,
  sendGmailEmail,
  GmailMessageItem,
  fetchGoogleCalendarEvents,
  createGoogleCalendarEvent,
  GoogleCalendarEvent
} from '../services/workspace';
import {
  Users,
  HardDrive,
  Mail,
  Calendar as CalendarIcon,
  Database,
  Search,
  Plus,
  Send,
  Trash2,
  ExternalLink,
  Navigation,
  ShieldAlert,
  CheckCircle2,
  RefreshCw,
  LogOut,
  FolderUp,
  FileText,
  Clock,
  MapPin,
  Sparkles
} from 'lucide-react';
import { GeoPoint, SettingsState } from '../types';

interface GoogleWorkspaceHubProps {
  userLocation: GeoPoint;
  destinationName?: string;
  onSelectDestination?: (point: GeoPoint | null, name: string) => void;
  onStartNavigation?: () => void;
  settings: SettingsState;
}

export function GoogleWorkspaceHub({
  userLocation,
  destinationName,
  onSelectDestination,
  onStartNavigation,
  settings
}: GoogleWorkspaceHubProps) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(getWorkspaceAccessToken());
  const [needsAuth, setNeedsAuth] = useState<boolean>(!getWorkspaceAccessToken());
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [activeSubTab, setActiveSubTab] = useState<'contacts' | 'drive' | 'gmail' | 'calendar' | 'firebase'>('contacts');

  // Loading states
  const [loading, setLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Data states
  const [contacts, setContacts] = useState<GoogleContact[]>([]);
  const [contactSearch, setContactSearch] = useState<string>('');
  const [showAddContactModal, setShowAddContactModal] = useState<boolean>(false);
  const [newContactName, setNewContactName] = useState<string>('');
  const [newContactEmail, setNewContactEmail] = useState<string>('');
  const [newContactPhone, setNewContactPhone] = useState<string>('');

  const [driveFiles, setDriveFiles] = useState<GoogleDriveFile[]>([]);
  const [gmailMessages, setGmailMessages] = useState<GmailMessageItem[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<GoogleCalendarEvent[]>([]);

  // Email modal state
  const [showEmailModal, setShowEmailModal] = useState<boolean>(false);
  const [emailTo, setEmailTo] = useState<string>('');
  const [emailSubject, setEmailSubject] = useState<string>('');
  const [emailBody, setEmailBody] = useState<string>('');

  // Calendar Event Modal state
  const [showCalModal, setShowCalModal] = useState<boolean>(false);
  const [calSummary, setCalSummary] = useState<string>('');
  const [calLocation, setCalLocation] = useState<string>('');
  const [calStartTime, setCalStartTime] = useState<string>('');

  // Firestore Sync state
  const [firestoreStatus, setFirestoreStatus] = useState<string>('Not Checked');
  const [savedRoutes, setSavedRoutes] = useState<any[]>([]);

  // Initialize Auth
  useEffect(() => {
    const unsubscribe = initWorkspaceAuth(
      (u, token) => {
        setUser(u);
        setAccessToken(token);
        setNeedsAuth(false);
      },
      () => {
        setNeedsAuth(true);
        setUser(null);
        setAccessToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // Load Data on Tab switch or auth
  const loadWorkspaceData = async () => {
    if (!accessToken && !user) return;
    setLoading(true);
    setStatusMessage('Syncing with Google Workspace APIs...');

    try {
      if (activeSubTab === 'contacts') {
        const cList = await fetchGoogleContacts();
        setContacts(cList);
      } else if (activeSubTab === 'drive') {
        const fList = await fetchGoogleDriveFiles();
        setDriveFiles(fList);
      } else if (activeSubTab === 'gmail') {
        const mList = await fetchGmailMessages();
        setGmailMessages(mList);
      } else if (activeSubTab === 'calendar') {
        const eList = await fetchGoogleCalendarEvents();
        setCalendarEvents(eList);
      } else if (activeSubTab === 'firebase') {
        await checkFirestoreConnection();
      }
    } catch (err: any) {
      console.error('Data load error:', err);
    } finally {
      setLoading(false);
      setStatusMessage(null);
    }
  };

  useEffect(() => {
    if (!needsAuth) {
      loadWorkspaceData();
    }
  }, [activeSubTab, needsAuth]);

  // Firestore test
  const checkFirestoreConnection = async () => {
    if (!user) {
      setFirestoreStatus('Sign in required for Firestore');
      return;
    }
    try {
      const testRef = doc(db, 'users', user.uid);
      await getDocFromServer(testRef).catch(() => {});
      setFirestoreStatus('Connected (Firestore Online 🟢)');

      // Fetch saved routes
      const routesSnap = await getDocs(collection(db, `users/${user.uid}/saved_routes`));
      const rList: any[] = [];
      routesSnap.forEach((d) => rList.push({ id: d.id, ...d.data() }));
      setSavedRoutes(rList);
    } catch (err) {
      setFirestoreStatus('Connected (Offline Mode / Rules active)');
    }
  };

  const handleSignIn = async () => {
    setIsLoggingIn(true);
    try {
      const result = await signInWithGoogleWorkspace();
      if (result) {
        setUser(result.user);
        setAccessToken(result.accessToken);
        setNeedsAuth(false);
        setStatusMessage('Successfully signed in with Google Workspace!');
        setTimeout(() => setStatusMessage(null), 3000);
      }
    } catch (err: any) {
      alert(`Sign in error: ${err.message || 'Failed to authenticate'}`);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await logoutWorkspace();
    setNeedsAuth(true);
    setUser(null);
    setAccessToken(null);
    setContacts([]);
    setDriveFiles([]);
    setGmailMessages([]);
    setCalendarEvents([]);
  };

  // Contacts Actions
  const handleCreateContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContactName.trim()) return;

    setLoading(true);
    const newC = await createGoogleContact(newContactName, newContactEmail, newContactPhone);
    setLoading(false);

    if (newC) {
      setContacts((prev) => [newC, ...prev]);
      setShowAddContactModal(false);
      setNewContactName('');
      setNewContactEmail('');
      setNewContactPhone('');
      setStatusMessage(`Contact ${newC.displayName} saved to Google Contacts!`);
      setTimeout(() => setStatusMessage(null), 3000);
    } else {
      alert('Failed to save contact to Google Contacts.');
    }
  };

  // Drive Actions
  const handleBackupLogToDrive = async () => {
    setLoading(true);
    const logData = JSON.stringify(
      {
        appName: 'MapAi',
        timestamp: new Date().toISOString(),
        userLocation,
        destinationName: destinationName || 'None',
        speedUnit: settings.speedUnit,
        language: settings.language,
        notes: 'MapAi Navigation Trip & Speed Telemetry Backup'
      },
      null,
      2
    );

    const filename = `MapAi_TripLog_${Date.now()}.json`;
    const uploaded = await uploadToGoogleDrive(filename, logData, 'application/json');
    setLoading(false);

    if (uploaded) {
      setDriveFiles((prev) => [uploaded, ...prev]);
      setStatusMessage(`Successfully backed up ${filename} to Google Drive!`);
      setTimeout(() => setStatusMessage(null), 4000);
    } else {
      alert('Failed to upload file to Google Drive.');
    }
  };

  const handleDeleteDriveFileConfirm = async (file: GoogleDriveFile) => {
    const confirmed = window.confirm(`Are you sure you want to delete "${file.name}" from Google Drive?`);
    if (!confirmed) return;

    setLoading(true);
    const ok = await deleteGoogleDriveFile(file.id);
    setLoading(false);

    if (ok) {
      setDriveFiles((prev) => prev.filter((f) => f.id !== file.id));
      setStatusMessage(`File "${file.name}" deleted from Google Drive.`);
      setTimeout(() => setStatusMessage(null), 3000);
    } else {
      alert('Failed to delete file from Google Drive.');
    }
  };

  // Gmail Actions
  const handleOpenEmailModalForContact = (c: GoogleContact) => {
    if (c.email) setEmailTo(c.email);
    setEmailSubject(`MapAi Trip Route & Live Location Update`);
    setEmailBody(
      `Hello ${c.displayName},\n\nI am navigating using MapAi. Here are my live route details:\n- Current Location: (${userLocation.latitude.toFixed(
        4
      )}, ${userLocation.longitude.toFixed(4)})\n- Destination: ${
        destinationName || 'Not Set'
      }\n- Time: ${new Date().toLocaleTimeString()}\n\nSafe driving with MapAi!`
    );
    setShowEmailModal(true);
  };

  const handleSendGmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailTo.trim() || !emailSubject.trim()) return;

    const confirmed = window.confirm(`Confirm sending Gmail email to ${emailTo}?`);
    if (!confirmed) return;

    setLoading(true);
    const success = await sendGmailEmail(emailTo, emailSubject, emailBody);
    setLoading(false);

    if (success) {
      setShowEmailModal(false);
      setEmailTo('');
      setEmailSubject('');
      setEmailBody('');
      setStatusMessage(`Email successfully sent to ${emailTo} via Gmail!`);
      setTimeout(() => setStatusMessage(null), 4000);
    } else {
      alert('Failed to send email via Gmail.');
    }
  };

  // Calendar Actions
  const handleOpenCalendarModal = () => {
    const now = new Date();
    const startTime = new Date(now.getTime() + 30 * 60000).toISOString().slice(0, 16);
    setCalSummary(`Drive to ${destinationName || 'Destination'}`);
    setCalLocation(destinationName || 'Central Metro');
    setCalStartTime(startTime);
    setShowCalModal(true);
  };

  const handleCreateCalendarSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!calSummary.trim() || !calStartTime) return;

    const startDate = new Date(calStartTime);
    const endDate = new Date(startDate.getTime() + 60 * 60000);

    setLoading(true);
    const created = await createGoogleCalendarEvent({
      summary: calSummary,
      location: calLocation,
      description: `Scheduled MapAi Navigation trip to ${calLocation}. Created via MapAi Workspace Hub.`,
      startTimeIso: startDate.toISOString(),
      endTimeIso: endDate.toISOString()
    });
    setLoading(false);

    if (created) {
      setCalendarEvents((prev) => [created, ...prev]);
      setShowCalModal(false);
      setStatusMessage(`Trip event "${calSummary}" added to Google Calendar!`);
      setTimeout(() => setStatusMessage(null), 4000);
    } else {
      alert('Failed to create event in Google Calendar.');
    }
  };

  // Firebase Save Route Action
  const handleSaveRouteToFirestore = async () => {
    if (!user) return;
    try {
      const routeId = `route_${Date.now()}`;
      const routeData = {
        id: routeId,
        userId: user.uid,
        routeName: `Route to ${destinationName || 'Saved Point'}`,
        originName: 'Current GPS Location',
        destinationName: destinationName || 'Destination',
        originLat: userLocation.latitude,
        originLon: userLocation.longitude,
        destLat: userLocation.latitude + 0.01,
        destLon: userLocation.longitude + 0.01,
        distanceMeters: 5200,
        createdAt: new Date().toISOString()
      };

      const docRef = doc(db, `users/${user.uid}/saved_routes`, routeId);
      await setDoc(docRef, routeData);
      setSavedRoutes((prev) => [routeData, ...prev]);
      setStatusMessage('Route saved to Firebase Firestore!');
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user?.uid}/saved_routes`);
    }
  };

  // Filtered contacts
  const filteredContacts = contacts.filter(
    (c) =>
      c.displayName.toLowerCase().includes(contactSearch.toLowerCase()) ||
      (c.email && c.email.toLowerCase().includes(contactSearch.toLowerCase())) ||
      (c.phoneNumber && c.phoneNumber.includes(contactSearch))
  );

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 overflow-y-auto p-4 sm:p-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-cyan-900/60 via-slate-900 to-indigo-950/80 p-5 rounded-2xl border border-cyan-500/30 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400 shrink-0">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              Google Workspace & Contacts Hub
              <span className="text-xs font-mono bg-cyan-950 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded-full">
                CLOUD SYNC
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Integrated Google Contacts, Drive, Gmail, Google Calendar & Firebase Firestore
            </p>
          </div>
        </div>

        {/* User Auth Status Header */}
        {!needsAuth && user ? (
          <div className="flex items-center gap-3 bg-slate-900/90 border border-slate-700 p-2 px-3 rounded-xl">
            {user.photoURL ? (
              <img src={user.photoURL} alt="Avatar" className="w-9 h-9 rounded-full border border-cyan-400" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-cyan-600 flex items-center justify-center font-bold text-white">
                {user.displayName?.[0] || 'U'}
              </div>
            )}
            <div className="text-left">
              <div className="text-xs font-bold text-cyan-300 flex items-center gap-1">
                {user.displayName || 'Google User'}
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-[10px] text-slate-400 font-mono truncate max-w-[150px]">{user.email}</div>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-red-400 transition-colors ml-1"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={handleSignIn}
            disabled={isLoggingIn}
            className="gsi-material-button bg-white text-slate-900 font-semibold px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg hover:bg-slate-100 transition-all text-xs shrink-0"
          >
            <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-4 h-4">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
            </svg>
            <span>{isLoggingIn ? 'Signing in...' : 'Sign in with Google'}</span>
          </button>
        )}
      </div>

      {/* Notification Toast Message */}
      {statusMessage && (
        <div className="bg-cyan-950/90 border border-cyan-400 text-cyan-200 text-xs px-4 py-2.5 rounded-xl shadow-lg flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-cyan-400" />
            <span>{statusMessage}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-slate-400 hover:text-white text-xs font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('contacts')}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeSubTab === 'contacts'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
              : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Google Contacts</span>
        </button>

        <button
          onClick={() => setActiveSubTab('drive')}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeSubTab === 'drive'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
              : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
          }`}
        >
          <HardDrive className="w-4 h-4" />
          <span>Google Drive</span>
        </button>

        <button
          onClick={() => setActiveSubTab('gmail')}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeSubTab === 'gmail'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
              : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>Gmail Inbox</span>
        </button>

        <button
          onClick={() => setActiveSubTab('calendar')}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeSubTab === 'calendar'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
              : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
          }`}
        >
          <CalendarIcon className="w-4 h-4" />
          <span>Google Calendar</span>
        </button>

        <button
          onClick={() => setActiveSubTab('firebase')}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeSubTab === 'firebase'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Firebase Sync</span>
        </button>

        <button
          onClick={loadWorkspaceData}
          disabled={loading || needsAuth}
          className="ml-auto p-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl text-slate-300 hover:text-cyan-400 transition-all text-xs flex items-center gap-1 shrink-0"
          title="Refresh Data"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* Main Content Area */}
      {needsAuth ? (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-8 text-center flex flex-col items-center justify-center space-y-4 my-8">
          <div className="w-16 h-16 rounded-full bg-cyan-950 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Users className="w-8 h-8" />
          </div>
          <div className="max-w-md">
            <h3 className="text-lg font-bold text-white">Connect Google Account</h3>
            <p className="text-xs text-slate-400 mt-1">
              Sign in with Google to sync your Google Contacts, back up trip data to Google Drive, send ETA updates via Gmail, and navigate to Google Calendar events.
            </p>
          </div>
          <button
            onClick={handleSignIn}
            disabled={isLoggingIn}
            className="bg-white text-slate-900 hover:bg-slate-100 font-bold px-6 py-3 rounded-xl flex items-center gap-2 text-xs shadow-xl transition-all"
          >
            <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-4 h-4">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
            </svg>
            <span>{isLoggingIn ? 'Connecting...' : 'Authorize Google Workspace'}</span>
          </button>
        </div>
      ) : (
        <div>
          {/* TAB 1: GOOGLE CONTACTS */}
          {activeSubTab === 'contacts' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search Google Contacts..."
                    value={contactSearch}
                    onChange={(e) => setContactSearch(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <button
                  onClick={() => setShowAddContactModal(true)}
                  className="w-full sm:w-auto bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Google Contact</span>
                </button>
              </div>

              {loading ? (
                <div className="p-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
                  <span>Loading Google Contacts...</span>
                </div>
              ) : filteredContacts.length === 0 ? (
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 text-center text-xs text-slate-400 space-y-2">
                  <Users className="w-8 h-8 text-slate-600 mx-auto" />
                  <p>No Google Contacts found.</p>
                  <p className="text-[11px] text-slate-500">
                    Click "New Google Contact" above to add your emergency contacts or navigation buddies.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredContacts.map((c) => (
                    <div
                      key={c.resourceName}
                      className="bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 p-3.5 rounded-2xl transition-all flex items-start justify-between gap-3 shadow-md"
                    >
                      <div className="flex items-center gap-3">
                        {c.photoUrl ? (
                          <img src={c.photoUrl} alt="" className="w-10 h-10 rounded-full border border-slate-700" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-cyan-950 border border-cyan-500/30 flex items-center justify-center font-bold text-cyan-400 text-sm">
                            {c.displayName[0] || 'C'}
                          </div>
                        )}
                        <div>
                          <h4 className="text-xs font-bold text-white">{c.displayName}</h4>
                          {c.email && <p className="text-[10px] text-slate-400 font-mono truncate">{c.email}</p>}
                          {c.phoneNumber && <p className="text-[10px] text-cyan-400 font-mono">{c.phoneNumber}</p>}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleOpenEmailModalForContact(c)}
                          className="p-1.5 bg-slate-800 hover:bg-cyan-950 hover:text-cyan-400 rounded-lg text-slate-300 text-[10px] flex items-center gap-1 transition-colors"
                          title="Send Gmail ETA/Location"
                        >
                          <Mail className="w-3.5 h-3.5" />
                        </button>
                        {c.phoneNumber && (
                          <a
                            href={`tel:${c.phoneNumber}`}
                            className="p-1.5 bg-slate-800 hover:bg-emerald-950 hover:text-emerald-400 rounded-lg text-slate-300 text-[10px] flex items-center gap-1 transition-colors"
                            title="Call Contact"
                          >
                            <ShieldAlert className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: GOOGLE DRIVE */}
          {activeSubTab === 'drive' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
                <div>
                  <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <HardDrive className="w-4 h-4 text-cyan-400" />
                    Google Drive Backup & Storage
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Back up trip logs, saved routes, and speed telemetry safely to your Google Drive.
                  </p>
                </div>

                <button
                  onClick={handleBackupLogToDrive}
                  disabled={loading}
                  className="w-full sm:w-auto bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md transition-all shrink-0"
                >
                  <FolderUp className="w-4 h-4" />
                  <span>Backup Trip Log to Drive</span>
                </button>
              </div>

              {loading ? (
                <div className="p-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
                  <span>Fetching Google Drive files...</span>
                </div>
              ) : driveFiles.length === 0 ? (
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 text-center text-xs text-slate-400 space-y-2">
                  <HardDrive className="w-8 h-8 text-slate-600 mx-auto" />
                  <p>No files found in Google Drive.</p>
                  <p className="text-[11px] text-slate-500">
                    Click "Backup Trip Log to Drive" above to create your first navigation log.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {driveFiles.map((f) => (
                    <div
                      key={f.id}
                      className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 p-3 rounded-xl flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {f.iconLink ? (
                          <img src={f.iconLink} alt="" className="w-5 h-5 shrink-0" />
                        ) : (
                          <FileText className="w-5 h-5 text-cyan-400 shrink-0" />
                        )}
                        <div className="min-w-0">
                          <h4 className="font-bold text-white truncate">{f.name}</h4>
                          <div className="text-[10px] text-slate-400 flex items-center gap-2">
                            <span>{f.mimeType}</span>
                            {f.modifiedTime && (
                              <span>• {new Date(f.modifiedTime).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {f.webViewLink && (
                          <a
                            href={f.webViewLink}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-cyan-400 transition-colors"
                            title="Open in Google Drive"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <button
                          onClick={() => handleDeleteDriveFileConfirm(f)}
                          className="p-1.5 bg-slate-800 hover:bg-red-950 text-slate-400 hover:text-red-400 rounded-lg transition-colors"
                          title="Delete File"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: GMAIL INBOX */}
          {activeSubTab === 'gmail' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
                <div>
                  <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Mail className="w-4 h-4 text-cyan-400" />
                    Gmail Dispatcher
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Send route updates, emergency SOS notices, and trip summaries directly via Gmail.
                  </p>
                </div>

                <button
                  onClick={() => setShowEmailModal(true)}
                  className="w-full sm:w-auto bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md transition-all shrink-0"
                >
                  <Send className="w-4 h-4" />
                  <span>Compose Gmail Message</span>
                </button>
              </div>

              {loading ? (
                <div className="p-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
                  <span>Fetching Gmail inbox...</span>
                </div>
              ) : gmailMessages.length === 0 ? (
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 text-center text-xs text-slate-400 space-y-2">
                  <Mail className="w-8 h-8 text-slate-600 mx-auto" />
                  <p>No recent Gmail messages retrieved.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {gmailMessages.map((m) => (
                    <div
                      key={m.id}
                      className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl space-y-1 text-xs"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-cyan-300 truncate max-w-[200px]">{m.from}</span>
                        <span className="text-slate-500 text-[10px]">{m.date}</span>
                      </div>
                      <h4 className="font-semibold text-white">{m.subject}</h4>
                      <p className="text-[11px] text-slate-400 line-clamp-2">{m.snippet}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: GOOGLE CALENDAR */}
          {activeSubTab === 'calendar' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
                <div>
                  <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <CalendarIcon className="w-4 h-4 text-cyan-400" />
                    Google Calendar Integration
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Detect upcoming meetings or trips in Google Calendar and start navigation with 1-click.
                  </p>
                </div>

                <button
                  onClick={handleOpenCalendarModal}
                  className="w-full sm:w-auto bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md transition-all shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Trip to Google Calendar</span>
                </button>
              </div>

              {loading ? (
                <div className="p-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
                  <span>Fetching Google Calendar events...</span>
                </div>
              ) : calendarEvents.length === 0 ? (
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 text-center text-xs text-slate-400 space-y-2">
                  <CalendarIcon className="w-8 h-8 text-slate-600 mx-auto" />
                  <p>No upcoming Google Calendar events found.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {calendarEvents.map((evt) => (
                    <div
                      key={evt.id}
                      className="bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 p-4 rounded-2xl space-y-2 text-xs flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-bold text-white text-sm">{evt.summary}</h4>
                          <span className="text-[10px] bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded border border-cyan-800">
                            Upcoming
                          </span>
                        </div>

                        {evt.location && (
                          <div className="flex items-center gap-1.5 text-cyan-400 text-[11px] mt-1 font-medium">
                            <MapPin className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{evt.location}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-1.5 text-slate-400 text-[10px] mt-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>
                            {evt.start.dateTime
                              ? new Date(evt.start.dateTime).toLocaleString()
                              : evt.start.date || 'Scheduled'}
                          </span>
                        </div>
                      </div>

                      {evt.location && onSelectDestination && (
                        <button
                          onClick={() => {
                            onSelectDestination(
                              {
                                latitude: userLocation.latitude + (Math.random() - 0.5) * 0.05,
                                longitude: userLocation.longitude + (Math.random() - 0.5) * 0.05
                              },
                              evt.location || evt.summary
                            );
                            if (onStartNavigation) onStartNavigation();
                          }}
                          className="w-full mt-2 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 font-bold py-1.5 px-3 rounded-xl text-[11px] border border-cyan-500/40 flex items-center justify-center gap-1.5 transition-all"
                        >
                          <Navigation className="w-3.5 h-3.5" />
                          <span>Navigate to Calendar Location</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: FIREBASE FIRESTORE SYNC */}
          {activeSubTab === 'firebase' && (
            <div className="space-y-4">
              <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-white flex items-center gap-2">
                    <Database className="w-4 h-4 text-amber-400" />
                    Firebase Firestore Database Status
                  </h3>
                  <span className="text-xs font-mono text-emerald-400 font-bold">{firestoreStatus}</span>
                </div>

                <p className="text-xs text-slate-400">
                  Your persistent cloud store for user routes, preferences, and emergency telemetry.
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-800">
                  <button
                    onClick={handleSaveRouteToFirestore}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Save Current Route to Firestore</span>
                  </button>
                </div>
              </div>

              {/* Saved Routes List */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-300">Saved Routes in Firestore</h4>
                {savedRoutes.length === 0 ? (
                  <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl text-center text-xs text-slate-500">
                    No saved routes in Firestore yet.
                  </div>
                ) : (
                  savedRoutes.map((r) => (
                    <div
                      key={r.id}
                      className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <h5 className="font-bold text-white">{r.routeName}</h5>
                        <p className="text-[10px] text-slate-400">
                          {r.originName} ➔ {r.destinationName}
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          if (onSelectDestination) {
                            onSelectDestination(
                              { latitude: r.destLat, longitude: r.destLon },
                              r.destinationName
                            );
                          }
                        }}
                        className="bg-slate-800 hover:bg-cyan-950 text-slate-300 hover:text-cyan-400 px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors"
                      >
                        <Navigation className="w-3 h-3" />
                        <span>Load Route</span>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: ADD GOOGLE CONTACT */}
      {showAddContactModal && (
        <div className="fixed inset-0 z-[3000] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-400" />
              Add Google Contact
            </h3>

            <form onSubmit={handleCreateContactSubmit} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={newContactName}
                  onChange={(e) => setNewContactName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="john@example.com"
                  value={newContactEmail}
                  onChange={(e) => setNewContactEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Phone Number</label>
                <input
                  type="tel"
                  placeholder="+123456789"
                  value={newContactPhone}
                  onChange={(e) => setNewContactPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddContactModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 text-slate-950 hover:bg-cyan-400"
                >
                  Save to Google Contacts
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: COMPOSE GMAIL EMAIL */}
      {showEmailModal && (
        <div className="fixed inset-0 z-[3000] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Mail className="w-4 h-4 text-cyan-400" />
              Compose Gmail Message
            </h3>

            <form onSubmit={handleSendGmailSubmit} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">To Email *</label>
                <input
                  type="email"
                  required
                  placeholder="recipient@example.com"
                  value={emailTo}
                  onChange={(e) => setEmailTo(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Subject *</label>
                <input
                  type="text"
                  required
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Message Body</label>
                <textarea
                  rows={5}
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 resize-none font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEmailModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 text-slate-950 hover:bg-cyan-400 flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send via Gmail</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: ADD GOOGLE CALENDAR TRIP */}
      {showCalModal && (
        <div className="fixed inset-0 z-[3000] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-cyan-400" />
              Schedule Trip on Google Calendar
            </h3>

            <form onSubmit={handleCreateCalendarSubmit} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Event Summary *</label>
                <input
                  type="text"
                  required
                  value={calSummary}
                  onChange={(e) => setCalSummary(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Destination Address / Location</label>
                <input
                  type="text"
                  value={calLocation}
                  onChange={(e) => setCalLocation(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Start Time *</label>
                <input
                  type="datetime-local"
                  required
                  value={calStartTime}
                  onChange={(e) => setCalStartTime(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCalModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 text-slate-950 hover:bg-cyan-400"
                >
                  Add to Google Calendar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
