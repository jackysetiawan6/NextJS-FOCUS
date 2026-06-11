
import type { ElectricalUnitLogEntry, ElectricalUnit, ShiftType } from '@/types';
import { subDays, formatISO, parseISO, setHours, setMinutes, setSeconds } from 'date-fns';

export const electricalUnits: ElectricalUnit[] = [
  { id: 'pdu-a01', name: 'PDU-A01', type: 'PDU', zone: 'A', nominalReading: 80, unit: 'kWh' },
  { id: 'crac-a01', name: 'CRAC-A01', type: 'CRAC', zone: 'A', nominalReading: 21.5, unit: '°C' },
  { id: 'genset-a', name: 'GenSet-A', type: 'GEN', zone: 'A', nominalReading: 85, unit: '%' },
  { id: 'pdu-b01', name: 'PDU-B01', type: 'PDU', zone: 'B', nominalReading: 95, unit: 'kWh' },
  { id: 'crac-b01', name: 'CRAC-B01', type: 'CRAC', zone: 'B', nominalReading: 22.0, unit: '°C' },
  { id: 'ups-b', name: 'UPS-B', type: 'UPS', zone: 'B', nominalReading: 92, unit: '%' },
  { id: 'pdu-a02', name: 'PDU-A02', type: 'PDU', zone: 'A', nominalReading: 75, unit: 'kWh' },
  { id: 'pdu-b02', name: 'PDU-B02', type: 'PDU', zone: 'B', nominalReading: 105, unit: 'kWh' },
  { id: 'crac-a02', name: 'CRAC-A02', type: 'CRAC', zone: 'A', nominalReading: 21.0, unit: '°C' },
  { id: 'crac-b02', name: 'CRAC-B02', type: 'CRAC', zone: 'B', nominalReading: 22.5, unit: '°C' },
];

const generateLogEntriesForDay = (date: Date): ElectricalUnitLogEntry[] => {
  const entries: ElectricalUnitLogEntry[] = [];
  const shifts: ShiftType[] = ['Morning', 'Afternoon', 'Night'];
  const operators = ['Operator A', 'Operator B', 'Operator C', 'Operator D', 'Operator E'];

  electricalUnits.forEach(unit => {
    shifts.forEach(shift => {
      let baseHourShiftStart = 0;
      if (shift === 'Morning') baseHourShiftStart = 7;
      else if (shift === 'Afternoon') baseHourShiftStart = 15;
      else if (shift === 'Night') baseHourShiftStart = 23;

      // Generate 1 to 3 log entries per unit per shift for daily-like readings
      const numEntriesThisShift = unit.type === 'PDU' ? 1 : Math.floor(Math.random() * 2) + 1; 

      for (let i = 0; i < numEntriesThisShift; i++) {
        const hourOffset = Math.floor(i * (8 / numEntriesThisShift)) + Math.floor(Math.random() * 3); // Randomize hour within the shift segment
        const minuteOffset = Math.floor(Math.random() * 60);
        const secondOffset = Math.floor(Math.random() * 60);
        
        let timestamp = setSeconds(setMinutes(setHours(new Date(date), baseHourShiftStart + hourOffset), minuteOffset), secondOffset);

        if (shift === 'Night' && (baseHourShiftStart + hourOffset) >= 24) {
            timestamp = setSeconds(setMinutes(setHours(new Date(date), (baseHourShiftStart + hourOffset) % 24 ), minuteOffset), secondOffset);
            timestamp.setDate(timestamp.getDate() + 1);
        }

        let readingValue: number;
        let readingUnitDisplay = unit.unit || 'N/A';

        if (unit.type === 'PDU') { // Simulate daily kWh consumption
          readingValue = (unit.nominalReading || 80) + (Math.random() - 0.5) * ((unit.nominalReading || 80) * 0.2); // +/- 20%
          readingUnitDisplay = 'kWh';
        } else if (unit.type === 'CRAC') { // Simulate temperature
          readingValue = (unit.nominalReading || 22) + (Math.random() - 0.5) * 2; // +/- 2°C
          readingUnitDisplay = '°C';
        } else if (unit.type === 'GEN' || unit.type === 'UPS') { // Simulate percentage
          readingValue = (unit.nominalReading || 90) + (Math.random() - 0.5) * 10; // +/- 10%
          if (readingValue > 100) readingValue = 100;
          if (readingValue < 0) readingValue = 0;
          readingUnitDisplay = '%';
        } else {
          readingValue = (unit.nominalReading || 0) + (Math.random() - 0.5) * ((unit.nominalReading || 0) * 0.1);
        }
        
        readingValue = parseFloat(readingValue.toFixed(2));

        entries.push({
          id: `log-${unit.id}-${formatISO(timestamp)}-${i}`,
          unitId: unit.id,
          unitName: unit.name,
          zone: unit.zone,
          shift,
          timestamp: formatISO(timestamp),
          readingValue: readingValue,
          readingUnit: readingUnitDisplay,
          notes: `Routine check. Value: ${readingValue} ${readingUnitDisplay}. Operator: ${operators[Math.floor(Math.random() * operators.length)]}`,
          operator: operators[Math.floor(Math.random() * operators.length)],
        });
      }
    });
  });
  return entries;
};

export const initialElectricalLogEntries: ElectricalUnitLogEntry[] = (() => {
    let allEntries: ElectricalUnitLogEntry[] = [];
    const today = new Date();
    
    // Generate for today and last 14 days to ensure 10 days of history + buffer
    for (let i = 0; i < 15; i++) {
        const date = subDays(today, i);
        allEntries = allEntries.concat(generateLogEntriesForDay(date));
    }
    
    allEntries.sort((a, b) => parseISO(b.timestamp).getTime() - parseISO(a.timestamp).getTime());
    return allEntries;
})();

