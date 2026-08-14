import { Router } from 'express';
import {
  createMeeting,
  getMeetings,
  getMeetingById,
  updateMeeting,
  deleteMeeting,
  exportMeetingPDF,
} from '../controllers/meetingController';
import { protect } from '../middleware/authMiddleware';
import { upload } from '../middleware/uploadMiddleware';
import rateLimit from 'express-rate-limit';

const router = Router();

// Rate limiting for uploads to protect free quotas
const uploadRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 uploads per window
  message: {
    message: 'Too many audio uploads from this IP, please try again after 15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(protect as any);

router.post('/', uploadRateLimiter, upload.single('audio'), createMeeting as any);
router.get('/', getMeetings as any);
router.get('/:id', getMeetingById as any);
router.get('/:id/pdf', exportMeetingPDF as any);
router.put('/:id', updateMeeting as any);
router.delete('/:id', deleteMeeting as any);

export default router;
