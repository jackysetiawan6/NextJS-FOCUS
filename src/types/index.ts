
import type { LucideIcon } from 'lucide-react';

export interface MetricCardData {
  id: string;
  title: string;
  value: string;
  unit?: string;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color?: string; // Optional color for the card or icon
}

export interface ChecklistItem {
  id: string; // Unique within its section for a given shift
  label: string;
  checked: boolean;
}

export interface ChecklistSection {
  title: string; // e.g., "Site Conditions"
  items: ChecklistItem[];
}

export type ShiftType = 'Morning' | 'Afternoon' | 'Night';

export interface ShiftChecklist {
  shift: ShiftType;
  sections: ChecklistSection[];
}


export interface Issue {
  id: string;
  description: string;
  status: 'Open' | 'In Progress' | 'Resolved' | 'Pending Review';
  urgency: 'Critical' | 'High' | 'Medium' | 'Low';
  reportedAt: string;
  assignedTo?: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  notes: string;
  attachments?: string;
  author: string;
}

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  label?: string;
  disabled?: boolean;
  external?: boolean;
  children?: NavItem[]; // For sub-menu items
  group?: string; // For visual grouping of sub-items
}

export interface ProfileEntry {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url?: string | null;
}

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  avatarUrl: string;
  avatarFallback: string;
  dataAiHint?: string;
}

export interface DailyPowerData {
  date: string; // Day number, e.g., "1", "2", ... "30"
  zoneA: number;
  zoneB: number;
  cumulativeZoneA: number;
  cumulativeZoneB: number;
  itEquipmentPower: number;
  coolingPower: number;
  buildingPower: number;
}

export interface DailyWaterDetails {
  date: string; // Day number, e.g., "1", "2", ... "30"
  muwpConsumption: number;
  boosterConsumption: number;
  cleanWaterConsumption: number;
  totalConsumption: number;
  cleanWaterConsumptionAsUseful?: number; // Useful output for WUE
  wue?: number; // Water Usage Effectiveness
}

export interface RecentActivityItem {
  id: string;
  icon: LucideIcon;
  title: string;
  details: string;
}

export type MaintenanceActivityStatus = 'Pending' | 'Ongoing' | 'Completed' | 'Cancelled' | 'Postponed';

export interface MaintenanceActivity {
  id: string;
  date: string; // Format: "yyyy-MM-dd"
  activityName: string;
  vendorName: string;
  status: MaintenanceActivityStatus;
}

export interface ElectricalUnitDailyData {
  id: string;
  name: string; // e.g., "PDU DL1A02"
  zone: 'A' | 'B';
  currentUsage: number; // in kWh
  previousUsage: number; // in kWh
}

export type IncidentStatus =
  | "Logged"
  | "Active"
  | "Waiting for Maintenance"
  | "Waiting for Spare Part"
  | "Waiting for Resolution"
  | "Resolved"
  | "Closed";

export interface ProgressUpdate {
  text: string;
  timestamp: string; // ISO String
}

export interface IncidentReport {
  id: string; 
  title: string;
  description: string;
  reportedAt: string; // ISO String
  status: IncidentStatus;
  assignedTo?: string; // Employee Name
  progressUpdates: ProgressUpdate[];
  urgency: 'Critical' | 'High' | 'Medium' | 'Low';
  lastUpdatedAt?: string; // ISO String for when the last progress update or status change occurred
}

export type PermitStatus = "Not Started" | "In Progress" | "Completed" | "Closed" | "Postponed" | "Cancelled";

export interface PermitToWork {
  id: string; // 5-digit numeric string
  activityName: string;
  description: string;
  location: string;
  assignedTo: string; // Employee Name (PIC)
  vendor?: string;
  status: PermitStatus;
  validFrom: string; // ISO string
  validTo: string; // ISO string
  actualStartTime?: string | null; // ISO string
  actualEndTime?: string | null; // ISO string
  category?: 'PM' | 'CM'; // Preventive Maintenance or Corrective Maintenance
  remarks?: string;
  incidentId?: string | null; // Link to an incident if related
}

// New types for Alarm Logs
export type AlarmClass = "Critical" | "Major" | "Minor" | "Warning" | "Information";
export type AlarmSystemStatus = "Active" | "Acknowledged" | "Resolved" | "Closed";

