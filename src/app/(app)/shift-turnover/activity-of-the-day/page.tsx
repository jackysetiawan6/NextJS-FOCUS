
"use client";

import type { ShiftType, ShiftChecklist, PermitToWork, PersonnelShiftActivity, DailyPersonnelActivities, PersonnelActivityStatus, PermitStatus } from "@/types";
import { initialShiftChecklists, initialPersonnelActivities } from "@/lib/data/checklist-data"; 
import { initialPermits, permitStatusToBadgeVariant, permitStatusOptions } from "@/lib/data/permit-data";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import React, { useState, useMemo, useEffect } from 'react';
import { format, isSameDay, parseISO, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription as DialogDesc, DialogFooter } from "@/components/ui/dialog";
import { PlusCircle, UserPlus, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { ClientFormattedTimestamp } from "@/components/shared/client-formatted-timestamp";
import { cn } from "@/lib/utils";

const shiftOptions: { value: ShiftType; label: string }[] = [
  { value: "Morning", label: "Morning" },
  { value: "Afternoon", label: "Afternoon" },
  { value: "Night", label: "Night" },
];

const personnelActivityStatusToBadgeVariant = (status: PersonnelActivityStatus): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case 'Completed': return 'default'; 
    case 'In Progress': return 'secondary'; 
    case 'Pending': return 'outline'; 
    case 'Blocked': return 'destructive'; 
    default: return 'outline';
  }
};

const personnelActivityStatusOptions: PersonnelActivityStatus[] = ['Pending', 'In Progress', 'Completed', 'Blocked'];


