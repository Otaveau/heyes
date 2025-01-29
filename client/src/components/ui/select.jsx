import * as React from "react";
import { cn } from "../../lib/utils";

const Select = React.forwardRef(({ children, className, ...props }, ref) => {
  return (
    <div className={cn("relative", className)} ref={ref} {...props}>
      {children}
    </div>
  );
});

Select.displayName = "Select";

const SelectTrigger = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <button
      className={cn(
        "block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});

SelectTrigger.displayName = "SelectTrigger";

const SelectContent = React.forwardRef(({ className, children, ...props }, ref) => {
  return (
    <ul
      className={cn(
        "absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm",
        className
      )}
      ref={ref}
      {...props}
    >
      {children}
    </ul>
  );
});

SelectContent.displayName = "SelectContent";

const SelectItem = React.forwardRef(({ className, children, ...props }, ref) => {
  return (
    <li
      className={cn(
        "cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-blue-100",
        className
      )}
      ref={ref}
      {...props}
    >
      {children}
    </li>
  );
});

SelectItem.displayName = "SelectItem";

const SelectValue = React.forwardRef(({ className, children, ...props }, ref) => {
  return (
    <span
      className={cn("block truncate", className)}
      ref={ref}
      {...props}
    >
      {children}
    </span>
  );
});

SelectValue.displayName = "SelectValue";

export { Select, SelectTrigger, SelectContent, SelectItem, SelectValue };