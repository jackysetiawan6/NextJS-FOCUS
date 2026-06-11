
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import React, { useState, useMemo, useEffect } from 'react';
import type { AlarmEntry, AlarmClass, AlarmSystemStatus } from "@/types";
import { 
  initialAlarmEntries, 
  defaultAlarmFormData, 
  alarmClassOptions, 
  alarmStatusOptions 
} from "@/lib/data";
import { PlusCircle, FileText, CheckCircle2, AlertCircle, Info, ShieldAlert, XCircle, CalendarDays, Search, ArrowDownUp, User, Clock, MapPin } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { format, parseISO, isSameDay, isValid } from 'date-fns';
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ClientFormattedTimestamp } from "@/components/shared/client-formatted-timestamp";

const alarmStatusFilterOptions: (AlarmSystemStatus | 'all')[] = ['all', ...alarmStatusOptions];
const alarmClassFilterOptions: (AlarmClass | 'all')[] = ['all', ...alarmClassOptions];


const getAlarmClassStyling = (alarmClass: AlarmClass): string => {
  switch (alarmClass) {
    case "Critical":
    case "Major":
      return "border-l-4 border-destructive bg-destructive/10 hover:bg-destructive/20";
    case "Minor":
    case "Warning":
      return "border-l-4 border-yellow-500 dark:border-yellow-400 bg-yellow-500/10 dark:bg-yellow-400/10 hover:bg-yellow-500/20 dark:hover:bg-yellow-400/20";
    case "Information":
      return "border-l-4 border-blue-500 dark:border-blue-400 bg-blue-500/10 dark:bg-blue-400/10 hover:bg-blue-500/20 dark:hover:bg-blue-400/20";
    default:
      return "border-l-4 border-border bg-card-foreground/5 hover:shadow-md";
  }
};

const getAlarmStatusStyling = (status: AlarmSystemStatus): string => {
   switch (status) {
    case "Resolved":
      return "border-l-4 border-green-500 dark:border-green-400 bg-green-500/10 dark:bg-green-400/10 hover:bg-green-500/20 dark:hover:bg-green-400/20";
    case "Closed":
      return "border-l-4 border-muted bg-muted/10 hover:bg-muted/20 opacity-75";
    default:
      return "";
  }
}

const getAlarmClassBadgeVariant = (alarmClass: AlarmClass): "destructive" | "secondary" | "default" | "outline" => {
  switch (alarmClass) {
    case "Critical": return "destructive";
    case "Major": return "destructive";
    case "Minor": return "secondary";
    case "Warning": return "secondary";
    case "Information": return "default";
    default: return "outline";
  }
};

const getAlarmStatusBadgeVariant = (status: AlarmSystemStatus): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case "Active": return "destructive";
    case "Acknowledged": return "secondary";
    case "Resolved": return "default";
    case "Closed": return "outline";
    default: return "outline";
  }
};

const getAlarmClassIcon = (alarmClass: AlarmClass) => {
  switch (alarmClass) {
    case "Critical": return <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />;
    case "Major": return <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />;
    case "Minor": return <ShieldAlert className="h-5 w-5 text-yellow-500 dark:text-yellow-400 flex-shrink-0" />;
    case "Warning": return <ShieldAlert className="h-5 w-5 text-yellow-500 dark:text-yellow-400 flex-shrink-0" />;
    case "Information": return <Info className="h-5 w-5 text-blue-500 dark:text-blue-400 flex-shrink-0" />;
    default: return <Info className="h-5 w-5 flex-shrink-0" />;
  }
};

const formatTimestampForInput = (isoString: string | null | undefined) => {
  if (!isoString) return "";
  try {
    const date = parseISO(isoString);
    if (!isValid(date)) return "";
    return format(date, "yyyy-MM-dd'T'HH:mm");
  } catch (error) {
    return "";
  }
};

