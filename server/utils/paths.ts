import { join } from 'path';
import { config } from '../config.js';

/**
 * Get the storage path for a project
 */
export function getProjectPath(projectId: string): string {
  return join(config.storageDir, 'projects', projectId);
}

/**
 * Get the video path for a project
 */
export function getVideoPath(projectId: string): string {
  return join(getProjectPath(projectId), 'video.mp4');
}

/**
 * Get the audio path for a project
 */
export function getAudioPath(projectId: string): string {
  return join(getProjectPath(projectId), 'audio.mp3');
}

/**
 * Get the transcript path for a project
 */
export function getTranscriptPath(projectId: string): string {
  return join(getProjectPath(projectId), 'transcript.json');
}

/**
 * Get the analysis path for a project
 */
export function getAnalysisPath(projectId: string): string {
  return join(getProjectPath(projectId), 'analysis.json');
}

/**
 * Get the lesson directory path
 */
export function getLessonPath(projectId: string, lessonId: string): string {
  return join(getProjectPath(projectId), 'lessons', lessonId);
}

/**
 * Get the clip path for a lesson
 */
export function getClipPath(projectId: string, lessonId: string): string {
  return join(getLessonPath(projectId, lessonId), 'clip.mp4');
}

/**
 * Get the frames directory for a lesson
 */
export function getFramesPath(projectId: string, lessonId: string): string {
  return join(getLessonPath(projectId, lessonId), 'frames');
}

/**
 * Get the SOP JSON path for a lesson
 */
export function getSopJsonPath(projectId: string, lessonId: string): string {
  return join(getLessonPath(projectId, lessonId), 'sop.json');
}

/**
 * Get the SOP HTML path for a lesson
 */
export function getSopHtmlPath(projectId: string, lessonId: string): string {
  return join(getLessonPath(projectId, lessonId), 'sop.html');
}
