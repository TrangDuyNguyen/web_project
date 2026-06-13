type Props = {
  colors: readonly string[];
  value: string;
  onChange: (color: string) => void;
  label?: string;
};

export function ColorPicker({ colors, value, onChange, label = 'Màu quân cờ' }: Props) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50/60 px-4 py-4">
      <span className="block text-sm font-medium text-gray-700 mb-3 px-0.5">{label}</span>
      <div className="flex gap-4 px-1 py-1">
        {colors.map((c) => (
          <button
            key={c}
            type="button"
            aria-label={`Chọn màu ${c}`}
            aria-pressed={value === c}
            className={`w-10 h-10 rounded-full transition-all duration-200 ${
              value === c
                ? 'ring-2 ring-offset-[3px] ring-gray-800 scale-110 shadow-md'
                : 'hover:scale-105 opacity-90 hover:opacity-100'
            }`}
            style={{ backgroundColor: c }}
            onClick={() => onChange(c)}
          />
        ))}
      </div>
    </div>
  );
}
