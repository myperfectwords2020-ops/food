/** All Nigerian states + FCT — stable codes for delivery pricing. */
export const NIGERIA_STATES = [
  { code: "AB", name: "Abia" },
  { code: "AD", name: "Adamawa" },
  { code: "AK", name: "Akwa Ibom" },
  { code: "AN", name: "Anambra" },
  { code: "BA", name: "Bauchi" },
  { code: "BY", name: "Bayelsa" },
  { code: "BE", name: "Benue" },
  { code: "BO", name: "Borno" },
  { code: "CR", name: "Cross River" },
  { code: "DE", name: "Delta" },
  { code: "EB", name: "Ebonyi" },
  { code: "ED", name: "Edo" },
  { code: "EK", name: "Ekiti" },
  { code: "EN", name: "Enugu" },
  { code: "FC", name: "Federal Capital Territory" },
  { code: "GO", name: "Gombe" },
  { code: "IM", name: "Imo" },
  { code: "JI", name: "Jigawa" },
  { code: "KD", name: "Kaduna" },
  { code: "KN", name: "Kano" },
  { code: "KT", name: "Katsina" },
  { code: "KE", name: "Kebbi" },
  { code: "KO", name: "Kogi" },
  { code: "KW", name: "Kwara" },
  { code: "LA", name: "Lagos" },
  { code: "NA", name: "Nasarawa" },
  { code: "NI", name: "Niger" },
  { code: "OG", name: "Ogun" },
  { code: "ON", name: "Ondo" },
  { code: "OS", name: "Osun" },
  { code: "OY", name: "Oyo" },
  { code: "PL", name: "Plateau" },
  { code: "RI", name: "Rivers" },
  { code: "SO", name: "Sokoto" },
  { code: "TA", name: "Taraba" },
  { code: "YO", name: "Yobe" },
  { code: "ZA", name: "Zamfara" },
] as const;

export type NigeriaStateCode = (typeof NIGERIA_STATES)[number]["code"];

export const NIGERIA_STATE_CODES = NIGERIA_STATES.map((s) => s.code) as [
  NigeriaStateCode,
  ...NigeriaStateCode[],
];

const byCode = new Map(NIGERIA_STATES.map((s) => [s.code, s]));
const byName = new Map(NIGERIA_STATES.map((s) => [s.name.toLowerCase(), s]));

/** Resolves checkout/admin input to a state code (supports legacy labels). */
export function normalizeNigeriaStateCode(input: string): NigeriaStateCode | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const upper = trimmed.toUpperCase();
  if (byCode.has(upper as NigeriaStateCode)) return upper as NigeriaStateCode;
  const lower = trimmed.toLowerCase();
  if (lower === "abuja fct" || lower === "fct" || lower === "abuja") return "FC";
  const byExactName = byName.get(lower);
  if (byExactName) return byExactName.code;
  return null;
}

export function nigeriaStateName(code: NigeriaStateCode): string {
  return byCode.get(code)?.name ?? code;
}
