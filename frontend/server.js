const { createServer } = require('http')
const next = require('next')
const { parse } = require('url')

const port = parseInt(process.env.PORT || '3000', 10)
const dev = process.env.NODE_ENV !== 'production'
const hostname = '0.0.0.0' // Bind tất cả interfaces để cPanel có thể truy cập

// Đảm bảo NODE_ENV được set
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'production'
}

console.log('Starting Next.js server...')
console.log('NODE_ENV:', process.env.NODE_ENV)
console.log('PORT:', port)
console.log('HOSTNAME:', hostname)
console.log('__dirname:', __dirname)

// Cấu hình Next.js với memory optimization
const app = next({ 
  dev: false, // Luôn dùng production mode
  hostname, 
  port,
  dir: __dirname // Quan trọng: chỉ định đúng thư mục
})
const handle = app.getRequestHandler()

app.prepare().then(() => {
  console.log('> Next.js app prepared successfully')
  
  createServer((req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      
      // Health check endpoint cho cPanel
      if (parsedUrl.pathname === '/health') {
        res.setHeader('Content-Type', 'text/plain; charset=utf-8')
        res.statusCode = 200
        res.end('OK')
        return
      }
      
      handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error handling request:', err)
      res.statusCode = 500
      res.setHeader('Content-Type', 'text/html; charset=utf-8')
      res.end(`
        <html>
          <head><title>Internal Server Error</title></head>
          <body>
            <h1>Internal Server Error</h1>
            <p>${err.message}</p>
          </body>
        </html>
      `)
    }
  }).listen(port, hostname, (err) => {
    if (err) {
      console.error('Failed to start server:', err)
      throw err
    }
    console.log(`> Ready on http://${hostname}:${port}`)
  })
}).catch((err) => {
  console.error('Failed to prepare Next.js app:', err)
  console.error('Error details:', err.message)
  console.error('Stack:', err.stack)
  process.exit(1)
})
