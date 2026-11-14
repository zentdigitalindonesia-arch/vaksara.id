// Tahapan prosesi pernikahan adat yang dapat dilayani pelaku budaya. Istilah Bugis dan Makassar dibedakan,
// tidak diseragamkan; praktik berbeda antarkeluarga dan daerah. DRAF: perlu ditinjau narasumber adat sebelum dianggap baku.
export type Ceremony = { id: string; label: string; terms: string };

export const ceremonies: Ceremony[] = [
  { id: "lamaran", label: "Lamaran", terms: "madduta (Bugis) · assuro (Makassar)" },
  { id: "kesepakatan", label: "Penetapan kesepakatan", terms: "mappettu ada (Bugis) · appa'nassa (Makassar)" },
  { id: "malam-pacar", label: "Malam pacar", terms: "mappacci (Bugis) · akkorontigi (Makassar)" },
  { id: "akad", label: "Akad nikah", terms: "" },
  { id: "resepsi", label: "Resepsi", terms: "" },
  { id: "kunjungan-balik", label: "Kunjungan balik pengantin", terms: "mapparola (Bugis) · nilekka (Makassar)" },
  { id: "busana-rias", label: "Busana & rias adat", terms: "baju bodo, rias pengantin" },
  { id: "musik-tari", label: "Musik & tari pengiring", terms: "mis. pakkacaping, gandrang" },
];

export const ceremonyLabel = (id: string): string => ceremonies.find(c => c.id === id)?.label ?? id;
