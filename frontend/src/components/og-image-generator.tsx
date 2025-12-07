import React from 'react';

interface OGImageGeneratorProps {
  title: string;
  description?: string;
  imageUrl?: string;
  width?: number;
  height?: number;
}

const OGImageGenerator: React.FC<OGImageGeneratorProps> = ({
  title,
  description = 'Poly Smart - Đại lý ủy quyền Apple chính hãng',
  imageUrl = '/images/logo/logo.png',
  width = 1200,
  height = 630
}) => {
  return (
    <div
      style={{
        width: `${width}px`,
        height: `${height}px`,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        color: 'white',
      }}
    >
      {/* Background overlay */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'linear-gradient(45deg, rgba(0, 122, 255, 0.3), rgba(88, 86, 214, 0.3))',
        }}
      />
      
      {/* Content */}
      <div style={{ textAlign: 'center', zIndex: 2, maxWidth: '900px', padding: '40px' }}>
        {/* Logo */}
        <div
          style={{
            width: '120px',
            height: '120px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '50%',
            margin: '0 auto 30px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(10px)',
            border: '2px solid rgba(255, 255, 255, 0.2)',
          }}
        >
          <img
            src={imageUrl}
            alt="Poly Smart Logo"
            style={{ width: '80px', height: '80px', objectFit: 'contain' }}
          />
        </div>
        
        {/* Title */}
        <h1
          style={{
            fontSize: '48px',
            fontWeight: 700,
            marginBottom: '20px',
            textShadow: '2px 2px 4px rgba(0, 0, 0, 0.3)',
            lineHeight: 1.2,
          }}
        >
          {title}
        </h1>
        
        {/* Description */}
        <p
          style={{
            fontSize: '24px',
            opacity: 0.9,
            lineHeight: 1.4,
            margin: 0,
          }}
        >
          {description}
        </p>
      </div>
      
      {/* Floating icons */}
      <div style={{ position: 'absolute', top: '10%', left: '10%', opacity: 0.1, fontSize: '60px' }}>
        📱
      </div>
      <div style={{ position: 'absolute', top: '20%', right: '15%', opacity: 0.1, fontSize: '60px' }}>
        💻
      </div>
      <div style={{ position: 'absolute', bottom: '15%', left: '20%', opacity: 0.1, fontSize: '60px' }}>
        ⌚
      </div>
      <div style={{ position: 'absolute', bottom: '25%', right: '10%', opacity: 0.1, fontSize: '60px' }}>
        🎧
      </div>
    </div>
  );
};

export default OGImageGenerator; 