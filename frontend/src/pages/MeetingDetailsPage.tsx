import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import KanbanBoard from '../components/KanbanBoard';
import type { Task } from '../components/KanbanBoard';
import {
  ArrowLeft,
  Calendar,
  Clock,
  CheckCircle,
  Copy,
  Download,
  AlertCircle,
  Sparkles,
  ChevronRight,
  GripHorizontal,
  Edit2,
  Check,
  Volume2
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

// Signature horizontal waveform scrubber bar component
const ScrubberWaveform: React.FC = () => {
  const heights = [
    5, 9, 6, 13, 20, 11, 8, 15, 23, 14, 11, 18, 28, 20, 9, 13, 15, 22, 26, 16, 11, 9, 16, 24, 13, 8, 15, 20, 22, 17,
    10, 14, 19, 27, 24, 14, 11, 16, 21, 18, 9, 7, 13, 19, 26, 16, 10, 12, 17, 9, 13, 19, 24, 14, 10, 18, 23, 13, 9, 5
  ];
  return (
    <div className="bg-brand-surface border border-brand-border rounded-lg p-6 flex flex-col gap-4">
      {/* Waveform Scrubber Visual */}
      <div className="flex items-center gap-[3px] h-12 w-full overflow-hidden select-none">
        {heights.map((h, i) => {
          const isPlayed = i < heights.length * 0.38;
          return (
            <div
              key={i}
              className={`flex-1 rounded-full transition-all duration-300 ${
                isPlayed ? 'bg-brand-accent' : 'bg-brand-border'
              }`}
              style={{ height: `${h * 1.5}px` }}
            />
          );
        })}
      </div>
      
      {/* Waveform Details footer */}
      <div className="flex items-center justify-between text-[10px] font-mono tracking-widest text-brand-text-muted uppercase">
        <span className="flex items-center gap-1.5">
          <Volume2 className="w-3.5 h-3.5 text-brand-accent" />
          00:00
        </span>
        <span className="text-brand-accent animate-pulse font-bold">● scrubber status: static waveform scrubber</span>
        <span>09:42</span>
      </div>
    </div>
  );
};

const MeetingDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { apiFetch } = useAuth();

  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const [isEditingTitle, setIsEditingTitle] = useState<boolean>(false);
  const [editTitleValue, setEditTitleValue] = useState<string>('');

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
      await Promise.all([fetchMeetingDetails(), fetchTasks()]);
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
        <div className="max-w-md w-full bg-brand-surface border border-brand-border rounded-lg p-8 text-center space-y-4 shadow-none">
          <AlertCircle className="w-10 h-10 text-brand-warning mx-auto" />
          <h3 className="text-sm font-bold font-display text-white">Error Loading Details</h3>
          <p className="text-xs font-mono text-brand-text-muted">{error || 'Meeting not found'}</p>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-[10px] font-bold font-mono uppercase tracking-wider px-4 py-2 bg-brand-accent text-brand-bg rounded-lg hover:bg-brand-accent/90 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text-primary font-sans pb-16 relative overflow-hidden">
      
      {/* Header Sticky */}
      <header className="bg-brand-surface border-b border-brand-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/dashboard"
              className="p-2 hover:bg-brand-bg rounded-lg text-brand-text-muted hover:text-brand-text-primary transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            
            {/* Title Editing In-Place */}
            {isEditingTitle ? (
              <div className="flex items-center gap-2">
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
                  className="bg-brand-bg border border-brand-border rounded-lg px-2.5 py-1 text-xs font-bold outline-none text-white focus:border-brand-accent font-display"
                  autoFocus
                />
                <button
                  onClick={saveTitle}
                  className="p-1.5 bg-brand-accent text-brand-bg rounded-lg transition-colors"
                >
                  <Check className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold font-display text-brand-text-primary">
                  {meeting.title}
                </h1>
                <button
                  onClick={() => setIsEditingTitle(true)}
                  className="p-1 text-brand-text-muted hover:text-brand-text-primary transition-colors"
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
              className="flex items-center gap-1.5 px-3 py-2 bg-brand-bg border border-brand-border hover:border-brand-text-muted/40 rounded-lg text-[10px] font-bold font-mono uppercase tracking-wider text-brand-text-muted hover:text-brand-text-primary transition-all"
              title="Copy Summary Markdown"
            >
              <Copy className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Copy Text</span>
            </button>

            <button
              onClick={handleExportPDF}
              className="flex items-center gap-1.5 px-3 py-2 bg-brand-accent text-brand-bg hover:bg-brand-accent/90 rounded-lg text-[10px] font-bold font-mono uppercase tracking-wider transition-all"
              title="Download PDF Summary Report"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export PDF</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <main className="max-w-7xl mx-auto px-6 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Scrubber Waveform signature element at the top of the body (spans all 12 columns) */}
        <div className="lg:col-span-12">
          <ScrubberWaveform />
        </div>

        {/* Left Area: Summary and Kanban Board (8 columns) */}
        <section className="lg:col-span-8 space-y-8">
          
          {/* Summary Card with min 24px padding */}
          <div className="bg-brand-surface border border-brand-border rounded-lg p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-[3px] h-full bg-brand-accent"></div>
            
            <h2 className="text-xs font-bold font-mono uppercase tracking-widest text-brand-text-muted flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-brand-accent" />
              SUMMARY
            </h2>
            <p className="text-xs font-body leading-relaxed text-brand-text-primary">
              {meeting.summary}
            </p>
          </div>

          {/* Decisions & Follow-ups Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Decisions */}
            <div className="bg-brand-surface border border-brand-border rounded-lg p-6 shadow-none">
              <h3 className="text-[10px] font-bold font-mono uppercase tracking-widest text-brand-text-muted mb-4 pb-2 border-b border-brand-border flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-brand-accent" />
                DECISIONS MADE
              </h3>
              {meeting.decisions && meeting.decisions.length > 0 ? (
                <ul className="space-y-3">
                  {meeting.decisions.map((decision, index) => (
                    <li key={index} className="text-xs text-brand-text-primary flex items-start gap-2.5">
                      <ChevronRight className="w-4 h-4 text-brand-accent shrink-0 mt-0.5" />
                      <span>{decision}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-brand-text-muted/60 italic font-mono uppercase tracking-wider">No decisions explicitly recorded.</p>
              )}
            </div>

            {/* Follow Ups */}
            <div className="bg-brand-surface border border-brand-border rounded-lg p-6 shadow-none">
              <h3 className="text-[10px] font-bold font-mono uppercase tracking-widest text-brand-text-muted mb-4 pb-2 border-b border-brand-border flex items-center gap-2">
                <Clock className="w-4 h-4 text-brand-warning" />
                DEFERRED FOLLOW-UPS
              </h3>
              {meeting.followUps && meeting.followUps.length > 0 ? (
                <ul className="space-y-3">
                  {meeting.followUps.map((item, index) => (
                    <li key={index} className="text-xs text-brand-text-primary flex items-start gap-2.5">
                      <ChevronRight className="w-4 h-4 text-brand-warning shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-brand-text-muted/60 italic font-mono uppercase tracking-wider">No deferred follow-ups explicitly recorded.</p>
              )}
            </div>
          </div>

          {/* Action Items Board Section */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold font-mono uppercase tracking-widest text-brand-text-muted flex items-center gap-2">
              <GripHorizontal className="w-5 h-5 text-brand-accent" />
              ACTION ITEMS
            </h2>
            <KanbanBoard
              tasks={tasks}
              onUpdateTask={handleUpdateTask}
              onDeleteTask={handleDeleteTask}
              onCreateTask={handleCreateTask}
              meetingId={meeting._id}
            />
          </div>
        </section>

        {/* Right Area: Collapsible Transcript (4 columns) */}
        <section className="lg:col-span-4 space-y-6">
          <div className="bg-brand-surface border border-brand-border rounded-lg p-6 flex flex-col max-h-[600px] shadow-none">
            <h2 className="text-xs font-bold font-mono uppercase tracking-widest text-brand-text-muted mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-brand-accent" />
              TRANSCRIPT
            </h2>
            <p className="text-[10px] text-brand-text-muted font-mono leading-relaxed mb-4">
              Raw Whisper transcription log. Bilingual speech resolved natively.
            </p>

            {/* Scrollable Transcript Text */}
            <div className="flex-1 overflow-y-auto bg-brand-bg border border-brand-border rounded-lg p-4 text-xs leading-relaxed text-brand-text-primary/80 font-mono scrollbar-thin select-text max-h-[380px]">
              {meeting.transcript || 'No transcript text was parsed.'}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default MeetingDetailsPage;
