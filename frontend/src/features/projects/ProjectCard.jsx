import React from 'react';
import { useNavigate } from 'react-router-dom';

const ProjectCard = ({ project }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/project/${project.id}`);
  };

  return (
    <div
      onClick={handleClick}
      className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer border border-gray-200"
    >
      <div className="mb-4">
        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          {project.episode || 'Untitled Project'}
        </h3>
        <div className="flex items-center gap-2 mb-2">
          <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
            {project.status || 'Not started'}
          </span>
        </div>
      </div>

      {project.podcast_show && (
        <div className="mb-3">
          <p className="text-sm text-gray-600">
            <span className="font-medium">Show:</span> {project.podcast_show}
          </p>
        </div>
      )}

      {project.snips !== undefined && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-sm text-gray-600">
            <span className="font-medium">Snips:</span> {project.snips}
          </p>
        </div>
      )}
    </div>
  );
};

export default ProjectCard;
