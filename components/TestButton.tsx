import React from 'react';

interface TestButtonProps {
  label: string;
  onClick: () => void;
  color: 'yellow' | 'red' | 'purple' | 'gray';
}

const TestButton: React.FC<TestButtonProps> = ({ label, onClick, color }) => {
  const colors = {
    yellow: "bg-yellow-600 hover:bg-yellow-700",
    red: "bg-red-600 hover:bg-red-700",
    purple: "bg-purple-600 hover:bg-purple-700",
    gray: "bg-gray-600 hover:bg-gray-700"
  };

  return (
    <button
      onClick={onClick}
      className={`${colors[color]} text-white font-medium py-2 px-4 rounded-lg transition duration-300 transform hover:-translate-y-0.5 whitespace-normal`}
    >
      {label}
    </button>
  );
};

export default TestButton;