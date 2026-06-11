
"use client";

import React, { useEffect, useState, useRef } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, TimeScale, Colors } from 'chart.js';
import type { ChartData, ChartOptions } from 'chart.js';
import { Chart } from 'react-chartjs-2';
import { useTheme } from '@/components/theme-provider';
import 'chartjs-adapter-date-fns';
import { parseISO, format } from 'date-fns';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, TimeScale, Title, Tooltip, Legend, Colors);

interface ComparisonChartDataset {
  label: string;
  data: (number | null)[];
  borderColor: string;
  tension: number;
  fill?: boolean;
  pointRadius?: number;
  pointHoverRadius?: number;
}
interface TenDayComparisonChartData {
  labels: string[]; // Array of 10 date strings (e.g., "Jun 01")
  datasets: ComparisonChartDataset[];
  unitOfMeasurement: string;
}

// Props for the original chart type (single day, multiple units)
interface SingleDayChartData {
  [unitId: string]: {
    unitName: string;
    zone: 'A' | 'B';
    data: { x: string; y: number }[]; // x is formatted time string 'HH:mm:ss'
  };
}

interface ElectricalUnitLogChartProps {
  data: TenDayComparisonChartData | SingleDayChartData | null;
  chartType: 'comparison' | 'singleDay'; // To differentiate between the two chart types
}

const ElectricalUnitLogChart: React.FC<ElectricalUnitLogChartProps> = ({ data, chartType }) => {
  const { theme } = useTheme();
  const chartRef = useRef<ChartJS<'line', (number | { x: number; y: number } | null)[], string>>(null);


  const getChartStyling = (currentTheme: string | undefined) => {
    const isDark = currentTheme === 'dark';
    return {
      gridColor: isDark ? 'hsla(210, 15%, 40%, 0.3)' : 'hsla(210, 20%, 75%, 0.3)',
      textColor: isDark ? 'hsl(210 20% 90%)' : 'hsl(215 25% 25%)',
      tooltipBg: isDark ? 'hsl(215 30% 17%)' : 'hsl(0 0% 100%)',
      tooltipBorder: isDark ? 'hsl(210 15% 30%)' : 'hsl(210 20% 88%)',
      zoneAColor: isDark ? 'hsl(var(--chart-1))' : 'hsl(var(--chart-1))',
      zoneBColor: isDark ? 'hsl(var(--chart-2))' : 'hsl(var(--chart-2))',
    };
  };
  
  const [styling, setStyling] = useState(getChartStyling(theme));

  useEffect(() => {
    setStyling(getChartStyling(theme));
    if (chartRef.current) {
      chartRef.current.update();
    }
  }, [theme]);

  if (!data) {
    return <div className="h-[350px] w-full flex items-center justify-center text-muted-foreground">Chart data not available.</div>;
  }

  let chartJSData: ChartData<'line', (number | { x: number; y: number } | null)[], string>;
  let chartOptions: ChartOptions<'line'>;

  if (chartType === 'comparison' && data && 'datasets' in data) {
    const comparisonData = data as TenDayComparisonChartData;
    chartJSData = {
      labels: comparisonData.labels,
      datasets: comparisonData.datasets.map(ds => ({
        ...ds,
        fill: false,
        pointRadius: 2,
        pointHoverRadius: 5,
      })),
    };
    chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { position: 'top', labels: { color: styling.textColor, usePointStyle: true, boxWidth: 8 } },
        tooltip: {
          backgroundColor: styling.tooltipBg,
          titleColor: styling.textColor,
          bodyColor: styling.textColor,
          borderColor: styling.tooltipBorder,
          borderWidth: 1,
          padding: 10,
          cornerRadius: 6,
        },
        colors: { enabled: true, forceOverride: false }
      },
      scales: {
        x: {
          title: { display: true, text: 'Date (Last 10 Days)', color: styling.textColor },
          grid: { color: styling.gridColor },
          ticks: { color: styling.textColor, font: { size: 10 } },
        },
        y: {
          title: { display: true, text: `Average Reading (${comparisonData.unitOfMeasurement})`, color: styling.textColor },
          grid: { color: styling.gridColor },
          ticks: { color: styling.textColor },
          beginAtZero: false,
        },
      },
    };
  } else if (chartType === 'singleDay' && data && !('datasets' in data)) {
    // This is the original logic for single day, multiple unit comparison (kept for reference or future use)
    const singleDayData = data as SingleDayChartData;
     chartJSData = {
      datasets: Object.entries(singleDayData).map(([unitId, unitData]) => ({
        label: `${unitData.unitName} (${unitData.zone})`,
        data: unitData.data.map(dp => ({
          x: parseISO(`1970-01-01T${dp.x}Z`).getTime(),
          y: dp.y,
        })),
        borderColor: unitData.zone === 'A' ? styling.zoneAColor : styling.zoneBColor,
        tension: 0.1,
        fill: false,
        pointRadius: 2,
        pointHoverRadius: 5,
      })),
    };
    chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { position: 'top', labels: { color: styling.textColor, usePointStyle: true, boxWidth: 8 } },
        tooltip: {
          backgroundColor: styling.tooltipBg,
          titleColor: styling.textColor,
          bodyColor: styling.textColor,
          borderColor: styling.tooltipBorder,
          borderWidth: 1,
          padding: 10,
          cornerRadius: 6,
          callbacks: {
            title: (tooltipItems) => tooltipItems.length > 0 ? format(new Date(tooltipItems[0].parsed.x), 'HH:mm:ss') : '',
          }
        },
        colors: { enabled: true, forceOverride: false }
      },
      scales: {
        x: {
          type: 'time',
          time: { parser: 'HH:mm:ss', tooltipFormat: 'HH:mm:ss', unit: 'minute', displayFormats: { minute: 'HH:mm', hour: 'HH:00' }},
          title: { display: true, text: 'Time', color: styling.textColor },
          grid: { color: styling.gridColor },
          ticks: { color: styling.textColor, font: { size: 10 } },
        },
        y: {
          title: { display: true, text: 'Reading Value', color: styling.textColor },
          grid: { color: styling.gridColor },
          ticks: { color: styling.textColor },
          beginAtZero: false,
        },
      },
    };
  } else {
     return <div className="h-[350px] w-full flex items-center justify-center text-muted-foreground">Invalid chart data or type.</div>;
  }


  return (
    <div className="h-[350px] w-full p-1">
      <Chart ref={chartRef} type="line" data={chartJSData} options={chartOptions} />
    </div>
  );
};

export default ElectricalUnitLogChart;

