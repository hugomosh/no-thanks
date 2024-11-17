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

  private initializeDeck(): number[] {
    const deck = Array.from({ length: 33 }, (_, i) => i + 3);
    for (let i = 0; i < 9; i++) {
      const index = Math.floor(Math.random() * deck.length);
      this.state.removedCards.push(deck.splice(index, 1)[0]);
    }
    return deck.sort(() => Math.random() - 0.5);
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

    this.state.deck = this.initializeDeck();
    this.state.currentCard = this.state.deck.pop() ?? null;
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
      currentPlayer.cards.push(this.state.currentCard);
      currentPlayer.tokens += this.state.tokensOnCard;
      this.state.tokensOnCard = 0;
      this.drawNextCard();
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
    const sortedCards = [...player.cards].sort((a, b) => a - b);
    let score = -player.tokens;

    let i = 0;
    while (i < sortedCards.length) {
      let j = i;
      while (j + 1 < sortedCards.length && sortedCards[j + 1] === sortedCards[j] + 1) {
        j++;
      }
      score += sortedCards[i];
      i = j + 1;
    }

    return score;
  }

  public getState(): GameState {
    return { ...this.state };
  }
}
