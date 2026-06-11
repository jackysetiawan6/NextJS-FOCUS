
import type { RosterEmployee, FullRosterData, ShiftCode, ProfileEntry } from "@/types";
import { getDaysInMonth, format as formatDateFns } from 'date-fns';

// Helper function to get the day of the year (1-366)
// Example: Jan 1st is 1, Dec 31st is 365 or 366
function getDayOfYear(date: Date): number {
  const startOfYear = new Date(date.getFullYear(), 0, 0); // Day 0 is Dec 31 of previous year
  const diff = date.getTime() - startOfYear.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}


export const rosterEmployees: RosterEmployee[] = [
  { id: 's2', name: 'Adhi Gunawan', email: "adhi.g@example.com", avatarUrl: 'https://placehold.co/40x40.png?text=AG', avatarFallback: 'AG', dataAiHint: "person portrait" },
  { id: 's7', name: 'Andrian Prasetyo Arifin', email: "andrian.pa@example.com", avatarUrl: 'https://placehold.co/40x40.png?text=AP', avatarFallback: 'AP', dataAiHint: "person portrait" },
  { id: 's3', name: 'David Styawan', email: "david.s@example.com", avatarUrl: 'https://placehold.co/40x40.png?text=DS', avatarFallback: 'DS', dataAiHint: "person portrait" },
  { id: 's4', name: 'Jacky Setiawan', email: "jacky.s@example.com", avatarUrl: 'https://placehold.co/40x40.png?text=JS', avatarFallback: 'JS', dataAiHint: "person portrait" },
  { id: 's8', name: 'Muhammad Fikri', email: "muhammad.f@example.com", avatarUrl: 'https://placehold.co/40x40.png?text=MF', avatarFallback: 'MF', dataAiHint: "person portrait" },
  { id: 's5', name: 'Muhammad Rajendra Wiroseno', email: "rajendra.w@example.com", avatarUrl: 'https://placehold.co/40x40.png?text=MR', avatarFallback: 'MR', dataAiHint: "person portrait" },
  { id: 's1', name: 'Nova Budi Kurniawan', email: "nova.bk@example.com", avatarUrl: 'https://placehold.co/40x40.png?text=NB', avatarFallback: 'NB', dataAiHint: "person portrait" },
  { id: 's6', name: 'Rhamdan Syahrul Mubarak', email: "rhamdan.sm@example.com", avatarUrl: 'https://placehold.co/40x40.png?text=RS', avatarFallback: 'RS', dataAiHint: "person portrait" },
].sort((a, b) => a.name.localeCompare(b.name));


const shiftCycle: ShiftCode[] = ['MS', 'MS', 'MS', 'NS', 'NS', 'NS', 'OFF', 'OFF', 'AS', 'AS', 'AS', 'OFF']; // 12 days

// Base offsets for each employee to align with June 15th anchor points.
// Calculated such that (offset + getDayOfYear(June15th) - 1) % 12 = targetIndex on June 15th.
// Target indices for June 15th:
// Nova (s1,s2) -> 2nd MS -> index 1
// David (s3,s4) -> Last AS -> index 10
// Rajendra (s5,s6) -> 2nd OFF -> index 7
// Andrian (s7,s8) -> 2nd NS -> index 4
// Assuming currentYear = 2024, June 15th is day 167. (167-1 = 166)
// Nova: (X + 166) % 12 = 1  => X = (1 - 166 % 12 + 12) % 12 = (1 - 10 + 12) % 12 = 3
// David: (X + 166) % 12 = 10 => X = (10 - 10 + 12) % 12 = 0
// Rajendra: (X + 166) % 12 = 7 => X = (7 - 10 + 12) % 12 = 9
// Andrian: (X + 166) % 12 = 4 => X = (4 - 10 + 12) % 12 = 6
const employeeDayOfYearBaseOffsets: Record<string, number> = {
  's1': 3, 's2': 3, // Nova, Adhi
  's3': 0, 's4': 0, // David, Jacky
  's5': 9, 's6': 9, // Rajendra, Rhamdan
  's7': 6, 's8': 6, // Andrian, Fikri
};

export const initialFullRosterData: FullRosterData = (() => {
  const data: FullRosterData = {};
  const currentFullYear = new Date().getFullYear();
  const yearsToGenerate = [currentFullYear -1 , currentFullYear, currentFullYear + 1]; // Generate for current year and +/- 1 year
  const months = Array.from({ length: 12 }, (_, i) => i); // 0-11

  yearsToGenerate.forEach(year => {
    data[year] = {};
    months.forEach(month => {
      data[year][month] = {};
      const daysInMonth = getDaysInMonth(new Date(year, month));
      rosterEmployees.forEach((employee) => {
        data[year][month][employee.id] = {};
        const employeeBaseOffset = employeeDayOfYearBaseOffsets[employee.id] ?? 0; // Default to 0 if ID not found

        for (let day = 1; day <= daysInMonth; day++) {
          const currentDate = new Date(year, month, day);
          const dayOfYearForCurrentDate = getDayOfYear(currentDate);
          
          const effectiveDayIndex = employeeBaseOffset + dayOfYearForCurrentDate - 1;
          const finalShiftIndex = ((effectiveDayIndex % shiftCycle.length) + shiftCycle.length) % shiftCycle.length;
          
          data[year][month][employee.id][day] = shiftCycle[finalShiftIndex];
        }
      });
    });
  });
  return data;
})();


export const getYearsForRoster = (): number[] => {
  const currentYear = new Date().getFullYear();
  return [currentYear - 2, currentYear - 1, currentYear, currentYear + 1, currentYear + 2];
};

export const getMonthsForRoster = (): { value: number, label: string }[] => {
  return Array.from({ length: 12 }, (_, i) => ({
    value: i,
    label: formatDateFns(new Date(2000, i, 1), 'MMMM'),
  }));
};

// Mock current user profile
export const currentUserProfile: ProfileEntry = {
  id: "user_facility_manager_01",
  full_name: "Demo User",
  email: "facility.manager@example.com",
  avatar_url: "https://placehold.co/100x100.png?text=DU",
};
    

    
