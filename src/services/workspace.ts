import {
  signInWithPopup,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { auth, googleWorkspaceProvider } from '../lib/firebase';

let cachedAccessToken: string | null = null;
let isSigningIn = false;

// Initialize Workspace Auth State Listener
export const initWorkspaceAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // Cached token lost on refresh or restart
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Sign in with Google Workspace & obtain OAuth Access Token
export const signInWithGoogleWorkspace = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, googleWorkspaceProvider);
    // Extract OAuth access token
    const credential = (result as any)._tokenResponse?.oauthAccessToken
      ? { accessToken: (result as any)._tokenResponse.oauthAccessToken }
      : (result as any).credential || null;

    const token = (result as any)._tokenResponse?.oauthAccessToken || (result as any)._tokenResponse?.idToken || (credential as any)?.accessToken;

    if (!token) {
      throw new Error('Could not retrieve Google OAuth access token');
    }

    cachedAccessToken = token;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Workspace Sign In Error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getWorkspaceAccessToken = (): string | null => {
  return cachedAccessToken;
};

export const setWorkspaceAccessToken = (token: string) => {
  cachedAccessToken = token;
};

export const logoutWorkspace = async () => {
  await auth.signOut();
  cachedAccessToken = null;
};

// ==========================================
// 1. GOOGLE CONTACTS (People API)
// ==========================================

export interface GoogleContact {
  resourceName: string;
  displayName: string;
  email?: string;
  phoneNumber?: string;
  photoUrl?: string;
}

export async function fetchGoogleContacts(token?: string): Promise<GoogleContact[]> {
  const accessToken = token || cachedAccessToken;
  if (!accessToken) return [];

  try {
    const res = await fetch(
      'https://people.googleapis.com/v1/people/me/connections?personFields=names,emailAddresses,phoneNumbers,photos&pageSize=100',
      {
        headers: { Authorization: `Bearer ${accessToken}` }
      }
    );

    if (res.ok) {
      const data = await res.json();
      const connections = data.connections || [];
      return connections.map((person: any) => {
        const nameObj = person.names && person.names[0];
        const emailObj = person.emailAddresses && person.emailAddresses[0];
        const phoneObj = person.phoneNumbers && person.phoneNumbers[0];
        const photoObj = person.photos && person.photos[0];

        return {
          resourceName: person.resourceName,
          displayName: nameObj ? nameObj.displayName : 'Unnamed Contact',
          email: emailObj ? emailObj.value : undefined,
          phoneNumber: phoneObj ? phoneObj.value : undefined,
          photoUrl: photoObj ? photoObj.url : undefined
        };
      });
    }
  } catch (err) {
    console.error('Fetch Google Contacts error:', err);
  }
  return [];
}

export async function createGoogleContact(
  name: string,
  email?: string,
  phone?: string,
  token?: string
): Promise<GoogleContact | null> {
  const accessToken = token || cachedAccessToken;
  if (!accessToken) return null;

  try {
    const payload: any = {
      names: [{ givenName: name }]
    };
    if (email) payload.emailAddresses = [{ value: email }];
    if (phone) payload.phoneNumbers = [{ value: phone }];

    const res = await fetch('https://people.googleapis.com/v1/people:createContact', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      const person = await res.json();
      return {
        resourceName: person.resourceName,
        displayName: person.names?.[0]?.displayName || name,
        email: person.emailAddresses?.[0]?.value,
        phoneNumber: person.phoneNumbers?.[0]?.value
      };
    }
  } catch (err) {
    console.error('Create contact error:', err);
  }
  return null;
}

// ==========================================
// 2. GOOGLE DRIVE API
// ==========================================

export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  webViewLink?: string;
  iconLink?: string;
  size?: string;
}

export async function fetchGoogleDriveFiles(token?: string): Promise<GoogleDriveFile[]> {
  const accessToken = token || cachedAccessToken;
  if (!accessToken) return [];

  try {
    const res = await fetch(
      'https://www.googleapis.com/drive/v3/files?pageSize=30&fields=files(id,name,mimeType,modifiedTime,webViewLink,iconLink,size)&orderBy=modifiedTime%20desc',
      {
        headers: { Authorization: `Bearer ${accessToken}` }
      }
    );

    if (res.ok) {
      const data = await res.json();
      return data.files || [];
    }
  } catch (err) {
    console.error('Fetch Google Drive files error:', err);
  }
  return [];
}

