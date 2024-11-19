// src/game/gameEngine.ts
import { Player } from "../lib/types";

interface GameState {
  players: Player[];
  currentPlayerIndex: number;
  deck: number[];
  currentCard: number | null;
  tokensOnCard: number;
  removedCards: number[];
  phase: "waiting" | "playing" | "ended";
  winner: string | null;
}

export class NoThanksGame {
  private state: GameState;
  private readonly INITIAL_TOKENS = 11;
  private readonly MIN_PLAYERS = 3;
  private readonly MAX_PLAYERS = 7;

  constructor() {
    this.state = this.getInitialState();
  }

  private getInitialState(): GameState {
    return {
      players: [],
      currentPlayerIndex: 0,
      deck: [],
      currentCard: null,
      tokensOnCard: 0,
      removedCards: [],
      phase: "waiting",
      winner: null,
    };
  }

  // In gameEngine.ts
  private initializeDeck(): number[] {
    // Create array with ALL numbers 3 to 35 inclusive
    const allCards = [];
    for (let i = 3; i <= 35; i++) {
      allCards.push(i);
    }

    // Verify we have exactly 33 cards before shuffling
    if (allCards.length !== 33) {
      throw new Error(`Wrong initial card count: ${allCards.length}`);
    }

    // Shuffle all cards
    const shuffledCards = [...allCards];
    for (let i = shuffledCards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledCards[i], shuffledCards[j]] = [shuffledCards[j], shuffledCards[i]];
    }

    // First 9 cards are removed from play
    this.state.removedCards = shuffledCards.slice(0, 9);

    // Remaining 24 cards: 23 in deck, 1 current card
    this.state.deck = shuffledCards.slice(9);
    this.state.currentCard = this.state.deck.pop() ?? null;

    // Verify final counts
    const finalCounts = {
      inDeck: this.state.deck.length,
      removed: this.state.removedCards.length,
      current: this.state.currentCard ? 1 : 0,
      total:
        this.state.deck.length + this.state.removedCards.length + (this.state.currentCard ? 1 : 0),
    };

    // Add detailed verification
    if (finalCounts.total !== 33) {
      throw new Error(
        `Invalid card distribution:\n` +
          `Deck: ${finalCounts.inDeck}\n` +
          `Removed: ${finalCounts.removed}\n` +
          `Current: ${finalCounts.current}\n` +
          `Total: ${finalCounts.total} (should be 33)`
      );
    }

    if (this.state.removedCards.length !== 9) {
      throw new Error(`Wrong number of removed cards: ${this.state.removedCards.length}`);
    }

    if (this.state.deck.length !== 23) {
      throw new Error(`Wrong number of cards in deck: ${this.state.deck.length}`);
    }

