// src/components/game/cards/Card.tsx
interface CardProps {
  number: number;
  size?: "small" | "normal" | "large";
}

export function Card({ number, size = "normal" }: CardProps) {
  const sizeClasses = {
    small: "w-8 h-12", // Reduced from w-10 h-14
    normal: "w-10 h-14", // Reduced from w-12 h-16
    large: "w-14 h-20", // Reduced from w-16 h-24
  };

  const numberSizes = {
    small: "text-base",
    normal: "text-xl",
    large: "text-2xl",
  };

  return (
    <div
      className={`${sizeClasses[size]} bg-white rounded-lg border border-gray-200 flex items-center justify-center relative shadow-sm hover:shadow transition-shadow`}
    >
      <span className={`${numberSizes[size]} font-medium text-gray-800`}>
        {number}
      </span>
    </div>
  );
}
