# SISMA API Endpoints Documentation

This document lists all available API endpoints in the Laravel backend and their integration status.

## Base URL
```
http://localhost:8000/api
``` 

## Authentication Headers
All protected endpoints require:
```
Authorization: Bearer {token}
Content-Type: application/json
Accept: application/json
```

---

## 🔓 PUBLIC ENDPOINTS (No Auth Required)

### Authentication
| Method | Endpoint | Description | Frontend Status |
|--------|----------|-------------|-----------------|
| POST | `/api/auth/login` | User login | ✅ Connected |
| POST | `/api/auth/register` | User registration | ✅ Connected |
| POST | `/api/auth/activate` | Account activation | ✅ Connected |
| GET | `/api/auth/activation/{token}` | Activation status | ✅ Connected |

### Products
| Method | Endpoint | Description | Frontend Status |
|--------|----------|-------------|-----------------|
| GET | `/api/products` | List all products | ✅ Connected |
| GET | `/api/products/{slug}` | Product details | ✅ Connected |

### Categories
| Method | Endpoint | Description | Frontend Status |
|--------|----------|-------------|-----------------|
| GET | `/api/categories` | List categories | ✅ Connected |
| GET | `/api/categories/{id}/schema` | Category schema | ✅ Connected |

### Suppliers (Public)
| Method | Endpoint | Description | Frontend Status |
|--------|----------|-------------|-----------------|
| GET | `/api/suppliers` | List suppliers | ✅ Connected |
| GET | `/api/suppliers/{slug}` | Supplier details | ✅ Connected |
| GET | `/api/suppliers/{id}/products` | Supplier products | ✅ Connected |
| POST | `/api/suppliers` | Register supplier | ✅ Connected |

### Orders (Public)
| Method | Endpoint | Description | Frontend Status |
|--------|----------|-------------|-----------------|
| POST | `/api/orders` | Create order | ✅ Connected |
| GET | `/api/delivery/confirm/{token}` | Confirm delivery | ✅ Connected |

### Other
| Method | Endpoint | Description | Frontend Status |
|--------|----------|-------------|-----------------|
| GET | `/api/testimonials` | List testimonials | ✅ Connected |
| GET | `/api/settings` | Get settings | ✅ Connected |
| GET | `/api/settings/{key}` | Get setting by key | ✅ Connected |
| GET | `/api/landing` | Landing page settings | ✅ Connected |
| GET | `/api/delivery-fees/calculate` | Calculate delivery fee | ✅ Connected |

---

## 🔐 PROTECTED ENDPOINTS (Auth Required)

### Authentication (User)
| Method | Endpoint | Description | Frontend Status |
|--------|----------|-------------|-----------------|
| GET | `/api/auth/me` | Get current user | ✅ Connected |
| POST | `/api/auth/logout` | Logout | ✅ Connected |
| POST | `/api/auth/refresh` | Refresh token | ✅ Connected |

---

## 👑 ADMIN ENDPOINTS (Role: admin)

### Dashboard & Analytics
| Method | Endpoint | Description | Frontend Status |
|--------|----------|-------------|-----------------|
| GET | `/api/v1/admin/stats` | Admin dashboard stats | ✅ Connected |
| GET | `/api/v1/admin/stats/kpis` | KPIs data | ✅ Connected |
| GET | `/api/admin/analytics/dashboard` | Dashboard stats | ✅ Connected |
| GET | `/api/admin/analytics/sales` | Sales analytics | ✅ Connected |
| GET | `/api/admin/analytics/category-sales` | Sales by category | ✅ Connected |
| GET | `/api/admin/analytics/top-products` | Top products | ✅ Connected |
| GET | `/api/admin/analytics/orders-by-status` | Orders by status | ✅ Connected |
| GET | `/api/admin/analytics/delivery-persons` | Delivery stats | ✅ Connected |

