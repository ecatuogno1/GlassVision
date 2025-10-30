import { useMemo } from 'react';
import type { GlassColor } from '../data/glassPalette';

interface StatsSummaryProps {
  data: GlassColor[];
}

const StatsSummary = ({ data }: StatsSummaryProps) => {
  const stats = useMemo(() => {
    const total = data.length;
    const byCategory = data.reduce<Record<string, number>>((accumulator, color) => {
      accumulator[color.category] = (accumulator[color.category] ?? 0) + 1;
      return accumulator;
    }, {});

    const averageReflectance = Math.round(
      data.reduce((sum, color) => sum + color.reflectance, 0) / Math.max(total, 1)
    );

    return {
      total,
      categories: Object.entries(byCategory)
        .sort(([, countA], [, countB]) => countB - countA)
        .slice(0, 2)
        .map(([categoryName, count]) => ({ categoryName, count })),
      averageReflectance
    };
  }, [data]);

  return (
    <dl className="stats-summary">
      <div>
        <dt>Palette entries</dt>
        <dd>{stats.total}</dd>
      </div>
      <div>
        <dt>Top categories</dt>
        <dd>
          {stats.categories.map(({ categoryName, count }, index) => (
            <span key={categoryName}>
              {categoryName}
              <small>{count}</small>
              {index < stats.categories.length - 1 && <span aria-hidden="true"> · </span>}
            </span>
          ))}
        </dd>
      </div>
      <div>
        <dt>Avg. reflectance</dt>
        <dd>{stats.averageReflectance}%</dd>
      </div>
    </dl>
  );
};

export default StatsSummary;
