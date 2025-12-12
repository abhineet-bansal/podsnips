import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const ProjectPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();

  return (
    <div className="p-6">
      <button
        onClick={() => navigate('/')}
        className="mb-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
      >
        Back to Projects
      </button>
      <h1 className="text-3xl font-bold mb-4">Project Details</h1>
      <p className="text-gray-600">Project ID: {projectId}</p>
      <p className="text-gray-600">Loading tasks...</p>
    </div>
  );
};

export default ProjectPage;
