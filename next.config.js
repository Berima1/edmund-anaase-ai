```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: []
  },
  api: {
    bodyParser: {
      sizeLimit: '1mb'
    },
    responseLimit: '8mb'
  }
}

module.exports = nextConfig
```
