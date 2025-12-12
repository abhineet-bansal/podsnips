import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchProjects,
  selectProjects,
  selectProjectsLoading,
  selectProjectsError,
} from '../features/projects/projectsSlice';
import ProjectCard from '../features/projects/ProjectCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import EmptyState from '../components/common/EmptyState';

function HomePage() {
  const dispatch = useDispatch();
  const projects = useSelector(selectProjects);
  const loading = useSelector(selectProjectsLoading);
  const error = useSelector(selectProjectsError);

  useEffect(() => {
    dispatch(fetchProjects());
  }, [dispatch]);

  const handleRetry = () => {
    dispatch(fetchProjects());
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">PodSnips Projects</h1>

      {loading && <LoadingSpinner message="Loading projects..." />}

      {error && <ErrorMessage message={error} onRetry={handleRetry} />}

      {!loading && !error && projects.length === 0 && (
        <EmptyState message="No projects found. Create your first project to get started!" />
      )}

      {!loading && !error && projects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}

export default HomePage;
