import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const TaskPage = () => {
  const { projectId, taskId } = useParams();
  const navigate = useNavigate();

  return (
    <div className="p-6">
      <button
        onClick={() => navigate(`/project/${projectId}`)}
        className="mb-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
      >
        Back to Project
      </button>
      <h1 className="text-3xl font-bold mb-4">Task Details</h1>
      <p className="text-gray-600">Project ID: {projectId}</p>
      <p className="text-gray-600">Task ID: {taskId}</p>
      <p className="text-gray-600">Loading task details...</p>
    </div>
  );
};

export default TaskPage;
