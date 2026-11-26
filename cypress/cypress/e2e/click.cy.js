describe('Click', () => {
  it('clicks the link "type"', () => {
    cy.visit('cypress/fixtures/index.html')

    cy.contains('type').click()

    cy.url().should('include', '/commands/actions')
  })
})
