import React from 'react';
import { Link } from 'react-router-dom';
import { 
  AudioLines, 
  UploadCloud, 
  Sparkles, 
  KanbanSquare, 
  ArrowRight, 
  Globe, 
  FileText 
} from 'lucide-react';

const GithubIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

const StaticWaveform: React.FC<{ active?: boolean; animate?: boolean; count?: number }> = ({ 
  active = true, 
  animate = false,
  count = 20
}) => {
  const bars = [6, 12, 8, 16, 14, 7, 11, 18, 13, 9, 15, 6, 10, 9, 13, 8, 16, 11, 7, 12, 9, 14, 5, 8, 6, 11, 14, 8, 10, 15];
  const selectedBars = bars.slice(0, count);

  return (
    <div className="flex items-center gap-[3px] h-8 overflow-hidden">
      {selectedBars.map((height, i) => (
        <div
          key={i}
          className={`w-[2.5px] rounded-full transition-all duration-300 ${
            active 
              ? 'bg-brand-accent' 
              : 'bg-[#2A2F2C]'
          } ${animate ? 'animate-pulse-fast' : ''}`}
          style={{
            height: `${height * 1.5}px`,
            animationDelay: `${i * 0.05}s`,
          }}
        />
      ))}
    </div>
  );
};

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-brand-bg text-brand-text-primary font-sans flex flex-col relative overflow-hidden">
      
      {/* Background Decorative Ambient Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-brand-accent/5 rounded-full blur-[130px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-brand-accent/5 rounded-full blur-[130px] pointer-events-none"></div>
      <div className="absolute top-[30%] right-[10%] w-[40%] h-[40%] bg-brand-warning/3 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Top Navbar */}
      <nav className="border-b border-brand-border sticky top-0 bg-brand-bg/85 backdrop-blur-md z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand-accent rounded-lg flex items-center justify-center">
              <AudioLines className="w-5 h-5 text-brand-bg" />
            </div>
            <span className="text-lg font-bold font-display tracking-tight text-brand-text-primary">
              MeetSense
            </span>
          </div>

          {/* Navigation CTA Buttons */}
          <div className="flex items-center gap-4">
            <Link 
              to="/login"
              className="text-xs font-mono uppercase tracking-wider text-brand-text-muted hover:text-brand-text-primary px-3 py-2 transition-colors"
            >
              Login
            </Link>
            <Link 
              to="/signup"
              className="bg-brand-accent hover:bg-brand-accent/90 text-brand-bg font-bold font-mono text-xs uppercase tracking-wider px-4 py-2 rounded-lg transition-all active:scale-[0.98]"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow">
        
        {/* HERO SECTION */}
        <section className="max-w-5xl mx-auto px-6 pt-20 pb-16 text-center flex flex-col items-center">
          {/* Monospace Eyebrow */}
          <div className="mb-6 inline-flex items-center gap-2 border border-brand-border px-3 py-1 rounded-full bg-brand-surface/40">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-accent animate-ping"></span>
            <span className="text-[10px] font-mono tracking-widest uppercase text-brand-accent">
              audio &rarr; transcription &rarr; kanban board
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-display tracking-tight leading-tight max-w-4xl text-brand-text-primary">
            Turn your meeting recordings into <span className="text-brand-accent">action items</span> instantly
          </h1>

          {/* Supporting line */}
          <p className="mt-6 text-brand-text-muted text-sm md:text-base font-sans max-w-2xl leading-relaxed">
            Upload your audio or video meetings. MeetSense automatically transcribes English, Hindi, 
            or mixed Hinglish speech, extracts key decisions, and populates your interactive Kanban task board.
          </p>

          {/* CTA Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row items-center gap-4 justify-center">
            <Link
              to="/signup"
              className="w-full sm:w-auto bg-brand-accent hover:bg-brand-accent/90 text-brand-bg font-bold font-mono text-xs uppercase tracking-widest px-8 py-3.5 rounded-lg transition-all active:scale-[0.97] flex items-center justify-center gap-2"
            >
              Get Started for Free
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto border border-brand-border hover:border-brand-text-muted text-brand-text-primary font-bold font-mono text-xs uppercase tracking-widest px-8 py-3.5 rounded-lg transition-all"
            >
              Log In
            </Link>
          </div>

          {/* Waveform Scrubber Motif Mockup */}
          <div className="mt-16 w-full max-w-4xl bg-brand-surface border border-brand-border rounded-xl p-6 shadow-none relative overflow-hidden">
            <div className="absolute top-2 left-4 text-[9px] font-mono tracking-widest text-brand-text-muted uppercase">
              meeting_recording_scrubber.wav
            </div>
            
            <div className="mt-4 flex items-center gap-1.5 h-16 w-full overflow-hidden select-none opacity-85">
              {[8, 14, 10, 20, 28, 16, 12, 22, 32, 20, 15, 25, 40, 30, 18, 14, 26, 32, 38, 22, 16, 12, 24, 34, 20, 15, 25, 30, 28, 20, 14, 18, 26, 36, 32, 20, 16, 22, 28, 24, 14, 10, 18, 25, 35, 22, 14, 16, 24, 14, 18, 26, 32, 20, 14, 24, 30, 20, 12, 8].map((h, i) => (
                <div
                  key={i}
                  className={`flex-1 rounded-full transition-all duration-300 ${
                    i < 24 ? 'bg-brand-accent' : 'bg-brand-border'
                  }`}
                  style={{ height: `${h * 1.3}px` }}
                />
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between text-[10px] font-mono tracking-widest text-brand-text-muted uppercase">
              <span>03:42</span>
              <span className="text-brand-accent animate-pulse font-bold flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-accent animate-ping"></span>
                Processing raw audio with Groq AI...
              </span>
              <span>09:42</span>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS SECTION */}
        <section className="bg-brand-surface/20 border-t border-b border-brand-border py-20">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-16">
              <span className="text-[10px] font-mono tracking-widest uppercase text-brand-accent block mb-2">
                how it works
              </span>
              <h2 className="text-2xl md:text-3xl font-bold font-display tracking-tight text-brand-text-primary">
                A seamless pipeline from audio to action items
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
              
              {/* Step 1 */}
              <div className="flex flex-col bg-brand-surface border border-brand-border rounded-lg p-6 hover:border-brand-accent/40 transition-all">
                <div className="w-10 h-10 border border-brand-border rounded-lg flex items-center justify-center mb-6">
                  <span className="text-xs font-mono font-bold text-brand-accent">01</span>
                </div>
                <h3 className="text-sm font-bold font-mono tracking-wide text-brand-text-primary mb-3">
                  1. UPLOAD RECORDING
                </h3>
                <p className="text-brand-text-muted text-xs leading-relaxed font-sans">
                  Drop your meeting audio or video file (mp3, wav, mp4, m4a) up to 25MB directly into the dashboard.
                </p>
                <div className="mt-6 flex justify-center py-2 border border-dashed border-brand-border rounded bg-brand-bg/40">
                  <UploadCloud className="w-5 h-5 text-brand-text-muted" />
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col bg-brand-surface border border-brand-border rounded-lg p-6 hover:border-brand-accent/40 transition-all">
                <div className="w-10 h-10 border border-brand-border rounded-lg flex items-center justify-center mb-6">
                  <span className="text-xs font-mono font-bold text-brand-accent">02</span>
                </div>
                <h3 className="text-sm font-bold font-mono tracking-wide text-brand-text-primary mb-3">
                  2. AI TRANSCRIPTION
                </h3>
                <p className="text-brand-text-muted text-xs leading-relaxed font-sans">
                  Groq Whisper-large-v3 transcribes your speech. Handles English, pure Hindi, and mixed Hinglish speech seamlessly.
                </p>
                <div className="mt-6 flex justify-center py-2 bg-brand-bg/40 border border-brand-border rounded">
                  <StaticWaveform count={12} animate={true} />
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col bg-brand-surface border border-brand-border rounded-lg p-6 hover:border-brand-accent/40 transition-all">
                <div className="w-10 h-10 border border-brand-border rounded-lg flex items-center justify-center mb-6">
                  <span className="text-xs font-mono font-bold text-brand-accent">03</span>
                </div>
                <h3 className="text-sm font-bold font-mono tracking-wide text-brand-text-primary mb-3">
                  3. INSIGHT EXTRACTION
                </h3>
                <p className="text-brand-text-muted text-xs leading-relaxed font-sans">
                  Groq Llama-3.3 extracts a concise summary, key decisions, follow-ups, and structural action items.
                </p>
                <div className="mt-6 flex justify-center py-4 bg-brand-bg/40 border border-brand-border rounded">
                  <Sparkles className="w-5 h-5 text-brand-warning animate-pulse" />
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex flex-col bg-brand-surface border border-brand-border rounded-lg p-6 hover:border-brand-accent/40 transition-all">
                <div className="w-10 h-10 border border-brand-border rounded-lg flex items-center justify-center mb-6">
                  <span className="text-xs font-mono font-bold text-brand-accent">04</span>
                </div>
                <h3 className="text-sm font-bold font-mono tracking-wide text-brand-text-primary mb-3">
                  4. KANBAN TASK BOARD
                </h3>
                <p className="text-brand-text-muted text-xs leading-relaxed font-sans">
                  Action items automatically populate as cards. Drag-and-drop to update statuses or manually customize assignee and deadline.
                </p>
                <div className="mt-6 flex justify-center py-4 bg-brand-bg/40 border border-brand-border rounded">
                  <KanbanSquare className="w-5 h-5 text-brand-accent" />
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* FEATURES OVERVIEW SECTION */}
        <section className="max-w-6xl mx-auto px-6 py-24">
          <div className="text-center mb-16">
            <span className="text-[10px] font-mono tracking-widest uppercase text-brand-accent block mb-2">
              features overview
            </span>
            <h2 className="text-2xl md:text-3xl font-bold font-display tracking-tight text-brand-text-primary">
              Everything you need to capture meeting memory
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Card 1 */}
            <div className="flex gap-5 bg-brand-surface border border-brand-border rounded-lg p-6 hover:border-brand-accent/30 transition-all">
              <div className="flex-shrink-0 w-10 h-10 bg-brand-accent/5 rounded-lg border border-brand-accent/25 flex items-center justify-center">
                <Globe className="w-5 h-5 text-brand-accent" />
              </div>
              <div>
                <h3 className="text-sm font-bold font-mono tracking-wide uppercase text-brand-text-primary mb-2">
                  Multilingual Speech Support
                </h3>
                <p className="text-brand-text-muted text-xs leading-relaxed font-sans">
                  No need to manually translate or script your hybrid team meetings. Whisper automatically recognizes 
                  and transcribes conversations containing a natural flow of English, Hindi, and Hinglish.
                </p>
              </div>
            </div>

            {/* Card 2 */}
            <div className="flex gap-5 bg-brand-surface border border-brand-border rounded-lg p-6 hover:border-brand-accent/30 transition-all">
              <div className="flex-shrink-0 w-10 h-10 bg-brand-warning/5 rounded-lg border border-brand-warning/25 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-brand-warning" />
              </div>
              <div>
                <h3 className="text-sm font-bold font-mono tracking-wide uppercase text-brand-text-primary mb-2">
                  Structured AI Extraction
                </h3>
                <p className="text-brand-text-muted text-xs leading-relaxed font-sans">
                  Uses strict structured JSON schemas so that summaries, critical decisions, future follow-up points, 
                  and individual action items are consistently categorized without noise.
                </p>
              </div>
            </div>

            {/* Card 3 */}
            <div className="flex gap-5 bg-brand-surface border border-brand-border rounded-lg p-6 hover:border-brand-accent/30 transition-all">
              <div className="flex-shrink-0 w-10 h-10 bg-brand-accent/5 rounded-lg border border-brand-accent/25 flex items-center justify-center">
                <KanbanSquare className="w-5 h-5 text-brand-accent" />
              </div>
              <div>
                <h3 className="text-sm font-bold font-mono tracking-wide uppercase text-brand-text-primary mb-2">
                  Interactive Kanban Board
                </h3>
                <p className="text-brand-text-muted text-xs leading-relaxed font-sans">
                  Say goodbye to flat checklists. Action items populate as visual cards that you can organize via 
                  smooth drag-and-drop. Easily update assignees, task descriptions, and deadlines.
                </p>
              </div>
            </div>

            {/* Card 4 */}
            <div className="flex gap-5 bg-brand-surface border border-brand-border rounded-lg p-6 hover:border-brand-accent/30 transition-all">
              <div className="flex-shrink-0 w-10 h-10 bg-brand-accent/5 rounded-lg border border-brand-accent/25 flex items-center justify-center">
                <FileText className="w-5 h-5 text-brand-accent" />
              </div>
              <div>
                <h3 className="text-sm font-bold font-mono tracking-wide uppercase text-brand-text-primary mb-2">
                  Report Exporting & Sharing
                </h3>
                <p className="text-brand-text-muted text-xs leading-relaxed font-sans">
                  Generate beautiful monochrome PDF summary reports for your records or copy formatted Markdown to 
                  your clipboard with a single click. Ideal for quick distribution on Slack or email.
                </p>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="border-t border-brand-border bg-brand-surface/40 py-10 mt-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <AudioLines className="w-4 h-4 text-brand-accent" />
            <span className="text-xs font-mono tracking-widest text-brand-text-muted uppercase">
              MeetSense &copy; 2026 &bull; Designed & Developed by{' '}
              <a 
                href="https://samarhirau.dev" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-brand-accent hover:text-brand-accent/80 transition-colors normal-case font-bold"
              >
                Samar Hirau
              </a>
            </span>
          </div>

          <div className="flex items-center gap-6 text-[11px] font-mono tracking-wider uppercase text-brand-text-muted">
            <Link to="/login" className="hover:text-brand-text-primary transition-colors">
              Login
            </Link>
            <Link to="/signup" className="hover:text-brand-text-primary transition-colors">
              Sign Up
            </Link>
            <a 
              href="https://github.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="hover:text-brand-text-primary transition-colors flex items-center gap-1.5"
            >
              <GithubIcon className="w-3.5 h-3.5" />
              GitHub
            </a>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;
