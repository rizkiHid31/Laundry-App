import * as React from "react";

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export function Input({ className = "", ...props }: InputProps) {
  return <input className={`w-full rounded-lg border border-slate-300 px-3 py-2 outline-none ring-0 focus:border-slate-500 ${className}`.trim()} {...props} />;
}
