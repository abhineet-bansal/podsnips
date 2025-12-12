import React from 'react';

function ProjectDetails({ project }) {
  if (!project) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        {project.episode || 'Untitled Project'}
      </h2>

      <div className="space-y-3">
        <div className="flex items-center">
          <span className="font-semibold text-gray-700 w-32">Status:</span>
          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
            {project.status || 'Not started'}
          </span>
        </div>

        {project.podcast_show && (
          <div className="flex">
            <span className="font-semibold text-gray-700 w-32">Podcast:</span>
            <span className="text-gray-600">{project.podcast_show}</span>
          </div>
        )}

        {project.episode_number && (
          <div className="flex">
            <span className="font-semibold text-gray-700 w-32">Episode #:</span>
            <span className="text-gray-600">{project.episode_number}</span>
          </div>
        )}

        {project.youtube_url && (
          <div className="flex">
            <span className="font-semibold text-gray-700 w-32">YouTube:</span>
            <a
              href={project.youtube_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 hover:underline"
            >
              View Video
            </a>
          </div>
        )}

        {project.created_date && (
          <div className="flex">
            <span className="font-semibold text-gray-700 w-32">Created:</span>
            <span className="text-gray-600">
              {new Date(project.created_date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProjectDetails;
