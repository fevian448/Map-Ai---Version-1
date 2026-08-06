import React, { useState, useEffect } from 'react';
import {
  GitLabUser,
  GitLabProject,
  GitLabIssue,
  GitLabCommit,
  GitLabPipeline,
  getStoredGitLabToken,
  setStoredGitLabToken,
  removeStoredGitLabToken,
  getStoredGitLabClientId,
  setStoredGitLabClientId,
  fetchGitLabUser,
  fetchGitLabProjects,
  fetchGitLabIssues,
  createGitLabIssue,
  fetchGitLabCommits,
  fetchGitLabPipelines,
  triggerGitLabPipeline,
  createGitLabSnippet
} from '../services/gitlab';
import {
  Gitlab,
  FolderGit2,
  AlertCircle,
  GitCommit,
  PlayCircle,
  FileCode,
  Key,
  ExternalLink,
  CheckCircle2,
  RefreshCw,
  LogOut,
  Plus,
  Send,
  Search,
  Sparkles,
  Copy,
  Check,
  Shield,
  Layers,
  MapPin,
  Clock,
  Terminal,
  Share2
} from 'lucide-react';
import { GeoPoint, SettingsState } from '../types';

interface GitLabHubProps {
  userLocation: GeoPoint;
  destinationName?: string;
  settings: SettingsState;
}

const DEV_CALLBACK_URL = 'https://ais-dev-i7wgpqjo73nkxcaomsxe3m-318892947207.asia-southeast1.run.app/auth/gitlab/callback';
const SHARED_CALLBACK_URL = 'https://ais-pre-i7wgpqjo73nkxcaomsxe3m-318892947207.asia-southeast1.run.app/auth/gitlab/callback';

