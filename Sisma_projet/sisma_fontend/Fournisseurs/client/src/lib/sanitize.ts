/**
 * Input Sanitization Utilities
 * Security: Sanitize all user inputs before API submission
 */

// Sanitize string input - remove HTML tags and special characters
export function sanitizeString(input: string): string {
  return input
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[<>]/g, '') // Remove < and > characters
    .replace(/javascript:/gi, '') // Remove javascript: URLs
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
}

// Sanitize HTML content (allow safe tags)
export function sanitizeHtml(input: string): string {
  const allowedTags = ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 'a', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
  const allowedAttrs = { a: ['href', 'title'] };
  
  let sanitized = input;
  
  // Remove script tags
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove event handlers
  sanitized = sanitized.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, '');
  
  // Remove javascript: URLs
  sanitized = sanitized.replace(/javascript:/gi, '');
  
  return sanitized;
}

// Sanitize product data before API submission
export function sanitizeProductData(data: any): any {
  const sanitized = { ...data };
  
  // Sanitize text fields
  const textFields = ['name', 'description', 'short_description', 'sku'];
  textFields.forEach(field => {
    if (sanitized[field] && typeof sanitized[field] === 'string') {
      sanitized[field] = sanitizeString(sanitized[field]);
    }
  });
  
  // Sanitize description as HTML
  if (sanitized.description && typeof sanitized.description === 'string') {
    sanitized.description = sanitizeHtml(sanitized.description);
  }
  
  return sanitized;
}

// Sanitize order data
export function sanitizeOrderData(data: any): any {
  const sanitized = { ...data };
  
  const textFields = ['client_name', 'client_address', 'notes'];
  textFields.forEach(field => {
    if (sanitized[field] && typeof sanitized[field] === 'string') {
      sanitized[field] = sanitizeString(sanitized[field]);
    }
  });
  
  // Validate phone number format
  if (sanitized.client_phone) {
    sanitized.client_phone = sanitized.client_phone.replace(/[^0-9+\s]/g, '');
  }
  
  return sanitized;
}

// Validate file upload
export function validateImageFile(file: File, maxSizeMB: number = 5): { valid: boolean; error?: string } {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  
  if (!allowedTypes.includes(file.type)) {
    return { 
      valid: false, 
      error: `Type de fichier invalide. Types acceptés: ${allowedTypes.join(', ')}` 
    };
  }
  
  if (file.size > maxSizeBytes) {
    return { 
      valid: false, 
      error: `Fichier trop volumineux. Taille maximum: ${maxSizeMB}MB` 
    };
  }
  
  return { valid: true };
}

// Validate CSV file
export function validateCsvFile(file: File, maxSizeMB: number = 10): { valid: boolean; error?: string } {
  const allowedTypes = ['text/csv', 'text/plain', 'application/vnd.ms-excel'];
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  
  if (!allowedTypes.includes(file.type) && !file.name.endsWith('.csv')) {
    return { 
      valid: false, 
      error: 'Format CSV invalide' 
    };
  }
  
  if (file.size > maxSizeBytes) {
    return { 
      valid: false, 
      error: `Fichier trop volumineux. Taille maximum: ${maxSizeMB}MB` 
    };
  }
  
  return { valid: true };
}

// Rate limit error handler
export function handleRateLimitError(error: any): string {
  if (error.response?.status === 429) {
    const retryAfter = error.response?.headers?.['retry-after'] || 60;
    return `Trop de requêtes. Veuillez patienter ${Math.ceil(retryAfter / 60)} minute(s).`;
  }
  return error.message || 'Une erreur est survenue';
}
