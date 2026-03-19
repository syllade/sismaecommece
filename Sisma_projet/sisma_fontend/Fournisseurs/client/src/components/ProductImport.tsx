import { useState, useRef, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface ParsedRow {
  row: number;
  data: Record<string, string>;
  errors: string[];
  isValid: boolean;
}

interface ImportResult {
  imported: number;
  failed: Array<{ row: number; error: string }>;
  job_id?: string;
  status?: string;
}

const SAMPLE_CSV = `name,price,sku,category,description,stock
T-shirt Basic,5000,TSHIRT001,Vêtements,T-shirt en coton bio,100
Jean Slim,12000,JN001,Vêtements,Jean slim élastique,50
Sandales Femme,8000,SF001,Chaussures,Sandales été,75
Sac à main,15000,SAC001,Accessoires,Sac cuir synthétique,30`;

function parseCSV(text: string): ParsedRow[] {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const rows: ParsedRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    const data: Record<string, string> = {};
    
    headers.forEach((header, index) => {
      data[header] = values[index] || '';
    });

    const errors: string[] = [];
    if (!data.name) errors.push('Nom requis');
    if (!data.price || isNaN(Number(data.price))) errors.push('Prix invalide');
    if (data.stock && isNaN(Number(data.stock))) errors.push('Stock invalide');

    rows.push({
      row: i + 1,
      data,
      errors,
      isValid: errors.length === 0,
    });
  }

  return rows;
}

