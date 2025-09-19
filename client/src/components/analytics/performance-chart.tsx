import { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format, parseISO } from "date-fns";

interface PerformanceDataPoint {
  date: string;
  technicalScore: number;
  communicationScore: number;
  problemSolvingScore: number;
  overallScore: number;
}

interface PerformanceChartProps {
  data: PerformanceDataPoint[];
}

export default function PerformanceChart({ data }: PerformanceChartProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    // Group data by date and calculate averages
    const groupedData = data.reduce((acc, item) => {
      const date = format(parseISO(item.date), 'MMM dd');
      
      if (!acc[date]) {
        acc[date] = {
          date,
          technicalScores: [],
          communicationScores: [],
          problemSolvingScores: [],
          overallScores: [],
        };
      }
      
      acc[date].technicalScores.push(item.technicalScore);
      acc[date].communicationScores.push(item.communicationScore);
      acc[date].problemSolvingScores.push(item.problemSolvingScore);
      acc[date].overallScores.push(item.overallScore);
      
      return acc;
    }, {} as Record<string, any>);

    // Calculate averages for each date
    return Object.values(groupedData).map((group: any) => ({
      date: group.date,
      technical: Math.round((group.technicalScores.reduce((sum: number, score: number) => sum + score, 0) / group.technicalScores.length) * 10) / 10,
      communication: Math.round((group.communicationScores.reduce((sum: number, score: number) => sum + score, 0) / group.communicationScores.length) * 10) / 10,
      problemSolving: Math.round((group.problemSolvingScores.reduce((sum: number, score: number) => sum + score, 0) / group.problemSolvingScores.length) * 10) / 10,
      overall: Math.round((group.overallScores.reduce((sum: number, score: number) => sum + score, 0) / group.overallScores.length) * 10) / 10,
    })).slice(-30); // Show last 30 data points
  }, [data]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-4 shadow-lg">
          <p className="font-medium text-foreground mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {entry.value}/10
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (!chartData || chartData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <LineChart className="w-8 h-8" />
          </div>
          <p className="text-sm">No performance data available</p>
          <p className="text-xs">Data will appear as interviews are evaluated</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-64 w-full" data-testid="performance-chart">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis 
            dataKey="date" 
            className="text-xs text-muted-foreground"
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            domain={[0, 10]}
            className="text-xs text-muted-foreground"
            tick={{ fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ fontSize: '12px' }}
            iconType="line"
          />
          <Line
            type="monotone"
            dataKey="overall"
            stroke="hsl(var(--chart-1))"
            strokeWidth={3}
            name="Overall"
            dot={{ fill: "hsl(var(--chart-1))", strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: "hsl(var(--chart-1))", strokeWidth: 2 }}
          />
          <Line
            type="monotone"
            dataKey="technical"
            stroke="hsl(var(--chart-2))"
            strokeWidth={2}
            name="Technical"
            dot={{ fill: "hsl(var(--chart-2))", strokeWidth: 2, r: 3 }}
          />
          <Line
            type="monotone"
            dataKey="communication"
            stroke="hsl(var(--chart-3))"
            strokeWidth={2}
            name="Communication"
            dot={{ fill: "hsl(var(--chart-3))", strokeWidth: 2, r: 3 }}
          />
          <Line
            type="monotone"
            dataKey="problemSolving"
            stroke="hsl(var(--chart-4))"
            strokeWidth={2}
            name="Problem Solving"
            dot={{ fill: "hsl(var(--chart-4))", strokeWidth: 2, r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
