// react component- InsightCard

import { TrendingUp, CheckCircle2 } from 'lucide-react';

const InsightCard = ({ insight, index }) => {
  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-50';
    if (confidence >= 0.5) return 'text-yellow-600 bg-yellow-50';
    return 'text-orange-600 bg-orange-50';
  };

  const getConfidenceLabel = (confidence) => {
    if (confidence >= 0.8) return 'High Confidence';
    if (confidence >= 0.5) return 'Medium Confidence';
    return 'Low Confidence';
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="bg-primary-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
            {index + 1}
          </div>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
            {insight.category}
          </span>
        </div>
        <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getConfidenceColor(insight.confidence)}`}>
          <CheckCircle2 size={14} />
          <span>{getConfidenceLabel(insight.confidence)}</span>
        </div>
      </div>

      <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
        <TrendingUp className="text-primary-500" size={20} />
        {insight.title}
      </h3>

      <p className="text-gray-700 leading-relaxed">
        {insight.detail}
      </p>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-primary-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${insight.confidence * 100}%` }}
            />
          </div>
          <span className="text-sm font-medium text-gray-600">
            {Math.round(insight.confidence * 100)}%
          </span>
        </div>
      </div>
    </div>
  );
};

export default InsightCard;