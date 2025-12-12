import React from 'react';
import { useNavigate } from 'react-router-dom';

function ProjectCard({ project }) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/project/${project.id}`);
  };

  return (
    <div
      onClick={handleClick}
      className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
    >
      <h2 className="text-xl font-semibold text-gray-800 mb-2">
        {project.episode || 'Untitled Project'}
      </h2>

      <div className="space-y-2">
        <div className="flex items-center text-sm text-gray-600">
          <span className="font-medium mr-2">Status:</span>
          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
            {project.status || 'Not started'}
          </span>
        </div>

        {project.podcast_show && (
          <div className="text-sm text-gray-600">
            <span className="font-medium">Podcast:</span> {project.podcast_show}
          </div>
        )}

        {project.episode_number && (
          <div className="text-sm text-gray-600">
            <span className="font-medium">Episode:</span> {project.episode_number}
          </div>
        )}

        {project.created_date && (
          <div className="text-sm text-gray-500 mt-3">
            {new Date(project.created_date).toLocaleDateString()}
          </div>
        )}
      </div>

      <div className="mt-4 text-blue-600 text-sm font-medium">
        View Details →
      </div>
    </div>
  );
}

export default React.memo(ProjectCard);
