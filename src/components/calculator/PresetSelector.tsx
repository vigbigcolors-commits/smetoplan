import React from 'react';
import { Layers, ShieldAlert, Columns, Grid, Square } from 'lucide-react';
import { StructureType } from '@/lib/types';

interface PresetSelectorProps {
  selectedType: StructureType;
  onSelectType: (type: StructureType) => void;
}

export const PresetSelector: React.FC<PresetSelectorProps> = ({
  selectedType,
  onSelectType,
}) => {
  const presets: Array<{
    id: StructureType;
    title: string;
    description: string;
    icon: React.ReactNode;
  }> = [
    {
      id: 'slab',
      title: 'Монолитная Плита',
      description: 'Сплошная плитная фундаментная конструкция',
      icon: <Square className="w-4 h-4" />,
    },
    {
      id: 'strip',
      title: 'Ленточный Фундамент',
      description: 'Непрерывный ленточный монолит по периметру',
      icon: <Layers className="w-4 h-4" />,
    },
    {
      id: 'beam',
      title: 'Балка / Колонна',
      description: 'Несущий балочный ростверк или колонный каркас',
      icon: <Columns className="w-4 h-4" />,
    },
    {
      id: 'pier',
      title: 'Свайно-Плитный',
      description: 'Свайное поле с оголовками и ростверком',
      icon: <Grid className="w-4 h-4" />,
    },
    {
      id: 'wall',
      title: 'Подпорная Сцена / Стена',
      description: 'Монолитная цокольная или подпорная стенка',
      icon: <ShieldAlert className="w-4 h-4" />,
    },
  ];

  return (
    <div className="w-full bg-[#F4F4F5] p-2 rounded-xl border border-slate-200 shadow-2xs mb-6">
      <div className="text-[11px] font-mono font-bold text-slate-500 mb-2 px-2 uppercase tracking-wider">
        ВЫБЕРИТЕ ТИП КОНСТРУКЦИИ ДЛЯ РАСЧЕТА
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
        {presets.map((p) => {
          const isSelected = selectedType === p.id;
          return (
            <button
              key={p.id}
              onClick={() => onSelectType(p.id)}
              className={`relative overflow-hidden p-3 rounded-lg text-left transition-all duration-200 hover:-translate-y-0.5 flex flex-col justify-between border cursor-pointer ${
                isSelected
                  ? 'bg-[#0F172A] text-white border-[#0F172A] shadow-md ring-2 ring-[#1F5A8E]'
                  : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              {isSelected && (
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-teal-400 via-sky-400 to-teal-400 animate-pulse" />
              )}
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`p-1.5 rounded-md transition-colors ${
                    isSelected ? 'bg-[#1F5A8E] text-white' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {p.icon}
                </span>
                {isSelected && (
                  <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping" />
                )}
              </div>
              <div>
                <h4 className="text-xs font-bold leading-tight">{p.title}</h4>
                <p
                  className={`text-[10px] mt-0.5 line-clamp-1 ${
                    isSelected ? 'text-slate-300' : 'text-slate-500'
                  }`}
                >
                  {p.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
