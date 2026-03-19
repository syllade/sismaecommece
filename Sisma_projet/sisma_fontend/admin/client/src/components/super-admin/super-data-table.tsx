import { useMemo } from "react";
import { AgGridReact } from "ag-grid-react";
import type { ColDef, SelectionChangedEvent } from "ag-grid-community";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

interface SuperDataTableProps<RowData extends object> {
  title: string;
  description: string;
  rows: RowData[];
  columns: ColDef<RowData>[];
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  toolbar?: React.ReactNode;
  onSelectionChange?: (rows: RowData[]) => void;
  loading?: boolean;
  height?: number;
  emptyMessage?: string;
}

export function SuperDataTable<RowData extends object>({
  title,
  description,
  rows,
  columns,
  searchValue,
  onSearchChange,
  searchPlaceholder = "Rechercher...",
  toolbar,
  onSelectionChange,
  loading = false,
  height = 460,
  emptyMessage = "Aucune donnee disponible.",
}: SuperDataTableProps<RowData>) {
  const defaultColDef = useMemo<ColDef<RowData>>(
    () => ({
      sortable: true,
      filter: true,
      resizable: true,
      flex: 1,
      minWidth: 120,
    }),
    [],
  );

  const handleSelectionChange = (event: SelectionChangedEvent<RowData>) => {
    if (!onSelectionChange) return;
    onSelectionChange(event.api.getSelectedRows());
  };

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="font-outfit text-xl text-slate-900">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              value={searchValue}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder={searchPlaceholder}
              className="h-9 w-full sm:w-64"
            />
            {toolbar}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="rounded-xl border border-dashed border-slate-200 px-4 py-12 text-center text-sm text-slate-500">
            Chargement des donnees...
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 px-4 py-12 text-center text-sm text-slate-500">
            {emptyMessage}
          </div>
        ) : (
          <div className="ag-theme-alpine w-full" style={{ height }}>
            <AgGridReact<RowData>
              rowData={rows}
              columnDefs={columns}
              defaultColDef={defaultColDef}
              rowSelection="multiple"
              suppressRowClickSelection
              pagination
              paginationPageSize={25}
              animateRows
              quickFilterText={searchValue}
              onSelectionChanged={handleSelectionChange}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
