import * as React from "react";

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea({ className = "", ...props }: TextareaProps) {
  return <textarea className={`min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-500 ${className}`.trim()} {...props} />;
}
