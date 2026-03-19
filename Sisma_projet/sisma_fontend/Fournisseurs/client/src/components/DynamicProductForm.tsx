import { useState, useEffect } from 'react';
import { useCategorySchema, CategoryField } from '@/hooks/use-v1-supplier';

interface DynamicFieldProps {
  field: CategoryField;
  value: unknown;
  onChange: (value: unknown) => void;
  error?: string;
}

function DynamicField({ field, value, onChange, error }: DynamicFieldProps) {
  const baseInputClass = "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sisma-red focus:border-transparent";
  const errorClass = error ? "border-red-500" : "border-gray-300";

  switch (field.type) {
    case 'textarea':
      return (
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <textarea
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            rows={4}
            className={`${baseInputClass} ${errorClass}`}
          />
          {field.help_text && (
            <p className="text-xs text-gray-500">{field.help_text}</p>
          )}
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
      );

    case 'select':
      return (
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <select
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            required={field.required}
            className={`${baseInputClass} ${errorClass}`}
          >
            <option value="">Sélectionner...</option>
            {field.options?.map((option: string) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          {field.help_text && (
            <p className="text-xs text-gray-500">{field.help_text}</p>
          )}
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
      );

    case 'number':
      return (
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <input
            type="number"
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            className={`${baseInputClass} ${errorClass}`}
          />
          {field.help_text && (
            <p className="text-xs text-gray-500">{field.help_text}</p>
          )}
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
      );

    case 'date':
      return (
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <input
            type="date"
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            required={field.required}
            className={`${baseInputClass} ${errorClass}`}
          />
          {field.help_text && (
            <p className="text-xs text-gray-500">{field.help_text}</p>
          )}
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
      );

    case 'checkbox':
      return (
        <div className="space-y-1">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={(value as boolean) || false}
              onChange={(e) => onChange(e.target.checked)}
              className="w-4 h-4 text-sisma-red rounded focus:ring-sisma-red"
            />
            <span className="text-sm text-gray-700">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </span>
          </label>
          {field.help_text && (
            <p className="text-xs text-gray-500 ml-6">{field.help_text}</p>
          )}
          {error && <p className="text-sm text-red-500 ml-6">{error}</p>}
        </div>
      );

    case 'text':
    default:
      return (
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <input
            type="text"
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            className={`${baseInputClass} ${errorClass}`}
          />
          {field.help_text && (
            <p className="text-xs text-gray-500">{field.help_text}</p>
          )}
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
      );
  }
}

interface DynamicProductFormProps {
  categoryId: number;
  initialData?: Record<string, unknown>;
  onSubmit: (data: Record<string, unknown>) => void;
  isLoading?: boolean;
}

export function DynamicProductForm({
  categoryId,
  initialData = {},
  onSubmit,
  isLoading = false,
}: DynamicProductFormProps) {
  const { data: schema, isLoading: schemaLoading, error } = useCategorySchema(categoryId);
  const [formData, setFormData] = useState<Record<string, unknown>>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  useEffect(() => {
    setFormData({});
    setErrors({});
  }, [categoryId]);

  const handleFieldChange = (fieldName: string, value: unknown) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
    if (errors[fieldName]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    if (!schema?.fields) return true;

    const newErrors: Record<string, string> = {};
    schema.fields.forEach((field: CategoryField) => {
      if (field.required && !formData[field.name]) {
        newErrors[field.name] = `${field.label} est requis`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit({
        ...formData,
        category_id: categoryId,
      });
    }
  };

  if (schemaLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-10 bg-gray-200 rounded mb-4"></div>
        </div>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600 text-sm">
          Erreur lors du chargement des champs: {(error as Error).message}
        </p>
      </div>
    );
  }

  if (!schema?.fields || schema.fields.length === 0) {
    return (
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <p className="text-gray-600 text-sm">
          Aucun champ dynamique configuré pour cette catégorie.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {schema.fields.map((field: CategoryField) => (
          <DynamicField
            key={field.name}
            field={field}
            value={formData[field.name]}
            onChange={(value) => handleFieldChange(field.name, value)}
            error={errors[field.name]}
          />
        ))}
      </div>

      <input type="hidden" name="category_id" value={categoryId} />

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-2 bg-sisma-red text-white rounded-lg hover:bg-sisma-red/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Enregistrement...' : 'Enregistrer le produit'}
        </button>
      </div>

      <div className="text-xs text-gray-400 text-right">
        Schema v{schema.version}
      </div>
    </form>
  );
}

export default DynamicProductForm;
