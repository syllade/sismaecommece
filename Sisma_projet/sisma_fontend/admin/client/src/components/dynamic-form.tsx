import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FieldType, CategoryField, DEFAULT_PRODUCT_FIELDS } from "@/hooks/use-category-fields";

interface DynamicFormProps {
  categoryId: string | null;
  categorySlug?: string;
  formData: Record<string, any>;
  onChange: (field: string, value: any) => void;
  errors?: Record<string, string>;
  showBaseFields?: boolean; // If true, shows all fields. If false, only shows category-specific fields
}

export function DynamicForm({
  categoryId,
  categorySlug = "",
  formData,
  onChange,
  errors = {},
  showBaseFields = true,
}: DynamicFormProps) {
  const [fields, setFields] = useState<CategoryField[]>(showBaseFields ? DEFAULT_PRODUCT_FIELDS : []);

  // Update fields when category changes
  useEffect(() => {
    if (categoryId) {
      // Dynamically import to avoid circular dependencies
      import("@/hooks/use-category-fields").then((module) => {
        const categoryFields = module.getCategorySpecificFields(categorySlug);
        if (showBaseFields) {
          setFields([...DEFAULT_PRODUCT_FIELDS, ...categoryFields]);
        } else {
          setFields(categoryFields);
        }
      });
    } else {
      setFields(showBaseFields ? DEFAULT_PRODUCT_FIELDS : []);
    }
  }, [categoryId, categorySlug, showBaseFields]);

  const renderField = (field: CategoryField) => {
    const error = errors[field.slug];
    const value = formData[field.slug] ?? field.defaultValue ?? "";

    switch (field.type) {
      case "text":
        return (
          <Input
            id={field.slug}
            value={value}
            onChange={(e) => onChange(field.slug, e.target.value)}
            placeholder={field.placeholder}
            className={error ? "border-red-500" : ""}
          />
        );

      case "number":
        return (
          <Input
            id={field.slug}
            type="number"
            value={value}
            onChange={(e) => onChange(field.slug, e.target.value)}
            placeholder={field.placeholder}
            min={field.validation?.min}
            max={field.validation?.max}
            className={error ? "border-red-500" : ""}
          />
        );

      case "textarea":
        return (
          <Textarea
            id={field.slug}
            value={value}
            onChange={(e) => onChange(field.slug, e.target.value)}
            placeholder={field.placeholder}
            rows={4}
            className={error ? "border-red-500" : ""}
          />
        );

      case "select":
        return (
          <Select value={value?.toString()} onValueChange={(val) => onChange(field.slug, val)}>
            <SelectTrigger className={error ? "border-red-500" : ""}>
              <SelectValue placeholder={field.placeholder} />
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

      case "multiselect":
        return (
          <div className="space-y-2">
            <Select
              value={value?.[0]?.toString() || ""}
              onValueChange={(val) => {
                const current = Array.isArray(value) ? value : [];
                if (!current.includes(val)) {
                  onChange(field.slug, [...current, val]);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder={field.placeholder || "Ajouter..."} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {Array.isArray(value) && value.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {value.map((v: string, idx: number) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-sm"
                  >
                    {v}
                    <button
                      type="button"
                      onClick={() => onChange(field.slug, value.filter((x: string) => x !== v))}
                      className="ml-1 hover:text-blue-600"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        );

      case "boolean":
        return (
          <Select value={value?.toString() || "false"} onValueChange={(val) => onChange(field.slug, val === "true")}>
            <SelectTrigger>
              <SelectValue placeholder={field.helpText || "Sélectionner"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Oui</SelectItem>
              <SelectItem value="false">Non</SelectItem>
            </SelectContent>
          </Select>
        );

      case "date":
        return (
          <Input
            id={field.slug}
            type="date"
            value={value}
            onChange={(e) => onChange(field.slug, e.target.value)}
            className={error ? "border-red-500" : ""}
          />
        );

      default:
        return (
          <Input
            id={field.slug}
            value={value}
            onChange={(e) => onChange(field.slug, e.target.value)}
            placeholder={field.placeholder}
            className={error ? "border-red-500" : ""}
          />
        );
    }
  };

  // Group fields by category
  const baseFields = fields.filter(
    (f) =>
      ["name", "slug", "description", "price", "stock", "category_id", "image", "images", "is_active"].includes(f.id)
  );
  
  const categoryFields = fields.filter(
    (f) =>
      ![
        "name",
        "slug",
        "description",
        "price",
        "stock",
        "category_id",
        "image",
        "images",
        "is_active",
      ].includes(f.id)
  );

  return (
    <div className="space-y-6">
      {/* Base Product Fields */}
      <Card>
        <CardHeader>
          <CardTitle>Informations du produit</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {baseFields.map((field) => (
            <div key={field.slug}>
              <Label htmlFor={field.slug} className={field.required ? "required" : ""}>
                {field.name}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
              {renderField(field)}
              {errors[field.slug] && <p className="text-sm text-red-500 mt-1">{errors[field.slug]}</p>}
              {field.helpText && !errors[field.slug] && (
                <p className="text-sm text-gray-500 mt-1">{field.helpText}</p>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Category-specific Fields */}
      {categoryId && categoryFields.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-800">Caractéristiques selon la catégorie</CardTitle>
            <CardDescription className="text-blue-600">
              Ces champs sont spécifiques à la catégorie sélectionnée
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {categoryFields.map((field) => (
              <div key={field.slug}>
                <Label htmlFor={field.slug} className={field.required ? "required" : ""}>
                  {field.name}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </Label>
                {renderField(field)}
                {errors[field.slug] && (
                  <p className="text-sm text-red-500 mt-1">{errors[field.slug]}</p>
                )}
                {field.helpText && !errors[field.slug] && (
                  <p className="text-sm text-gray-500 mt-1">{field.helpText}</p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default DynamicForm;
