import { Router } from 'express';
import multer from 'multer';
import { nanoid } from 'nanoid';
import { eq, desc } from 'drizzle-orm';
import { db, projects, lessons, frames, jobs } from '../db/index.js';
import { getProjectPath } from '../utils/paths.js';
import { mkdir, rm } from 'fs/promises';
import { resolve } from 'path';

const router = Router();

// Configure multer for video uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: async (_req, _file, cb) => {
      const projectId = nanoid();
      const dir = getProjectPath(projectId);
      await mkdir(dir, { recursive: true });
      // Stash projectId on request for later use
      (_req as any)._projectId = projectId;
      cb(null, dir);
    },
    filename: (_req, file, cb) => {
      const ext = file.originalname.split('.').pop() || 'mp4';
      cb(null, `video.${ext}`);
    },
  }),
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed'));
    }
  },
});

// POST /api/projects — Create a new project
router.post('/', upload.single('video'), async (req, res, next) => {
  try {
    const { title, sourceType, sourceUrl } = req.body;

    if (!title || !sourceType) {
      res.status(400).json({ error: 'title and sourceType are required' });
      return;
    }

    if (sourceType !== 'upload' && sourceType !== 'youtube') {
      res.status(400).json({ error: 'sourceType must be "upload" or "youtube"' });
      return;
    }

    if (sourceType === 'youtube' && !sourceUrl) {
      res.status(400).json({ error: 'sourceUrl is required for youtube projects' });
      return;
    }

    const id = (req as any)._projectId || nanoid();
    const projectDir = getProjectPath(id);
    await mkdir(projectDir, { recursive: true });

    const videoPath = req.file ? resolve(projectDir, req.file.filename) : null;

    await db.insert(projects).values({
      id,
      title,
      sourceType,
      sourceUrl: sourceUrl || null,
      videoPath,
      status: 'pending',
    });

    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    res.status(201).json(project);
  } catch (err) {
    next(err);
  }
});

// GET /api/projects — List all projects (newest first)
router.get('/', async (_req, res, next) => {
  try {
    const allProjects = await db
      .select()
      .from(projects)
      .orderBy(desc(projects.createdAt));
    res.json(allProjects);
  } catch (err) {
    next(err);
  }
});

// GET /api/projects/:id — Get single project with lessons
router.get('/:id', async (req, res, next) => {
  try {
    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, req.params.id));

    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    const projectLessons = await db
      .select()
      .from(lessons)
      .where(eq(lessons.projectId, project.id))
      .orderBy(lessons.orderIndex);

    const projectJobs = await db
      .select()
      .from(jobs)
      .where(eq(jobs.projectId, project.id));

    // Get frames for each lesson
    const lessonsWithFrames = await Promise.all(
      projectLessons.map(async (lesson) => {
        const lessonFrames = await db
          .select()
          .from(frames)
          .where(eq(frames.lessonId, lesson.id))
          .orderBy(frames.orderIndex);
        return { ...lesson, frames: lessonFrames };
      })
    );

    res.json({ ...project, lessons: lessonsWithFrames, jobs: projectJobs });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/projects/:id — Delete project and its files
router.delete('/:id', async (req, res, next) => {
  try {
    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, req.params.id));

    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    // Delete from DB (cascading will remove lessons, frames, jobs)
    await db.delete(projects).where(eq(projects.id, req.params.id));

    // Delete project files from storage
    const projectDir = getProjectPath(req.params.id);
    await rm(projectDir, { recursive: true, force: true });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
