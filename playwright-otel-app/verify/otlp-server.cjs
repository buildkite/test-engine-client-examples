// Local-only OTLP/protobuf receiver. Based on bktest's e2e OTLP sink; keeps
// the fields the proof checks and transport routing headers, never credentials.
const http = require('node:http');
const zlib = require('node:zlib');

function varint(buf, pos) {
  let value = 0n;
  let shift = 0n;
  for (;;) {
    const byte = buf[pos.offset++];
    value |= BigInt(byte & 0x7f) << shift;
    if (!(byte & 0x80)) return value;
    shift += 7n;
  }
}

function fields(buf) {
  const result = [];
  const pos = { offset: 0 };
  while (pos.offset < buf.length) {
    const tag = Number(varint(buf, pos));
    let value;
    switch (tag & 7) {
      case 0: value = varint(buf, pos); break;
      case 1: value = buf.subarray(pos.offset, pos.offset += 8); break;
      case 2: {
        const length = Number(varint(buf, pos));
        value = buf.subarray(pos.offset, pos.offset += length);
        break;
      }
      case 5: value = buf.subarray(pos.offset, pos.offset += 4); break;
      default: throw new Error(`unsupported protobuf wire type ${tag & 7}`);
    }
    result.push({ number: tag >> 3, value });
  }
  return result;
}
const all = (f, n) => f.filter(x => x.number === n).map(x => x.value);
const first = (f, n) => all(f, n)[0];
const str = b => b?.toString('utf8');
const hex = b => b?.toString('hex') || '';

function anyValue(buf) {
  const [f] = fields(buf);
  switch (f.number) {
    case 1: return { type: 'string', value: str(f.value) };
    case 2: return { type: 'bool', value: f.value !== 0n };
    case 3: return { type: 'int', value: BigInt.asIntN(64, f.value) };
    case 4: return { type: 'double', value: f.value.readDoubleLE(0) };
    case 5: return { type: 'array', value: all(fields(f.value), 1).map(anyValue) };
    case 6: return { type: 'kvlist', value: attributes(all(fields(f.value), 1)) };
    case 7: return { type: 'bytes', value: hex(f.value) };
    default: throw new Error(`unsupported OTLP value ${f.number}`);
  }
}
function attributes(buffers) {
  return Object.fromEntries(buffers.map(buf => {
    const f = fields(buf);
    return [str(first(f, 1)), anyValue(first(f, 2)).value];
  }));
}
function decode(buf, headers, receivedAt) {
  return all(fields(buf), 1).flatMap(resourceBuf => {
    const resourceSpans = fields(resourceBuf);
    const resource = attributes(all(fields(first(resourceSpans, 1)), 1));
    return all(resourceSpans, 2).flatMap(scopeBuf => {
      const scopeSpans = fields(scopeBuf);
      const scope = str(first(fields(first(scopeSpans, 1)), 1));
      return all(scopeSpans, 2).map(spanBuf => {
        const f = fields(spanBuf);
        return {
          traceId: hex(first(f, 1)), spanId: hex(first(f, 2)), parentSpanId: hex(first(f, 4)),
          name: str(first(f, 5)), kind: Number(first(f, 6) ?? 0n),
          startTimeUnixNano: first(f, 7).readBigUInt64LE(0),
          endTimeUnixNano: first(f, 8).readBigUInt64LE(0),
          attributes: attributes(all(f, 9)), scope, service: resource['service.name'],
          runKey: headers['buildkite-tests-run-key'], stream: headers['buildkite-tests-span-stream'], receivedAt,
        };
      });
    });
  });
}

async function startOtlpServer() {
  const spans = [];
  const errors = [];
  const server = http.createServer((req, res) => {
    if (req.url !== '/v1/traces') {
      req.resume();
      res.writeHead(404).end();
      return;
    }
    if (req.method !== 'POST') {
      req.resume();
      res.writeHead(405, { Allow: 'POST' }).end();
      return;
    }
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks);
        const body = req.headers['content-encoding'] === 'gzip' ? zlib.gunzipSync(raw) : raw;
        spans.push(...decode(body, req.headers, Date.now()));
        res.writeHead(200, { 'Content-Type': 'application/x-protobuf' }).end();
      } catch (error) {
        errors.push(error);
        res.writeHead(400).end();
      }
    });
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  return {
    url: `http://127.0.0.1:${server.address().port}/v1/traces`,
    spans: () => {
      if (errors.length) throw errors[0];
      return spans;
    },
    close: () => new Promise(resolve => server.close(resolve)),
  };
}
module.exports = { startOtlpServer };
