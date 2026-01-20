/**
 * Form validation utilities
 */

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

/**
 * Validate that a required field has a value
 */
export function required(value: unknown, fieldName: string): ValidationError | null {
  if (value === null || value === undefined || value === '') {
    return { field: fieldName, message: `${fieldName} is required` };
  }
  return null;
}

/**
 * Validate date range (end >= start)
 */
export function dateRange(
  startDate: string | null | undefined,
  endDate: string | null | undefined,
  startFieldName = 'Start date',
  endFieldName = 'End date'
): ValidationError | null {
  if (!startDate || !endDate) {
    return null; // Let required validation handle missing dates
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (end < start) {
    return {
      field: endFieldName,
      message: `${endFieldName} must be on or after ${startFieldName}`
    };
  }
  return null;
}

/**
 * Validate that at least one of the fields has a value
 */
export function atLeastOne(
  values: Record<string, unknown>,
  fieldNames: string[],
  message?: string
): ValidationError | null {
  const hasValue = fieldNames.some(field => {
    const val = values[field];
    return val !== null && val !== undefined && val !== '';
  });

  if (!hasValue) {
    return {
      field: fieldNames[0],
      message: message || `At least one of ${fieldNames.join(' or ')} is required`
    };
  }
  return null;
}

/**
 * Validate a positive number
 */
export function positiveNumber(
  value: string | number | null | undefined,
  fieldName: string
): ValidationError | null {
  if (value === null || value === undefined || value === '') {
    return null; // Let required validation handle empty values
  }

  const num = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(num)) {
    return { field: fieldName, message: `${fieldName} must be a valid number` };
  }

  if (num <= 0) {
    return { field: fieldName, message: `${fieldName} must be greater than 0` };
  }

  return null;
}

/**
 * Project form validation
 */
export function validateProject(data: {
  name?: string;
  start_date?: string | null;
  end_date?: string | null;
  budgeted_hours?: string | number | null;
}): ValidationResult {
  const errors: ValidationError[] = [];

  const nameError = required(data.name, 'Project name');
  if (nameError) errors.push(nameError);

  const dateError = dateRange(data.start_date, data.end_date, 'Start date', 'End date');
  if (dateError) errors.push(dateError);

  if (data.budgeted_hours) {
    const hoursError = positiveNumber(data.budgeted_hours, 'Budgeted hours');
    if (hoursError) errors.push(hoursError);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Schedule phase form validation
 */
export function validatePhase(data: {
  phase_name?: string;
  start_date?: string | null;
  end_date?: string | null;
  estimated_man_hours?: string | number | null;
  crew_size?: string | number | null;
}): ValidationResult {
  const errors: ValidationError[] = [];

  const nameError = required(data.phase_name, 'Phase name');
  if (nameError) errors.push(nameError);

  const startError = required(data.start_date, 'Start date');
  if (startError) errors.push(startError);

  const endError = required(data.end_date, 'End date');
  if (endError) errors.push(endError);

  const dateError = dateRange(data.start_date, data.end_date, 'Start date', 'End date');
  if (dateError) errors.push(dateError);

  // At least one of man_hours or crew_size required
  const laborError = atLeastOne(
    { estimated_man_hours: data.estimated_man_hours, crew_size: data.crew_size },
    ['estimated_man_hours', 'crew_size'],
    'Either Man Hours or Crew Size is required'
  );
  if (laborError) errors.push(laborError);

  if (data.estimated_man_hours) {
    const hoursError = positiveNumber(data.estimated_man_hours, 'Man hours');
    if (hoursError) errors.push(hoursError);
  }

  if (data.crew_size) {
    const sizeError = positiveNumber(data.crew_size, 'Crew size');
    if (sizeError) errors.push(sizeError);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Schedule form validation
 */
export function validateSchedule(data: {
  schedule_name?: string;
  start_date?: string | null;
  end_date?: string | null;
}): ValidationResult {
  const errors: ValidationError[] = [];

  const startError = required(data.start_date, 'Start date');
  if (startError) errors.push(startError);

  const endError = required(data.end_date, 'End date');
  if (endError) errors.push(endError);

  const dateError = dateRange(data.start_date, data.end_date, 'Start date', 'End date');
  if (dateError) errors.push(dateError);

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Get error message for a specific field
 */
export function getFieldError(errors: ValidationError[], fieldName: string): string | undefined {
  return errors.find(e => e.field === fieldName)?.message;
}
