import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ProjectPage from './pages/ProjectPage';
import LessonPage from './pages/LessonPage';

function App() {
  return (
    <BrowserRouter basename="/app">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/projects/:id" element={<ProjectPage />} />
        <Route path="/projects/:id/lessons/:lid" element={<LessonPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
