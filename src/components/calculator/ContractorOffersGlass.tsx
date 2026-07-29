import React, { useState } from 'react';
import {
  Lock,
  Sparkles,
  ShieldCheck,
  Truck,
  Star,
  CheckCircle,
  Tag,
  ArrowRight,
  PhoneCall,
  Clock,
} from 'lucide-react';
import { ContractorOffer, Currency } from '@/lib/types';
import { formatCurrency } from '@/lib/calculator';

interface ContractorOffersGlassProps {
  currency: Currency;
  onRequestQuote: () => void;
}

export const ContractorOffersGlass: React.FC<ContractorOffersGlassProps> = ({
  currency,
  onRequestQuote,
}) => {
  const [unlocked, setUnlocked] = useState<boolean>(false);

  const offers: ContractorOffer[] = [
    {
      id: 'c1',
      contractorName: 'РБУ Бетон-Логистика & Главстрой',
      rating: 4.9,
      completedProjects: 1420,
      discountBadge: 'СКИДКА 15% НА ОБЪЕМ',
      concreteDiscountPrice: 3800,
      rebarDiscountPrice: 62000,
      deliveryTime: 'Доставка за 24ч',
      verified: true,
      phoneBlurred: '+7 (800) 555-01**',
    },
    {
      id: 'c2',
      contractorName: 'Титан Бетонные Заводы & Металлопрокат',
      rating: 4.8,
      completedProjects: 890,
      discountBadge: 'БЕСПЛАТНЫЙ АВТОБЕТОНОНАСОС',
      concreteDiscountPrice: 4100,
      rebarDiscountPrice: 59500,
      deliveryTime: 'В день заказа',
      verified: true,
      phoneBlurred: '+7 (888) 321-98**',
    },
    {
      id: 'c3',
      contractorName: 'ЕвроБетон & МонолитСнаб',
      rating: 4.95,
      completedProjects: 2100,
      discountBadge: 'ОПТОВЫЙ ПАСПОРТ ЗАКАЗЧИКА',
      concreteDiscountPrice: 3650,
      rebarDiscountPrice: 61000,
      deliveryTime: 'Доставка за 48ч',
      verified: true,
      phoneBlurred: '+7 (800) 444-77**',
    },
  ];

  return (
    <div className="relative mt-8 rounded-2xl overflow-hidden border border-slate-200/90 shadow-xl bg-gradient-to-br from-slate-50 via-white to-slate-100 p-6 md:p-8">
      {/* Background Decorative Accent */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#1F5A8E]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-[#0F172A] text-teal-400 rounded-lg">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <h3 className="text-lg font-extrabold text-[#0F172A] uppercase tracking-wide">
              Спецпредложения Региональных Бетонных Заводов (РБУ)
            </h3>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border border-emerald-300">
              4 Завода Активны
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Прямые цены от производителей товарного бетона, скидки на объемы и выезд автобетононасоса
          </p>
        </div>

        {!unlocked && (
          <button
            onClick={() => {
              setUnlocked(true);
              onRequestQuote();
            }}
            className="flex items-center gap-2 bg-[#1F5A8E] hover:bg-[#174771] text-white text-xs font-bold px-5 py-2.5 rounded-xl transition shadow-lg cursor-pointer"
          >
            <Sparkles className="w-4 h-4 animate-spin text-teal-400" />
            Разблокировать Цены Заводов
          </button>
        )}
      </div>

      {/* Content Grid with Glassmorphism Overlay */}
      <div className="relative">
        {/* Underneath Real Data View */}
        <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 transition-all duration-500 ${!unlocked ? 'filter blur-md select-none pointer-events-none opacity-40' : 'opacity-100'}`}>
          {offers.map((offer) => (
            <div
              key={offer.id}
              className="bg-white/90 backdrop-blur-md rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between hover:border-[#1F5A8E] transition"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="bg-teal-50 text-[#1F5A8E] text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 font-mono border border-teal-200">
                    <Tag className="w-3 h-3 text-[#1F5A8E]" /> {offer.discountBadge}
                  </span>
                  <div className="flex items-center gap-1 text-xs text-amber-500 font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    {offer.rating}
                  </div>
                </div>

                <h4 className="font-extrabold text-sm text-[#0F172A] leading-snug">
                  {offer.contractorName}
                </h4>

                <div className="flex items-center gap-2 text-slate-500 text-[11px] mt-1">
                  <span className="flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-emerald-500" /> Проверенный РБУ
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3 text-sky-500" /> {offer.deliveryTime}
                  </span>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 font-mono text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Бетон со скидкой:</span>
                    <span className="font-bold text-emerald-600">
                      {formatCurrency(offer.concreteDiscountPrice, currency)} / м³
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Арматура стальная:</span>
                    <span className="font-bold text-slate-900">
                      {formatCurrency(offer.rebarDiscountPrice, currency)} / Тонна
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100">
                <button
                  onClick={onRequestQuote}
                  className="w-full bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <PhoneCall className="w-3.5 h-3.5 text-teal-400" />
                  Связаться с Заводом
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Premium Glassmorphism Lock Overlay when locked */}
        {!unlocked && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 bg-white/60 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-inner text-center">
            <div className="w-14 h-14 bg-[#0F172A] rounded-2xl flex items-center justify-center text-teal-400 shadow-xl mb-4 border border-slate-800">
              <Lock className="w-7 h-7" />
            </div>

            <h3 className="text-xl font-extrabold text-[#0F172A] tracking-tight">
              Разблокируйте Прямые Оптовые Цены Бетонных Заводов
            </h3>
            <p className="text-xs text-slate-600 max-w-md mt-1.5 font-medium">
              Доступ к 4 проверенным узлам РБУ с индивидуальными скидками до 15% на объем и гарантированным графиком заливки.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 mt-5">
              <button
                onClick={() => {
                  setUnlocked(true);
                  onRequestQuote();
                }}
                className="bg-[#1F5A8E] hover:bg-[#174771] text-white font-extrabold text-xs px-6 py-3 rounded-xl transition shadow-xl flex items-center gap-2 uppercase tracking-wide cursor-pointer active:scale-95"
              >
                <span>Получить Прямые Цены От Заводов</span>
                <ArrowRight className="w-4 h-4 text-teal-400" />
              </button>
            </div>

            <div className="flex items-center gap-4 text-[11px] text-slate-500 font-mono mt-4">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Без обязательств
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Truck className="w-3.5 h-3.5 text-sky-600" /> Прямая отгрузка РБУ
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
