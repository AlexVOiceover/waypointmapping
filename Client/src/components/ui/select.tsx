import * as React from "react"
import { cn } from "@/lib/utils"

interface SelectContextValue {
  value?: string;
  onValueChange?: (value: string) => void;
}

const SelectContext = React.createContext<SelectContextValue>({});

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  onValueChange?: (value: string) => void;
}

// Main Select component - supports both direct usage and wrapper pattern
const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, value, onChange, onValueChange, ...props }, ref) => {
    // Check if children contain SelectTrigger (wrapper pattern) or direct options (direct pattern)
    const hasSelectTrigger = React.Children.toArray(children).some(
      child => React.isValidElement(child) &&
        typeof child.type === 'function' &&
        'displayName' in child.type &&
        child.type.displayName === 'SelectTrigger'
    );

    // Handler that supports both onChange and onValueChange
    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      if (onChange) {
        onChange(e);
      }
      if (onValueChange) {
        onValueChange(e.target.value);
      }
    };

    // Direct usage pattern (native select with options)
    if (!hasSelectTrigger) {
      return (
        <select
          className={cn(
            "flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          ref={ref}
          value={value}
          onChange={handleChange}
          {...props}
        >
          {children}
        </select>
      )
    }

    // Wrapper pattern (with SelectTrigger, SelectContent, etc.)
    return (
      <SelectContext.Provider value={{ value: value as string, onValueChange }}>
        {children}
      </SelectContext.Provider>
    )
  }
)
Select.displayName = "Select"

// SelectTrigger - renders the actual select element for wrapper pattern
const SelectTrigger = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => {
    const { value, onValueChange } = React.useContext(SelectContext);

    return (
      <select
        className={cn(
          "flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        value={value}
        onChange={(e) => onValueChange?.(e.target.value)}
        {...props}
      >
        {children}
      </select>
    )
  }
)
SelectTrigger.displayName = "SelectTrigger"

// SelectValue - placeholder component, not used in native select
const SelectValue = () => {
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
