import React from 'react';

const EmptyState = ({ message, icon }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12">
      {icon && <div className="text-6xl mb-4">{icon}</div>}
      <p className="text-gray-500 text-lg">{message}</p>
    </div>
  );
};

export default EmptyState;