export default function AlarmLogsPage() {
  const { toast } = useToast();
  const [alarmEntries, setAlarmEntries] = useState<AlarmEntry[]>(initialAlarmEntries);
  const [isAlarmDialogOpen, setIsAlarmDialogOpen] = useState(false);
  const [currentAlarm, setCurrentAlarm] = useState<Omit<AlarmEntry, 'id' | 'status'>>(defaultAlarmFormData);
  const [editingAlarmId, setEditingAlarmId] = useState<string | null>(null);

  const [searchTermAlarms, setSearchTermAlarms] = useState<string>("");
  const [selectedStatusAlarms, setSelectedStatusAlarms] = useState<AlarmSystemStatus | 'all'>('Active');
  const [selectedClassAlarms, setSelectedClassAlarms] = useState<AlarmClass | 'all'>('all');
  const [selectedDateAlarms, setSelectedDateAlarms] = useState<Date | undefined>(undefined);
  const [sortOrderAlarms, setSortOrderAlarms] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    setSelectedDateAlarms(new Date());
  }, []);

  const handleAlarmFormChange = (field: keyof Omit<AlarmEntry, 'id' | 'status'>, value: string | null) => {
    setCurrentAlarm(prev => ({ ...prev, [field]: value }));
  };

  const handleAlarmClassChange = (value: string) => {
     handleAlarmFormChange('alarmClass', value as AlarmClass);
  };

  const handleOpenNewAlarmDialog = () => {
    setEditingAlarmId(null);
    setCurrentAlarm({...defaultAlarmFormData, occurredTimestamp: new Date().toISOString()});
    setIsAlarmDialogOpen(true);
  };

  const handleOpenEditAlarmDialog = (alarm: AlarmEntry) => {
    setEditingAlarmId(alarm.id);
    setCurrentAlarm({
        occurredTimestamp: alarm.occurredTimestamp,
        acknowledgedTimestamp: alarm.acknowledgedTimestamp,
        resolvedTimestamp: alarm.resolvedTimestamp,
        alarmDescription: alarm.alarmDescription,
        actionTaken: alarm.actionTaken,
        remarks: alarm.remarks || "",
        responsible: alarm.responsible,
        floorLevel: alarm.floorLevel,
        incidentId: alarm.incidentId || "",
        alarmClass: alarm.alarmClass,
    });
    setIsAlarmDialogOpen(true);
  };

  const handleAlarmSubmit = () => {
    if (!currentAlarm.alarmDescription || !currentAlarm.occurredTimestamp || !currentAlarm.responsible || !currentAlarm.floorLevel || !currentAlarm.actionTaken) {
      toast({ title: "Missing Fields", description: "Please fill in all required alarm details.", variant: "destructive" });
      return;
    }

    if (editingAlarmId) {
      setAlarmEntries(prev => prev.map(ae => ae.id === editingAlarmId ? { ...ae, ...currentAlarm, id: editingAlarmId, status: ae.status } : ae));
      toast({ title: "Alarm Updated", description: "Alarm log has been successfully updated." });
    } else {
      const newAlarm: AlarmEntry = {
        ...currentAlarm,
        id: `alarm-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        status: "Active",
      };
      setAlarmEntries(prev => [newAlarm, ...prev]);
      toast({ title: "New Alarm Logged", description: "Alarm has been successfully logged." });
    }
    setIsAlarmDialogOpen(false);
    setEditingAlarmId(null);
  };

  const handleAcknowledgeAlarm = (alarmId: string) => {
    setAlarmEntries(prev => prev.map(alarm =>
      alarm.id === alarmId && alarm.status === "Active"
        ? { ...alarm, status: "Acknowledged", acknowledgedTimestamp: new Date().toISOString() }
        : alarm
    ));
    toast({ title: "Alarm Acknowledged", description: "The alarm status has been updated." });
  };

  const handleResolveAlarm = (alarmId: string) => {
    setAlarmEntries(prev => prev.map(alarm =>
      alarm.id === alarmId && (alarm.status === "Active" || alarm.status === "Acknowledged")
        ? { ...alarm, status: "Resolved", resolvedTimestamp: new Date().toISOString() }
        : alarm
    ));
     toast({ title: "Alarm Resolved", description: "The alarm status has been updated." });
  };

  const getDialogTitle = () => {
    if (editingAlarmId) {
      const alarm = alarmEntries.find(ae => ae.id === editingAlarmId);
      return `Alarm Details: ${alarm ? alarm.alarmDescription.substring(0,30) + (alarm.alarmDescription.length > 30 ? "..." : "") : "Edit Alarm"}`;
    }
    return "Add New Alarm Log";
  };

  const toggleSortOrderAlarms = () => {
    setSortOrderAlarms(prev => (prev === 'desc' ? 'asc' : 'desc'));
  };

  const filteredAlarmEntries = useMemo(() => {
    return alarmEntries.filter(alarm => {
      const searchLower = searchTermAlarms.toLowerCase();
      const searchMatch = searchTermAlarms === "" ||
        alarm.alarmDescription.toLowerCase().includes(searchLower) ||
        alarm.responsible.toLowerCase().includes(searchLower) ||
        alarm.floorLevel.toLowerCase().includes(searchLower) ||
        (alarm.incidentId && alarm.incidentId.toLowerCase().includes(searchLower));

      const statusMatch = selectedStatusAlarms === 'all' || alarm.status === selectedStatusAlarms;
      const classMatch = selectedClassAlarms === 'all' || alarm.alarmClass === selectedClassAlarms;

      let dateMatch = true;
      if (selectedDateAlarms) {
        try {
          dateMatch = isSameDay(parseISO(alarm.occurredTimestamp), selectedDateAlarms);
        } catch (error) {
          dateMatch = false;
        }
      }

      return searchMatch && statusMatch && classMatch && dateMatch;
    })
    .sort((a, b) => {
      try {
        const dateA = parseISO(a.occurredTimestamp).getTime();
        const dateB = parseISO(b.occurredTimestamp).getTime();
        return sortOrderAlarms === 'desc' ? dateB - dateA : dateA - dateB;
      } catch (error) {
        return 0;
      }
    });
  }, [alarmEntries, searchTermAlarms, selectedStatusAlarms, selectedClassAlarms, selectedDateAlarms, sortOrderAlarms]);

  const renderDialogFormContent = () => {
    if (editingAlarmId && alarmEntries.find(ae => ae.id === editingAlarmId)) {
        const alarmBeingEdited = alarmEntries.find(ae => ae.id === editingAlarmId)!;
        return (
            <div className="space-y-4">
                <div className="space-y-2 p-3 border rounded-md bg-muted/30">
                    <h4 className="font-semibold text-sm">Current State</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-sm">
                        <div><strong>Class:</strong> <Badge variant={getAlarmClassBadgeVariant(alarmBeingEdited.alarmClass)}>{alarmBeingEdited.alarmClass}</Badge></div>
                        <div><strong>Status:</strong> <Badge variant={getAlarmStatusBadgeVariant(alarmBeingEdited.status)}>{alarmBeingEdited.status}</Badge></div>
                        <div className="col-span-full sm:col-span-1"><strong>Occurred:</strong> <ClientFormattedTimestamp isoString={alarmBeingEdited.occurredTimestamp} /></div>
                        {alarmBeingEdited.acknowledgedTimestamp && <div className="col-span-full sm:col-span-1"><strong>Acknowledged:</strong> <ClientFormattedTimestamp isoString={alarmBeingEdited.acknowledgedTimestamp} /></div>}
                        {alarmBeingEdited.resolvedTimestamp && <div className="col-span-full sm:col-span-1"><strong>Resolved:</strong> <ClientFormattedTimestamp isoString={alarmBeingEdited.resolvedTimestamp} /></div>}
                    </div>
                </div>

                <Separator />
                <h4 className="font-semibold text-sm pt-2">Update Details / Log New Action</h4>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="alarmClassEdit" className="text-right">Class</Label>
                  <Select value={currentAlarm.alarmClass} onValueChange={handleAlarmClassChange}>
                    <SelectTrigger id="alarmClassEdit" className="col-span-3">
                      <SelectValue placeholder="Select alarm class" />
                    </SelectTrigger>
                    <SelectContent>
                      {alarmClassOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label htmlFor="alarmDescriptionEdit" className="text-right pt-2">Description</Label>
                  <Textarea id="alarmDescriptionEdit" value={currentAlarm.alarmDescription} onChange={(e) => handleAlarmFormChange('alarmDescription', e.target.value)} className="col-span-3 min-h-[60px]" placeholder="e.g., High Temperature Alert - Server Rack C-07" />
                </div>
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label htmlFor="actionTakenEdit" className="text-right pt-2">Action Taken</Label>
                  <Textarea id="actionTakenEdit" value={currentAlarm.actionTaken} onChange={(e) => handleAlarmFormChange('actionTaken', e.target.value)} className="col-span-3 min-h-[80px]" placeholder="Describe actions performed for this update..."/>
                </div>
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label htmlFor="remarksEdit" className="text-right pt-2">Remarks</Label>
                  <Textarea id="remarksEdit" value={currentAlarm.remarks || ""} onChange={(e) => handleAlarmFormChange('remarks', e.target.value)} className="col-span-3 min-h-[60px]" placeholder="Additional notes or comments for this update..."/>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="incidentIdEdit" className="text-right">Incident ID</Label>
                  <Input id="incidentIdEdit" value={currentAlarm.incidentId || ""} onChange={(e) => handleAlarmFormChange('incidentId', e.target.value)} className="col-span-3" placeholder="Optional: e.g., INC-12345"/>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="occurredTimestampEdit" className="text-right">Occurred At</Label>
                  <Input id="occurredTimestampEdit" type="datetime-local" value={formatTimestampForInput(currentAlarm.occurredTimestamp)} onChange={(e) => handleAlarmFormChange('occurredTimestamp', e.target.value ? new Date(e.target.value).toISOString() : null)} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="acknowledgedTimestampEdit" className="text-right">Acknowledged At</Label>
                  <Input id="acknowledgedTimestampEdit" type="datetime-local" value={formatTimestampForInput(currentAlarm.acknowledgedTimestamp)} onChange={(e) => handleAlarmFormChange('acknowledgedTimestamp', e.target.value ? new Date(e.target.value).toISOString() : null)} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="resolvedTimestampEdit" className="text-right">Resolved At</Label
                  ><Input id="resolvedTimestampEdit" type="datetime-local" value={formatTimestampForInput(currentAlarm.resolvedTimestamp)} onChange={(e) => handleAlarmFormChange('resolvedTimestamp', e.target.value ? new Date(e.target.value).toISOString() : null)} className="col-span-3" />
                </div>
            </div>
        );
    }
    return (
        <div className="grid gap-4">
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="occurredTimestampNew" className="text-right">Occurred At</Label>
                <Input id="occurredTimestampNew" type="datetime-local" value={formatTimestampForInput(currentAlarm.occurredTimestamp)} onChange={(e) => handleAlarmFormChange('occurredTimestamp', e.target.value ? new Date(e.target.value).toISOString() : null)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="alarmClassNew" className="text-right">Class</Label>
                <Select value={currentAlarm.alarmClass} onValueChange={handleAlarmClassChange}>
                    <SelectTrigger id="alarmClassNew" className="col-span-3">
                        <SelectValue placeholder="Select alarm class" />
                    </SelectTrigger>
                    <SelectContent>
                        {alarmClassOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="alarmDescriptionNew" className="text-right pt-2">Description</Label>
                <Textarea id="alarmDescriptionNew" value={currentAlarm.alarmDescription} onChange={(e) => handleAlarmFormChange('alarmDescription', e.target.value)} className="col-span-3 min-h-[60px]" placeholder="e.g., High Temperature Alert - Server Rack C-07" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="floorLevelNew" className="text-right">Floor Level</Label>
                <Input id="floorLevelNew" value={currentAlarm.floorLevel} onChange={(e) => handleAlarmFormChange('floorLevel', e.target.value)} className="col-span-3" placeholder="e.g., Data Hall C, Row 07"/>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="responsibleNew" className="text-right">Responsible</Label>
                <Input id="responsibleNew" value={currentAlarm.responsible} onChange={(e) => handleAlarmFormChange('responsible', e.target.value)} className="col-span-3" placeholder="Person or Team Name"/>
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="actionTakenNew" className="text-right pt-2">Action Taken</Label>
                <Textarea id="actionTakenNew" value={currentAlarm.actionTaken} onChange={(e) => handleAlarmFormChange('actionTaken', e.target.value)} className="col-span-3 min-h-[80px]" placeholder="Describe actions performed..."/>
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="remarksNew" className="text-right pt-2">Remarks</Label>
                <Textarea id="remarksNew" value={currentAlarm.remarks || ""} onChange={(e) => handleAlarmFormChange('remarks', e.target.value)} className="col-span-3 min-h-[60px]" placeholder="Additional notes or comments..."/>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="incidentIdNew" className="text-right">Incident ID</Label>
                <Input id="incidentIdNew" value={currentAlarm.incidentId || ""} onChange={(e) => handleAlarmFormChange('incidentId', e.target.value)} className="col-span-3" placeholder="Optional: e.g., INC-12345"/>
            </div>
        </div>
    );
  };


  return (
    <TooltipProvider>
    <div className="space-y-6 flex flex-col h-full">
      <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-2">
        <div className="flex-grow">
          <h1 className="text-3xl font-bold tracking-tight">Alarm and Action Taken Logs</h1>
          <p className="text-muted-foreground">
            Log, filter, and manage BMS alarms. Default view shows today's active alarms.
          </p>
        </div>
        <Button onClick={handleOpenNewAlarmDialog} className="w-full sm:w-auto mt-2 sm:mt-0">
          <PlusCircle className="mr-2 h-5 w-5" /> Add New Alarm Log
        </Button>
      </div>
      
      <Card className="shadow-md flex flex-col flex-1">
        <CardContent className="p-6 flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start flex-wrap justify-end gap-3 mb-4">
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Search alarms..."
                  value={searchTermAlarms}
                  onChange={(e) => setSearchTermAlarms(e.target.value)}
                  className="h-10 pl-10 w-full"
                />
              </div>
                <Select value={selectedStatusAlarms} onValueChange={(value) => setSelectedStatusAlarms(value as AlarmSystemStatus | 'all')}>
                  <SelectTrigger className="w-full sm:w-[140px] h-10">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {alarmStatusFilterOptions.map(status => (
                      <SelectItem key={status} value={status}>
                        {status === 'all' ? 'All Statuses' : status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedClassAlarms} onValueChange={(value) => setSelectedClassAlarms(value as AlarmClass | 'all')}>
                  <SelectTrigger className="w-full sm:w-[140px] h-10">
                    <SelectValue placeholder="Class" />
                  </SelectTrigger>
                  <SelectContent>
                    {alarmClassFilterOptions.map(cls => (
                      <SelectItem key={cls} value={cls}>
                        {cls === 'all' ? 'All Classes' : cls}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Popover>
                  <Tooltip>
                    <TooltipTrigger asChild>
                       <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full sm:w-auto h-10 text-left font-normal flex items-center justify-center sm:justify-start",
                              !selectedDateAlarms && "text-muted-foreground"
                            )}
                          >
                            <CalendarDays className="mr-0 sm:mr-2 h-4 w-4" />
                            <span className="hidden sm:inline">
                              {selectedDateAlarms ? format(selectedDateAlarms, "dd MMMM yyyy") : <span>Pick a date</span>}
                            </span>
                             <span className="sm:hidden">
                              {selectedDateAlarms ? format(selectedDateAlarms, "dd/MM/yy") : <CalendarDays className="h-4 w-4" />}
                            </span>
                          </Button>
                        </PopoverTrigger>
                    </TooltipTrigger>
                    <TooltipContent className="sm:hidden">
                      <p>{selectedDateAlarms ? format(selectedDateAlarms, "dd MMMM yyyy") : "Pick a date"}</p>
                    </TooltipContent>
                  </Tooltip>
                  <PopoverContent className="p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDateAlarms}
                      onSelect={setSelectedDateAlarms}
                      initialFocus
                    />
                    {selectedDateAlarms && (
                      <Button variant="ghost" size="sm" className="w-full mt-1" onClick={() => setSelectedDateAlarms(undefined)}>
                        Clear Date Filter
                      </Button>
                    )}
                  </PopoverContent>
                </Popover>

                <Tooltip>
                  <TooltipTrigger asChild>
                     <Button variant="outline" onClick={toggleSortOrderAlarms} className="h-10 w-full sm:w-auto flex items-center justify-center sm:justify-start">
                        <ArrowDownUp className="mr-0 sm:mr-2 h-4 w-4" />
                        <span className="hidden sm:inline">
                          {sortOrderAlarms === 'desc' ? 'Newest First' : 'Oldest First'}
                        </span>
                        <span className="sm:hidden">
                           <ArrowDownUp className="h-4 w-4" />
                        </span>
                      </Button>
                  </TooltipTrigger>
                  <TooltipContent className="sm:hidden">
                    <p>{sortOrderAlarms === 'desc' ? 'Newest First' : 'Oldest First'}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            <Separator className="mb-4" />
            <ScrollArea className="flex-1 min-h-0">
              <div className="space-y-3 pr-3">
                {filteredAlarmEntries.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    {alarmEntries.length === 0 ? "No alarm logs recorded yet." : "No alarm logs match your current filters."}
                  </p>
                ) : (
                  filteredAlarmEntries.map(alarm => (
                    <Card
                      key={alarm.id}
                      className={cn(
                        "transition-shadow duration-200",
                        getAlarmClassStyling(alarm.alarmClass),
                        getAlarmStatusStyling(alarm.status)
                      )}
                    >
                      <CardContent className="p-3 sm:p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div className="flex items-start gap-3 flex-grow min-w-0">
                            {getAlarmClassIcon(alarm.alarmClass)}
                            <div className="space-y-1 flex-grow overflow-hidden">
                              <p className="text-md font-semibold truncate" title={alarm.alarmDescription}>{alarm.alarmDescription}</p>
                              <div className="text-xs text-muted-foreground flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-x-3 gap-y-0.5">
                                <span className="flex items-center truncate" title={`Floor: ${alarm.floorLevel}`}>
                                  <MapPin className="h-3 w-3 mr-1 flex-shrink-0" /> Floor: {alarm.floorLevel}
                                </span>
                                <span className="flex items-center truncate" title={`Responsible: ${alarm.responsible}`}>
                                  <User className="h-3 w-3 mr-1 flex-shrink-0" /> Responsible: {alarm.responsible}
                                </span>
                                {alarm.incidentId && (
                                  <span className="flex items-center truncate" title={`Incident ID: ${alarm.incidentId}`}>
                                    <FileText className="h-3 w-3 mr-1 flex-shrink-0" /> Incident: {alarm.incidentId}
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-x-3 gap-y-0.5">
                                <span className="flex items-center">
                                  <Clock className="h-3 w-3 mr-1 flex-shrink-0" /> Occurred: <ClientFormattedTimestamp isoString={alarm.occurredTimestamp} type="short" />
                                </span>
                                {alarm.acknowledgedTimestamp && (
                                  <span className="flex items-center">
                                    <Clock className="h-3 w-3 mr-1 flex-shrink-0" /> Acknowledged: <ClientFormattedTimestamp isoString={alarm.acknowledgedTimestamp} type="short" />
                                  </span>
                                )}
                                {alarm.resolvedTimestamp && (
                                  <span className="flex items-center">
                                    <Clock className="h-3 w-3 mr-1 flex-shrink-0" /> Resolved: <ClientFormattedTimestamp isoString={alarm.resolvedTimestamp} type="short" />
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col items-start sm:items-end gap-2 sm:ml-4 flex-shrink-0">
                            <div className="flex gap-2 self-start sm:self-end">
                                <Badge variant={getAlarmClassBadgeVariant(alarm.alarmClass)}>{alarm.alarmClass}</Badge>
                                <Badge variant={getAlarmStatusBadgeVariant(alarm.status)}>{alarm.status}</Badge>
                            </div>
                            <div className="flex gap-2 flex-wrap">
                              <Button variant="outline" size="sm" onClick={() => handleOpenEditAlarmDialog(alarm)}>
                                <FileText className="mr-1.5 h-3 w-3" /> Details
                              </Button>
                              {alarm.status === "Active" && (
                                <Button size="sm" onClick={() => handleAcknowledgeAlarm(alarm.id)}>
                                  <CheckCircle2 className="mr-1.5 h-3 w-3" /> Acknowledge
                                </Button>
                              )}
                              {(alarm.status === "Active" || alarm.status === "Acknowledged") && (
                                 <Button variant="outline" size="sm" onClick={() => handleResolveAlarm(alarm.id)}>
                                   <XCircle className="mr-1.5 h-3 w-3" /> Resolve
                                 </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
        </CardContent>
      </Card>

      <Dialog open={isAlarmDialogOpen} onOpenChange={setIsAlarmDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{getDialogTitle()}</DialogTitle>
            {editingAlarmId && alarmEntries.find(ae => ae.id === editingAlarmId) && (
              <DialogDescription className="text-xs text-muted-foreground pt-1">
                ID: {editingAlarmId} | Floor: {alarmEntries.find(ae => ae.id === editingAlarmId)?.floorLevel} | Responsible: {alarmEntries.find(ae => ae.id === editingAlarmId)?.responsible}
              </DialogDescription>
            )}
          </DialogHeader>
          <ScrollArea className="max-h-[calc(90vh-160px)] p-1"> 
            <div className="py-4 pr-1"> 
                {renderDialogFormContent()}
            </div>
          </ScrollArea>
          <DialogFooter className="pt-4">
            <Button variant="outline" onClick={() => setIsAlarmDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAlarmSubmit}>{editingAlarmId ? "Save Changes" : "Add Alarm Log"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </TooltipProvider>
  );
}
