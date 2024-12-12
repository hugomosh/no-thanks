// GameScore.tsx
import { GameResultsProps, Score } from "../../types";
import { Coins, Trophy } from 'lucide-react';

function calculateScore(cards: number[], tokens: number): Score {
  const highlightedCards = new Set<number>();

  if (!cards.length) return { 
    score: -tokens, 
    highlightedCards,
    calculation: `0 − ${tokens}`
  };

  let score = 0;
  let currentSequence: number[] = [];
  const countedCards: number[] = [];

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
        countedCards.push(currentSequence[0]);
        currentSequence = [card];
      }
    }
  }

  // Add last sequence
  if (currentSequence.length) {
    score += currentSequence[0];
    highlightedCards.add(currentSequence[0]);
    countedCards.push(currentSequence[0]);
  }

  // Create calculation string
  const calculation = `${countedCards.join(' + ')} = ${score} − ${tokens}`;

  return { score: score - tokens, highlightedCards, calculation };
}

export function GameScore({ players }: GameResultsProps) {
  const playerScores = players
    .map((player) => ({
      ...player,
      score: calculateScore(player.cards, player.tokens),
    }))
    .sort((a, b) => a.score.score - b.score.score);

  return (
    <div className="space-y-4" data-testid="final-scores">
      {playerScores.map((player, index) => (
        <div key={player.id} className="bg-white rounded-lg p-4 shadow-sm">
          {/* Top Row - Player Info */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 ${player.position === 1 ? 'bg-blue-500' : 'bg-gray-400'} rounded-full flex items-center justify-center`}>
                <span className="text-white font-bold">P{player.position}</span>
              </div>
              <span className="font-medium text-lg">{player.name}</span>
            </div>

            <div className="flex items-center gap-2">
              {index === 0 && <Trophy className="w-5 h-5 text-yellow-500" />}
              <span className="text-sm text-gray-500">#{index + 1} place</span>
            </div>
          </div>

          {/* Bottom Row - Two Columns */}
          <div className="flex gap-8">
            {/* Left Column - Cards */}
            <div className="flex-1">
              <div className="space-y-2">
                <div className="text-sm text-gray-500">
                  Counted cards: {Array.from(player.score.highlightedCards).join(", ")}
                </div>
                <div className="flex flex-wrap gap-2">
                  {player.cards.sort((a, b) => a - b).map((card) => (
                    <div 
                      key={card}
                      className={`w-10 h-14 flex items-center justify-center rounded border ${
                        player.score.highlightedCards.has(card)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <span className={`text-lg ${
                        player.score.highlightedCards.has(card)
                          ? 'text-blue-600'
                          : 'text-gray-600'
                      }`}>
                        {card}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column - Scoring */}
            <div className="w-64 space-y-3">
              <div className="bg-yellow-100 px-3 py-1 rounded-full flex items-center gap-2 w-fit">
                <Coins className="w-4 h-4 text-yellow-600" />
                <span className="font-medium text-yellow-800">{player.tokens}</span>
              </div>

              <div>
                <div className="text-sm text-gray-600">{player.score.calculation}</div>
                <div className="text-2xl text-gray-900" data-testid="player-score">
                  = {player.score.score}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}