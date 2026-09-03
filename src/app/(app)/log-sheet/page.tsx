
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CalendarDays, Search, Info, LineChart as LineChartIcon } from "lucide-react";
import type { ElectricalUnitLogEntry, ShiftType, ElectricalUnit } from "@/types";
import { initialElectricalLogEntries, electricalUnits as allUnits } from "@/lib/data/log-sheet-data";
import { ClientFormattedTimestamp } from '@/components/shared/client-formatted-timestamp';
import { cn } from "@/lib/utils";
import { format, parseISO, isSameDay, startOfDay, endOfDay, subDays, eachDayOfInterval } from 'date-fns';
import ElectricalUnitLogChart from '@/components/log-sheet/electrical-unit-chart';

const shiftOptions: { value: ShiftType | 'All'; label: string }[] = [
  { value: "All", label: "All Shifts" },
  { value: "Morning", label: "Morning" },
  { value: "Afternoon", label: "Afternoon" },
  { value: "Night", label: "Night" },
];

export default function LogSheetPage() {
  const [logEntries, setLogEntries] = useState<ElectricalUnitLogEntry[]>([]);
  
  // For Table Filters
  const [selectedTableDate, setSelectedTableDate] = useState<Date | undefined>(undefined);
  const [selectedTableShift, setSelectedTableShift] = useState<ShiftType | 'All'>('All');
  const [tableSearchTerm, setTableSearchTerm] = useState<string>("");

  // For Chart Filter
  const [selectedChartUnitType, setSelectedChartUnitType] = useState<string>("PDU"); // Default to PDU

  useEffect(() => {
    setLogEntries(initialElectricalLogEntries);
    setSelectedTableDate(new Date()); // Default table filter to today
  }, []);

  const unitTypesForSelect = useMemo(() => {
    const types = new Set(allUnits.map(unit => unit.type));
    return Array.from(types).sort();
  }, []);

  // Data for the new 10-day comparison chart
  const tenDayComparisonChartData = useMemo(() => {
    if (!selectedChartUnitType) return null;

    const today = new Date();
    const lastTenDays = eachDayOfInterval({
      start: subDays(today, 9),
      end: today,
    }).reverse(); // Newest first for labels, but chart might re-sort time data

    const commonUnitOfMeasurement = allUnits.find(u => u.type === selectedChartUnitType)?.unit || "Units";

    const zoneAData: (number | null)[] = [];
    const zoneBData: (number | null)[] = [];
    const dateLabels: string[] = [];

    for (const day of lastTenDays) {
      dateLabels.push(format(day, 'MMM d'));

      const dayLogs = logEntries.filter(log => 
        isSameDay(parseISO(log.timestamp), day) &&
        allUnits.find(u => u.id === log.unitId && u.type === selectedChartUnitType)
      );

      const zoneALogs = dayLogs.filter(log => log.zone === 'A');
      const zoneBLogs = dayLogs.filter(log => log.zone === 'B');

      const calculateAverage = (logs: ElectricalUnitLogEntry[]) => {
        if (logs.length === 0) return null;
        const sum = logs.reduce((acc, curr) => acc + curr.readingValue, 0);
        return parseFloat((sum / logs.length).toFixed(2));
      };

      zoneAData.push(calculateAverage(zoneALogs));
      zoneBData.push(calculateAverage(zoneBLogs));
    }
    
    // Data needs to be from oldest to newest for line chart
    return {
      labels: dateLabels.reverse(),
      datasets: [
        {
          label: `Zone A - ${selectedChartUnitType} (${commonUnitOfMeasurement})`,
          data: zoneAData.reverse(),
          borderColor: 'hsl(var(--chart-1))', // Use theme colors
          tension: 0.1,
        },
        {
          label: `Zone B - ${selectedChartUnitType} (${commonUnitOfMeasurement})`,
          data: zoneBData.reverse(),
          borderColor: 'hsl(var(--chart-2))',
          tension: 0.1,
        },
      ],
      unitOfMeasurement: commonUnitOfMeasurement,
    };
  }, [logEntries, selectedChartUnitType]);


  // Filtered logs for the TABLE
  const filteredTableLogs = useMemo(() => {
    let logs = [...logEntries];

    if (selectedTableDate) {
      const targetDateStart = startOfDay(selectedTableDate);
      const targetDateEnd = endOfDay(selectedTableDate);
      logs = logs.filter(log => {
        try {
          const logTimestamp = parseISO(log.timestamp);
          return logTimestamp >= targetDateStart && logTimestamp <= targetDateEnd;
        } catch (e) { return false; }
      });
    }

    if (selectedTableShift !== 'All') {
      logs = logs.filter(log => log.shift === selectedTableShift);
    }

    if (tableSearchTerm) {
      const lowerSearch = tableSearchTerm.toLowerCase();
      logs = logs.filter(log =>
        log.unitName.toLowerCase().includes(lowerSearch) ||
        log.zone.toLowerCase().includes(lowerSearch) ||
        (log.operator && log.operator.toLowerCase().includes(lowerSearch)) ||
        (log.notes && log.notes.toLowerCase().includes(lowerSearch))
      );
    }
    logs.sort((a, b) => parseISO(b.timestamp).getTime() - parseISO(a.timestamp).getTime());
    return logs;
  }, [logEntries, selectedTableDate, selectedTableShift, tableSearchTerm]);


  return (
    <div className="space-y-6">
      <Card className="shadow-md">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex-1">
              <CardTitle className="text-2xl">Electrical Unit Log Sheet</CardTitle>
              <CardDescription>View and analyze operational logs for electrical units.</CardDescription>
            </div>
            <div>
              <Label htmlFor="chartUnitTypeSelect" className="text-sm font-medium">Chart Unit Type:</Label>
              <Select value={selectedChartUnitType} onValueChange={setSelectedChartUnitType}>
                <SelectTrigger id="chartUnitTypeSelect" className="w-full sm:w-[180px] mt-1">
                  <SelectValue placeholder="Select Unit Type" />
                </SelectTrigger>
                <SelectContent>
                  {unitTypesForSelect.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {tenDayComparisonChartData ? (
             <Card className="mt-0 mb-6 shadow-inner bg-card-foreground/5">
              <CardHeader>
                <CardTitle className="text-lg flex items-center"><LineChartIcon className="mr-2 h-5 w-5 text-primary"/>{selectedChartUnitType} Reading Comparison (Last 10 Days)</CardTitle>
                <CardDescription>Average daily readings for {selectedChartUnitType} units in Zone A vs Zone B.</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <ElectricalUnitLogChart 
                  data={tenDayComparisonChartData} 
                  chartType="comparison" 
                />
              </CardContent>
            </Card>
          ) : (
            <div className="mt-6 mb-4 p-4 text-center text-muted-foreground bg-muted/50 rounded-md">
              <Info className="mx-auto h-8 w-8 mb-2 text-muted-foreground/70"/>
              Select a unit type to view comparison chart.
            </div>
          )}
          
          <CardDescription className="mb-3 font-semibold border-t pt-4">Detailed Log Entries (Filterable)</CardDescription>
          <div className="flex flex-col sm:flex-row gap-3 mb-4 items-center">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("w-full sm:w-auto justify-start text-left font-normal", !selectedTableDate && "text-muted-foreground")}
                >
                  <CalendarDays className="mr-2 h-4 w-4" />
                  {selectedTableDate ? format(selectedTableDate, "PPP") : <span>Pick a date for table</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={selectedTableDate} onSelect={setSelectedTableDate} initialFocus />
              </PopoverContent>
            </Popover>

            <Select value={selectedTableShift} onValueChange={(value) => setSelectedTableShift(value as ShiftType | 'All')}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Select Shift for table" />
              </SelectTrigger>
              <SelectContent>
                {shiftOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="relative w-full sm:flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search logs in table..."
                value={tableSearchTerm}
                onChange={(e) => setTableSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <ScrollArea className="max-h-[500px] w-full mt-4">
            {filteredTableLogs.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Unit Name</TableHead>
                    <TableHead>Zone</TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead className="text-right">Reading</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Operator</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTableLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">{log.unitName}</TableCell>
                      <TableCell>{log.zone}</TableCell>
                      <TableCell>
                        <ClientFormattedTimestamp isoString={log.timestamp} type="full" />
                      </TableCell>
                      <TableCell className="text-right">{log.readingValue.toLocaleString()}</TableCell>
                      <TableCell>{log.readingUnit}</TableCell>
                      <TableCell>{log.operator || 'N/A'}</TableCell>
                      <TableCell className="max-w-xs truncate" title={log.notes}>{log.notes || 'N/A'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                {logEntries.length === 0 ? "Initializing log data..." : "No logs match current table filters."}
              </p>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
