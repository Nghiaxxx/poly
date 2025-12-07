import React from 'react';

const GridMac = () => {
  return (
    <div 
      className="grid-mac-container"
      style={{ 
        width: '100%', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',  
        background:'#fff' 
      }}
    >
      <div
        className="parent"
        style={{
          alignItems: 'center',
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gridTemplateRows: 'repeat(5, 1fr)',
          gap: 10,
          width: 1150,
          height: 476,
          background: '#FFFFFF',
        }}
      >
        <div
          className="div1"
          style={{
            gridColumn: 'span 2 / span 2',
            gridRow: 'span 5 / span 5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            borderRadius: 8,
            overflow: 'hidden',
            width: 461,
            height: 477,
          }}
        >
          <img 
            src="/images/ronmac.jpg" 
            alt="" 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            fetchPriority="high"
          />
        </div>
        <div
          className="div2"
          style={{
            gridColumn: '3 / span 2',
            gridRow: '1 / span 2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            borderRadius: 8,
            overflow: 'hidden',
            width: 417,
            height: 174,
          }}
        >
          <img src="/images/ronmac1.png" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <div
          className="div4"
          style={{
            gridColumn: '3',
            gridRow: '3 / span 3',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            borderRadius: 8,
            overflow: 'hidden',
            width: 199,
            height: 287,
          }}
        >
          <img src="/images/ronmac2.jpg" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <div
          className="div5"
          style={{
            gridColumn: '4',
            gridRow: '3 / span 3',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            borderRadius: 8,
            overflow: 'hidden',
            width: 199,
            height: 287,
          }}
        >
          <img src="/images/ronmac3.png" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <div
          className="div6"
          style={{
            gridColumn: '5',
            gridRow: '1 / span 5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            borderRadius: 8,
            overflow: 'hidden',
            width: 243,
            height: 477,
          }}
        >
          <img src="/images/ronmac4.png" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      </div>
      <style jsx>{`
        @media (max-width: 1024px) {
          .grid-mac-container {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default GridMac; 