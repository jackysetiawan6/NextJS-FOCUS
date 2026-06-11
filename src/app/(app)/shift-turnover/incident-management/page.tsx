
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { IncidentReport, IncidentStatus, ProgressUpdate } from "@/types";
import React, { useState, useMemo, useEffect } from 'react';
import { 
  PlusCircle, Edit3, MessageSquare, User, Clock, AlertTriangle, 
  FilePlus2, Activity as ActivityIconLucide, Wrench, PackageSearch, Hourglass, CheckCircle2, Archive,
  ListFilter, SearchIcon, Save
} from "lucide-react";
import { ClientFormattedTimestamp } from "@/components/shared/client-formatted-timestamp";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription as DialogDesc, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { format, parseISO, isValid } from 'date-fns';
import { ScrollArea } from "@/components/ui/scroll-area";
import { initialIncidents } from "@/lib/data";

const ALL_STATUSES_KEY = 'all';

const statusToBadgeVariant = (status: IncidentStatus): "default" | "secondary" | "destructive" | "outline" => {
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

const urgencyOptions: IncidentReport['urgency'][] = ['Critical', 'High', 'Medium', 'Low'];

const urgencyToBadgeVariant = (urgency: IncidentReport['urgency']): "default" | "secondary" | "destructive" | "outline" => {
  switch (urgency) {
    case 'Critical': return 'destructive';
    case 'High': return 'secondary';
    case 'Medium': return 'default';
    case 'Low': return 'outline';
    default: return 'outline';
  }
};

const statusIcons: Record<IncidentStatus | 'all', React.ElementType> = {
  all: ListFilter,
  Logged: FilePlus2,
  Active: ActivityIconLucide,
  "Waiting for Maintenance": Wrench,
  "Waiting for Spare Part": PackageSearch,
  "Waiting for Resolution": Hourglass,
  Resolved: CheckCircle2,
  Closed: Archive,
};

const incidentStatusOrder: (IncidentStatus | 'all')[] = [
  'all', 'Active', 'Waiting for Maintenance', 'Waiting for Spare Part', 'Waiting for Resolution', 'Logged', 'Resolved', 'Closed'
];

const formatTimestampForInput = (isoString: string | null | undefined): string => {
  if (!isoString) return "";
  try {
    const date = parseISO(isoString);
    if (!isValid(date)) return "";
    return format(date, "yyyy-MM-dd'T'HH:mm");
  } catch (error) {
    console.error("Error formatting timestamp for input:", error);
    return "";
  }
};

interface GroupedProgressUpdate {
  date: string; 
  updates: { text: string, timestamp: string }[];
}

const groupProgressUpdatesByDate = (updates: ProgressUpdate[]): GroupedProgressUpdate[] => {
  if (!updates || updates.length === 0) return [];

  const grouped = updates.reduce((acc, update) => {
    try {
      const dateKey = format(parseISO(update.timestamp), 'yyyy-MM-dd'); 
      const displayDate = format(parseISO(update.timestamp), 'dd MMMM yyyy'); 
      if (!acc[dateKey]) {
        acc[dateKey] = { date: displayDate, updates: [] };
      }
      acc[dateKey].updates.push({ text: update.text, timestamp: update.timestamp });
    } catch (e) {
      // console.error("Error parsing update timestamp:", update.timestamp, e);
    }
    return acc;
  }, {} as Record<string, { date: string; updates: { text: string, timestamp: string }[] }>);

  return Object.keys(grouped)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime()) // Sort dates: newest first
    .map(dateKey => {
      // Sort updates within each day: newest first
      grouped[dateKey].updates.sort((a, b) => parseISO(b.timestamp).getTime() - parseISO(a.timestamp).getTime());
      return grouped[dateKey];
    });
};


