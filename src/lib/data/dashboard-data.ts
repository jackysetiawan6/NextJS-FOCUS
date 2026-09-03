
import type { MetricCardData, DailyPowerData, RecentActivityItem, PermitToWork, ElectricalUnitDailyData, DailyWaterDetails, RosterEmployee, FullRosterData, IncidentReport, IncidentStatus, InventoryItem } from "@/types";
import { Power, AlertTriangle, ListChecks, Droplets, Users, PackageOpen, Zap, Thermometer, Building as BuildingIcon, WifiOff, HardHat, ClipboardCheck } from "lucide-react";
import { subDays, format as formatDateFns, addDays, isSameDay, getDate, parseISO, startOfDay, endOfDay, isWithinInterval } from 'date-fns';

// These records define the items shown as initially on loan.
export const initialInventoryLoanItems: InventoryItem[] = [
  { 
    id: 'inv001', 
    name: 'Fluke Multimeter 87V', 
    category: "Test Equipment", 
    quantity: 1,
    status: "Loaned",
    loanedTo: 'Alex Morgan',
    loanDate: subDays(new Date(), 2).toISOString(), 
    expectedReturnDate: addDays(new Date(), 5).toISOString(), 
    dataAiHint: 'electronic equipment',
    description: "High-precision digital multimeter for electrical diagnostics.",
    location: "Tool Cabinet A1"
  },
  { 
    id: 'inv002', 
    name: 'Thermal Camera FLIR E8', 
    category: "Inspection Tools", 
    quantity: 1,
    status: "Loaned",
    loanedTo: 'Jordan Lee',
    loanDate: subDays(new Date(), 1).toISOString(), 
    expectedReturnDate: addDays(new Date(), 1).toISOString(), 
    dataAiHint: 'inspection tool',
    description: "Infrared thermal imaging camera for identifying heat signatures.",
    location: "Tool Cabinet B3"
  },
  { 
    id: 'inv003', 
    name: 'Impact Drill Set Bosch', 
    category: "Power Tools", 
    quantity: 1,
    status: "Loaned", 
    loanedTo: 'Maintenance Team', 
    loanDate: subDays(new Date(), 5).toISOString(), 
    expectedReturnDate: addDays(new Date(), -2).toISOString(), 
    dataAiHint: 'power tool',
    description: "Heavy-duty impact drill with various bit attachments.",
    location: "Maintenance Workshop"
  },
  { 
    id: 'inv004', 
    name: 'Ladder 12ft Extension', 
    category: "Safety Equipment", 
    quantity: 1,
    status: "Loaned",
    loanedTo: 'Facility Team', 
    loanDate: new Date().toISOString(), 
    expectedReturnDate: addDays(new Date(), 0).toISOString(), 
    dataAiHint: 'safety equipment',
    description: "Fiberglass extension ladder, 12ft working height.",
    location: "Storage Room C"
  },
  { 
    id: 'inv005', 
    name: 'Portable Gas Detector', 
    category: "Safety Equipment", 
    quantity: 1,
    status: "Loaned",
    loanedTo: 'Safety Officer', 
    loanDate: subDays(new Date(), 7).toISOString(), 
    expectedReturnDate: addDays(new Date(), 7).toISOString(), 
    dataAiHint: 'safety detector',
    description: "Multi-gas detector for CO, H2S, O2, LEL.",
    location: "Safety Office"
  },
  { 
    id: 'inv006', 
    name: 'Set of Pipe Wrenches', 
    category: "Hand Tools", 
    quantity: 1,
    status: "Loaned",
    loanedTo: 'Plumbing Team', 
    loanDate: subDays(new Date(), 3).toISOString(), 
    expectedReturnDate: addDays(new Date(), 3).toISOString(), 
    dataAiHint: 'hand tool',
    description: "Various sizes of heavy-duty pipe wrenches.",
    location: "Plumbing Store"
  },
];

