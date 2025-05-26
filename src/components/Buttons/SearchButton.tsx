import React from 'react';

interface SearchButtonProps {
  text: string;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}

const SearchButton: React.FC<SearchButtonProps> = ({
  text,
  onClick,
  type = 'submit',
  className = ''
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`rounded-full bg-blue-600 px-6 py-3 font-medium text-white transition-colors duration-200 hover:bg-blue-700 ${className}`}
    >
      {text}
    </button>
  );
};

export default SearchButton;
