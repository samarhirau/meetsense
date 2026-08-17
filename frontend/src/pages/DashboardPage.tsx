// src/pages/DashboardPage.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, VITE_API_URL } from '../context/AuthContext';
import CommandPalette from '../components/CommandPalette';
import {
  AudioLines,
  UploadCloud,
  LogOut,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Edit2,
  Check,
  Menu,
  X,
  LayoutDashboard,
  FileText,
  Settings as SettingsIcon,
  Search as SearchIcon,
  ChevronRight
} from 'lucide-react';

interface Meeting {
  _id: string;
  title: string;
  transcript: string;
  summary: string;
  status: 'processing' | 'completed' | 'failed';
  createdAt: string;
}

// Signature static waveform visualizer
const StaticWaveform: React.FC<{ active?: boolean; animate?: boolean }> = ({ active = false, animate = false }) => {
  const bars = [6, 12, 8, 16, 14, 7, 11, 18, 13, 9, 15, 6, 10, 9, 13, 8, 16, 11, 7, 12, 9, 14, 5, 8, 6, 11];
  return (
    <div className="flex items-center gap-[3px] h-6 overflow-hidden">
      {bars.map((height, i) => (
        <div
          key={i}
          className={`w-[2px] rounded-full transition-all duration-300 ${
            active 
              ? 'bg-brand-accent' 
              : 'bg-[#17212B]'
          } ${animate ? 'animate-pulse-fast' : ''}`}
          style={{
            height: `${height * 1.2}px`,
            animationDelay: `${i * 0.05}s`,
          }}
        />
      ))}
    </div>
  );
};

