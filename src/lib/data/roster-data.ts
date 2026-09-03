
import type { RosterEmployee, FullRosterData, ShiftCode, ProfileEntry } from "@/types";
import { getDaysInMonth, format as formatDateFns } from 'date-fns';

// Helper function to get the day of the year (1-366).
function getDayOfYear(date: Date): number {
  const startOfYear = new Date(date.getFullYear(), 0, 0); // Day 0 is Dec 31 of previous year
  const diff = date.getTime() - startOfYear.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}


export const rosterEmployees: RosterEmployee[] = [
  { id: 's2', name: 'Alex Morgan', email: "alex.morgan@example.com", avatarUrl: 'https://placehold.co/40x40.png?text=AM', avatarFallback: 'AM', dataAiHint: "person portrait" },
  { id: 's7', name: 'Avery Brooks', email: "avery.brooks@example.com", avatarUrl: 'https://placehold.co/40x40.png?text=AB', avatarFallback: 'AB', dataAiHint: "person portrait" },
  { id: 's3', name: 'Jordan Lee', email: "jordan.lee@example.com", avatarUrl: 'https://placehold.co/40x40.png?text=JL', avatarFallback: 'JL', dataAiHint: "person portrait" },
  { id: 's4', name: 'Taylor Reed', email: "taylor.reed@example.com", avatarUrl: 'https://placehold.co/40x40.png?text=TR', avatarFallback: 'TR', dataAiHint: "person portrait" },
  { id: 's8', name: 'Casey Patel', email: "casey.patel@example.com", avatarUrl: 'https://placehold.co/40x40.png?text=CP', avatarFallback: 'CP', dataAiHint: "person portrait" },
  { id: 's5', name: 'Morgan Diaz', email: "morgan.diaz@example.com", avatarUrl: 'https://placehold.co/40x40.png?text=MD', avatarFallback: 'MD', dataAiHint: "person portrait" },
  { id: 's1', name: 'Riley Chen', email: "riley.chen@example.com", avatarUrl: 'https://placehold.co/40x40.png?text=RC', avatarFallback: 'RC', dataAiHint: "person portrait" },
  { id: 's6', name: 'Sam Rivera', email: "sam.rivera@example.com", avatarUrl: 'https://placehold.co/40x40.png?text=SR', avatarFallback: 'SR', dataAiHint: "person portrait" },
].sort((a, b) => a.name.localeCompare(b.name));


const shiftCycle: ShiftCode[] = ['MS', 'MS', 'MS', 'NS', 'NS', 'NS', 'OFF', 'OFF', 'AS', 'AS', 'AS', 'OFF']; // 12 days

// Stagger the repeating shift pattern so teams have varied coverage.
const employeeDayOfYearBaseOffsets: Record<string, number> = {
  's1': 3, 's2': 3,
  's3': 0, 's4': 0,
  's5': 9, 's6': 9,
  's7': 6, 's8': 6,
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
    

    
