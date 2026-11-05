import { beforeAll, beforeEach, afterEach, describe, test, expect } from 'vitest'
import { trace, context } from '@opentelemetry/api'
import { createServer, get } from 'node:http'
import { appendFileSync } from 'node:fs'
import { threadId } from 'node:worker_threads'

// Deliberately obtain the tracer at module import, before any test starts.
const tracer = trace.getTracer('vitest-scale-harness')
const manual = (name, fn = () => {}) => tracer.startActiveSpan(name, async (span) => {
  try { return await fn() } finally { span.end() }
})

export function suite(file) {
  const passing = process.env.HARNESS_SIZE === 'small' ? 10 : 50
  const failing = process.env.HARNESS_SIZE === 'small' ? 1 : 5
  beforeAll(() => manual('outside-beforeAll'))
  beforeEach(({ task }) => task.name === `case ${file} pass 0` ? manual('hook-before') : undefined)
  afterEach(({ task }) => task.name === `case ${file} pass 0` ? manual('hook-after') : undefined)
  for (let i = 0; i < passing + failing; i++) {
    const failed = i >= passing
    const name = `case ${file} ${failed ? 'fail' : 'pass'} ${failed ? i - passing : i}`
    const register = !failed && i === 1 ? test.concurrent : test
    register(name, async () => {
      const active = trace.getSpan(context.active())
      appendFileSync(process.env.HARNESS_PROOFS, JSON.stringify({
        name, pid: process.pid, threadId,
        ...(active ? active.spanContext() : {}),
      }) + '\n')
      if (!failed && i === 0) {
        await manual('body-manual')
        const server = createServer((_req, res) => {
          void manual('server-handler', () => res.end('ok'))
        })
        await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
        const url = `http://127.0.0.1:${server.address().port}/scale`
        try {
          await new Promise((resolve, reject) => {
            get(url, (res) => { res.resume(); res.on('end', resolve) }).on('error', reject)
          })
          expect(await (await fetch(url)).text()).toBe('ok')
        } finally { await new Promise((resolve) => server.close(resolve)) }
      } else if (!failed && i === 1) {
        await manual('concurrent-manual', () => new Promise((resolve) => setTimeout(resolve, 2)))
      }
      if (failed) throw new Error(`EXPECTED_SCALE_FAILURE ${name}\n${'漢字の失敗消息。'.repeat(3000)}`)
      expect(2 + 3).toBe(5)
    })
  }
  describe.skip(`skipped suite ${file}`, () => {
    test(`case ${file} skip 0`, () => { throw new Error('Skipped body executed') })
  })
}
