import * as React from "react";
import { cn } from "../../lib/utils";

const Dialog = React.forwardRef(({ children, className, ...props }, ref) => {
  return (
    <div className={cn("fixed inset-0 flex items-center justify-center bg-black bg-opacity-50", className)} ref={ref} {...props}>
      {children}
    </div>
  );
});

Dialog.displayName = "Dialog";

const DialogContent = React.forwardRef(({ children, className, ...props }, ref) => {
  return (
    <div className={cn("bg-white rounded-lg shadow-lg w-96 p-6", className)} ref={ref} {...props}>
      {children}
    </div>
  );
});

DialogContent.displayName = "DialogContent";

const DialogHeader = React.forwardRef(({ children, className, ...props }, ref) => {
  return (
    <div className={cn("flex justify-between items-center mb-4", className)} ref={ref} {...props}>
      {children}
    </div>
  );
});

DialogHeader.displayName = "DialogHeader";

const DialogTitle = React.forwardRef(({ children, className, ...props }, ref) => {
  return (
    <h2 className={cn("text-lg font-semibold", className)} ref={ref} {...props}>
      {children}
    </h2>
  );
});

DialogTitle.displayName = "DialogTitle";

export { Dialog, DialogContent, DialogHeader, DialogTitle };