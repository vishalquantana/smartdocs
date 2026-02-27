import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ProjectPage from './pages/ProjectPage';
import LessonPage from './pages/LessonPage';

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <header className="app-header">
        <Link to="/" className="app-logo">
          Smart<span>Docs</span>
        </Link>
        <nav className="app-nav">
          <a href="/">Home</a>
        </nav>
      </header>
      <main className="app-main">{children}</main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter basename="/app">
      <AppLayout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/projects/:id" element={<ProjectPage />} />
          <Route path="/projects/:id/lessons/:lid" element={<LessonPage />} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  );
}

export default App;
