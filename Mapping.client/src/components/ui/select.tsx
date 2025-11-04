import * as React from "react"
import { cn } from "@/lib/utils"

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {}

// Main Select component (acts as the wrapper)
const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <select
        className={cn(
          "flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </select>
    )
  }
)
Select.displayName = "Select"

// SelectTrigger - for native select, this is just a pass-through wrapper
const SelectTrigger = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ children, ...props }, ref) => {
    return <div ref={ref} {...props}>{children}</div>
  }
)
SelectTrigger.displayName = "SelectTrigger"

// SelectValue - placeholder component, not used in native select
const SelectValue = ({ placeholder }: { placeholder?: string }) => {
  return null // Native select handles placeholder via option
}
SelectValue.displayName = "SelectValue"

// SelectContent - for native select, this is just a pass-through wrapper
const SelectContent = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>
}
SelectContent.displayName = "SelectContent"

// SelectItem - maps to option element
const SelectItem = React.forwardRef<HTMLOptionElement, React.OptionHTMLAttributes<HTMLOptionElement>>(
  ({ children, ...props }, ref) => {
    return (
      <option ref={ref} {...props}>
        {children}
      </option>
    )
  }
)
SelectItem.displayName = "SelectItem"

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem }
