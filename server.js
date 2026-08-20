import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import { generateModZip } from './generator/zipAssembler.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const app  = express()
const PORT = process.env.PORT || 3001

const ALLOWED_ORIGIN   = process.env.ALLOWED_ORIGIN   || 'https://luchidev17.github.io'
const API_SECRET_TOKEN = process.env.API_SECRET_TOKEN || null

// ── CORS ─────────────────────────────────────────────────────────────────────
// En desarrollo local también se permite localhost para poder probar
const allowedOrigins = [
  ALLOWED_ORIGIN,
  'http://localhost:5173',
  'http://localhost:4173',
]

app.use(cors({
  origin: (origin, callback) => {
    // Permitir requests sin origin (ej. curl, Postman, probes internos de Render, etc.)
    if (!origin) {
      return callback(null, true)
    }
    if (allowedOrigins.includes(origin)) return callback(null, true)
    callback(new Error(`CORS: origen no permitido → ${origin}`))
  },
  methods: ['POST', 'GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-api-token'],
}))

// ── Auth middleware ───────────────────────────────────────────────────────────
function requireToken(req, res, next) {
  if (!API_SECRET_TOKEN) return next() // Sin token configurado → sin restricción (solo dev)

  const token = req.headers['x-api-token']
  if (token !== API_SECRET_TOKEN) {
    return res.status(401).json({ error: 'Token inválido o ausente' })
  }
  next()
}

// ── Body parser ───────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }))

// ── Archivos estáticos del Gradle Wrapper ────────────────────────────────────
// Sirve: build_mod.exe, gradlew, gradlew.bat, gradle/wrapper/*
app.use('/gradle-wrapper', express.static(path.join(__dirname, 'public', 'gradle-wrapper')))

// ── POST /api/generate-mod ───────────────────────────────────────────────────
app.post('/api/generate-mod', requireToken, async (req, res) => {
  try {
    const { items = [], blocks = [], armors = [], modConfig = {} } = req.body

    if (!modConfig.id || !modConfig.name) {
      return res.status(400).json({ error: 'modConfig.id y modConfig.name son requeridos' })
    }

    const zipBlob = await generateModZip(items, modConfig, blocks, armors)

    const arrayBuffer = await zipBlob.arrayBuffer()
    const buffer      = Buffer.from(arrayBuffer)

    res.set({
      'Content-Type':        'application/octet-stream',
      'Content-Disposition': `attachment; filename="LazyForgeMod.zip"`,
      'Content-Length':      buffer.length,
    })

    res.send(buffer)

  } catch (err) {
    console.error('[/api/generate-mod] Error:', err)
    res.status(500).json({ error: err.message || 'Error interno del servidor' })
  }
})

// ── GET /health ───────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok' }))

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`LazyForge API corriendo en http://localhost:${PORT}`)
  console.log(`CORS permitido para: ${allowedOrigins.join(', ')}`)
  console.log(`Auth token: ${API_SECRET_TOKEN ? '✅ Configurado' : '⚠️  No configurado (solo dev)'}`)
})
