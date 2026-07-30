"use client";

interface FormattedDateProps {
  date: string;
  options?: Intl.DateTimeFormatOptions;
  className?: string;
  showTime?: boolean;
}

export default function FormattedDate({ date, options, className = "", showTime = false }: FormattedDateProps) {
  if (!date) return null;
  const dateObj = new Date(date);
    
    // Default options if none provided
    const defaultOptions: Intl.DateTimeFormatOptions = showTime 
      ? { 
          year: 'numeric', 
          month: 'numeric', 
          day: 'numeric', 
          hour: 'numeric', 
          minute: 'numeric',
          second: undefined 
        }
      : { 
          year: 'numeric', 
          month: 'numeric', 
          day: 'numeric' 
        };

  const finalOptions = options || defaultOptions;
  const formattedDate = dateObj.toLocaleString(undefined, finalOptions);

  return <span className={className} suppressHydrationWarning>{formattedDate}</span>;
}
