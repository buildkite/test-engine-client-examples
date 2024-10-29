describe('Failed', () => {
  it('failed', () => {
    cy.visit('https://example.cypress.io')

    cy.contains('hello world')
  })
})
