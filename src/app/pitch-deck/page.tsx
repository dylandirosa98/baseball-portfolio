import type { Metadata } from "next";
import { PitchDeck } from "@/components/pitch-deck/PitchDeck";

export const metadata: Metadata = {
  title: "Partner Pitch Deck | Diamond Profile",
  description: "Diamond Profile partnership and white-label program presentation.",
  robots: { index: false, follow: false },
};

export default async function PitchDeckPage({ searchParams }: { searchParams: Promise<{ slide?: string }> }) {
  const params = await searchParams;
  const requestedSlide = Number(params.slide);
  const initialSlide = Number.isInteger(requestedSlide) && requestedSlide >= 1 && requestedSlide <= 10 ? requestedSlide - 1 : 0;
  return <PitchDeck initialSlide={initialSlide} />;
}
