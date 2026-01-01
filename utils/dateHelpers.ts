export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    day: 'numeric', 
    month: 'short',
    year: 'numeric'
  });
}

export function isToday(dateString: string): boolean {
  const today = new Date().toISOString().split('T')[0];
  return dateString === today;
}

export function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}
