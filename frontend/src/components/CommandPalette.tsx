// src/components/CommandPalette.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, ListTodo, LogOut, FileText } from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  meetings: { _id: string; title: string }[];
  onTriggerRecord?: () => void;
  onLogout?: () => void;
}

const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  meetings,
  onTriggerRecord,
  onLogout,
}) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  // Filter items
  const filteredMeetings = meetings.filter(m =>
    m.title.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 5);

  const actions = [
    {
      id: 'record',
      title: 'Create & Upload Meeting',
      icon: <Plus className="w-4 h-4 text-brand-accent" />,
      perform: () => {
        onClose();
        if (onTriggerRecord) onTriggerRecord();
      }
    },
    {
      id: 'dashboard',
      title: 'Go to Dashboard',
      icon: <ListTodo className="w-4 h-4 text-[#94A3B8]" />,
      perform: () => {
        onClose();
        navigate('/dashboard');
      }
    },
    {
      id: 'logout',
      title: 'Log Out',
      icon: <LogOut className="w-4 h-4 text-[#EF4444]" />,
      perform: () => {
        onClose();
        if (onLogout) onLogout();
      }
    }
  ];

  const filteredActions = actions.filter(a =>
    a.title.toLowerCase().includes(query.toLowerCase())
  );

  const totalItemsCount = filteredMeetings.length + filteredActions.length;

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % totalItemsCount);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + totalItemsCount) % totalItemsCount);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        
        // Execute active index item
        if (selectedIndex < filteredMeetings.length) {
          const targetMeeting = filteredMeetings[selectedIndex];
          onClose();
          navigate(`/meetings/${targetMeeting._id}`);
        } else {
          const actionIndex = selectedIndex - filteredMeetings.length;
          const targetAction = filteredActions[actionIndex];
          if (targetAction) {
            targetAction.perform();
          }
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredMeetings, filteredActions, totalItemsCount, navigate, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200000] flex items-start justify-center pt-[15vh] bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        ref={containerRef}
        className="bg-[#090D12] border border-[#17212B] rounded-xl w-full max-w-lg mx-4 shadow-2xl overflow-hidden animate-scale-in"
      >
        {/* Search header */}
        <div className="flex items-center gap-3 px-4 border-b border-[#17212B]">
          <Search className="w-4.5 h-4.5 text-[#94A3B8] flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search meetings..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            className="w-full py-4 bg-transparent outline-none border-none text-brand-text-primary placeholder-[#64748B] text-xs font-sans"
          />
        </div>

        {/* Command list */}
        <div className="p-2 max-h-[300px] overflow-y-auto">
          {totalItemsCount === 0 && (
            <div className="py-8 text-center text-xs text-[#64748B] font-mono uppercase tracking-wider">
              No results found
            </div>
          )}

          {/* Action items section */}
          {filteredActions.length > 0 && (
            <div className="space-y-1">
              <div className="px-3 py-1.5 text-[9px] font-mono font-bold tracking-widest text-[#64748B] uppercase">
                Quick Actions
              </div>
              {filteredActions.map((action, index) => {
                const globalIndex = index + filteredMeetings.length;
                const isSelected = selectedIndex === globalIndex;

                return (
                  <button
                    key={action.id}
                    onClick={action.perform}
                    onMouseEnter={() => setSelectedIndex(globalIndex)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center justify-between transition-all ${
                      isSelected ? 'bg-[#111822] text-brand-text-primary' : 'text-[#94A3B8]'
                    }`}
                  >
                    <div className="flex items-center gap-3 text-xs font-sans">
                      {action.icon}
                      <span>{action.title}</span>
                    </div>
                    {isSelected && (
                      <span className="text-[10px] font-mono text-[#64748B] uppercase bg-black/30 border border-[#17212B] px-1.5 py-0.5 rounded">
                        Enter
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Meetings section */}
          {filteredMeetings.length > 0 && (
            <div className="mt-2 space-y-1">
              <div className="px-3 py-1.5 text-[9px] font-mono font-bold tracking-widest text-[#64748B] uppercase">
                Meetings ({filteredMeetings.length})
              </div>
              {filteredMeetings.map((meeting, index) => {
                const isSelected = selectedIndex === index;

                return (
                  <button
                    key={meeting._id}
                    onClick={() => {
                      onClose();
                      navigate(`/meetings/${meeting._id}`);
                    }}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center justify-between transition-all ${
                      isSelected ? 'bg-[#111822] text-brand-text-primary' : 'text-[#94A3B8]'
                    }`}
                  >
                    <div className="flex items-center gap-3 text-xs font-sans">
                      <FileText className="w-4 h-4 text-brand-accent" />
                      <span className="truncate max-w-[320px]">{meeting.title}</span>
                    </div>
                    {isSelected ? (
                      <span className="text-[10px] font-mono text-[#64748B] uppercase bg-black/30 border border-[#17212B] px-1.5 py-0.5 rounded">
                        Open
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-[#475569]">
                        Jump &rarr;
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-[#17212B] bg-[#05070A] text-[9px] font-mono text-[#64748B] uppercase tracking-wide">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigation</span>
            <span>↵ Select</span>
          </div>
          <span>Esc Close</span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
