import { Response } from 'express';
import fs from 'fs';
import path from 'path';
import { Meeting, IMeeting } from '../models/Meeting';
import { Task } from '../models/Task';
import { AuthRequest } from '../middleware/authMiddleware';
import { configureCloudinary } from '../config/cloudinary';
import { transcribeAudio } from '../services/transcription';
import { extractMeetingInsights } from '../services/extraction';
import { generateMeetingPDF } from '../services/pdfService';

const cloudinary = configureCloudinary();

/**
 * Handle async meeting processing (background job)
 */
const processMeetingBackground = async (
  meetingId: string,
  userId: string,
  localFilePath: string
): Promise<void> => {
  let cloudinaryPublicId = '';
  let audioUrl = '';

  try {
    // 1. Upload to Cloudinary
    console.log(`[Background] Uploading file to Cloudinary: ${localFilePath}`);
    const uploadResult = await cloudinary.uploader.upload(localFilePath, {
      resource_type: 'auto',
      folder: 'meetsense_audio',
    });
    audioUrl = uploadResult.secure_url;
    cloudinaryPublicId = uploadResult.public_id;

    // Update meeting with temporary audio url and public ID
    await Meeting.findByIdAndUpdate(meetingId, {
      audioUrl,
      cloudinaryPublicId,
    });

    // 2. Transcribe Audio using local file stream (efficient)
    console.log(`[Background] Transcribing audio via Groq Whisper...`);
    const transcript = await transcribeAudio(localFilePath);

    // Clean up local temp file as soon as transcription finishes
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }

    if (!transcript || transcript.trim() === '') {
      throw new Error('Transcription returned empty text.');
    }

    // 3. Extract structured summary, decisions, follow-ups, and tasks
    console.log(`[Background] Extracting insights via Groq LLM...`);
    const insights = await extractMeetingInsights(transcript);

    // 4. Save Extracted Tasks to database
    console.log(`[Background] Saving ${insights.tasks.length} tasks to database...`);
    const taskDocs = insights.tasks.map((task) => ({
      meetingId,
      userId,
      task: task.task,
      assignedTo: task.assignedTo,
      deadline: task.deadline,
      status: 'todo',
    }));

    if (taskDocs.length > 0) {
      await Task.insertMany(taskDocs);
    }

    // 5. Update Meeting document with details and status 'completed'
    await Meeting.findByIdAndUpdate(meetingId, {
      transcript,
      summary: insights.summary,
      decisions: insights.decisions,
      followUps: insights.followUps,
      status: 'completed',
    });
    console.log(`[Background] Processing completed successfully for Meeting ID: ${meetingId}`);

    // 6. Delete from Cloudinary (temporary storage)
    console.log(`[Background] Cleaning up Cloudinary storage...`);
    await cloudinary.uploader.destroy(cloudinaryPublicId, { resource_type: 'video' });
    
    // Clear audio fields in DB to signify cleanup
    await Meeting.findByIdAndUpdate(meetingId, {
      audioUrl: '',
      cloudinaryPublicId: '',
    });
    console.log(`[Background] Cloudinary file deleted.`);
  } catch (error: any) {
    console.error(`[Background] Processing failed for Meeting ID: ${meetingId}`, error);

    // Update meeting status to failed
    await Meeting.findByIdAndUpdate(meetingId, {
      status: 'failed',
    });

    // Cleanup local file if it still exists
    if (fs.existsSync(localFilePath)) {
      try {
        fs.unlinkSync(localFilePath);
      } catch (err) {
        console.error('Failed to delete local file on error cleanup:', err);
      }
    }

    // Cleanup Cloudinary file if uploaded
    if (cloudinaryPublicId) {
      try {
        await cloudinary.uploader.destroy(cloudinaryPublicId, { resource_type: 'video' });
      } catch (err) {
        console.error('Failed to delete Cloudinary file on error cleanup:', err);
      }
    }
  }
};

/**
 * Upload audio file and start processing pipeline
 */
export const createMeeting = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    if (!req.file) {
      res.status(400).json({ message: 'No audio file uploaded.' });
      return;
    }

    const localFilePath = req.file.path;
    const originalName = req.file.originalname;
    
    // Create friendly title based on filename, stripping extension
    const titleWithoutExt = path.parse(originalName).name;
    const meetingTitle = titleWithoutExt
      .replace(/[_-]/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());

    // Create a meeting record in 'processing' status
    const meeting = await Meeting.create({
      userId: req.user.id,
      title: meetingTitle,
      status: 'processing',
      transcript: '',
      summary: '',
      decisions: [],
      followUps: [],
    });

    // Trigger processing asynchronously in the background
    processMeetingBackground(meeting._id.toString(), req.user.id, localFilePath);

    // Return the processing record immediately
    res.status(201).json(meeting);
  } catch (error: any) {
    console.error('Create Meeting Error:', error);
    
    // Clean up uploaded file if it was saved locally
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ message: error.message || 'Internal Server Error' });
  }
};

/**
 * Get all meetings for current user
 */
export const getMeetings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    // Sort by most recent
    const meetings = await Meeting.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json(meetings);
  } catch (error: any) {
    console.error('Get Meetings Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

/**
 * Get single meeting details by ID
 */
export const getMeetingById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const meeting = await Meeting.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!meeting) {
      res.status(404).json({ message: 'Meeting not found' });
      return;
    }

    res.status(200).json(meeting);
  } catch (error: any) {
    console.error('Get Meeting Detail Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

/**
 * Update meeting title
 */
export const updateMeeting = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { title } = req.body;
    if (!title || title.trim() === '') {
      res.status(400).json({ message: 'Title is required' });
      return;
    }

    const meeting = await Meeting.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { title: title.trim() },
      { new: true }
    );

    if (!meeting) {
      res.status(404).json({ message: 'Meeting not found or unauthorized' });
      return;
    }

    res.status(200).json(meeting);
  } catch (error: any) {
    console.error('Update Meeting Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

/**
 * Delete a meeting and all associated tasks
 */
export const deleteMeeting = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const meeting = await Meeting.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!meeting) {
      res.status(404).json({ message: 'Meeting not found or unauthorized' });
      return;
    }

    // Clean up Cloudinary file if it's currently processing
    if (meeting.cloudinaryPublicId) {
      try {
        await cloudinary.uploader.destroy(meeting.cloudinaryPublicId, {
          resource_type: 'video',
        });
      } catch (err) {
        console.error('Cloudinary cleanup error on delete:', err);
      }
    }

    // Delete tasks associated with the meeting
    await Task.deleteMany({ meetingId: meeting._id });

    // Delete the meeting itself
    await Meeting.deleteOne({ _id: meeting._id });

    res.status(200).json({ message: 'Meeting and associated tasks deleted successfully' });
  } catch (error: any) {
    console.error('Delete Meeting Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

/**
 * Export meeting analysis and action items checklist as a polished PDF
 */
export const exportMeetingPDF = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const meeting = await Meeting.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!meeting) {
      res.status(404).json({ message: 'Meeting not found or unauthorized' });
      return;
    }

    const tasks = await Task.find({
      meetingId: meeting._id,
      userId: req.user.id,
    }).sort({ createdAt: 1 });

    // Set response headers for PDF download
    const filename = `${meeting.title.toLowerCase().replace(/\s+/g, '_')}_summary.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Stream PDF directly to Express response
    generateMeetingPDF(meeting, tasks, res);
  } catch (error: any) {
    console.error('Export PDF Error:', error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }
};
