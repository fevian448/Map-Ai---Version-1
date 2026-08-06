// GitLab REST API v4 Integration Service

export interface GitLabUser {
  id: number;
  username: string;
  name: string;
  avatar_url: string;
  web_url: string;
  email?: string;
  bio?: string;
}

export interface GitLabProject {
  id: number;
  name: string;
  name_with_namespace: string;
  description: string;
  web_url: string;
  star_count: number;
  forks_count: number;
  open_issues_count: number;
  default_branch: string;
  last_activity_at: string;
  visibility: string;
}

export interface GitLabIssue {
  id: number;
  iid: number;
  project_id: number;
  title: string;
  description: string;
  state: 'opened' | 'closed';
  created_at: string;
  updated_at: string;
  web_url: string;
  author: {
    name: string;
    username: string;
    avatar_url: string;
  };
}

export interface GitLabCommit {
  id: string;
  short_id: string;
  title: string;
  author_name: string;
  author_email: string;
  created_at: string;
  web_url: string;
  message: string;
}

export interface GitLabPipeline {
  id: number;
  project_id: number;
  status: 'running' | 'pending' | 'success' | 'failed' | 'canceled' | 'skipped';
  ref: string;
  sha: string;
  web_url: string;
  created_at: string;
  updated_at: string;
}

const GITLAB_STORAGE_TOKEN_KEY = 'mapai_gitlab_token';
const GITLAB_STORAGE_CLIENT_ID_KEY = 'mapai_gitlab_client_id';

export const getStoredGitLabToken = (): string | null => {
  return localStorage.getItem(GITLAB_STORAGE_TOKEN_KEY);
};

export const setStoredGitLabToken = (token: string) => {
  localStorage.setItem(GITLAB_STORAGE_TOKEN_KEY, token);
};

export const removeStoredGitLabToken = () => {
  localStorage.removeItem(GITLAB_STORAGE_TOKEN_KEY);
};

export const getStoredGitLabClientId = (): string | null => {
  return localStorage.getItem(GITLAB_STORAGE_CLIENT_ID_KEY);
};

export const setStoredGitLabClientId = (clientId: string) => {
  localStorage.setItem(GITLAB_STORAGE_CLIENT_ID_KEY, clientId);
};

// Fetch current GitLab user profile
export async function fetchGitLabUser(token: string): Promise<GitLabUser | null> {
  try {
    const res = await fetch('https://gitlab.com/api/v4/user', {
      headers: {
        'PRIVATE-TOKEN': token.startsWith('glpat-') || token.length < 50 ? token : '',
        Authorization: token.startsWith('glpat-') ? undefined as any : `Bearer ${token}`
      }
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.error('Fetch GitLab user error:', err);
  }
  return null;
}

// Fetch user projects
export async function fetchGitLabProjects(token: string): Promise<GitLabProject[]> {
  try {
    const headers: Record<string, string> = token.startsWith('glpat-')
      ? { 'PRIVATE-TOKEN': token }
      : { Authorization: `Bearer ${token}` };

    const res = await fetch('https://gitlab.com/api/v4/projects?membership=true&order_by=updated_at&per_page=20', {
      headers
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.error('Fetch GitLab projects error:', err);
  }
  return [];
}

// Fetch issues for a project
export async function fetchGitLabIssues(token: string, projectId: number): Promise<GitLabIssue[]> {
  try {
    const headers: Record<string, string> = token.startsWith('glpat-')
      ? { 'PRIVATE-TOKEN': token }
      : { Authorization: `Bearer ${token}` };

    const res = await fetch(`https://gitlab.com/api/v4/projects/${projectId}/issues?per_page=20&order_by=updated_at`, {
      headers
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.error('Fetch GitLab issues error:', err);
  }
  return [];
}

// Create a new issue in a project
export async function createGitLabIssue(
  token: string,
  projectId: number,
  title: string,
  description: string,
  labels = 'mapai,navigation,telemetry'
): Promise<GitLabIssue | null> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(token.startsWith('glpat-') ? { 'PRIVATE-TOKEN': token } : { Authorization: `Bearer ${token}` })
    };

    const res = await fetch(`https://gitlab.com/api/v4/projects/${projectId}/issues`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        title,
        description,
        labels
      })
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.error('Create GitLab issue error:', err);
  }
  return null;
}

// Fetch commits for a project
export async function fetchGitLabCommits(token: string, projectId: number): Promise<GitLabCommit[]> {
  try {
    const headers: Record<string, string> = token.startsWith('glpat-')
      ? { 'PRIVATE-TOKEN': token }
      : { Authorization: `Bearer ${token}` };

    const res = await fetch(`https://gitlab.com/api/v4/projects/${projectId}/repository/commits?per_page=15`, {
      headers
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.error('Fetch GitLab commits error:', err);
  }
  return [];
}

// Fetch CI/CD pipelines for a project
export async function fetchGitLabPipelines(token: string, projectId: number): Promise<GitLabPipeline[]> {
  try {
    const headers: Record<string, string> = token.startsWith('glpat-')
      ? { 'PRIVATE-TOKEN': token }
      : { Authorization: `Bearer ${token}` };

    const res = await fetch(`https://gitlab.com/api/v4/projects/${projectId}/pipelines?per_page=10`, {
      headers
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.error('Fetch GitLab pipelines error:', err);
  }
  return [];
}

// Trigger a pipeline run
export async function triggerGitLabPipeline(
  token: string,
  projectId: number,
  ref = 'main'
): Promise<GitLabPipeline | null> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(token.startsWith('glpat-') ? { 'PRIVATE-TOKEN': token } : { Authorization: `Bearer ${token}` })
    };

    const res = await fetch(`https://gitlab.com/api/v4/projects/${projectId}/pipeline?ref=${encodeURIComponent(ref)}`, {
      method: 'POST',
      headers
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.error('Trigger GitLab pipeline error:', err);
  }
  return null;
}

// Create a GitLab Snippet (Paste/Code backup)
export async function createGitLabSnippet(
  token: string,
  title: string,
  filename: string,
  content: string,
  visibility: 'private' | 'internal' | 'public' = 'private'
): Promise<{ id: number; web_url: string } | null> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(token.startsWith('glpat-') ? { 'PRIVATE-TOKEN': token } : { Authorization: `Bearer ${token}` })
    };

    const res = await fetch('https://gitlab.com/api/v4/snippets', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        title,
        visibility,
        files: [
          {
            file_path: filename,
            content
          }
        ]
      })
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.error('Create GitLab snippet error:', err);
  }
  return null;
}
