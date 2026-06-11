
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Package, PlusCircle, Search, PackageOpen, Edit2, RotateCcw, Save } from "lucide-react";
import type { InventoryItem, InventoryItemStatus } from "@/types";
import { allInventoryItems as initialAllInventoryItems, inventoryStatusOptions, defaultInventoryItemFormData } from "@/lib/data/inventory-data";
import { ClientFormattedTimestamp } from '@/components/shared/client-formatted-timestamp';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO, addDays, isValid } from 'date-fns';

const getInventoryStatusBadgeVariant = (status?: InventoryItemStatus): "default" | "secondary" | "destructive" | "outline" => {
  if (!status) return "outline";
  switch (status) {
    case "Available": return "default";
    case "Loaned": return "secondary";
    case "Under Maintenance": return "outline";
    case "Out of Stock": return "destructive";
    default: return "outline";
  }
};

const formatIsoForInput = (isoDate: string | null | undefined): string => {
  if (!isoDate) return "";
  try {
    return format(parseISO(isoDate), "yyyy-MM-dd'T'HH:mm");
  } catch (e) {
    return "";
  }
};


export default function InventoryManagementPage() {
  const { toast } = useToast();
  const [allInventory, setAllInventory] = useState<InventoryItem[]>(initialAllInventoryItems);
  
  const [allInventorySearchTerm, setAllInventorySearchTerm] = useState("");
  const [loanedItemsSearchTerm, setLoanedItemsSearchTerm] = useState("");

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newItemData, setNewItemData] = useState<Omit<InventoryItem, 'id' | 'dataAiHint'>>(defaultInventoryItemFormData);

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<InventoryItem>>({});


  const [isConfirmReturnDialogOpen, setIsConfirmReturnDialogOpen] = useState(false);
  const [itemToReturn, setItemToReturn] = useState<InventoryItem | null>(null);


  const filteredAllInventory = useMemo(() => {
    if (!allInventorySearchTerm) return allInventory;
    const lowerSearch = allInventorySearchTerm.toLowerCase();
    return allInventory.filter(item => 
      item.name.toLowerCase().includes(lowerSearch) ||
      (item.id && item.id.toLowerCase().includes(lowerSearch)) ||
      (item.category && item.category.toLowerCase().includes(lowerSearch)) ||
      (item.location && item.location.toLowerCase().includes(lowerSearch))
    );
  }, [allInventory, allInventorySearchTerm]);

  const filteredLoanedItems = useMemo(() => {
    const items = allInventory.filter(item => item.status === "Loaned");
    if (!loanedItemsSearchTerm) return items;
    const lowerSearch = loanedItemsSearchTerm.toLowerCase();
    return items.filter(item => 
      item.name.toLowerCase().includes(lowerSearch) ||
      (item.loanedTo && item.loanedTo.toLowerCase().includes(lowerSearch))
    );
  }, [allInventory, loanedItemsSearchTerm]);

  const handleOpenAddDialog = () => {
    setNewItemData(defaultInventoryItemFormData);
    setIsAddDialogOpen(true);
  };

  const handleAddNewItem = () => {
    if (!newItemData.name.trim()) {
      toast({ title: "Error", description: "Item name is required.", variant: "destructive" });
      return;
    }
    const newItem: InventoryItem = {
      ...defaultInventoryItemFormData, // ensure all defaults
      ...newItemData,
      id: `inv${Date.now()}`, // Simple ID generation
      dataAiHint: newItemData.name.toLowerCase().split(" ").slice(0,2).join(" "), // Basic AI hint
    };
    setAllInventory(prev => [newItem, ...prev]);
    toast({ title: "Item Added", description: `${newItem.name} has been added to inventory.` });
    setIsAddDialogOpen(false);
  };

  const handleOpenEditDialog = (item: InventoryItem) => {
    setEditingItem(item);
    setEditFormData({
        ...item,
        loanDate: item.loanDate ? formatIsoForInput(item.loanDate) : null,
        expectedReturnDate: item.expectedReturnDate ? formatIsoForInput(item.expectedReturnDate) : null,
    });
    setIsEditDialogOpen(true);
  };

  const handleEditItemChange = (field: keyof InventoryItem, value: any) => {
    setEditFormData(prev => ({...prev, [field]: value}));
  };

  const handleEditItemSubmit = () => {
    if (!editingItem || !editFormData.name?.trim()) {
      toast({ title: "Error", description: "Item name is required.", variant: "destructive" });
      return;
    }

    let updatedItemData: InventoryItem = { ...editingItem, ...editFormData } as InventoryItem;

    if (editFormData.status === "Loaned") {
      if (!editFormData.loanedTo?.trim() || !editFormData.expectedReturnDate) {
        toast({ title: "Error", description: "Loaned To and Expected Return Date are required for loaned items.", variant: "destructive" });
        return;
      }
      updatedItemData.loanDate = editFormData.loanDate ? parseISO(editFormData.loanDate as string).toISOString() : new Date().toISOString();
      updatedItemData.expectedReturnDate = parseISO(editFormData.expectedReturnDate as string).toISOString();
    } else if (editingItem.status === "Loaned") {
      // If status changed from Loaned to something else, clear loan fields
      updatedItemData.loanedTo = null;
      updatedItemData.loanDate = null;
      updatedItemData.expectedReturnDate = null;
    }


    setAllInventory(prev => prev.map(item => item.id === editingItem.id ? updatedItemData : item));
    toast({ title: "Item Updated", description: `${updatedItemData.name} has been updated.` });
    setIsEditDialogOpen(false);
    setEditingItem(null);
  };
  
  const handleOpenReturnDialog = (item: InventoryItem) => {
    setItemToReturn(item);
    setIsConfirmReturnDialogOpen(true);
  };

  const handleConfirmReturnItem = () => {
    if (!itemToReturn) return;
    setAllInventory(prev => prev.map(item => 
      item.id === itemToReturn.id 
        ? { ...item, status: "Available", loanedTo: null, loanDate: null, expectedReturnDate: null } 
        : item
    ));
    toast({ title: "Item Returned", description: `${itemToReturn.name} has been marked as available.` });
    setIsConfirmReturnDialogOpen(false);
    setItemToReturn(null);
  };


  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory Management</h1>
          <p className="text-muted-foreground">
            Track and manage facility inventory, tools, and equipment.
          </p>
        </div>
         <Button onClick={handleOpenAddDialog}>
          <PlusCircle className="mr-2 h-5 w-5" /> Add New Item
        </Button>
      </div>

      <Tabs defaultValue="all-inventory">
        <TabsList className="grid w-full grid-cols-2 sm:w-auto sm:inline-flex">
          <TabsTrigger value="all-inventory">All Inventory ({filteredAllInventory.length})</TabsTrigger>
          <TabsTrigger value="loaned-items">
            <PackageOpen className="mr-2 h-4 w-4 sm:hidden md:inline-flex" />
            Loaned Items ({filteredLoanedItems.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="all-inventory">
          <Card className="shadow-md">
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex-1">
                  <CardTitle className="flex items-center text-xl">
                    <Package className="mr-2 h-5 w-5 text-primary" />
                    Full Inventory List
                  </CardTitle>
                  <CardDescription>Browse all registered items and their current status.</CardDescription>
                </div>
                <div className="relative w-full sm:w-auto sm:max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search all items..."
                    value={allInventorySearchTerm}
                    onChange={(e) => setAllInventorySearchTerm(e.target.value)}
                    className="pl-10 h-9 w-full"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-[60vh] w-full">
                {filteredAllInventory.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead className="hidden md:table-cell">Category</TableHead>
                        <TableHead className="text-center">Qty</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="hidden lg:table-cell">Location</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAllInventory.map((item) => (
                        <TableRow key={item.id} className="hover:bg-accent/50 transition-colors">
                          <TableCell className="font-medium">
                            <div className="flex flex-col">
                              <span className="truncate" title={item.name}>{item.name}</span>
                              <span className="text-xs text-muted-foreground md:hidden">{item.category}</span>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">{item.category || 'N/A'}</TableCell>
                          <TableCell className="text-center">{item.quantity !== undefined ? item.quantity : 'N/A'}</TableCell>
                          <TableCell>
                            <Badge variant={getInventoryStatusBadgeVariant(item.status)} className="whitespace-nowrap text-xs">
                              {item.status || 'Unknown'}
                              {item.status === "Loaned" && item.loanedTo && (
                                <span className="ml-1.5 hidden sm:inline truncate" title={`To: ${item.loanedTo}`}>({item.loanedTo})</span>
                              )}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">{item.location || 'N/A'}</TableCell>
                          <TableCell className="text-right">
                             <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenEditDialog(item)}>
                                <Edit2 className="h-4 w-4" />
                                <span className="sr-only">Edit Item</span>
                              </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-muted-foreground text-center py-6">
                    {allInventorySearchTerm ? "No items match your search." : "No inventory items found."}
                  </p>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="loaned-items">
          <Card className="shadow-md">
             <CardHeader>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex-1">
                  <CardTitle className="flex items-center text-xl">
                    <PackageOpen className="mr-2 h-5 w-5 text-secondary" />
                    Currently Loaned Items
                  </CardTitle>
                  <CardDescription>Track items that are currently checked out.</CardDescription>
                </div>
                <div className="relative w-full sm:w-auto sm:max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search loaned items..."
                    value={loanedItemsSearchTerm}
                    onChange={(e) => setLoanedItemsSearchTerm(e.target.value)}
                    className="pl-10 h-9 w-full"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-[60vh] w-full">
                {filteredLoanedItems.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item Name</TableHead>
                        <TableHead>Loaned To</TableHead>
                        <TableHead className="hidden sm:table-cell">Loan Date</TableHead>
                        <TableHead>Expected Return</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLoanedItems.map((item) => (
                        <TableRow key={item.id} className="hover:bg-accent/50 transition-colors">
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell>{item.loanedTo}</TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <ClientFormattedTimestamp isoString={item.loanDate} type="short" />
                          </TableCell>
                          <TableCell>
                            <ClientFormattedTimestamp isoString={item.expectedReturnDate} type="short" />
                          </TableCell>
                           <TableCell className="text-right">
                             <Button variant="outline" size="sm" className="h-8" onClick={() => handleOpenReturnDialog(item)}>
                                <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Mark Returned
                              </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                   <p className="text-muted-foreground text-center py-6">
                    {loanedItemsSearchTerm ? "No loaned items match your search." : "No items currently on loan."}
                  </p>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Item Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Inventory Item</DialogTitle>
            <DialogDescription>Enter details for the new inventory item.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid items-center gap-1.5">
              <Label htmlFor="addItemName">Name</Label>
              <Input id="addItemName" value={newItemData.name} onChange={(e) => setNewItemData(p => ({...p, name: e.target.value}))} />
            </div>
            <div className="grid items-center gap-1.5">
              <Label htmlFor="addItemCategory">Category</Label>
              <Input id="addItemCategory" value={newItemData.category || ""} onChange={(e) => setNewItemData(p => ({...p, category: e.target.value}))} />
            </div>
            <div className="grid items-center gap-1.5">
              <Label htmlFor="addItemQuantity">Quantity</Label>
              <Input id="addItemQuantity" type="number" value={newItemData.quantity || 1} onChange={(e) => setNewItemData(p => ({...p, quantity: parseInt(e.target.value) || 1}))} />
            </div>
            <div className="grid items-center gap-1.5">
              <Label htmlFor="addItemDescription">Description</Label>
              <Textarea id="addItemDescription" value={newItemData.description || ""} onChange={(e) => setNewItemData(p => ({...p, description: e.target.value}))} />
            </div>
            <div className="grid items-center gap-1.5">
              <Label htmlFor="addItemLocation">Location</Label>
              <Input id="addItemLocation" value={newItemData.location || ""} onChange={(e) => setNewItemData(p => ({...p, location: e.target.value}))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddNewItem}><Save className="mr-2 h-4 w-4"/> Add Item</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Item Dialog */}
      {editingItem && (
        <Dialog open={isEditDialogOpen} onOpenChange={(open) => { if(!open) setEditingItem(null); setIsEditDialogOpen(open); }}>
          <DialogContent className="sm:max-w-lg max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>Edit Inventory Item: {editingItem.name}</DialogTitle>
              <DialogDescription>Update the details for this item.</DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh] p-1">
            <div className="grid gap-4 py-4 pr-2">
              <div className="grid items-center gap-1.5">
                <Label htmlFor="editItemName">Name</Label>
                <Input id="editItemName" value={editFormData.name || ""} onChange={(e) => handleEditItemChange('name', e.target.value)} />
              </div>
              <div className="grid items-center gap-1.5">
                <Label htmlFor="editItemCategory">Category</Label>
                <Input id="editItemCategory" value={editFormData.category || ""} onChange={(e) => handleEditItemChange('category', e.target.value)} />
              </div>
              <div className="grid items-center gap-1.5">
                <Label htmlFor="editItemQuantity">Quantity</Label>
                <Input id="editItemQuantity" type="number" value={editFormData.quantity || 0} onChange={(e) => handleEditItemChange('quantity', parseInt(e.target.value) || 0)} />
              </div>
              <div className="grid items-center gap-1.5">
                <Label htmlFor="editItemDescription">Description</Label>
                <Textarea id="editItemDescription" value={editFormData.description || ""} onChange={(e) => handleEditItemChange('description', e.target.value)} />
              </div>
              <div className="grid items-center gap-1.5">
                <Label htmlFor="editItemLocation">Location</Label>
                <Input id="editItemLocation" value={editFormData.location || ""} onChange={(e) => handleEditItemChange('location', e.target.value)} />
              </div>
              <div className="grid items-center gap-1.5">
                <Label htmlFor="editItemStatus">Status</Label>
                <Select value={editFormData.status || "Available"} onValueChange={(val) => handleEditItemChange('status', val as InventoryItemStatus)}>
                  <SelectTrigger id="editItemStatus"><SelectValue /></SelectTrigger>
                  <SelectContent>{inventoryStatusOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              {editFormData.status === "Loaned" && (
                <>
                  <div className="grid items-center gap-1.5">
                    <Label htmlFor="editItemLoanedTo">Loaned To</Label>
                    <Input id="editItemLoanedTo" value={editFormData.loanedTo || ""} onChange={(e) => handleEditItemChange('loanedTo', e.target.value)} />
                  </div>
                  <div className="grid items-center gap-1.5">
                    <Label htmlFor="editItemLoanDate">Loan Date</Label>
                    <Input id="editItemLoanDate" type="datetime-local" value={formatIsoForInput(editFormData.loanDate)} onChange={(e) => handleEditItemChange('loanDate', e.target.value)} />
                  </div>
                  <div className="grid items-center gap-1.5">
                    <Label htmlFor="editItemExpectedReturn">Expected Return</Label>
                    <Input id="editItemExpectedReturn" type="datetime-local" value={formatIsoForInput(editFormData.expectedReturnDate)} onChange={(e) => handleEditItemChange('expectedReturnDate', e.target.value)} />
                  </div>
                </>
              )}
            </div>
            </ScrollArea>
            <DialogFooter className="pt-4">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleEditItemSubmit}><Save className="mr-2 h-4 w-4"/>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Confirm Return Dialog */}
      {itemToReturn && (
         <Dialog open={isConfirmReturnDialogOpen} onOpenChange={setIsConfirmReturnDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Confirm Item Return</DialogTitle>
              <DialogDescription>
                Are you sure you want to mark "<strong>{itemToReturn.name}</strong>" (loaned to {itemToReturn.loanedTo}) as returned and available?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsConfirmReturnDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleConfirmReturnItem}>Confirm Return</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

