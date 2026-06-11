
'use client';

import type { ChartData, ChartOptions } from 'chart.js';
import React, { useState, useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  BarController,
  LineElement,
  PointElement,
  LineController, // Added LineController
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Chart } from 'react-chartjs-2';
import { useTheme } from '@/components/theme-provider';
import type { DailyPowerData } from "@/types";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  BarController,
  LineElement,
  PointElement,
  LineController, // Registered LineController
  Title,
  Tooltip,
  Legend
);

export function PowerConsumptionChartJs({ data }: { data: DailyPowerData[] }) {
  const { theme } = useTheme();
  const chartRef = useRef<ChartJS<'bar' | 'line', number[], string>>(null);

  const getChartColors = (currentTheme: string | undefined) => {
    const isDark = currentTheme === 'dark';
    return {
      zoneAColor: isDark ? 'hsl(155 65% 58%)' : 'hsl(155 60% 40%)',
      zoneBColor: isDark ? 'hsl(210 40% 65%)' : 'hsl(210 35% 50%)',
      cumulativeZoneAColor: isDark ? 'hsl(35 95% 68%)' : 'hsl(35 90% 60%)',
      cumulativeZoneBColor: isDark ? 'hsl(270 80% 70%)' : 'hsl(270 70% 60%)',
      gridColor: isDark ? 'hsla(210, 15%, 40%, 0.3)' : 'hsla(210, 20%, 75%, 0.3)',
      textColor: isDark ? 'hsl(210 20% 90%)' : 'hsl(215 25% 25%)',
      tooltipBg: isDark ? 'hsl(215 30% 17%)' : 'hsl(0 0% 100%)',
      tooltipBorder: isDark ? 'hsl(210 15% 30%)' : 'hsl(210 20% 88%)',
    };
  };

  const [colors, setColors] = useState(getChartColors(theme));

  useEffect(() => {
    setColors(getChartColors(theme));
    if (chartRef.current) {
        chartRef.current.update();
    }
  }, [theme]);

  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center h-[400px] text-muted-foreground">Loading chart data...</div>;
  }

  const labels = data.map(d => d.date);

  const chartJsDataConfig: ChartData<('bar' | 'line'), number[], string> = {
    labels,
    datasets: [
      {
        type: 'bar' as const,
        label: 'Zone A Daily (kWh)',
        data: data.map(d => d.zoneA),
        backgroundColor: colors.zoneAColor,
        borderColor: colors.zoneAColor,
        yAxisID: 'yDaily',
      },
      {
        type: 'bar' as const,
        label: 'Zone B Daily (kWh)',
        data: data.map(d => d.zoneB),
        backgroundColor: colors.zoneBColor,
        borderColor: colors.zoneBColor,
        yAxisID: 'yDaily',
      },
      {
        type: 'line' as const,
        label: 'Zone A Cumulative (kWh)',
        data: data.map(d => d.cumulativeZoneA),
        borderColor: colors.cumulativeZoneAColor,
        backgroundColor: colors.cumulativeZoneAColor,
        tension: 0.1,
        fill: false,
        yAxisID: 'yCumulative',
        pointRadius: 0,
        pointHoverRadius: 5,
      },
      {
        type: 'line' as const,
        label: 'Zone B Cumulative (kWh)',
        data: data.map(d => d.cumulativeZoneB),
        borderColor: colors.cumulativeZoneBColor,
        backgroundColor: colors.cumulativeZoneBColor,
        tension: 0.1,
        fill: false,
        yAxisID: 'yCumulative',
        pointRadius: 0,
        pointHoverRadius: 5,
      },
    ],
  };

  const options: ChartOptions<('bar' | 'line')> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
            color: colors.textColor,
        }
      },
      title: {
        display: false,
      },
      tooltip: {
        backgroundColor: colors.tooltipBg,
        titleColor: colors.textColor,
        bodyColor: colors.textColor,
        borderColor: colors.tooltipBorder,
        borderWidth: 1,
        padding: 10,
        cornerRadius: 6,
      }
    },
    scales: {
      x: {
        stacked: false,
        grid: {
          color: colors.gridColor,
        },
        ticks: {
          color: colors.textColor,
          font: { size: 12 }
        },
      },
      yDaily: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
            display: true,
            text: 'Daily kWh',
            color: colors.textColor,
            font: { size: 14, weight: 'normal' }
        },
        grid: {
          color: colors.gridColor,
        },
        ticks: {
          color: colors.textColor,
          font: { size: 12 }
        },
      },
      yCumulative: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
            display: true,
            text: 'Cumulative kWh',
            color: colors.textColor,
            font: { size: 14, weight: 'normal' }
        },
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          color: colors.textColor,
          font: { size: 12 }
        },
      },
    },
  };

  return (
    <div className="h-[400px] w-full p-2">
      <Chart key={theme} ref={chartRef} type='bar' data={chartJsDataConfig} options={options} />
    </div>
  );
}
