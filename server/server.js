import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fs from 'fs';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Ensure base storage directories exist
const STORAGE_ROOT = path.resolve(process.cwd(), 'storage');
const TMP_DIR = path.join(STORAGE_ROOT, 'tmp');
fs.mkdirSync(TMP_DIR, { recursive: true });

// Multer temp storage; we later move into voices/{voiceId}/
const upload = multer({
  dest: TMP_DIR,
  fileFilter: (_req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('Only PDF files are allowed'));
    }
    cb(null, true);
  }
});

function slugifyFilename(filename) {
  const parts = filename.split('.');
  const ext = parts.length > 1 ? '.' + parts.pop() : '';
  const base = parts.join('.');
  return (
    base
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') + ext.toLowerCase()
  );
}

// Serve files statically from storage
app.use('/files', express.static(STORAGE_ROOT));

// Upload endpoint
app.post('/api/upload/voice-file', upload.single('file'), async (req, res) => {
  try {
    const voiceId = req.body.voiceId;
    if (!voiceId) {
      return res.status(400).json({ error: 'voiceId is required' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'file is required' });
    }

    const original = req.file.originalname || 'file.pdf';
    const slug = slugifyFilename(original);
    const targetDir = path.join(STORAGE_ROOT, 'voices', voiceId);
    fs.mkdirSync(targetDir, { recursive: true });
    const targetPath = path.join(targetDir, slug);

    // Move temp file to target location (overwrite if exists)
    await fs.promises.rename(req.file.path, targetPath).catch(async () => {
      // If rename fails due to cross-device or existing file, fallback to copy
      await fs.promises.copyFile(req.file.path, targetPath);
      await fs.promises.unlink(req.file.path).catch(() => {});
    });

    const publicUrl = `/files/voices/${voiceId}/${encodeURIComponent(slug)}`;
    return res.json({ file_url: publicUrl, file_name: slug });
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Upload failed' });
  }
});

// Delete a specific voice file from local storage
app.post('/api/delete/voice-file', async (req, res) => {
  try {
    const { voiceId, file_name } = req.body || {};
    if (!voiceId || !file_name) {
      return res.status(400).json({ error: 'voiceId and file_name are required' });
    }
    const targetPath = path.join(STORAGE_ROOT, 'voices', voiceId, file_name);
    try {
      await fs.promises.unlink(targetPath);
    } catch (e) {
      // If file does not exist, treat as success for idempotency
      if ((e && e.code) !== 'ENOENT') {
        throw e;
      }
    }
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Delete failed' });
  }
});

app.get('/health', (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`File server listening on http://localhost:${PORT}`);
});


