import React, { ReactNode } from 'react';

interface OperationCardProps {
  title: string;
  onSubmit: () => void;
  children: ReactNode;
}

const OperationCard: React.FC<OperationCardProps> = ({ title, onSubmit, children }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
      <h2 className="text-xl font-semibold mb-4 text-gray-700">{title}</h2>
      <div className="mb-4">
        {children}
      </div>
      <button
        onClick={onSubmit}
        className="w-full py-2 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg shadow transition duration-300 transform hover:-translate-y-0.5"
      >
        Выполнить
      </button>
    </div>
  );
};

export default OperationCard;