export async function uploadToGoogleDrive(
  filename: string,
  content: string,
  mimeType = 'text/plain',
  token?: string
): Promise<GoogleDriveFile | null> {
  const accessToken = token || cachedAccessToken;
  if (!accessToken) return null;

  try {
    const metadata = {
      name: filename,
      mimeType: mimeType
    };

    const boundary = '-------314159265358979323846';
    const delimiter = "\r\n--" + boundary + "\r\n";
    const close_delim = "\r\n--" + boundary + "--";

    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: ' + mimeType + '\r\n\r\n' +
      content +
      close_delim;

    const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary="${boundary}"`
      },
      body: multipartRequestBody
    });

    if (res.ok) {
      const file = await res.json();
      return file;
    }
  } catch (err) {
    console.error('Upload to Google Drive error:', err);
  }
  return null;
}

export async function deleteGoogleDriveFile(fileId: string, token?: string): Promise<boolean> {
  const accessToken = token || cachedAccessToken;
  if (!accessToken) return false;

  try {
    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    return res.ok;
  } catch (err) {
    console.error('Delete Google Drive file error:', err);
    return false;
  }
}

// ==========================================
// 3. GMAIL API
// ==========================================

export interface GmailMessageItem {
  id: string;
  snippet?: string;
  subject?: string;
  from?: string;
  date?: string;
}

export async function fetchGmailMessages(token?: string): Promise<GmailMessageItem[]> {
  const accessToken = token || cachedAccessToken;
  if (!accessToken) return [];

  try {
    const listRes = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=15',
      {
        headers: { Authorization: `Bearer ${accessToken}` }
      }
    );

    if (!listRes.ok) return [];
    const listData = await listRes.json();
    const messages = listData.messages || [];

    const detailedMessages: GmailMessageItem[] = [];

    for (const msg of messages.slice(0, 10)) {
      const detailRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
        {
          headers: { Authorization: `Bearer ${accessToken}` }
        }
      );
      if (detailRes.ok) {
        const detail = await detailRes.json();
        const headers = detail.payload?.headers || [];
        const subject = headers.find((h: any) => h.name.toLowerCase() === 'subject')?.value || 'No Subject';
        const from = headers.find((h: any) => h.name.toLowerCase() === 'from')?.value || 'Unknown Sender';
        const date = headers.find((h: any) => h.name.toLowerCase() === 'date')?.value || '';

        detailedMessages.push({
          id: detail.id,
          snippet: detail.snippet,
          subject,
          from,
          date
        });
      }
    }

    return detailedMessages;
  } catch (err) {
    console.error('Fetch Gmail messages error:', err);
  }
  return [];
}

export async function sendGmailEmail(
  to: string,
  subject: string,
  body: string,
  token?: string
): Promise<boolean> {
  const accessToken = token || cachedAccessToken;
  if (!accessToken) return false;

  try {
    const emailLines = [
      `To: ${to}`,
      'Content-Type: text/plain; charset=utf-8',
      'MIME-Version: 1.0',
      `Subject: ${subject}`,
      '',
      body
    ];

    const rawEmail = emailLines.join('\r\n');
    const encodedEmail = btoa(unescape(encodeURIComponent(rawEmail)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ raw: encodedEmail })
    });

    return res.ok;
  } catch (err) {
    console.error('Send Gmail error:', err);
    return false;
  }
}

// ==========================================
// 4. GOOGLE CALENDAR API
// ==========================================

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  location?: string;
  description?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  htmlLink?: string;
}

export async function fetchGoogleCalendarEvents(token?: string): Promise<GoogleCalendarEvent[]> {
  const accessToken = token || cachedAccessToken;
  if (!accessToken) return [];

  try {
    const nowIso = new Date().toISOString();
    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(
        nowIso
      )}&singleEvents=true&orderBy=startTime&maxResults=20`,
      {
        headers: { Authorization: `Bearer ${accessToken}` }
      }
    );

    if (res.ok) {
      const data = await res.json();
      return (data.items || []).map((item: any) => ({
        id: item.id,
        summary: item.summary || 'Scheduled Trip / Event',
        location: item.location,
        description: item.description,
        start: item.start || {},
        end: item.end || {},
        htmlLink: item.htmlLink
      }));
    }
  } catch (err) {
    console.error('Fetch Google Calendar events error:', err);
  }
  return [];
}

export async function createGoogleCalendarEvent(
  eventData: {
    summary: string;
    location?: string;
    description?: string;
    startTimeIso: string;
    endTimeIso: string;
  },
  token?: string
): Promise<GoogleCalendarEvent | null> {
  const accessToken = token || cachedAccessToken;
  if (!accessToken) return null;

  try {
    const payload = {
      summary: eventData.summary,
      location: eventData.location,
      description: eventData.description,
      start: { dateTime: eventData.startTimeIso },
      end: { dateTime: eventData.endTimeIso }
    };

    const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.error('Create Google Calendar event error:', err);
  }
  return null;
}
