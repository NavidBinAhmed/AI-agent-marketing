// react component- LoadingSpinner

import { Loader2 } from 'lucide-react';

const LoadingSpinner = ({ message = 'Analyzing...' }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Loader2 className="w-12 h-12 text-primary-500 animate-spin" />
      <p className="mt-4 text-gray-600 font-medium">{message}</p>
      <div className="mt-2 flex gap-1">
        <span className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
        <span className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
        <span className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
      </div>
    </div>
  );
};

export default LoadingSpinner;