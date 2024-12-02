import { GameResultsProps, Score } from "../../types";

export function GameScore({ players }: GameResultsProps) {
  // Calculate scores and sort players
  const playerScores = players
    .map((player) => ({
      ...player,
      score: calculateScore(player.cards, player.tokens),
    }))
    .sort((a, b) => a.score.score - b.score.score); // Sort ascending (lowest score wins)

  return (
    <div data-testid="final-scores">
      <h2>Game Results</h2>
      {playerScores.map((player, index) => (
        <div key={player.id}>
          {index + 1}. {player.name}: {player.score.score} points
          <div className="text-sm">
            Cards: {player.cards.join(", ")} <br />
            Tokens: {player.tokens}
          </div>
        </div>
      ))}
    </div>
  );
}

function calculateScore(cards: number[], tokens: number): Score {
  const highlightedCards = new Set<number>();

  if (!cards.length) return { score: -tokens, highlightedCards };

  let score = 0;
  let currentSequence: number[] = [];

  // Sort cards to find sequences
  const sortedCards = [...cards].sort((a, b) => a - b);

  for (const card of sortedCards) {
    if (!currentSequence.length) {
      currentSequence = [card];
    } else {
      if (card === currentSequence[currentSequence.length - 1] + 1) {
        currentSequence.push(card);
      } else {
        score += currentSequence[0]; // Add lowest value of sequence
        highlightedCards.add(currentSequence[0]);
        currentSequence = [card];
      }
    }
  }

  // Add last sequence
  if (currentSequence.length) {
    score += currentSequence[0];
  }

  return { score: score - tokens, highlightedCards };
}
