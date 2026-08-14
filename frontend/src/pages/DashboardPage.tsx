import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, VITE_API_URL } from '../context/AuthContext';
import {
  AudioLines,
  UploadCloud,
  LogOut,
  Search,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Play,
  Edit2,
  Check
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
              : 'bg-[#2A2F2C]'
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
    <div className="flex flex-col gap-2 pt-1">
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
  
  // File upload state
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string>('');
  const [uploading, setUploading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // In-place editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitleValue, setEditTitleValue] = useState<string>('');

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
      setUploadError('Network error during file upload.');
    };

    xhr.send(formData);
  };

  const onButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Delete Meeting
  const handleDeleteMeeting = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this meeting? This will also delete all associated tasks.')) {
      return;
    }

    try {
      const response = await apiFetch(`/meetings/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setMeetings((prev) => prev.filter((m) => m._id !== id));
      } else {
        alert('Failed to delete meeting');
      }
    } catch (error) {
      console.error('Error deleting meeting:', error);
    }
  };

  // Edit Title Inline
  const startEditing = (id: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(id);
    setEditTitleValue(title);
  };

  const saveTitle = async (id: string, e?: React.MouseEvent | React.KeyboardEvent) => {
    if (e) {
      e.stopPropagation();
    }

    if (editTitleValue.trim() === '') return;

    try {
      const response = await apiFetch(`/meetings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editTitleValue }),
      });

      if (response.ok) {
        const updatedMeeting = await response.json();
        setMeetings((prev) => prev.map((m) => (m._id === id ? updatedMeeting : m)));
        setEditingId(null);
      }
    } catch (error) {
      console.error('Error updating title:', error);
    }
  };

  // Filter meetings
  const filteredMeetings = meetings.filter((m) =>
    m.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text-primary font-sans pb-12 relative overflow-hidden">
      {/* Top Navbar */}
      <header className="bg-brand-surface border-b border-brand-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand-accent rounded-lg flex items-center justify-center">
              <AudioLines className="w-5 h-5 text-brand-bg" />
            </div>
            <span className="font-bold font-display text-lg tracking-wide text-brand-text-primary">
              MeetSense
            </span>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-brand-text-primary font-body">{user?.name}</p>
              <p className="text-[10px] text-brand-text-muted font-mono">{user?.email}</p>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 text-[10px] font-bold font-mono uppercase tracking-wider text-brand-text-muted hover:text-brand-text-primary px-3 py-1.5 rounded-lg bg-brand-bg border border-brand-border transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              Log Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Upload Column */}
        <section className="lg:col-span-4 space-y-6">
          <div className="bg-brand-surface border border-brand-border rounded-xl p-6 relative">
            <h2 className="text-base font-bold font-display text-brand-text-primary mb-2">New Meeting</h2>
            <p className="text-xs text-brand-text-muted mb-6 leading-relaxed">
              Upload meeting audio or video file. Whisper automatically transcribes Hindi, English, and code-switched Hinglish.
            </p>

            {/* Drag & Drop Zone */}
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`border border-dashed rounded-lg p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 relative ${
                dragActive
                  ? 'border-brand-accent bg-brand-accent/5'
                  : 'border-brand-border hover:border-brand-text-muted/40 bg-brand-bg/40'
              }`}
              onClick={onButtonClick}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".mp3,.wav,.mp4,.m4a"
                onChange={handleFileChange}
                disabled={uploading}
              />
              
              <div className="w-10 h-10 bg-brand-bg border border-brand-border rounded-lg flex items-center justify-center mb-4 text-brand-accent">
                <UploadCloud className="w-5 h-5" />
              </div>
              
              <p className="text-xs font-bold text-brand-text-primary uppercase tracking-wider font-mono">
                Drag & drop audio
              </p>
              <p className="text-[10px] text-brand-text-muted mt-1 font-mono">
                or click to browse from device
              </p>
              <p className="text-[9px] text-[#555E58] mt-4 uppercase font-bold tracking-wider font-mono">
                MP3, WAV, M4A, MP4 (Max 25MB)
              </p>

              {/* Progress Overlay */}
              {uploading && (
                <div className="absolute inset-0 bg-brand-bg rounded-lg flex flex-col items-center justify-center p-6">
                  <div className="w-full bg-brand-surface rounded-full h-1 border border-brand-border mb-3 overflow-hidden">
                    <div
                      className="bg-brand-accent h-full transition-all duration-300"
                      style={{ width: `${uploadProgress || 0}%` }}
                    ></div>
                  </div>
                  <p className="text-[10px] font-bold font-mono tracking-widest text-brand-accent uppercase animate-pulse">
                    Uploading: {uploadProgress}%
                  </p>
                </div>
              )}
            </div>

            {uploadError && (
              <div className="mt-4 flex gap-2 items-start bg-red-950/10 border border-red-500/20 text-red-200 text-xs p-3 rounded-lg font-mono">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{uploadError}</span>
              </div>
            )}
          </div>
        </section>

        {/* Right Side: Meeting Grid Column */}
        <section className="lg:col-span-8 space-y-6">
          
          {/* Header Action / Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-base font-bold font-display text-brand-text-primary flex items-center gap-2">
              All Meetings
              <span className="text-[10px] font-bold font-mono px-2 py-0.5 bg-brand-surface border border-brand-border text-brand-text-muted rounded-md">
                {meetings.length}
              </span>
            </h2>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted" />
              <input
                type="text"
                placeholder="Search meetings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-brand-surface border border-brand-border focus:border-brand-accent rounded-lg outline-none text-xs text-brand-text-primary transition-all placeholder-slate-700 font-mono"
              />
            </div>
          </div>

          {/* List/Grid Container */}
          {loadingMeetings ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="bg-brand-surface border border-brand-border rounded-xl h-24 animate-pulse flex items-center justify-between p-6"
                >
                  <div className="space-y-3 w-2/3">
                    <div className="h-3 bg-brand-bg rounded w-1/4"></div>
                    <div className="h-2 bg-brand-bg rounded w-full"></div>
                  </div>
                  <div className="w-12 h-4 bg-brand-bg rounded"></div>
                </div>
              ))}
            </div>
          ) : filteredMeetings.length === 0 ? (
            <div className="bg-brand-surface/40 border border-brand-border border-dashed rounded-xl p-12 text-center flex flex-col items-center">
              <div className="w-10 h-10 bg-brand-surface border border-brand-border text-brand-text-muted rounded-lg flex items-center justify-center mb-4">
                <AudioLines className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold font-mono uppercase tracking-widest text-brand-text-muted">
                {searchTerm ? 'No search results' : 'No meetings processed'}
              </p>
              <p className="text-[10px] text-brand-text-muted/65 mt-1 font-mono">
                {searchTerm ? 'Try another search query.' : 'Upload an audio file in the left panel to begin.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredMeetings.map((meeting) => (
                <div
                  key={meeting._id}
                  onClick={() => {
                    if (meeting.status !== 'failed') {
                      navigate(`/meetings/${meeting._id}`);
                    }
                  }}
                  className="bg-brand-surface border border-brand-border hover:border-brand-text-muted/40 rounded-xl p-6 shadow-none transition-all duration-200 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group relative"
                >
                  {/* Meeting Core Info */}
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      {editingId === meeting._id ? (
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="text"
                            value={editTitleValue}
                            onChange={(e) => setEditTitleValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveTitle(meeting._id);
                              if (e.key === 'Escape') setEditingId(null);
                            }}
                            className="bg-brand-bg border border-brand-border rounded-lg px-2.5 py-1 text-xs text-white font-bold outline-none focus:border-brand-accent font-display"
                            autoFocus
                          />
                          <button
                            onClick={() => saveTitle(meeting._id)}
                            className="p-1.5 bg-brand-accent text-brand-bg rounded-lg"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold font-display text-brand-text-primary text-sm transition-colors group-hover:text-brand-accent">
                            {meeting.title}
                          </h3>
                          <button
                            onClick={(e) => startEditing(meeting._id, meeting.title, e)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-brand-text-muted hover:text-brand-text-primary transition-opacity"
                            title="Edit Title"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-[10px] font-mono tracking-wider text-brand-text-muted">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-brand-accent" />
                        {new Date(meeting.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>

                    {meeting.status === 'completed' && (
                      <div className="space-y-3 pt-1">
                        <p className="text-xs text-brand-text-muted line-clamp-1 pr-6 leading-relaxed">
                          {meeting.summary}
                        </p>
                        {/* Inline Waveform motif */}
                        <div className="opacity-60">
                          <StaticWaveform active={false} />
                        </div>
                      </div>
                    )}
                    {meeting.status === 'processing' && (
                      <ProcessingWaveform createdAt={meeting.createdAt} />
                    )}
                    {meeting.status === 'failed' && (
                      <p className="text-xs text-brand-warning flex items-center gap-1.5 font-mono">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        Analysis Failed. Please verify audio format.
                      </p>
                    )}
                  </div>

                  {/* Badges / Actions */}
                  <div className="flex items-center justify-between sm:justify-end gap-4 border-t border-brand-border sm:border-0 pt-4 sm:pt-0">
                    {/* Status Badge */}
                    <div>
                      {meeting.status === 'completed' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-mono font-bold uppercase tracking-wider bg-brand-accent/10 border border-brand-accent/20 text-brand-accent">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          Ready
                        </span>
                      )}
                      {meeting.status === 'processing' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-mono font-bold uppercase tracking-wider bg-brand-warning/10 border border-brand-warning/20 text-brand-warning animate-pulse">
                          <Clock className="w-2.5 h-2.5 animate-spin" />
                          Running
                        </span>
                      )}
                      {meeting.status === 'failed' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-mono font-bold uppercase tracking-wider bg-red-950/20 border border-red-500/20 text-red-400">
                          <AlertCircle className="w-2.5 h-2.5" />
                          Error
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {meeting.status === 'completed' && (
                        <div className="w-7 h-7 rounded-lg bg-brand-bg border border-brand-border flex items-center justify-center text-brand-text-muted hover:text-brand-accent hover:border-brand-accent transition-all">
                          <Play className="w-3.5 h-3.5" />
                        </div>
                      )}
                      <button
                        onClick={(e) => handleDeleteMeeting(meeting._id, e)}
                        className="w-7 h-7 rounded-lg bg-brand-bg border border-brand-border text-brand-text-muted hover:text-red-400 hover:border-red-500/20 flex items-center justify-center transition-all"
                        title="Delete Meeting"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default DashboardPage;
