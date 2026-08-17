// src/components/KanbanBoard.tsx
import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import { Plus, User, Calendar, Trash2, X, AlertCircle } from 'lucide-react';

export interface Task {
  _id: string;
  meetingId: string;
  task: string;
  assignedTo: string;
  deadline: string;
  status: 'todo' | 'in-progress' | 'done';
}

interface KanbanBoardProps {
  tasks: Task[];
  onUpdateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  onDeleteTask: (id: string) => Promise<void>;
  onCreateTask: (taskData: Omit<Task, '_id'>) => Promise<void>;
  meetingId: string;
}

const COLUMNS: { id: Task['status']; title: string; colorClass: string; accentClass: string }[] = [
  { id: 'todo', title: 'To Do', colorClass: 'border-t-2 border-t-brand-accent/50', accentClass: 'text-brand-accent' },
  { id: 'in-progress', title: 'In Progress', colorClass: 'border-t-2 border-t-brand-warning/50', accentClass: 'text-brand-warning' },
  { id: 'done', title: 'Done', colorClass: 'border-t-2 border-t-[#10B981]/50', accentClass: 'text-[#10B981]' }
];

const KanbanBoard: React.FC<KanbanBoardProps> = ({
  tasks,
  onUpdateTask,
  onDeleteTask,
  onCreateTask,
  meetingId
}) => {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [addingColumn, setAddingColumn] = useState<Task['status'] | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const [newTaskText, setNewTaskText] = useState<string>('');
  const [newTaskAssignee, setNewTaskAssignee] = useState<string>('');
  const [newTaskDeadline, setNewTaskDeadline] = useState<string>('');

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      return;
    }

    const newStatus = destination.droppableId as Task['status'];
    await onUpdateTask(draggableId, { status: newStatus });
  };

  const handleAddTask = async (columnId: Task['status']) => {
    if (!newTaskText.trim()) return;

    await onCreateTask({
      meetingId,
      task: newTaskText.trim(),
      assignedTo: newTaskAssignee.trim() || 'Unassigned',
      deadline: newTaskDeadline.trim() || 'Not specified',
      status: columnId
    });

    setNewTaskText('');
    setNewTaskAssignee('');
    setNewTaskDeadline('');
    setAddingColumn(null);
  };

  const handleSaveModalTask = async () => {
    if (!selectedTask) return;
    
    await onUpdateTask(selectedTask._id, {
      task: selectedTask.task,
      assignedTo: selectedTask.assignedTo || 'Unassigned',
      deadline: selectedTask.deadline || 'Not specified'
    });

    setSelectedTask(null);
  };

  return (
    <div className="w-full">
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {COLUMNS.map((column) => {
            const columnTasks = tasks.filter((t) => t.status === column.id);

            return (
              <div
                key={column.id}
                className={`flex flex-col bg-brand-surface border border-brand-border rounded-xl p-4 min-h-[480px] h-full transition-all duration-300 ${column.colorClass}`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between mb-4 pb-2.5 border-b border-brand-border">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-mono font-bold uppercase tracking-widest ${column.accentClass}`}>
                      {column.title}
                    </span>
                    <span className="text-[10px] text-[#64748B] font-mono font-bold bg-[#05070A]/50 px-1.5 py-0.5 border border-brand-border rounded">
                      {columnTasks.length}
                    </span>
                  </div>
                  <button
                    onClick={() => setAddingColumn(column.id)}
                    className="p-1 hover:bg-[#111822] rounded border border-transparent hover:border-brand-border text-brand-text-muted hover:text-brand-accent transition-all cursor-pointer"
                    title="Add Action Item"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Task Add Form inside column */}
                {addingColumn === column.id && (
                  <div className="bg-[#05070A] border border-brand-border rounded-xl p-4 mb-4 space-y-3.5 animate-scale-in">
                    <textarea
                      placeholder="Task description..."
                      value={newTaskText}
                      onChange={(e) => setNewTaskText(e.target.value)}
                      className="w-full bg-brand-surface border border-brand-border focus:border-brand-accent rounded-lg p-2.5 text-xs outline-none resize-none text-brand-text-primary placeholder-[#475569] font-sans"
                      rows={2}
                      autoFocus
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Assignee"
                        value={newTaskAssignee}
                        onChange={(e) => setNewTaskAssignee(e.target.value)}
                        className="w-full bg-brand-surface border border-brand-border focus:border-brand-accent rounded-lg px-2.5 py-1.5 text-[10px] outline-none text-brand-text-primary placeholder-[#475569] font-mono"
                      />
                      <input
                        type="text"
                        placeholder="Deadline"
                        value={newTaskDeadline}
                        onChange={(e) => setNewTaskDeadline(e.target.value)}
                        className="w-full bg-brand-surface border border-brand-border focus:border-brand-accent rounded-lg px-2.5 py-1.5 text-[10px] outline-none text-brand-text-primary placeholder-[#475569] font-mono"
                      />
                    </div>
                    <div className="flex justify-end gap-2 text-[10px] font-mono uppercase tracking-widest pt-1">
                      <button
                        onClick={() => setAddingColumn(null)}
                        className="px-3 py-1.5 text-brand-text-muted hover:text-brand-text-primary cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleAddTask(column.id)}
                        className="px-3.5 py-1.5 bg-brand-accent text-brand-bg font-bold rounded-lg hover:bg-brand-accent/90 transition-colors cursor-pointer"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                )}

                {/* Droppable Area */}
                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 transition-all rounded-lg space-y-3 min-h-[350px] ${
                        snapshot.isDraggingOver ? 'bg-[#05070A]/30 border border-dashed border-brand-border/40 p-1.5' : ''
                      }`}
                    >
                      {columnTasks.map((task, index) => (
                        <Draggable key={task._id} draggableId={task._id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              onClick={() => setSelectedTask(task)}
                              className={`bg-[#05070A]/40 border border-brand-border hover:border-brand-border-hover rounded-xl p-4 cursor-pointer select-none transition-all ${
                                snapshot.isDragging ? 'border-brand-accent bg-[#0B0F13] scale-[1.01] shadow-2xl' : ''
                              }`}
                            >
                              <p className="text-xs font-body text-brand-text-primary leading-relaxed mb-3">
                                {task.task}
                              </p>
                              
                              <div className="flex items-center justify-between text-[9px] font-mono tracking-wider uppercase text-brand-text-muted pt-2.5 border-t border-brand-border/60">
                                <span className="flex items-center gap-1.5">
                                  <User className="w-3 h-3 text-brand-accent shrink-0" />
                                  <span className="truncate max-w-[80px] font-bold">{task.assignedTo}</span>
                                </span>
                                
                                <span className="flex items-center gap-1.5">
                                  <Calendar className="w-3 h-3 text-brand-warning shrink-0" />
                                  <span className="truncate max-w-[80px] font-bold">{task.deadline}</span>
                                </span>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      {/* Task Modal Editor */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200000] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#090D12] border border-brand-border rounded-xl w-full max-w-lg shadow-2xl relative overflow-hidden animate-scale-in">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-brand-border">
              <span className="text-[10px] font-bold font-mono uppercase tracking-widest text-brand-text-muted">
                Edit Action Item
              </span>
              <button
                onClick={() => {
                  setSelectedTask(null);
                  setShowDeleteConfirm(false);
                }}
                className="p-1.5 text-brand-text-muted hover:text-brand-text-primary hover:bg-[#111822] rounded-md transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {showDeleteConfirm ? (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl space-y-3 animate-scale-in">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-brand-text-primary">Delete Task</h4>
                      <p className="text-[11px] text-[#8A928C] leading-relaxed">Are you sure you want to delete this action item? This cannot be undone.</p>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 text-[10px] font-mono uppercase tracking-wider pt-2">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-3 py-1.5 text-brand-text-muted hover:text-brand-text-primary cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={async () => {
                        await onDeleteTask(selectedTask._id);
                        setSelectedTask(null);
                        setShowDeleteConfirm(false);
                      }}
                      className="px-3 py-1.5 bg-[#EA5E5E] text-[#EDEFEC] hover:bg-red-600 rounded-lg transition-colors cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold font-mono uppercase tracking-widest text-brand-text-muted">
                      Task Description
                    </label>
                    <textarea
                      value={selectedTask.task}
                      onChange={(e) => setSelectedTask({ ...selectedTask, task: e.target.value })}
                      className="w-full bg-[#05070A] border border-brand-border focus:border-brand-accent rounded-lg p-3.5 text-xs outline-none resize-none text-brand-text-primary font-sans leading-relaxed"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold font-mono uppercase tracking-widest text-brand-text-muted flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-brand-accent" />
                        Assignee
                      </label>
                      <input
                        type="text"
                        value={selectedTask.assignedTo}
                        onChange={(e) => setSelectedTask({ ...selectedTask, assignedTo: e.target.value })}
                        className="w-full bg-[#05070A] border border-brand-border focus:border-brand-accent rounded-lg px-3.5 py-2.5 text-xs outline-none text-brand-text-primary font-mono"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold font-mono uppercase tracking-widest text-brand-text-muted flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-brand-warning" />
                        Deadline
                      </label>
                      <input
                        type="text"
                        value={selectedTask.deadline}
                        onChange={(e) => setSelectedTask({ ...selectedTask, deadline: e.target.value })}
                        className="w-full bg-[#05070A] border border-brand-border focus:border-brand-accent rounded-lg px-3.5 py-2.5 text-xs outline-none text-brand-text-primary font-mono"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Actions Footer */}
            {!showDeleteConfirm && (
              <div className="flex items-center justify-between p-5 border-t border-brand-border bg-[#05070A]/35">
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-1.5 px-3 py-2 text-[10px] font-bold font-mono uppercase tracking-wider text-[#EA5E5E] hover:bg-red-950/20 border border-transparent hover:border-red-500/10 rounded-lg transition-all cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Task
                </button>

                <div className="flex gap-2 text-[10px] font-mono uppercase tracking-widest">
                  <button
                    onClick={() => setSelectedTask(null)}
                    className="px-4 py-2 text-brand-text-muted hover:text-brand-text-primary cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveModalTask}
                    className="px-4 py-2 bg-brand-accent hover:bg-brand-accent/90 text-brand-bg font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    Save
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default KanbanBoard;
