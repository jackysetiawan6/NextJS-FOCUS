
import type { ShiftChecklist, DailyPersonnelActivities, PersonnelActivityStatus } from "@/types";

const generateChecklistItems = (shiftPrefix: string, sectionPrefix: string, labels: string[]): { id: string, label: string, checked: boolean }[] => {
  return labels.map((label, i) => ({
    id: `${shiftPrefix}_${sectionPrefix}_${i + 1}`,
    label,
    checked: false,
  }));
};

export const initialShiftChecklists: ShiftChecklist[] = [
  {
    shift: "Morning",
    sections: [
      {
        title: "Activity of The Day (Daily Routine)",
        items: generateChecklistItems("m", "aod", [
          "Review overnight shift reports and system-generated alerts.",
          "Perform daily system health checks (e.g., server status, network links, key applications).",
          "Check and respond to critical emails and communication channels.",
          "Update main shift log with ongoing activities and observations.",
          "Prepare handover notes for the afternoon shift, highlighting key events.",
        ]),
      },
    ],
  },
  {
    shift: "Afternoon",
    sections: [
      {
        title: "Activity of The Day (Daily Routine)",
        items: generateChecklistItems("a", "aod", [
          "Review morning shift handover notes and address outstanding tasks.",
          "Conduct scheduled mid-shift equipment inspections and environmental readings.",
          "Process any new service requests or incident tickets received.",
          "Monitor ongoing maintenance activities and vendor performance.",
          "Compile a comprehensive end-of-shift report for night shift handover.",
        ]),
      },
    ],
  },
  {
    shift: "Night",
    sections: [
      {
        title: "Activity of The Day (Daily Routine)",
        items: generateChecklistItems("n", "aod", [
          "Review afternoon shift handover documentation and critical system alerts.",
          "Oversee and monitor scheduled off-peak automated tasks (e.g., system backups, patch deployments).",
          "Perform periodic security sweeps and physical checks of critical areas.",
          "Document all night shift activities, incidents, and system states thoroughly.",
          "Prepare a detailed handover report for the morning shift, noting any anomalies or concerns.",
        ]),
      },
    ],
  },
];

export const initialPersonnelActivities: DailyPersonnelActivities[] = [
  {
    shift: "Morning",
    activitiesByPersonnel: [
      { 
        personnelName: "Jamie Carter",
        activities: [
          { text: "Checked server room temperatures", status: "Completed" },
          { text: "Responded to 3 support tickets", status: "Completed" },
          { text: "Update network diagram for Rack A5", status: "In Progress" }
        ] 
      },
      { 
        personnelName: "Devon Kim",
        activities: [
          { text: "Escorted HVAC vendor for Unit B2 maintenance", status: "Completed" },
          { text: "Replaced faulty PSU in server SVR-07B", status: "Completed" },
          { text: "Perform daily backup verification", status: "Pending" }
        ] 
      },
    ]
  },
  {
    shift: "Afternoon",
    activitiesByPersonnel: [
      { 
        personnelName: "Robin Hayes",
        activities: [
          { text: "Monitored power consumption trends", status: "Completed" },
          { text: "Investigated minor alert on UPS-C1 (false positive)", status: "Completed" },
          { text: "Prepared shift handover document", status: "Completed" }
        ] 
      },
      { 
        personnelName: "Cameron Blake",
        activities: [
          { text: "Conducted security patrol of all data halls", status: "In Progress" },
          { text: "Reviewed access logs for anomalies", status: "Pending" },
          { text: "Assisted with new PDU installation in Data Hall D", status: "Completed" }
        ] 
      },
    ]
  },
  {
    shift: "Night",
    activitiesByPersonnel: [
      { 
        personnelName: "Leslie Park",
        activities: [
          { text: "Oversaw automated patch deployment cycle", status: "Completed" },
          { text: "Performed routine check on fire suppression system status", status: "Completed" },
          { text: "Logged cooling system performance data", status: "Completed" }
        ] 
      },
      { 
        personnelName: "Quinn Foster",
        activities: [
          { text: "Managed overnight network monitoring alerts", status: "Completed" },
          { text: "Troubleshot intermittent connectivity for dev servers (resolved)", status: "Completed" },
          { text: "Prepared morning shift briefing notes", status: "In Progress" }
        ] 
      },
    ]
  }
];
