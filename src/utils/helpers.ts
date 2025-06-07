export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

export const formatDate = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatDateTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatDuration = (hours: number): string => {
  if (hours === 1) {
    return '1 hour';
  }
  return `${hours} hours`;
};

export const formatDistance = (distance: number): string => {
  if (distance < 1) {
    return `${(distance * 1000).toFixed(0)}m`;
  }
  return `${distance.toFixed(1)}km`;
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
  return phoneRegex.test(phone);
};

export const generateAccessCode = (): string => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

export const capitalizeFirst = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength) + '...';
};

export const getBusinessTypeIcon = (type: string): string => {
  switch (type) {
    case 'restaurant':
      return '🍽️';
    case 'cafe':
      return '☕';
    case 'grocery':
      return '🛒';
    default:
      return '🏢';
  }
};

export const getBookingStatusColor = (status: string): string => {
  switch (status) {
    case 'pending':
      return '#FFA500'; // Orange
    case 'confirmed':
      return '#4CAF50'; // Green
    case 'active':
      return '#2196F3'; // Blue
    case 'completed':
      return '#8BC34A'; // Light Green
    case 'cancelled':
      return '#F44336'; // Red
    case 'expired':
      return '#9E9E9E'; // Gray
    default:
      return '#9E9E9E';
  }
};

export const getTimeRemaining = (endTime: Date | string): string => {
  const end = typeof endTime === 'string' ? new Date(endTime) : endTime;
  const now = new Date();
  const diff = end.getTime() - now.getTime();

  if (diff <= 0) {
    return 'Expired';
  }

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}h ${minutes}m remaining`;
  }
  return `${minutes}m remaining`;
};

export const isBookingExpired = (endTime: Date | string): boolean => {
  const end = typeof endTime === 'string' ? new Date(endTime) : endTime;
  return new Date() > end;
};

export const calculateEndTime = (startTime: Date | string, durationHours: number): Date => {
  const start = typeof startTime === 'string' ? new Date(startTime) : startTime;
  const end = new Date(start);
  end.setHours(end.getHours() + durationHours);
  return end;
};

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};
