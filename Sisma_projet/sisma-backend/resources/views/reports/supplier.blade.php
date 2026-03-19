<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Fiche Fournisseur - {{ $supplier->name }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Helvetica Neue', Arial, sans-serif;
            font-size: 12px;
            line-height: 1.5;
            color: #333;
            padding: 20px;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #e74c3c;
        }
        .header h1 {
            color: #e74c3c;
            font-size: 24px;
            margin-bottom: 5px;
        }
        .header .subtitle {
            color: #666;
            font-size: 14px;
        }
        .section {
            margin-bottom: 25px;
        }
        .section-title {
            background: #f8f9fa;
            padding: 10px 15px;
            border-left: 4px solid #e74c3c;
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 15px;
        }
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
        }
        .info-item {
            margin-bottom: 8px;
        }
        .info-label {
            font-weight: bold;
            color: #555;
        }
        .info-value {
            color: #333;
        }
        .grade-box {
            text-align: center;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 10px;
            margin-bottom: 20px;
        }
        .grade {
            font-size: 48px;
            font-weight: bold;
            color: #e74c3c;
        }
        .grade-label {
            font-size: 14px;
            color: #666;
        }
        .score {
            font-size: 18px;
            color: #333;
            margin-top: 5px;
        }
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
            margin-bottom: 20px;
        }
        .metric-card {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            text-align: center;
        }
        .metric-value {
            font-size: 24px;
            font-weight: bold;
            color: #e74c3c;
        }
        .metric-label {
            font-size: 11px;
            color: #666;
            text-transform: uppercase;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }
        th, td {
            padding: 8px 10px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        th {
            background: #f8f9fa;
            font-weight: bold;
            font-size: 11px;
            text-transform: uppercase;
        }
        .status {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 3px;
            font-size: 10px;
            font-weight: bold;
        }
        .status-delivered { background: #d4edda; color: #155724; }
        .status-pending { background: #fff3cd; color: #856404; }
        .status-cancelled { background: #f8d7da; color: #721c24; }
        .status-processing { background: #cce5ff; color: #004085; }
        .footer {
            margin-top: 30px;
            padding-top: 15px;
            border-top: 1px solid #ddd;
            text-align: center;
            font-size: 10px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>SISMA Marketplace</h1>
        <div class="subtitle">Fiche Fournisseur - {{ $supplier->name }}</div>
    </div>

    <div class="grade-box">
        <div class="grade">{{ $grade }}</div>
        <div class="grade-label">Note de Performance</div>
        <div class="score">Score: {{ $score }}/100</div>
    </div>

    <div class="section">
        <div class="section-title">Informations du Fournisseur</div>
        <div class="info-grid">
            <div class="info-item">
                <span class="info-label">Nom:</span>
                <span class="info-value">{{ $supplier->name }}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Email:</span>
                <span class="info-value">{{ $supplier->email }}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Téléphone:</span>
                <span class="info-value">{{ $supplier->phone ?? 'N/A' }}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Adresse:</span>
                <span class="info-value">{{ $supplier->address ?? 'N/A' }}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Statut:</span>
                <span class="info-value">{{ $supplier->is_active ? 'Actif' : 'Inactif' }}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Date d'inscription:</span>
                <span class="info-value">{{ $supplier->created_at ? \Carbon\Carbon::parse($supplier->created_at)->format('d/m/Y') : 'N/A' }}</span>
            </div>
        </div>
    </div>

    <div class="section">
        <div class="section-title">Indicateurs de Performance</div>
        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-value">{{ $metrics->total_orders ?? 0 }}</div>
                <div class="metric-label">Commandes Totales</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">{{ number_format($metrics->total_revenue ?? 0, 0, ',', ' ') }} CFA</div>
                <div class="metric-label">Chiffre d'Affaires</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">{{ number_format($metrics->avg_order_value ?? 0, 0, ',', ' ') }} CFA</div>
                <div class="metric-label">Panier Moyen</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">{{ $rating }}/5</div>
                <div class="metric-label">Note Moyenne</div>
            </div>
        </div>
    </div>

    <div class="section">
        <div class="section-title">Produits</div>
        <div class="info-grid">
            <div class="info-item">
                <span class="info-label">Total Produits:</span>
                <span class="info-value">{{ $products_count }}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Produits Actifs:</span>
                <span class="info-value">{{ $active_products_count }}</span>
            </div>
        </div>
    </div>

    <div class="section">
        <div class="section-title">Commandes Récentes</div>
        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Client</th>
                    <th>Total</th>
                    <th>Statut</th>
                    <th>Date</th>
                </tr>
            </thead>
            <tbody>
                @forelse($recentOrders as $order)
                <tr>
                    <td>#{{ $order->id }}</td>
                    <td>{{ $order->client_name ?? 'N/A' }}</td>
                    <td>{{ number_format($order->total, 0, ',', ' ') }} CFA</td>
                    <td>
                        <span class="status status-{{ $order->status }}">
                            {{ ucfirst($order->status) }}
                        </span>
                    </td>
                    <td>{{ \Carbon\Carbon::parse($order->created_at)->format('d/m/Y') }}</td>
                </tr>
                @empty
                <tr>
                    <td colspan="5" style="text-align: center;">Aucune commande récente</td>
                </tr>
                @endforelse
            </tbody>
        </table>
    </div>

    <div class="footer">
        <p>Document généré le {{ $generated_at }}</p>
        <p>SISMA Marketplace - Plateforme E-commerce Multi-Vendeurs</p>
    </div>
</body>
</html>
