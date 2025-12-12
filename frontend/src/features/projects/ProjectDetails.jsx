import React from 'react';

const ProjectDetails = ({ project }) => {
  if (!project) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        {project.episode || 'Untitled Project'}
      </h2>

      <div className="space-y-3">
        <div className="flex items-center">
          <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
            {project.status || 'Not started'}
          </span>
        </div>

        {project.podcast_show && (
          <div>
            <span className="font-semibold text-gray-700">Podcast Show:</span>
            <p className="text-gray-600 mt-1">{project.podcast_show}</p>
          </div>
        )}

        {project.snips !== undefined && (
          <div>
            <span className="font-semibold text-gray-700">Total Snips:</span>
            <p className="text-gray-600 mt-1">{project.snips}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectDetails;
