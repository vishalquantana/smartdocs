import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api, type ProjectDetail } from '../api';

const PIPELINE_STAGES = [
  { key: 'DOWNLOAD', label: 'Download', statusMatch: 'downloading' },
  { key: 'EXTRACT_AUDIO', label: 'Audio', statusMatch: 'extracting_audio' },
  { key: 'TRANSCRIBE', label: 'Transcribe', statusMatch: 'transcribing' },
  { key: 'ANALYZE', label: 'Analyze', statusMatch: 'analyzing' },
  { key: 'CLIP', label: 'Clip', statusMatch: 'clipping' },
  { key: 'EXTRACT_FRAMES', label: 'Frames', statusMatch: '' },
  { key: 'GENERATE_SOPS', label: 'SOPs', statusMatch: 'generating_sops' },
];

function getStageState(
  stageIndex: number,
  projectStatus: string,
  jobs: ProjectDetail['jobs']
): 'completed' | 'active' | 'failed' | 'pending' {
  // Check if there's a job for this stage
  const stageKey = PIPELINE_STAGES[stageIndex].key;
  const job = jobs.find(j => j.stage === stageKey);

  if (job) {
    if (job.status === 'completed') return 'completed';
    if (job.status === 'processing') return 'active';
    if (job.status === 'failed') return 'failed';
  }

  // Fallback: infer from project status
  if (projectStatus === 'completed') return 'completed';
  if (projectStatus === 'failed') return 'failed';

  const statusMatch = PIPELINE_STAGES[stageIndex].statusMatch;
  if (statusMatch && projectStatus === statusMatch) return 'active';

  // Check if a later stage is active/completed
  const statusOrder = ['pending', 'downloading', 'extracting_audio', 'transcribing', 'analyzing', 'clipping', 'generating_sops', 'completed'];
  const currentIndex = statusOrder.indexOf(projectStatus);
  const stageStatusIndex = statusMatch ? statusOrder.indexOf(statusMatch) : -1;

  if (stageStatusIndex >= 0 && currentIndex > stageStatusIndex) return 'completed';

  return 'pending';
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadProject = useCallback(async () => {
    if (!id) return;
    try {
      const data = await api.getProject(id);
      setProject(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load project');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadProject();
  }, [loadProject]);

  // Poll for updates if project is processing
  useEffect(() => {
    if (!project) return;
    const isProcessing = !['completed', 'failed', 'pending'].includes(project.status);
    if (!isProcessing) return;

    const interval = setInterval(loadProject, 5000);
    return () => clearInterval(interval);
  }, [project, loadProject]);

  const handleDelete = async () => {
    if (!id) return;
    setDeleting(true);
    try {
      await api.deleteProject(id);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Failed to delete project');
      setShowDeleteConfirm(false);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" />
        <span>Loading project...</span>
      </div>
    );
  }

  if (error && !project) {
    return (
      <>
        <Link to="/" className="back-link">
          {'\u2190'} Back to projects
        </Link>
        <div className="error-banner">
          <span className="error-banner-icon">{'\u26A0\uFE0F'}</span>
          <span className="error-banner-text">{error}</span>
        </div>
      </>
    );
  }

  if (!project) return null;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <>
      <Link to="/" className="back-link">
        {'\u2190'} Back to projects
      </Link>

      <div className="project-header">
        <div className="project-header-info">
          <h1 className="page-title">{project.title}</h1>
          <div className="project-header-meta">
            <span className="source-badge">
              {project.sourceType === 'youtube' ? '\u{1F4FA}' : '\u{1F4C1}'}{' '}
              {project.sourceType === 'youtube' ? 'YouTube' : 'Upload'}
            </span>
            <span className={`status-badge ${project.status}`}>
              {project.status.replace(/_/g, ' ')}
            </span>
            <span>{formatDate(project.createdAt)}</span>
          </div>
        </div>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => setShowDeleteConfirm(true)}
          type="button"
        >
          Delete
        </button>
      </div>

      {/* Pipeline Status */}
      <div className="pipeline-section">
        <h3>Processing Pipeline</h3>
        <div className="pipeline-stepper">
          {PIPELINE_STAGES.map((stage, i) => {
            const state = getStageState(i, project.status, project.jobs);
            return (
              <div key={stage.key} className={`pipeline-step ${state}`}>
                <div className="step-dot">
                  {state === 'completed'
                    ? '\u2713'
                    : state === 'failed'
                    ? '\u2717'
                    : i + 1}
                </div>
                <span className="step-label">{stage.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Error Display */}
      {project.status === 'failed' && project.errorMessage && (
        <div className="error-banner">
          <span className="error-banner-icon">{'\u26A0\uFE0F'}</span>
          <span className="error-banner-text">{project.errorMessage}</span>
        </div>
      )}

      {/* Source URL */}
      {project.sourceUrl && (
        <div style={{ marginBottom: '1.5rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--slate)' }}>
            Source:{' '}
            <a href={project.sourceUrl} target="_blank" rel="noopener noreferrer">
              {project.sourceUrl}
            </a>
          </span>
        </div>
      )}

      {/* Lessons */}
      <div className="lessons-section">
        <h3>
          Lessons{' '}
          {project.lessons.length > 0 && (
            <span style={{ fontWeight: 400, fontSize: '0.9rem', color: 'var(--slate)' }}>
              ({project.lessons.length})
            </span>
          )}
        </h3>

        {project.lessons.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">{'\u{1F4D6}'}</div>
            <h3>No lessons yet</h3>
            <p>
              {project.status === 'pending'
                ? 'Processing hasn\'t started yet'
                : project.status === 'completed'
                ? 'No lessons were found in this video'
                : 'Lessons will appear here as processing completes'}
            </p>
          </div>
        ) : (
          project.lessons.map(lesson => (
            <Link
              key={lesson.id}
              to={`/projects/${project.id}/lessons/${lesson.id}`}
              className="lesson-card"
            >
              <div className="lesson-index">{lesson.orderIndex + 1}</div>
              <div className="lesson-info">
                <div className="lesson-title">{lesson.title}</div>
                <div className="lesson-meta">
                  {formatDuration(lesson.startTime)} - {formatDuration(lesson.endTime)}
                  {lesson.summary && ` \u00B7 ${lesson.summary.slice(0, 80)}...`}
                </div>
              </div>
              <span className={`status-badge ${lesson.status}`}>
                {lesson.status}
              </span>
            </Link>
          ))
        )}
      </div>

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="confirm-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="confirm-dialog" onClick={e => e.stopPropagation()}>
            <h3>Delete Project</h3>
            <p>
              Are you sure you want to delete &ldquo;{project.title}&rdquo;? This will remove all
              files, clips, and documents. This action cannot be undone.
            </p>
            <div className="confirm-actions">
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setShowDeleteConfirm(false)}
                type="button"
              >
                Cancel
              </button>
              <button
                className="btn btn-danger btn-sm"
                onClick={handleDelete}
                disabled={deleting}
                type="button"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ProjectPage;
