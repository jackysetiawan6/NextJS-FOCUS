
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription as DialogDesc, DialogFooter } from "@/components/ui/dialog"; // Renamed DialogDescription
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import React, { useState, useMemo, useEffect } from 'react';
import type { FireSystemIsolationEntry, FireSystemIsolationStatus } from "@/types";
import { 
  initialFireSystemIsolations, 
  fireIsolationStatusOptions, 
  defaultFireIsolationFormData 
} from "@/lib/data"; 
import { PlusCircle, FileText, CalendarDays, Search, ArrowDownUp, Flame, User, Clock, MapPin } from "lucide-react";
import { format, parseISO, isSameDay, isValid, addDays } from 'date-fns';
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ClientFormattedTimestamp } from "@/components/shared/client-formatted-timestamp";
import { Separator } from "@/components/ui/separator";

const fireIsolationStatusFilterOptions: (FireSystemIsolationStatus | 'all')[] = ['all', ...fireIsolationStatusOptions];

const getFireIsolationStatusBadgeVariant = (status: FireSystemIsolationStatus): "destructive" | "secondary" | "default" | "outline" => {
  switch (status) {
    case "Active": return "destructive";
    case "Pending Removal": return "secondary";
    case "Extended": return "secondary";
    case "Removed": return "default";
    default: return "outline";
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

export default function FireIsolationsPage() {
  const { toast } = useToast();
  const [fireSystemIsolations, setFireSystemIsolations] = useState<FireSystemIsolationEntry[]>(initialFireSystemIsolations);
  const [isFireIsolationDialogOpen, setIsFireIsolationDialogOpen] = useState(false);
  const [currentFireIsolation, setCurrentFireIsolation] = useState<Omit<FireSystemIsolationEntry, 'id' | 'status'>>(defaultFireIsolationFormData);
  const [editingFireIsolationId, setEditingFireIsolationId] = useState<string | null>(null);

  const [searchTermFireIsolations, setSearchTermFireIsolations] = useState<string>("");
  const [selectedStatusFireIsolations, setSelectedStatusFireIsolations] = useState<FireSystemIsolationStatus | 'all'>('Active');
  const [selectedDateFireIsolations, setSelectedDateFireIsolations] = useState<Date | undefined>(undefined);
  const [sortOrderFireIsolations, setSortOrderFireIsolations] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    setSelectedDateFireIsolations(new Date());
  }, []);

  const handleFireIsolationFormChange = (field: keyof Omit<FireSystemIsolationEntry, 'id' | 'status'>, value: string | null) => {
    setCurrentFireIsolation(prev => ({ ...prev, [field]: value }));
  };

  const handleOpenNewFireIsolationDialog = () => {
    setEditingFireIsolationId(null);
    setCurrentFireIsolation({...defaultFireIsolationFormData, isolationStartTime: new Date().toISOString(), expectedRemovalTime: addDays(new Date(), 1).toISOString()});
    setIsFireIsolationDialogOpen(true);
  };

  const handleOpenEditFireIsolationDialog = (isolation: FireSystemIsolationEntry) => {
    setEditingFireIsolationId(isolation.id);
    setCurrentFireIsolation({
      unitOrSystem: isolation.unitOrSystem,
      areaImpacted: isolation.areaImpacted,
      isolatedBy: isolation.isolatedBy,
      reasonForIsolation: isolation.reasonForIsolation,
      lotoTagNumber: isolation.lotoTagNumber,
      isolationStartTime: isolation.isolationStartTime,
      expectedRemovalTime: isolation.expectedRemovalTime,
      actualRemovalTime: isolation.actualRemovalTime,
      notes: isolation.notes,
    });
    setIsFireIsolationDialogOpen(true);
  };

  const handleFireIsolationSubmit = () => {
    if (!currentFireIsolation.unitOrSystem || !currentFireIsolation.areaImpacted || !currentFireIsolation.isolatedBy || !currentFireIsolation.reasonForIsolation || !currentFireIsolation.isolationStartTime || !currentFireIsolation.expectedRemovalTime) {
      toast({ title: "Missing Fields", description: "Please fill in all required fire isolation details.", variant: "destructive" });
      return;
    }
     if (!isValid(parseISO(currentFireIsolation.isolationStartTime)) || !isValid(parseISO(currentFireIsolation.expectedRemovalTime))) {
      toast({ title: "Invalid Dates", description: "Please ensure start and expected removal times are valid dates.", variant: "destructive" });
      return;
    }

    if (editingFireIsolationId) {
      setFireSystemIsolations(prev => prev.map(iso => iso.id === editingFireIsolationId ? { ...iso, ...currentFireIsolation, id: editingFireIsolationId, status: iso.status } : iso));
      toast({ title: "Fire Isolation Updated", description: "Fire isolation log has been successfully updated." });
    } else {
      const newIsolation: FireSystemIsolationEntry = {
        ...currentFireIsolation,
        id: `fsi-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        status: "Active",
      };
      setFireSystemIsolations(prev => [newIsolation, ...prev]);
      toast({ title: "New Fire Isolation Logged", description: "Fire isolation has been successfully logged." });
    }
    setIsFireIsolationDialogOpen(false);
    setEditingFireIsolationId(null);
  };

  const handleUpdateFireIsolationStatus = (id: string, newStatus: FireSystemIsolationStatus) => {
    setFireSystemIsolations(prev => prev.map(iso => {
      if (iso.id === id) {
        const updatedIso = { ...iso, status: newStatus };
        if (newStatus === "Removed" && !iso.actualRemovalTime) {
          updatedIso.actualRemovalTime = new Date().toISOString();
        }
        return updatedIso;
      }
      return iso;
    }));
    toast({ title: "Isolation Status Updated", description: `Status set to ${newStatus}.` });
  };

  const getFireIsolationDialogTitle = () => {
    if (editingFireIsolationId) {
      const isolation = fireSystemIsolations.find(iso => iso.id === editingFireIsolationId);
      return `Isolation Details: ${isolation ? isolation.unitOrSystem.substring(0,30) + (isolation.unitOrSystem.length > 30 ? "..." : "") : "Edit Isolation"}`;
    }
    return "Add New Fire System Isolation Log";
  };

  const toggleSortOrderFireIsolations = () => {
    setSortOrderFireIsolations(prev => (prev === 'desc' ? 'asc' : 'desc'));
  };

  const filteredFireIsolations = useMemo(() => {
    return fireSystemIsolations.filter(iso => {
      const searchLower = searchTermFireIsolations.toLowerCase();
      const searchMatch = searchTermFireIsolations === "" ||
        iso.unitOrSystem.toLowerCase().includes(searchLower) ||
        iso.areaImpacted.toLowerCase().includes(searchLower) ||
        iso.isolatedBy.toLowerCase().includes(searchLower) ||
        (iso.reasonForIsolation && iso.reasonForIsolation.toLowerCase().includes(searchLower)) ||
        (iso.lotoTagNumber && iso.lotoTagNumber.toLowerCase().includes(searchLower));

      const statusMatch = selectedStatusFireIsolations === 'all' || iso.status === selectedStatusFireIsolations;

      let dateMatch = true;
      if (selectedDateFireIsolations) {
        try {
          dateMatch = isSameDay(parseISO(iso.isolationStartTime), selectedDateFireIsolations);
        } catch (error) {
          dateMatch = false;
        }
      }
      return searchMatch && statusMatch && dateMatch;
    })
    .sort((a, b) => {
      try {
        const dateA = parseISO(a.isolationStartTime).getTime();
        const dateB = parseISO(b.isolationStartTime).getTime();
        return sortOrderFireIsolations === 'desc' ? dateB - dateA : dateA - dateB;
      } catch (error) {
        return 0;
      }
    });
  }, [fireSystemIsolations, searchTermFireIsolations, selectedStatusFireIsolations, selectedDateFireIsolations, sortOrderFireIsolations]);

  return (
    <TooltipProvider>
    <div className="space-y-6 flex flex-col h-full">
      <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-2">
        <div className="flex-grow">
          <h1 className="text-3xl font-bold tracking-tight">Fire Protection System Isolations</h1>
          <p className="text-muted-foreground">
            Log and manage active or recent fire system isolations. Default view shows isolations active today.
          </p>
        </div>
        <Button onClick={handleOpenNewFireIsolationDialog} className="w-full sm:w-auto mt-2 sm:mt-0">
          <PlusCircle className="mr-2 h-5 w-5" /> Add Isolation Log
        </Button>
      </div>
      
      <Card className="shadow-md flex flex-col flex-1">
        <CardContent className="p-6 flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start flex-wrap justify-end gap-3 mb-4">
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Search isolations..."
                  value={searchTermFireIsolations}
                  onChange={(e) => setSearchTermFireIsolations(e.target.value)}
                  className="h-10 pl-10 w-full"
                />
              </div>
                <Select value={selectedStatusFireIsolations} onValueChange={(value) => setSelectedStatusFireIsolations(value as FireSystemIsolationStatus | 'all')}>
                  <SelectTrigger className="w-full sm:w-[160px] h-10">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {fireIsolationStatusFilterOptions.map(status => (
                      <SelectItem key={status} value={status}>
                        {status === 'all' ? 'All Statuses' : status}
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
                              !selectedDateFireIsolations && "text-muted-foreground"
                            )}
                          >
                            <CalendarDays className="mr-0 sm:mr-2 h-4 w-4" />
                            <span className="hidden sm:inline">
                              {selectedDateFireIsolations ? format(selectedDateFireIsolations, "dd MMMM yyyy") : <span>Date Isolated</span>}
                            </span>
                             <span className="sm:hidden">
                              {selectedDateFireIsolations ? format(selectedDateFireIsolations, "dd/MM/yy") : <CalendarDays className="h-4 w-4" />}
                            </span>
                          </Button>
                        </PopoverTrigger>
                    </TooltipTrigger>
                    <TooltipContent className="sm:hidden">
                      <p>{selectedDateFireIsolations ? format(selectedDateFireIsolations, "dd MMMM yyyy") : "Pick a date"}</p>
                    </TooltipContent>
                  </Tooltip>
                  <PopoverContent className="p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDateFireIsolations}
                      onSelect={setSelectedDateFireIsolations}
                      initialFocus
                    />
                    {selectedDateFireIsolations && (
                      <Button variant="ghost" size="sm" className="w-full mt-1" onClick={() => setSelectedDateFireIsolations(undefined)}>
                        Clear Date Filter
                      </Button>
                    )}
                  </PopoverContent>
                </Popover>

                <Tooltip>
                  <TooltipTrigger asChild>
                     <Button variant="outline" onClick={toggleSortOrderFireIsolations} className="h-10 w-full sm:w-auto flex items-center justify-center sm:justify-start">
                        <ArrowDownUp className="mr-0 sm:mr-2 h-4 w-4" />
                        <span className="hidden sm:inline">
                          {sortOrderFireIsolations === 'desc' ? 'Newest First' : 'Oldest First'}
                        </span>
                        <span className="sm:hidden">
                           <ArrowDownUp className="h-4 w-4" />
                        </span>
                      </Button>
                  </TooltipTrigger>
                  <TooltipContent className="sm:hidden">
                    <p>{sortOrderFireIsolations === 'desc' ? 'Newest First' : 'Oldest First'}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
          <Separator className="mb-4" />
          <ScrollArea className="flex-1 min-h-0">
              <div className="space-y-3 pr-3">
                {filteredFireIsolations.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                     {fireSystemIsolations.length === 0 ? "No fire system isolations logged." : "No isolations match your current filters."}
                  </p>
                ) : (
                filteredFireIsolations.map(iso => (
                  <Card key={iso.id} className={cn("transition-shadow duration-200 hover:shadow-lg", iso.status === "Active" ? "border-l-4 border-destructive bg-destructive/5" : iso.status === "Removed" ? "border-l-4 border-green-500 bg-green-500/5 opacity-80" : "border-l-4 border-yellow-500 bg-yellow-500/5")}>
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex items-start gap-3 flex-grow min-w-0">
                           <Flame className={cn("h-5 w-5 flex-shrink-0 mt-0.5", iso.status === "Active" ? "text-destructive" : iso.status === "Removed" ? "text-green-600" : "text-yellow-600" )} />
                           <div className="space-y-0.5 flex-grow overflow-hidden">
                             <p className="text-md font-semibold truncate" title={iso.unitOrSystem}>{iso.unitOrSystem}</p>
                             <p className="text-xs text-muted-foreground truncate flex items-center" title={`Area: ${iso.areaImpacted}`}>
                               <MapPin className="inline-block h-3 w-3 mr-1 flex-shrink-0" /> {iso.areaImpacted}
                             </p>
                             <p className="text-xs text-muted-foreground truncate flex items-center" title={`By: ${iso.isolatedBy}`}>
                               <User className="inline-block h-3 w-3 mr-1 flex-shrink-0" /> By: {iso.isolatedBy}
                             </p>
                             <p className="text-xs text-muted-foreground flex items-center">
                               <Clock className="inline-block h-3 w-3 mr-1 flex-shrink-0" /> Isolated: <ClientFormattedTimestamp isoString={iso.isolationStartTime} type="short" />
                             </p>
                           </div>
                        </div>

                        <div className="flex flex-col items-start sm:items-end gap-2 sm:ml-4 flex-shrink-0">
                           <Badge variant={getFireIsolationStatusBadgeVariant(iso.status)} className="whitespace-nowrap self-start sm:self-end">{iso.status}</Badge>
                           <div className="flex gap-2 flex-wrap">
                              <Button variant="outline" size="sm" onClick={() => handleOpenEditFireIsolationDialog(iso)}>
                                <FileText className="mr-1.5 h-3 w-3" /> Details
                              </Button>
                              {iso.status !== "Removed" && (
                                <Select
                                    value={iso.status}
                                    onValueChange={(newStatus) => handleUpdateFireIsolationStatus(iso.id, newStatus as FireSystemIsolationStatus)}
                                >
                                    <SelectTrigger className="h-9 text-sm w-auto max-w-[150px] focus:ring-0 px-3">
                                        <SelectValue placeholder="Update Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {fireIsolationStatusOptions.map(opt => (
                                            <SelectItem key={opt} value={opt} className="text-sm">{opt}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                              )}
                            </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )))}
              </div>
            </ScrollArea>
        </CardContent>
      </Card>

      <Dialog open={isFireIsolationDialogOpen} onOpenChange={setIsFireIsolationDialogOpen}>
        <DialogContent className="sm:max-w-xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{getFireIsolationDialogTitle()}</DialogTitle>
             {editingFireIsolationId && fireSystemIsolations.find(iso => iso.id === editingFireIsolationId) && (
              <DialogDesc className="text-xs text-muted-foreground pt-1">
                ID: {editingFireIsolationId}
              </DialogDesc>
            )}
          </DialogHeader>
          <ScrollArea className="max-h-[calc(90vh-160px)] p-1">
          <div className="grid gap-4 py-4 pr-1">
             <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="fsiUnitOrSystem" className="text-right pt-2">Unit/System</Label>
              <Input id="fsiUnitOrSystem" value={currentFireIsolation.unitOrSystem} onChange={(e) => handleFireIsolationFormChange('unitOrSystem', e.target.value)} className="col-span-3" placeholder="e.g., Sprinkler Zone A-3" />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="fsiAreaImpacted" className="text-right pt-2">Area Impacted</Label>
              <Input id="fsiAreaImpacted" value={currentFireIsolation.areaImpacted} onChange={(e) => handleFireIsolationFormChange('areaImpacted', e.target.value)} className="col-span-3" placeholder="e.g., Data Hall A, Racks 1-5"/>
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="fsiIsolatedBy" className="text-right pt-2">Isolated By</Label>
              <Input id="fsiIsolatedBy" value={currentFireIsolation.isolatedBy} onChange={(e) => handleFireIsolationFormChange('isolatedBy', e.target.value)} className="col-span-3" placeholder="Person or Team Name"/>
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="fsiReason" className="text-right pt-2">Reason</Label>
              <Textarea id="fsiReason" value={currentFireIsolation.reasonForIsolation} onChange={(e) => handleFireIsolationFormChange('reasonForIsolation', e.target.value)} className="col-span-3 min-h-[60px]" placeholder="Reason for isolation"/>
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="fsiLotoTag" className="text-right pt-2">LOTO Tag #</Label>
              <Input id="fsiLotoTag" value={currentFireIsolation.lotoTagNumber || ""} onChange={(e) => handleFireIsolationFormChange('lotoTagNumber', e.target.value)} className="col-span-3" placeholder="Optional: LOTO-XXX"/>
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="fsiStartTime" className="text-right pt-2">Isolation Start</Label>
              <Input id="fsiStartTime" type="datetime-local" value={formatTimestampForInput(currentFireIsolation.isolationStartTime)} onChange={(e) => handleFireIsolationFormChange('isolationStartTime', e.target.value ? new Date(e.target.value).toISOString() : null)} className="col-span-3"/>
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="fsiExpectedRemovalTime" className="text-right pt-2">Expected Removal</Label>
              <Input id="fsiExpectedRemovalTime" type="datetime-local" value={formatTimestampForInput(currentFireIsolation.expectedRemovalTime)} onChange={(e) => handleFireIsolationFormChange('expectedRemovalTime', e.target.value ? new Date(e.target.value).toISOString() : null)} className="col-span-3"/>
            </div>
            {editingFireIsolationId && (
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="fsiActualRemovalTime" className="text-right">Actual Removal</Label>
                    <Input id="fsiActualRemovalTime" type="datetime-local" value={formatTimestampForInput(currentFireIsolation.actualRemovalTime)} onChange={(e) => handleFireIsolationFormChange('actualRemovalTime', e.target.value ? new Date(e.target.value).toISOString() : null)} className="col-span-3" />
                </div>
            )}
             {editingFireIsolationId && (
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="fsiStatusEdit" className="text-right">Status</Label>
                    <Select value={fireSystemIsolations.find(iso => iso.id === editingFireIsolationId)?.status || ""} onValueChange={(val) => handleUpdateFireIsolationStatus(editingFireIsolationId!, val as FireSystemIsolationStatus)}>
                        <SelectTrigger id="fsiStatusEdit" className="col-span-3">
                            <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                            {fireIsolationStatusOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            )}
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="fsiNotes" className="text-right pt-2">Notes</Label>
              <Textarea id="fsiNotes" value={currentFireIsolation.notes || ""} onChange={(e) => handleFireIsolationFormChange('notes', e.target.value)} className="col-span-3 min-h-[80px]" placeholder="Additional notes or comments..."/>
            </div>
          </div>
          </ScrollArea>
          <DialogFooter className="pt-4">
            <Button variant="outline" onClick={() => setIsFireIsolationDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleFireIsolationSubmit}>{editingFireIsolationId ? "Save Changes" : "Add Isolation Log"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </TooltipProvider>
  );
}
