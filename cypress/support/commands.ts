declare global {
  namespace Cypress {
     interface CustomTasks {
      createRoom(playerName: string): Promise<any>;
      joinRoom(roomCode: string, playerName: string): Promise<any>;
      getRoomPlayers(roomId: string): Promise<any[]>;
      clearTestData(): Promise<void>;
    }
    interface Chainable {
      createTestRoom(playerName: string): Chainable<any>;
      joinTestRoom(roomCode: string, playerName: string): Chainable<any>;
      getTestRoomPlayers(roomId: string): Chainable<any>;
    }
  }
}

Cypress.Commands.add("createTestRoom", (playerName: string) => {
  return cy.task("createRoom", playerName);
});

Cypress.Commands.add("joinTestRoom", (roomCode: string, playerName: string) => {
  return cy.task("joinRoom", { roomCode, playerName });
});

Cypress.Commands.add("getTestRoomPlayers", (roomId: string) => {
  return cy.task("getRoomPlayers", roomId);
});
