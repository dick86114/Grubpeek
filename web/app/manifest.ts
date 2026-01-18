import { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'GrubPeek - 今天吃什么',
    short_name: 'GrubPeek',
    description: '查看每日食堂菜单',
    start_url: '/',
    display: 'standalone',
    background_color: '#fff7ed',
    theme_color: '#f97316',
    icons: [
      {
        src: '/icon/medium',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon/large',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
