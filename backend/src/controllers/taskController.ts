import { Response } from 'express';
import { Task } from '../models/Task';
import { AuthRequest } from '../middleware/authMiddleware';

/**
 * Get tasks. Optionally filters by meetingId.
 */
export const getTasks = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const filter: any = { userId: req.user.id };
    if (req.query.meetingId) {
      filter.meetingId = req.query.meetingId;
    }

    const tasks = await Task.find(filter).sort({ createdAt: 1 });
    res.status(200).json(tasks);
  } catch (error: any) {
    console.error('Get Tasks Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

/**
 * Manually create a task
 */
export const createTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { meetingId, task, assignedTo, deadline, status } = req.body;

    if (!meetingId || !task) {
      res.status(400).json({ message: 'Meeting ID and task description are required' });
      return;
    }

    const newTask = await Task.create({
      meetingId,
      userId: req.user.id,
      task,
      assignedTo: assignedTo || 'Unassigned',
      deadline: deadline || 'Not specified',
      status: status || 'todo',
    });

    res.status(201).json(newTask);
  } catch (error: any) {
    console.error('Create Task Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

/**
 * Update a task details or status (e.g. dragging between columns)
 */
export const updateTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { task, assignedTo, deadline, status } = req.body;
    const updateData: any = {};

    if (task !== undefined) updateData.task = task;
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo;
    if (deadline !== undefined) updateData.deadline = deadline;
    if (status !== undefined) {
      if (!['todo', 'in-progress', 'done'].includes(status)) {
        res.status(400).json({ message: 'Invalid task status' });
        return;
      }
      updateData.status = status;
    }

    const updatedTask = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      updateData,
      { new: true }
    );

    if (!updatedTask) {
      res.status(404).json({ message: 'Task not found or unauthorized' });
      return;
    }

    res.status(200).json(updatedTask);
  } catch (error: any) {
    console.error('Update Task Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

/**
 * Delete a task
 */
export const deleteTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const result = await Task.deleteOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (result.deletedCount === 0) {
      res.status(404).json({ message: 'Task not found or unauthorized' });
      return;
    }

    res.status(200).json({ message: 'Task deleted successfully' });
  } catch (error: any) {
    console.error('Delete Task Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
