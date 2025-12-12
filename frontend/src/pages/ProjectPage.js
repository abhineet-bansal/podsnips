import React from 'react';
import { useParams } from 'react-router-dom';

function ProjectPage() {
  const { projectId } = useParams();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Project Details</h1>
      <p className="text-gray-600">Project ID: {projectId}</p>
      <p className="text-gray-600 mt-4">Project details and task list will be displayed here...</p>
    </div>
  );
}

export default ProjectPage;
