import React from 'react';
import { useParams } from 'react-router-dom';

function TaskPage() {
  const { projectId, taskId } = useParams();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Task Details</h1>
      <p className="text-gray-600">Project ID: {projectId}</p>
      <p className="text-gray-600">Task ID: {taskId}</p>
      <p className="text-gray-600 mt-4">Task details will be displayed here...</p>
    </div>
  );
}

export default TaskPage;
