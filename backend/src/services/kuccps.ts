import fs from "fs";
import path from "path";

export type KuccpsProgramme = {
  programme: string;
  cluster: string;
  notes: string;
  sample_cutoff?: string;
};

const FILE = path.resolve(__dirname, "../../data/kuccps_programmes.json");

export function loadKuccpsProgrammes(): KuccpsProgramme[] {
  try {
    const raw = fs.readFileSync(FILE, "utf8");
    return JSON.parse(raw) as KuccpsProgramme[];
  } catch {
    return [];
  }
}

export function findProgrammeNotes(programmeName: string): string {
  const all = loadKuccpsProgrammes();
  const hit = all.find(p => p.programme.toLowerCase() === programmeName.toLowerCase());
  return hit
    ? (hit.notes + (hit.sample_cutoff ? ` (Sample cutoff: ${hit.sample_cutoff})` : ""))
    : "KUCCPS info: not found in local dataset.";
}
