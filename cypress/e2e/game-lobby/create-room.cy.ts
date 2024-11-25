describe("example to-do app", () => {
  beforeEach(() => {
    cy.visit("/");
  });

  it("create room", () => {
    // Write name
    cy.get("#playerName").type(`Hugo{enter}`);
    // Create room

    // Navigated to 3 letter url
    cy.url().should("match", /\/room\/[a-z]{3}-[a-z]{3}-[a-z]{3}$/);
  });
});
