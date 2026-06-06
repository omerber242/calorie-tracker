'use client';

interface MacroRingProps {
  label: string;
  current: number;
  goal: number;
  color: string;
  unit?: string;
}

function MacroRing({ label, current, goal, color, unit = 'g' }: MacroRingProps) {
  const pct = goal > 0 ? Math.min(current / goal, 1) : 0;
  const r = 28;
  const circ = 2 * Math.PI * r;
  const dash = circ * pct;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-16 h-16">
        <svg viewBox="0 0 64 64" className="w-16 h-16 -rotate-90">
          <circle cx="32" cy="32" r={r} fill="none" stroke="#e5e7eb" strokeWidth="6" />
          <circle
            cx="32" cy="32" r={r}
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeDasharray={`${dash} ${circ}`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 0.5s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold text-gray-700">
            {Math.round(pct * 100)}%
          </span>
        </div>
      </div>
      <div className="text-center">
        <div className="text-xs font-semibold text-gray-800">
          {Math.round(current)}{unit}
        </div>
        <div className="text-xs text-gray-400">{label}</div>
        <div className="text-xs text-gray-400">/ {Math.round(goal)}{unit}</div>
      </div>
    </div>
  );
}

interface MacroRingsProps {
  calories: number; goalCalories: number;
  protein: number; goalProtein: number;
  carbs: number; goalCarbs: number;
  fat: number; goalFat: number;
}

export default function MacroRings(props: MacroRingsProps) {
  return (
    <div className="grid grid-cols-4 gap-2">
      <MacroRing label="Calories" current={props.calories} goal={props.goalCalories} color="#f97316" unit="kcal" />
      <MacroRing label="Protein" current={props.protein} goal={props.goalProtein} color="#3b82f6" />
      <MacroRing label="Carbs" current={props.carbs} goal={props.goalCarbs} color="#a855f7" />
      <MacroRing label="Fat" current={props.fat} goal={props.goalFat} color="#eab308" />
    </div>
  );
}
