import Link from "next/link";
import { cn } from "@/lib/utils";

type Variant = "lime" | "white" | "black" | "ghost";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  lime: "bg-lime-custom text-black hover:bg-lime-hover border-black",
  white: "bg-white text-black hover:bg-zinc-100 border-black",
  black: "bg-[#0A0A0A] text-lime-custom hover:bg-zinc-800 border-black",
  ghost: "bg-transparent text-black hover:bg-black/5 border-black",
};

const sizes: Record<Size, string> = {
  sm: "px-4 py-2 text-xs",
  md: "px-6 py-3 text-sm",
  lg: "px-8 py-4 text-base",
};

type BaseProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
};

function classesFor({ variant = "lime", size = "md", className }: BaseProps) {
  return cn(
    "neo-press inline-flex items-center justify-center gap-2 rounded-full border-2 font-bold tracking-tight shadow-neo",
    variants[variant],
    sizes[size],
    className,
  );
}

export function NeoLink({ href, ...props }: BaseProps & { href: string }) {
  return (
    <Link href={href} className={classesFor(props)}>
      {props.children}
    </Link>
  );
}

export function NeoButton({
  type = "button",
  onClick,
  disabled,
  ...props
}: BaseProps & {
  type?: "button" | "submit";
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(classesFor(props), disabled && "pointer-events-none opacity-50")}
    >
      {props.children}
    </button>
  );
}