export const generateInitialWaterData = (): DailyWaterDetails[] => {
  const data: DailyWaterDetails[] = [];
  const numberOfDays = 30;

  for (let i = numberOfDays - 1; i >= 0; i--) {
    const date = subDays(new Date(), i);
    const dayOfMonth = date.getDate();

    const muwp = 500 + (dayOfMonth % 5) * 50 + Math.floor(Math.random() * 100);
    const booster = 100 + (dayOfMonth % 3) * 20 + Math.floor(Math.random() * 50);
    const clean = 200 + (dayOfMonth % 4) * 30 + Math.floor(Math.random() * 70);
    const total = muwp + booster + clean;

    const cleanWaterConsumptionAsUseful = parseFloat(clean.toFixed(1));
    const totalConsumption = parseFloat(total.toFixed(1));

    let wue: number | undefined = undefined;
    if (cleanWaterConsumptionAsUseful > 0) {
      wue = parseFloat((totalConsumption / cleanWaterConsumptionAsUseful).toFixed(2));
    }

    data.push({
      date: formatDateFns(date, 'd'),
      muwpConsumption: parseFloat(muwp.toFixed(1)),
      boosterConsumption: parseFloat(booster.toFixed(1)),
      cleanWaterConsumption: parseFloat(clean.toFixed(1)),
      totalConsumption: totalConsumption,
      cleanWaterConsumptionAsUseful: cleanWaterConsumptionAsUseful,
      wue: wue,
    });
  }
  return data;
};

