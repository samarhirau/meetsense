import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure the local upload folder exists
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer disk storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

// File filter to restrict uploads to specific audio/video MIME types and file extensions
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedExtensions = ['.mp3', '.wav', '.mp4', '.m4a'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  const allowedMimeTypes = [
    'audio/mpeg',       // mp3
    'audio/mp3',        // mp3 alternative
    'audio/wav',        // wav
    'audio/x-wav',      // wav alternative
    'audio/mp4',        // m4a/mp4
    'audio/x-m4a',      // m4a
    'video/mp4',        // mp4 video
  ];

  const hasAllowedExt = allowedExtensions.includes(ext);
  const hasAllowedMime = allowedMimeTypes.includes(file.mimetype);

  if (hasAllowedExt || hasAllowedMime) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed formats: ${allowedExtensions.join(', ')}`));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25 MB max limit
  },
});
