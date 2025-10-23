import { Card, CardContent } from '../ui/card';
import { ArrowUp, ArrowDown } from 'lucide-react';

const colorClasses = {
  blue: 'bg-blue-100 text-blue-600',
  green: 'bg-green-100 text-green-600',
  orange: 'bg-orange-100 text-orange-600',
  purple: 'bg-purple-100 text-purple-600',
  red: 'bg-red-100 text-red-600'
};

export default function StatsCard({ title, value, icon, trend, color = 'blue' }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-gray-600 mb-1">{title}</p>
            <p className="text-gray-900">{value}</p>
            {trend && (
              <div className={`flex items-center gap-1 mt-2 ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {trend.isPositive ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                <span className="text-sm">{Math.abs(trend.value)}%</span>
                <span className="text-xs text-gray-500 ml-1">vs last month</span>
              </div>
            )}
          </div>
          <div className={`${colorClasses[color]} p-4 rounded-lg`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
