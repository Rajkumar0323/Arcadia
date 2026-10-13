"use client";

import { useParams } from "next/navigation";
import { GameForm } from "@/components/admin/game-form";

export default function EditGamePage() {
  const { id } = useParams<{ id: string }>();
  return <GameForm key={id} gameId={id} />;
}
