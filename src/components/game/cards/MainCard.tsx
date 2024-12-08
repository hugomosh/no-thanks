// src/components/game/cards/MainCard.tsx
interface MainCardProps {
  number: number | null;
  tokens: number;
}

export function MainCard({ number, tokens }: MainCardProps) {
  if (number === null) return null;

  return (
    <div className="relative">
      <div
        className="w-32 h-48 bg-white rounded-lg border-4 border-blue-500 flex items-center justify-center shadow-sm hover:shadow transition-shadow relative"
        data-testid="current-card"
      >
        <span className="text-7xl font-medium text-gray-800">{number}</span>
        {/*  <div className="absolute bottom-3 right-3 text-lg font-medium text-gray-600 rotate-180">
          {number}
        </div> */}
      </div>
      <div
        className="absolute -top-2 -right-2 bg-yellow-400 rounded-full w-8 h-8 flex items-center justify-center font-bold shadow-sm border border-yellow-500"
        data-testid="card-tokens"
      >
        {tokens}
      </div>
    </div>
  );
}
