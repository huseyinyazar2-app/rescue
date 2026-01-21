export type SimilarPet = {
  petId: string;
  displayName: string;
  distanceKm: number;
  updatedAt: string;
};

export function scoreSimilarPet(candidate: SimilarPet): number {
  const daysSinceUpdate =
    (Date.now() - new Date(candidate.updatedAt).getTime()) / 1000 / 86400;

  return candidate.distanceKm + daysSinceUpdate;
}

export function sortSimilarPets(candidates: SimilarPet[]): SimilarPet[] {
  return [...candidates].sort((a, b) => scoreSimilarPet(a) - scoreSimilarPet(b));
}