    return this.state.deck;
  }

  public joinGame(playerId: string, playerName: string): boolean {
    if (
      this.state.phase !== "waiting" ||
      this.state.players.length >= this.MAX_PLAYERS ||
      this.state.players.some((p) => p.id === playerId)
    ) {
      return false;
    }

    this.state.players.push({
      id: playerId,
      name: playerName,
      tokens: this.INITIAL_TOKENS,
      cards: [],
      is_active: false,
      is_ready: false,
      room_id: "", // This will be set by Supabase
      created_at: new Date().toISOString(),
    });

    return true;
  }

  public startGame(): boolean {
    if (this.state.players.length < this.MIN_PLAYERS || this.state.phase !== "waiting") {
      return false;
    }

    this.initializeDeck(); // This already sets up deck and current card
    this.state.phase = "playing";
    if (this.state.players[0]) {
      this.state.players[0].is_active = true;
    }

    return true;
  }

  public takeCard(playerId: string): boolean {
    const currentPlayer = this.getCurrentPlayer();
    if (!this.canTakeAction(playerId, currentPlayer)) {
      return false;
    }

    if (currentPlayer && this.state.currentCard !== null) {
      // Add card to player's cards
      const updatedCards = [...(currentPlayer.cards || [])];
      updatedCards.push(this.state.currentCard);
      currentPlayer.cards = updatedCards;

      // Update tokens
      currentPlayer.tokens += this.state.tokensOnCard;
      this.state.tokensOnCard = 0;

      // Draw next card
      const nextCard = this.state.deck.pop() ?? null;
      this.state.currentCard = nextCard;

      // End game if no more cards
      if (nextCard === null) {
        this.endGame();
      }
    }

    return true;
  }

  public placeToken(playerId: string): boolean {
    const currentPlayer = this.getCurrentPlayer();
    if (
      !currentPlayer ||
      !this.canTakeAction(playerId, currentPlayer) ||
      currentPlayer.tokens === 0
    ) {
      return false;
    }

    currentPlayer.tokens--;
    this.state.tokensOnCard++;
    this.moveToNextPlayer();
    return true;
  }

  private canTakeAction(playerId: string, currentPlayer: Player | undefined): boolean {
    return (
      this.state.phase === "playing" &&
      currentPlayer?.id === playerId &&
      currentPlayer.is_active &&
      this.state.currentCard !== null
    );
  }

  private getCurrentPlayer(): Player | undefined {
    return this.state.players[this.state.currentPlayerIndex];
  }

  private moveToNextPlayer(): void {
    const currentPlayer = this.getCurrentPlayer();
    if (currentPlayer) {
      currentPlayer.is_active = false;
      this.state.currentPlayerIndex =
        (this.state.currentPlayerIndex + 1) % this.state.players.length;
      const nextPlayer = this.getCurrentPlayer();
      if (nextPlayer) {
        nextPlayer.is_active = true;
      }
    }
  }

  private drawNextCard(): void {
    this.state.currentCard = this.state.deck.pop() ?? null;
    if (this.state.currentCard === null) {
      this.endGame();
    } else {
      this.moveToNextPlayer();
    }
  }

  private endGame(): void {
    this.state.phase = "ended";
    this.state.winner = this.calculateWinner();
  }

  private calculateWinner(): string {
    const scores = this.state.players.map((player) => ({
      id: player.id,
      score: this.calculatePlayerScore(player),
    }));
    scores.sort((a, b) => a.score - b.score);
    return scores[0].id;
  }

  private calculatePlayerScore(player: Player): number {
    // Make defensive copies of the arrays and ensure we have valid data
    const cards = [...(player.cards || [])].sort((a, b) => a - b);
    const tokens = player.tokens || 0;

    // Start with negative tokens
    let score = -tokens;

    if (cards.length === 0) {
      return score;
    }

    // Find sequences and only count lowest card in each sequence
    let i = 0;
    while (i < cards.length) {
      const sequenceStart = cards[i];
      let j = i;

      // Find end of current sequence
      while (j + 1 < cards.length && cards[j + 1] === cards[j] + 1) {
        j++;
      }

      // Add score for this sequence/card
      score += sequenceStart; // Only add the lowest card

      // Move to start of next potential sequence
      i = j + 1;
    }

    return score;
  }

  public getState(): GameState {
    return { ...this.state };
  }

  // Debugging methods
  private getSequences(cards: number[]): number[][] {
    const sequences: number[][] = [];
    const sortedCards = [...cards].sort((a, b) => a - b);

    let currentSequence: number[] = [];
    for (let i = 0; i < sortedCards.length; i++) {
      if (currentSequence.length === 0) {
        currentSequence.push(sortedCards[i]);
      } else {
        if (sortedCards[i] === currentSequence[currentSequence.length - 1] + 1) {
          currentSequence.push(sortedCards[i]);
        } else {
          sequences.push([...currentSequence]);
          currentSequence = [sortedCards[i]];
        }
      }
    }
    if (currentSequence.length > 0) {
      sequences.push(currentSequence);
    }
    return sequences;
  }

  private explainScore(player: Player): string {
    const cards = [...(player.cards || [])].sort((a, b) => a - b);
    const sequences = this.getSequences(cards);
    const tokens = player.tokens || 0;

    let explanation = `Score calculation for ${player.name}:\n`;
    explanation += `Cards: ${cards.join(", ")}\n`;
    explanation += `Tokens: ${tokens}\n`;
    explanation += "Sequences:\n";

    let scoreTotal = -tokens;
    sequences.forEach((seq) => {
      if (seq.length > 1) {
        explanation += `  ${seq.join("-")} (counts as ${seq[0]})\n`;
        scoreTotal += seq[0];
      } else {
        explanation += `  ${seq[0]} (single card)\n`;
        scoreTotal += seq[0];
      }
    });

    explanation += `Token deduction: -${tokens}\n`;
    explanation += `Final score: ${scoreTotal}`;

    return explanation;
  }
}
