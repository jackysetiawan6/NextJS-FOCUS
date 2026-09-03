
import type { PermitToWork, PermitStatus } from "@/types";
import { addDays, subDays, startOfDay, endOfDay, parseISO, isWithinInterval } from 'date-fns';

const dateFnsSetHours = (date: Date, hours: number, minutes = 0, seconds = 0, ms = 0) => {
  const d = new Date(date);
  d.setHours(hours, minutes, seconds, ms);
  return d;
};

const today = new Date(); // Use a single reference for "today"
const todayStart = startOfDay(today);
const todayEnd = endOfDay(today);

export const initialPermits: PermitToWork[] = [
  {
    id: "52734", 
    activityName: "HVAC Unit 5 Inspection",
    description: "Scheduled quarterly inspection of HVAC Unit 5 in Data Hall A.",
    location: "Data Hall A, Row 3, Unit 5",
    assignedTo: "Alex Morgan",
    vendor: "Northwind Facilities",
    status: "Not Started",
    validFrom: dateFnsSetHours(new Date(today), 8,0,0,0).toISOString(),
    validTo: dateFnsSetHours(new Date(today), 17,0,0,0).toISOString(),
    actualStartTime: null,
    category: 'PM',
    remarks: 'Routine check. Ensure safety barriers are in place. Ready to start.',
    incidentId: null,
  },
  {
    id: "52791", 
    activityName: "Network Switch Firmware Update - Rack B",
    description: "Firmware upgrade for core switch in Rack B.",
    location: "Data Hall B, Rack B-12",
    assignedTo: "Casey Patel",
    vendor: "BluePeak Systems",
    status: "Not Started", 
    validFrom: dateFnsSetHours(new Date(today), 10,0,0,0).toISOString(),
    validTo: dateFnsSetHours(new Date(today), 14,0,0,0).toISOString(),
    category: 'PM',
    remarks: 'Rollback plan confirmed. Notify NOC before starting.',
    incidentId: "INC-2024-035", 
  },
  {
    id: "52803", 
    activityName: "Generator Fuel Refill",
    description: "Routine refilling of diesel fuel for backup generator G1.",
    location: "Generator Yard G1",
    assignedTo: "Morgan Diaz",
    vendor: "Harbor Fuel Services",
    status: "Not Started", 
    validFrom: dateFnsSetHours(addDays(new Date(today), 1), 9,0,0,0).toISOString(), // For tomorrow
    validTo: dateFnsSetHours(addDays(new Date(today), 1), 12,0,0,0).toISOString(),
    category: 'PM',
    remarks: 'Check fuel levels before and after. Spill kit available.',
    incidentId: null,
  },
  {
    id: "52815", 
    activityName: "Quarterly Server Cleaning",
    description: "Dust removal and cleaning for servers in racks C1-C5.",
    location: "Data Hall C, Racks C1-C5",
    assignedTo: "Robin Hayes",
    vendor: "DataClean Pros",
    status: "Closed", 
    validFrom: dateFnsSetHours(subDays(new Date(today), 1), 9,0,0,0).toISOString(), // Yesterday
    validTo: dateFnsSetHours(subDays(new Date(today), 1), 17,0,0,0).toISOString(),
    actualStartTime: dateFnsSetHours(subDays(new Date(today), 1), 9,15,0,0).toISOString(),
    actualEndTime: dateFnsSetHours(subDays(new Date(today), 1), 16,30,0,0).toISOString(),
    category: 'PM',
    remarks: 'All servers cleaned. No issues found. Air filters replaced.',
    incidentId: null,
  },
  { 
    id: "52816", 
    activityName: "Urgent PDU Swap - Rack A5",
    description: "Emergency replacement of faulty PDU in Rack A5.",
    location: "Data Hall A, Rack A5",
    assignedTo: "Alex Morgan",
    vendor: "Internal Team",
    status: "Closed", 
    validFrom: dateFnsSetHours(new Date(today), 1,0,0,0).toISOString(), 
    validTo: dateFnsSetHours(new Date(today), 5,0,0,0).toISOString(),
    actualStartTime: dateFnsSetHours(new Date(today), 1,5,0,0).toISOString(),
    actualEndTime: dateFnsSetHours(new Date(today), 4,45,0,0).toISOString(),
    category: 'CM',
    remarks: 'PDU replaced successfully. Power restored to affected servers.',
    incidentId: "INC-2024-038",
  },
  {
    id: "52822", 
    activityName: "Cable Pulling - New Rack D5",
    description: "Installation of new network cabling for Rack D5.",
    location: "Data Hall D, Rack D5",
    assignedTo: "Avery Brooks",
    vendor: "Cabling Co",
    status: "In Progress", 
    validFrom: dateFnsSetHours(subDays(new Date(today), 1), 13,0,0,0).toISOString(), 
    validTo: dateFnsSetHours(addDays(new Date(today), 1), 17,0,0,0).toISOString(), 
    actualStartTime: dateFnsSetHours(subDays(new Date(today), 1), 13,30,0,0).toISOString(),
    category: 'CM', 
    remarks: 'Phase 1 (pulling) complete. Phase 2 (termination) in progress.',
    incidentId: null,
  },
  {
    id: "52830", 
    activityName: "Battery Test - UPS Room A",
    description: "Annual battery load testing for UPS units in Room A.",
    location: "UPS Room A",
    assignedTo: "Taylor Reed",
    vendor: "PowerSure Ltd",
    status: "Postponed", 
    validFrom: dateFnsSetHours(new Date(today), 11,0,0,0).toISOString(), 
    validTo: dateFnsSetHours(new Date(today), 15,0,0,0).toISOString(),
    category: 'PM',
    remarks: 'Postponed due to unavailability of key personnel. Rescheduled to next week.',
    incidentId: null,
  },
  {
    id: "52835",
    activityName: "Fire Extinguisher Inspection - Floor 2",
    description: "Monthly check of all fire extinguishers on the 2nd floor.",
    location: "Floor 2 - All areas",
    assignedTo: "Safety Officer",
    vendor: "Internal Safety Team",
    status: "Completed",
    validFrom: dateFnsSetHours(new Date(today), 9, 0, 0, 0).toISOString(),
    validTo: dateFnsSetHours(new Date(today), 12, 0, 0, 0).toISOString(),
    actualStartTime: dateFnsSetHours(new Date(today), 9, 10, 0, 0).toISOString(),
    actualEndTime: dateFnsSetHours(new Date(today), 11, 30, 0, 0).toISOString(),
    category: 'PM',
    remarks: 'All extinguishers checked and tagged. One unit in corridor 2C nearing expiry, scheduled for replacement next month.',
    incidentId: null,
  },
  {
    id: "52840",
    activityName: "Access Control System Upgrade - Main Lobby",
    description: "Software upgrade for the main lobby access control panel.",
    location: "Main Lobby",
    assignedTo: "Sam Rivera",
    vendor: "SecureAccess Tech",
    status: "Cancelled",
    validFrom: dateFnsSetHours(new Date(today), 14, 0, 0, 0).toISOString(),
    validTo: dateFnsSetHours(new Date(today), 16, 0, 0, 0).toISOString(),
    category: 'CM',
    remarks: 'Cancelled due to critical system freeze. To be rescheduled.',
    incidentId: "INC-2024-040",
  },
];

export const permitStatusOptions: PermitStatus[] = ["Not Started", "In Progress", "Completed", "Closed", "Postponed", "Cancelled"];

export const permitStatusToBadgeVariant = (status: PermitStatus): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case 'Not Started': return 'outline'; 
    case 'In Progress': return 'secondary'; 
    case 'Completed': return 'default'; 
    case 'Closed': return 'outline'; 
    case 'Postponed': return 'secondary'; 
    case 'Cancelled': return 'destructive'; 
    default: return 'outline';
  }
};
