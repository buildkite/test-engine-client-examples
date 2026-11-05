const proof = require('./proof')

for (let i = 0; i < 150; i++) {
  test(`large batch fail ${i}`, () => {
    proof()
    // Highly compressible but large in decoded UTF-8, including CJK. The
    // collector truncates each exception; a whole file still exceeds its cap.
    throw new Error(`EXPECTED_LARGE_BATCH_FAILURE ${i}\n${'漢字の失敗消息。'.repeat(3000)}`)
  })
}
