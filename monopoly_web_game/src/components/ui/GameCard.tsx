type Props = {
  icon: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
};

export function GameCard({ icon, title, subtitle, children }: Props) {
  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-xl shadow-[#1B5E20]/8 border border-[#1B5E20]/10 overflow-hidden">
      <div className="px-6 py-4 bg-gradient-to-r from-[#1B5E20]/8 to-transparent border-b border-[#1B5E20]/10 flex items-center gap-3">
        <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#1B5E20]/10 text-xl">
          {icon}
        </span>
        <div>
          <h2 className="font-semibold text-gray-900">{title}</h2>
          {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      <div className="p-6 flex-1 flex flex-col gap-5">{children}</div>
    </div>
  );
}

export const inputClassName =
  'w-full rounded-xl border border-gray-200 bg-gray-50/60 px-4 py-2.5 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1B5E20]/25 focus:border-[#1B5E20] transition-shadow';

export function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="block text-sm font-medium text-gray-700 mb-1.5">{children}</label>;
}