export function ProductImport() {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [step, setStep] = useState<'upload' | 'preview' | 'result'>('upload');
  const [jobId, setJobId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const importMutation = useMutation({
    mutationFn: async (formData: FormData): Promise<ImportResult> => {
      const apiRoot = (import.meta.env.VITE_API_URL || "http://localhost:8000/api").replace(/\/+$/, "");
      const token =
        localStorage.getItem("sisma_supplier_token") ||
        localStorage.getItem("fashop_supplier_token") ||
        "";
      const response = await fetch(`${apiRoot}/v1/supplier/products/import`, {
        method: 'POST',
        body: formData,
        headers: {
          Accept: 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de l\'import');
      }
      const payload = await response.json();
      const data = payload?.data ?? payload;
      return data;
    },
    onSuccess: (data) => {
      setJobId(data.job_id || null);
      toast({
        title: 'Import terminé',
        description: `${data.imported} produit(s) importé(s), ${data.failed.length} erreur(s)`,
      });
      setStep('result');
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      toast({
        title: 'Format invalide',
        description: 'Veuillez sélectionner un fichier CSV',
        variant: 'destructive',
      });
      return;
    }

    setFile(selectedFile);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const parsed = parseCSV(text);
      setParsedData(parsed);
      setStep('preview');
    };
    reader.readAsText(selectedFile);
  }, [toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.name.endsWith('.csv')) {
      setFile(droppedFile);
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const parsed = parseCSV(text);
        setParsedData(parsed);
        setStep('preview');
      };
      reader.readAsText(droppedFile);
    }
  }, []);

  const handleDownloadTemplate = () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'modele_import_produits.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    importMutation.mutate(formData);
  };

  const handleReset = () => {
    setFile(null);
    setParsedData([]);
    setStep('upload');
    setJobId(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validCount = parsedData.filter(r => r.isValid).length;
  const invalidCount = parsedData.filter(r => !r.isValid).length;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Importer des produits</h2>
        <p className="text-gray-500">Importez vos produits depuis un fichier CSV</p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center mb-8">
        {['upload', 'preview', 'result'].map((s, i) => (
          <div key={s} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step === s ? 'bg-sisma-red text-white' :
              ['upload', 'preview', 'result'].indexOf(step) > i ? 'bg-green-500 text-white' :
              'bg-gray-200 text-gray-500'
            }`}>
              {['upload', 'preview', 'result'].indexOf(step) > i ? '✓' : i + 1}
            </div>
            <span className={`ml-2 text-sm ${step === s ? 'text-gray-800 font-medium' : 'text-gray-400'}`}>
              {s === 'upload' ? 'Upload' : s === 'preview' ? 'Aperçu' : 'Résultat'}
            </span>
            {i < 2 && <div className={`w-12 h-0.5 mx-2 ${['upload', 'preview', 'result'].indexOf(step) > i ? 'bg-green-500' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      {/* Upload Step */}
      {step === 'upload' && (
        <div className="space-y-4">
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-sisma-red transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-gray-600 mb-2">Glissez-déposez votre fichier CSV ici</p>
            <p className="text-sm text-gray-400">ou cliquez pour parcourir</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          <div className="flex justify-center">
            <button
              onClick={handleDownloadTemplate}
              className="text-sisma-red hover:underline text-sm"
            >
              Télécharger le modèle CSV
            </button>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
            <p className="font-medium mb-2">Format attendu:</p>
            <code className="block bg-gray-100 p-2 rounded">
              name,price,sku,category,description,stock
            </code>
            <p className="mt-2 text-gray-400">* name et price sont obligatoires</p>
          </div>
        </div>
      )}

      {/* Preview Step */}
      {step === 'preview' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex gap-4">
              <span className="text-green-600 font-medium">{validCount} valides</span>
              {invalidCount > 0 && (
                <span className="text-red-600 font-medium">{invalidCount} erreurs</span>
              )}
            </div>
            <button onClick={handleReset} className="text-gray-500 hover:text-gray-700">
              Recommencer
            </button>
          </div>

          <div className="bg-white border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-gray-500">Ligne</th>
                    <th className="px-3 py-2 text-left text-gray-500">Nom</th>
                    <th className="px-3 py-2 text-left text-gray-500">Prix</th>
                    <th className="px-3 py-2 text-left text-gray-500">SKU</th>
                    <th className="px-3 py-2 text-left text-gray-500">Catégorie</th>
                    <th className="px-3 py-2 text-left text-gray-500">Stock</th>
                    <th className="px-3 py-2 text-left text-gray-500">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedData.slice(0, 20).map((row) => (
                    <tr key={row.row} className={`border-t ${row.isValid ? '' : 'bg-red-50'}`}>
                      <td className="px-3 py-2 text-gray-500">{row.row}</td>
                      <td className="px-3 py-2">{row.data.name || '-'}</td>
                      <td className="px-3 py-2">{row.data.price || '-'}</td>
                      <td className="px-3 py-2 text-gray-500">{row.data.sku || '-'}</td>
                      <td className="px-3 py-2">{row.data.category || '-'}</td>
                      <td className="px-3 py-2">{row.data.stock || '-'}</td>
                      <td className="px-3 py-2">
                        {row.isValid ? (
                          <span className="inline-flex items-center text-green-600">
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            OK
                          </span>
                        ) : (
                          <span className="text-red-600 text-xs">
                            {row.errors.join(', ')}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {parsedData.length > 20 && (
              <div className="p-2 bg-gray-50 text-center text-sm text-gray-500">
                ... et {parsedData.length - 20} autres lignes
              </div>
            )}
          </div>

          {invalidCount > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600 font-medium mb-2">
                {invalidCount} produit(s) seront ignorés car ils contiennent des erreurs
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              onClick={handleReset}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Annuler
            </button>
            <button
              onClick={handleImport}
              disabled={validCount === 0 || importMutation.isPending}
              className="px-6 py-2 bg-sisma-red text-white rounded-lg hover:bg-sisma-red/90 disabled:opacity-50"
            >
              {importMutation.isPending ? 'Import en cours...' : `Importer ${validCount} produit(s)`}
            </button>
          </div>
        </div>
      )}

      {/* Result Step */}
      {step === 'result' && (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Import terminé!</h3>
          <p className="text-gray-500 mb-6">
            {importMutation.data?.imported} produit(s) importé(s) avec succès
          </p>
          {jobId && (
            <p className="text-sm text-gray-600 mb-4">
              Job ID: <span className="font-mono">{jobId}</span>
            </p>
          )}
          {importMutation.data && importMutation.data.failed.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-left max-w-md mx-auto">
              <p className="text-red-600 font-medium mb-2">Erreurs:</p>
              <ul className="text-sm text-red-500 space-y-1">
                {importMutation.data.failed.slice(0, 5).map((f, i) => (
                  <li key={i}>Ligne {f.row}: {f.error}</li>
                ))}
                {importMutation.data.failed.length > 5 && (
                  <li>...et {importMutation.data.failed.length - 5} autres</li>
                )}
              </ul>
            </div>
          )}
          <button
            onClick={handleReset}
            className="px-6 py-2 bg-sisma-red text-white rounded-lg hover:bg-sisma-red/90"
          >
            Importer d'autres produits
          </button>
        </div>
      )}
    </div>
  );
}

export default ProductImport;
