import { Alert } from 'react-native';

// Date formatting utilities
export const formatDate = (date: Date | string, format: 'short' | 'long' = 'short'): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (format === 'long') {
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  
  return dateObj.toLocaleDateString('en-US');
};

// File utilities
export const getFileExtension = (filename: string): string => {
  return filename.split('.').pop()?.toLowerCase() || '';
};

export const getFilenameFromPath = (path: string): string => {
  return path.split('/').pop() || path;
};

// Validation utilities
export const isEmptyString = (str: string | null | undefined): boolean => {
  return !str || str.trim().length === 0;
};

export const checkObjectForNullsOrWhitespace = (obj: Record<string, any>): string[] => {
  const errors: string[] = [];
  
  Object.entries(obj).forEach(([key, value]) => {
    if (value === null || value === undefined || (typeof value === 'string' && isEmptyString(value))) {
      errors.push(key);
    }
  });
  
  return errors;
};

// Alert utilities
export const confirmAlert = (
  title: string,
  message: string,
  onConfirm: () => void,
  onCancel?: () => void
): void => {
  Alert.alert(
    title,
    message,
    [
      {
        text: 'Cancel',
        style: 'cancel',
        onPress: onCancel,
      },
      {
        text: 'Confirm',
        onPress: onConfirm,
      },
    ]
  );
};

// String utilities
export const camelToSnakeCase = (str: string): string => {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
};

export const toLowerCase = (str: string): string => {
  return str.toLowerCase();
};

// Object utilities
export const filterObject = (obj: Record<string, any>, predicate: (key: string, value: any) => boolean): Record<string, any> => {
  return Object.entries(obj)
    .filter(([key, value]) => predicate(key, value))
    .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
};

// Deep object access
export const deepGet = (obj: any, path: string, defaultValue?: any): any => {
  const keys = path.split('.');
  let current = obj;
  
  for (const key of keys) {
    if (current === null || current === undefined || !(key in current)) {
      return defaultValue;
    }
    current = current[key];
  }
  
  return current;
};