### Admin Notifications
| Method | Endpoint | Description | Frontend Status |
|--------|----------|-------------|-----------------|
| GET | `/api/v1/admin/notifications` | List notifications | ✅ Connected |
| GET | `/api/v1/admin/notifications/unread-count` | Unread count | ✅ Connected |
| GET | `/api/v1/admin/notifications/stats` | Notification stats | ✅ Connected |
| PUT | `/api/v1/admin/notifications/{id}/read` | Mark as read | ✅ Connected |
| PUT | `/api/v1/admin/notifications/read-all` | Mark all read | ✅ Connected |
| DELETE | `/api/v1/admin/notifications/{id}` | Delete notification | ✅ Connected |

### Admin Suppliers Management
| Method | Endpoint | Description | Frontend Status |
|--------|----------|-------------|-----------------|
| GET | `/api/v1/admin/suppliers` | List suppliers | ✅ Connected |
| POST | `/api/v1/admin/suppliers` | Create supplier | ✅ Connected |
| GET | `/api/v1/admin/suppliers/{id}` | Supplier details | ✅ Connected |
| PUT | `/api/v1/admin/suppliers/{id}` | Update supplier | ✅ Connected |
| DELETE | `/api/v1/admin/suppliers/{id}` | Delete supplier | ✅ Connected |
| POST | `/api/v1/admin/suppliers/{id}/block` | Block supplier | ✅ Connected |
| POST | `/api/v1/admin/suppliers/{id}/reset-password` | Reset password | ✅ Connected |
| POST | `/api/v1/admin/suppliers/invite` | Invite supplier | ✅ Connected |
| POST | `/api/v1/admin/suppliers/bulk-action` | Bulk action | ✅ Connected |

### Supplier Monitoring
| Method | Endpoint | Description | Frontend Status |
|--------|----------|-------------|-----------------|
| GET | `/api/v1/admin/suppliers-overview` | Suppliers overview | ✅ Connected |
| GET | `/api/v1/admin/suppliers/{id}/activity` | Activity log | ✅ Connected |
| GET | `/api/v1/admin/suppliers/{id}/ai-usage` | AI usage stats | ✅ Connected |
| GET | `/api/v1/admin/suppliers/{id}/campaign-clicks` | Campaign clicks | ✅ Connected |
| GET | `/api/v1/admin/suppliers/{id}/metrics` | Metrics | ✅ Connected |
| GET | `/api/v1/admin/suppliers/{id}/export` | Export data | ✅ Connected |
| GET | `/api/v1/admin/suppliers/threshold-alert` | Threshold alerts | ✅ Connected |

### Admin Drivers Management
| Method | Endpoint | Description | Frontend Status |
|--------|----------|-------------|-----------------|
| GET | `/api/v1/admin/drivers` | List drivers | ✅ Connected |
| POST | `/api/v1/admin/drivers` | Create driver | ✅ Connected |
| GET | `/api/v1/admin/drivers/{id}` | Driver details | ✅ Connected |
| PUT | `/api/v1/admin/drivers/{id}` | Update driver | ✅ Connected |
| POST | `/api/v1/admin/drivers/{id}/toggle-status` | Toggle status | ✅ Connected |
| DELETE | `/api/v1/admin/drivers/{id}` | Delete driver | ✅ Connected |
| GET | `/api/v1/admin/drivers/zones` | Delivery zones | ✅ Connected |
| POST | `/api/v1/admin/drivers/bulk-toggle` | Bulk toggle | ✅ Connected |

### Admin Orders
| Method | Endpoint | Description | Frontend Status |
|--------|----------|-------------|-----------------|
| GET | `/api/v1/admin/orders` | List orders | ✅ Connected |
| GET | `/api/v1/admin/orders/{id}` | Order details | ✅ Connected |
| PUT | `/api/v1/admin/orders/{id}` | Update order | ✅ Connected |
| PUT | `/api/v1/admin/orders/{id}/status` | Update status | ✅ Connected |
| POST | `/api/v1/admin/orders/{id}/assign-driver` | Assign driver | ✅ Connected |
| POST | `/api/v1/admin/orders/assign-driver` | Bulk assign | ✅ Connected |
| GET | `/api/v1/admin/orders/grouped` | Grouped orders | ✅ Connected |
| GET | `/api/v1/admin/orders/unprocessed` | Unprocessed orders | ✅ Connected |
| DELETE | `/api/v1/admin/orders/{id}` | Delete order | ✅ Connected |

