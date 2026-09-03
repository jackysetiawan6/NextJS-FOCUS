
"use client";

import type { MetricCardData, RecentActivityItem, DailyPowerData, ElectricalUnitDailyData, DailyWaterDetails, RosterEmployee, FullRosterData, PermitToWork, IncidentStatus as IncidentStatusType, PermitStatus, InventoryItem, IncidentReport } from "@/types";
import { 
  rosterEmployees as initialRosterEmployees, 
  initialFullRosterData,
  initialIncidents,
  initialPermits,
  initialInventoryLoanItems // Import initialInventoryLoanItems
} from "@/lib/data"; 
import { 
  getDashboardMetricsData, 
  recentActivityItems, 
  generateInitialPowerChartData, 
  electricalUnitDetailsData, 
  getAbnormalUnits, 
  generateInitialWaterData,
  permitStatusToBadgeVariant
} from "@/lib/data"; 
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { ArrowUp, ArrowDown, Power, Zap, Thermometer, Building as BuildingIcon, Droplets, Activity as ActivityIcon, AlertTriangle, ListChecks, Users, PackageOpen, MessageSquare, Clock, Tag } from "lucide-react";
import { PowerConsumptionChartJs } from "@/components/dashboard/power-consumption-chartjs";
import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription as DialogDesc } from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { format as formatDateFns, isSameDay, getDate, parseISO, startOfDay, endOfDay } from 'date-fns';
import type { DayContentProps } from 'react-day-picker';
import { Separator } from "@/components/ui/separator";
import { ClientFormattedTimestamp } from "@/components/shared/client-formatted-timestamp";
import { cn } from "@/lib/utils";

const MetricCard = ({ metric }: { metric: MetricCardData }) => {
  const TrendIconComponent = metric.trend === 'up' ? ArrowUp : metric.trend === 'down' ? ArrowDown : null;
  let trendColorClass = 'text-muted-foreground';
  if (metric.trend === 'up') {
    trendColorClass = (metric.id === 'powerConsumption' || metric.id === 'waterConsumption') ? 'text-destructive' : 'text-secondary';
  } else if (metric.trend === 'down') {
    trendColorClass = (metric.id === 'powerConsumption' || metric.id === 'waterConsumption') ? 'text-secondary' : 'text-destructive';
  }

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
        <metric.icon className={`h-5 w-5 ${metric.color || 'text-muted-foreground'}`} />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">
          {metric.value}
          {metric.unit && <span className="text-xl font-normal text-muted-foreground ml-1">{metric.unit}</span>}
        </div>
        {metric.trend && metric.trendValue && TrendIconComponent && (
          <p className={`text-xs ${trendColorClass} flex items-center mt-1`}>
            <TrendIconComponent className="h-3 w-3 mr-1" />
            {metric.trendValue}
          </p>
        )}
         {!metric.trendValue && metric.trend !== 'neutral' && <p className="text-xs text-muted-foreground mt-1 invisible">No trend data</p>}
         {metric.trend === 'neutral' && metric.trendValue && (
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              {metric.trendValue}
            </p>
         )}
         {metric.trend === 'neutral' && !metric.trendValue && <p className="text-xs text-muted-foreground mt-1 invisible">No trend data</p>}
      </CardContent>
    </Card>
  );
};

const powerDetailTableRows: Array<{ label: string; dataKey: 'zoneA' | 'zoneB' | 'cumulativeZoneA' | 'cumulativeZoneB' | 'itEquipmentPower' | 'coolingPower' | 'buildingPower' }> = [
  { label: "Zone A Daily (kWh)", dataKey: "zoneA" },
  { label: "Zone B Daily (kWh)", dataKey: "zoneB" },
  { label: "Zone A Cumulative (kWh)", dataKey: "cumulativeZoneA" },
  { label: "Zone B Cumulative (kWh)", dataKey: "cumulativeZoneB" },
];

const incidentStatusToBadgeVariant = (status: IncidentStatusType): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case "Logged": return "outline";
    case "Active": return "secondary"; 
    case "Waiting for Maintenance":
    case "Waiting for Spare Part":
    case "Waiting for Resolution":
      return "default"; 
    case "Resolved": return "default"; 
    case "Closed": return "outline"; 
    default: return "outline";
  }
};

