// src/pages/MeetingDetailsPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import KanbanBoard from '../components/KanbanBoard';
import type { Task } from '../components/KanbanBoard';
import CommandPalette from '../components/CommandPalette';
import {
  ArrowLeft,
  Calendar,
  AlertCircle,
  Play,
  Pause,
  Edit2,
  Check,
  Copy,
  Download,
  Sparkles,
  Search,
  Users,
  Timer,
  Trash2
} from 'lucide-react';

interface Meeting {
  _id: string;
  title: string;
  transcript: string;
  summary: string;
  decisions: string[];
  followUps: string[];
  status: 'processing' | 'completed' | 'failed';
  createdAt: string;
}

// Redesigned high-fidelity Waveform Scrubber
const ScrubberWaveform: React.FC = () => {
  const bars = [6, 12, 8, 16, 14, 7, 11, 18, 13, 9, 15, 6, 10, 9, 13, 8, 16, 11, 7, 12, 9, 14, 5, 8, 6, 11, 14, 18, 12, 9, 15, 8, 10, 14, 7, 12, 16, 9];
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<'1x' | '1.5x' | '2x'>('1x');

  return (
    <div className="bg-[#05070A]/40 border border-brand-border rounded-xl p-5 space-y-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-brand-border/60 pb-4">
        {/* Play control */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-9 h-9 rounded-full bg-brand-accent text-brand-bg flex items-center justify-center hover:scale-[1.03] transition-all cursor-pointer shadow-lg shadow-brand-accent/15"
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-brand-bg text-brand-bg" /> : <Play className="w-4 h-4 fill-brand-bg text-brand-bg translate-x-[1px]" />}
          </button>
          
          <div className="space-y-0.5">
            <span className="text-[10px] font-mono text-[#64748B] uppercase tracking-wide">Audio Player</span>
            <div className="text-xs font-mono text-brand-text-primary flex items-center gap-1.5">
              <span>00:00</span>
              <span className="text-brand-text-muted">/</span>
              <span className="text-brand-text-muted">09:42</span>
            </div>
          </div>
        </div>

        {/* Speed adjustment */}
        <div className="flex items-center gap-2 bg-[#090D12] border border-brand-border p-1 rounded-lg text-[9px] font-mono font-bold uppercase tracking-wider text-brand-text-muted">
          {(['1x', '1.5x', '2x'] as const).map(speed => (
            <button
              key={speed}
              onClick={() => setPlaybackSpeed(speed)}
              className={`px-2.5 py-1 rounded cursor-pointer transition-all ${
                playbackSpeed === speed ? 'bg-brand-surface text-brand-accent border border-brand-border/40' : 'hover:text-brand-text-primary'
              }`}
            >
              {speed}
            </button>
          ))}
        </div>
      </div>

      {/* Waveform Visualization */}
      <div className="flex items-center gap-[3px] h-10 overflow-hidden select-none opacity-80 pt-1">
        {bars.map((h, i) => {
          const isActive = isPlaying && i < 15;
          return (
            <div
              key={i}
              className={`flex-grow rounded-full transition-all duration-300 ${
                isActive ? 'bg-brand-accent animate-pulse' : 'bg-[#17212B]'
              }`}
              style={{ height: `${h * 1.3}px` }}
            />
          );
        })}
      </div>
    </div>
  );
};

const MeetingDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { apiFetch } = useAuth();
  const navigate = useNavigate();

  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]); // for command palette search
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const [activeTab, setActiveTab] = useState<'overview' | 'transcript' | 'action-items' | 'decisions'>('overview');
  const [transcriptSearch, setTranscriptSearch] = useState('');
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  const [isEditingTitle, setIsEditingTitle] = useState<boolean>(false);
  const [editTitleValue, setEditTitleValue] = useState<string>('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Key shortcuts for Cmd+K command palette
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

  // Fetch meeting details
  const fetchMeetingDetails = async () => {
    try {
      const response = await apiFetch(`/meetings/${id}`);
      if (!response.ok) {
        throw new Error('Failed to retrieve meeting details');
      }
      const data = await response.json();
      setMeeting(data);
      setEditTitleValue(data.title);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Could not load meeting details.');
    }
  };

  // Fetch all meetings for command palette search
  const fetchAllMeetings = async () => {
    try {
      const response = await apiFetch('/meetings');
      if (response.ok) {
        const data = await response.json();
        setMeetings(data);
      }
    } catch (error) {
      console.error('Error fetching global meetings:', error);
    }
  };

  // Fetch tasks
  const fetchTasks = async () => {
    try {
      const response = await apiFetch(`/tasks?meetingId=${id}`);
      if (response.ok) {
        const data = await response.json();
        setTasks(data);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  useEffect(() => {
    const loadAllData = async () => {
      setLoading(true);
      await Promise.all([fetchMeetingDetails(), fetchTasks(), fetchAllMeetings()]);
      setLoading(false);
    };
    
    if (id) {
      loadAllData();
    }
  }, [id]);

  const handleUpdateTask = async (taskId: string, updates: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((t) => (t._id === taskId ? { ...t, ...updates } as Task : t))
    );

    try {
      const response = await apiFetch(`/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update task');
      }
    } catch (error) {
      console.error('Error syncing task status:', error);
      fetchTasks();
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      const response = await apiFetch(`/tasks/${taskId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setTasks((prev) => prev.filter((t) => t._id !== taskId));
      } else {
        alert('Could not delete task');
      }
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleCreateTask = async (taskData: Omit<Task, '_id'>) => {
    try {
      const response = await apiFetch('/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData),
      });

      if (response.ok) {
        const newTask = await response.json();
        setTasks((prev) => [...prev, newTask]);
      } else {
        alert('Could not create task');
      }
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const saveTitle = async () => {
    if (!meeting || editTitleValue.trim() === '') return;

    try {
      const response = await apiFetch(`/meetings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editTitleValue.trim() }),
      });

      if (response.ok) {
        const updated = await response.json();
        setMeeting(updated);
        setIsEditingTitle(false);
      }
    } catch (error) {
      console.error('Error saving title:', error);
    }
  };

  // Copy details
  const handleCopyAsText = () => {
    if (!meeting) return;

    const formattedTasks = tasks
      .map((t) => `- [ ] ${t.task} (Assignee: ${t.assignedTo}, Deadline: ${t.deadline})`)
      .join('\n');

    const formattedDecisions = meeting.decisions.map((d) => `- ${d}`).join('\n');
    const formattedFollowUps = meeting.followUps.map((f) => `- ${f}`).join('\n');

    const textToCopy = `### ${meeting.title}
Date: ${new Date(meeting.createdAt).toLocaleString()}

**Summary:**
${meeting.summary}

**Decisions Made:**
${formattedDecisions || 'None recorded'}

**Follow-up Items:**
${formattedFollowUps || 'None recorded'}

**Action Items:**
${formattedTasks || 'None assigned'}`;

    navigator.clipboard.writeText(textToCopy);
    alert('Meeting analysis details copied to clipboard!');
  };

  // PDF Exporter using server-side PDF generation
  const handleExportPDF = async () => {
    if (!meeting) return;

    try {
      const response = await apiFetch(`/meetings/${id}/pdf`);
      if (!response.ok) {
        throw new Error('Failed to generate PDF on server');
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${meeting.title.toLowerCase().replace(/\s+/g, '_')}_summary.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Failed to download PDF summary.');
    }
  };

  const confirmDeleteMeeting = async (id: string) => {
    try {
      const response = await apiFetch(`/meetings/${id}`, { method: 'DELETE' });
      if (response.ok) {
        navigate('/dashboard');
      } else {
        alert('Failed to delete meeting');
      }
    } catch (error) {
      console.error('Error deleting meeting:', error);
    } finally {
      setDeleteConfirmId(null);
    }
  };

  // Splits transcript by lines and extracts speaker initial avatars
  const renderTranscriptLines = () => {
    if (!meeting || !meeting.transcript) return <p className="text-[#8A928C] italic text-xs">No transcript text was parsed.</p>;
    const lines = meeting.transcript.split('\n').filter(l => l.trim() !== '');
    const filtered = lines.filter(l => l.toLowerCase().includes(transcriptSearch.toLowerCase()));
    
    if (filtered.length === 0) return <p className="text-[#8A928C] italic text-xs text-center py-12">No matching transcript logs found.</p>;

    return (
      <div className="space-y-5 select-text">
        {filtered.map((line, i) => {
          const match = line.match(/^([^:]+):(.*)$/);
          if (match) {
            const speaker = match[1].trim();
            const text = match[2].trim();
            return (
              <div key={i} className="flex gap-4 items-start p-3.5 hover:bg-[#111822]/20 rounded-xl transition-all border border-transparent hover:border-brand-border/40">
                <div className="w-8 h-8 rounded-full bg-brand-accent/10 border border-brand-accent/25 flex items-center justify-center text-brand-accent text-[10px] font-bold font-mono">
                  {speaker.substring(0, 2).toUpperCase()}
                </div>
                <div className="space-y-1 min-w-0 flex-1">
                  <span className="text-[10px] font-mono font-bold text-brand-text-primary uppercase tracking-wide">{speaker}</span>
                  <p className="text-xs text-brand-text-muted leading-relaxed font-sans">{text}</p>
                </div>
              </div>
            );
          }
          return (
            <p key={i} className="text-xs text-brand-text-muted leading-relaxed font-sans p-3 hover:bg-[#111822]/25 rounded-xl border border-transparent hover:border-brand-border/30">{line}</p>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-bg text-brand-text-primary flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-brand-accent border-t-transparent rounded-lg animate-spin"></div>
          <p className="text-brand-text-muted font-mono text-xs uppercase tracking-widest animate-pulse">Loading analysis...</p>
        </div>
      </div>
    );
  }

  if (error || !meeting) {
    return (
      <div className="min-h-screen bg-brand-bg text-brand-text-primary flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-brand-surface border border-brand-border rounded-xl p-8 text-center space-y-4 shadow-2xl">
          <AlertCircle className="w-10 h-10 text-brand-warning mx-auto" />
          <h3 className="text-sm font-bold font-display text-white">Error Loading Details</h3>
          <p className="text-xs font-mono text-brand-text-muted">{error || 'Meeting not found'}</p>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-[10px] font-bold font-mono uppercase tracking-wider px-5 py-2.5 bg-brand-accent text-brand-bg rounded-lg hover:bg-brand-accent/90 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text-primary font-sans pb-24 relative overflow-hidden">
      
      {/* Header Sticky */}
      <header className="bg-[#05070A]/85 backdrop-blur-md border-b border-brand-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4 min-w-0">
            <Link
              to="/dashboard"
              className="p-2 hover:bg-[#111822] rounded-lg text-brand-text-muted hover:text-brand-text-primary transition-colors flex-shrink-0"
            >
              <ArrowLeft className="w-4.5 h-4.5" />
            </Link>
            
            {/* Title Editing In-Place */}
            {isEditingTitle ? (
              <div className="flex items-center gap-2 w-full max-w-sm">
                <input
                  type="text"
                  value={editTitleValue}
                  onChange={(e) => setEditTitleValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveTitle();
                    if (e.key === 'Escape') {
                      setIsEditingTitle(false);
                      setEditTitleValue(meeting.title);
                    }
                  }}
                  className="bg-[#05070A] border border-brand-border rounded-lg px-2.5 py-1 text-xs font-bold outline-none text-white focus:border-brand-accent font-display w-full"
                  autoFocus
                />
                <button
                  onClick={saveTitle}
                  className="p-1.5 bg-brand-accent text-brand-bg rounded-lg transition-colors cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 min-w-0">
                <h1 className="text-sm font-bold font-display text-brand-text-primary truncate max-w-[280px]" title={meeting.title}>
                  {meeting.title}
                </h1>
                <button
                  onClick={() => setIsEditingTitle(true)}
                  className="p-1 text-brand-text-muted hover:text-brand-text-primary transition-colors cursor-pointer"
                  title="Rename Meeting"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleCopyAsText}
              className="flex items-center gap-1.5 px-3 py-2 bg-transparent border border-brand-border hover:border-brand-border-hover rounded-lg text-[10px] font-bold font-mono uppercase tracking-wider text-[#94A3B8] hover:text-brand-text-primary transition-all cursor-pointer"
              title="Copy Summary Markdown"
            >
              <Copy className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Copy Text</span>
            </button>

            <button
              onClick={handleExportPDF}
              className="flex items-center gap-1.5 px-3 py-2 bg-brand-accent text-brand-bg hover:bg-brand-accent/90 rounded-lg text-[10px] font-bold font-mono uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-brand-accent/10"
              title="Download PDF Summary Report"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export PDF</span>
            </button>
            
            <button
              onClick={() => setDeleteConfirmId(meeting._id)}
              className="w-8 h-8 rounded-lg border border-brand-border text-brand-text-muted hover:text-[#EA5E5E] hover:border-red-500/20 flex items-center justify-center transition-all cursor-pointer"
              title="Delete Meeting"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <main className="max-w-6xl mx-auto px-6 mt-8 space-y-8 select-none">
        
        {/* Scrubber player at top */}
        <ScrubberWaveform />

        {/* Tab Selectors */}
        <div className="flex border-b border-brand-border text-[10px] font-mono font-bold uppercase tracking-wider text-brand-text-muted gap-6 pb-0.5">
          {(['overview', 'transcript', 'action-items', 'decisions'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 border-b-2 transition-all cursor-pointer ${
                activeTab === tab ? 'border-brand-accent text-brand-text-primary' : 'border-transparent hover:text-brand-text-primary'
              }`}
            >
              {tab.replace('-', ' ')}
            </button>
          ))}
        </div>

        {/* Tab Panel Contexts */}
        <div className="pt-2">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fade-in">
              {/* Summary columns */}
              <div className="lg:col-span-8 space-y-6">
                <div className="bg-[#05070A]/40 border border-brand-border rounded-xl p-6 relative overflow-hidden space-y-3">
                  <div className="absolute top-0 left-0 w-[3px] h-full bg-brand-accent"></div>
                  <h3 className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#94A3B8] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-brand-accent animate-pulse" />
                    AI Summary Overview
                  </h3>
                  <p className="text-xs text-brand-text-primary leading-relaxed font-sans">{meeting.summary}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Decisions Summary widget */}
                  <div className="bg-[#05070A]/40 border border-brand-border rounded-xl p-6 space-y-4">
                    <h3 className="text-[10px] font-mono font-bold uppercase tracking-widest text-brand-accent border-b border-brand-border pb-2">
                      Key Decisions Made
                    </h3>
                    {meeting.decisions && meeting.decisions.length > 0 ? (
                      <ul className="space-y-3 text-xs text-brand-text-muted font-sans leading-relaxed">
                        {meeting.decisions.slice(0, 3).map((d, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-brand-accent font-bold mt-0.5">&bull;</span>
                            <span>{d}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-[#64748B] italic">No decisions parsed.</p>
                    )}
                  </div>

                  {/* Follow ups Summary widget */}
                  <div className="bg-[#05070A]/40 border border-brand-border rounded-xl p-6 space-y-4">
                    <h3 className="text-[10px] font-mono font-bold uppercase tracking-widest text-brand-warning border-b border-brand-border pb-2">
                      Deferred Items
                    </h3>
                    {meeting.followUps && meeting.followUps.length > 0 ? (
                      <ul className="space-y-3 text-xs text-brand-text-muted font-sans leading-relaxed">
                        {meeting.followUps.slice(0, 3).map((f, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-brand-warning font-bold mt-0.5">&bull;</span>
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-[#64748B] italic">No deferred tasks.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Sidebar Metadata Info */}
              <div className="lg:col-span-4 space-y-6">
                <div className="bg-[#05070A]/40 border border-brand-border rounded-xl p-6 space-y-5">
                  <h3 className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#94A3B8] border-b border-brand-border pb-2.5">
                    Session Analytics
                  </h3>
                  
                  <div className="space-y-4 text-xs font-sans">
                    <div className="flex items-center justify-between">
                      <span className="text-brand-text-muted flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-brand-accent/70" />
                        Recorded Date
                      </span>
                      <span className="text-brand-text-primary font-mono text-[11px]">
                        {new Date(meeting.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-brand-text-muted flex items-center gap-2">
                        <Timer className="w-4 h-4 text-brand-warning/70" />
                        Duration
                      </span>
                      <span className="text-brand-text-primary font-mono text-[11px]">09m 42s</span>
                    </div>

                    <div className="flex items-start justify-between">
                      <span className="text-brand-text-muted flex items-center gap-2 mt-0.5">
                        <Users className="w-4 h-4 text-[#10B981]/70" />
                        Speakers
                      </span>
                      <div className="flex flex-col items-end gap-1.5 text-right font-mono text-[11px] text-brand-text-primary">
                        <span>Samar Hirau</span>
                        <span>Amit Sharma</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TRANSCRIPT */}
          {activeTab === 'transcript' && (
            <div className="space-y-6 animate-fade-in">
              {/* Search bar inside tab */}
              <div className="flex items-center justify-between border-b border-brand-border pb-4 gap-4">
                <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#64748B]">
                  Whisper Transcript Log
                </div>
                <div className="relative w-full max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-brand-text-muted" />
                  <input
                    type="text"
                    placeholder="Search words in transcript..."
                    value={transcriptSearch}
                    onChange={(e) => setTranscriptSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-1.5 bg-[#05070A] border border-brand-border focus:border-brand-accent rounded-lg outline-none text-xs text-brand-text-primary placeholder-[#475569] font-mono"
                  />
                </div>
              </div>

              {/* Scrollable list */}
              <div className="bg-[#05070A]/30 border border-brand-border rounded-xl p-6 max-h-[500px] overflow-y-auto">
                {renderTranscriptLines()}
              </div>
            </div>
          )}

          {/* TAB 3: ACTION ITEMS (KANBAN BOARD) */}
          {activeTab === 'action-items' && (
            <div className="space-y-6 animate-fade-in">
              <KanbanBoard
                tasks={tasks}
                onUpdateTask={handleUpdateTask}
                onDeleteTask={handleDeleteTask}
                onCreateTask={handleCreateTask}
                meetingId={meeting._id}
              />
            </div>
          )}

          {/* TAB 4: DECISIONS */}
          {activeTab === 'decisions' && (
            <div className="space-y-6 animate-fade-in">
              <div className="border-b border-brand-border pb-4 text-[10px] font-mono font-bold uppercase tracking-wider text-[#64748B]">
                Key Consensus Decisions List
              </div>
              <div className="space-y-4 max-w-3xl">
                {meeting.decisions && meeting.decisions.length > 0 ? (
                  meeting.decisions.map((decision, index) => (
                    <blockquote
                      key={index}
                      className="pl-4 border-l-[3px] border-brand-accent bg-[#05070A]/40 p-4 rounded-r-xl text-xs leading-relaxed text-brand-text-primary italic font-sans"
                    >
                      "{decision}"
                    </blockquote>
                  ))
                ) : (
                  <p className="text-xs text-[#8A928C] italic">No decisions recorded during this meeting.</p>
                )}
              </div>
            </div>
          )}

        </div>
      </main>

      {/* 5. CUSTOM CONFIRM DELETION MODAL */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[250000] flex items-center justify-center bg-black/60 backdrop-blur-sm transition-all duration-300">
          <div className="bg-[#090D12] border border-brand-border rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl space-y-5 animate-scale-in">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-[#EA5E5E] rounded-lg">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-mono font-bold text-brand-text-primary uppercase tracking-wider">
                  Delete Meeting Analysis
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

      {/* 6. PRODUCTIVITY COMMAND PALETTE OVERLAY */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        meetings={meetings}
        onTriggerRecord={() => {
          navigate('/dashboard');
        }}
      />

    </div>
  );
};

export default MeetingDetailsPage;
