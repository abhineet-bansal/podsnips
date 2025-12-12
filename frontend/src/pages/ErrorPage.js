import React from 'react';
import { Link } from 'react-router-dom';

function ErrorPage() {
  return (
    <div className="container mx-auto px-4 py-8 text-center">
      <h1 className="text-6xl font-bold text-gray-800 mb-4">404</h1>
      <h2 className="text-2xl font-semibold text-gray-600 mb-6">Page Not Found</h2>
      <p className="text-gray-500 mb-8">The page you're looking for doesn't exist.</p>
      <Link
        to="/"
        className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg inline-block transition-colors"
      >
        Go Home
      </Link>
    </div>
  );
}

export default ErrorPage;
