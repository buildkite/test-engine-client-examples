const proof = require('./proof')

for (let i = 0; i < 1500; i++) {
  test(`large batch pass ${i}`, () => {
    proof()
    expect(i).toBeLessThan(1500)
  })
}
