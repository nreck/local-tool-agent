// @/app/api/live-courses/[courseId]/route.ts 
import { NextRequest, NextResponse } from 'next/server'
import { TransformStream } from 'web-streams-polyfill' // <-- from the ponyfill
import fs from 'fs'
import path from 'path'

// Keep track of clients and watchers in global variables.
// This prevents losing them across hot-reloads in dev mode.
type SSEClient = {
  write: (msg: string) => void
  filePath: string
}
let sseClients: SSEClient[] = []
let fileWatchers: Record<string, boolean> = {}

// Helper to read file & write contents to SSE
async function sendFileContents(client: SSEClient) {
  const { filePath, write } = client
  try {
    const data = await fs.promises.readFile(filePath, 'utf8')
    const jsonData = JSON.parse(data) // Parse to validate JSON
    write(`data: ${JSON.stringify(jsonData)}\n\n`) // Properly stringify the JSON
  } catch (err: any) {
    write(`data: ${JSON.stringify({ error: err.message })}\n\n`)
  }
}

// Watch a file for changes. On change, broadcast to connected clients.
function watchFile(filePath: string) {
  // Only set up one fs.watchFile for each unique filePath
  if (!fileWatchers[filePath]) {
    fileWatchers[filePath] = true

    fs.watchFile(filePath, (curr, prev) => {
      if (curr.mtime !== prev.mtime) {
        // On file change, broadcast new contents
        sseClients
          .filter((client) => client.filePath === filePath)
          .forEach((client) => {
            sendFileContents(client)
          })
      }
    })
  }
}

/**
 * GET /api/live-courses/:courseId
 * Returns an SSE stream of the local JSON file contents whenever it changes.
 */
export async function GET(request: NextRequest) {
  const courseId = request.nextUrl.pathname.split('/').pop();

  const filePath = path.join(
    process.cwd(),
    'storage',
    'courses',
    `${courseId}.json`
  )

  // Create a TransformStream so we can write SSE data into it.
  const { readable, writable } = new TransformStream()
  const writer = writable.getWriter()
  const encoder = new TextEncoder()

  // Helper to write strings to the client
  const write = (message: string) => {
    writer.write(encoder.encode(message))
  }

  // Immediately send some SSE headers/info so the client knows we're connected
  // (Some SSE clients require initial padding)
  write(':' + Array(2049).join(' ') + '\n') // 2kB of padding
  write('retry: 10000\n') // re-connect delay if the connection drops
  write('event: open\n\n')

  // Add this client to the global list
  const newClient: SSEClient = { write, filePath }
  sseClients.push(newClient)

  // Immediately send current contents of the file
  await sendFileContents(newClient)

  // Start watching the file if needed
  watchFile(filePath)

  // If the client disconnects, remove them
  const onClose = () => {
    sseClients = sseClients.filter((client) => client !== newClient)
    writer.close()
  }
  request.signal.addEventListener('abort', onClose)

  return new NextResponse(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  })
}
