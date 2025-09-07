import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface RadarCompetency {
  name: string;
  description: string;
  currentScore: number;
  targetScore: number;
}

interface CompetencyRadarProps {
  competencies: RadarCompetency[];
}

export function CompetencyRadar({ competencies }: CompetencyRadarProps) {
  const data = competencies.map((comp) => ({
    subject: comp.name,
    current: comp.currentScore,
    target: comp.targetScore,
  }));

  return (
    <ResponsiveContainer width="100%" height={500}>
      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
        <PolarGrid />
        <PolarAngleAxis dataKey="subject" />
        <PolarRadiusAxis angle={30} domain={[0, 5]} />
        <Radar
          name="Current Level"
          dataKey="current"
          stroke="#2563eb"
          fill="#2563eb"
          fillOpacity={0.6}
        />
        <Radar
          name="Target Level"
          dataKey="target"
          stroke="#0d9488"
          fill="#0d9488"
          fillOpacity={0.6}
        />
        <Legend />
      </RadarChart>
    </ResponsiveContainer>
  );
}