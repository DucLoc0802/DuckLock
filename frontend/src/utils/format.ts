export function formatCurrency(value: number | string) {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return `${(num || 0).toLocaleString('vi-VN')} VND`;
}

export function formatCompactCurrency(value: number | string) {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return `${(num || 0).toLocaleString('vi-VN')}đ`;
}

export function formatCurrencyInput(text: string | number) {
  const rawValue = String(text).replace(/[^\d]/g, '');
  if (!rawValue) return '';
  return Number(rawValue).toLocaleString('vi-VN');
}

export function parseCurrencyInput(text: string) {
  const rawValue = text.replace(/[^\d]/g, '');
  return rawValue ? Number(rawValue) : 0;
}

export function formatDate(input: string) {
  return new Date(input).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatTime(input: string) {
  return new Date(input).toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
  });
}

export function getMonthLabel(offset = 0) {
  const date = new Date();
  date.setMonth(date.getMonth() + offset);
  return date.toLocaleDateString('vi-VN', {
    month: 'long',
    year: 'numeric',
  });
}

export function randomDelay() {
  return 300 + Math.round(Math.random() * 500);
}
