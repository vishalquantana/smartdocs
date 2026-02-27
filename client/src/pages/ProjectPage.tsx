import { useParams } from 'react-router-dom';

function ProjectPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="container">
      <h1>Project {id}</h1>
      {/* Processing status and lessons list will be added here */}
    </div>
  );
}

export default ProjectPage;