### Admin Logistics
| Method | Endpoint | Description | Frontend Status |
|--------|----------|-------------|-----------------|
| GET | `/api/v1/admin/logistics/live` | Live tracking | ✅ Connected |
| GET | `/api/v1/admin/logistics/zones` | Delivery zones | ✅ Connected |
| GET | `/api/v1/admin/logistics/alerts` | Logistics alerts | ✅ Connected |
| GET | `/api/v1/admin/logistics/tours` | Delivery tours | ✅ Connected |

### Admin Marketing
| Method | Endpoint | Description | Frontend Status |
|--------|----------|-------------|-----------------|
| GET | `/api/v1/admin/campaigns` | List campaigns | ✅ Connected |
| POST | `/api/v1/admin/campaigns` | Create campaign | ✅ Connected |
| GET | `/api/v1/admin/campaigns/{id}` | Campaign details | ✅ Connected |
| PUT | `/api/v1/admin/campaigns/{id}` | Update campaign | ✅ Connected |
| PUT | `/api/v1/admin/campaigns/{id}/approve` | Approve campaign | ✅ Connected |
| PUT | `/api/v1/admin/campaigns/{id}/reject` | Reject campaign | ✅ Connected |
| DELETE | `/api/v1/admin/campaigns/{id}` | Delete campaign | ✅ Connected |
| GET | `/api/v1/admin/campaigns/{id}/stats` | Campaign stats | ✅ Connected |

### Admin Reports
| Method | Endpoint | Description | Frontend Status |
|--------|----------|-------------|-----------------|
| GET | `/api/v1/admin/reports/orders` | Orders report | ✅ Connected |
| GET | `/api/v1/admin/reports/suppliers` | Suppliers report | ✅ Connected |
| GET | `/api/v1/admin/reports/deliveries` | Deliveries report | ✅ Connected |
| GET | `/api/v1/admin/reports/top-products` | Top products report | ✅ Connected |
| GET | `/api/v1/admin/reports/export/csv` | Export CSV | ✅ Connected |
| GET | `/api/v1/admin/reports/export/pdf` | Export PDF | ✅ Connected |

### Admin Settings
| Method | Endpoint | Description | Frontend Status |
|--------|----------|-------------|-----------------|
| GET | `/api/v1/admin/settings` | Get settings | ✅ Connected |
| PUT | `/api/v1/admin/settings` | Update settings | ✅ Connected |
| GET | `/api/v1/admin/settings/landing` | Landing settings | ✅ Connected |
| PUT | `/api/v1/admin/settings/landing` | Update landing | ✅ Connected |
| GET | `/api/v1/admin/settings/commissions` | Commission settings | ✅ Connected |
| PUT | `/api/v1/admin/settings/commissions/global` | Global commission | ✅ Connected |
| PUT | `/api/v1/admin/settings/commissions/supplier` | Supplier commission | ✅ Connected |
| GET | `/api/v1/admin/settings/categories` | Categories settings | ✅ Connected |
| POST | `/api/v1/admin/settings/categories` | Create category | ✅ Connected |
| PUT | `/api/v1/admin/settings/categories/{id}` | Update category | ✅ Connected |
| DELETE | `/api/v1/admin/settings/categories/{id}` | Delete category | ✅ Connected |
| PUT | `/api/v1/admin/settings/categories/reorder` | Reorder categories | ✅ Connected |
| GET | `/api/v1/admin/settings/delivery-zones` | Delivery zones | ✅ Connected |
| POST | `/api/v1/admin/settings/delivery-zones` | Create zone | ✅ Connected |
| PUT | `/api/v1/admin/settings/delivery-zones/{id}` | Update zone | ✅ Connected |
| DELETE | `/api/v1/admin/settings/delivery-zones/{id}` | Delete zone | ✅ Connected |

