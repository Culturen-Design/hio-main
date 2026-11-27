import type { ComponentProps } from "react";
import { cn } from "../cn";

export type ContainerSize = "narrow" | "default" | "wide" | "full";

const sizes: Record<ContainerSize, string> = {
  narrow: "max-w-[640px]",
  default: "max-w-[960px]",
  wide: "max-w-[1280px]",
  full: "max-w-none",
};

export function Container({
  size = "default",
  className,
  ...props
}: ComponentProps<"div"> & { size?: ContainerSize }) {
  return (
    <div className={cn("mx-auto w-full px-4 py-8 sm:px-6", sizes[size], className)} {...props} />
  );
}
