import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import { Plus, User, Calendar, Trash2, X } from 'lucide-react';

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
  { id: 'todo', title: 'To Do', colorClass: 'border-t-2 border-t-brand-accent', accentClass: 'text-brand-accent' },
  { id: 'in-progress', title: 'In Progress', colorClass: 'border-t-2 border-t-brand-warning', accentClass: 'text-brand-warning' },
  { id: 'done', title: 'Done', colorClass: 'border-t-2 border-t-[#558C73]', accentClass: 'text-[#7FE0B5]' }
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
                className={`flex flex-col bg-brand-surface border border-brand-border rounded-lg p-4 min-h-[500px] h-full ${column.colorClass}`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-brand-border">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold font-mono uppercase tracking-widest ${column.accentClass}`}>
                      {column.title}
                    </span>
                    <span className="text-[10px] text-brand-text-muted font-mono font-bold">
                      ({columnTasks.length})
                    </span>
                  </div>
                  <button
                    onClick={() => setAddingColumn(column.id)}
                    className="p-1 hover:bg-brand-bg rounded-md text-brand-text-muted hover:text-brand-accent transition-colors"
                    title="Add Action Item"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Task Add Form inside column */}
                {addingColumn === column.id && (
                  <div className="bg-brand-bg border border-brand-border rounded-lg p-3 mb-4 space-y-3">
                    <textarea
                      placeholder="Task description..."
                      value={newTaskText}
                      onChange={(e) => setNewTaskText(e.target.value)}
                      className="w-full bg-brand-surface border border-brand-border focus:border-brand-accent rounded-md p-2 text-xs outline-none resize-none text-brand-text-primary placeholder-slate-700 font-sans"
                      rows={2}
                      autoFocus
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Assignee"
                        value={newTaskAssignee}
                        onChange={(e) => setNewTaskAssignee(e.target.value)}
                        className="w-full bg-brand-surface border border-brand-border focus:border-brand-accent rounded-md px-2 py-1.5 text-[10px] outline-none text-brand-text-primary placeholder-slate-750 font-mono"
                      />
                      <input
                        type="text"
                        placeholder="Deadline"
                        value={newTaskDeadline}
                        onChange={(e) => setNewTaskDeadline(e.target.value)}
                        className="w-full bg-brand-surface border border-brand-border focus:border-brand-accent rounded-md px-2 py-1.5 text-[10px] outline-none text-brand-text-primary placeholder-slate-750 font-mono"
                      />
                    </div>
                    <div className="flex justify-end gap-2 text-[10px] font-mono uppercase tracking-wider pt-1">
                      <button
                        onClick={() => setAddingColumn(null)}
                        className="px-2 py-1 text-brand-text-muted hover:text-brand-text-primary"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleAddTask(column.id)}
                        className="px-2.5 py-1 bg-brand-accent text-brand-bg font-bold rounded-md hover:bg-brand-accent/90"
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
                      className={`flex-1 transition-all rounded-lg p-1 space-y-3 ${
                        snapshot.isDraggingOver ? 'bg-brand-bg/40' : ''
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
                              className={`bg-brand-surface border border-brand-border hover:border-brand-text-muted/40 rounded-lg p-4 cursor-pointer select-none transition-all ${
                                snapshot.isDragging ? 'border-brand-accent bg-brand-bg/60 scale-[1.01]' : ''
                              }`}
                            >
                              <p className="text-xs font-body text-brand-text-primary leading-relaxed mb-3">
                                {task.task}
                              </p>
                              
                              <div className="flex items-center justify-between text-[9px] font-mono tracking-widest uppercase text-brand-text-muted pt-2 border-t border-brand-border">
                                <span className="flex items-center gap-1">
                                  <User className="w-3.5 h-3.5 text-brand-accent shrink-0" />
                                  <span className="truncate max-w-[80px]">{task.assignedTo}</span>
                                </span>
                                
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3.5 h-3.5 text-brand-warning shrink-0" />
                                  <span className="truncate max-w-[80px]">{task.deadline}</span>
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
        <div className="fixed inset-0 bg-brand-bg/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-brand-surface border border-brand-border rounded-lg w-full max-w-lg shadow-none relative">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-brand-border">
              <span className="text-[10px] font-bold font-mono uppercase tracking-widest text-brand-text-muted">
                Edit Action Item
              </span>
              <button
                onClick={() => setSelectedTask(null)}
                className="p-1.5 text-brand-text-muted hover:text-brand-text-primary hover:bg-brand-bg rounded-md transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="block text-[10px] font-bold font-mono uppercase tracking-widest text-brand-text-muted">
                  Task Description
                </label>
                <textarea
                  value={selectedTask.task}
                  onChange={(e) => setSelectedTask({ ...selectedTask, task: e.target.value })}
                  className="w-full bg-brand-bg border border-brand-border focus:border-brand-accent rounded-lg p-3 text-xs outline-none resize-none text-brand-text-primary"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold font-mono uppercase tracking-widest text-brand-text-muted flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-brand-accent" />
                    Assignee
                  </label>
                  <input
                    type="text"
                    value={selectedTask.assignedTo}
                    onChange={(e) => setSelectedTask({ ...selectedTask, assignedTo: e.target.value })}
                    className="w-full bg-brand-bg border border-brand-border focus:border-brand-accent rounded-lg px-3 py-2 text-xs outline-none text-brand-text-primary font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold font-mono uppercase tracking-widest text-brand-text-muted flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-brand-warning" />
                    Deadline
                  </label>
                  <input
                    type="text"
                    value={selectedTask.deadline}
                    onChange={(e) => setSelectedTask({ ...selectedTask, deadline: e.target.value })}
                    className="w-full bg-brand-bg border border-brand-border focus:border-brand-accent rounded-lg px-3 py-2 text-xs outline-none text-brand-text-primary font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between p-5 border-t border-brand-border bg-brand-bg/40">
              <button
                onClick={async () => {
                  if (confirm('Delete this task?')) {
                    await onDeleteTask(selectedTask._id);
                    setSelectedTask(null);
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-2 text-[10px] font-bold font-mono uppercase tracking-wider text-red-400 hover:text-red-300 hover:bg-red-950/20 border border-transparent hover:border-red-500/10 rounded-lg transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Task
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedTask(null)}
                  className="px-4 py-2 text-[10px] font-bold font-mono uppercase tracking-wider text-brand-text-muted hover:text-brand-text-primary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveModalTask}
                  className="px-4 py-2 bg-brand-accent hover:bg-brand-accent/90 text-brand-bg text-[10px] font-bold font-mono uppercase tracking-wider rounded-lg"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KanbanBoard;
