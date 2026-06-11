
"use client";

import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';

interface ClientFormattedTimestampProps {
  isoString: string | null | undefined;
  type?: 'short' | 'full';
  placeholder?: React.ReactNode;
}

const formatTimestampInternal = (isoString: string | null | undefined, type: 'short' | 'full' = 'full') => {
  if (!isoString) return "N/A";
  try {
    const date = parseISO(isoString);
    return type === 'short'
      ? format(date, "MMM d, HH:mm")
      : format(date, "dd MMMM yyyy, HH:mm:ss"); // Updated format string here
  } catch (error) {
    // Don't log to console in production for this common case, return Invalid Date
    return "Invalid Date";
  }
};

export function ClientFormattedTimestamp({ isoString, type = 'full', placeholder }: ClientFormattedTimestampProps) {
  const [formattedDate, setFormattedDate] = useState<string | null>(null);

  useEffect(() => {
    if (isoString) {
      setFormattedDate(formatTimestampInternal(isoString, type));
    } else {
      setFormattedDate("N/A");
    }
  }, [isoString, type]);

  if (formattedDate === null) {
    return <>{placeholder || <span className="text-xs text-muted-foreground">...</span>}</>;
  }

  return <>{formattedDate}</>;
}
