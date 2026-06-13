type Props = {
  title: string;
  icon?: string;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
};

export function Panel({ title, icon, children, className = '', bodyClassName = '' }: Props) {
  return (
    <div
      className={`bg-white rounded-2xl shadow-lg shadow-[#1B5E20]/8 border border-[#1B5E20]/10 overflow-hidden ${className}`}
    >
      <div className="px-4 py-3 bg-gradient-to-r from-[#1B5E20]/8 to-transparent border-b border-[#1B5E20]/10 flex items-center gap-2">
        {icon && <span className="text-base">{icon}</span>}
        <h3 className="font-semibold text-sm text-gray-800">{title}</h3>
      </div>
      <div className={`p-4 ${bodyClassName}`}>{children}</div>
    </div>
  );
}
