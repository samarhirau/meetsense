// src/pages/LandingPage.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  AudioLines,
  UploadCloud,
  Sparkles,
  KanbanSquare,
  ArrowRight,
  Globe,
  FileText,
  Menu,
  X,
  CheckCircle2,
  Clock,
  Search,
  ShieldAlert,
  User
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
          className={`w-[2px] rounded-full transition-all duration-300 ${
            active
              ? 'bg-brand-accent'
              : 'bg-[#17212B]'
          } ${animate ? 'animate-pulse-fast' : ''}`}
          style={{
            height: `${height * 1.3}px`,
            animationDelay: `${i * 0.05}s`,
          }}
        />
      ))}
    </div>
  );
};

const LandingPage: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToHowItWorks = (e: React.MouseEvent) => {
    e.preventDefault();
    const element = document.getElementById('how-it-works');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text-primary font-sans flex flex-col relative overflow-hidden selection:bg-brand-accent/30 selection:text-white">
      {/* Background Decorative Ambient Glows */}
      <div className="absolute top-[-10%] left-[-15%] w-[55%] h-[55%] bg-brand-accent/5 rounded-full blur-[130px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-15%] w-[55%] h-[55%] bg-brand-accent/5 rounded-full blur-[130px] pointer-events-none"></div>

      {/* Top Navbar */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-brand-bg/80 backdrop-blur-md border-b border-brand-border py-4 shadow-lg shadow-black/10'
            : 'bg-transparent py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-tr from-brand-accent to-brand-accent/80 rounded-lg flex items-center justify-center shadow-lg shadow-brand-accent/15">
              <AudioLines className="w-4.5 h-4.5 text-brand-bg" />
            </div>
            <span className="text-base font-bold font-display tracking-tight text-brand-text-primary">
              MeetSense
            </span>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-8 text-[11px] font-mono font-bold uppercase tracking-wider text-brand-text-muted">
            <a href="#features" className="hover:text-brand-text-primary transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-brand-text-primary transition-colors">How it works</a>
            <a href="#download" className="hover:text-brand-text-primary transition-colors">Extension</a>
          </div>

          {/* Auth Actions */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              to="/login"
              className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-text-muted hover:text-brand-text-primary px-3 py-2 transition-colors"
            >
              Login
            </Link>
            <Link
              to="/signup"
              className="bg-brand-accent hover:bg-brand-accent/95 text-brand-bg font-bold font-mono text-[10px] uppercase tracking-widest px-5 py-2.5 rounded-lg transition-all active:scale-[0.98] shadow-lg shadow-brand-accent/10 cursor-pointer"
            >
              Get Started Free →
            </Link>
          </div>

          {/* Mobile Menu Icon */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1 text-brand-text-muted hover:text-brand-text-primary transition-colors"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-[#090D12] border-b border-brand-border p-6 space-y-6 flex flex-col text-sm font-mono tracking-wider uppercase font-bold text-brand-text-muted shadow-2xl animate-fade-in">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="hover:text-brand-text-primary transition-colors"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="hover:text-brand-text-primary transition-colors"
            >
              How it works
            </a>
            <a
              href="#download"
              onClick={() => setMobileMenuOpen(false)}
              className="hover:text-brand-text-primary transition-colors"
            >
              Extension
            </a>
            <div className="border-t border-brand-border pt-6 flex flex-col gap-4">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="text-center py-2 hover:text-brand-text-primary transition-colors"
              >
                Login
              </Link>
              <Link
                to="/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="bg-brand-accent hover:bg-brand-accent/95 text-brand-bg font-bold py-3 rounded-lg text-center shadow-lg"
              >
                Get Started Free →
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Main Container */}
      <main className="flex-grow pt-32">
        {/* HERO SECTION */}
        <section className="max-w-5xl mx-auto px-6 text-center flex flex-col items-center select-none">
          {/* Eyebrow badge */}
          <div className="mb-6 inline-flex items-center gap-2 border border-brand-border px-3.5 py-1.5 rounded-full bg-[#090D12]/60 backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-accent animate-ping"></span>
            <span className="text-[9px] font-mono font-bold tracking-widest uppercase text-brand-accent">
              transcription &bull; summary &bull; action items
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-display tracking-tight leading-[1.1] max-w-4xl text-brand-text-primary">
            Meetings happen. <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-brand-accent via-indigo-300 to-[#F8FAFC] bg-clip-text text-transparent">
              MeetSense remembers.
            </span>
          </h1>

          {/* Supporting Text */}
          <p className="mt-6 text-brand-text-muted text-xs md:text-sm max-w-2xl leading-relaxed font-sans font-medium">
            AI-powered meeting transcription, summaries, and action items — automatically organized in one place. Support for code-switched Hinglish, Hindi, and English conversations.
          </p>

          {/* Action CTAs */}
          <div className="mt-10 flex flex-col sm:flex-row items-center gap-4 justify-center w-full max-w-sm sm:max-w-none">
            <Link
              to="/signup"
              className="w-full sm:w-auto bg-brand-accent hover:bg-brand-accent/95 text-brand-bg font-bold font-mono text-[10px] uppercase tracking-widest px-8 py-3.5 rounded-lg transition-all active:scale-[0.97] flex items-center justify-center gap-2 shadow-lg shadow-brand-accent/15 cursor-pointer"
            >
              Get Started Free →
            </Link>
            <a
              href="#how-it-works"
              onClick={scrollToHowItWorks}
              className="w-full sm:w-auto border border-brand-border hover:border-brand-border-hover text-brand-text-primary font-bold font-mono text-[10px] uppercase tracking-widest px-8 py-3.5 rounded-lg transition-all flex items-center justify-center"
            >
              See How It Works
            </a>
          </div>

          {/* Realistic Dashboard Mockup */}
          <div className="mt-20 w-full max-w-5xl bg-[#090D12] border border-brand-border rounded-xl shadow-2xl relative overflow-hidden flex text-left h-[420px] select-none">
            {/* Sidebar Mockup */}
            <div className="w-48 border-r border-brand-border bg-[#05070A]/50 p-4 flex flex-col justify-between hidden sm:flex">
              <div className="space-y-6">
                <div className="flex items-center gap-2 px-2">
                  <div className="w-5 h-5 bg-brand-accent rounded flex items-center justify-center">
                    <AudioLines className="w-3 h-3 text-brand-bg" />
                  </div>
                  <span className="text-xs font-bold text-brand-text-primary font-display">MeetSense</span>
                </div>
                
                <div className="space-y-1 text-[10px] font-mono font-bold uppercase tracking-wider text-brand-text-muted">
                  <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-[#111822] text-brand-text-primary border border-brand-border/40">
                    <Clock className="w-3.5 h-3.5 text-brand-accent" />
                    <span>Overview</span>
                  </div>
                  <div className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:text-brand-text-primary transition-colors">
                    <FileText className="w-3.5 h-3.5" />
                    <span>Meetings</span>
                  </div>
                  <div className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:text-brand-text-primary transition-colors">
                    <KanbanSquare className="w-3.5 h-3.5" />
                    <span>Action Items</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 border-t border-brand-border pt-4 px-2 text-[10px] font-mono font-bold text-brand-text-muted">
                <div className="w-5 h-5 rounded-full bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center text-brand-accent font-sans">
                  S
                </div>
                <span className="truncate">samar@gmail.com</span>
              </div>
            </div>

            {/* Dashboard Workspace Mockup */}
            <div className="flex-1 bg-[#090D12] p-6 flex flex-col justify-between overflow-hidden">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold font-mono tracking-wider uppercase text-brand-text-muted">Good evening 👋</h3>
                    <h2 className="text-lg font-bold text-brand-text-primary mt-1">Here's what happened this week.</h2>
                  </div>
                  
                  {/* Stats pill */}
                  <div className="flex gap-4 text-xs font-mono font-bold text-brand-text-primary">
                    <div className="bg-[#05070A] border border-brand-border rounded-lg px-4 py-2 flex flex-col">
                      <span className="text-[10px] text-brand-text-muted uppercase">Meetings</span>
                      <span className="text-sm text-brand-accent mt-0.5">5 Total</span>
                    </div>
                  </div>
                </div>

                {/* Dashboard mock list */}
                <div className="space-y-3">
                  <div className="text-[10px] font-mono font-bold tracking-widest text-[#64748B] uppercase">Recent meetings</div>
                  
                  {/* Meeting Item 1 */}
                  <div className="bg-[#05070A] border border-brand-border rounded-lg p-4 flex items-center justify-between hover:border-brand-accent/35 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-brand-accent/5 border border-brand-accent/20 rounded-lg text-brand-accent">
                        <CheckCircle2 className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-brand-text-primary">Product Design Sync & Layout Verification</h4>
                        <div className="flex items-center gap-3 text-[10px] font-mono text-[#64748B] mt-1.5">
                          <span>Today at 7:15 PM</span>
                          <span>&bull;</span>
                          <span>9m 42s</span>
                        </div>
                      </div>
                    </div>
                    <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 border border-brand-accent/20 bg-brand-accent/10 text-brand-accent rounded-md">
                      completed
                    </span>
                  </div>

                  {/* Meeting Item 2 */}
                  <div className="bg-[#05070A] border border-brand-border rounded-lg p-4 flex items-center justify-between hover:border-brand-accent/35 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-brand-accent/5 border border-brand-accent/20 rounded-lg text-brand-accent">
                        <CheckCircle2 className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-brand-text-primary">Backend DB Queries & Pipeline Calibration</h4>
                        <div className="flex items-center gap-3 text-[10px] font-mono text-[#64748B] mt-1.5">
                          <span>Yesterday at 11:20 AM</span>
                          <span>&bull;</span>
                          <span>18m 10s</span>
                        </div>
                      </div>
                    </div>
                    <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 border border-brand-accent/20 bg-brand-accent/10 text-brand-accent rounded-md">
                      completed
                    </span>
                  </div>
                </div>
              </div>

              {/* Status bar */}
              <div className="flex items-center justify-between text-[9px] font-mono text-brand-text-muted uppercase border-t border-brand-border pt-4 mt-2">
                <span>Vite Development Server Connected</span>
                <span className="text-brand-accent font-bold animate-pulse">&bull; API Online</span>
              </div>
            </div>
          </div>
        </section>

        {/* PRODUCT PROOF */}
        <section className="max-w-6xl mx-auto px-6 py-20 border-t border-brand-border mt-16 text-center">
          <span className="text-[10px] font-mono tracking-widest uppercase text-brand-accent block mb-2">
            built for better meetings
          </span>
          <h2 className="text-2xl md:text-3xl font-bold font-display tracking-tight text-brand-text-primary mb-12">
            AI meeting intelligence that works for you.
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
            <div className="border border-brand-border bg-brand-surface/40 p-6 rounded-xl space-y-3">
              <div className="w-8 h-8 bg-brand-accent/5 border border-brand-accent/20 text-brand-accent rounded-lg flex items-center justify-center">
                <Globe className="w-4.5 h-4.5" />
              </div>
              <h3 className="text-xs font-bold font-mono tracking-wide uppercase text-brand-text-primary">AI Transcription</h3>
              <p className="text-[11px] text-brand-text-muted leading-relaxed font-sans">
                Transcribe voice notes containing raw English, Hindi, or blended Hinglish expressions automatically.
              </p>
            </div>
            <div className="border border-brand-border bg-brand-surface/40 p-6 rounded-xl space-y-3">
              <div className="w-8 h-8 bg-brand-accent/5 border border-brand-accent/20 text-brand-accent rounded-lg flex items-center justify-center">
                <FileText className="w-4.5 h-4.5" />
              </div>
              <h3 className="text-xs font-bold font-mono tracking-wide uppercase text-brand-text-primary">Smart Summaries</h3>
              <p className="text-[11px] text-brand-text-muted leading-relaxed font-sans">
                Extract concise 2-4 sentence executive digests alongside a list of key technical decisions.
              </p>
            </div>
            <div className="border border-brand-border bg-brand-surface/40 p-6 rounded-xl space-y-3">
              <div className="w-8 h-8 bg-brand-accent/5 border border-brand-accent/20 text-brand-accent rounded-lg flex items-center justify-center">
                <KanbanSquare className="w-4.5 h-4.5" />
              </div>
              <h3 className="text-xs font-bold font-mono tracking-wide uppercase text-brand-text-primary">Action Items</h3>
              <p className="text-[11px] text-brand-text-muted leading-relaxed font-sans">
                Populate actionable checklist items directly into your dashboard's Kanban board.
              </p>
            </div>
            <div className="border border-brand-border bg-brand-surface/40 p-6 rounded-xl space-y-3">
              <div className="w-8 h-8 bg-brand-accent/5 border border-brand-accent/20 text-brand-accent rounded-lg flex items-center justify-center">
                <Search className="w-4.5 h-4.5" />
              </div>
              <h3 className="text-xs font-bold font-mono tracking-wide uppercase text-brand-text-primary">Meeting Search</h3>
              <p className="text-[11px] text-brand-text-muted leading-relaxed font-sans">
                Use keyword search across transcripts and outcomes to retrieve details from past sessions.
              </p>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS SECTION */}
        <section id="how-it-works" className="bg-[#090D12]/40 border-t border-b border-brand-border py-24 select-none">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-16">
              <span className="text-[10px] font-mono tracking-widest uppercase text-brand-accent block mb-2">
                how it works
              </span>
              <h2 className="text-2xl md:text-3xl font-bold font-display tracking-tight text-brand-text-primary">
                A seamless pipeline from speech to outcomes
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
              {/* Step 1 */}
              <div className="flex flex-col bg-brand-surface border border-brand-border rounded-lg p-6 hover:border-brand-accent/30 transition-all">
                <div className="w-10 h-10 border border-brand-border rounded-lg flex items-center justify-center mb-6">
                  <span className="text-xs font-mono font-bold text-brand-accent">01</span>
                </div>
                <h3 className="text-sm font-bold font-mono tracking-wide text-brand-text-primary mb-3">
                  1. RECORD & STREAM
                </h3>
                <p className="text-brand-text-muted text-xs leading-relaxed font-sans">
                  Record your Google Meet using our Extension status pill or upload your audio/video files manually.
                </p>
                <div className="mt-6 flex justify-center py-2 bg-[#05070A] border border-brand-border rounded-lg">
                  <UploadCloud className="w-5 h-5 text-brand-text-muted" />
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col bg-brand-surface border border-brand-border rounded-lg p-6 hover:border-brand-accent/30 transition-all">
                <div className="w-10 h-10 border border-brand-border rounded-lg flex items-center justify-center mb-6">
                  <span className="text-xs font-mono font-bold text-brand-accent">02</span>
                </div>
                <h3 className="text-sm font-bold font-mono tracking-wide text-brand-text-primary mb-3">
                  2. AI UNDERSTANDING
                </h3>
                <p className="text-brand-text-muted text-xs leading-relaxed font-sans">
                  Groq Whisper transcribes speech, and Llama 3.3 models structure key topics and decisions.
                </p>
                <div className="mt-6 flex justify-center py-2 bg-[#05070A] border border-brand-border rounded-lg">
                  <StaticWaveform count={12} animate={true} />
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col bg-brand-surface border border-brand-border rounded-lg p-6 hover:border-brand-accent/30 transition-all">
                <div className="w-10 h-10 border border-brand-border rounded-lg flex items-center justify-center mb-6">
                  <span className="text-xs font-mono font-bold text-brand-accent">03</span>
                </div>
                <h3 className="text-sm font-bold font-mono tracking-wide text-brand-text-primary mb-3">
                  3. ACT ON ACTION ITEMS
                </h3>
                <p className="text-brand-text-muted text-xs leading-relaxed font-sans">
                  Action items automatically populate your Kanban board. Export reports in PDF or Markdown format.
                </p>
                <div className="mt-6 flex justify-center py-2 bg-[#05070A] border border-brand-border rounded-lg">
                  <Sparkles className="w-5 h-5 text-brand-accent" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* AI MEETING SHOWCASE SECTION */}
        <section className="max-w-5xl mx-auto px-6 py-24 select-none">
          <div className="text-center mb-16">
            <span className="text-[10px] font-mono tracking-widest uppercase text-brand-accent block mb-2">
              showcase
            </span>
            <h2 className="text-2xl md:text-3xl font-bold font-display tracking-tight text-brand-text-primary">
              AI Meeting Intelligence at a glance
            </h2>
            <p className="mt-3 text-brand-text-muted text-xs max-w-xl mx-auto font-sans leading-relaxed">
              Witness how raw meeting transcripts are summarized and mapped to clean, structural components.
            </p>
          </div>

          <div className="bg-brand-surface border border-brand-border rounded-xl p-8 shadow-2xl space-y-6">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-brand-border pb-6 gap-4">
              <div>
                <h3 className="text-base font-bold text-brand-text-primary">Product Roadmap Alignment & Sprint Planning</h3>
                <div className="flex items-center gap-3 text-[10px] font-mono text-brand-text-muted mt-2 uppercase tracking-wide">
                  <span>Duration: 42m 15s</span>
                  <span>&bull;</span>
                  <span>Participants: Samar, Amit, Priya</span>
                </div>
              </div>
              
              <div className="flex gap-2">
                <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 border border-[#22C55E]/20 bg-[#22C55E]/10 text-[#4ADE80] rounded">
                  Processed
                </span>
              </div>
            </div>

            {/* AI Summary Block */}
            <div className="space-y-2">
              <h4 className="text-[10px] font-mono font-bold uppercase tracking-widest text-brand-accent flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                AI Summary
              </h4>
              <p className="text-xs text-brand-text-muted leading-relaxed font-sans">
                The team aligned on implementing a custom delete modal to replace browser confirm prompts. Samar took ownership of the Mongoose data deletion calls, and Amit was assigned to redesign the Landing page layout by Friday.
              </p>
            </div>

            {/* Split row (Key decisions / Action items) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-brand-border/60">
              <div className="space-y-3">
                <h4 className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#EF4444]">
                  Key Decisions
                </h4>
                <ul className="space-y-2 text-xs text-brand-text-muted list-disc list-inside leading-relaxed font-sans">
                  <li>Replace standard browser `confirm()` calls with a styled dark overlay component.</li>
                  <li>Package Chrome extension inside `/meetsense-extension.zip` served at build-time.</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#F59E0B]">
                  Action Items
                </h4>
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs border border-brand-border bg-[#05070A]/50 p-2.5 rounded-lg">
                    <span className="text-brand-text-primary">Redesign Landing page layout</span>
                    <span className="text-[9px] font-mono font-bold uppercase bg-brand-accent/10 border border-brand-accent/20 px-2 py-0.5 rounded text-brand-accent">
                      Amit
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs border border-brand-border bg-[#05070A]/50 p-2.5 rounded-lg">
                    <span className="text-brand-text-primary">Inject Mongoose deletion API</span>
                    <span className="text-[9px] font-mono font-bold uppercase bg-brand-accent/10 border border-brand-accent/20 px-2 py-0.5 rounded text-brand-accent">
                      Samar
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* BEFORE VS AFTER SECTION */}
        <section className="max-w-5xl mx-auto px-6 py-16 border-t border-brand-border text-center">
          <span className="text-[10px] font-mono tracking-widest uppercase text-brand-accent block mb-2">
            comparison
          </span>
          <h2 className="text-2xl md:text-3xl font-bold font-display tracking-tight text-brand-text-primary mb-12">
            Why Teams Choose MeetSense
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
            {/* Without MeetSense */}
            <div className="bg-brand-surface border border-brand-border rounded-xl p-8 space-y-6">
              <div className="flex items-center gap-3 border-b border-brand-border pb-4">
                <div className="p-1.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold font-mono tracking-widest uppercase text-brand-text-primary">
                  Without MeetSense
                </h3>
              </div>
              <ul className="space-y-4 text-xs text-brand-text-muted font-sans font-medium">
                <li className="flex items-start gap-3">
                  <span className="text-red-500 font-bold mt-0.5">&times;</span>
                  <span>Manual note-taking distracts from the core discussion.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-500 font-bold mt-0.5">&times;</span>
                  <span>Decisions are missed and lost in long, unindexed email chains.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-500 font-bold mt-0.5">&times;</span>
                  <span>Searching transcripts takes hours of parsing manually.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-500 font-bold mt-0.5">&times;</span>
                  <span>Action items are forgotten immediately after disconnecting.</span>
                </li>
              </ul>
            </div>

            {/* With MeetSense */}
            <div className="bg-brand-surface border border-brand-accent/25 rounded-xl p-8 space-y-6 shadow-lg shadow-brand-accent/5">
              <div className="flex items-center gap-3 border-b border-brand-border pb-4">
                <div className="p-1.5 bg-brand-accent/10 border border-brand-accent/20 text-brand-accent rounded-lg">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold font-mono tracking-widest uppercase text-brand-text-primary">
                  With MeetSense
                </h3>
              </div>
              <ul className="space-y-4 text-xs text-brand-text-muted font-sans font-medium">
                <li className="flex items-start gap-3">
                  <span className="text-brand-accent font-bold mt-0.5">&bull;</span>
                  <span>Automatic hands-free note capturing runs silently in background.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-brand-accent font-bold mt-0.5">&bull;</span>
                  <span>Clear decision indexes list every consensus reached.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-brand-accent font-bold mt-0.5">&bull;</span>
                  <span>Searchable meetings database retrieves insights in seconds.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-brand-accent font-bold mt-0.5">&bull;</span>
                  <span>Organized Kanban cards automatically assign tasks to owners.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* FEATURES OVERVIEW SECTION */}
        <section id="features" className="max-w-6xl mx-auto px-6 py-20 border-t border-brand-border">
          <div className="text-center mb-16">
            <span className="text-[10px] font-mono tracking-widest uppercase text-brand-accent block mb-2">
              features overview
            </span>
            <h2 className="text-2xl md:text-3xl font-bold font-display tracking-tight text-brand-text-primary">
              Everything you need to capture meeting memory
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="bg-brand-surface border border-brand-border rounded-xl p-6 hover:border-brand-accent/30 transition-all space-y-4">
              <div className="w-9 h-9 bg-brand-accent/5 rounded-lg border border-brand-accent/20 flex items-center justify-center text-brand-accent">
                <Globe className="w-4.5 h-4.5" />
              </div>
              <h3 className="text-xs font-bold font-mono tracking-wide uppercase text-brand-text-primary">
                Smart Transcription
              </h3>
              <p className="text-[11px] text-brand-text-muted leading-relaxed font-sans">
                Whisper models accurately transcribe speech, including natural English, pure Hindi, or mixed Hinglish conversations.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-brand-surface border border-brand-border rounded-xl p-6 hover:border-brand-accent/30 transition-all space-y-4">
              <div className="w-9 h-9 bg-brand-accent/5 rounded-lg border border-brand-accent/20 flex items-center justify-center text-brand-accent">
                <Sparkles className="w-4.5 h-4.5" />
              </div>
              <h3 className="text-xs font-bold font-mono tracking-wide uppercase text-brand-text-primary">
                AI Meeting Summary
              </h3>
              <p className="text-[11px] text-brand-text-muted leading-relaxed font-sans">
                Consistently structures meeting memory into a clean summary outline, key decision bullet points, and follow-ups.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-brand-surface border border-brand-border rounded-xl p-6 hover:border-brand-accent/30 transition-all space-y-4">
              <div className="w-9 h-9 bg-brand-accent/5 rounded-lg border border-brand-accent/20 flex items-center justify-center text-brand-accent">
                <KanbanSquare className="w-4.5 h-4.5" />
              </div>
              <h3 className="text-xs font-bold font-mono tracking-wide uppercase text-brand-text-primary">
                Automatic Action Items
              </h3>
              <p className="text-[11px] text-brand-text-muted leading-relaxed font-sans">
                Extracts actionable checklist tasks and pushes them directly onto your project board.
              </p>
            </div>

            {/* Card 4 */}
            <div className="bg-brand-surface border border-brand-border rounded-xl p-6 hover:border-brand-accent/30 transition-all space-y-4">
              <div className="w-9 h-9 bg-brand-accent/5 rounded-lg border border-brand-accent/20 flex items-center justify-center text-brand-accent">
                <User className="w-4.5 h-4.5" />
              </div>
              <h3 className="text-xs font-bold font-mono tracking-wide uppercase text-brand-text-primary">
                Speaker Identification
              </h3>
              <p className="text-[11px] text-brand-text-muted leading-relaxed font-sans">
                Resolves assignee tags automatically based on speaker naming declarations in the transcript files.
              </p>
            </div>

            {/* Card 5 */}
            <div className="bg-brand-surface border border-brand-border rounded-xl p-6 hover:border-brand-accent/30 transition-all space-y-4">
              <div className="w-9 h-9 bg-brand-accent/5 rounded-lg border border-brand-accent/20 flex items-center justify-center text-brand-accent">
                <Search className="w-4.5 h-4.5" />
              </div>
              <h3 className="text-xs font-bold font-mono tracking-wide uppercase text-brand-text-primary">
                Meeting Search
              </h3>
              <p className="text-[11px] text-brand-text-muted leading-relaxed font-sans">
                Search transcripts and summaries globally across your entire history of meetings.
              </p>
            </div>

            {/* Card 6 */}
            <div className="bg-brand-surface border border-brand-border rounded-xl p-6 hover:border-brand-accent/30 transition-all space-y-4">
              <div className="w-9 h-9 bg-brand-accent/5 rounded-lg border border-brand-accent/20 flex items-center justify-center text-brand-accent">
                <FileText className="w-4.5 h-4.5" />
              </div>
              <h3 className="text-xs font-bold font-mono tracking-wide uppercase text-brand-text-primary">
                Meeting Insights
              </h3>
              <p className="text-[11px] text-brand-text-muted leading-relaxed font-sans">
                Download structured monochrome PDF reports or copy markdown summaries to your clipboard instantly.
              </p>
            </div>
          </div>
        </section>

        {/* BROWSER EXTENSION DOWNLOAD SECTION */}
        <section id="download" className="bg-[#090D12]/40 border-t border-b border-brand-border py-24 select-none">
          <div className="max-w-4xl mx-auto px-6 space-y-12">
            <div className="text-center space-y-4">
              <span className="text-[10px] font-mono tracking-widest uppercase text-brand-accent block">
                browser companion
              </span>
              <h2 className="text-2xl md:text-3xl font-bold font-display tracking-tight text-brand-text-primary">
                Download the Chrome Extension
              </h2>
              <p className="text-xs text-brand-text-muted max-w-xl mx-auto font-sans leading-relaxed">
                Start recording Google Meet calls directly in your browser with a single click. Audios stream, transcribe, and sync automatically.
              </p>
            </div>

            <div className="bg-brand-surface border border-brand-border rounded-xl p-8 space-y-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6 border-b border-brand-border pb-6">
                <div>
                  <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-brand-text-primary">
                    Packaged Unpacked Extension
                  </h3>
                  <p className="text-[10px] text-brand-text-muted mt-1 leading-relaxed">
                    Download static zip containing manifest v3 code files.
                  </p>
                </div>
                <a
                  href="/meetsense-extension.zip"
                  download="meetsense-extension.zip"
                  className="w-full sm:w-auto bg-brand-accent hover:bg-brand-accent/95 text-brand-bg font-bold font-mono text-[10px] uppercase tracking-widest px-6 py-3 rounded-lg transition-all active:scale-[0.97] flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-brand-accent/15"
                >
                  Download Extension Zip
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>

              <div className="space-y-3">
                <h4 className="text-[10px] font-bold font-mono uppercase tracking-wider text-brand-accent">
                  Developer Mode Install steps:
                </h4>
                <ol className="list-decimal list-inside space-y-2 text-[11px] text-brand-text-muted leading-relaxed font-sans pl-1">
                  <li>Download and extract the <code className="text-brand-accent font-mono bg-brand-bg/50 px-1 py-0.5 rounded text-[10px]">meetsense-extension.zip</code> package.</li>
                  <li>Go to <code className="text-brand-accent font-mono bg-brand-bg/50 px-1 py-0.5 rounded text-[10px]">chrome://extensions</code> in Google Chrome.</li>
                  <li>Enable <strong className="text-brand-text-primary">"Developer mode"</strong> in the top-right toolbar toggle.</li>
                  <li>Click <strong className="text-brand-text-primary">"Load unpacked"</strong> and open the extracted extension folder.</li>
                  <li>Pin the MeetSense pill to your extension toolbar for one-click access.</li>
                </ol>
              </div>
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="max-w-4xl mx-auto px-6 py-24 text-center space-y-8 select-none">
          <h2 className="text-3xl md:text-4xl font-bold font-display tracking-tight text-brand-text-primary max-w-xl mx-auto">
            Stop taking notes. <br />
            Start taking action.
          </h2>
          <p className="text-xs text-brand-text-muted max-w-md mx-auto leading-relaxed">
            Let MeetSense turn every conversation into clear outcomes, structured decisions, and organized task board items.
          </p>
          <div className="flex justify-center">
            <Link
              to="/signup"
              className="bg-brand-accent hover:bg-brand-accent/95 text-brand-bg font-bold font-mono text-[10px] uppercase tracking-widest px-8 py-3.5 rounded-lg transition-all shadow-lg shadow-brand-accent/15 cursor-pointer"
            >
              Start Using MeetSense →
            </Link>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-brand-border bg-brand-surface/40 py-12 mt-12 select-none">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <AudioLines className="w-5 h-5 text-brand-accent" />
              <span className="text-sm font-bold text-brand-text-primary font-display">MeetSense</span>
            </div>
            <p className="text-[11px] text-brand-text-muted leading-relaxed max-w-xs font-sans">
              Turn meetings into momentum. AI-powered meeting transcription and task board synchronization.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="text-[10px] font-mono font-bold uppercase tracking-widest text-brand-text-primary">Product</h4>
            <div className="flex flex-col gap-2 text-xs text-brand-text-muted font-sans">
              <a href="#features" className="hover:text-brand-text-primary transition-colors">Features</a>
              <a href="#how-it-works" className="hover:text-brand-text-primary transition-colors">How it works</a>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-[10px] font-mono font-bold uppercase tracking-widest text-brand-text-primary">Resources</h4>
            <div className="flex flex-col gap-2 text-xs text-brand-text-muted font-sans">
              <a href="#download" className="hover:text-brand-text-primary transition-colors">Documentation</a>
              <a href="#download" className="hover:text-brand-text-primary transition-colors">Chrome Extension</a>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-[10px] font-mono font-bold uppercase tracking-widest text-brand-text-primary">Developer</h4>
            <div className="flex flex-col gap-2 text-xs text-brand-text-muted font-sans">
              <a href="https://samarhirau.dev" target="_blank" rel="noopener noreferrer" className="hover:text-brand-text-primary transition-colors">
                Samar Hirau dev
              </a>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 border-t border-brand-border pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-[10px] font-mono text-brand-text-muted uppercase">
            MeetSense &copy; 2026 &bull; Designed & Developed by Samar Hirau
          </span>

          <div className="flex items-center gap-6 text-[11px] font-mono text-brand-text-muted uppercase">
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
