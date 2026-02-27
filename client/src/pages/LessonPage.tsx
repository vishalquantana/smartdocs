import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, type ProjectDetail, type Lesson } from '../api';

function LessonPage() {
  const { id, lid } = useParams<{ id: string; lid: string }>();
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [sopHtml, setSopHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    if (!id || !lid) return;
    try {
      const data = await api.getProject(id);
      setProject(data);
      const found = data.lessons.find(l => l.id === lid);
      if (found) {
        setLesson(found);
        // Load SOP HTML if available
        if (found.sopHtmlPath) {
          try {
            const resp = await fetch(found.sopHtmlPath);
            if (resp.ok) {
              const html = await resp.text();
              setSopHtml(html);
            }
          } catch {
            // SOP not available yet
          }
        }
      } else {
        setError('Lesson not found');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load lesson');
    } finally {
      setLoading(false);
    }
  }, [id, lid]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" />
        <span>Loading lesson...</span>
      </div>
    );
  }

  if (error || !lesson || !project) {
    return (
      <>
        <Link to={`/projects/${id}`} className="back-link">
          {'\u2190'} Back to project
        </Link>
        <div className="error-banner">
          <span className="error-banner-icon">{'\u26A0\uFE0F'}</span>
          <span className="error-banner-text">{error || 'Lesson not found'}</span>
        </div>
      </>
    );
  }

  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <>
      {/* Breadcrumb */}
      <nav className="breadcrumb">
        <Link to="/">Projects</Link>
        <span className="separator">/</span>
        <Link to={`/projects/${id}`}>{project.title}</Link>
        <span className="separator">/</span>
        <span>{lesson.title}</span>
      </nav>

      <h1 className="page-title">{lesson.title}</h1>
      <p className="page-subtitle">
        {formatTime(lesson.startTime)} - {formatTime(lesson.endTime)}
        {lesson.summary && ` \u2014 ${lesson.summary}`}
      </p>

      {/* Video Player */}
      <div className="video-player-section">
        {lesson.clipPath ? (
          <video
            className="video-player"
            controls
            src={lesson.clipPath}
          >
            Your browser does not support the video element.
          </video>
        ) : (
          <div className="video-placeholder">
            {lesson.status === 'completed'
              ? 'No clip available'
              : 'Clip will appear here once processing is complete'}
          </div>
        )}
      </div>

      {/* SOP Document */}
      <div className="sop-section">
        <h3>Step-by-Step Guide</h3>
        {sopHtml ? (
          <div
            className="sop-content"
            dangerouslySetInnerHTML={{ __html: sopHtml }}
          />
        ) : lesson.sopJsonPath ? (
          <div className="sop-placeholder">
            SOP document is available in JSON format.
          </div>
        ) : (
          <div className="sop-placeholder">
            {lesson.status === 'completed'
              ? 'No SOP document was generated for this lesson'
              : 'SOP document will appear here once processing is complete'}
          </div>
        )}
      </div>

      {/* Frame Gallery */}
      {lesson.frames && lesson.frames.length > 0 && (
        <div className="frames-section">
          <h3>Key Frames ({lesson.frames.length})</h3>
          <div className="frames-grid">
            {lesson.frames.map(frame => (
              <div key={frame.id} className="frame-card">
                <img
                  src={frame.filePath}
                  alt={frame.caption || `Frame at ${formatTime(frame.timestamp)}`}
                  loading="lazy"
                />
                <div className="frame-caption">
                  {frame.caption || `${formatTime(frame.timestamp)}`}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

export default LessonPage;
