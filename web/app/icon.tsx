import { ImageResponse } from 'next/og'
 
export function generateImageMetadata() {
  return [
    {
      contentType: 'image/png',
      size: { width: 32, height: 32 },
      id: 'small',
    },
    {
      contentType: 'image/png',
      size: { width: 192, height: 192 },
      id: 'medium',
    },
    {
      contentType: 'image/png',
      size: { width: 512, height: 512 },
      id: 'large',
    },
  ]
}
 
export default function Icon({ id }: { id: string }) {
  const size = id === 'small' ? 32 : id === 'medium' ? 192 : 512;
  
  return new ImageResponse(
    (
      <div
        style={{
          background: '#f97316', // orange-500
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          borderRadius: id === 'small' ? '8px' : '18%', // Rounder corners for larger icons (like iOS)
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={size * 0.625}
          height={size * 0.625}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
          <path d="M7 2v20" />
          <path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
        </svg>
      </div>
    ),
    {
      width: size,
      height: size,
    }
  )
}
