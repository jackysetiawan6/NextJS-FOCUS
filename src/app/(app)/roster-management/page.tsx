
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { RosterEmployee, FullRosterData, ShiftCode } from "@/types";
import { 
  initialFullRosterData, 
  rosterEmployees as initialEmployees, 
  getYearsForRoster, 
  getMonthsForRoster 
} from "@/lib/data"; 
import { PlusCircle, Trash2 } from "lucide-react";
import { getDaysInMonth, format as formatDateFns } from 'date-fns';
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth(); // 0-11

const shiftCodeToBadgeVariant = (shiftCode: ShiftCode): "default" | "secondary" | "destructive" | "outline" => {
  switch (shiftCode) {
    case 'MS': return 'default';
    case 'NS': return 'secondary';
    case 'AS': return 'default';
    case 'D': return 'default';
    case 'OFF': return 'outline';
    default: return 'outline';
  }
};

const shiftCodeToBadgeClass = (shiftCode: ShiftCode): string => {
  switch (shiftCode) {
    case 'MS': return 'bg-blue-500 hover:bg-blue-600 text-white';
    case 'NS': return 'bg-purple-600 hover:bg-purple-700 text-white';
    case 'AS': return 'bg-orange-500 hover:bg-orange-600 text-white';
    case 'D': return 'bg-green-500 hover:bg-green-600 text-white';
    case 'OFF': return 'bg-gray-200 text-gray-700 border-gray-300';
    default: return 'bg-gray-100 text-gray-500 border-gray-200';
  }
};

const CLEAR_SHIFT_VALUE = "__CLEAR_SHIFT__";

const shiftSelectOptions: { value: ShiftCode | typeof CLEAR_SHIFT_VALUE, label: string }[] = [
  { value: 'MS', label: 'MS' },
  { value: 'NS', label: 'NS' },
  { value: 'AS', label: 'AS' },
  { value: 'D', label: 'D' },
  { value: 'OFF', label: 'OFF' },
  { value: CLEAR_SHIFT_VALUE, label: 'Unassign' },
];


