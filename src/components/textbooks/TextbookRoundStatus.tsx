import type { Textbook } from '@/types/database';

interface TextbookRoundStatusProps {
  textbook: Pick<Textbook, 'rounds' | 'active_round'>;
  className?: string;
}

export function getTextbookRoundLabel(
  textbook: Pick<Textbook, 'rounds' | 'active_round'>
) {
  const activeRound = textbook.active_round;
  const completedRounds = textbook.rounds.filter((round) => round.is_completed).length;

  if (activeRound.is_completed) {
    return `${activeRound.round_number}회독 완료`;
  }

  if (completedRounds > 0) {
    return `${completedRounds}회독 완료 · ${activeRound.round_number}회독 진행 중`;
  }

  return `${activeRound.round_number}회독 진행 중`;
}

export default function TextbookRoundStatus({
  textbook,
  className = '',
}: TextbookRoundStatusProps) {
  return (
    <p className={`text-xs font-bold text-[var(--primary)] ${className}`.trim()}>
      {getTextbookRoundLabel(textbook)}
    </p>
  );
}
