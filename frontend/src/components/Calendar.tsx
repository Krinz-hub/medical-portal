import React from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { formatDateToYYYYMMDD, getTodayLocalDate } from '../utils/dateUtils';

export interface CalendarProps {
  selectedDate: string; // YYYY-MM-DD
  onDateChange: (date: string) => void;
  daysCount?: number;
}

export const Calendar: React.FC<CalendarProps> = ({
  selectedDate,
  onDateChange,
  daysCount = 14
}) => {
  const dates: Array<{
    dateStr: string;
    dayName: string;
    dayNumber: number;
    monthName: string;
    isToday: boolean;
  }> = [];

  const todayStr = getTodayLocalDate();

  for (let i = 0; i < daysCount; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dateStr = formatDateToYYYYMMDD(d);
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    const dayNumber = d.getDate();
    const monthName = d.toLocaleDateString('en-US', { month: 'short' });

    dates.push({
      dateStr,
      dayName,
      dayNumber,
      monthName,
      isToday: dateStr === todayStr
    });
  }

  return (
    <div className="w-full bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-3 px-0.5">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-teal-700" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">
            Select Consultation Date
          </span>
        </div>
        <span className="text-xs text-slate-500">
          Showing next {daysCount} days
        </span>
      </div>

      {/* Horizontal scrollable date strip */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {dates.map((item) => {
          const isSelected = item.dateStr === selectedDate;

          return (
            <button
              key={item.dateStr}
              type="button"
              onClick={() => onDateChange(item.dateStr)}
              className={`flex flex-col items-center justify-center min-w-[68px] py-2 px-2.5 rounded-lg border transition-colors shrink-0 ${
                isSelected
                  ? 'bg-teal-700 border-teal-700 text-white'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <span
                className={`text-[10px] font-semibold uppercase tracking-wider ${
                  isSelected ? 'text-teal-100' : 'text-slate-500'
                }`}
              >
                {item.isToday ? 'Today' : item.dayName}
              </span>
              <span className={`text-base font-bold my-0.5 leading-tight ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                {item.dayNumber}
              </span>
              <span
                className={`text-[10px] ${
                  isSelected ? 'text-teal-200' : 'text-slate-400'
                }`}
              >
                {item.monthName}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