const IN_PROGRESS_INCIDENT_STATUSES: IncidentStatusType[] = [
  "Active", "Waiting for Maintenance", "Waiting for Spare Part", "Waiting for Resolution"
];

const incidentUrgencyToBadgeVariant = (urgency: IncidentReport['urgency']): "default" | "secondary" | "destructive" | "outline" => {
  switch (urgency) {
    case 'Critical': return 'destructive';
    case 'High': return 'secondary';
    case 'Medium': return 'default';
    case 'Low': return 'outline';
    default: return 'outline';
  }
};

export default function DashboardPage() {
  const [displayedMonth, setDisplayedMonth] = useState<Date>(() => new Date(0));
  const [powerData, setPowerData] = useState<DailyPowerData[]>([]);
  const [waterDetailsData, setWaterDetailsData] = useState<DailyWaterDetails[]>([]);
  const [rosterEmployeesData, setRosterEmployeesData] = useState<RosterEmployee[]>(initialRosterEmployees);
  const [fullRosterSchedule, setFullRosterSchedule] = useState<FullRosterData>(initialFullRosterData);
  const [todayForData, setTodayForData] = useState(() => new Date(0));

  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | undefined>(undefined);
  const [isCalendarActivityDialogOpen, setIsCalendarActivityDialogOpen] = useState(false);
  const [isPermitsTodayDialogOpen, setIsPermitsTodayDialogOpen] = useState(false);
  const [isPowerDetailDialogOpen, setIsPowerDetailDialogOpen] = useState(false);
  const [isWaterDetailDialogOpen, setIsWaterDetailDialogOpen] = useState(false);
  const [isStaffOnDutyDialogOpen, setIsStaffOnDutyDialogOpen] = useState(false);
  const [isIncidentsInProgressDialogOpen, setIsIncidentsInProgressDialogOpen] = useState(false); 
  const [isInventoryLoanDialogOpen, setIsInventoryLoanDialogOpen] = useState(false); // New state for inventory dialog

  const [abnormalPowerUnits, setAbnormalPowerUnits] = useState<ElectricalUnitDailyData[]>([]);

  const inProgressIncidents = useMemo(() => {
    return initialIncidents.filter(incident => IN_PROGRESS_INCIDENT_STATUSES.includes(incident.status));
  }, []);

  useEffect(() => {
    const initialPData = generateInitialPowerChartData();
    setPowerData(initialPData);
    const initialWData = generateInitialWaterData();
    setWaterDetailsData(initialWData);
    setAbnormalPowerUnits(getAbnormalUnits(electricalUnitDetailsData));
    
    // Set actual dates on client mount to fix hydration mismatches
    const now = new Date();
    setTodayForData(now);
    setDisplayedMonth(now);
  }, []);

  const metrics = useMemo(() => {
    const currentYear = todayForData.getFullYear();
    const currentMonth = todayForData.getMonth();
    return getDashboardMetricsData(rosterEmployeesData, initialPermits, todayForData, initialIncidents, powerData, waterDetailsData, fullRosterSchedule, currentYear, currentMonth);
  }, [rosterEmployeesData, todayForData, powerData, waterDetailsData, fullRosterSchedule]);

  const staffOnDutyToday = useMemo(() => {
    const year = todayForData.getFullYear();
    const month = todayForData.getMonth();
    const dayOfMonth = getDate(todayForData);
    const monthlyRoster = fullRosterSchedule[year]?.[month];
    if (!monthlyRoster) return [];
    return rosterEmployeesData.filter(employee => {
      const shift = monthlyRoster[employee.id]?.[dayOfMonth];
      return shift && shift !== 'OFF';
    });
  }, [todayForData, fullRosterSchedule, rosterEmployeesData]);

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedCalendarDate(date);
      setIsCalendarActivityDialogOpen(true);
    }
  };

  const handleCalendarDialogActivityVisibilityChange = (open: boolean) => {
    setIsCalendarActivityDialogOpen(open);
    if (!open) {
      setSelectedCalendarDate(undefined);
    }
  };

  const getPermitsForDate = (date: Date): PermitToWork[] => {
    const targetDayStart = startOfDay(date);
    const targetDayEnd = endOfDay(date);
    return initialPermits.filter(permit => {
      try {
        const validFromDate = parseISO(permit.validFrom);
        const validToDate = permit.validTo ? parseISO(permit.validTo) : targetDayEnd;
        const actualStartTime = permit.actualStartTime ? parseISO(permit.actualStartTime) : null;
        const actualEndTime = permit.actualEndTime ? parseISO(permit.actualEndTime) : null;
        if (isSameDay(validFromDate, date) && (permit.status === "Not Started" || permit.status === "Postponed" || permit.status === "Cancelled")) return true;
        if (permit.status === "In Progress" && actualStartTime && actualStartTime <= targetDayEnd && (!actualEndTime || actualEndTime >= targetDayStart)) return true;
        if ((permit.status === "Completed" || permit.status === "Closed") && actualEndTime && isSameDay(actualEndTime, date)) return true;
        if (permit.status === "In Progress" && validFromDate <= targetDayEnd && validToDate >= targetDayStart) return true;
        return false;
      } catch (e) { return false; }
    });
  };
  
  const CustomDayContent = (dayProps: DayContentProps) => {
    const permitsForDay = getPermitsForDate(dayProps.date);
    const count = permitsForDay.length;
    return (
      <>
        {formatDateFns(dayProps.date, 'd')}
        {count > 0 && (
          <span
            className="absolute top-1 right-1 z-10 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground shadow-sm"
            aria-label={`${count} permits`}
          >
            {count}
          </span>
        )}
      </>
    );
  };

  const permitsForTodaysDialog = useMemo(() => getPermitsForDate(todayForData), [todayForData]);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {metrics.map((metric) => {
          if (metric.id === "incidentsInProgress") {
            return (
              <Dialog key={metric.id} open={isIncidentsInProgressDialogOpen} onOpenChange={setIsIncidentsInProgressDialogOpen}>
                <DialogTrigger asChild><div className="cursor-pointer"><MetricCard metric={metric} /></div></DialogTrigger>
                <DialogContent className="sm:max-w-2xl w-full h-auto max-h-[90vh]">
                  <DialogHeader>
                    <DialogTitle>Incidents In Progress ({inProgressIncidents.length})</DialogTitle>
                    <DialogDesc>Overview of incidents currently requiring attention.</DialogDesc>
                  </DialogHeader>
                  <ScrollArea className="max-h-[70vh] mt-4">
                    <div className="space-y-3 pr-3">
                      {inProgressIncidents.length > 0 ? (
                        inProgressIncidents.map(incident => (
                          <Card key={incident.id} className="p-3 bg-card-foreground/5 hover:bg-accent/50 transition-colors">
                            <div className="flex justify-between items-start mb-1">
                              <p className="font-semibold text-sm flex-1 pr-2">[INC-{incident.id}] - {incident.title}</p>
                              <div className="flex gap-1.5 flex-shrink-0">
                                <Badge variant={incidentUrgencyToBadgeVariant(incident.urgency)} className="text-xs">{incident.urgency}</Badge>
                                <Badge variant={incidentStatusToBadgeVariant(incident.status)} className="text-xs">{incident.status}</Badge>
                              </div>
                            </div>
                            {incident.progressUpdates.length > 0 && (
                              <div className="flex items-start text-xs text-muted-foreground mt-1.5">
                                <MessageSquare className="h-3.5 w-3.5 mr-1.5 mt-0.5 flex-shrink-0" />
                                <p className="truncate" title={incident.progressUpdates[0].text}>
                                  Latest: {incident.progressUpdates[0].text}
                                </p>
                              </div>
                            )}
                          </Card>
                        ))
                      ) : <p className="text-muted-foreground text-center py-4">No incidents currently in progress.</p>}
                    </div>
                  </ScrollArea>
                </DialogContent>
              </Dialog>
            );
          }
          if (metric.id === "staffOnDuty") {
            return (
              <Dialog key={metric.id} open={isStaffOnDutyDialogOpen} onOpenChange={setIsStaffOnDutyDialogOpen}>
                <DialogTrigger asChild><div className="cursor-pointer"><MetricCard metric={metric} /></div></DialogTrigger>
                <DialogContent className="sm:max-w-2xl w-full h-auto max-h-[90vh]">
                  <DialogHeader>
                    <DialogTitle>Staff On Duty Today (from Roster)</DialogTitle>
                    <DialogDesc>List of personnel scheduled to work today, {formatDateFns(todayForData, 'dd MMMM yyyy')} ({staffOnDutyToday.length} members).</DialogDesc>
                  </DialogHeader>
                  <ScrollArea className="max-h-[70vh] mt-4">
                    <div className="grid gap-3 py-4 pr-3">
                      {staffOnDutyToday.length > 0 ? staffOnDutyToday.map((staff) => (
                        <div key={staff.id} className="flex items-center space-x-3 rounded-md border p-3 hover:bg-accent/50 transition-colors">
                          <Avatar className="h-9 w-9"><AvatarImage src={staff.avatarUrl} alt={staff.name} data-ai-hint={staff.dataAiHint || "person portrait"} /><AvatarFallback>{staff.avatarFallback}</AvatarFallback></Avatar>
                          <div><p className="text-sm font-medium leading-none">{staff.name}</p></div>
                        </div>
                      )) : <p className="text-muted-foreground text-center py-4">No staff on duty according to today's roster.</p>}
                    </div>
                  </ScrollArea>
                </DialogContent>
              </Dialog>
            );
          }
          if (metric.id === "totalActivities") {
            return (
              <Dialog key={metric.id} open={isPermitsTodayDialogOpen} onOpenChange={setIsPermitsTodayDialogOpen}>
                <DialogTrigger asChild><div className="cursor-pointer"><MetricCard metric={metric} /></div></DialogTrigger>
                <DialogContent className="sm:max-w-2xl w-full h-auto max-h-[90vh]">
                  <DialogHeader>
                    <DialogTitle>Permits for Today ({permitsForTodaysDialog.length})</DialogTitle>
                    <DialogDesc>Overview of permits scheduled or active for today, {formatDateFns(todayForData, 'dd MMMM yyyy')}.</DialogDesc>
                  </DialogHeader>
                  <ScrollArea className="max-h-[70vh] mt-4">
                    <div className="space-y-3 pr-3">
                      {permitsForTodaysDialog.length > 0 ? (
                        permitsForTodaysDialog.map(permit => (
                          <Card key={permit.id} className="p-3 bg-card-foreground/5 hover:bg-accent/50 transition-colors">
                            <div className="flex justify-between items-start mb-1">
                              <p className="font-semibold text-sm flex-1 pr-2">[PTW-{permit.id}] {permit.activityName}</p>
                              <Badge variant={permitStatusToBadgeVariant(permit.status)} className="text-xs">{permit.status}</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">PIC: {permit.assignedTo}</p>
                            {permit.vendor && <p className="text-xs text-muted-foreground">Vendor: {permit.vendor}</p>}
                          </Card>
                        ))
                      ) : <p className="text-muted-foreground text-center py-4">No permits relevant for today.</p>}
                    </div>
                  </ScrollArea>
                </DialogContent>
              </Dialog>
            );
          }
          if (metric.id === "activeInventoryLoan") { // Handle Inventory Loan Metric Card
            return (
              <Dialog key={metric.id} open={isInventoryLoanDialogOpen} onOpenChange={setIsInventoryLoanDialogOpen}>
                <DialogTrigger asChild><div className="cursor-pointer"><MetricCard metric={metric} /></div></DialogTrigger>
                <DialogContent className="sm:max-w-3xl w-full h-auto max-h-[90vh]">
                  <DialogHeader>
                    <DialogTitle>Active Inventory Loans ({initialInventoryLoanItems.length})</DialogTitle>
                    <DialogDesc>List of currently loaned out inventory items.</DialogDesc>
                  </DialogHeader>
                  <ScrollArea className="max-h-[70vh] mt-4">
                    <div className="pr-3">
                    {initialInventoryLoanItems.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Item Name</TableHead>
                            <TableHead>Loaned To</TableHead>
                            <TableHead>Loan Date</TableHead>
                            <TableHead>Expected Return</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {initialInventoryLoanItems.map(item => (
                            <TableRow key={item.id} className="hover:bg-accent/50 transition-colors">
                              <TableCell className="font-medium">{item.name}</TableCell>
                              <TableCell>{item.loanedTo}</TableCell>
                              <TableCell><ClientFormattedTimestamp isoString={item.loanDate} type="short" /></TableCell>
                              <TableCell><ClientFormattedTimestamp isoString={item.expectedReturnDate} type="short" /></TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <p className="text-muted-foreground text-center py-6">No items currently on loan.</p>
                    )}
                    </div>
                  </ScrollArea>
                </DialogContent>
              </Dialog>
            );
          }
          if (metric.id === "powerConsumption") {
            const latestDay = powerData.length > 0 ? powerData[powerData.length - 1] : null;
            const previousDay = powerData.length > 1 ? powerData[powerData.length - 2] : null;
            let pue = "N/A", totalFacilityPowerForPUE = 0, itEquipmentPowerForPUE = 0;
            if (latestDay && typeof latestDay.itEquipmentPower === 'number' && typeof latestDay.coolingPower === 'number' && typeof latestDay.buildingPower === 'number') {
              itEquipmentPowerForPUE = latestDay.itEquipmentPower;
              totalFacilityPowerForPUE = latestDay.itEquipmentPower + latestDay.coolingPower + latestDay.buildingPower;
              if (latestDay.itEquipmentPower > 0) pue = (totalFacilityPowerForPUE / latestDay.itEquipmentPower).toFixed(2);
            }
            const componentPowerDetails = latestDay ? [
                { name: "IT Equipment", icon: Zap, current: latestDay.itEquipmentPower, previous: previousDay?.itEquipmentPower },
                { name: "Cooling Systems", icon: Thermometer, current: latestDay.coolingPower, previous: previousDay?.coolingPower },
                { name: "Building Infrastructure", icon: BuildingIcon, current: latestDay.buildingPower, previous: previousDay?.buildingPower },
            ] : [];
            return (
              <Dialog key={metric.id} open={isPowerDetailDialogOpen} onOpenChange={setIsPowerDetailDialogOpen}>
                <DialogTrigger asChild><div className="cursor-pointer"><MetricCard metric={metric} /></div></DialogTrigger>
                <DialogContent className="sm:max-w-2xl w-full h-auto max-h-[90vh]">
                  <DialogHeader><DialogTitle>Detailed Power Usage & Abnormal Units</DialogTitle><DialogDesc>PUE, component breakdown, and units with significant usage increases.</DialogDesc></DialogHeader>
                  <ScrollArea className="max-h-[70vh] mt-4">
                    <div className="mt-4 space-y-6 pr-3">
                      <div><h4 className="font-semibold text-lg mb-2">Power Usage Effectiveness (PUE) - Today</h4>{latestDay ? (<div className="space-y-1"><p className="text-2xl font-bold text-primary">{pue} <span className="text-sm font-normal text-muted-foreground">PUE</span></p><p className="text-sm">Total Facility Power: <span className="font-medium">{typeof totalFacilityPowerForPUE === 'number' ? totalFacilityPowerForPUE.toFixed(0) : 'N/A'} kWh</span></p><p className="text-sm">IT Equipment Power: <span className="font-medium">{typeof itEquipmentPowerForPUE === 'number' ? itEquipmentPowerForPUE.toFixed(0) : 'N/A'} kWh</span></p></div>) : (<p className="text-muted-foreground">PUE data is loading or unavailable.</p>)}</div>
                      <Separator />
                      <div className="space-y-3"><h4 className="font-semibold text-lg mb-3">Component Power Usage - Today</h4>{latestDay ? (componentPowerDetails.map(comp => { const change = (typeof comp.current === 'number' && typeof comp.previous === 'number') ? comp.current - comp.previous : null; const TrendIcon = change === null ? null : (change > 0 ? ArrowUp : (change < 0 ? ArrowDown : null)); const trendColor = change === null ? 'text-muted-foreground' : (change > 0 ? 'text-destructive' : (change < 0 ? 'text-secondary' : 'text-muted-foreground')); const sign = change === null ? '' : (change > 0 ? '+' : (change < 0 ? '' : '')); const changeText = change === null || (typeof comp.current !== 'number' && typeof comp.previous !== 'number') ? 'N/A' : (change === 0 ? 'No change' : `${sign}${Math.abs(change).toFixed(0)} kWh`); return (<div key={comp.name} className="p-3 border rounded-md bg-card-foreground/5"><div className="flex items-center mb-1"><comp.icon className="h-5 w-5 mr-2 text-muted-foreground" /><h5 className="font-medium text-md">{comp.name}</h5></div><p className="text-sm">Current: <span className="font-medium">{typeof comp.current === 'number' ? comp.current.toFixed(0) : 'N/A'} kWh</span></p>{(change !== null || (typeof comp.current === 'number' && comp.previous === undefined)) && (<p className={`text-sm flex items-center ${trendColor}`}>Change:<span className={`flex items-center font-medium ml-1`}>{TrendIcon && change !== 0 && <TrendIcon className="h-4 w-4 mr-0.5" />}{changeText}</span>{(comp.previous !== undefined && change !== null && change !== 0) && <span className="text-xs text-muted-foreground ml-1"> vs yesterday</span>}</p>)}{comp.previous === undefined && typeof comp.current === 'number' && change === null && (<p className="text-xs text-muted-foreground mt-1">Previous day data unavailable.</p>)}{comp.previous !== undefined && typeof comp.current !== 'number' && change === null && (<p className="text-xs text-muted-foreground mt-1">Current data unavailable.</p>)}</div>);})) : (<p className="text-muted-foreground">Component power data is loading or unavailable.</p>)}</div>
                      <Separator />
                      <div><h4 className="font-semibold text-lg mb-2">Units with Abnormal Usage</h4>{abnormalPowerUnits.length > 0 ? (<div className="space-y-3">{abnormalPowerUnits.map(unit => { const change = unit.currentUsage - unit.previousUsage; const percentageChange = unit.previousUsage !== 0 ? (change / unit.previousUsage) * 100 : Infinity; return (<div key={unit.id} className="p-3 border rounded-md bg-card-foreground/5"><p className="font-semibold">{unit.name} <span className="text-xs text-muted-foreground">(Zone {unit.zone})</span></p><p className="text-sm">Current: <span className="font-medium">{unit.currentUsage} kWh</span></p><p className="text-sm text-destructive flex items-center"><ArrowUp className="h-4 w-4 mr-1" />Increased by: <span className="font-medium ml-1">{change.toFixed(1)} kWh ({percentageChange === Infinity ? 'New' : `${percentageChange.toFixed(0)}%`})</span></p><p className="text-xs text-muted-foreground">Previous: {unit.previousUsage} kWh</p></div>);})}</div>) : (<p className="text-muted-foreground">No units with significantly increased usage detected (threshold &gt;20%).</p>)}</div>
                    </div>
                  </ScrollArea>
                </DialogContent>
              </Dialog>
            );
          }
          if (metric.id === "waterConsumption") {
            const latestWaterDay = waterDetailsData.length > 0 ? waterDetailsData[waterDetailsData.length - 1] : null;
            const previousWaterDay = waterDetailsData.length > 1 ? waterDetailsData[waterDetailsData.length - 2] : null;
            let wueValueText = "N/A", totalWaterForWUEText = "N/A", usefulWaterForWUEText = "N/A";
            if (latestWaterDay && typeof latestWaterDay.totalConsumption === 'number' && typeof latestWaterDay.cleanWaterConsumptionAsUseful === 'number') { totalWaterForWUEText = latestWaterDay.totalConsumption.toFixed(0); usefulWaterForWUEText = latestWaterDay.cleanWaterConsumptionAsUseful.toFixed(0); if (latestWaterDay.wue !== undefined) wueValueText = latestWaterDay.wue.toFixed(2); }
            const componentWaterDetails = latestWaterDay ? [ { name: "MUWP Consumption", icon: Droplets, current: latestWaterDay.muwpConsumption, previous: previousWaterDay?.muwpConsumption, }, { name: "Booster Consumption", icon: Droplets, current: latestWaterDay.boosterConsumption, previous: previousWaterDay?.boosterConsumption, }, { name: "Clean Water Consumption", icon: Droplets, current: latestWaterDay.cleanWaterConsumption, previous: previousWaterDay?.cleanWaterConsumption, }, ] : [];
            return (
              <Dialog key={metric.id} open={isWaterDetailDialogOpen} onOpenChange={setIsWaterDetailDialogOpen}>
                <DialogTrigger asChild><div className="cursor-pointer"><MetricCard metric={metric} /></div></DialogTrigger>
                <DialogContent className="sm:max-w-2xl w-full h-auto max-h-[90vh]">
                  <DialogHeader><DialogTitle>Detailed Water Usage</DialogTitle><DialogDesc>WUE, and component breakdown for MUWP, Booster, and Clean Water.</DialogDesc></DialogHeader>
                  <ScrollArea className="max-h-[70vh] mt-4">
                    <div className="mt-4 space-y-6 pr-3">
                      <div><h4 className="font-semibold text-lg mb-2">Water Usage Effectiveness (WUE) - Today</h4>{latestWaterDay ? (<div className="space-y-1"><p className="text-2xl font-bold text-primary">{wueValueText} <span className="text-sm font-normal text-muted-foreground">WUE</span></p><p className="text-sm">Total Water Consumption: <span className="font-medium">{totalWaterForWUEText} m³</span></p><p className="text-sm">Clean Water (Useful Output): <span className="font-medium">{usefulWaterForWUEText} m³</span></p></div>) : (<p className="text-muted-foreground">WUE data is loading or unavailable.</p>)}</div>
                      <Separator/>
                      <div className="space-y-3"><h4 className="font-semibold text-lg mb-3">Component Breakdown - Today</h4>{latestWaterDay ? (componentWaterDetails.map(comp => { const change = (typeof comp.current === 'number' && typeof comp.previous === 'number') ? comp.current - comp.previous : null; const TrendIconComponent = change === null ? null : (change > 0 ? ArrowUp : (change < 0 ? ArrowDown : null)); let trendColor = 'text-muted-foreground'; if (change !== null && change !== 0) { if (comp.name === "Clean Water Consumption") trendColor = change > 0 ? 'text-secondary' : 'text-destructive'; else trendColor = change > 0 ? 'text-destructive' : 'text-secondary'; } else if (change === 0) trendColor = 'text-muted-foreground'; const sign = change === null ? '' : (change > 0 ? '+' : (change < 0 ? '' : '')); const changeText = change === null || (typeof comp.current !== 'number' && typeof comp.previous !== 'number') ? 'N/A' : (change === 0 ? 'No change' : `${sign}${Math.abs(change).toFixed(0)} m³`); return (<div key={comp.name} className="p-3 border rounded-md bg-card-foreground/5"><div className="flex items-center mb-1"><comp.icon className="h-5 w-5 mr-2 text-muted-foreground" /><h5 className="font-medium text-md">{comp.name}</h5></div><p className="text-sm">Current: <span className="font-medium">{typeof comp.current === 'number' ? comp.current.toFixed(0) : 'N/A'} m³</span></p>{(change !== null || (typeof comp.current === 'number' && comp.previous === undefined)) && (<p className={`text-sm flex items-center ${trendColor}`}>Change:<span className={`flex items-center font-medium ml-1`}>{TrendIconComponent && change !== 0 && <TrendIconComponent className="h-4 w-4 mr-0.5" />}{changeText}</span>{(comp.previous !== undefined && change !== null && change !== 0) && <span className="text-xs text-muted-foreground ml-1"> vs yesterday</span>}</p>)}{comp.previous === undefined && typeof comp.current === 'number' && change === null && (<p className="text-xs text-muted-foreground mt-1">Previous day data unavailable.</p>)}{comp.previous !== undefined && typeof comp.current !== 'number' && change === null && (<p className="text-xs text-muted-foreground mt-1">Current data unavailable.</p>)}</div>);})) : (<p className="text-muted-foreground">Component water data is loading or unavailable.</p>)}</div>
                    </div>
                  </ScrollArea>
                </DialogContent>
              </Dialog>
            );
          }
          return <MetricCard key={metric.id} metric={metric} />;
        })}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-md">
          <CardHeader><CardTitle>Recent Activity</CardTitle><CardDescription>Overview of recent system events and alerts.</CardDescription></CardHeader>
          <CardContent><div className="space-y-4">{recentActivityItems.map((activity) => (<div key={activity.id} className="flex items-start space-x-3 p-3 bg-card-foreground/5 rounded-md"><activity.icon className="h-5 w-5 text-accent mt-1" /><div><p className="text-sm font-medium">{activity.title}</p><p className="text-xs text-muted-foreground">{activity.details}</p></div></div>))}</div></CardContent>
        </Card>
        <Card className="shadow-md">
          <CardHeader><CardTitle>Maintenance Schedule</CardTitle><CardDescription className="mb-2">Monthly overview of permitted activities. Click a date for details.</CardDescription></CardHeader>
          <CardContent className="p-6 pt-0"><Calendar mode="single" month={displayedMonth} onMonthChange={setDisplayedMonth} className="rounded-md w-full" selected={selectedCalendarDate} onSelect={handleDateSelect} components={{ DayContent: CustomDayContent }} /></CardContent>
        </Card>
      </div>

      <Card className="shadow-md">
        <CardHeader><CardTitle>Daily Power Consumption Breakdown (Last 30 Days)</CardTitle><CardDescription>Daily power usage (kWh) for Zone A and Zone B, and their cumulative totals. Days shown as day number.</CardDescription></CardHeader>
        <CardContent>
          <PowerConsumptionChartJs data={powerData} />
          <div className="mt-8 pt-6 border-t"><h3 className="text-xl font-semibold mb-1">Power Consumption Data Details</h3><p className="text-sm text-muted-foreground mb-4">Detailed breakdown of daily and cumulative power usage (kWh) for the last 30 days for Zone A and Zone B.</p>
            {powerData.length === 0 ? (<p className="text-muted-foreground">Loading data...</p>) : (
              <Table><TableHeader><TableRow><TableHead className="font-semibold">Metric</TableHead>{powerData.map((dataItem) => (<TableHead key={dataItem.date} className="text-center">{dataItem.date}</TableHead>))}</TableRow></TableHeader>
                <TableBody>{powerDetailTableRows.map((metricRow) => (<TableRow key={metricRow.dataKey}><TableCell className="font-medium">{metricRow.label}</TableCell>{powerData.map((dataItem) => (<TableCell key={`${metricRow.dataKey}-${dataItem.date}`} className="text-center">{typeof dataItem[metricRow.dataKey] === 'number' ? (dataItem[metricRow.dataKey] as number).toFixed(0) : 'N/A'}</TableCell>))}</TableRow>))}</TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isCalendarActivityDialogOpen} onOpenChange={handleCalendarDialogActivityVisibilityChange}>
        <DialogContent className="sm:max-w-xl w-full h-auto max-h-[90vh]">
          <DialogHeader><DialogTitle>Permits for {selectedCalendarDate ? formatDateFns(selectedCalendarDate, 'dd MMMM yyyy') : ''}</DialogTitle><DialogDesc>Permitted activities for this day.</DialogDesc></DialogHeader>
          <ScrollArea className="max-h-[70vh] mt-4">
            <div className="space-y-3 pr-3">
            {selectedCalendarDate && getPermitsForDate(selectedCalendarDate).length > 0 ? (
              getPermitsForDate(selectedCalendarDate).map(permit => (
                <Card key={permit.id} className="p-3 bg-card-foreground/5 hover:bg-accent/50 transition-colors">
                  <div className="flex justify-between items-start mb-1"><p className="font-semibold text-sm flex-1 pr-2">[PTW-{permit.id}] {permit.activityName}</p><Badge variant={permitStatusToBadgeVariant(permit.status as PermitStatus)} className="text-xs">{permit.status}</Badge></div>
                  <p className="text-xs text-muted-foreground">PIC: {permit.assignedTo}</p>
                  {permit.vendor && <p className="text-xs text-muted-foreground">Vendor: {permit.vendor}</p>}
                </Card>
              ))
            ) : <p className="text-muted-foreground text-center py-4">No permits scheduled for this date.</p>}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
