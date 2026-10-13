"use client";

import { useParams } from "next/navigation";
import { GameRunner } from "@/components/games/game-runner";

export default function PlayPage() {
  const { gameId } = useParams<{ gameId: string }>();
  return <GameRunner gameId={gameId} />;
}
