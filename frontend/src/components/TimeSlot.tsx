import React from 'react';
import { Clock, Check } from 'lucide-react';
import { Slot } from '../types';

export interface TimeSlotProps {
  slot: Slot;
  isSelected?: boolean;
  onSelect?: (slot: Slot) => void;
  disabled?: boolean;
}

export const TimeSlot: React.FC<TimeSlotProps> = ({
  slot,
  isSelected = false,
  onSelect,
  disabled = false
}) => {
  const isAvailable = slot.status === 'AVAILABLE';
  const isBooked = slot.status === 'BOOKED';
  const isBlocked = slot.status === 'BLOCKED' || slot.status === 'HELD';
  const isCompleted = slot.status === 'COMPLETED';

  let statusText = 'Available';
  let badgeVariant = 'badge-available';

  if (isBooked) {
    statusText = 'Booked';
    badgeVariant = 'badge-busy';
  } else if (isBlocked) {
    statusText = slot.blockReason || 'Unavailable';
    badgeVariant = 'badge-neutral';
  } else if (isCompleted) {
    statusText = 'Past';
    badgeVariant = 'badge-neutral';
  }

  const handleClick = () => {
    if (isAvailable && !disabled && onSelect) {
      onSelect(slot);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!isAvailable || disabled}
      className={`relative w-full text-left p-3 rounded-lg border transition-colors flex flex-col justify-between ${
        isSelected
          ? 'bg-[#F0FDF8] border-[#0E4F43] ring-1 ring-[#0E4F43] shadow-xs'
          : isAvailable
          ? 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50 cursor-pointer shadow-xs'
          : 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
      }`}
    >
      <div className="flex items-center justify-between w-full">
        <span
          className={`font-mono text-xs font-semibold flex items-center gap-1.5 ${
            isSelected ? 'text-[#0E4F43]' : isAvailable ? 'text-slate-900' : 'text-slate-400'
          }`}
        >
          <Clock className={`w-3.5 h-3.5 ${isSelected ? 'text-[#0E4F43]' : 'text-slate-400'}`} />
          {slot.startTime}
        </span>
        {isSelected && (
          <span className="w-4 h-4 rounded-full bg-[#0E4F43] text-white flex items-center justify-center shadow-xs">
            <Check className="w-2.5 h-2.5" />
          </span>
        )}
      </div>

      <div className="mt-2 flex items-center justify-between w-full">
        <span className={`badge-clinical ${badgeVariant} text-[10px] py-0.5 px-1.5`}>
          <span className="badge-dot" />
          {statusText}
        </span>
        <span className="font-mono text-[10px] text-slate-500">to {slot.endTime}</span>
      </div>
    </button>
  );
};
