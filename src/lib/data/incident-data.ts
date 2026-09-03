
import type { IncidentReport } from "@/types";

export const initialIncidents: IncidentReport[] = [
  {
    id: Date.now().toString().slice(-10) + "1",
    title: "Network Outage - Sector B",
    description: "Complete loss of network connectivity in server racks B1-B10.",
    reportedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 - 3 * 60 * 60 * 1000).toISOString(), // 5 days and 3 hours ago
    status: "Active",
    assignedTo: "Alex Morgan",
    progressUpdates: [
        { text: "Initial assessment of Sector B network infrastructure started.", timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 - 2 * 60 * 60 * 1000).toISOString()}, // 5d 2h ago
        { text: "Power cycling core switch B-Core-1.", timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 - 1 * 60 * 60 * 1000).toISOString()}, // 5d 1h ago
        { text: "Issue appears to be with fiber uplink. Checking patches.", timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 - 5 * 60 * 60 * 1000).toISOString()}, // 3d 5h ago
        { text: "Replaced faulty fiber patch cable between B-Core-1 and main router.", timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 - 4 * 60 * 60 * 1000).toISOString()}, // 3d 4h ago
        { text: "Connectivity restored to 50% of racks in Sector B.", timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 - 6 * 60 * 60 * 1000).toISOString()}, // 2d 6h ago
        { text: "Further diagnostics reveal intermittent issues on line card 3 of B-Core-1.", timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 - 3 * 60 * 60 * 1000).toISOString()}, // 2d 3h ago
        { text: "Line card 3 reseated. Full connectivity restored to all racks in Sector B. Monitoring for stability.", timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 - 8 * 60 * 60 * 1000).toISOString()} // 1d 8h ago
    ],
    urgency: "Critical",
    lastUpdatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 - 8 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: Date.now().toString().slice(-10) + "2",
    title: "HVAC Unit A3 Overheating",
    description: "HVAC unit in Zone A, row 3 is reporting high temperature alarms and emitting unusual noises.",
    reportedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000 - 5 * 60 * 60 * 1000).toISOString(), // 4 days 5 hours ago
    status: "Waiting for Spare Part",
    assignedTo: "Jordan Lee",
    progressUpdates: [
        { text: "Technician dispatched. Initial check confirms high temperature.", timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000 - 4 * 60 * 60 * 1000).toISOString()}, // 4d 4h ago
        { text: "Unusual fan noise identified. Coolant levels appear low.", timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000 - 3 * 60 * 60 * 1000).toISOString()}, // 4d 3h ago
        { text: "Unit taken offline to prevent further damage.", timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 - 7 * 60 * 60 * 1000).toISOString()}, // 2d 7h ago
        { text: "Fan motor diagnosed as failing. Part number XYZ-123 identified.", timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 - 5 * 60 * 60 * 1000).toISOString()}, // 2d 5h ago
        { text: "Replacement fan motor XYZ-123 ordered from vendor. ETA 24-48 hours.", timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 - 6 * 60 * 60 * 1000).toISOString()} // 1d 6h ago
    ],
    urgency: "High",
    lastUpdatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 - 6 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: Date.now().toString().slice(-10) + "3",
    title: "Unauthorized Access Attempt - Main Entrance",
    description: "Security system logged multiple failed badge swipes at main entrance (Turnstile 2).",
    reportedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000 - 1 * 60 * 60 * 1000).toISOString(), // 6 days 1 hour ago
    status: "Closed",
    assignedTo: "Taylor Reed",
    progressUpdates: [
        { text: "Alert received from access control system.", timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()}, // 6d ago
        { text: "Security team reviewing CCTV footage for Turnstile 2 around the time of alerts.", timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 - 23 * 60 * 60 * 1000).toISOString()}, // 5d 23h ago
        { text: "CCTV footage reviewed. Identified as a former employee whose access card was not deactivated.", timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 - 20 * 60 * 60 * 1000).toISOString()}, // 5d 20h ago
        { text: "Former employee's access card has been deactivated in the system. No breach detected. Case closed.", timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 - 18 * 60 * 60 * 1000).toISOString()} // 5d 18h ago
    ],
    urgency: "Medium",
    lastUpdatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 - 18 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: Date.now().toString().slice(-10) + "4",
    title: "Backup Generator G2 Failure to Start",
    description: "Generator G2 failed to start during weekly automated test sequence. Error code: E-042 (Fuel System).",
    reportedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 - 2 * 60 * 60 * 1000).toISOString(), // 3 days 2 hours ago
    status: "Waiting for Maintenance",
    assignedTo: "Maintenance Team",
    progressUpdates: [
        { text: "Automated test failed for G2. Maintenance team alerted.", timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 - 1 * 60 * 60 * 1000).toISOString()}, // 3d 1h ago
        { text: "Initial diagnostics run by on-site technician. Fuel line appears clear.", timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 - 23 * 60 * 60 * 1000).toISOString()}, // 2d 23h ago
        { text: "Suspecting starter motor or fuel injector issue. Advanced diagnostics scheduled.", timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 - 20 * 60 * 60 * 1000).toISOString()},
        { text: "Vendor (GenSupport Inc.) contacted for specialized repair. ETA 4 hours.", timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 - 10 * 60 * 60 * 1000).toISOString()} // 1d 10h ago
    ],
    urgency: "Critical",
    lastUpdatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 - 10 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: Date.now().toString().slice(-10) + "5",
    title: "Minor Water Leak - Restroom 3B",
    description: "Small puddle found near sink in restroom 3B, adjacent to Data Hall C wall. Source unclear.",
    reportedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 - 30 * 60 * 1000).toISOString(), // 2 days 30 mins ago
    status: "Logged",
    assignedTo: "Facility Team",
    progressUpdates: [
        { text: "Leak reported by cleaning staff. Facility team dispatched to investigate.", timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 - 15 * 60 * 1000).toISOString()}, // 2d 15m ago
        { text: "Area cordoned off. Janitorial notified for cleanup.", timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 - 23 * 60 * 60 * 1000).toISOString()}, // 1d 23h ago
        { text: "Plumber scheduled to inspect pipework tomorrow morning. No immediate risk to critical areas identified.", timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 - 20 * 60 * 60 * 1000).toISOString()} // 1d 20h ago
    ],
    urgency: "Low",
    lastUpdatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 - 20 * 60 * 60 * 1000).toISOString(),
  },
];
