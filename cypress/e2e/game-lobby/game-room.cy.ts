// cypress/e2e/game.cy.ts
describe("Game Flow", () => {
  beforeEach(() => {
    cy.task("clearTestData");
  });

  it("allows player 2 to join and shows real-time updates", () => {
    // Create room using task
    cy.createTestRoom("Player1").then((roomData) => {
      const { code: roomCode, id: roomId } = roomData;

      // Visit room as Player1
      cy.visit(`/room/${roomCode}`);

      // Verify initial state
      cy.get("[data-cy=player-item]")
        .should("have.length", 1)
        .and("contain", "Player1");

      // Join room as Player2 using task
      cy.joinTestRoom(roomCode, "Player2").then(() => {
        // Verify Player1 sees the update in real-time
        cy.get("[data-cy=player-item]")
          .should("have.length", 2)
          .and("contain", "Player2");

        // Verify correct data in database
        cy.getTestRoomPlayers(roomId).then((players) => {
          expect(players).to.have.length(2);
          expect(players[0].name).to.equal("Player1");
          expect(players[1].name).to.equal("Player2");
        });
      });
    });
  });

  it("handles room full scenario", () => {
    cy.createTestRoom("Host").then((roomData) => {
      const { code: roomCode } = roomData;

      // Join with 6 more players to fill the room
      const players = Array.from({ length: 6 }, (_, i) => `Player${i + 2}`);

      cy.wrap(players).each((playerName) => {
        cy.joinTestRoom(roomCode, playerName as string);
      });

      // Try to join with one more player
      cy.visit("/");
      cy.get("button").contains("Join Existing Room").click();
      cy.get("#playerName").type("ExtraPlayer");
      cy.get("#roomCode").type(roomCode);
      cy.get("button").contains("Join").click();

      // Verify error message
      cy.get(".bg-red-50").should("be.visible").and("contain", "Room is full");
    });
  });

  it("maintains host status after players join", () => {
    cy.createTestRoom("Host").then((roomData) => {
      const { code: roomCode } = roomData;

      // Visit as host
      cy.visit(`/room/${roomCode}`, {
        state: {
          playerId: roomData.player_id,
          roomId: roomData.id,
        },
      });

      // Join with second player
      cy.joinTestRoom(roomCode, "Player2");

      // Verify host still sees start button
      cy.get("[data-cy=start-game-button]")
        .should("exist")
        .and("not.be.disabled");

      // Visit as Player2
      cy.getTestRoomPlayers(roomData.id).then((players) => {
        const player2 = players.find((p) => p.name === "Player2");
        cy.visit(`/room/${roomCode}`);

        // Verify Player2 doesn't see start button
        cy.get("[data-cy=start-game-button]").should("not.exist");
      });
    });
  });
});
