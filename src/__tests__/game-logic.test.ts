import { describe, it, expect, beforeEach } from "vitest";
import { NoThanksGame } from "../game/gameEngine";

describe("NoThanksGame Card and Score Consistency", () => {
  let game: NoThanksGame;

  beforeEach(() => {
    game = new NoThanksGame();
    // Set up a standard game
    game.joinGame("p1", "Player 1");
    game.joinGame("p2", "Player 2");
    game.joinGame("p3", "Player 3");
    game.startGame();
  });

  describe("Deck Initialization", () => {
    it("should create exact number of cards", () => {
      const game = new NoThanksGame();
      game.joinGame("p1", "Player 1");
      game.joinGame("p2", "Player 2");
      game.joinGame("p3", "Player 3");
      game.startGame();

      const state = game.getState();

      // Verify counts
      expect(state.deck.length).toBe(23);
      expect(state.removedCards.length).toBe(9);
      expect(state.currentCard).not.toBeNull();

      // Verify total cards
      const totalCards =
        state.deck.length + state.removedCards.length + (state.currentCard ? 1 : 0);
      expect(totalCards).toBe(33);

      // Verify card range
      const allCards = [
        ...state.deck,
        ...state.removedCards,
        ...(state.currentCard ? [state.currentCard] : []),
      ];

      allCards.forEach((card) => {
        expect(card).toBeGreaterThanOrEqual(3);
        expect(card).toBeLessThanOrEqual(35);
      });

      // Verify uniqueness
      const uniqueCards = new Set(allCards);
      expect(uniqueCards.size).toBe(33);
    });
  });

  describe("Card Uniqueness", () => {
    it("should have no duplicate cards in initial deck", () => {
      const state = game.getState();
      const allCards = [
        ...state.deck,
        ...(state.currentCard ? [state.currentCard] : []),
        ...state.removedCards,
      ];

      // Check for duplicates
      const cardSet = new Set(allCards);
      expect(cardSet.size).toBe(allCards.length);

      // Verify all cards are in valid range (3-35)
      allCards.forEach((card) => {
        expect(card).toBeGreaterThanOrEqual(3);
        expect(card).toBeLessThanOrEqual(35);
      });
    });

    it("should maintain card uniqueness throughout the game", () => {
      // Simulate a full game
      const cardsSeen = new Set<number>();
      let state = game.getState();

      while (state.currentCard !== null) {
        if (state.currentCard !== null) {
          expect(cardsSeen.has(state.currentCard)).toBe(false);
          cardsSeen.add(state.currentCard);
        }
        game.takeCard("p1"); // Take every card to advance game
        state = game.getState();
      }
    });

    it("should have exactly 24 cards in play (33 - 9 removed)", () => {
      const state = game.getState();
      const totalCards =
        state.deck.length + (state.currentCard ? 1 : 0) + state.removedCards.length;

      expect(totalCards).toBe(33); // Total cards in game
      expect(state.removedCards).toHaveLength(9);
      expect(state.deck.length + (state.currentCard ? 1 : 0)).toBe(24);
    });
  });

  describe("Score Consistency", () => {
    it("should calculate consistent scores for the same card sets", () => {
      const game1 = new NoThanksGame();
      const game2 = new NoThanksGame();

      // Set up identical games with predetermined cards
      const setupGame = (game: NoThanksGame) => {
        game.joinGame("p1", "Player 1");
        game.joinGame("p2", "Player 2");
        game.joinGame("p3", "Player 3");

        const testState = {
          players: [
            {
              id: "p1",
              name: "Player 1",
              tokens: 5, // Changed to match our expected calculation
              cards: [3, 4, 5, 10],
              is_active: true,
              is_ready: true,
              room_id: "123",
              created_at: new Date().toISOString(),
            },
            // ... other players remain the same
          ],
          // ... rest of the state remains the same
        };

        // @ts-ignore - Accessing private state for testing
        game["state"] = JSON.parse(JSON.stringify(testState));
      };

      setupGame(game1);
      setupGame(game2);

      // Get scores and explanations
      const player1 = game1.getState().players[0];
      const player2 = game2.getState().players[0];

      const score1 = game1["calculatePlayerScore"](player1);
      const score2 = game2["calculatePlayerScore"](player2);

      // Scores should be identical and correct
      expect(score1).toBe(score2);
      expect(score1).toBe(8); // 3 (for 3-5 sequence) + 10 - 5 tokens = 8
    });

    // Add a more comprehensive scoring test
    it("should calculate all sequence combinations correctly", () => {
      const game = new NoThanksGame();
      const testCases = [
        {
          cards: [3, 4, 5, 10],
          tokens: 5,
          expectedScore: 8, // 3 (for 3-5 sequence) + 10 - 5 tokens
          description: "One sequence and one single card",
        },
        {
          cards: [3, 5, 7, 9],
          tokens: 3,
          expectedScore: 21, // 3 + 5 + 7 + 9 - 3 tokens
          description: "All single cards",
        },
        {
          cards: [3, 4, 5, 6, 7],
          tokens: 2,
          expectedScore: 1, // 3 (for 3-7 sequence) - 2 tokens
          description: "One long sequence",
        },
        {
          cards: [3, 4, 7, 8, 11],
          tokens: 4,
          expectedScore: 17, // 3 (for 3-4) + 7 (for 7-8) + 11 - 4 tokens
          description: "Two sequences and one single card",
        },
      ];

      testCases.forEach(({ cards, tokens, expectedScore, description }) => {
        const testPlayer = {
          id: "test",
          name: "Test Player",
          tokens,
          cards,
          is_active: false,
          is_ready: true,
          room_id: "123",
          created_at: new Date().toISOString(),
        };

        const score = game["calculatePlayerScore"](testPlayer);
        expect(score).toBe(expectedScore, `Failed case: ${description}`);
      });
    });
  });
});