### Admin Products
| Method | Endpoint | Description | Frontend Status |
|--------|----------|-------------|-----------------|
| GET | `/api/admin/products` | List products | ✅ Connected |
| POST | `/api/admin/products` | Create product | ✅ Connected |
| GET | `/api/admin/products/{id}` | Product details | ✅ Connected |
| PUT | `/api/admin/products/{id}` | Update product | ✅ Connected |
| DELETE | `/api/admin/products/{id}` | Delete product | ✅ Connected |
| POST | `/api/admin/products/{id}/duplicate` | Duplicate product | ✅ Connected |

### Admin Categories
| Method | Endpoint | Description | Frontend Status |
|--------|----------|-------------|-----------------|
| GET | `/api/admin/categories` | List categories | ✅ Connected |
| POST | `/api/admin/categories` | Create category | ✅ Connected |
| PUT | `/api/admin/categories/{id}` | Update category | ✅ Connected |
| DELETE | `/api/admin/categories/{id}` | Delete category | ✅ Connected |

### Admin Invoices
| Method | Endpoint | Description | Frontend Status |
|--------|----------|-------------|-----------------|
| GET | `/api/admin/invoices` | List invoices | ✅ Connected |
| GET | `/api/admin/invoices/{id}` | Invoice details | ✅ Connected |
| PUT | `/api/admin/invoices/{id}/status` | Update status | ✅ Connected |

### Admin Delivery Fees
| Method | Endpoint | Description | Frontend Status |
|--------|----------|-------------|-----------------|
| GET | `/api/admin/delivery-fees` | List fees | ✅ Connected |
| POST | `/api/admin/delivery-fees` | Create fee | ✅ Connected |

---

## 📦 SUPPLIER ENDPOINTS (Role: supplier)

### Supplier Dashboard
| Method | Endpoint | Description | Frontend Status |
|--------|----------|-------------|-----------------|
| GET | `/api/v1/supplier/dashboard` | Dashboard stats | ✅ Connected |
| GET | `/api/v1/supplier/dashboard/revenue` | Revenue data | ✅ Connected |
| GET | `/api/v1/supplier/dashboard/orders-by-status` | Orders by status | ✅ Connected |
| GET | `/api/v1/supplier/dashboard/top-products` | Top products | ✅ Connected |
| GET | `/api/v1/supplier/dashboard/recent-orders` | Recent orders | ✅ Connected |

### Supplier Orders
| Method | Endpoint | Description | Frontend Status |
|--------|----------|-------------|-----------------|
| GET | `/api/v1/supplier/orders` | List orders | ✅ Connected |
| GET | `/api/v1/supplier/orders/{id}` | Order details | ✅ Connected |
| PUT | `/api/v1/supplier/orders/{id}` | Update order | ✅ Connected |
| PUT | `/api/v1/supplier/orders/{id}/status` | Update status | ✅ Connected |
| POST | `/api/v1/supplier/orders/manual` | Create manual order | ✅ Connected |
| POST | `/api/v1/supplier/orders/bulk-status` | Bulk status | ✅ Connected |
| GET | `/api/v1/supplier/orders/pending-count` | Pending count | ✅ Connected |

### Supplier Order Notifications
| Method | Endpoint | Description | Frontend Status |
|--------|----------|-------------|-----------------|
| GET | `/api/v1/supplier/orders/{id}/notifications` | Notifications | ✅ Connected |
| POST | `/api/v1/supplier/orders/{id}/send-whatsapp` | Send WhatsApp | ✅ Connected |
| POST | `/api/v1/supplier/orders/{id}/send-email` | Send email | ✅ Connected |
| GET | `/api/v1/supplier/orders/{id}/invoice-html` | Generate invoice | ✅ Connected |
| GET | `/api/v1/supplier/orders/{id}/print` | Print view | ✅ Connected |

