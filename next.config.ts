/** @type {import('next').NextConfig} */
module.exports = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'gdzgefuyxaenfvfyodqf.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/food-images/**',
      },
    ],
  },
}