export default function RosterManagementPage() {
  const { toast } = useToast();
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedMonth, setSelectedMonth] = useState<number>(5);
  const [employees, setEmployees] = useState<RosterEmployee[]>(initialEmployees);
  const [fullRoster, setFullRoster] = useState<FullRosterData>(initialFullRosterData);

  const [isAddEmployeeDialogOpen, setIsAddEmployeeDialogOpen] = useState(false);
  const [newEmployeeName, setNewEmployeeName] = useState("");

  const [isRemoveEmployeeDialogOpen, setIsRemoveEmployeeDialogOpen] = useState(false);
  const [employeeToRemove, setEmployeeToRemove] = useState<RosterEmployee | null>(null);
  
  const [todayDate, setTodayDate] = useState<Date>(() => new Date("2026-06-11T00:00:00Z")); // For highlighting today's column

  useEffect(() => {
    const now = new Date();
    setSelectedYear(now.getFullYear());
    setSelectedMonth(now.getMonth());
    setTodayDate(now);
  }, []);

  const years = useMemo(() => getYearsForRoster(), []);
  const months = useMemo(() => getMonthsForRoster(), []);

  const currentMonthlyRoster = useMemo(() => {
    return fullRoster[selectedYear]?.[selectedMonth] || {};
  }, [fullRoster, selectedYear, selectedMonth]);

  const daysInSelectedMonth = useMemo(() => {
    return getDaysInMonth(new Date(selectedYear, selectedMonth));
  }, [selectedYear, selectedMonth]);

  const processAddEmployee = () => {
    if (newEmployeeName && newEmployeeName.trim() !== "") {
      const trimmedName = newEmployeeName.trim();
      const newEmployee: RosterEmployee = {
        id: `emp${Date.now()}`,
        name: trimmedName,
        email: `${trimmedName.toLowerCase().replace(/\s+/g, '.')}@example.com`,
        avatarUrl: `https://placehold.co/40x40.png?text=${trimmedName.charAt(0)}`,
        avatarFallback: trimmedName.charAt(0).toUpperCase(),
        dataAiHint: "person placeholder",
      };
      
      const updatedEmployees = [...employees, newEmployee].sort((a, b) => a.name.localeCompare(b.name));
      setEmployees(updatedEmployees);

      setFullRoster(prevFullRoster => {
        const updatedRoster = JSON.parse(JSON.stringify(prevFullRoster));
        Object.keys(updatedRoster).forEach(yearStr => {
          const year = parseInt(yearStr);
          Object.keys(updatedRoster[year]).forEach(monthStr => {
            const month = parseInt(monthStr);
            if (!updatedRoster[year][month]) updatedRoster[year][month] = {};
            if (!updatedRoster[year][month][newEmployee.id]) { // Check if employee exists in this month
              updatedRoster[year][month][newEmployee.id] = {};
              const daysInMonthLoop = getDaysInMonth(new Date(year, month));
              for (let day = 1; day <= daysInMonthLoop; day++) {
                updatedRoster[year][month][newEmployee.id][day] = 'OFF';
              }
            }
          });
        });
        return updatedRoster;
      });

      toast({ title: "Employee Added", description: `${newEmployee.name} has been added to the roster.` });
      setIsAddEmployeeDialogOpen(false);
      setNewEmployeeName("");
    } else {
      toast({ title: "Invalid Name", description: "Employee name cannot be empty.", variant: "destructive" });
    }
  };

  const openRemoveEmployeeDialog = (employee: RosterEmployee) => {
    setEmployeeToRemove(employee);
    setIsRemoveEmployeeDialogOpen(true);
  };

  const processRemoveEmployee = () => {
    if (!employeeToRemove) return;

    setEmployees(prev => prev.filter(emp => emp.id !== employeeToRemove.id));
    
    setFullRoster(prevFullRoster => {
      const updatedRoster = JSON.parse(JSON.stringify(prevFullRoster));
       Object.keys(updatedRoster).forEach(yearStr => {
        const year = parseInt(yearStr);
        Object.keys(updatedRoster[year]).forEach(monthStr => {
          const month = parseInt(monthStr);
          if (updatedRoster[year][month]?.[employeeToRemove.id]) {
            delete updatedRoster[year][month][employeeToRemove.id];
          }
        });
      });
      return updatedRoster;
    });
    toast({ title: "Employee Removed", description: `${employeeToRemove.name} has been removed.`, variant: "destructive" });
    setIsRemoveEmployeeDialogOpen(false);
    setEmployeeToRemove(null);
  };

  const handleShiftChange = (employeeId: string, day: number, newShift: ShiftCode) => {
     setFullRoster(prevFullRoster => {
      const updatedRoster = JSON.parse(JSON.stringify(prevFullRoster));
      if (!updatedRoster[selectedYear]) updatedRoster[selectedYear] = {};
      if (!updatedRoster[selectedYear][selectedMonth]) updatedRoster[selectedYear][selectedMonth] = {};
      if (!updatedRoster[selectedYear][selectedMonth][employeeId]) updatedRoster[selectedYear][selectedMonth][employeeId] = {};
      
      updatedRoster[selectedYear][selectedMonth][employeeId][day] = newShift;
      return updatedRoster;
    });
  };
  

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Roster Management</h1>
          <p className="text-muted-foreground">
            View and manage employee work schedules.
          </p>
        </div>
        <Dialog open={isAddEmployeeDialogOpen} onOpenChange={setIsAddEmployeeDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setNewEmployeeName(""); setIsAddEmployeeDialogOpen(true); }}>
              <PlusCircle className="mr-2 h-5 w-5" /> Add Employee
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Employee</DialogTitle>
              <DialogDescription>
                Enter the name of the new employee to add them to the roster.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  value={newEmployeeName}
                  onChange={(e) => setNewEmployeeName(e.target.value)}
                  className="col-span-3"
                  placeholder="e.g., John Doe"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddEmployeeDialogOpen(false)}>Cancel</Button>
              <Button type="submit" onClick={processAddEmployee}>Add Employee</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Monthly Schedule</CardTitle>
          <div className="text-sm text-muted-foreground flex flex-col sm:flex-row sm:items-center gap-3">
            Select a year and month to view the roster.
            <div className="flex gap-3 mt-2 sm:mt-0 sm:ml-auto">
              <Select
                value={selectedYear.toString()}
                onValueChange={(value) => setSelectedYear(parseInt(value))}
              >
                <SelectTrigger className="w-full sm:w-[120px]">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  {years.map(year => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={selectedMonth.toString()}
                onValueChange={(value) => setSelectedMonth(parseInt(value))}
              >
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  {months.map(month => (
                    <SelectItem key={month.value} value={month.value.toString()}>{month.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {employees.length === 0 ? (
             <p className="text-muted-foreground text-center py-8">No employees added yet. Click "Add Employee" to start building the roster.</p>
          ) : (
          <div className="overflow-x-auto relative">
            <Table className="min-w-max">
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 bg-card z-10 w-[200px] min-w-[200px] font-semibold">Employee</TableHead>
                  {Array.from({ length: daysInSelectedMonth }, (_, i) => i + 1).map(day => {
                    const isToday = day === todayDate.getDate() && selectedMonth === todayDate.getMonth() && selectedYear === todayDate.getFullYear();
                    return (
                      <TableHead key={day} className={cn("text-center min-w-[60px] font-semibold", isToday && "bg-primary/10")}>{day}</TableHead>
                    );
                  })}
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map(employee => (
                  <TableRow key={employee.id}>
                    <TableCell className="sticky left-0 bg-card z-10 font-medium w-[200px] min-w-[200px]">
                       <div className="flex items-center justify-between gap-2">
                        <span className="truncate flex-grow" title={employee.name}>{employee.name}</span>
                        <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0" onClick={() => openRemoveEmployeeDialog(employee)} aria-label={`Remove ${employee.name}`}>
                           <Trash2 className="h-4 w-4 text-destructive/70 hover:text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                    {Array.from({ length: daysInSelectedMonth }, (_, i) => i + 1).map(day => {
                      const shift = currentMonthlyRoster[employee.id]?.[day] || '';
                      const isToday = day === todayDate.getDate() && selectedMonth === todayDate.getMonth() && selectedYear === todayDate.getFullYear();
                      return (
                        <TableCell
                          key={`${employee.id}-${day}`}
                          className={cn("text-center p-1 min-w-[60px]", isToday && "bg-primary/10")}
                          title={`Day ${day} - ${employee.name} - Shift: ${shift || 'Unassigned'}`}
                        >
                          <Select
                            value={shift === '' ? CLEAR_SHIFT_VALUE : shift}
                            onValueChange={(valueFromSelect) => {
                              const newShiftToSet = valueFromSelect === CLEAR_SHIFT_VALUE ? '' : valueFromSelect as ShiftCode;
                              handleShiftChange(employee.id, day, newShiftToSet);
                              toast({ title: "Shift Updated", description: `Shift for ${employee.name} on day ${day} set to ${newShiftToSet||'Unassigned'}.` });
                            }}
                          >
                            <SelectTrigger
                              className={cn(
                                "h-auto p-0 border-0 bg-transparent focus:ring-0 focus:ring-offset-0 w-full select-none",
                                "[&>svg]:hidden" 
                              )}
                               aria-label={`Edit shift for ${employee.name} on day ${day}`}
                            >
                              {shift ? (
                                <Badge 
                                  variant={shiftCodeToBadgeVariant(shift)} 
                                  className={cn("text-xs px-2 py-0.5 min-w-[3.5rem] h-6 flex justify-center items-center w-full cursor-pointer", shiftCodeToBadgeClass(shift))}
                                >
                                  {shift}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground/50 text-xs min-w-[3.5rem] h-6 flex justify-center items-center w-full cursor-pointer">
                                  -
                                </span>
                              )}
                            </SelectTrigger>
                            <SelectContent>
                              {shiftSelectOptions.map(opt => (
                                <SelectItem key={opt.value} value={opt.value} className="text-xs">
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          )}
        </CardContent>
      </Card>

      {/* Remove Employee Dialog */}
      {employeeToRemove && (
        <Dialog open={isRemoveEmployeeDialogOpen} onOpenChange={setIsRemoveEmployeeDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Remove Employee</DialogTitle>
              <DialogDescription>
                Are you sure you want to remove <strong>{employeeToRemove.name}</strong> from the roster? This action will remove all their shift data and cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setIsRemoveEmployeeDialogOpen(false); setEmployeeToRemove(null); }}>Cancel</Button>
              <Button variant="destructive" onClick={processRemoveEmployee}>Remove Employee</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

