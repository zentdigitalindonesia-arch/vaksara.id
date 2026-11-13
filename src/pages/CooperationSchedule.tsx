import { PageHeader } from "@/components/ui";
import EventCalendar, { useCalendarEvents } from "@/components/EventCalendar";
// Jadwal pelaku budaya: tanggal layanan dari penawaran dan perjanjian, ditampilkan dalam kalender yang sama dengan ruang keluarga.
export default function CooperationSchedule() {
  const events = useCalendarEvents("vendor");
  return <><PageHeader title="Jadwal layanan" description="Tanggal dan lokasi mengikuti penawaran atau perjanjian terbaru. Klik tanggal untuk melihat rincian dan membuka kerja samanya. Jadwal dari penawaran yang belum disetujui masih tentatif." /><EventCalendar events={events} /></>;
}
