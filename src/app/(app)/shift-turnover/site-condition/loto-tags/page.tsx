
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription as DialogDesc, DialogFooter } from "@/components/ui/dialog"; // Renamed DialogDescription to avoid conflict
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import React, { useState, useMemo, useEffect } from 'react';
import type { LotoTagEntry, LotoTagStatus } from "@/types";
import { 
  initialLotoTags, 
  lotoTagStatusOptions, 
  defaultLotoTagFormData 
} from "@/lib/data"; 
import { PlusCircle, FileText, CalendarDays, Search, ArrowDownUp, Tag, User, Clock, Info } from "lucide-react";
import { format, parseISO, isSameDay, isValid, addDays } from 'date-fns';
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ClientFormattedTimestamp } from "@/components/shared/client-formatted-timestamp";
import { Separator } from "@/components/ui/separator";

const lotoTagStatusFilterOptions: (LotoTagStatus | 'all')[] = ['all', ...lotoTagStatusOptions];

const getLotoStatusBadgeVariant = (status: LotoTagStatus): "destructive" | "default" | "outline" => {
  switch (status) {
    case "Active": return "destructive";
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

export default function LotoTagsPage() {
  const { toast } = useToast();
  const [lotoTags, setLotoTags] = useState<LotoTagEntry[]>(initialLotoTags);
  const [isLotoTagDialogOpen, setIsLotoTagDialogOpen] = useState(false);
  const [currentLotoTag, setCurrentLotoTag] = useState<Omit<LotoTagEntry, 'id'>>(defaultLotoTagFormData);
  const [editingLotoTagId, setEditingLotoTagId] = useState<string | null>(null);

  const [searchTermLotoTags, setSearchTermLotoTags] = useState<string>("");
  const [selectedStatusLotoTags, setSelectedStatusLotoTags] = useState<LotoTagStatus | 'all'>('Active');
  const [selectedDateLotoTags, setSelectedDateLotoTags] = useState<Date | undefined>(undefined);
  const [sortOrderLotoTags, setSortOrderLotoTags] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    setSelectedDateLotoTags(new Date());
  }, []);

  const handleLotoTagFormChange = (field: keyof Omit<LotoTagEntry, 'id'>, value: string | null) => {
    setCurrentLotoTag(prev => ({ ...prev, [field]: value }));
  };

  const handleOpenNewLotoTagDialog = () => {
    setEditingLotoTagId(null);
    setCurrentLotoTag({...defaultLotoTagFormData, appliedTimestamp: new Date().toISOString(), expectedRemovalTimestamp: addDays(new Date(), 1).toISOString()});
    setIsLotoTagDialogOpen(true);
  };

  const handleOpenEditLotoTagDialog = (tag: LotoTagEntry) => {
    setEditingLotoTagId(tag.id);
    setCurrentLotoTag({...tag});
    setIsLotoTagDialogOpen(true);
  };

  const handleLotoTagSubmit = () => {
    if (!currentLotoTag.equipmentIsolated || !currentLotoTag.tagNumber || !currentLotoTag.appliedBy || !currentLotoTag.reasonForLoto || !currentLotoTag.appliedTimestamp) {
      toast({ title: "Missing Fields", description: "Please fill in all required LOTO tag details.", variant: "destructive" });
      return;
    }
    if (!isValid(parseISO(currentLotoTag.appliedTimestamp)) || (currentLotoTag.expectedRemovalTimestamp && !isValid(parseISO(currentLotoTag.expectedRemovalTimestamp)))) {
      toast({ title: "Invalid Dates", description: "Please ensure applied and expected removal times are valid.", variant: "destructive" });
      return;
    }

    if (editingLotoTagId) {
      setLotoTags(prev => prev.map(tag => tag.id === editingLotoTagId ? { ...tag, ...currentLotoTag, id: editingLotoTagId } : tag));
      toast({ title: "LOTO Tag Updated", description: "Tag information has been successfully updated." });
    } else {
      const newTag: LotoTagEntry = {
        ...currentLotoTag,
        id: `loto-${Date.now()}`,
      };
      setLotoTags(prev => [newTag, ...prev]);
      toast({ title: "New LOTO Tag Logged", description: "Tag has been successfully logged." });
    }
    setIsLotoTagDialogOpen(false);
    setEditingLotoTagId(null);
  };

  const handleUpdateLotoTagStatus = (id: string, newStatus: LotoTagStatus) => {
    setLotoTags(prev => prev.map(tag => {
      if (tag.id === id) {
        const updatedTag = { ...tag, status: newStatus };
        if (newStatus === "Removed" && !tag.actualRemovalTimestamp) {
          updatedTag.actualRemovalTimestamp = new Date().toISOString();
        }
        return updatedTag;
      }
      return tag;
    }));
    toast({ title: "LOTO Tag Status Updated", description: `Status set to ${newStatus}.` });
  };
  
  const getLotoTagDialogTitle = () => {
    if (editingLotoTagId) {
      const tag = lotoTags.find(item => item.id === editingLotoTagId);
      return `LOTO Tag: ${tag ? tag.tagNumber : "Edit LOTO Tag"}`;
    }
    return "Add New LOTO Tag Log";
  };

  const toggleSortOrderLotoTags = () => {
    setSortOrderLotoTags(prev => (prev === 'desc' ? 'asc' : 'desc'));
  };

  const filteredLotoTags = useMemo(() => {
    return lotoTags.filter(tag => {
      const searchLower = searchTermLotoTags.toLowerCase();
      const searchMatch = searchTermLotoTags === "" ||
        tag.equipmentIsolated.toLowerCase().includes(searchLower) ||
        tag.tagNumber.toLowerCase().includes(searchLower) ||
        tag.appliedBy.toLowerCase().includes(searchLower) ||
        tag.reasonForLoto.toLowerCase().includes(searchLower);

      const statusMatch = selectedStatusLotoTags === 'all' || tag.status === selectedStatusLotoTags;
      let dateMatch = true;
      if (selectedDateLotoTags) {
        try {
          dateMatch = isSameDay(parseISO(tag.appliedTimestamp), selectedDateLotoTags);
        } catch (error) { dateMatch = false; }
      }
      return searchMatch && statusMatch && dateMatch;
    }).sort((a,b) => {
       try {
        const dateA = parseISO(a.appliedTimestamp).getTime();
        const dateB = parseISO(b.appliedTimestamp).getTime();
        return sortOrderLotoTags === 'desc' ? dateB - dateA : dateA - dateB;
      } catch (e) { return 0; }
    });
  }, [lotoTags, searchTermLotoTags, selectedStatusLotoTags, selectedDateLotoTags, sortOrderLotoTags]);


  return (
    <TooltipProvider>
    <div className="space-y-6 flex flex-col h-full">
      <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-2">
        <div className="flex-grow">
          <h1 className="text-3xl font-bold tracking-tight">LOTO Tag Monitoring</h1>
          <p className="text-muted-foreground">
            Log and track Lockout/Tagout instances. Default view shows active tags today.
          </p>
        </div>
        <Button onClick={handleOpenNewLotoTagDialog} className="w-full sm:w-auto mt-2 sm:mt-0">
          <PlusCircle className="mr-2 h-5 w-5" /> Add LOTO Tag Log
        </Button>
      </div>
        
      <Card className="shadow-md flex flex-col flex-1">
        <CardContent className="p-6 flex flex-col flex-1 min-h-0 overflow-hidden">
            <div className="flex flex-col sm:flex-row items-start flex-wrap justify-end gap-3 mb-4">
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input placeholder="Search LOTO tags..." value={searchTermLotoTags} onChange={(e) => setSearchTermLotoTags(e.target.value)} className="h-10 pl-10 w-full"/>
              </div>
                <Select value={selectedStatusLotoTags} onValueChange={(value) => setSelectedStatusLotoTags(value as LotoTagStatus | 'all')}>
                  <SelectTrigger className="w-full sm:w-[160px] h-10"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>{lotoTagStatusFilterOptions.map(status => (<SelectItem key={status} value={status}>{status === 'all' ? 'All Statuses' : status}</SelectItem>))}</SelectContent>
                </Select>
                <Popover>
                  <Tooltip>
                    <TooltipTrigger asChild>
                       <PopoverTrigger asChild>
                          <Button variant="outline" className={cn("w-full sm:w-auto h-10 text-left font-normal flex items-center justify-center sm:justify-start", !selectedDateLotoTags && "text-muted-foreground")}>
                            <CalendarDays className="mr-0 sm:mr-2 h-4 w-4" /><span className="hidden sm:inline">{selectedDateLotoTags ? format(selectedDateLotoTags, "dd MMMM yyyy") : <span>Date Applied</span>}</span>
                            <span className="sm:hidden">{selectedDateLotoTags ? format(selectedDateLotoTags, "dd/MM/yy") : <CalendarDays className="h-4 w-4" />}</span>
                          </Button>
                        </PopoverTrigger>
                    </TooltipTrigger>
                     <TooltipContent className="sm:hidden"><p>{selectedDateLotoTags ? format(selectedDateLotoTags, "dd MMMM yyyy") : "Pick a date"}</p></TooltipContent>
                  </Tooltip>
                  <PopoverContent className="p-0" align="start">
                    <Calendar mode="single" selected={selectedDateLotoTags} onSelect={setSelectedDateLotoTags} initialFocus />
                    {selectedDateLotoTags && <Button variant="ghost" size="sm" className="w-full mt-1" onClick={() => setSelectedDateLotoTags(undefined)}>Clear Date Filter</Button>}
                  </PopoverContent>
                </Popover>
                <Tooltip>
                  <TooltipTrigger asChild>
                     <Button variant="outline" onClick={toggleSortOrderLotoTags} className="h-10 w-full sm:w-auto flex items-center justify-center sm:justify-start">
                        <ArrowDownUp className="mr-0 sm:mr-2 h-4 w-4" /><span className="hidden sm:inline">{sortOrderLotoTags === 'desc' ? 'Newest First' : 'Oldest First'}</span>
                        <span className="sm:hidden"><ArrowDownUp className="h-4 w-4" /></span>
                      </Button>
                  </TooltipTrigger>
                  <TooltipContent className="sm:hidden"><p>{sortOrderLotoTags === 'desc' ? 'Newest First' : 'Oldest First'}</p></TooltipContent>
                </Tooltip>
              </div>
            <Separator className="mb-4" />
            <ScrollArea className="flex-1 min-h-0">
              <div className="space-y-3 pr-3">
                {filteredLotoTags.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">{lotoTags.length === 0 ? "No LOTO tags logged." : "No LOTO tags match filters."}</p>
                ) : (
                  filteredLotoTags.map(tag => (
                    <Card key={tag.id} className={cn("transition-shadow duration-200 hover:shadow-lg", tag.status === "Active" ? "border-l-4 border-destructive bg-destructive/5" : "border-l-4 border-green-500 bg-green-500/5 opacity-80")}>
                       <CardContent className="p-3 sm:p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div className="flex items-start gap-3 flex-grow min-w-0">
                             <Tag className={cn("h-5 w-5 flex-shrink-0 mt-0.5", tag.status === "Active" ? "text-destructive" : "text-green-600")} />
                             <div className="space-y-0.5 flex-grow overflow-hidden">
                               <p className="text-md font-semibold truncate" title={tag.equipmentIsolated}>{tag.equipmentIsolated} <span className="text-sm font-normal text-muted-foreground">({tag.tagNumber})</span></p>
                               <p className="text-xs text-muted-foreground truncate flex items-center" title={`Reason: ${tag.reasonForLoto}`}>
                                 <Info className="inline-block h-3 w-3 mr-1 flex-shrink-0" /> {tag.reasonForLoto}
                               </p>
                               <p className="text-xs text-muted-foreground truncate flex items-center" title={`By: ${tag.appliedBy}`}>
                                 <User className="inline-block h-3 w-3 mr-1 flex-shrink-0" /> By: {tag.appliedBy}
                               </p>
                               <p className="text-xs text-muted-foreground flex items-center">
                                 <Clock className="inline-block h-3 w-3 mr-1 flex-shrink-0" /> Applied: <ClientFormattedTimestamp isoString={tag.appliedTimestamp} type="short" />
                               </p>
                             </div>
                          </div>
                          <div className="flex flex-col items-start sm:items-end gap-2 sm:ml-4 flex-shrink-0">
                             <Badge variant={getLotoStatusBadgeVariant(tag.status)} className="whitespace-nowrap self-start sm:self-end">{tag.status}</Badge>
                             <div className="flex gap-2 flex-wrap">
                                <Button variant="outline" size="sm" onClick={() => handleOpenEditLotoTagDialog(tag)}>
                                  <FileText className="mr-1.5 h-3 w-3" /> Details
                                </Button>
                                {tag.status !== "Removed" && (
                                  <Select value={tag.status} onValueChange={(newStatus) => handleUpdateLotoTagStatus(tag.id, newStatus as LotoTagStatus)}>
                                      <SelectTrigger className="h-9 text-sm w-auto max-w-[150px] focus:ring-0 px-3"><SelectValue placeholder="Update Status" /></SelectTrigger>
                                      <SelectContent>{lotoTagStatusOptions.map(opt => (<SelectItem key={opt} value={opt} className="text-sm">{opt}</SelectItem>))}</SelectContent>
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

      <Dialog open={isLotoTagDialogOpen} onOpenChange={setIsLotoTagDialogOpen}>
        <DialogContent className="sm:max-w-xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{getLotoTagDialogTitle()}</DialogTitle>
            {editingLotoTagId && <DialogDesc className="text-xs text-muted-foreground pt-1">ID: {editingLotoTagId}</DialogDesc>}
          </DialogHeader>
          <ScrollArea className="max-h-[calc(90vh-160px)] p-1">
            <div className="grid gap-4 py-4 pr-1">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="lotoEquipment" className="text-right">Equipment Isolated</Label>
                <Input id="lotoEquipment" value={currentLotoTag.equipmentIsolated} onChange={(e) => handleLotoTagFormChange('equipmentIsolated', e.target.value)} className="col-span-3" placeholder="e.g., PDU-01A / Breaker CB-5"/>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="lotoTagNumber" className="text-right">Tag Number</Label>
                <Input id="lotoTagNumber" value={currentLotoTag.tagNumber} onChange={(e) => handleLotoTagFormChange('tagNumber', e.target.value)} className="col-span-3" placeholder="e.g., LOTO-2024-123"/>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="lotoAppliedBy" className="text-right">Applied By</Label>
                <Input id="lotoAppliedBy" value={currentLotoTag.appliedBy} onChange={(e) => handleLotoTagFormChange('appliedBy', e.target.value)} className="col-span-3" placeholder="Person who applied the tag"/>
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="lotoReason" className="text-right pt-2">Reason</Label>
                <Textarea id="lotoReason" value={currentLotoTag.reasonForLoto} onChange={(e) => handleLotoTagFormChange('reasonForLoto', e.target.value)} className="col-span-3 min-h-[60px]" placeholder="Reason for LOTO"/>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="lotoAppliedTime" className="text-right">Applied Timestamp</Label>
                <Input id="lotoAppliedTime" type="datetime-local" value={formatTimestampForInput(currentLotoTag.appliedTimestamp)} onChange={(e) => handleLotoTagFormChange('appliedTimestamp', e.target.value ? new Date(e.target.value).toISOString() : null)} className="col-span-3"/>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="lotoExpectedRemoval" className="text-right">Expected Removal</Label>
                <Input id="lotoExpectedRemoval" type="datetime-local" value={formatTimestampForInput(currentLotoTag.expectedRemovalTimestamp)} onChange={(e) => handleLotoTagFormChange('expectedRemovalTimestamp', e.target.value ? new Date(e.target.value).toISOString() : null)} className="col-span-3"/>
              </div>
               <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="lotoStatus" className="text-right">Status</Label>
                <Select value={currentLotoTag.status} onValueChange={(val) => handleLotoTagFormChange('status', val as LotoTagStatus)}>
                  <SelectTrigger id="lotoStatus" className="col-span-3"><SelectValue placeholder="Select status"/></SelectTrigger>
                  <SelectContent>{lotoTagStatusOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              {currentLotoTag.status === 'Removed' && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="lotoActualRemoval" className="text-right">Actual Removal</Label>
                  <Input id="lotoActualRemoval" type="datetime-local" value={formatTimestampForInput(currentLotoTag.actualRemovalTimestamp)} onChange={(e) => handleLotoTagFormChange('actualRemovalTimestamp', e.target.value ? new Date(e.target.value).toISOString() : null)} className="col-span-3"/>
                </div>
              )}
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="lotoNotes" className="text-right pt-2">Notes</Label>
                <Textarea id="lotoNotes" value={currentLotoTag.notes || ""} onChange={(e) => handleLotoTagFormChange('notes', e.target.value)} className="col-span-3 min-h-[80px]" placeholder="Additional notes..."/>
              </div>
            </div>
          </ScrollArea>
          <DialogFooter className="pt-4">
            <Button variant="outline" onClick={() => setIsLotoTagDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleLotoTagSubmit}>{editingLotoTagId ? "Save Changes" : "Add Log"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </TooltipProvider>
  );
}
