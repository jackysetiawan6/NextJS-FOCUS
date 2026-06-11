
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription as DialogDesc, DialogFooter } from "@/components/ui/dialog"; // Renamed
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import React, { useState, useMemo, useEffect } from 'react';
import type { ManualOperationEntry, ManualOperationStatus } from "@/types";
import { 
  initialManualOperations, 
  manualOperationStatusOptions, 
  defaultManualOperationFormData 
} from "@/lib/data"; 
import { PlusCircle, FileText, CalendarDays, Search, ArrowDownUp, Wrench, User, Clock, Info } from "lucide-react";
import { format, parseISO, isSameDay, isValid } from 'date-fns';
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ClientFormattedTimestamp } from "@/components/shared/client-formatted-timestamp";
import { Separator } from "@/components/ui/separator";

const manualOpStatusFilterOptions: (ManualOperationStatus | 'all')[] = ['all', ...manualOperationStatusOptions];

const getManualOpStatusBadgeVariant = (status: ManualOperationStatus): "destructive" | "secondary" | "default" | "outline" => {
  switch (status) {
    case "Active": return "destructive";
    case "Completed": return "default";
    case "Reverted": return "secondary";
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


export default function ManualOperationsPage() {
  const { toast } = useToast();
  const [manualOperations, setManualOperations] = useState<ManualOperationEntry[]>(initialManualOperations);
  const [isManualOpDialogOpen, setIsManualOpDialogOpen] = useState(false);
  const [currentManualOp, setCurrentManualOp] = useState<Omit<ManualOperationEntry, 'id'>>(defaultManualOperationFormData);
  const [editingManualOpId, setEditingManualOpId] = useState<string | null>(null);

  const [searchTermManualOps, setSearchTermManualOps] = useState<string>("");
  const [selectedStatusManualOps, setSelectedStatusManualOps] = useState<ManualOperationStatus | 'all'>('Active');
  const [selectedDateManualOps, setSelectedDateManualOps] = useState<Date | undefined>(undefined);
  const [sortOrderManualOps, setSortOrderManualOps] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    setSelectedDateManualOps(new Date());
  }, []);

  const handleManualOpFormChange = (field: keyof Omit<ManualOperationEntry, 'id'>, value: string | null) => {
    setCurrentManualOp(prev => ({ ...prev, [field]: value }));
  };

  const handleOpenNewManualOpDialog = () => {
    setEditingManualOpId(null);
    setCurrentManualOp({...defaultManualOperationFormData, operationTimestamp: new Date().toISOString()});
    setIsManualOpDialogOpen(true);
  };

  const handleOpenEditManualOpDialog = (op: ManualOperationEntry) => {
    setEditingManualOpId(op.id);
    setCurrentManualOp({...op});
    setIsManualOpDialogOpen(true);
  };

  const handleManualOpSubmit = () => {
    if (!currentManualOp.systemOperated || !currentManualOp.operationPerformed || !currentManualOp.reasonForManualOp || !currentManualOp.operator || !currentManualOp.operationTimestamp) {
      toast({ title: "Missing Fields", description: "Please fill in all required manual operation details.", variant: "destructive" });
      return;
    }
     if (!isValid(parseISO(currentManualOp.operationTimestamp))) {
      toast({ title: "Invalid Timestamp", description: "Please ensure the operation timestamp is valid.", variant: "destructive" });
      return;
    }

    if (editingManualOpId) {
      setManualOperations(prev => prev.map(op => op.id === editingManualOpId ? { ...op, ...currentManualOp, id: editingManualOpId } : op));
      toast({ title: "Manual Operation Updated", description: "Log has been successfully updated." });
    } else {
      const newOp: ManualOperationEntry = {
        ...currentManualOp,
        id: `mo-${Date.now()}`,
      };
      setManualOperations(prev => [newOp, ...prev]);
      toast({ title: "New Manual Operation Logged", description: "Operation has been successfully logged." });
    }
    setIsManualOpDialogOpen(false);
    setEditingManualOpId(null);
  };

  const handleUpdateManualOpStatus = (id: string, newStatus: ManualOperationStatus) => {
    setManualOperations(prev => prev.map(op => op.id === id ? { ...op, status: newStatus } : op));
    toast({ title: "Manual Operation Status Updated", description: `Status set to ${newStatus}.` });
  };
  
  const getManualOpDialogTitle = () => {
    if (editingManualOpId) {
      const op = manualOperations.find(item => item.id === editingManualOpId);
      return `Manual Op: ${op ? op.systemOperated.substring(0,30) + (op.systemOperated.length > 30 ? "..." : "") : "Edit Manual Op"}`;
    }
    return "Add New Manual Operation Log";
  };
  
  const toggleSortOrderManualOps = () => {
    setSortOrderManualOps(prev => (prev === 'desc' ? 'asc' : 'desc'));
  };

  const filteredManualOperations = useMemo(() => {
    return manualOperations.filter(op => {
      const searchLower = searchTermManualOps.toLowerCase();
      const searchMatch = searchTermManualOps === "" ||
        op.systemOperated.toLowerCase().includes(searchLower) ||
        op.operationPerformed.toLowerCase().includes(searchLower) ||
        op.reasonForManualOp.toLowerCase().includes(searchLower) ||
        op.operator.toLowerCase().includes(searchLower);

      const statusMatch = selectedStatusManualOps === 'all' || op.status === selectedStatusManualOps;
      let dateMatch = true;
      if (selectedDateManualOps) {
        try {
          dateMatch = isSameDay(parseISO(op.operationTimestamp), selectedDateManualOps);
        } catch (error) { dateMatch = false; }
      }
      return searchMatch && statusMatch && dateMatch;
    }).sort((a,b) => {
      try {
        const dateA = parseISO(a.operationTimestamp).getTime();
        const dateB = parseISO(b.operationTimestamp).getTime();
        return sortOrderManualOps === 'desc' ? dateB - dateA : dateA - dateB;
      } catch (e) { return 0; }
    });
  }, [manualOperations, searchTermManualOps, selectedStatusManualOps, selectedDateManualOps, sortOrderManualOps]);

  return (
    <TooltipProvider>
    <div className="space-y-6 flex flex-col h-full">
      <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-2">
        <div className="flex-grow">
          <h1 className="text-3xl font-bold tracking-tight">Manual System Operations</h1>
          <p className="text-muted-foreground">
            Log and manage systems operated manually. Default view shows active operations today.
          </p>
        </div>
        <Button onClick={handleOpenNewManualOpDialog} className="w-full sm:w-auto mt-2 sm:mt-0">
          <PlusCircle className="mr-2 h-5 w-5" /> Add Manual Op Log
        </Button>
      </div>
        
      <Card className="shadow-md flex flex-col flex-1">
        <CardContent className="p-6 flex flex-col flex-1 min-h-0 overflow-hidden">
            <div className="flex flex-col sm:flex-row items-start flex-wrap justify-end gap-3 mb-4">
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Search manual ops..."
                  value={searchTermManualOps}
                  onChange={(e) => setSearchTermManualOps(e.target.value)}
                  className="h-10 pl-10 w-full"
                />
              </div>
                <Select value={selectedStatusManualOps} onValueChange={(value) => setSelectedStatusManualOps(value as ManualOperationStatus | 'all')}>
                  <SelectTrigger className="w-full sm:w-[160px] h-10">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {manualOpStatusFilterOptions.map(status => (
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
                            className={cn("w-full sm:w-auto h-10 text-left font-normal flex items-center justify-center sm:justify-start", !selectedDateManualOps && "text-muted-foreground")}
                          >
                            <CalendarDays className="mr-0 sm:mr-2 h-4 w-4" /><span className="hidden sm:inline">{selectedDateManualOps ? format(selectedDateManualOps, "dd MMMM yyyy") : <span>Operation Date</span>}</span>
                            <span className="sm:hidden">{selectedDateManualOps ? format(selectedDateManualOps, "dd/MM/yy") : <CalendarDays className="h-4 w-4" />}</span>
                          </Button>
                        </PopoverTrigger>
                    </TooltipTrigger>
                    <TooltipContent className="sm:hidden"><p>{selectedDateManualOps ? format(selectedDateManualOps, "dd MMMM yyyy") : "Pick a date"}</p></TooltipContent>
                  </Tooltip>
                  <PopoverContent className="p-0" align="start">
                    <Calendar mode="single" selected={selectedDateManualOps} onSelect={setSelectedDateManualOps} initialFocus/>
                    {selectedDateManualOps && <Button variant="ghost" size="sm" className="w-full mt-1" onClick={() => setSelectedDateManualOps(undefined)}>Clear Date Filter</Button>}
                  </PopoverContent>
                </Popover>

                <Tooltip>
                  <TooltipTrigger asChild>
                     <Button variant="outline" onClick={toggleSortOrderManualOps} className="h-10 w-full sm:w-auto flex items-center justify-center sm:justify-start">
                        <ArrowDownUp className="mr-0 sm:mr-2 h-4 w-4" /><span className="hidden sm:inline">{sortOrderManualOps === 'desc' ? 'Newest First' : 'Oldest First'}</span>
                        <span className="sm:hidden"><ArrowDownUp className="h-4 w-4" /></span>
                      </Button>
                  </TooltipTrigger>
                  <TooltipContent className="sm:hidden"><p>{sortOrderManualOps === 'desc' ? 'Newest First' : 'Oldest First'}</p></TooltipContent>
                </Tooltip>
              </div>
            <Separator className="mb-4" />
            <ScrollArea className="flex-1 min-h-0">
              <div className="space-y-3 pr-3">
                {filteredManualOperations.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">{manualOperations.length === 0 ? "No manual operations logged." : "No manual operations match filters."}</p>
                ) : (
                  filteredManualOperations.map(op => (
                    <Card key={op.id} className={cn("transition-shadow duration-200 hover:shadow-lg", op.status === "Active" ? "border-l-4 border-destructive bg-destructive/5" : op.status === "Completed" ? "border-l-4 border-green-500 bg-green-500/5 opacity-80" : "border-l-4 border-yellow-500 bg-yellow-500/5")}>
                       <CardContent className="p-3 sm:p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div className="flex items-start gap-3 flex-grow min-w-0">
                             <Wrench className={cn("h-5 w-5 flex-shrink-0 mt-0.5", op.status === "Active" ? "text-destructive" : op.status === "Completed" ? "text-green-600" : "text-yellow-600" )} />
                             <div className="space-y-0.5 flex-grow overflow-hidden">
                               <p className="text-md font-semibold truncate" title={op.systemOperated}>{op.systemOperated}</p>
                               <p className="text-xs text-muted-foreground truncate flex items-center" title={`Operation: ${op.operationPerformed}`}>
                                 <Info className="inline-block h-3 w-3 mr-1 flex-shrink-0" /> {op.operationPerformed}
                               </p>
                               <p className="text-xs text-muted-foreground truncate flex items-center" title={`By: ${op.operator}`}>
                                 <User className="inline-block h-3 w-3 mr-1 flex-shrink-0" /> By: {op.operator}
                               </p>
                               <p className="text-xs text-muted-foreground flex items-center">
                                 <Clock className="inline-block h-3 w-3 mr-1 flex-shrink-0" /> Operated: <ClientFormattedTimestamp isoString={op.operationTimestamp} type="short" />
                               </p>
                             </div>
                          </div>
                          <div className="flex flex-col items-start sm:items-end gap-2 sm:ml-4 flex-shrink-0">
                             <Badge variant={getManualOpStatusBadgeVariant(op.status)} className="whitespace-nowrap self-start sm:self-end">{op.status}</Badge>
                             <div className="flex gap-2 flex-wrap">
                                <Button variant="outline" size="sm" onClick={() => handleOpenEditManualOpDialog(op)}>
                                  <FileText className="mr-1.5 h-3 w-3" /> Details
                                </Button>
                                {op.status !== "Completed" && op.status !== "Reverted" && (
                                  <Select value={op.status} onValueChange={(newStatus) => handleUpdateManualOpStatus(op.id, newStatus as ManualOperationStatus)}>
                                      <SelectTrigger className="h-9 text-sm w-auto max-w-[150px] focus:ring-0 px-3"><SelectValue placeholder="Update Status" /></SelectTrigger>
                                      <SelectContent>{manualOperationStatusOptions.map(opt => (<SelectItem key={opt} value={opt} className="text-sm">{opt}</SelectItem>))}</SelectContent>
                                  </Select>
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

      <Dialog open={isManualOpDialogOpen} onOpenChange={setIsManualOpDialogOpen}>
        <DialogContent className="sm:max-w-xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{getManualOpDialogTitle()}</DialogTitle>
            {editingManualOpId && <DialogDesc className="text-xs text-muted-foreground pt-1">ID: {editingManualOpId}</DialogDesc>}
          </DialogHeader>
           <ScrollArea className="max-h-[calc(90vh-160px)] p-1">
            <div className="grid gap-4 py-4 pr-1">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="moSystem" className="text-right">System Operated</Label>
                <Input id="moSystem" value={currentManualOp.systemOperated} onChange={(e) => handleManualOpFormChange('systemOperated', e.target.value)} className="col-span-3" placeholder="e.g., Chiller Unit CH-01"/>
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="moOperation" className="text-right pt-2">Operation Performed</Label>
                <Textarea id="moOperation" value={currentManualOp.operationPerformed} onChange={(e) => handleManualOpFormChange('operationPerformed', e.target.value)} className="col-span-3 min-h-[60px]" placeholder="e.g., Manual restart sequence initiated"/>
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="moReason" className="text-right pt-2">Reason</Label>
                <Textarea id="moReason" value={currentManualOp.reasonForManualOp} onChange={(e) => handleManualOpFormChange('reasonForManualOp', e.target.value)} className="col-span-3 min-h-[60px]" placeholder="Reason for manual operation"/>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="moOperator" className="text-right">Operator</Label>
                <Input id="moOperator" value={currentManualOp.operator} onChange={(e) => handleManualOpFormChange('operator', e.target.value)} className="col-span-3" placeholder="Operator's name"/>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="moTimestamp" className="text-right">Timestamp</Label>
                <Input id="moTimestamp" type="datetime-local" value={formatTimestampForInput(currentManualOp.operationTimestamp)} onChange={(e) => handleManualOpFormChange('operationTimestamp', e.target.value ? new Date(e.target.value).toISOString() : null)} className="col-span-3"/>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="moStatus" className="text-right">Status</Label>
                <Select value={currentManualOp.status} onValueChange={(val) => handleManualOpFormChange('status', val as ManualOperationStatus)}>
                  <SelectTrigger id="moStatus" className="col-span-3"><SelectValue placeholder="Select status"/></SelectTrigger>
                  <SelectContent>{manualOperationStatusOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="moNotes" className="text-right pt-2">Notes</Label>
                <Textarea id="moNotes" value={currentManualOp.notes || ""} onChange={(e) => handleManualOpFormChange('notes', e.target.value)} className="col-span-3 min-h-[80px]" placeholder="Additional notes..."/>
              </div>
            </div>
          </ScrollArea>
          <DialogFooter className="pt-4">
            <Button variant="outline" onClick={() => setIsManualOpDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleManualOpSubmit}>{editingManualOpId ? "Save Changes" : "Add Log"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </TooltipProvider>
  );
}
