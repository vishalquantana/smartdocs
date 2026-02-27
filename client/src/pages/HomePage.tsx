import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api, type Project } from '../api';

type UploadTab = 'file' | 'youtube';

function HomePage() {
  const [tab, setTab] = useState<UploadTab>('youtube');
  const [title, setTitle] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadProjects = useCallback(async () => {
    try {
      const data = await api.listProjects();
      setProjects(data);
    } catch {
      // silently fail on load
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('video/')) {
      setSelectedFile(file);
      if (!title) setTitle(file.name.replace(/\.[^.]+$/, ''));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!title) setTitle(file.name.replace(/\.[^.]+$/, ''));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Please enter a project title');
      return;
    }

    if (tab === 'youtube' && !youtubeUrl.trim()) {
      setError('Please enter a YouTube URL');
      return;
    }

    if (tab === 'file' && !selectedFile) {
      setError('Please select a video file');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Simulate upload progress for file uploads
      if (tab === 'file') {
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => Math.min(prev + 10, 90));
        }, 200);

        await api.createProject({
          title: title.trim(),
          sourceType: 'upload',
          video: selectedFile!,
        });

        clearInterval(progressInterval);
        setUploadProgress(100);
      } else {
        await api.createProject({
          title: title.trim(),
          sourceType: 'youtube',
          sourceUrl: youtubeUrl.trim(),
        });
      }

      // Reset form
      setTitle('');
      setYoutubeUrl('');
      setSelectedFile(null);
      setUploadProgress(0);

      // Reload projects
      await loadProjects();
    } catch (err: any) {
      setError(err.message || 'Failed to create project');
    } finally {
      setUploading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ');
  };

  return (
    <>
      <h1 className="page-title">Dashboard</h1>
      <p className="page-subtitle">Upload a video or paste a YouTube link to get started</p>

      {/* Upload Section */}
      <div className="upload-section">
        <h2>New Project</h2>

        <div className="tab-toggle">
          <button
            className={`tab-btn ${tab === 'youtube' ? 'active' : ''}`}
            onClick={() => setTab('youtube')}
            type="button"
          >
            YouTube URL
          </button>
          <button
            className={`tab-btn ${tab === 'file' ? 'active' : ''}`}
            onClick={() => setTab('file')}
            type="button"
          >
            Upload File
          </button>
        </div>

        <form className="upload-form" onSubmit={handleSubmit}>
          <div className="form-field">
            <label htmlFor="title">Project Title</label>
            <input
              id="title"
              type="text"
              placeholder="e.g. Onboarding Workshop Q1 2025"
              value={title}
              onChange={e => setTitle(e.target.value)}
              disabled={uploading}
            />
          </div>

          {tab === 'youtube' ? (
            <div className="form-field">
              <label htmlFor="youtube-url">YouTube URL</label>
              <input
                id="youtube-url"
                type="url"
                placeholder="https://www.youtube.com/watch?v=..."
                value={youtubeUrl}
                onChange={e => setYoutubeUrl(e.target.value)}
                disabled={uploading}
              />
            </div>
          ) : (
            <>
              {selectedFile ? (
                <div className="selected-file">
                  <span className="file-name">{selectedFile.name}</span>
                  <span>({(selectedFile.size / (1024 * 1024)).toFixed(1)} MB)</span>
                  <button
                    type="button"
                    className="remove-file"
                    onClick={() => setSelectedFile(null)}
                  >
                    &times;
                  </button>
                </div>
              ) : (
                <div
                  className={`drop-zone ${dragOver ? 'drag-over' : ''}`}
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <span className="drop-zone-icon">{'\u{1F4F9}'}</span>
                  <p className="drop-zone-text">
                    Drag and drop a video file or <strong>browse</strong>
                  </p>
                  <p className="drop-zone-hint">MP4, MOV, AVI, WebM - up to 500MB</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                  />
                </div>
              )}
            </>
          )}

          {error && (
            <div className="error-banner">
              <span className="error-banner-icon">{'\u26A0\uFE0F'}</span>
              <span className="error-banner-text">{error}</span>
            </div>
          )}

          {uploading && tab === 'file' && (
            <div className="upload-progress">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${uploadProgress}%` }} />
              </div>
              <p className="progress-text">Uploading... {uploadProgress}%</p>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={uploading}
          >
            {uploading ? 'Creating...' : 'Create Project'}
          </button>
        </form>
      </div>

      {/* Projects List */}
      <div className="projects-section">
        <h2>Your Projects</h2>

        {loading ? (
          <div className="loading">
            <div className="spinner" />
            <span>Loading projects...</span>
          </div>
        ) : projects.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">{'\u{1F4DA}'}</div>
            <h3>No projects yet</h3>
            <p>Create your first project above to get started</p>
          </div>
        ) : (
          <div className="projects-grid">
            {projects.map(project => (
              <Link
                key={project.id}
                to={`/projects/${project.id}`}
                className="project-card"
              >
                <div className={`project-icon ${project.sourceType}`}>
                  {project.sourceType === 'youtube' ? '\u{1F4FA}' : '\u{1F4C1}'}
                </div>
                <div className="project-info">
                  <div className="project-title">{project.title}</div>
                  <div className="project-meta">
                    <span className={`status-badge ${project.status}`}>
                      {formatStatus(project.status)}
                    </span>
                    <span>{formatDate(project.createdAt)}</span>
                  </div>
                </div>
                <span className="project-arrow">{'\u2192'}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default HomePage;
