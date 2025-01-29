import * as React from "react";
import { cn } from "../../lib/utils";

const Label = React.forwardRef(({ className, htmlFor, children, ...props }, ref) => {
  return (
    <label
      htmlFor={htmlFor}
      className={cn("block text-sm font-medium text-gray-700", className)}
      ref={ref}
      {...props}
    >
      {children}
    </label>
  );
});

Label.displayName = "Label";

export { Label };