import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCategories, useCategoryAttributes, type CategoryField, type FieldType } from '@/hooks/use-category-fields';

interface DynamicProductFormProps {
  initialData?: Record<string, unknown>;
  onSubmit: (data: Record<string, unknown>) => void;
  isLoading?: boolean;
}

interface FormValues {
  [key: string]: unknown;
}

export function DynamicProductForm({ initialData, onSubmit, isLoading }: DynamicProductFormProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    initialData?.category_id?.toString() || ''
  );
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string>('');
  
  const { data: categories = [] } = useCategories();
  const { data: categoryAttributes = [] } = useCategoryAttributes();
  
  // Compute fields based on selected category
  const fields = useMemo(() => {
    if (!selectedCategorySlug || categoryAttributes.length === 0) {
      return getDefaultFields();
    }
    const category = categoryAttributes.find(c => c.slug === selectedCategorySlug);
    if (!category || !category.attributes) {
      return getDefaultFields();
    }
    return [...getDefaultFields(), ...category.attributes.map(attr => ({
      id: attr.slug,
      name: attr.name,
      slug: attr.slug,
      type: attr.type as FieldType,
      required: attr.required,
      placeholder: attr.placeholder,
      helpText: attr.help_text,
      options: attr.options?.map((v: string) => ({ label: v, value: v })),
    }))];
  }, [selectedCategorySlug, categoryAttributes]);
  
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormValues>({
    defaultValues: initialData || {},
  });

  // Update category slug when category changes
  useEffect(() => {
    if (selectedCategoryId) {
      const category = categories.find(c => c.id.toString() === selectedCategoryId);
      if (category) {
        setSelectedCategorySlug(category.slug);
      }
    }
  }, [selectedCategoryId, categories]);

  const watchedValues = watch();

  const handleCategoryChange = (value: string) => {
    setSelectedCategoryId(value);
    setValue('category_id', value);
  };

  const renderField = (field: CategoryField) => {
    const fieldName = field.slug;
    const error = errors[fieldName]?.message as string | undefined;

    switch (field.type) {
      case 'text':
        return (
          <Input
            key={field.id}
            {...register(fieldName, {
              required: field.required ? 'Ce champ est requis' : false,
              pattern: field.validation?.pattern ? new RegExp(field.validation.pattern) : undefined,
            })}
            placeholder={field.placeholder}
            className={cn(error && 'border-red-500')}
            disabled={isLoading}
          />
        );

      case 'number':
        return (
          <Input
            key={field.id}
            type="number"
            {...register(fieldName, {
              required: field.required ? 'Ce champ est requis' : false,
              min: field.validation?.min !== undefined ? { value: field.validation.min, message: `Minimum: ${field.validation.min}` } : undefined,
              max: field.validation?.max !== undefined ? { value: field.validation.max, message: `Maximum: ${field.validation.max}` } : undefined,
            })}
            placeholder={field.placeholder}
            className={cn(error && 'border-red-500')}
            disabled={isLoading}
          />
        );

      case 'textarea':
        return (
          <Textarea
            key={field.id}
            {...register(fieldName, {
              required: field.required ? 'Ce champ est requis' : false,
            })}
            placeholder={field.placeholder}
            rows={4}
            className={cn(error && 'border-red-500')}
            disabled={isLoading}
          />
        );

      case 'select':
        return (
          <Select
            key={field.id}
            value={watchedValues[fieldName] as string | undefined}
            onValueChange={(value) => setValue(fieldName, value)}
            disabled={isLoading}
          >
            <SelectTrigger className={cn(error && 'border-red-500')}>
              <SelectValue placeholder={field.placeholder || 'Sélectionner...'} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'multiselect':
        return (
          <Select
            key={field.id}
            value={(watchedValues[fieldName] as string || '').split(',')[0]}
            onValueChange={(value) => {
              const current = (watchedValues[fieldName] as string || '').split(',').filter(Boolean);
              if (current.includes(value)) {
                setValue(fieldName, current.filter(v => v !== value).join(','));
              } else {
                setValue(fieldName, [...current, value].join(','));
              }
            }}
            disabled={isLoading}
          >
            <SelectTrigger className={cn(error && 'border-red-500')}>
              <SelectValue placeholder={field.placeholder || 'Sélectionner...'} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'boolean':
        return (
          <div key={field.id} className="flex items-center space-x-2">
            <Switch
              id={fieldName}
              checked={!!watchedValues[fieldName]}
              onCheckedChange={(checked) => setValue(fieldName, checked)}
              disabled={isLoading}
            />
            <Label htmlFor={fieldName}>{field.placeholder || 'Activer'}</Label>
          </div>
        );

      case 'date':
        return (
          <Input
            key={field.id}
            type="date"
            {...register(fieldName, {
              required: field.required ? 'Ce champ est requis' : false,
            })}
            className={cn(error && 'border-red-500')}
            disabled={isLoading}
          />
        );

      default:
        return (
          <Input
            key={field.id}
            {...register(fieldName, {
              required: field.required ? 'Ce champ est requis' : false,
            })}
            placeholder={field.placeholder}
            disabled={isLoading}
          />
        );
    }
  };

  // Separate default fields and category-specific fields
  const defaultFields = fields.filter(f => 
    ['name', 'description', 'price', 'stock', 'category_id', 'images'].includes(f.id)
  );
  const categoryFields = fields.filter(f => 
    !['name', 'description', 'price', 'stock', 'category_id', 'images'].includes(f.id)
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Category Selection */}
      <div className="space-y-2">
        <Label htmlFor="category_id">
          Catégorie <span className="text-red-500">*</span>
        </Label>
        <Select
          value={selectedCategoryId}
          onValueChange={handleCategoryChange}
          disabled={isLoading}
        >
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner une catégorie" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id.toString()}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <input type="hidden" {...register('category_id')} value={selectedCategoryId} />
      </div>

      {/* Default Product Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {defaultFields.map((field) => (
          <div
            key={field.id}
            className={cn(
              field.type === 'textarea' && 'md:col-span-2',
              field.id === 'images' && 'md:col-span-2'
            )}
          >
            <Label htmlFor={field.slug}>
              {field.name} {field.required && <span className="text-red-500">*</span>}
            </Label>
            {field.helpText && (
              <p className="text-xs text-slate-500 mb-1">{field.helpText}</p>
            )}
            {renderField(field)}
            {errors[field.slug] && (
              <p className="text-xs text-red-500 mt-1">
                {errors[field.slug]?.message as string}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Category-Specific Fields */}
      {selectedCategorySlug && categoryFields.length > 0 && (
        <div className="border-t pt-6 mt-6">
          <h3 className="text-lg font-semibold mb-4">
            Informations spécifiques: {categories.find(c => c.slug === selectedCategorySlug)?.name}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categoryFields.map((field) => (
              <div
                key={field.id}
                className={cn(
                  field.type === 'textarea' && 'md:col-span-2',
                  field.type === 'multiselect' && 'md:col-span-2'
                )}
              >
                <Label htmlFor={field.slug}>
                  {field.name} {field.required && <span className="text-red-500">*</span>}
                </Label>
                {field.helpText && (
                  <p className="text-xs text-slate-500 mb-1">{field.helpText}</p>
                )}
                {renderField(field)}
                {errors[field.slug] && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors[field.slug]?.message as string}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-end pt-4">
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-2 bg-sisma-red text-white rounded-lg hover:bg-sisma-red/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Enregistrement...' : 'Enregistrer le produit'}
        </button>
      </div>
    </form>
  );
}

// Default fields helper function
function getDefaultFields(): CategoryField[] {
  return [
    {
      id: 'name',
      name: 'Nom du produit',
      slug: 'name',
      type: 'text' as FieldType,
      required: true,
      placeholder: 'Entrez le nom du produit',
    },
    {
      id: 'description',
      name: 'Description',
      slug: 'description',
      type: 'textarea' as FieldType,
      required: true,
      placeholder: 'Décrivez votre produit...',
    },
    {
      id: 'price',
      name: 'Prix',
      slug: 'price',
      type: 'number' as FieldType,
      required: true,
      placeholder: '0',
      validation: { min: 0 },
    },
    {
      id: 'stock',
      name: 'Stock',
      slug: 'stock',
      type: 'number' as FieldType,
      required: true,
      placeholder: '0',
      validation: { min: 0 },
    },
    {
      id: 'category_id',
      name: 'Catégorie',
      slug: 'category_id',
      type: 'select' as FieldType,
      required: true,
    },
    {
      id: 'images',
      name: 'Images',
      slug: 'images',
      type: 'multiselect' as FieldType,
      required: false,
    },
  ];
}
