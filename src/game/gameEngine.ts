import { GamePhase, GameState, Player } from "./types";

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
      phase: GamePhase.WAITING,
      winner: null,
    };
  }

  private initializeDeck(): number[] {
    // Create array of numbers 3-35
    const deck = Array.from({ length: 33 }, (_, i) => i + 3);
    // Remove 9 random cards
    for (let i = 0; i < 9; i++) {
      const index = Math.floor(Math.random() * deck.length);
      this.state.removedCards.push(deck.splice(index, 1)[0]);
    }
    // Shuffle remaining deck
    return deck.sort(() => Math.random() - 0.5);
  }

  public joinGame(playerId: string, playerName: string): boolean {
    if (
      this.state.phase !== GamePhase.WAITING ||
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
      isActive: false,
    });

    return true;
  }

  public startGame(): boolean {
    if (this.state.players.length < this.MIN_PLAYERS || this.state.phase !== GamePhase.WAITING) {
      return false;
    }

    this.state.deck = this.initializeDeck();
    this.state.currentCard = this.state.deck.pop() ?? null;
    this.state.phase = GamePhase.PLAYING;
    this.state.players[0].isActive = true;

    return true;
  }

  public takeCard(playerId: string): boolean {
    const currentPlayer = this.getCurrentPlayer();
    if (!this.canTakeAction(playerId, currentPlayer)) {
      return false;
    }

    // Give player the current card and tokens
    currentPlayer.cards.push(this.state.currentCard!);
    currentPlayer.tokens += this.state.tokensOnCard;
    this.state.tokensOnCard = 0;

    // Draw next card or end game if deck is empty
    this.drawNextCard();
    return true;
  }

  public placeToken(playerId: string): boolean {
    const currentPlayer = this.getCurrentPlayer();
    if (!this.canTakeAction(playerId, currentPlayer) || currentPlayer.tokens === 0) {
      return false;
    }

    // Place token
    currentPlayer.tokens--;
    this.state.tokensOnCard++;

    // Move to next player
    this.moveToNextPlayer();
    return true;
  }

  private canTakeAction(playerId: string, currentPlayer: Player | undefined): boolean {
    return (
      this.state.phase === GamePhase.PLAYING &&
      currentPlayer?.id === playerId &&
      currentPlayer.isActive &&
      this.state.currentCard !== null
    );
  }

  private getCurrentPlayer(): Player | undefined {
    return this.state.players[this.state.currentPlayerIndex];
  }

  private moveToNextPlayer(): void {
    this.state.players[this.state.currentPlayerIndex].isActive = false;
    this.state.currentPlayerIndex = (this.state.currentPlayerIndex + 1) % this.state.players.length;
    this.state.players[this.state.currentPlayerIndex].isActive = true;
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
    this.state.phase = GamePhase.ENDED;
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
    let score = -player.tokens; // Start with negative tokens

    let i = 0;
    while (i < sortedCards.length) {
      let j = i;
      // Find consecutive sequence
      while (j + 1 < sortedCards.length && sortedCards[j + 1] === sortedCards[j] + 1) {
        j++;
      }
      // Add only the lowest card in the sequence
      score += sortedCards[i];
      i = j + 1;
    }

    return score;
  }

  public getState(): GameState {
    return { ...this.state };
  }
}
