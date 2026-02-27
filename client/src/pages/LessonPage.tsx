import { useParams } from 'react-router-dom';

function LessonPage() {
  const { id, lid } = useParams<{ id: string; lid: string }>();

  return (
    <div className="container">
      <h1>Lesson {lid}</h1>
      {/* Video player and SOP viewer will be added here */}
    </div>
  );
}

export default LessonPage;
