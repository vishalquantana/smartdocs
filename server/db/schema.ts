import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// Project status enum
export type ProjectStatus =
  | 'pending'
  | 'downloading'
  | 'extracting_audio'
  | 'transcribing'
  | 'analyzing'
  | 'clipping'
  | 'generating_sops'
  | 'completed'
  | 'failed';

// Source type enum
export type SourceType = 'upload' | 'youtube';

// Job status enum
export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

// Pipeline stage enum
export type PipelineStage =
  | 'DOWNLOAD'
  | 'EXTRACT_AUDIO'
  | 'TRANSCRIBE'
  | 'ANALYZE'
  | 'CLIP'
  | 'EXTRACT_FRAMES'
  | 'GENERATE_SOPS';

/**
 * Projects table - one per uploaded/linked video
 */
export const projects = sqliteTable('projects', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  sourceType: text('source_type', { enum: ['upload', 'youtube'] }).notNull(),
  sourceUrl: text('source_url'),
  videoPath: text('video_path'),
  audioPath: text('audio_path'),
  transcriptPath: text('transcript_path'),
  analysisPath: text('analysis_path'),
  status: text('status').notNull().default('pending'),
  errorMessage: text('error_message'),
  videoDuration: real('video_duration'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
});

/**
 * Lessons table - multiple per project
 */
export const lessons = sqliteTable('lessons', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  orderIndex: integer('order_index').notNull(),
  title: text('title').notNull(),
  summary: text('summary'),
  startTime: real('start_time').notNull(),
  endTime: real('end_time').notNull(),
  clipPath: text('clip_path'),
  sopJsonPath: text('sop_json_path'),
  sopHtmlPath: text('sop_html_path'),
  thumbnailPath: text('thumbnail_path'),
  status: text('status').notNull().default('pending'),
  errorMessage: text('error_message'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
});

/**
 * Frames table - multiple per lesson, screenshots for SOP
 */
export const frames = sqliteTable('frames', {
  id: text('id').primaryKey(),
  lessonId: text('lesson_id').notNull().references(() => lessons.id, { onDelete: 'cascade' }),
  orderIndex: integer('order_index').notNull(),
  timestamp: real('timestamp').notNull(),
  filePath: text('file_path').notNull(),
  caption: text('caption'),
});

/**
 * Jobs table - pipeline execution tracking
 */
export const jobs = sqliteTable('jobs', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  stage: text('stage').notNull(),
  status: text('status').notNull().default('pending'),
  progress: integer('progress').notNull().default(0),
  errorMessage: text('error_message'),
  startedAt: integer('started_at', { mode: 'timestamp' }),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
});

// Type exports for use in application code
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type Lesson = typeof lessons.$inferSelect;
export type NewLesson = typeof lessons.$inferInsert;
export type Frame = typeof frames.$inferSelect;
export type NewFrame = typeof frames.$inferInsert;
export type Job = typeof jobs.$inferSelect;
export type NewJob = typeof jobs.$inferInsert;
