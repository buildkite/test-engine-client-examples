// verify.js runs this expected-failure file separately and checks the exact failure.
beforeAll(() => { throw new Error('EXPECTED_BEFORE_ALL_FAILURE') })
test('blocked by beforeAll', () => { throw new Error('BODY_MUST_NOT_RUN') })
