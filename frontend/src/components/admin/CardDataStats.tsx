import React, { ReactNode } from "react";

interface CardDataStatsProps {
  title: string;
  total: string;
  rate: string;
  levelUp?: boolean;
  levelDown?: boolean;
  children: ReactNode;
}

const CardDataStats: React.FC<CardDataStatsProps> = ({
  title,
  total,
  rate,
  levelUp,
  levelDown,
  children,
}) => {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white px-6 py-6 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 dark:border-gray-700 dark:bg-boxdark">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full -translate-y-12 translate-x-12 dark:from-blue-900/20 dark:to-indigo-900/20"></div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
            {children}
          </div>
          
          <span
            className={`flex items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold ${
              levelUp 
                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
                : levelDown 
                ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
            }`}
          >
            {rate}
            {levelUp && (
              <svg
                className="h-4 w-4"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            )}
            {levelDown && (
              <svg
                className="h-4 w-4"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M7.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l2.293 2.293a1 1 0 010 1.414z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </span>
        </div>

        <div className="space-y-2">
          <h4 className="text-2xl font-bold text-gray-900 dark:text-white">
            {total}
          </h4>
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {title}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CardDataStats;
