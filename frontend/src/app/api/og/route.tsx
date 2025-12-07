import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get('title') || 'Poly Smart';
  const description = searchParams.get('description') || 'Đại lý ủy quyền Apple chính hãng';
  const type = searchParams.get('type') || 'default';

  try {
    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#1a1a1a',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            position: 'relative',
            overflow: 'hidden',
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
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              zIndex: 2,
              maxWidth: '900px',
              padding: '40px',
            }}
          >
            {/* Logo placeholder */}
            <div
              style={{
                width: '120px',
                height: '120px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '50%',
                marginBottom: '30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid rgba(255, 255, 255, 0.2)',
              }}
            >
              <span style={{ fontSize: '60px' }}>🍎</span>
            </div>
            
            {/* Title */}
            <h1
              style={{
                fontSize: '48px',
                fontWeight: 700,
                marginBottom: '20px',
                color: 'white',
                textShadow: '2px 2px 4px rgba(0, 0, 0, 0.3)',
                lineHeight: 1.2,
                maxWidth: '800px',
              }}
            >
              {title}
            </h1>
            
            {/* Description */}
            <p
              style={{
                fontSize: '24px',
                color: 'rgba(255, 255, 255, 0.9)',
                lineHeight: 1.4,
                margin: 0,
                maxWidth: '800px',
              }}
            >
              {description}
            </p>
          </div>
          
          {/* Floating icons */}
          <div style={{ position: 'absolute', top: '10%', left: '10%', opacity: 0.1, fontSize: '60px', color: 'white' }}>
            📱
          </div>
          <div style={{ position: 'absolute', top: '20%', right: '15%', opacity: 0.1, fontSize: '60px', color: 'white' }}>
            💻
          </div>
          <div style={{ position: 'absolute', bottom: '15%', left: '20%', opacity: 0.1, fontSize: '60px', color: 'white' }}>
            ⌚
          </div>
          <div style={{ position: 'absolute', bottom: '25%', right: '10%', opacity: 0.1, fontSize: '60px', color: 'white' }}>
            🎧
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e) {
    console.log(`${e instanceof Error ? e.message : 'Unknown error'}`);
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
} 