import { Regex } from "lucide-react";

// cypress/e2e/lobby.cy.js

describe("Game Lobby", () => {
  it("shows real-time player joining", () => {
    let savedRoomCode = "";

    // Create room as Player1 and keep the window open
    cy.visit("/");
    cy.get("#playerName").type("Player1{enter}");

    // Save room code and open new window for Player2
    cy.url()
      .should("match", /\/room\/[a-z]{3}-[a-z]{3}-[a-z]{3}$/)
      .then((url) => {
        savedRoomCode = url.split("/").pop() || "failed-to-get-room";

        // Keep track of Player1's window
        cy.window().as("player1Window");

        // Open new tab for Player2
        cy.visit("/");
        cy.get("button").contains("Join Existing Room").click();
        cy.get("#playerName").type("Player2");
        cy.get("#roomCode").type(savedRoomCode);
        cy.get("button").contains("Join").click();

        // Verify Player2 sees both players
        cy.get("[data-cy=player-item]").should("have.length", 2);
        cy.get("[data-cy=player-item]").should("contain", "Player1");
        cy.get("[data-cy=player-item]").should("contain", "Player2");

        // Go back to Player1's window and verify they see Player2
        cy.visit(`/room/${savedRoomCode}`, {
          state: {
            playerId: window.localStorage.getItem("player1Id"),
            roomId: window.localStorage.getItem("room1Id"),
          },
        });

        // Verify Player1 sees both players
        cy.get("[data-cy=player-item]").should("have.length", 2);
        cy.get("[data-cy=player-item]").should("contain", "Player1");
        cy.get("[data-cy=player-item]").should("contain", "Player2");
      });
  });
});

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

  it("allow player 2 to join created room room", () => {
    // Write name
    cy.get("#playerName").type(`Player1 {enter}`);
    // Create room

    cy.url()
      .should("match", /\/room\/[a-z]{3}-[a-z]{3}-[a-z]{3}$/)
      .then((url) => {
        const savedRoomCode = url.split("/").pop();

        // Join room as Player2
        cy.visit("/");
        cy.get("button").contains("Join Existing Room").click();
        cy.get("#playerName").type("Player2");
        cy.get("#roomCode").type(savedRoomCode!);
        cy.get("button").contains("Join").click();

        // Verify navigation to room
        cy.url().should("include", `/room/${savedRoomCode}`);

        // Verify both players are shown
        cy.get("[data-cy=player-item]").should("have.length", 2);
        cy.get("[data-cy=player-item]").should("contain", "Player1");
        cy.get("[data-cy=player-item]").should("contain", "Player2");
      });
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