export default function IncidentManagementPage() {
  const { toast } = useToast();
  const [incidents, setIncidents] = useState<IncidentReport[]>(initialIncidents);
  const [selectedFilterStatus, setSelectedFilterStatus] = useState<IncidentStatus | 'all'>('all');
  const [incidentIdSearchTerm, setIncidentIdSearchTerm] = useState<string>("");

  const [isAddIncidentDialogOpen, setIsAddIncidentDialogOpen] = useState(false);
  const [newIncidentData, setNewIncidentData] = useState<Partial<Omit<IncidentReport, 'id' | 'progressUpdates' | 'reportedAt' | 'lastUpdatedAt'>>>({
    title: "", description: "", urgency: "Medium", assignedTo: "", status: "Logged"
  });

  const [isEditIncidentDialogOpen, setIsEditIncidentDialogOpen] = useState(false);
  const [editingIncident, setEditingIncident] = useState<IncidentReport | null>(null);
  
  const [isAddUpdateDialogOpen, setIsAddUpdateDialogOpen] = useState(false);
  const [updateIncidentTarget, setUpdateIncidentTarget] = useState<IncidentReport | null>(null);
  const [newProgressUpdateText, setNewProgressUpdateText] = useState("");
  const [useCurrentTimeForUpdate, setUseCurrentTimeForUpdate] = useState(true);
  const [manualUpdateTimestamp, setManualUpdateTimestamp] = useState(formatTimestampForInput(new Date().toISOString()));


  const incidentStatusSummary = useMemo(() => {
    const counts: Record<IncidentStatus, number> = {
      Logged: 0, Active: 0, "Waiting for Maintenance": 0, "Waiting for Spare Part": 0,
      "Waiting for Resolution": 0, Resolved: 0, Closed: 0,
    };
    incidents.forEach(incident => {
      counts[incident.status]++;
    });
    
    const summaryArray = incidentStatusOrder.map(statusKey => ({
      status: statusKey,
      count: statusKey === 'all' ? incidents.length : counts[statusKey as IncidentStatus],
      Icon: statusIcons[statusKey],
    }));
    return summaryArray;
  }, [incidents]);

  const filteredIncidents = useMemo(() => {
    return incidents.filter(incident => {
      const statusMatch = selectedFilterStatus === 'all' || incident.status === selectedFilterStatus;
      const idSearchLower = incidentIdSearchTerm.toLowerCase();
      const idMatch = incidentIdSearchTerm === "" || incident.id.toString().toLowerCase().includes(idSearchLower) || `inc-${incident.id.toString().toLowerCase()}`.includes(idSearchLower) ;
      return statusMatch && idMatch;
    });
  }, [incidents, selectedFilterStatus, incidentIdSearchTerm]);

  const handleOpenAddIncidentDialog = () => {
    setNewIncidentData({ title: "", description: "", urgency: "Medium", assignedTo: "", status: "Logged" });
    setIsAddIncidentDialogOpen(true);
  };

  const handleAddIncidentSubmit = () => {
    if (!newIncidentData.title || !newIncidentData.description || !newIncidentData.urgency) {
      toast({ title: "Missing Fields", description: "Please fill in title, description, and urgency.", variant: "destructive" });
      return;
    }
    const newId = Date.now().toString(); 
    const currentTime = new Date().toISOString();
    const incidentToAdd: IncidentReport = {
      id: newId,
      title: newIncidentData.title,
      description: newIncidentData.description,
      urgency: newIncidentData.urgency,
      assignedTo: newIncidentData.assignedTo || undefined,
      status: "Logged", 
      reportedAt: currentTime,
      lastUpdatedAt: currentTime,
      progressUpdates: [{ text: "Incident logged.", timestamp: currentTime }],
    };
    setIncidents(prev => [incidentToAdd, ...prev]);
    toast({ title: "Incident Logged", description: `Incident ${newId} created.` });
    setIsAddIncidentDialogOpen(false);
  };
  
  const handleOpenEditIncidentDialog = (incident: IncidentReport) => {
    setEditingIncident(JSON.parse(JSON.stringify(incident))); 
    setIsEditIncidentDialogOpen(true);
  };

  const handleEditIncidentSubmit = () => {
    if (!editingIncident || !editingIncident.title || !editingIncident.description) {
      toast({ title: "Missing Fields", description: "Title and description are required.", variant: "destructive" });
      return;
    }
    const updatedIncident = {
      ...editingIncident,
      lastUpdatedAt: new Date().toISOString(),
    };
    setIncidents(prev => prev.map(inc => inc.id === editingIncident.id ? updatedIncident : inc));
    toast({ title: "Incident Updated", description: `Incident ${editingIncident.id} has been updated.` });
    setIsEditIncidentDialogOpen(false);
    setEditingIncident(null);
  };

  const handleOpenAddUpdateDialog = (incident: IncidentReport) => {
    setUpdateIncidentTarget(incident);
    setNewProgressUpdateText("");
    setUseCurrentTimeForUpdate(true); 
    setManualUpdateTimestamp(formatTimestampForInput(new Date().toISOString())); 
    setIsAddUpdateDialogOpen(true);
  };

  const handleAddUpdateSubmit = () => {
    if (!updateIncidentTarget || !newProgressUpdateText.trim()) {
      toast({ title: "Missing Update", description: "Progress update text cannot be empty.", variant: "destructive" });
      return;
    }

    let timestampForUpdate: string;
    if (useCurrentTimeForUpdate) {
        timestampForUpdate = new Date().toISOString();
    } else {
        if (!manualUpdateTimestamp || !isValid(new Date(manualUpdateTimestamp))) {
            toast({ title: "Invalid Timestamp", description: "Please select a valid date and time for the update.", variant: "destructive" });
            return;
        }
        timestampForUpdate = new Date(manualUpdateTimestamp).toISOString();
    }

    const newUpdate: ProgressUpdate = {
        text: newProgressUpdateText.trim(),
        timestamp: timestampForUpdate,
    };
    setIncidents(prev => prev.map(inc => 
      inc.id === updateIncidentTarget.id 
      ? { ...inc, progressUpdates: [...inc.progressUpdates, newUpdate].sort((a,b) => parseISO(b.timestamp).getTime() - parseISO(a.timestamp).getTime()), lastUpdatedAt: new Date().toISOString() } 
      : inc
    ));
    toast({ title: "Progress Update Added", description: `Update added to incident ${updateIncidentTarget.id}.` });
    setIsAddUpdateDialogOpen(false);
    setUpdateIncidentTarget(null);
  };


  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Incident Management</h1>
          <p className="text-muted-foreground mt-1">
            Track, manage, and resolve operational incidents. Click on a status below to filter.
          </p>
        </div>
        <Button onClick={handleOpenAddIncidentDialog} className="w-full sm:w-auto">
          <PlusCircle className="mr-2 h-5 w-5" /> Add New Incident
        </Button>
      </div>

      <Card className="shadow-md">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-xl">Incident Status Overview</CardTitle>
          <div className="relative w-full max-w-xs">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by INC-ID..."
              value={incidentIdSearchTerm}
              onChange={(e) => setIncidentIdSearchTerm(e.target.value)}
              className="pl-10 h-9"
            />
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-8 gap-3">
            {incidentStatusSummary.map(({ status, count, Icon }) => (
              <Card 
                key={status} 
                className={cn(
                  "hover:shadow-lg transition-all cursor-pointer",
                  selectedFilterStatus === status ? "ring-2 ring-primary shadow-lg bg-primary/10" : "bg-card-foreground/5 hover:bg-card-foreground/10"
                )}
                onClick={() => setSelectedFilterStatus(status)}
              >
                <CardContent className="p-3 flex flex-col items-center justify-center text-center">
                  <Icon className={cn("h-6 w-6 mb-1.5", selectedFilterStatus === status ? "text-primary" : "text-muted-foreground")} />
                  <p className={cn("text-xs font-medium uppercase tracking-wider", selectedFilterStatus === status ? "text-primary font-semibold" : "text-muted-foreground")}>
                    {status === 'all' ? 'All' : status}
                  </p>
                  <p className={cn("text-2xl font-bold", selectedFilterStatus === status ? "text-primary" : "")}>{count}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {filteredIncidents.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-center">
              {incidents.length === 0 ? "No incidents reported yet." : "No incidents match your current filters."}
            </p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-6">
        {filteredIncidents.map((incident) => {
          const groupedUpdatesForCard = groupProgressUpdatesByDate(incident.progressUpdates);
          const lastThreeDaysUpdates = groupedUpdatesForCard.slice(0, 3);

          return (
          <Card key={incident.id} className="shadow-md hover:shadow-lg transition-shadow overflow-hidden">
            <CardHeader className="bg-card-foreground/5 p-4">
              <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-2">
                <CardTitle className="text-lg flex-1 pr-2">[INC-{incident.id}] - {incident.title}</CardTitle>
                <div className="flex gap-2 flex-shrink-0 self-start sm:self-center">
                   <Badge variant={urgencyToBadgeVariant(incident.urgency)} className="text-xs">{incident.urgency}</Badge>
                   <Badge variant={statusToBadgeVariant(incident.status)} className="text-xs">{incident.status}</Badge>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground mt-1.5">
                <div className="flex items-center">
                  <Clock className="h-3.5 w-3.5 mr-1" />
                  Reported: <ClientFormattedTimestamp isoString={incident.reportedAt} type="full" />
                </div>
                {incident.assignedTo && (
                  <div className="flex items-center">
                    <User className="h-3.5 w-3.5 mr-1" />
                    Assigned: {incident.assignedTo}
                  </div>
                )}
                 {incident.lastUpdatedAt && (
                  <div className="flex items-center">
                    <ActivityIconLucide className="h-3.5 w-3.5 mr-1" />
                    Last Update: <ClientFormattedTimestamp isoString={incident.lastUpdatedAt} type="full" />
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground mb-3">{incident.description}</p>
              
              <Separator className="my-3" />
              
              <div className="flex items-center text-sm font-medium mb-1.5">
                <MessageSquare className="h-4 w-4 mr-2 text-primary"/>
                Recent Progress (Last 3 Days with Updates):
              </div>
              {lastThreeDaysUpdates.length > 0 ? (
                <div className="space-y-2 text-xs text-muted-foreground pl-2 mb-4">
                  {lastThreeDaysUpdates.map((group, groupIndex) => (
                    <div key={groupIndex} className={groupIndex > 0 ? "pt-1.5 mt-1.5 border-t border-dashed border-border/50" : ""}>
                      <p className="text-xs font-semibold text-foreground/80 mb-0.5">{group.date}</p>
                      <ul className="list-disc list-inside space-y-0.5 pl-1">
                        {group.updates.map((updateEntry, updateIndex) => ( 
                          <li key={updateIndex} className="text-xs text-muted-foreground">
                             {updateEntry.text}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground mb-4 pl-6">No recent progress updates.</p>
              )}


              <div className="flex gap-2 pt-2 border-t border-dashed">
                <Button variant="outline" size="sm" onClick={() => handleOpenEditIncidentDialog(incident)}>
                  <Edit3 className="mr-1.5 h-4 w-4" /> Edit Details
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleOpenAddUpdateDialog(incident)}>
                  <PlusCircle className="mr-1.5 h-4 w-4" /> Add Update
                </Button>
              </div>
            </CardContent>
          </Card>
        );
        })}
      </div>

      {/* Add Incident Dialog */}
      <Dialog open={isAddIncidentDialogOpen} onOpenChange={setIsAddIncidentDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Incident</DialogTitle>
            <DialogDesc>Log a new operational incident.</DialogDesc>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="newIncTitle" className="text-right">Title</Label>
              <Input id="newIncTitle" value={newIncidentData.title} onChange={(e) => setNewIncidentData(p => ({...p, title: e.target.value}))} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="newIncDesc" className="text-right pt-2">Description</Label>
              <Textarea id="newIncDesc" value={newIncidentData.description} onChange={(e) => setNewIncidentData(p => ({...p, description: e.target.value}))} className="col-span-3 min-h-[80px]" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="newIncUrgency" className="text-right">Urgency</Label>
              <Select value={newIncidentData.urgency} onValueChange={(val) => setNewIncidentData(p => ({...p, urgency: val as IncidentReport['urgency']}))}>
                <SelectTrigger id="newIncUrgency" className="col-span-3"><SelectValue placeholder="Select urgency" /></SelectTrigger>
                <SelectContent>{urgencyOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="newIncAssignedTo" className="text-right">Assigned To</Label>
              <Input id="newIncAssignedTo" value={newIncidentData.assignedTo} onChange={(e) => setNewIncidentData(p => ({...p, assignedTo: e.target.value}))} className="col-span-3" placeholder="Optional"/>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddIncidentDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddIncidentSubmit}><Save className="mr-2 h-4 w-4"/>Log Incident</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Incident Dialog */}
      {editingIncident && (
        <Dialog open={isEditIncidentDialogOpen} onOpenChange={(open) => {if(!open) setEditingIncident(null); setIsEditIncidentDialogOpen(open);}}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>Edit Incident: [INC-{editingIncident.id}]</DialogTitle>
              <DialogDesc>Update details for the selected incident.</DialogDesc>
            </DialogHeader>
            <ScrollArea className="max-h-[calc(90vh-200px)] p-1">
              <div className="space-y-4 py-4 pr-2">
                <div className="grid grid-cols-4 items-center gap-x-4 gap-y-2">
                  <Label htmlFor="editIncTitle" className="text-right col-span-1">Title</Label>
                  <Input id="editIncTitle" value={editingIncident.title} onChange={(e) => setEditingIncident(p => p ? {...p, title: e.target.value} : null)} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-start gap-x-4 gap-y-2">
                  <Label htmlFor="editIncDesc" className="text-right pt-2 col-span-1">Description</Label>
                  <Textarea id="editIncDesc" value={editingIncident.description} onChange={(e) => setEditingIncident(p => p ? {...p, description: e.target.value} : null)} className="col-span-3 min-h-[80px]" />
                </div>
                <div className="grid grid-cols-4 items-center gap-x-4 gap-y-2">
                  <Label htmlFor="editIncUrgency" className="text-right col-span-1">Urgency</Label>
                  <Select value={editingIncident.urgency} onValueChange={(val) => setEditingIncident(p => p ? {...p, urgency: val as IncidentReport['urgency']} : null)}>
                    <SelectTrigger id="editIncUrgency" className="col-span-3"><SelectValue /></SelectTrigger>
                    <SelectContent>{urgencyOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-x-4 gap-y-2">
                  <Label htmlFor="editIncAssignedTo" className="text-right col-span-1">Assigned To</Label>
                  <Input id="editIncAssignedTo" value={editingIncident.assignedTo || ""} onChange={(e) => setEditingIncident(p => p ? {...p, assignedTo: e.target.value} : null)} className="col-span-3" />
                </div>
                 <div className="grid grid-cols-4 items-center gap-x-4 gap-y-2">
                  <Label htmlFor="editIncStatus" className="text-right col-span-1">Status</Label>
                  <Select 
                    value={editingIncident.status} 
                    onValueChange={(val) => setEditingIncident(p => p ? {...p, status: val as IncidentStatus} : null)}
                    disabled={editingIncident.status === "Closed"}
                  >
                    <SelectTrigger id="editIncStatus" className="col-span-3"><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.keys(statusIcons).filter(s => s !== 'all').map(opt => <SelectItem key={opt} value={opt} disabled={opt === "Closed" && editingIncident.status !== "Closed"}>{opt}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                
                <Separator className="my-3" />
                
                <h4 className="text-sm font-medium">Progress History:</h4>
                {(editingIncident.progressUpdates && editingIncident.progressUpdates.length > 0) ? (
                  <ScrollArea className="border p-3 rounded-md bg-muted/20">
                    <div className="space-y-2"> {/* Adjusted for consistent spacing between date groups */}
                      {groupProgressUpdatesByDate(editingIncident.progressUpdates).map((group, groupIndex) => (
                        <div key={groupIndex} className={groupIndex > 0 ? "pt-2" : ""}> {/* Added pt-2 for groups after the first */}
                          <p className="text-xs font-semibold text-foreground/90 mb-1">{group.date}</p>
                          <ul className="list-disc list-inside space-y-1 pl-2">
                            {group.updates.map((updateEntry, updateIndex) => (
                              <li key={updateIndex} className="text-xs text-muted-foreground">
                                {updateEntry.text}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <p className="text-xs text-muted-foreground">No progress updates recorded.</p>
                )}
              </div>
            </ScrollArea>
            <DialogFooter className="pt-4">
              <Button variant="outline" onClick={() => setIsEditIncidentDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleEditIncidentSubmit}><Save className="mr-2 h-4 w-4"/>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Add Update Dialog */}
      {updateIncidentTarget && (
        <Dialog open={isAddUpdateDialogOpen} onOpenChange={(open) => {if(!open) setUpdateIncidentTarget(null); setIsAddUpdateDialogOpen(open);}}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Progress Update to [INC-{updateIncidentTarget.id}]</DialogTitle>
              <DialogDesc>Enter the new progress details for this incident.</DialogDesc>
            </DialogHeader>
            <div className="grid gap-4 py-4">
               <Textarea 
                id="newProgressUpdate" 
                value={newProgressUpdateText} 
                onChange={(e) => setNewProgressUpdateText(e.target.value)} 
                className="min-h-[100px]"
                placeholder="Describe the latest progress..."
              />
              <div className="flex items-center space-x-2 mt-2">
                <Checkbox
                  id="useCurrentTime"
                  checked={useCurrentTimeForUpdate}
                  onCheckedChange={(checked) => {
                    const isChecked = !!checked;
                    setUseCurrentTimeForUpdate(isChecked);
                    if (isChecked) { 
                      setManualUpdateTimestamp(formatTimestampForInput(new Date().toISOString()));
                    }
                  }}
                />
                <Label htmlFor="useCurrentTime" className="text-sm">Use Current Time</Label>
              </div>
              {!useCurrentTimeForUpdate && (
                <div className="grid grid-cols-4 items-center gap-4 mt-1">
                  <Label htmlFor="manualUpdateTimestamp" className="text-right text-sm">
                    Timestamp
                  </Label>
                  <Input
                    id="manualUpdateTimestamp"
                    type="datetime-local"
                    value={manualUpdateTimestamp}
                    onChange={(e) => setManualUpdateTimestamp(e.target.value)}
                    className="col-span-3 h-9"
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddUpdateDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleAddUpdateSubmit}><PlusCircle className="mr-2 h-4 w-4"/>Add Update</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}


    