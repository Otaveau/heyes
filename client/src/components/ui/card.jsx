import * as React from "react";
import { cn } from "../../lib/utils";

const Card = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border bg-card text-card-foreground shadow-sm",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef(({ 
  className, 
  children,
  as: Comp = "h3",
  ...props 
}, ref) => {
  // Validation pour s'assurer qu'il y a du contenu
  if (!children) {
    console.warn('CardTitle must have content for accessibility');
    return null;
  }

  return (
    <Comp
      ref={ref}
      className={cn(
        "text-2xl font-semibold leading-none tracking-tight",
        className
      )}
      // Ajout d'un rôle heading explicite pour l'accessibilité
      role="heading"
      // Par défaut niveau 3, peut être surchargé via les props
      aria-level={Comp === 'h3' ? 3 : props['aria-level']}
      {...props}
    >
      {children}
    </Comp>
  )
})
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef(({ 
  className, 
  children,
  ...props 
}, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    // Utilisation de aria-describedby plutôt qu'un rôle invalide
    id={props.id || `desc-${Math.random().toString(36).substr(2, 9)}`}
    {...props}
  >
    {children}
  </p>
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef(({ className, children, ...props }, ref) => (
  <div 
    ref={ref} 
    className={cn("p-6 pt-0", className)} 
    {...props}
  >
    {children}
  </div>
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  >
    {children}
  </div>
))
CardFooter.displayName = "CardFooter"

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
}