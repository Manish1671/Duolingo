"use client";

export function TypeAnswer({
  value,
  onChange,
  disabled,
  onSubmit,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  onSubmit: () => void;
}) {
  return (
    <input
      autoFocus
      disabled={disabled}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key !== "Enter") return;
        e.preventDefault();
        e.stopPropagation();
        onSubmit();
      }}
      placeholder="Type in Spanish"
      className="theme-input px-4 py-4 text-xl font-bold outline-none focus:border-[#1cb0f6]"
    />
  );
}
