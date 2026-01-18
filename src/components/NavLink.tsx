import { NavLink as RouterNavLink, NavLinkProps } from "react-router-dom";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

type ClassNameFn = Parameters<NonNullable<NavLinkProps["className"]>>[0];

interface NavLinkCompatProps extends Omit<NavLinkProps, "className"> {
  className?: string | ((args: ClassNameFn) => string);
  activeClassName?: string;
  pendingClassName?: string;
}

const NavLink = forwardRef<HTMLAnchorElement, NavLinkCompatProps>(
  ({ className, activeClassName, pendingClassName, ...props }, ref) => {
    return (
      <RouterNavLink
        ref={ref}
        className={(args) => {
          const base = typeof className === "function" ? className(args) : className;
          return cn(base, args.isActive && activeClassName, args.isPending && pendingClassName);
        }}
        {...props}
      />
    );
  },
);

NavLink.displayName = "NavLink";

export { NavLink };
