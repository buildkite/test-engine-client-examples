describe('Visit', () => {
  it('Visits the Kitchen Sink', () => {
    cy.visit('cypress/fixtures/index.html')
  })

  it('finds the content "type"', () => {
    cy.visit('cypress/fixtures/index.html')

    cy.contains('type')
  })
})