export function GitLabHub({ userLocation, destinationName, settings }: GitLabHubProps) {
  const [token, setToken] = useState<string | null>(getStoredGitLabToken());
  const [clientId, setClientId] = useState<string>(getStoredGitLabClientId() || '');
  const [patInput, setPatInput] = useState<string>('');
  
  const [user, setUser] = useState<GitLabUser | null>(null);
  const [projects, setProjects] = useState<GitLabProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<GitLabProject | null>(null);

  const [activeTab, setActiveTab] = useState<'projects' | 'issues' | 'commits' | 'pipelines' | 'export' | 'config'>('projects');

  // Data states
  const [issues, setIssues] = useState<GitLabIssue[]>([]);
  const [commits, setCommits] = useState<GitLabCommit[]>([]);
  const [pipelines, setPipelines] = useState<GitLabPipeline[]>([]);
  const [projectSearch, setProjectSearch] = useState<string>('');

  // Modals & form state
  const [loading, setLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  // New issue modal
  const [showIssueModal, setShowIssueModal] = useState<boolean>(false);
  const [issueTitle, setIssueTitle] = useState<string>('');
  const [issueDesc, setIssueDesc] = useState<string>('');

  // Snippet modal
  const [snippetTitle, setSnippetTitle] = useState<string>('MapAi_Navigation_Telemetry.json');

  // Load user data when token changes
  useEffect(() => {
    if (token) {
      loadGitLabData(token);
    } else {
      setUser(null);
      setProjects([]);
      setSelectedProject(null);
    }
  }, [token]);

  // Handle OAuth message callback from popup
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'GITLAB_OAUTH_SUCCESS' && event.data?.token) {
        const receivedToken = event.data.token;
        setStoredGitLabToken(receivedToken);
        setToken(receivedToken);
        setStatusMessage('Successfully connected to GitLab via OAuth!');
        setTimeout(() => setStatusMessage(null), 3000);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const loadGitLabData = async (activeToken: string) => {
    setLoading(true);
    setStatusMessage('Syncing with GitLab REST API...');
    try {
      const u = await fetchGitLabUser(activeToken);
      if (u) {
        setUser(u);
        const pList = await fetchGitLabProjects(activeToken);
        setProjects(pList);
        if (pList.length > 0 && !selectedProject) {
          setSelectedProject(pList[0]);
        }
      } else {
        setStatusMessage('Invalid GitLab Token or Session expired.');
        setTimeout(() => setStatusMessage(null), 3000);
      }
    } catch (err) {
      console.error('GitLab Load Error:', err);
    } finally {
      setLoading(false);
      setStatusMessage(null);
    }
  };

  // Load details for selected project
  useEffect(() => {
    if (token && selectedProject) {
      loadProjectDetails(token, selectedProject.id);
    }
  }, [selectedProject, token]);

  const loadProjectDetails = async (activeToken: string, projectId: number) => {
    setLoading(true);
    try {
      if (activeTab === 'issues') {
        const iList = await fetchGitLabIssues(activeToken, projectId);
        setIssues(iList);
      } else if (activeTab === 'commits') {
        const cList = await fetchGitLabCommits(activeToken, projectId);
        setCommits(cList);
      } else if (activeTab === 'pipelines') {
        const pList = await fetchGitLabPipelines(activeToken, projectId);
        setPipelines(pList);
      }
    } catch (err) {
      console.error('Load project details error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch project details when tab changes
  useEffect(() => {
    if (token && selectedProject) {
      loadProjectDetails(token, selectedProject.id);
    }
  }, [activeTab]);

  // PAT Login
  const handleSavePat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patInput.trim()) return;

    const testToken = patInput.trim();
    setLoading(true);
    const u = await fetchGitLabUser(testToken);
    setLoading(false);

    if (u) {
      setStoredGitLabToken(testToken);
      setToken(testToken);
      setUser(u);
      setPatInput('');
      setStatusMessage(`Logged in as @${u.username} (${u.name})`);
      setTimeout(() => setStatusMessage(null), 3000);
    } else {
      alert('Failed to authenticate with GitLab. Please check your Personal Access Token.');
    }
  };

  // OAuth Launch Flow
  const handleOAuthLogin = () => {
    if (!clientId.trim()) {
      alert('Please enter your GitLab Application Client ID first.');
      setActiveTab('config');
      return;
    }
    setStoredGitLabClientId(clientId);

    const redirectUri = window.location.origin.includes('localhost')
      ? `${window.location.origin}/auth/gitlab/callback`
      : DEV_CALLBACK_URL;

    const oauthUrl = `https://gitlab.com/oauth/authorize?client_id=${encodeURIComponent(
      clientId
    )}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&response_type=token&scope=api+read_user+read_repository`;

    const authWindow = window.open(oauthUrl, 'gitlab_oauth_popup', 'width=600,height=700');
    if (!authWindow) {
      alert('Popup blocked! Please allow popups for this site to complete GitLab OAuth.');
    }
  };

  const handleLogout = () => {
    removeStoredGitLabToken();
    setToken(null);
    setUser(null);
    setProjects([]);
    setSelectedProject(null);
  };

  // Create Issue
  const handleCreateIssueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedProject || !issueTitle.trim()) return;

    setLoading(true);
    const newI = await createGitLabIssue(
      token,
      selectedProject.id,
      issueTitle,
      issueDesc || `Reported from MapAi GPS Navigation\n- Location: (${userLocation.latitude}, ${userLocation.longitude})\n- Destination: ${destinationName || 'None'}`
    );
    setLoading(false);

    if (newI) {
      setIssues((prev) => [newI, ...prev]);
      setShowIssueModal(false);
      setIssueTitle('');
      setIssueDesc('');
      setStatusMessage(`GitLab Issue #${newI.iid} created successfully!`);
      setTimeout(() => setStatusMessage(null), 4000);
    } else {
      alert('Failed to create GitLab issue.');
    }
  };

  // Trigger Pipeline
  const handleTriggerPipeline = async () => {
    if (!token || !selectedProject) return;

    const confirmed = window.confirm(`Trigger new CI/CD pipeline on default branch "${selectedProject.default_branch}"?`);
    if (!confirmed) return;

    setLoading(true);
    const triggered = await triggerGitLabPipeline(token, selectedProject.id, selectedProject.default_branch);
    setLoading(false);

    if (triggered) {
      setPipelines((prev) => [triggered, ...prev]);
      setStatusMessage(`Pipeline #${triggered.id} triggered on ${triggered.ref}`);
      setTimeout(() => setStatusMessage(null), 4000);
    } else {
      alert('Failed to trigger GitLab pipeline.');
    }
  };

  // Create Snippet Export
  const handleExportSnippet = async () => {
    if (!token) return;

    const telemetryData = JSON.stringify(
      {
        app: 'MapAi Navigation App',
        timestamp: new Date().toISOString(),
        currentLocation: userLocation,
        destination: destinationName || 'Unset',
        language: settings.language,
        speedUnit: settings.speedUnit,
        voiceGuidance: settings.voiceGuidance
      },
      null,
      2
    );

    setLoading(true);
    const res = await createGitLabSnippet(
      token,
      `MapAi Trip Export ${new Date().toLocaleDateString()}`,
      snippetTitle,
      telemetryData,
      'private'
    );
    setLoading(false);

    if (res) {
      setStatusMessage(`Exported snippet to GitLab: ${res.web_url}`);
      setTimeout(() => setStatusMessage(null), 5000);
    } else {
      alert('Failed to create GitLab Snippet.');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUrl(text);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const filteredProjects = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(projectSearch.toLowerCase()) ||
      p.name_with_namespace.toLowerCase().includes(projectSearch.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 overflow-y-auto p-4 sm:p-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-orange-950/70 via-slate-900 to-amber-950/80 p-5 rounded-2xl border border-orange-500/30 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-500/20 border border-orange-400/40 flex items-center justify-center text-orange-400 shrink-0">
            <Gitlab className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              GitLab Cloud Integration
              <span className="text-xs font-mono bg-orange-950 text-orange-300 border border-orange-500/40 px-2 py-0.5 rounded-full">
                REST API v4
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Connect MapAi with GitLab repositories, issues, commits, pipelines, and snippets.
            </p>
          </div>
        </div>

        {/* User Auth Info */}
        {user ? (
          <div className="flex items-center gap-3 bg-slate-900/90 border border-slate-700 p-2 px-3 rounded-xl">
            <img src={user.avatar_url} alt="" className="w-9 h-9 rounded-full border border-orange-400" />
            <div className="text-left">
              <div className="text-xs font-bold text-orange-300 flex items-center gap-1">
                {user.name}
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-[10px] text-slate-400 font-mono">@{user.username}</div>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-red-400 transition-colors ml-2"
              title="Disconnect GitLab"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={handleOAuthLogin}
              className="bg-orange-600 hover:bg-orange-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-lg transition-all shrink-0"
            >
              <Gitlab className="w-4 h-4" />
              <span>Connect via GitLab OAuth</span>
            </button>
          </div>
        )}
      </div>

      {/* Notification Toast */}
      {statusMessage && (
        <div className="bg-orange-950/90 border border-orange-500/50 text-orange-200 text-xs px-4 py-2.5 rounded-xl shadow-lg flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-orange-400" />
            <span>{statusMessage}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-slate-400 hover:text-white text-xs font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('projects')}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'projects'
              ? 'bg-orange-500 text-slate-950 shadow-md shadow-orange-500/20'
              : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
          }`}
        >
          <FolderGit2 className="w-4 h-4" />
          <span>Projects ({projects.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('issues')}
          disabled={!selectedProject}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'issues'
              ? 'bg-orange-500 text-slate-950 shadow-md shadow-orange-500/20'
              : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200 disabled:opacity-40'
          }`}
        >
          <AlertCircle className="w-4 h-4" />
          <span>Issues & Bugs</span>
        </button>

        <button
          onClick={() => setActiveTab('commits')}
          disabled={!selectedProject}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'commits'
              ? 'bg-orange-500 text-slate-950 shadow-md shadow-orange-500/20'
              : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200 disabled:opacity-40'
          }`}
        >
          <GitCommit className="w-4 h-4" />
          <span>Commits</span>
        </button>

        <button
          onClick={() => setActiveTab('pipelines')}
          disabled={!selectedProject}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'pipelines'
              ? 'bg-orange-500 text-slate-950 shadow-md shadow-orange-500/20'
              : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200 disabled:opacity-40'
          }`}
        >
          <PlayCircle className="w-4 h-4" />
          <span>CI/CD Pipelines</span>
        </button>

        <button
          onClick={() => setActiveTab('export')}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'export'
              ? 'bg-orange-500 text-slate-950 shadow-md shadow-orange-500/20'
              : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
          }`}
        >
          <FileCode className="w-4 h-4" />
          <span>Snippets Export</span>
        </button>

        <button
          onClick={() => setActiveTab('config')}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'config'
              ? 'bg-slate-700 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
          }`}
        >
          <Key className="w-4 h-4" />
          <span>OAuth Config</span>
        </button>

        {token && (
          <button
            onClick={() => loadGitLabData(token)}
            disabled={loading}
            className="ml-auto p-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl text-slate-300 hover:text-orange-400 transition-all text-xs flex items-center gap-1 shrink-0"
            title="Refresh GitLab Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-orange-400' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        )}
      </div>

      {/* Main Content Area */}
      {!token ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-4">
          {/* Option A: Quick PAT Sign In */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-950 border border-orange-500/30 flex items-center justify-center text-orange-400">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Personal Access Token (Quick Connect)</h3>
                <p className="text-[11px] text-slate-400">Paste your GitLab Personal Access Token (`glpat-...`)</p>
              </div>
            </div>

            <form onSubmit={handleSavePat} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">GitLab Access Token</label>
                <input
                  type="password"
                  required
                  placeholder="glpat-xxxxxxxxxxxxxxxxxxxx"
                  value={patInput}
                  onChange={(e) => setPatInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-orange-400 font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Save Token & Connect</span>
              </button>
            </form>

            <p className="text-[10px] text-slate-500">
              Generate a Personal Access Token in GitLab: Settings ➔ Access Tokens (scopes: `api`, `read_user`, `read_repository`).
            </p>
          </div>

          {/* Option B: OAuth App Sign In */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-950 border border-orange-500/30 flex items-center justify-center text-orange-400">
                <Gitlab className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">GitLab OAuth 2.0 Authorization</h3>
                <p className="text-[11px] text-slate-400">Use official OAuth popup login flow</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">GitLab OAuth Client ID</label>
                <input
                  type="text"
                  placeholder="Enter GitLab Client ID"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-orange-400 font-mono"
                />
              </div>

              <button
                onClick={handleOAuthLogin}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 border border-slate-600 transition-all"
              >
                <ExternalLink className="w-4 h-4 text-orange-400" />
                <span>Launch OAuth Popup</span>
              </button>

              <button
                onClick={() => setActiveTab('config')}
                className="w-full text-center text-[11px] text-orange-400 hover:underline"
              >
                View Callback Redirect URLs & OAuth Setup Instructions
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div>
          {/* TAB 1: PROJECTS */}
          {activeTab === 'projects' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search GitLab Projects..."
                    value={projectSearch}
                    onChange={(e) => setProjectSearch(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-400"
                  />
                </div>

                {selectedProject && (
                  <div className="text-xs text-slate-300 bg-orange-950/60 border border-orange-500/40 px-3 py-1.5 rounded-xl flex items-center gap-2">
                    <span className="text-slate-400">Selected Project:</span>
                    <span className="font-bold text-orange-300">{selectedProject.name}</span>
                  </div>
                )}
              </div>

              {loading && projects.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-orange-400" />
                  <span>Loading GitLab Projects...</span>
                </div>
              ) : filteredProjects.length === 0 ? (
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 text-center text-xs text-slate-400">
                  No GitLab projects found or match your search.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredProjects.map((p) => {
                    const isSelected = selectedProject?.id === p.id;
                    return (
                      <div
                        key={p.id}
                        onClick={() => setSelectedProject(p)}
                        className={`cursor-pointer p-4 rounded-2xl border transition-all space-y-2 ${
                          isSelected
                            ? 'bg-orange-950/30 border-orange-500 shadow-lg shadow-orange-500/10'
                            : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="text-xs font-bold text-white flex items-center gap-2">
                              {p.name}
                              <span className="text-[9px] uppercase bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700">
                                {p.visibility}
                              </span>
                            </h4>
                            <p className="text-[10px] text-slate-400 font-mono">{p.name_with_namespace}</p>
                          </div>

                          <a
                            href={p.web_url}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-orange-400 transition-colors shrink-0"
                            title="Open in GitLab"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>

                        {p.description && <p className="text-[11px] text-slate-300 line-clamp-2">{p.description}</p>}

                        <div className="flex items-center gap-4 text-[10px] text-slate-400 pt-1 border-t border-slate-800/80">
                          <span>⭐ {p.star_count} stars</span>
                          <span>🍴 {p.forks_count} forks</span>
                          <span>❗ {p.open_issues_count} open issues</span>
                          <span className="ml-auto font-mono text-orange-400">{p.default_branch}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ISSUES */}
          {activeTab === 'issues' && selectedProject && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
                <div>
                  <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-orange-400" />
                    GitLab Issues — {selectedProject.name}
                  </h3>
                  <p className="text-[11px] text-slate-400">Track and report navigation bugs or map feature requests.</p>
                </div>

                <button
                  onClick={() => setShowIssueModal(true)}
                  className="w-full sm:w-auto bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md transition-all shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Report Bug / Issue</span>
                </button>
              </div>

              {loading ? (
                <div className="p-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-orange-400" />
                  <span>Fetching GitLab Issues...</span>
                </div>
              ) : issues.length === 0 ? (
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 text-center text-xs text-slate-400">
                  No issues found for this project.
                </div>
              ) : (
                <div className="space-y-2">
                  {issues.map((issue) => (
                    <div
                      key={issue.id}
                      className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-orange-400 font-bold">#{issue.iid}</span>
                          <h4 className="font-bold text-white">{issue.title}</h4>
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                              issue.state === 'opened'
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {issue.state}
                          </span>
                        </div>
                        {issue.description && <p className="text-[11px] text-slate-400 line-clamp-2">{issue.description}</p>}
                        <div className="text-[10px] text-slate-500 flex items-center gap-2 pt-1">
                          <span>Author: @{issue.author.username}</span>
                          <span>• {new Date(issue.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <a
                        href={issue.web_url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-orange-400 transition-colors shrink-0"
                        title="Open Issue in GitLab"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: COMMITS */}
          {activeTab === 'commits' && selectedProject && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <GitCommit className="w-4 h-4 text-orange-400" />
                Commit History — {selectedProject.name}
              </h3>

              {loading ? (
                <div className="p-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-orange-400" />
                  <span>Fetching GitLab Commits...</span>
                </div>
              ) : commits.length === 0 ? (
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 text-center text-xs text-slate-400">
                  No commits retrieved.
                </div>
              ) : (
                <div className="space-y-2">
                  {commits.map((c) => (
                    <div
                      key={c.id}
                      className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-orange-400 text-[11px] font-bold bg-orange-950/60 px-1.5 rounded border border-orange-900">
                            {c.short_id}
                          </span>
                          <h4 className="font-semibold text-white truncate">{c.title}</h4>
                        </div>
                        <p className="text-[10px] text-slate-400">
                          {c.author_name} • {new Date(c.created_at).toLocaleString()}
                        </p>
                      </div>

                      <a
                        href={c.web_url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-orange-400 transition-colors shrink-0"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: PIPELINES */}
          {activeTab === 'pipelines' && selectedProject && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
                <div>
                  <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <PlayCircle className="w-4 h-4 text-orange-400" />
                    GitLab CI/CD Pipelines — {selectedProject.name}
                  </h3>
                  <p className="text-[11px] text-slate-400">Monitor automated builds and run manual deployment pipelines.</p>
                </div>

                <button
                  onClick={handleTriggerPipeline}
                  disabled={loading}
                  className="w-full sm:w-auto bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md transition-all shrink-0"
                >
                  <PlayCircle className="w-4 h-4" />
                  <span>Run Pipeline</span>
                </button>
              </div>

              {loading ? (
                <div className="p-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-orange-400" />
                  <span>Fetching GitLab Pipelines...</span>
                </div>
              ) : pipelines.length === 0 ? (
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 text-center text-xs text-slate-400">
                  No pipelines found for this project.
                </div>
              ) : (
                <div className="space-y-2">
                  {pipelines.map((pipe) => (
                    <div
                      key={pipe.id}
                      className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            pipe.status === 'success'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : pipe.status === 'running'
                              ? 'bg-cyan-950 text-cyan-400 border border-cyan-800 animate-pulse'
                              : pipe.status === 'failed'
                              ? 'bg-red-950 text-red-400 border border-red-800'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {pipe.status}
                        </span>

                        <div>
                          <h5 className="font-bold text-white flex items-center gap-2">
                            Pipeline #{pipe.id}
                            <span className="font-mono text-slate-400 text-[10px]">({pipe.ref})</span>
                          </h5>
                          <p className="text-[10px] text-slate-500">{new Date(pipe.created_at).toLocaleString()}</p>
                        </div>
                      </div>

                      <a
                        href={pipe.web_url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-orange-400 transition-colors shrink-0"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: SNIPPETS EXPORT */}
          {activeTab === 'export' && (
            <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileCode className="w-4 h-4 text-orange-400" />
                Export MapAi Navigation Data as GitLab Snippet
              </h3>
              <p className="text-xs text-slate-400">
                Back up your current GPS telemetry, active trip configuration, and settings directly to a private GitLab Snippet.
              </p>

              <div className="space-y-3 pt-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">Snippet Filename</label>
                  <input
                    type="text"
                    value={snippetTitle}
                    onChange={(e) => setSnippetTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-400 font-mono"
                  />
                </div>

                <button
                  onClick={handleExportSnippet}
                  disabled={loading}
                  className="bg-orange-600 hover:bg-orange-500 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-lg transition-all"
                >
                  <Send className="w-4 h-4" />
                  <span>Create Private GitLab Snippet</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 6: OAUTH CONFIG & INSTRUCTIONS */}
          {activeTab === 'config' && (
            <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-5">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-orange-400" />
                <h3 className="text-sm font-bold text-white">GitLab OAuth Setup Instructions</h3>
              </div>

              <div className="space-y-3 text-xs text-slate-300">
                <p>To set up official GitLab OAuth 2.0 login for MapAi:</p>
                <ol className="list-decimal list-inside space-y-2 text-slate-400">
                  <li>
                    Open your GitLab profile applications settings at{' '}
                    <a
                      href="https://gitlab.com/-/profile/applications"
                      target="_blank"
                      rel="noreferrer"
                      className="text-orange-400 underline font-mono"
                    >
                      https://gitlab.com/-/profile/applications
                    </a>
                  </li>
                  <li>
                    Register a new Application with scopes: <code className="text-orange-300 bg-slate-950 px-1 py-0.5 rounded">api</code>, <code className="text-orange-300 bg-slate-950 px-1 py-0.5 rounded">read_user</code>, <code className="text-orange-300 bg-slate-950 px-1 py-0.5 rounded">read_repository</code>.
                  </li>
                  <li>Add these Redirect URIs to your GitLab Application:</li>
                </ol>

                {/* Redirect URI copy boxes */}
                <div className="space-y-2 pt-2">
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between gap-2">
                    <div>
                      <div className="text-[10px] text-slate-500 font-bold uppercase">Development Redirect URI</div>
                      <code className="text-xs font-mono text-orange-300 break-all">{DEV_CALLBACK_URL}</code>
                    </div>
                    <button
                      onClick={() => copyToClipboard(DEV_CALLBACK_URL)}
                      className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition-colors shrink-0"
                    >
                      {copiedUrl === DEV_CALLBACK_URL ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between gap-2">
                    <div>
                      <div className="text-[10px] text-slate-500 font-bold uppercase">Deployed / Shared Redirect URI</div>
                      <code className="text-xs font-mono text-orange-300 break-all">{SHARED_CALLBACK_URL}</code>
                    </div>
                    <button
                      onClick={() => copyToClipboard(SHARED_CALLBACK_URL)}
                      className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition-colors shrink-0"
                    >
                      {copiedUrl === SHARED_CALLBACK_URL ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ISSUE MODAL */}
      {showIssueModal && (
        <div className="fixed inset-0 z-[3000] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-orange-400" />
              New GitLab Issue
            </h3>

            <form onSubmit={handleCreateIssueSubmit} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Issue Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Map rerouting error on highway exit"
                  value={issueTitle}
                  onChange={(e) => setIssueTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-400"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Description / Details</label>
                <textarea
                  rows={4}
                  placeholder="Describe the issue or feature request..."
                  value={issueDesc}
                  onChange={(e) => setIssueDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-400 resize-none font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowIssueModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-orange-600 text-white hover:bg-orange-500"
                >
                  Submit Issue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
