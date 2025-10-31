// react component- SourceCard

import { ExternalLink, Globe } from 'lucide-react';

const SourceCard = ({ source, index }) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:border-primary-300 transition-colors">
      <div className="flex items-start gap-3">
        <div className="bg-primary-100 text-primary-600 rounded-lg w-10 h-10 flex items-center justify-center flex-shrink-0">
          <Globe size={20} />
        </div>
        
        <div className="flex-1 min-w-0">
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-600 hover:text-primary-700 font-semibold text-sm flex items-center gap-1 group"
          >
            <span className="truncate">{source.title}</span>
            <ExternalLink size={14} className="flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
          </a>
          
          <p className="text-gray-600 text-sm mt-1 line-clamp-2">
            {source.snippet}
          </p>
          
          <p className="text-xs text-gray-400 mt-2 truncate">
            {source.url}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SourceCard;