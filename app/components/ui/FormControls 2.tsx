import { forwardRef, InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from 'react'

// Base input styling that ensures consistent white background and black text
// This works regardless of light/dark mode or theme variations
const baseInputStyles = "w-full px-4 py-3 bg-white text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors placeholder-gray-500"

// Input field component with consistent styling
// Uses white background and black text for maximum readability
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  required?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  required,
  className = '',
  ...props
}, ref) => {
  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={props.id} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        ref={ref}
        className={`${baseInputStyles} ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''} ${className}`}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  )
})

Input.displayName = 'Input'

// Textarea component with consistent styling
// Maintains white background and black text for all themes
interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  required?: boolean
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({
  label,
  error,
  required,
  className = '',
  ...props
}, ref) => {
  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={props.id} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <textarea
        ref={ref}
        className={`${baseInputStyles} resize-vertical ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''} ${className}`}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  )
})

Textarea.displayName = 'Textarea'

// Select dropdown component with consistent styling
// Ensures white background and black text for all options
interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  required?: boolean
  options?: Array<{ value: string; label: string; disabled?: boolean }>
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({
  label,
  error,
  required,
  options,
  children,
  className = '',
  ...props
}, ref) => {
  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={props.id} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <select
        ref={ref}
        className={`${baseInputStyles} ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''} ${className}`}
        {...props}
      >
        {options ? (
          options.map((option) => (
            <option 
              key={option.value} 
              value={option.value} 
              disabled={option.disabled}
              className="bg-white text-black"
            >
              {option.label}
            </option>
          ))
        ) : children}
      </select>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  )
})

Select.displayName = 'Select'

// Number input with consistent styling
// Specialized for numeric inputs with proper validation
interface NumberInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
  error?: string
  required?: boolean
  min?: number
  max?: number
}

export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(({
  label,
  error,
  required,
  className = '',
  ...props
}, ref) => {
  return (
    <Input
      ref={ref}
      type="number"
      label={label}
      error={error}
      required={required}
      className={className}
      {...props}
    />
  )
})

NumberInput.displayName = 'NumberInput'

// Radio group component with consistent styling
// Maintains readability across all themes
interface RadioOption {
  value: string
  label: string
  disabled?: boolean
}

interface RadioGroupProps {
  name: string
  value: string
  onChange: (value: string) => void
  options: RadioOption[]
  label?: string
  error?: string
  required?: boolean
  className?: string
}

export const RadioGroup = ({
  name,
  value,
  onChange,
  options,
  label,
  error,
  required,
  className = ''
}: RadioGroupProps) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="space-y-2">
        {options.map((option) => (
          <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={(e) => onChange(e.target.value)}
              disabled={option.disabled}
              className="w-4 h-4 text-blue-600 bg-white border-gray-300 focus:ring-blue-500 focus:ring-2"
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {option.label}
            </span>
          </label>
        ))}
      </div>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}

// Form field wrapper for custom layouts
// Provides consistent spacing and error handling
interface FormFieldProps {
  label?: string
  error?: string
  required?: boolean
  children: React.ReactNode
  className?: string
}

export const FormField = ({
  label,
  error,
  required,
  children,
  className = ''
}: FormFieldProps) => {
  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      {children}
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}