// Processing state component showing animated waveform and toggling status labels
const ProcessingWaveform: React.FC<{ createdAt: string }> = ({ createdAt }) => {
  const [statusText, setStatusText] = useState<string>('Transcribing audio...');

  useEffect(() => {
    const checkStatus = () => {
      const elapsed = (Date.now() - new Date(createdAt).getTime()) / 1000;
      if (elapsed > 12) {
        setStatusText('Extracting action items...');
      } else {
        setStatusText('Transcribing audio...');
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 2000);
    return () => clearInterval(interval);
  }, [createdAt]);

  return (
    <div className="flex flex-col gap-2 pt-1.5">
      <div className="flex items-center gap-4">
        <StaticWaveform active={true} animate={true} />
        <span className="text-[10px] font-bold font-mono tracking-widest uppercase text-brand-accent animate-pulse">
          {statusText}
        </span>
      </div>
    </div>
  );
};

const DashboardPage: React.FC = () => {
  const { user, logout, apiFetch, token } = useAuth();
  const navigate = useNavigate();

  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loadingMeetings, setLoadingMeetings] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Custom sidebar SPA states
  const [activeTab, setActiveTab] = useState<'overview' | 'meetings' | 'settings'>('overview');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  
  // File upload state
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string>('');
  const [uploading, setUploading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // In-place editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitleValue, setEditTitleValue] = useState<string>('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Register command palette shortcut (Ctrl + K / Cmd + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fetch all meetings
  const fetchMeetings = async () => {
    try {
      const response = await apiFetch('/meetings');
      if (response.ok) {
        const data = await response.json();
        setMeetings(data);
      }
    } catch (error) {
      console.error('Error fetching meetings:', error);
    } finally {
      setLoadingMeetings(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, []);

  // Poll for meetings that are 'processing'
  useEffect(() => {
    const hasProcessing = meetings.some((m) => m.status === 'processing');
    if (!hasProcessing) return;

    const interval = setInterval(async () => {
      try {
        const response = await apiFetch('/meetings');
        if (response.ok) {
          const data = await response.json();
          setMeetings(data);
          
          const stillProcessing = data.some((m: Meeting) => m.status === 'processing');
          if (!stillProcessing) {
            clearInterval(interval);
          }
        }
      } catch (error) {
        console.error('Error polling meetings:', error);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [meetings]);

  // Handle Drag Events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  // Handle Drop Event
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleUploadFile(e.target.files[0]);
    }
  };

  // Upload Logic using XMLHTTPRequest for progress monitoring
  const handleUploadFile = (file: File) => {
    setUploadError('');
    
    if (file.size > 25 * 1024 * 1024) {
      setUploadError('File size exceeds 25MB limit. Please upload a smaller file.');
      return;
    }

    const allowedExtensions = ['.mp3', '.wav', '.mp4', '.m4a'];
    const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!allowedExtensions.includes(fileExt)) {
      setUploadError('Invalid format. Please upload .mp3, .wav, .mp4, or .m4a.');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('audio', file);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${VITE_API_URL}/meetings`);
    
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        const percentage = Math.round((event.loaded * 100) / event.total);
        setUploadProgress(percentage);
      }
    });

    xhr.onload = () => {
      setUploading(false);
      setUploadProgress(null);

      if (xhr.status === 201) {
        const newMeeting = JSON.parse(xhr.responseText);
        setMeetings((prev) => [newMeeting, ...prev]);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } else {
        const errorData = JSON.parse(xhr.responseText || '{}');
        setUploadError(errorData.message || 'File upload failed. Rate limit exceeded?');
      }
    };

    xhr.onerror = () => {
      setUploading(false);
      setUploadProgress(null);
      setUploadError('Network error uploading file. Check API server endpoint connection.');
    };

    xhr.send(formData);
  };

  // Trigger custom confirmation modal
  const handleDeleteMeeting = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirmId(id);
  };

  // Perform actual deletion from the modal
  const confirmDeleteMeeting = async (id: string) => {
    try {
      const response = await apiFetch(`/meetings/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setMeetings((prev) => prev.filter((m) => m._id !== id));
      } else {
        const data = await response.json().catch(() => ({}));
        alert(`Failed to delete meeting: ${data.message || response.statusText || response.status}`);
      }
    } catch (error: any) {
      console.error('Error deleting meeting:', error);
      alert(`Network or unexpected error: ${error.message || error}`);
    } finally {
      setDeleteConfirmId(null);
    }
  };

  // Edit Title Inline
  const startEditing = (id: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(id);
    setEditTitleValue(title);
  };

  const saveTitle = async (id: string) => {
    if (editTitleValue.trim() === '') return;
    try {
      const response = await apiFetch(`/meetings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editTitleValue.trim() }),
      });

      if (response.ok) {
        const updatedMeeting = await response.json();
        setMeetings((prev) => prev.map((m) => (m._id === id ? updatedMeeting : m)));
        setEditingId(null);
      }
    } catch (error) {
      console.error('Error saving title:', error);
    }
  };

  // Calculate current greeting based on local hour
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Filter meetings list matching search bar inputs
  const filteredMeetings = meetings.filter((meeting) =>
    meeting.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalMeetings = meetings.length;
  const processingMeetings = meetings.filter(m => m.status === 'processing').length;
  const failedMeetings = meetings.filter(m => m.status === 'failed').length;

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text-primary flex font-sans select-none">
      
      {/* 1. SIDEBAR (Desktop) */}
      <aside className="w-64 bg-[#05070A]/65 border-r border-brand-border flex-shrink-0 flex flex-col justify-between hidden md:flex z-40">
        <div className="p-6 space-y-8">
          {/* Logo brand */}
          <div className="flex items-center gap-2.5 px-2">
            <div className="w-8 h-8 bg-gradient-to-tr from-brand-accent to-brand-accent/80 rounded-lg flex items-center justify-center shadow-lg shadow-brand-accent/15">
              <AudioLines className="w-4.5 h-4.5 text-brand-bg animate-pulse" />
            </div>
            <span className="text-base font-bold font-display tracking-tight text-brand-text-primary">
              MeetSense
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-brand-text-muted">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg transition-all border border-transparent cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-[#111822] text-brand-text-primary border-brand-border/40'
                  : 'hover:text-brand-text-primary hover:bg-[#111822]/20'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <LayoutDashboard className="w-4 h-4" />
                <span>Overview</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </button>
            
            <button
              onClick={() => setActiveTab('meetings')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg transition-all border border-transparent cursor-pointer ${
                activeTab === 'meetings'
                  ? 'bg-[#111822] text-brand-text-primary border-brand-border/40'
                  : 'hover:text-brand-text-primary hover:bg-[#111822]/20'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <FileText className="w-4 h-4" />
                <span>Meetings</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg transition-all border border-transparent cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-[#111822] text-brand-text-primary border-brand-border/40'
                  : 'hover:text-brand-text-primary hover:bg-[#111822]/20'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <SettingsIcon className="w-4 h-4" />
                <span>Settings</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </button>
          </nav>
        </div>

        {/* Profile Card Footer */}
        <div className="p-6 border-t border-brand-border flex items-center justify-between text-[10px] font-mono font-bold text-brand-text-muted bg-[#05070A]/30">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-full bg-brand-accent/10 border border-brand-accent/25 flex items-center justify-center text-brand-accent font-sans text-xs">
              {user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
            </div>
            <span className="truncate max-w-[110px]" title={user?.email}>{user?.email}</span>
          </div>
          
          <button
            onClick={logout}
            className="p-1.5 hover:bg-[#1A1215] border border-transparent hover:border-red-950/20 rounded-md text-[#94A3B8] hover:text-[#EF4444] transition-all cursor-pointer"
            title="Log Out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </aside>

      {/* MOBILE DRAWER SIDEBAR */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm md:hidden flex animate-fade-in">
          <div className="w-64 bg-[#090D12] border-r border-brand-border flex flex-col justify-between p-6 animate-scale-in">
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-brand-accent rounded-lg flex items-center justify-center">
                    <AudioLines className="w-4 h-4 text-brand-bg" />
                  </div>
                  <span className="text-sm font-bold font-display">MeetSense</span>
                </div>
                <button onClick={() => setMobileSidebarOpen(false)} className="text-brand-text-muted">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="space-y-2 text-xs font-mono font-bold uppercase tracking-wider text-brand-text-muted">
                <button
                  onClick={() => { setActiveTab('overview'); setMobileSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3.5 px-3 py-2 rounded-lg ${
                    activeTab === 'overview' ? 'bg-[#111822] text-brand-text-primary' : ''
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Overview</span>
                </button>
                <button
                  onClick={() => { setActiveTab('meetings'); setMobileSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3.5 px-3 py-2 rounded-lg ${
                    activeTab === 'meetings' ? 'bg-[#111822] text-brand-text-primary' : ''
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>Meetings</span>
                </button>
                <button
                  onClick={() => { setActiveTab('settings'); setMobileSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3.5 px-3 py-2 rounded-lg ${
                    activeTab === 'settings' ? 'bg-[#111822] text-brand-text-primary' : ''
                  }`}
                >
                  <SettingsIcon className="w-4 h-4" />
                  <span>Settings</span>
                </button>
              </nav>
            </div>

            <div className="border-t border-brand-border pt-4 flex items-center justify-between text-xs text-brand-text-muted">
              <span className="truncate max-w-[130px]">{user?.email}</span>
              <button onClick={logout} className="text-[#EF4444] p-1">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. WORKSPACE CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Workspace Top Header */}
        <header className="h-16 border-b border-brand-border bg-brand-bg/85 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="p-1 text-brand-text-muted hover:text-brand-text-primary md:hidden cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            {/* Command shortcut prompt */}
            <div className="hidden sm:flex items-center gap-2 text-[10px] font-mono text-brand-text-muted bg-[#05070A] border border-brand-border px-2.5 py-1 rounded-lg">
              <span>Press</span>
              <kbd className="bg-brand-surface border border-brand-border px-1 py-0.2 rounded text-[9px] font-sans font-bold text-brand-text-primary">Ctrl K</kbd>
              <span>to open command bar</span>
            </div>
          </div>

          {/* Quick search input */}
          <div className="relative w-full max-w-xs">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-brand-text-muted" />
            <input
              type="text"
              placeholder="Search everything..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-[#05070A] border border-brand-border focus:border-brand-accent rounded-lg outline-none text-xs text-brand-text-primary transition-all placeholder-[#475569] font-mono"
            />
          </div>
        </header>

        {/* Workspace Main content block */}
        <main className="flex-grow p-6 md:p-8 overflow-y-auto max-w-5xl w-full mx-auto space-y-8">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-8 animate-fade-in">
              {/* Greetings banner */}
              <div className="space-y-1">
                <h2 className="text-xs font-bold font-mono tracking-widest text-[#64748B] uppercase">
                  {getGreeting()} 👋
                </h2>
                <h1 className="text-2xl font-bold text-brand-text-primary leading-tight">
                  Here's what happened this week.
                </h1>
              </div>

              {/* Metric Counters Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-[#05070A]/40 border border-brand-border rounded-xl p-5 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold font-mono text-brand-text-muted uppercase">Processed Meetings</span>
                    <h3 className="text-xl font-bold text-brand-text-primary">{totalMeetings - processingMeetings - failedMeetings}</h3>
                  </div>
                  <div className="p-3 bg-brand-accent/5 border border-brand-accent/25 text-brand-accent rounded-xl">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-[#05070A]/40 border border-brand-border rounded-xl p-5 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold font-mono text-brand-text-muted uppercase">In Progress</span>
                    <h3 className="text-xl font-bold text-brand-text-primary">{processingMeetings}</h3>
                  </div>
                  <div className="p-3 bg-brand-warning/5 border border-brand-warning/25 text-brand-warning rounded-xl">
                    <Clock className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-[#05070A]/40 border border-brand-border rounded-xl p-5 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold font-mono text-brand-text-muted uppercase">Failed Sessions</span>
                    <h3 className="text-xl font-bold text-brand-text-primary">{failedMeetings}</h3>
                  </div>
                  <div className="p-3 bg-red-500/5 border border-red-500/20 text-[#EA5E5E] rounded-xl">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left Side: Upload Audio Card */}
                <div className="lg:col-span-4 space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold font-mono uppercase tracking-widest text-brand-text-muted">Upload Recording</h3>
                    <p className="text-[10px] text-brand-text-muted leading-relaxed font-sans">Submit standard meeting audio formats manually.</p>
                  </div>

                  {/* Drag-and-Drop Area */}
                  <div
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border border-dashed rounded-xl p-6 text-center transition-all duration-300 flex flex-col items-center justify-center min-h-[220px] bg-[#05070A]/40 cursor-pointer ${
                      dragActive ? 'border-brand-accent bg-[#111822]/20' : 'border-brand-border hover:border-brand-accent/40'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      onChange={handleFileChange}
                      accept=".mp3,.wav,.mp4,.m4a"
                      disabled={uploading}
                    />
                    
                    {uploading ? (
                      <div className="space-y-4 w-full px-4">
                        <div className="w-8 h-8 border-2 border-brand-accent border-t-transparent rounded-full animate-spin mx-auto"></div>
                        <div className="space-y-1.5">
                          <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-accent">
                            Uploading ({uploadProgress || 0}%)
                          </p>
                          <div className="w-full bg-[#17212B] h-1.5 rounded-full overflow-hidden">
                            <div className="bg-brand-accent h-full transition-all duration-300" style={{ width: `${uploadProgress || 0}%` }}></div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="w-9 h-9 bg-brand-accent/5 border border-brand-accent/20 rounded-lg flex items-center justify-center mx-auto text-brand-accent">
                          <UploadCloud className="w-4.5 h-4.5" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-brand-text-primary">Drag & drop meeting audio</p>
                          <p className="text-[10px] text-brand-text-muted">or click to browse local files</p>
                        </div>
                        <p className="text-[9px] font-mono text-[#64748B] uppercase">MP3, WAV, MP4, M4A up to 25MB</p>
                      </div>
                    )}
                  </div>

                  {uploadError && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-xs leading-relaxed font-mono">
                      {uploadError}
                    </div>
                  )}
                </div>

                {/* Right Side: Recent Meetings List */}
                <div className="lg:col-span-8 space-y-6">
                  <div className="flex items-center justify-between border-b border-brand-border pb-3">
                    <h3 className="text-xs font-bold font-mono uppercase tracking-widest text-brand-text-muted">
                      Recent Meetings
                    </h3>
                    <button
                      onClick={() => setActiveTab('meetings')}
                      className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-accent hover:text-brand-accent/80 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      View all ({meetings.length})
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {loadingMeetings ? (
                    <div className="space-y-3">
                      {[1, 2].map(i => (
                        <div key={i} className="bg-[#05070A]/30 border border-brand-border rounded-xl p-4 h-20 animate-pulse"></div>
                      ))}
                    </div>
                  ) : filteredMeetings.length === 0 ? (
                    <div className="bg-brand-surface/40 border border-brand-border border-dashed rounded-xl p-12 text-center flex flex-col items-center">
                      <div className="w-9 h-9 bg-brand-surface border border-brand-border text-brand-text-muted rounded-lg flex items-center justify-center mb-4">
                        <AudioLines className="w-4.5 h-4.5" />
                      </div>
                      <p className="text-xs font-bold font-mono uppercase tracking-widest text-brand-text-primary">
                        Your meeting history is empty
                      </p>
                      <p className="text-[10px] text-[#64748B] mt-1.5 font-sans">
                        Record your first meeting and let MeetSense handle the notes.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredMeetings.slice(0, 3).map((meeting) => (
                        <div
                          key={meeting._id}
                          onClick={() => {
                            if (meeting.status !== 'failed') {
                              navigate(`/meetings/${meeting._id}`);
                            }
                          }}
                          className="bg-[#05070A]/30 border border-brand-border hover:border-brand-border-hover rounded-xl p-5 shadow-none transition-all duration-200 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group relative"
                        >
                          <div className="space-y-1.5 flex-1 min-w-0">
                            <h4 className="font-bold text-brand-text-primary text-sm transition-colors group-hover:text-brand-accent truncate pr-6">
                              {meeting.title}
                            </h4>
                            <div className="flex items-center gap-3 text-[10px] font-mono text-[#64748B]">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5 text-brand-accent/60" />
                                {new Date(meeting.createdAt).toLocaleDateString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </span>
                            </div>
                            {meeting.status === 'completed' && (
                              <p className="text-xs text-brand-text-muted line-clamp-1 pr-4 pt-1 font-sans">
                                {meeting.summary}
                              </p>
                            )}
                            {meeting.status === 'processing' && (
                              <ProcessingWaveform createdAt={meeting.createdAt} />
                            )}
                          </div>

                          <div className="flex items-center gap-3">
                            <span className={`text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 border rounded-md ${
                              meeting.status === 'completed' 
                                ? 'bg-brand-accent/10 border-brand-accent/20 text-brand-accent'
                                : meeting.status === 'processing'
                                ? 'bg-brand-warning/10 border-brand-warning/20 text-brand-warning animate-pulse'
                                : 'bg-red-500/10 border-red-500/20 text-[#EA5E5E]'
                            }`}>
                              {meeting.status === 'completed' ? 'Ready' : meeting.status === 'processing' ? 'Processing' : 'Failed'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MEETINGS (ALL MEETINGS GRID) */}
          {activeTab === 'meetings' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between border-b border-brand-border pb-4">
                <h2 className="text-xs font-bold font-mono uppercase tracking-widest text-[#64748B]">
                  All Processed Meetings ({filteredMeetings.length})
                </h2>
              </div>

              {loadingMeetings ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="bg-[#05070A]/30 border border-brand-border rounded-xl p-5 h-24 animate-pulse"></div>
                  ))}
                </div>
              ) : filteredMeetings.length === 0 ? (
                <div className="bg-brand-surface/40 border border-brand-border border-dashed rounded-xl p-16 text-center flex flex-col items-center">
                  <div className="w-10 h-10 bg-brand-surface border border-brand-border text-brand-text-muted rounded-lg flex items-center justify-center mb-4">
                    <AudioLines className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-bold font-mono uppercase tracking-widest text-brand-text-muted">
                    No results found
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {filteredMeetings.map((meeting) => (
                    <div
                      key={meeting._id}
                      onClick={() => {
                        if (meeting.status !== 'failed') {
                          navigate(`/meetings/${meeting._id}`);
                        }
                      }}
                      className="bg-[#05070A]/30 border border-brand-border hover:border-brand-border-hover rounded-xl p-5 transition-all duration-200 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group relative"
                    >
                      <div className="space-y-1.5 flex-1 min-w-0" onClick={(e) => editingId === meeting._id && e.stopPropagation()}>
                        <div className="flex items-center gap-3">
                          {editingId === meeting._id ? (
                            <div className="flex items-center gap-2 w-full max-w-md">
                              <input
                                type="text"
                                value={editTitleValue}
                                onChange={(e) => setEditTitleValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveTitle(meeting._id);
                                  if (e.key === 'Escape') setEditingId(null);
                                }}
                                className="bg-brand-bg border border-brand-border rounded-lg px-2.5 py-1 text-xs text-brand-text-primary font-bold outline-none focus:border-brand-accent font-display w-full"
                                autoFocus
                              />
                              <button
                                onClick={() => saveTitle(meeting._id)}
                                className="p-1.5 bg-brand-accent text-brand-bg rounded-lg cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold font-display text-brand-text-primary text-sm transition-colors group-hover:text-brand-accent truncate max-w-[280px]">
                                {meeting.title}
                              </h3>
                              <button
                                onClick={(e) => startEditing(meeting._id, meeting.title, e)}
                                className="opacity-0 group-hover:opacity-100 p-1 text-brand-text-muted hover:text-brand-text-primary transition-opacity cursor-pointer"
                                title="Edit Title"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-[10px] font-mono text-[#64748B]">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-brand-accent/60" />
                            {new Date(meeting.createdAt).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </span>
                        </div>

                        {meeting.status === 'completed' && (
                          <p className="text-xs text-brand-text-muted line-clamp-1 pr-6 pt-1 font-sans">
                            {meeting.summary}
                          </p>
                        )}
                        {meeting.status === 'processing' && (
                          <ProcessingWaveform createdAt={meeting.createdAt} />
                        )}
                        {meeting.status === 'failed' && (
                          <p className="text-xs text-[#EA5E5E] flex items-center gap-1.5 font-mono pt-1">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            Analysis Failed. Please verify audio format.
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-4 justify-between sm:justify-end border-t border-brand-border/60 sm:border-0 pt-3 sm:pt-0">
                        <span className={`text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 border rounded-md ${
                          meeting.status === 'completed' 
                            ? 'bg-brand-accent/10 border-brand-accent/20 text-brand-accent'
                            : meeting.status === 'processing'
                            ? 'bg-brand-warning/10 border-brand-warning/20 text-brand-warning animate-pulse'
                            : 'bg-red-500/10 border-red-500/20 text-[#EA5E5E]'
                        }`}>
                          {meeting.status === 'completed' ? 'Ready' : meeting.status === 'processing' ? 'Processing' : 'Failed'}
                        </span>

                        <button
                          onClick={(e) => handleDeleteMeeting(meeting._id, e)}
                          className="w-7 h-7 rounded-lg bg-brand-bg border border-brand-border text-brand-text-muted hover:text-[#EA5E5E] hover:border-red-500/20 flex items-center justify-center transition-all cursor-pointer"
                          title="Delete Meeting"
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

          {/* TAB 3: SETTINGS */}
          {activeTab === 'settings' && (
            <div className="space-y-8 animate-fade-in">
              <div className="space-y-1 border-b border-brand-border pb-4">
                <h2 className="text-xs font-bold font-mono tracking-widest text-[#64748B] uppercase">
                  Workspace Settings
                </h2>
                <h1 className="text-lg font-bold text-brand-text-primary">
                  Profile & Preferences
                </h1>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start max-w-4xl">
                {/* Profile Card */}
                <div className="bg-[#05070A]/40 border border-brand-border rounded-xl p-6 space-y-4">
                  <h3 className="text-xs font-bold font-mono uppercase tracking-widest text-brand-accent">
                    Account Profile
                  </h3>
                  <div className="space-y-3.5 text-xs font-sans">
                    <div className="flex items-center justify-between border-b border-brand-border/60 pb-3">
                      <span className="text-[#8A928C]">Email Address</span>
                      <span className="text-brand-text-primary font-mono">{user?.email}</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-brand-border/60 pb-3">
                      <span className="text-[#8A928C]">Account Tier</span>
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 border border-brand-accent/20 bg-brand-accent/10 text-brand-accent rounded">
                        Developer Free
                      </span>
                    </div>
                  </div>
                </div>

                {/* Preferences Card */}
                <div className="bg-[#05070A]/40 border border-brand-border rounded-xl p-6 space-y-4">
                  <h3 className="text-xs font-bold font-mono uppercase tracking-widest text-brand-warning">
                    App Preferences
                  </h3>
                  <div className="space-y-4 text-xs font-sans">
                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold font-mono uppercase tracking-widest text-brand-text-muted">
                        Primary Language Model
                      </label>
                      <select className="w-full bg-[#05070A] border border-brand-border focus:border-brand-accent rounded-lg px-3 py-2 text-xs outline-none text-brand-text-primary font-mono">
                        <option>openai/gpt-oss-120b (Default)</option>
                        <option>qwen/qwen3.6-27b</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold font-mono uppercase tracking-widest text-brand-text-muted">
                        Default Speech Guide
                      </label>
                      <select className="w-full bg-[#05070A] border border-brand-border focus:border-brand-accent rounded-lg px-3 py-2 text-xs outline-none text-brand-text-primary font-mono">
                        <option>Hinglish (Code-Switched resolution)</option>
                        <option>English only</option>
                        <option>Hindi only</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* 3. CUSTOM DELETE CONFIRMATION MODAL */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[250000] flex items-center justify-center bg-black/60 backdrop-blur-sm transition-all duration-300">
          <div className="bg-[#090D12] border border-brand-border rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl space-y-5 animate-scale-in">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-[#EA5E5E] rounded-lg">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-mono font-bold text-brand-text-primary uppercase tracking-wider">
                  Delete Meeting
                </h3>
                <p className="text-xs text-[#8A928C] leading-relaxed font-body">
                  Are you sure you want to delete this meeting? This will permanently remove all transcript logs, summaries, decisions, action items, and task board items. This action cannot be undone.
                </p>
              </div>
            </div>
            
            <div className="flex items-center justify-end gap-3 pt-2 text-[10px] font-mono uppercase tracking-widest">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-lg border border-brand-border text-[#8A928C] hover:text-brand-text-primary hover:bg-[#111822] transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => confirmDeleteMeeting(deleteConfirmId)}
                className="px-4 py-2 rounded-lg bg-[#EA5E5E] text-[#EDEFEC] hover:bg-red-600 transition-all cursor-pointer shadow-lg shadow-red-950/15"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. PRODUCTIVITY COMMAND PALETTE OVERLAY */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        meetings={meetings}
        onTriggerRecord={() => {
          setActiveTab('overview');
          setTimeout(() => fileInputRef.current?.click(), 100);
        }}
        onLogout={logout}
      />

    </div>
  );
};

export default DashboardPage;