### Supplier Products
| Method | Endpoint | Description | Frontend Status |
|--------|----------|-------------|-----------------|
| GET | `/api/v1/supplier/products` | List products | ✅ Connected |
| POST | `/api/v1/supplier/products` | Create product | ✅ Connected |
| GET | `/api/v1/supplier/products/{id}` | Product details | ✅ Connected |
| PUT | `/api/v1/supplier/products/{id}` | Update product | ✅ Connected |
| DELETE | `/api/v1/supplier/products/{id}` | Delete product | ✅ Connected |
| POST | `/api/v1/supplier/products/import` | Import products | ✅ Connected |
| GET | `/api/v1/supplier/products/export` | Export products | ✅ Connected |
| PUT | `/api/v1/supplier/products/{id}/variants` | Update variants | ✅ Connected |

### Supplier AI
| Method | Endpoint | Description | Frontend Status |
|--------|----------|-------------|-----------------|
| POST | `/api/v1/supplier/ai/generate-description` | Generate description | ✅ Connected |
| POST | `/api/v1/supplier/ai/generate-variations` | Generate variations | ✅ Connected |
| POST | `/api/v1/supplier/ai/translate` | Translate | ✅ Connected |
| POST | `/api/v1/supplier/ai/improve` | Improve description | ✅ Connected |
| GET | `/api/v1/supplier/ai/stats` | AI usage stats | ✅ Connected |

### Supplier Marketing
| Method | Endpoint | Description | Frontend Status |
|--------|----------|-------------|-----------------|
| GET | `/api/v1/supplier/campaigns` | List campaigns | ✅ Connected |
| POST | `/api/v1/supplier/campaigns` | Create campaign | ✅ Connected |
| GET | `/api/v1/supplier/campaigns/{id}` | Campaign details | ✅ Connected |
| PUT | `/api/v1/supplier/campaigns/{id}` | Update campaign | ✅ Connected |
| PUT | `/api/v1/supplier/campaigns/{id}/toggle` | Toggle campaign | ✅ Connected |
| DELETE | `/api/v1/supplier/campaigns/{id}` | Delete campaign | ✅ Connected |
| GET | `/api/v1/supplier/campaigns/{id}/stats` | Campaign stats | ✅ Connected |
| GET | `/api/v1/supplier/advertising/balance` | Ad balance | ✅ Connected |
| POST | `/api/v1/supplier/advertising/deposit` | Deposit funds | ✅ Connected |

### Supplier Settings
| Method | Endpoint | Description | Frontend Status |
|--------|----------|-------------|-----------------|
| GET | `/api/v1/supplier/settings` | Get settings | ✅ Connected |
| GET | `/api/v1/supplier/settings/profile` | Profile settings | ✅ Connected |
| PUT | `/api/v1/supplier/settings/profile` | Update profile | ✅ Connected |
| GET | `/api/v1/supplier/settings/notifications` | Notification settings | ✅ Connected |
| PUT | `/api/v1/supplier/settings/notifications` | Update notifications | ✅ Connected |
| GET | `/api/v1/supplier/settings/billing` | Billing settings | ✅ Connected |
| GET | `/api/v1/supplier/settings/delivery` | Delivery settings | ✅ Connected |
| PUT | `/api/v1/supplier/settings/delivery` | Update delivery | ✅ Connected |
| GET | `/api/v1/supplier/settings/api` | API keys | ✅ Connected |
| POST | `/api/v1/supplier/settings/api/generate` | Generate API key | ✅ Connected |
| DELETE | `/api/v1/supplier/settings/api/{id}` | Delete API key | ✅ Connected |

---

## 🚚 DELIVERY (LIVREUR) ENDPOINTS (Role: delivery)

### Driver Authentication
| Method | Endpoint | Description | Frontend Status |
|--------|----------|-------------|-----------------|
| POST | `/api/v1/driver/login` | Driver login | ✅ Connected |
| POST | `/api/v1/driver/forgot-password` | Forgot password | ✅ Connected |
| POST | `/api/v1/driver/reset-password` | Reset password | ✅ Connected |
| POST | `/api/v1/driver/logout` | Logout | ✅ Connected |
| GET | `/api/v1/driver/me` | Current driver | ✅ Connected |

### Driver Activation
| Method | Endpoint | Description | Frontend Status |
|--------|----------|-------------|-----------------|
| GET | `/api/v1/driver/activate/{id}` | Activation view | ✅ Connected |
| POST | `/api/v1/driver/activate/{id}` | Activate account | ✅ Connected |

