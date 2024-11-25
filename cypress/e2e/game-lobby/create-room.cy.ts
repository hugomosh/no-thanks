describe("Game creation", () => {
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

  describe("Game room", () => {
    beforeEach(() => {
      cy.get("#playerName").type(`Player 1{enter}`);
    });
    it("should display room code and copy button", () => {
      // Check if copy button exists
      cy.get("[data-cy=copy-link-button]").should("exist");
    });

    it("should show host in player list", () => {
      cy.get("[data-cy=player-item]")
        .should("have.length", 1)
        .and("contain", "Player 1")
        .and("contain", "(Host)");
    });

    it("should show disabled start button with less than 2 players", () => {
      cy.get("[data-cy=start-game-button]")
        .should("be.disabled")
        .and("contain", "Need 2 more players to start");
    });
  });
});