export const getDashboardMetricsData = (
  currentRosterEmployees: RosterEmployee[],
  permitsForTodaySource: PermitToWork[], 
  referenceToday: Date,
  allIncidents: IncidentReport[],
  powerConsumptionData?: DailyPowerData[],
  waterData?: DailyWaterDetails[],
  fullRoster?: FullRosterData,
  selectedYear?: number,
  selectedMonth?: number
): MetricCardData[] => {
  const todayStart = startOfDay(referenceToday);
  const todayEnd = endOfDay(referenceToday);

  const todaysPermits = permitsForTodaySource.filter(permit => {
    try {
      const validFromDate = parseISO(permit.validFrom);
      const validToDate = permit.validTo ? parseISO(permit.validTo) : todayEnd;
      const actualStartTime = permit.actualStartTime ? parseISO(permit.actualStartTime) : null;
      const actualEndTime = permit.actualEndTime ? parseISO(permit.actualEndTime) : null;

      if (isSameDay(validFromDate, referenceToday) && (permit.status === "Not Started" || permit.status === "Postponed" || permit.status === "Cancelled")) {
        return true;
      }
      if (permit.status === "In Progress" && actualStartTime && actualStartTime <= todayEnd && (!actualEndTime || actualEndTime >= todayStart)) {
        return true;
      }
      if ((permit.status === "Completed" || permit.status === "Closed") && actualEndTime && isSameDay(actualEndTime, referenceToday)) {
        return true;
      }
      if (permit.status === "In Progress" && validFromDate <= todayEnd && validToDate >= todayStart) {
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  });
  const todaysPermitsCount = todaysPermits.length;

  let staffOnDutyCount = 0;
  if (fullRoster && selectedYear !== undefined && selectedMonth !== undefined && currentRosterEmployees) {
    const year = selectedYear;
    const month = selectedMonth;
    const dayOfMonth = getDate(referenceToday);
    const monthlyRoster = fullRoster[year]?.[month];
    if (monthlyRoster) {
      currentRosterEmployees.forEach(employee => {
        const shift = monthlyRoster[employee.id]?.[dayOfMonth];
        if (shift && shift !== 'OFF') {
          staffOnDutyCount++;
        }
      });
    }
  }

  const inProgressIncidentStatuses: IncidentStatus[] = [
    "Active", "Waiting for Maintenance", "Waiting for Spare Part", "Waiting for Resolution"
  ];
  const incidentsInProgressCount = allIncidents.filter(incident =>
    inProgressIncidentStatuses.includes(incident.status)
  ).length;

  let powerValue = "N/A";
  let powerUnit = "kWh";
  let powerTrend: MetricCardData['trend'] = undefined;
  let powerTrendValue: string | undefined = undefined;

  if (powerConsumptionData && powerConsumptionData.length >= 1) {
    const latestDay = powerConsumptionData[powerConsumptionData.length - 1];
    const todayTotalZonePower = latestDay.zoneA + latestDay.zoneB;
    powerValue = todayTotalZonePower.toFixed(0);
    if (powerConsumptionData.length >= 2) {
      const previousDay = powerConsumptionData[powerConsumptionData.length - 2];
      const yesterdayTotalZonePower = previousDay.zoneA + previousDay.zoneB;
      const change = todayTotalZonePower - yesterdayTotalZonePower;
      const sign = change > 0 ? '+' : (change < 0 ? '' : '');
      if (change !== 0) {
        powerTrend = change > 0 ? 'up' : 'down';
        powerTrendValue = `${sign}${change === 0 ? 'No change' : change.toFixed(0) + ' kWh vs yesterday'}`;
      } else {
        powerTrend = 'neutral';
        powerTrendValue = 'No change vs yesterday';
      }
    } else {
      powerTrend = 'neutral';
      powerTrendValue = 'Previous day data unavailable';
    }
  }

  let waterValue = "N/A";
  let waterUnit = "m³";
  let waterTrend: MetricCardData['trend'] = undefined;
  let waterTrendValue: string | undefined = undefined;

  if (waterData && waterData.length >= 1) {
    const latestWaterDay = waterData[waterData.length - 1];
    if (typeof latestWaterDay.totalConsumption === 'number') {
      if (latestWaterDay.totalConsumption >= 1000) {
        waterValue = (latestWaterDay.totalConsumption / 1000).toFixed(1) + "k";
      } else {
        waterValue = latestWaterDay.totalConsumption.toFixed(0);
      }
      if (waterData.length >= 2) {
        const previousWaterDay = waterData[waterData.length - 2];
        if (typeof previousWaterDay.totalConsumption === 'number') {
          const waterChange = latestWaterDay.totalConsumption - previousWaterDay.totalConsumption;
          const sign = waterChange > 0 ? '+' : (waterChange < 0 ? '' : '');
          if (waterChange !== 0) {
            waterTrend = waterChange > 0 ? 'up' : 'down';
            waterTrendValue = `${sign}${Math.abs(waterChange).toFixed(0)} m³ vs yesterday`;
          } else {
            waterTrend = 'neutral';
            waterTrendValue = 'No change vs yesterday';
          }
        } else {
          waterTrend = 'neutral';
          waterTrendValue = 'Previous day data unavailable';
        }
      } else {
        waterTrend = 'neutral';
        waterTrendValue = 'Previous day data unavailable';
      }
    } else {
      waterValue = "N/A";
      waterTrend = 'neutral';
      waterTrendValue = 'Data unavailable';
    }
  }

  const activeInventoryLoanCount = initialInventoryLoanItems.length;


  return [
    {
      id: "powerConsumption",
      title: "Daily Power Usage",
      value: powerValue,
      unit: powerUnit,
      icon: Power,
      trend: powerTrend,
      trendValue: powerTrendValue,
      color: "text-accent",
    },
    {
      id: "incidentsInProgress",
      title: "Incidents In Progress",
      value: incidentsInProgressCount.toString(),
      unit: "Active", 
      icon: AlertTriangle,
      trend: "neutral", 
      trendValue: `${incidentsInProgressCount} requiring attention`, 
      color: "text-destructive",
    },
    {
      id: "totalActivities", 
      title: "Permits Today", 
      value: todaysPermitsCount.toString(),
      unit: "Permits", 
      icon: ListChecks, 
      trend: "neutral",
      trendValue: `${todaysPermitsCount} permits for today`,
      color: "text-primary",
    },
    {
      id: "waterConsumption",
      title: "Water Consumption",
      value: waterValue,
      unit: waterUnit,
      icon: Droplets,
      trend: waterTrend,
      trendValue: waterTrendValue,
      color: "text-secondary",
    },
    {
      id: "activeInventoryLoan",
      title: "Active Inventory Loan",
      value: activeInventoryLoanCount.toString(),
      unit: "Items",
      icon: PackageOpen,
      trend: "neutral",
      trendValue: `${activeInventoryLoanCount} items currently on loan`,
      color: "text-primary",
    },
    {
      id: "staffOnDuty",
      title: "Staff On Duty (Roster)",
      value: staffOnDutyCount.toString(),
      unit: "People",
      icon: Users,
      trend: "neutral",
      trendValue: "Based on today's roster",
      color: "text-primary",
    },
  ];
};

export const recentActivityItems: RecentActivityItem[] = [
  { id: 'ra1', icon: Zap, title: 'Power Fluctuation Detected', details: 'Server Rack A3 - 15 minutes ago' },
  { id: 'ra2', icon: Thermometer, title: 'Temperature Anomaly Zone B', details: 'HVAC B2 reading high - 12 minutes ago' },
  { id: 'ra3', icon: WifiOff, title: 'Network Latency Spike', details: 'Core Switch 2 - 5 minutes ago' },
  { id: 'ra4', icon: HardHat, title: 'Safety Sensor Activated', details: 'Maintenance Area 1 - 2 minutes ago' },
  { id: 'ra5', icon: ClipboardCheck, title: 'Backup Job Completed', details: 'System Backup - 1 minute ago' },
];

export const generateInitialPowerChartData = (): DailyPowerData[] => {
  const data: DailyPowerData[] = [];
  const numberOfDays = 30;
  let currentCumulativeA = 0;
  let currentCumulativeB = 0;

  for (let i = numberOfDays - 1; i >= 0; i--) {
    const date = subDays(new Date(), i);
    const dayOfMonth = date.getDate();
    const zoneA = 100 + (dayOfMonth % 10) * 15 + (i % 5) * 10 + Math.floor(Math.random() * 30);
    const zoneB = 120 + (dayOfMonth % 12) * 12 + (i % 6) * 8 + Math.floor(Math.random() * 25);

    currentCumulativeA += zoneA;
    currentCumulativeB += zoneB;

    const totalDailyZonePower = zoneA + zoneB;
    const itProportion = 0.55 + Math.random() * 0.1;
    const coolingProportion = 0.25 + Math.random() * 0.05;
    const buildingProportion = 1 - itProportion - coolingProportion;

    const itEquipmentPower = totalDailyZonePower * itProportion;
    const coolingPower = totalDailyZonePower * coolingProportion;
    const buildingInfrastructurePower = totalDailyZonePower * buildingProportion;

    data.push({
      date: formatDateFns(date, 'd'),
      zoneA,
      zoneB,
      cumulativeZoneA: currentCumulativeA,
      cumulativeZoneB: currentCumulativeB,
      itEquipmentPower: parseFloat(itEquipmentPower.toFixed(1)),
      coolingPower: parseFloat(coolingPower.toFixed(1)),
      buildingPower: parseFloat(buildingInfrastructurePower.toFixed(1)),
    });
  }
  return data;
};

export const electricalUnitDetailsData: ElectricalUnitDailyData[] = [
  { id: 'pdu-a1', name: 'PDU DL1A01', zone: 'A', currentUsage: 25, previousUsage: 22 },
  { id: 'pdu-a2', name: 'PDU DL1A02', zone: 'A', currentUsage: 35, previousUsage: 25 },
  { id: 'ups-a1', name: 'UPS DL1A01', zone: 'A', currentUsage: 15, previousUsage: 14 },
  { id: 'hvac-a1', name: 'HVAC Unit A1', zone: 'A', currentUsage: 55, previousUsage: 50 },
  { id: 'pdu-b1', name: 'PDU DL2B01', zone: 'B', currentUsage: 28, previousUsage: 27 },
  { id: 'pdu-b2', name: 'PDU DL2B02', zone: 'B', currentUsage: 22, previousUsage: 21 },
  { id: 'ups-b1', name: 'UPS DL2B01', zone: 'B', currentUsage: 40, previousUsage: 30 },
  { id: 'hvac-b1', name: 'HVAC Unit B1', zone: 'B', currentUsage: 60, previousUsage: 62 },
];

export const getAbnormalUnits = (units: ElectricalUnitDailyData[], thresholdPercentage: number = 20): ElectricalUnitDailyData[] => {
  return units.filter(unit => {
    if (unit.previousUsage === 0 && unit.currentUsage > 0) return true;
    if (unit.previousUsage === 0 && unit.currentUsage === 0) return false;
    if (unit.previousUsage === 0) return false;
    const percentageIncrease = ((unit.currentUsage - unit.previousUsage) / unit.previousUsage) * 100;
    return percentageIncrease > thresholdPercentage;
  });
};