export interface AlarmEntry {
  id: string;
  occurredTimestamp: string; // ISO string or formatted date string
  acknowledgedTimestamp?: string | null;
  resolvedTimestamp?: string | null;
  alarmDescription: string;
  actionTaken: string;
  remarks?: string;
  responsible: string; // Person or team
  floorLevel: string;
  incidentId?: string | null; // Link to an incident if one is created
  alarmClass: AlarmClass;
  status: AlarmSystemStatus; // Overall status of the alarm
}

// Roster Management Types
export type ShiftCode = 'MS' | 'AS' | 'NS' | 'D' | 'OFF' | ''; // Added empty string for unassigned

export interface RosterEmployee {
  id: string;
  name: string;
  email?: string; 
  avatarUrl?: string;
  avatarFallback?: string;
  dataAiHint?: string;
}

export interface RosterEntry {
  employeeId: string;
  date: string; // YYYY-MM-DD
  shiftCode: ShiftCode;
}

export interface MonthlyRosterData {
  [employeeId: string]: {
    [day: number]: ShiftCode;
  };
}
export interface YearlyRosterData {
  [month: number]: MonthlyRosterData; // month is 0-11
}
export interface FullRosterData {
  [year: number]: YearlyRosterData;
}

// Fire System Isolation Log
export type FireSystemIsolationStatus = "Active" | "Removed" | "Extended" | "Pending Removal";

export interface FireSystemIsolationEntry {
  id: string;
  unitOrSystem: string;
  areaImpacted: string;
  isolatedBy: string;
  reasonForIsolation: string;
  lotoTagNumber?: string | null;
  isolationStartTime: string; // ISO string
  expectedRemovalTime: string; // ISO string
  actualRemovalTime?: string | null; // ISO string
  status: FireSystemIsolationStatus;
  notes?: string;
}

// Manual System Operations Log
export type ManualOperationStatus = 'Active' | 'Completed' | 'Reverted';
export interface ManualOperationEntry {
  id: string;
  systemOperated: string;
  operationPerformed: string;
  reasonForManualOp: string;
  operator: string;
  operationTimestamp: string; // ISO string
  status: ManualOperationStatus;
  notes?: string;
}

// LOTO (Lockout/Tagout) Tag Monitoring Log
export type LotoTagStatus = 'Active' | 'Removed';
export interface LotoTagEntry {
  id: string;
  equipmentIsolated: string;
  tagNumber: string;
  appliedBy: string;
  appliedTimestamp: string; // ISO string
  expectedRemovalTimestamp?: string | null; // ISO string
  actualRemovalTimestamp?: string | null; // ISO string
  reasonForLoto: string;
  status: LotoTagStatus;
  notes?: string;
}

// Personnel Activity Log for Activity of The Day page
export type PersonnelActivityStatus = 'Completed' | 'In Progress' | 'Pending' | 'Blocked';

export interface PersonnelActivityItem {
  text: string;
  status: PersonnelActivityStatus;
}
export interface PersonnelShiftActivity {
  personnelName: string;
  activities: PersonnelActivityItem[];
}
export interface DailyPersonnelActivities {
  shift: ShiftType;
  activitiesByPersonnel: PersonnelShiftActivity[];
}

// Inventory Item Type
export type InventoryItemStatus = "Available" | "Loaned" | "Under Maintenance" | "Out of Stock";

export interface InventoryItem {
  id: string;
  name: string;
  category?: string;
  quantity?: number;
  status?: InventoryItemStatus;
  loanedTo?: string | null;
  loanDate?: string | null; // ISO String
  expectedReturnDate?: string | null; // ISO String
  dataAiHint?: string;
  description?: string;
  location?: string; // e.g., "Storage Room A, Shelf B3"
}

// Electrical Unit Log Sheet Types
export interface ElectricalUnit {
  id: string;
  name: string;
  type: string; // e.g., "PDU", "CRAC", "GEN"
  zone: 'A' | 'B';
  nominalReading?: number; 
  unit?: string; 
}

export interface ElectricalUnitLogEntry {
  id: string;
  unitId: string;
  unitName: string;
  zone: 'A' | 'B';
  shift: ShiftType;
  timestamp: string; // ISO String
  readingValue: number;
  readingUnit: string;
  notes?: string;
  operator?: string;
}
