// Text processing utilities - Extracted from utils.ts

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

export function truncateResponse(response: string, maxWords: number = 12): string {
  const words = response.trim().split(/\s+/);
  
  if (words.length <= maxWords) {
    return response;
  }
  
  return words.slice(0, maxWords).join(' ') + '...';
} 