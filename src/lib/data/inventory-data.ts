
import type { InventoryItem, InventoryItemStatus } from "@/types";
import { initialInventoryLoanItems } from "./dashboard-data"; 
import { addDays, subDays } from "date-fns";

// Helper to get loan details for items that are initially loaned out.
// This ensures consistency between what the dashboard shows and the initial state of All Inventory.
const getInitialLoanDetails = (itemId: string): Partial<InventoryItem> => {
  const loanedItem = initialInventoryLoanItems.find(item => item.id === itemId);
  if (loanedItem) {
    return {
      status: "Loaned",
      loanedTo: loanedItem.loanedTo,
      loanDate: loanedItem.loanDate,
      expectedReturnDate: loanedItem.expectedReturnDate,
      quantity: loanedItem.quantity // Ensure quantity from loan data is used if item is singular
    };
  }
  return {}; 
};

export const allInventoryItems: InventoryItem[] = [
  { 
    id: 'inv001', 
    name: 'Fluke Multimeter 87V', 
    category: "Test Equipment", 
    quantity: 1, 
    description: "High-precision digital multimeter for electrical diagnostics.",
    location: "Tool Cabinet A1",
    dataAiHint: 'electronic equipment',
    ...getInitialLoanDetails('inv001'), // Merges loan status if applicable
  },
  { 
    id: 'inv002', 
    name: 'Thermal Camera FLIR E8', 
    category: "Inspection Tools", 
    quantity: 1, 
    description: "Infrared thermal imaging camera for identifying heat signatures.",
    location: "Tool Cabinet B3",
    dataAiHint: 'inspection tool',
    ...getInitialLoanDetails('inv002'),
  },
  { 
    id: 'inv003', 
    name: 'Impact Drill Set Bosch', 
    category: "Power Tools", 
    quantity: 1, 
    description: "Heavy-duty impact drill with various bit attachments.",
    location: "Maintenance Workshop",
    dataAiHint: 'power tool',
    ...getInitialLoanDetails('inv003'),
  },
  { 
    id: 'inv004', 
    name: 'Ladder 12ft Extension', 
    category: "Safety Equipment", 
    quantity: 1, 
    description: "Fiberglass extension ladder, 12ft working height.",
    location: "Storage Room C",
    dataAiHint: 'safety equipment',
    ...getInitialLoanDetails('inv004'),
  },
  { 
    id: 'inv005', 
    name: 'Portable Gas Detector', 
    category: "Safety Equipment", 
    quantity: 1, 
    description: "Multi-gas detector for CO, H2S, O2, LEL.",
    location: "Safety Office",
    dataAiHint: 'safety detector',
    ...getInitialLoanDetails('inv005'),
  },
  { 
    id: 'inv006', 
    name: 'Set of Pipe Wrenches', 
    category: "Hand Tools", 
    quantity: 1, 
    description: "Various sizes of heavy-duty pipe wrenches.",
    location: "Plumbing Store",
    dataAiHint: 'hand tool',
    ...getInitialLoanDetails('inv006'),
  },
  { 
    id: 'inv007', 
    name: 'Fiber Optic Splicer Kit', 
    category: "Network Tools", 
    quantity: 2, 
    status: "Available", // Not in initialLoanItems, so default status
    dataAiHint: 'network equipment',
    description: "Complete kit for fusion splicing fiber optic cables.",
    location: "Network Room A"
  },
  { 
    id: 'inv008', 
    name: 'Safety Harness (Full Body)', 
    category: "Safety Equipment", 
    quantity: 5, 
    status: "Available", 
    dataAiHint: 'safety gear',
    description: "Fall arrest system harness, universal size.",
    location: "Safety Store"
  },
  { 
    id: 'inv009', 
    name: 'PDU 32A Rack Mount', 
    category: "Power Equipment", 
    quantity: 10, 
    status: "Available", 
    dataAiHint: 'electrical PDU',
    description: "Rack-mountable Power Distribution Unit, 32 Amp.",
    location: "Spares - PDU Cabinet"
  },
  { 
    id: 'inv010', 
    name: 'UPS Battery Cartridge RBC55', 
    category: "UPS Spares", 
    quantity: 3, 
    status: "Under Maintenance", 
    dataAiHint: 'UPS battery',
    description: "Replacement battery cartridge for APC Smart-UPS models.",
    location: "Battery Charging Station"
  },
  {
    id: 'inv011',
    name: 'Server RAM 32GB DDR4 ECC',
    category: 'Server Spares',
    quantity: 12,
    status: 'Available',
    dataAiHint: 'computer memory',
    description: '32GB ECC DDR4 RAM module for enterprise servers.',
    location: 'Spares - Server Components',
  },
  {
    id: 'inv012',
    name: 'CAT6 Patch Cables (5m, Blue)',
    category: 'Cabling',
    quantity: 50,
    status: 'Available',
    dataAiHint: 'network cables',
    description: 'Box of 50 x 5-meter blue CAT6 Ethernet patch cables.',
    location: 'Network Store - Cables',
  },
  {
    id: 'inv013',
    name: 'Portable Air Scrubber',
    category: 'HVAC Equipment',
    quantity: 1,
    status: 'Under Maintenance',
    dataAiHint: 'air purifier',
    description: 'Industrial air scrubber for dust and particle removal during maintenance.',
    location: 'Maintenance Workshop',
  },
   {
    id: 'inv014',
    name: 'Laser Distance Measurer',
    category: 'Test Equipment',
    quantity: 2,
    status: 'Available',
    dataAiHint: 'measuring tool',
    description: 'Bosch GLM 50 C, measures up to 165 feet.',
    location: 'Tool Cabinet A2',
  },
  {
    id: 'inv015',
    name: 'Set of Insulated Screwdrivers',
    category: 'Hand Tools',
    quantity: 3,
    status: 'Available',
    dataAiHint: 'electrician tools',
    description: 'VDE certified insulated screwdriver set for electrical work.',
    location: 'Electrical Workshop',
  },
].map((item): InventoryItem => ({ ...item, status: (item.status || "Available") as InventoryItemStatus })); // Ensure default status if not set by getInitialLoanDetails

export const inventoryStatusOptions: InventoryItemStatus[] = ["Available", "Loaned", "Under Maintenance", "Out of Stock"];
export const defaultInventoryItemFormData: Omit<InventoryItem, 'id' | 'dataAiHint'> = {
  name: "",
  category: "",
  quantity: 1,
  status: "Available",
  description: "",
  location: "",
  loanedTo: null,
  loanDate: null,
  expectedReturnDate: null,
};