export default function ActivityOfTheDayPage() {
  const [selectedShift, setSelectedShift] = useState<ShiftType>("Morning");
  const [checklists, setChecklists] = React.useState<ShiftChecklist[]>(initialShiftChecklists);
  const [permits, setPermits] = useState<PermitToWork[]>(initialPermits);
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date("2026-06-11T00:00:00Z")); 
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);

  useEffect(() => {
    setCurrentDate(new Date());
  }, []);

  const [personnelLogData, setPersonnelLogData] = useState<DailyPersonnelActivities[]>(initialPersonnelActivities);
  const [isAddPersonDialogOpen, setIsAddPersonDialogOpen] = useState(false);
  const [newPersonName, setNewPersonName] = useState("");

  const [isAddActivityDialogOpen, setIsAddActivityDialogOpen] = useState(false);
  const [targetPersonForActivity, setTargetPersonForActivity] = useState<string | null>(null);
  const [newActivityText, setNewActivityText] = useState("");
  const [newActivityStatus, setNewActivityStatus] = useState<PersonnelActivityStatus>("Pending");


  const handleChecklistItemChange = (
    shiftType: ShiftType,
    sectionTitle: string,
    itemId: string,
    checked: boolean
  ) => {
    setChecklists((prevChecklists) =>
      prevChecklists.map((cl) =>
        cl.shift === shiftType
          ? {
              ...cl,
              sections: cl.sections.map((section) =>
                section.title === sectionTitle
                  ? {
                      ...section,
                      items: section.items.map((item) =>
                        item.id === itemId ? { ...item, checked } : item
                      ),
                    }
                  : section
              ),
            }
          : cl
      )
    );
  };

  const executeFinalizeShift = (shiftType: ShiftType) => {
    const currentChecklistData = checklists.find(cl => cl.shift === shiftType);
    if (!currentChecklistData) return;

    const activitySection = currentChecklistData.sections.find(sec => sec.title === "Activity of The Day (Daily Routine)");
    
    if (!activitySection) {
       toast({
        title: "Missing Section",
        description: `The 'Activity of The Day' section is missing for the ${shiftType} shift.`,
        variant: "destructive",
      });
      return;
    }

    const allActivityItems = activitySection.items;
    const allChecked = allActivityItems.every(item => item.checked);

    if (allChecked) {
      toast({
        title: "Shift Turnover Activities Complete",
        description: `${shiftType} shift 'Activity of The Day' checklist has been successfully submitted.`,
      });
      setChecklists((prevChecklists) =>
        prevChecklists.map((cl) =>
          cl.shift === shiftType
            ? {
                ...cl,
                sections: cl.sections.map(section => 
                  section.title === "Activity of The Day (Daily Routine)" 
                  ? { ...section, items: section.items.map(item => ({ ...item, checked: false })) }
                  : section
                ),
              }
            : cl
        )
      );
    } else {
      toast({
        title: "Incomplete 'Activity of The Day'",
        description: `Please complete all items in the 'Activity of The Day' section for the ${shiftType} shift.`,
        variant: "destructive",
      });
    }
    setIsConfirmDialogOpen(false);
  };

  const isSubmitDisabled = (shiftType: ShiftType): boolean => {
    const currentChecklistData = checklists.find(cl => cl.shift === shiftType);
    if (!currentChecklistData) return true;
    const activitySection = currentChecklistData.sections.find(sec => sec.title === "Activity of The Day (Daily Routine)");
    if (!activitySection) return true;
    return !activitySection.items.some(item => item.checked);
  };

 const allPermitsForTable = useMemo(() => {
    const todayStart = startOfDay(currentDate);
    const todayEnd = endOfDay(currentDate);
    
    return permits.filter(permit => {
      const validFromDate = parseISO(permit.validFrom);
      const validToDate = permit.validTo ? parseISO(permit.validTo) : todayEnd; 
      const actualEndTime = permit.actualEndTime ? parseISO(permit.actualEndTime) : null;
      const actualStartTime = permit.actualStartTime ? parseISO(permit.actualStartTime) : null;

      switch (permit.status) {
        case "Not Started":
          return isSameDay(validFromDate, currentDate);
        case "In Progress":
          return isWithinInterval(todayStart, { start: validFromDate, end: validToDate }) ||
                 (actualStartTime ? actualStartTime <= todayEnd && (!actualEndTime || actualEndTime >= todayStart) : false);
        case "Completed":
          return actualEndTime ? isSameDay(actualEndTime, currentDate) : false;
        case "Closed":
          return actualEndTime ? isSameDay(actualEndTime, currentDate) : false;
        case "Postponed":
          return isSameDay(validFromDate, currentDate); 
        case "Cancelled":
          return isSameDay(validFromDate, currentDate);
        default:
          return false;
      }
    }).sort((a,b) => parseISO(b.validFrom).getTime() - parseISO(a.validFrom).getTime());
  }, [permits, currentDate]);

  const permitSummaryCounts = useMemo(() => {
    let realized = 0;
    let unrealized = 0;

    allPermitsForTable.forEach(permit => {
      const actualEndTime = permit.actualEndTime ? parseISO(permit.actualEndTime) : null;

      if (permit.status === "In Progress" || 
          (permit.status === "Completed" && actualEndTime && isSameDay(actualEndTime, currentDate)) ||
          (permit.status === "Closed" && actualEndTime && isSameDay(actualEndTime, currentDate))
      ) {
        realized++;
      } else if (
        (permit.status === "Not Started" && isSameDay(parseISO(permit.validFrom), currentDate)) ||
        (permit.status === "Postponed" && isSameDay(parseISO(permit.validFrom), currentDate)) ||
        (permit.status === "Cancelled" && isSameDay(parseISO(permit.validFrom), currentDate)) // Include Cancelled for today in unrealized
      ) {
        unrealized++;
      }
    });
    return { realized, unrealized };
  }, [allPermitsForTable, currentDate]);


  const currentShiftChecklist = useMemo(() => {
    return checklists.find(cl => cl.shift === selectedShift);
  }, [checklists, selectedShift]);

  const currentActivitySection = useMemo(() => {
    return currentShiftChecklist?.sections.find(sec => sec.title === "Activity of The Day (Daily Routine)");
  }, [currentShiftChecklist]);

  const currentPersonnelActivities = useMemo(() => {
    return personnelLogData.find(pa => pa.shift === selectedShift)?.activitiesByPersonnel || [];
  }, [personnelLogData, selectedShift]);

  const handleAddPersonToLog = () => {
    if (!newPersonName.trim()) {
      toast({ title: "Invalid Name", description: "Person's name cannot be empty.", variant: "destructive" });
      return;
    }
    setPersonnelLogData(prevData => {
      const shiftLogIndex = prevData.findIndex(log => log.shift === selectedShift);
      if (shiftLogIndex === -1) { 
        toast({ title: "Error", description: `Shift log for ${selectedShift} not found.`, variant: "destructive" });
        return prevData;
      }

      const updatedShiftLog = { ...prevData[shiftLogIndex] };
      if (updatedShiftLog.activitiesByPersonnel.find(p => p.personnelName.toLowerCase() === newPersonName.trim().toLowerCase())) {
        toast({ title: "Person Exists", description: `${newPersonName.trim()} is already in this shift's log.`, variant: "default" });
        return prevData;
      }
      
      updatedShiftLog.activitiesByPersonnel = [
        ...updatedShiftLog.activitiesByPersonnel,
        { personnelName: newPersonName.trim(), activities: [] }
      ];

      const newData = [...prevData];
      newData[shiftLogIndex] = updatedShiftLog;
      return newData;
    });

    toast({ title: "Person Added", description: `${newPersonName.trim()} added to ${selectedShift} shift log.` });
    setIsAddPersonDialogOpen(false);
    setNewPersonName("");
  };

  const openAddActivityDialog = (personName: string) => {
    setTargetPersonForActivity(personName);
    setNewActivityText("");
    setNewActivityStatus("Pending");
    setIsAddActivityDialogOpen(true);
  };

  const handleAddActivityForPerson = () => {
    if (!targetPersonForActivity || !newActivityText.trim()) {
      toast({ title: "Missing Info", description: "Activity text cannot be empty.", variant: "destructive" });
      return;
    }

    setPersonnelLogData(prevData => {
      return prevData.map(shiftLog => {
        if (shiftLog.shift === selectedShift) {
          return {
            ...shiftLog,
            activitiesByPersonnel: shiftLog.activitiesByPersonnel.map(personLog => {
              if (personLog.personnelName === targetPersonForActivity) {
                return {
                  ...personLog,
                  activities: [
                    ...personLog.activities,
                    { text: newActivityText.trim(), status: newActivityStatus }
                  ]
                };
              }
              return personLog;
            })
          };
        }
        return shiftLog;
      });
    });

    toast({ title: "Activity Added", description: `Activity added for ${targetPersonForActivity}.` });
    setIsAddActivityDialogOpen(false);
    setTargetPersonForActivity(null);
  };

  const handleUpdatePermitStatus = (permitId: string, newStatus: PermitStatus) => {
    setPermits(prevPermits => 
      prevPermits.map(permit => {
        if (permit.id === permitId) {
          const updatedPermit = { ...permit, status: newStatus };
          if (newStatus === 'In Progress' && !permit.actualStartTime) {
            updatedPermit.actualStartTime = new Date().toISOString();
          }
          if ((newStatus === 'Closed' || newStatus === 'Completed') && !permit.actualEndTime) {
            updatedPermit.actualEndTime = new Date().toISOString();
          }
           if (newStatus !== 'In Progress' && newStatus !== 'Completed' && newStatus !== 'Closed') {
             // If moving away from a state that sets a timestamp, don't clear it,
             // but also don't auto-set it again if it's already set.
           }
          return updatedPermit;
        }
        return permit;
      })
    );
    toast({ title: "Permit Status Updated", description: `Permit ${permitId} status changed to ${newStatus}.` });
  };


  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Activity of The Day</h1>
          <p className="text-muted-foreground mt-1">
            Complete daily routines, review permit statuses, and log personnel activities for smooth handover.
          </p>
        </div>
        <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="w-full sm:w-auto"
              disabled={isSubmitDisabled(selectedShift)}
            >
              Finalize {selectedShift} Shift Daily Routine
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Confirm Shift Finalization</DialogTitle>
              <DialogDesc>
                Are you sure you want to finalize the <strong>{selectedShift}</strong> shift's daily routine checklist?
              </DialogDesc>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsConfirmDialogOpen(false)}>Cancel</Button>
              <Button onClick={() => executeFinalizeShift(selectedShift)}>Confirm & Finalize</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      <Card className="shadow-md bg-card-foreground/5">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
            <CardTitle className="text-xl">Activity of The Day (Daily Routine)</CardTitle>
            <RadioGroup 
              value={selectedShift} 
              onValueChange={(value) => setSelectedShift(value as ShiftType)} 
              className="flex space-x-2 sm:space-x-4"
            >
              {shiftOptions.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.value} id={`r-${option.value}`} />
                  <Label htmlFor={`r-${option.value}`} className="text-sm font-medium cursor-pointer">{option.label}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {currentActivitySection?.items.map((item) => (
            <div
              key={item.id}
              className="flex items-center space-x-3 p-3 bg-background/50 rounded-md hover:bg-accent/10 transition-colors"
            >
              <Checkbox
                id={`${selectedShift}-${currentActivitySection.title.replace(/\s+/g, '-')}-${item.id}`}
                checked={item.checked}
                onCheckedChange={(checked) =>
                  handleChecklistItemChange(selectedShift, currentActivitySection.title, item.id, !!checked)
                }
                aria-labelledby={`label-${selectedShift}-${currentActivitySection.title.replace(/\s+/g, '-')}-${item.id}`}
              />
              <Label
                htmlFor={`${selectedShift}-${currentActivitySection.title.replace(/\s+/g, '-')}-${item.id}`}
                id={`label-${selectedShift}-${currentActivitySection.title.replace(/\s+/g, '-')}-${item.id}`}
                className="flex-1 text-sm cursor-pointer"
              >
                {item.label}
              </Label>
            </div>
          )) ?? <p className="text-sm text-muted-foreground">No daily routine items for this shift.</p>}
        </CardContent>
      </Card>

      <Card className="shadow-md bg-card-foreground/5">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div className="flex-1">
              <CardTitle className="text-xl">Permit to Work Overview (Today)</CardTitle>
              <CardDescription>
                Summary and assignments of permits relevant for today: {format(currentDate, "dd MMMM yyyy")}. Click status to update.
              </CardDescription>
            </div>
            <div className="flex gap-3 text-sm flex-shrink-0 mt-2 sm:mt-0">
                <div className="flex items-center gap-1.5 p-2 border rounded-md bg-background/50">
                    <span className="font-semibold text-primary">{permitSummaryCounts.realized}</span>
                    <span className="text-muted-foreground">Realized</span>
                </div>
                 <div className="flex items-center gap-1.5 p-2 border rounded-md bg-background/50">
                    <span className="font-semibold text-secondary">{permitSummaryCounts.unrealized}</span>
                    <span className="text-muted-foreground">Unrealized/Pending</span>
                </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {allPermitsForTable.length > 0 ? (
            <ScrollArea className="w-full"> {/* Removed max-h from here */}
              <div className="space-y-4">
                {allPermitsForTable.map(permit => (
                  <Card key={permit.id} className="shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="p-3 sm:p-4">
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                        <div className="flex-1">
                          <CardTitle className="text-base sm:text-lg font-semibold">
                            [PTW-{permit.id}] {permit.activityName}
                          </CardTitle>
                          <p className="text-xs text-muted-foreground mt-0.5">{permit.location}</p>
                        </div>
                        <div className="flex gap-2 items-center flex-shrink-0 mt-1 sm:mt-0 self-start sm:self-center">
                          <Select value={permit.status} onValueChange={(newStatus) => handleUpdatePermitStatus(permit.id, newStatus as PermitStatus)}>
                            <SelectTrigger 
                              className={cn(
                                "h-auto p-0 border-0 bg-transparent focus:ring-0 focus:ring-offset-0 w-auto",
                                "[&>svg]:hidden" // Hide the default chevron
                              )}
                              aria-label={`Update status for permit ${permit.id}`}
                            >
                              <Badge 
                                variant={permitStatusToBadgeVariant(permit.status)} 
                                className="cursor-pointer hover:opacity-80 transition-opacity min-w-[7rem] flex justify-center py-1 text-xs"
                              >
                                {permit.status}
                              </Badge>
                            </SelectTrigger>
                            <SelectContent>
                              {permitStatusOptions.map(option => (
                                <SelectItem key={option} value={option} className="text-xs">{option}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {permit.category && <Badge variant="outline" className="text-xs">{permit.category}</Badge>}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-4 pt-0 space-y-1.5 text-sm">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                        <div><strong>PIC:</strong> {permit.assignedTo}</div>
                        {permit.vendor && <div><strong>Vendor:</strong> {permit.vendor}</div>}
                        {permit.incidentId && <div><strong>Incident ID:</strong> {permit.incidentId}</div>}
                      </div>
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground pt-1">
                        <div>Valid From: <ClientFormattedTimestamp isoString={permit.validFrom} type="short" /></div>
                        <div>Valid To: <ClientFormattedTimestamp isoString={permit.validTo} type="short" /></div>
                        {permit.actualStartTime && <div>Actual Start: <ClientFormattedTimestamp isoString={permit.actualStartTime} type="short" /></div>}
                        {permit.actualEndTime && <div>Actual End: <ClientFormattedTimestamp isoString={permit.actualEndTime} type="short" /></div>}
                      </div>
                      {permit.remarks && (
                        <div className="pt-1">
                          <strong className="text-xs text-foreground/80">Remarks:</strong>
                          <p className="text-xs text-muted-foreground whitespace-pre-wrap bg-muted/30 p-2 rounded-sm mt-0.5">{permit.remarks}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          ) : <p className="text-sm text-muted-foreground text-center py-4">No permits relevant for today.</p>}
        </CardContent>
      </Card>


      <Card className="shadow-md bg-card-foreground/5">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl">Personnel Activity Log</CardTitle>
            <CardDescription>Key activities performed by personnel during the <strong>{selectedShift}</strong> shift.</CardDescription>
          </div>
          <Dialog open={isAddPersonDialogOpen} onOpenChange={setIsAddPersonDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" onClick={() => { setNewPersonName(""); setIsAddPersonDialogOpen(true); }}>
                <UserPlus className="mr-2 h-4 w-4" /> Add Person
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add Person to {selectedShift} Shift Log</DialogTitle>
                <DialogDesc>Enter the name of the person to add to this shift's activity log.</DialogDesc>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <Label htmlFor="newPersonName">Person's Name</Label>
                <Input id="newPersonName" value={newPersonName} onChange={(e) => setNewPersonName(e.target.value)} placeholder="e.g., John Doe"/>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddPersonDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleAddPersonToLog}>Add Person</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent> {/* Removed ScrollArea and max-h from here */}
          {currentPersonnelActivities.length > 0 ? (
              <div className="space-y-4">
                {currentPersonnelActivities.map(person => (
                  <div key={person.personnelName}>
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-md font-semibold text-primary">{person.personnelName}</h4>
                      <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => openAddActivityDialog(person.personnelName)}>
                        <PlusCircle className="mr-1 h-3.5 w-3.5"/> Add Activity
                      </Button>
                    </div>
                    {person.activities.length > 0 ? (
                      <ul className="space-y-1 pl-2">
                        {person.activities.map((activity, index) => (
                          <li key={index} className="flex items-center justify-between text-sm text-muted-foreground ml-2 border-l-2 pl-3 border-border/40 py-0.5">
                            <span>- {activity.text}</span>
                            <Badge variant={personnelActivityStatusToBadgeVariant(activity.status)} className="text-xs">
                              {activity.status}
                            </Badge>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-muted-foreground ml-4 pl-3 italic">No activities logged for {person.personnelName} yet.</p>
                    )}
                  </div>
                ))}
              </div>
          ) : <p className="text-sm text-muted-foreground text-center py-4">No personnel activities logged for the {selectedShift} shift yet. Click "Add Person" to start.</p>}
        </CardContent>
      </Card>

      {/* Add Activity Dialog */}
      {targetPersonForActivity && (
        <Dialog open={isAddActivityDialogOpen} onOpenChange={setIsAddActivityDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Activity for {targetPersonForActivity}</DialogTitle>
              <DialogDesc>Log a new activity for {targetPersonForActivity} during the {selectedShift} shift.</DialogDesc>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div>
                <Label htmlFor="newActivityText">Activity Description</Label>
                <Textarea id="newActivityText" value={newActivityText} onChange={(e) => setNewActivityText(e.target.value)} className="mt-1 min-h-[80px]" placeholder="Describe the activity..."/>
              </div>
              <div>
                <Label htmlFor="newActivityStatus">Status</Label>
                <Select value={newActivityStatus} onValueChange={(value) => setNewActivityStatus(value as PersonnelActivityStatus)}>
                  <SelectTrigger id="newActivityStatus" className="mt-1">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {personnelActivityStatusOptions.map(status => (
                      <SelectItem key={status} value={status}>{status}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddActivityDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleAddActivityForPerson}>Add Activity</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

