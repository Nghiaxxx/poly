import React from 'react';

interface StarRatingProps {
  rating: number;
  totalReviews: number;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

const StarRating: React.FC<StarRatingProps> = ({ 
  rating, 
  totalReviews, 
  size = 'md', 
  showText = true 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  const renderStars = () => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    // Render full stars
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <svg
          key={`full-${i}`}
          className={`${sizeClasses[size]} text-yellow-400 fill-current`}
          viewBox="0 0 24 24"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      );
    }

    // Render half star if needed
    if (hasHalfStar) {
      stars.push(
        <div key="half" className={`${sizeClasses[size]} relative`}>
          <svg
            className={`${sizeClasses[size]} text-gray-300 fill-current absolute`}
            viewBox="0 0 24 24"
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
          <svg
            className={`${sizeClasses[size]} text-yellow-400 fill-current`}
            viewBox="0 0 24 24"
            style={{ clipPath: 'polygon(0 0, 50% 0, 50% 100%, 0 100%)' }}
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </div>
      );
    }

    // Render empty stars
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <svg
          key={`empty-${i}`}
          className={`${sizeClasses[size]} text-gray-300 fill-current`}
          viewBox="0 0 24 24"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      );
    }

    return stars;
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center">
        {renderStars()}
      </div>
      {showText && (
        <div className={`${textSizeClasses[size]} text-gray-600`}>
          <span className="font-medium text-yellow-600">{rating.toFixed(1)}</span>
          <span className="ml-1">({totalReviews} đánh giá)</span>
        </div>
      )}
    </div>
  );
};

export default StarRating; 