### Driver Deliveries
| Method | Endpoint | Description | Frontend Status |
|--------|----------|-------------|-----------------|
| GET | `/api/v1/driver/deliveries` | List deliveries | ✅ Connected |
| GET | `/api/v1/driver/deliveries/{id}` | Delivery details | ✅ Connected |
| POST | `/api/v1/driver/deliveries/{id}/accept` | Accept delivery | ✅ Connected |
| POST | `/api/v1/driver/deliveries/{id}/pickup` | Mark picked up | ✅ Connected |
| POST | `/api/v1/driver/deliveries/{id}/complete` | Complete delivery | ✅ Connected |
| POST | `/api/v1/driver/deliveries/{id}/fail` | Mark failed | ✅ Connected |
| POST | `/api/v1/driver/deliveries/bulk-update` | Bulk update | ✅ Connected |

### Driver Stats
| Method | Endpoint | Description | Frontend Status |
|--------|----------|-------------|-----------------|
| GET | `/api/v1/driver/stats` | Driver stats | ✅ Connected |
| GET | `/api/v1/driver/stats/weekly` | Weekly stats | ✅ Connected |

### Driver Profile
| Method | Endpoint | Description | Frontend Status |
|--------|----------|-------------|-----------------|
| GET | `/api/v1/driver/profile` | Get profile | ✅ Connected |
| PUT | `/api/v1/driver/profile` | Update profile | ✅ Connected |
| PUT | `/api/v1/driver/change-password` | Change password | ✅ Connected |

### Legacy Delivery API
| Method | Endpoint | Description | Frontend Status |
|--------|----------|-------------|-----------------|
| GET | `/api/delivery/orders` | List orders | ✅ Connected |
| POST | `/api/delivery/orders/{id}/accept` | Accept order | ✅ Connected |
| POST | `/api/delivery/orders/{id}/refuse` | Refuse order | ✅ Connected |
| POST | `/api/delivery/orders/{id}/delivered` | Mark delivered | ✅ Connected |

---

## 🛒 CLIENT ENDPOINTS (Role: client)

| Method | Endpoint | Description | Frontend Status |
|--------|----------|-------------|-----------------|
| GET | `/api/client/orders` | List orders | ✅ Connected |
| GET | `/api/client/orders/{id}` | Order details | ✅ Connected |
| POST | `/api/client/orders` | Create order | ✅ Connected |

---

## 📋 ROLE-BASED ACCESS CONTROL

| Role | Access Level | Allowed Endpoints |
|------|--------------|-------------------|
| `admin` | Full platform access | All `/api/v1/admin/*` and `/api/admin/*` |
| `supplier` | Own data only | `/api/v1/supplier/*` |
| `delivery` | Assigned deliveries only | `/api/v1/driver/*` |
| `client` | Own orders only | `/api/client/*` |

---

## 🔄 ERROR RESPONSES

### 401 Unauthorized
```json
{
  "message": "Unauthorized",
  "errors": {}
}
```

### 403 Forbidden
```json
{
  "message": "Access denied",
  "errors": {}
}
```

### 404 Not Found
```json
{
  "message": "Resource not found",
  "errors": {}
}
```

### 422 Validation Error
```json
{
  "message": "The given data was invalid.",
  "errors": {
    "field": ["Error message"]
  }
}
```

### 500 Server Error
```json
{
  "message": "Server error",
  "errors": {}
}
```

---

## 📝 INTEGRATION STATUS SUMMARY

| Category | Endpoints | Connected | Status |
|----------|-----------|-----------|--------|
| Public | ~20 | 20 | ✅ 100% |
| Authentication | 10 | 10 | ✅ 100% |
| Admin | 80+ | 80+ | ✅ 100% |
| Supplier | 40+ | 40+ | ✅ 100% |
| Delivery | 20+ | 20+ | ✅ 100% |
| Client | 5 | 5 | ✅ 100% |

**Overall Status: ✅ FULLY CONNECTED**
