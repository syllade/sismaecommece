# SISMA Laravel API Map (Routes + Contracts)

Source: `fashop-backend/routes/api.php` and V1 controllers.

## Response Contract
- Success: `{ success?: true, data?: any, message?: string, meta?: any }`
- Legacy endpoints can return raw object/array directly.
- Error: `{ success?: false, message: string, errors?: Record<string, string[]> }`

## Auth API
- `POST /api/auth/login` | BODY: `{ email|username, password }` | RESPONSE: `{ user, token, token_type, redirect_path }` | ROLE: `PUBLIC`
- `POST /api/auth/register` | BODY: `{ name, email, password, password_confirmation }` | RESPONSE: `{ user, token, token_type, redirect_path }` | ROLE: `PUBLIC`
- `GET /api/auth/activation/{token}` | BODY: none | RESPONSE: `{ valid, email, role }` | ROLE: `PUBLIC`
- `POST /api/auth/activate` | BODY: `{ token, password, password_confirmation }` | RESPONSE: `{ message, user, token, token_type, redirect_path }` | ROLE: `PUBLIC`
- `POST /api/login` | BODY: same as `/api/auth/login` | RESPONSE: same as `/api/auth/login` | ROLE: `PUBLIC`
- `GET /api/auth/me` | BODY: none | RESPONSE: `{ id, name, email, role, is_active, redirect_path }` | ROLE: `AUTH`
- `POST /api/auth/logout` | BODY: none | RESPONSE: `{ message }` | ROLE: `AUTH`
- `POST /api/auth/refresh` | BODY: none | RESPONSE: `{ token, token_type }` | ROLE: `AUTH`
- `GET /api/me` | BODY: none | RESPONSE: same as `/api/auth/me` | ROLE: `AUTH`
- `POST /api/logout` | BODY: none | RESPONSE: same as `/api/auth/logout` | ROLE: `AUTH`

## User/Client API
- `GET /api/client/orders` | BODY: none | RESPONSE: client orders list | ROLE: `CLIENT`
- `GET /api/client/orders/{id}` | BODY: none | RESPONSE: client order details | ROLE: `CLIENT`
- `POST /api/client/orders` | BODY: order payload | RESPONSE: created order | ROLE: `CLIENT`

## Products API
- `GET /api/products` | BODY: none | RESPONSE: public products list | ROLE: `PUBLIC`
- `GET /api/products/{slug}` | BODY: none | RESPONSE: public product details | ROLE: `PUBLIC`
- `GET /api/admin/products` | BODY: none | RESPONSE: admin products list | ROLE: `ADMIN`
- `POST /api/admin/products` | BODY: product payload | RESPONSE: created product | ROLE: `ADMIN`
- `GET /api/admin/products/{id}` | BODY: none | RESPONSE: product details | ROLE: `ADMIN`
- `PUT /api/admin/products/{id}` | BODY: partial product payload | RESPONSE: updated product | ROLE: `ADMIN`
- `DELETE /api/admin/products/{id}` | BODY: none | RESPONSE: delete status | ROLE: `ADMIN`
- `POST /api/admin/products/{id}/duplicate` | BODY: none | RESPONSE: duplicated product | ROLE: `ADMIN`
- `GET /api/supplier/products` | BODY: none | RESPONSE: supplier products list | ROLE: `SUPPLIER (legacy)`
- `POST /api/supplier/products` | BODY: product payload | RESPONSE: created product | ROLE: `SUPPLIER (legacy)`
- `GET /api/supplier/products/{id}` | BODY: none | RESPONSE: product detail | ROLE: `SUPPLIER (legacy)`
- `PATCH /api/supplier/products/{id}` | BODY: partial product | RESPONSE: updated product | ROLE: `SUPPLIER (legacy)`
- `DELETE /api/supplier/products/{id}` | BODY: none | RESPONSE: delete status | ROLE: `SUPPLIER (legacy)`
- `GET /api/v1/supplier/products` | BODY: none | RESPONSE: paginated supplier products | ROLE: `SUPPLIER`
- `POST /api/v1/supplier/products` | BODY: product payload | RESPONSE: created product | ROLE: `SUPPLIER`
- `GET /api/v1/supplier/products/{id}` | BODY: none | RESPONSE: product detail | ROLE: `SUPPLIER`
- `PUT /api/v1/supplier/products/{id}` | BODY: partial product | RESPONSE: updated product | ROLE: `SUPPLIER`
- `DELETE /api/v1/supplier/products/{id}` | BODY: none | RESPONSE: delete status | ROLE: `SUPPLIER`
- `POST /api/v1/supplier/products/import` | BODY: `FormData` CSV/XLS | RESPONSE: import status | ROLE: `SUPPLIER`
- `GET /api/v1/supplier/products/export` | BODY: none | RESPONSE: export file payload | ROLE: `SUPPLIER`
- `PUT /api/v1/supplier/products/{id}/variants` | BODY: variants payload | RESPONSE: update status | ROLE: `SUPPLIER`

## Orders API
- `POST /api/orders` | BODY: public order payload | RESPONSE: created order | ROLE: `PUBLIC`
- `GET /api/admin/orders` | BODY: none | RESPONSE: admin orders list | ROLE: `ADMIN`
- `GET /api/admin/orders/grouped` | BODY: none | RESPONSE: grouped orders | ROLE: `ADMIN`
- `POST /api/admin/orders/bulk-assign` | BODY: `{ order_ids, delivery_person_id }` | RESPONSE: bulk assign result | ROLE: `ADMIN`
- `GET /api/admin/orders/{id}` | BODY: none | RESPONSE: order details | ROLE: `ADMIN`
- `PUT /api/admin/orders/{id}/status` | BODY: `{ status }` | RESPONSE: updated order | ROLE: `ADMIN`
- `POST /api/admin/orders/{id}/whatsapp` | BODY: optional custom message | RESPONSE: whatsapp url/status | ROLE: `ADMIN`
- `POST /api/admin/orders/{id}/assign-delivery-person` | BODY: `{ delivery_person_id }` | RESPONSE: assign status | ROLE: `ADMIN`
- `POST /api/admin/orders/{id}/assign-delivery` | BODY: alias payload | RESPONSE: assign status | ROLE: `ADMIN`
- `POST /api/admin/orders/{id}/send-to-delivery-person` | BODY: `{ method }` | RESPONSE: send status | ROLE: `ADMIN`
- `POST /api/admin/orders/{id}/send-to-delivery` | BODY: alias payload | RESPONSE: send status | ROLE: `ADMIN`
- `DELETE /api/admin/orders/{id}` | BODY: none | RESPONSE: delete status | ROLE: `ADMIN`
- `GET /api/v1/admin/orders` | BODY: none | RESPONSE: filtered paginated orders | ROLE: `ADMIN`
- `GET /api/v1/admin/orders/{id}` | BODY: none | RESPONSE: order detail | ROLE: `ADMIN`
- `PUT /api/v1/admin/orders/{id}` | BODY: editable order fields | RESPONSE: update status | ROLE: `ADMIN`
- `PUT /api/v1/admin/orders/{id}/status` | BODY: `{ status: pending|preparee|expediee|livree|annulee }` | RESPONSE: update status | ROLE: `ADMIN`
- `POST /api/v1/admin/orders/{id}/assign-driver` | BODY: `{ driver_id }` | RESPONSE: assign status | ROLE: `ADMIN`
- `POST /api/v1/admin/orders/assign-driver` | BODY: `{ order_ids, driver_id }` | RESPONSE: bulk assign status | ROLE: `ADMIN`
- `GET /api/v1/admin/orders/grouped` | BODY: none | RESPONSE: grouped tours | ROLE: `ADMIN`
- `GET /api/v1/admin/orders/unprocessed` | BODY: none | RESPONSE: delayed orders | ROLE: `ADMIN`
- `DELETE /api/v1/admin/orders/{id}` | BODY: none | RESPONSE: cancel/delete status | ROLE: `ADMIN`
- `GET /api/supplier/orders` | BODY: none | RESPONSE: supplier orders list | ROLE: `SUPPLIER (legacy)`
- `POST /api/supplier/orders/{id}/status` | BODY: `{ status }` | RESPONSE: update status | ROLE: `SUPPLIER (legacy)`
- `POST /api/supplier/orders/bulk-status` | BODY: `{ order_ids, status }` | RESPONSE: bulk status | ROLE: `SUPPLIER (legacy)`
- `GET /api/v1/supplier/orders` | BODY: none | RESPONSE: supplier orders list | ROLE: `SUPPLIER`
- `GET /api/v1/supplier/orders/{id}` | BODY: none | RESPONSE: order detail | ROLE: `SUPPLIER`
- `PUT /api/v1/supplier/orders/{id}` | BODY: editable order fields | RESPONSE: update status | ROLE: `SUPPLIER`
- `PUT /api/v1/supplier/orders/{id}/status` | BODY: `{ status }` | RESPONSE: status update | ROLE: `SUPPLIER`
- `POST /api/v1/supplier/orders/manual` | BODY: manual order payload | RESPONSE: created order | ROLE: `SUPPLIER`
- `POST /api/v1/supplier/orders/bulk-status` | BODY: `{ order_ids, status }` | RESPONSE: bulk update | ROLE: `SUPPLIER`
- `GET /api/v1/supplier/orders/pending-count` | BODY: none | RESPONSE: `{ pending_count }` | ROLE: `SUPPLIER`
- `GET /api/v1/supplier/orders/{id}/notifications` | BODY: none | RESPONSE: notifications list | ROLE: `SUPPLIER`
- `POST /api/v1/supplier/orders/{id}/send-whatsapp` | BODY: optional payload | RESPONSE: send status | ROLE: `SUPPLIER`
- `POST /api/v1/supplier/orders/{id}/send-email` | BODY: optional payload | RESPONSE: send status | ROLE: `SUPPLIER`
- `GET /api/v1/supplier/orders/{id}/invoice-html` | BODY: none | RESPONSE: invoice html/pdf url | ROLE: `SUPPLIER`
- `GET /api/v1/supplier/orders/{id}/print` | BODY: none | RESPONSE: print view payload | ROLE: `SUPPLIER`

## Deliveries API
- `GET /api/delivery-fees/calculate` | BODY: none | RESPONSE: fee calculation | ROLE: `PUBLIC`
- `GET /api/delivery/confirm/{token}` | BODY: none | RESPONSE: delivery confirmation page/payload | ROLE: `PUBLIC`
- `GET /api/admin/delivery-persons` | BODY: none | RESPONSE: delivery persons list | ROLE: `ADMIN`
- `POST /api/admin/delivery-persons` | BODY: driver payload | RESPONSE: created driver | ROLE: `ADMIN`
- `GET /api/admin/delivery-persons/{id}/orders` | BODY: none | RESPONSE: orders assigned | ROLE: `ADMIN`
- `POST /api/admin/delivery-persons/{id}/send-daily-orders` | BODY: none | RESPONSE: send status | ROLE: `ADMIN`
- `PUT /api/admin/delivery-persons/{id}` | BODY: partial driver payload | RESPONSE: update status | ROLE: `ADMIN`
- `DELETE /api/admin/delivery-persons/{id}` | BODY: none | RESPONSE: delete status | ROLE: `ADMIN`
- `GET /api/delivery/orders` | BODY: none | RESPONSE: delivery orders | ROLE: `DELIVERY`
- `POST /api/delivery/orders/{id}/accept` | BODY: none | RESPONSE: accept status | ROLE: `DELIVERY`
- `POST /api/delivery/orders/{id}/refuse` | BODY: none | RESPONSE: refuse status | ROLE: `DELIVERY`
- `POST /api/delivery/orders/{id}/delivered` | BODY: proof payload | RESPONSE: delivered status | ROLE: `DELIVERY`
- `GET /api/orders/{id}/proof-photo` | BODY: none | RESPONSE: photo stream | ROLE: `ADMIN|SUPPLIER|DELIVERY|CLIENT`
- `GET /api/v1/admin/drivers` | BODY: none | RESPONSE: drivers list | ROLE: `ADMIN`
- `POST /api/v1/admin/drivers` | BODY: driver payload | RESPONSE: created driver | ROLE: `ADMIN`
- `GET /api/v1/admin/drivers/{id}` | BODY: none | RESPONSE: driver detail | ROLE: `ADMIN`
- `PUT /api/v1/admin/drivers/{id}` | BODY: partial driver payload | RESPONSE: updated driver | ROLE: `ADMIN`
- `POST /api/v1/admin/drivers/{id}/toggle-status` | BODY: none | RESPONSE: status toggled | ROLE: `ADMIN`
- `DELETE /api/v1/admin/drivers/{id}` | BODY: none | RESPONSE: delete status | ROLE: `ADMIN`
- `GET /api/v1/admin/drivers/zones` | BODY: none | RESPONSE: distinct zones | ROLE: `ADMIN`
- `POST /api/v1/admin/drivers/bulk-toggle` | BODY: `{ driver_ids, action }` | RESPONSE: bulk result | ROLE: `ADMIN`
- `GET /api/v1/admin/logistics/live` | BODY: none | RESPONSE: live logistics payload | ROLE: `ADMIN`
- `GET /api/v1/admin/logistics/zones` | BODY: none | RESPONSE: zone KPIs | ROLE: `ADMIN`
- `GET /api/v1/admin/logistics/alerts` | BODY: none | RESPONSE: logistics alerts | ROLE: `ADMIN`
- `GET /api/v1/admin/logistics/tours` | BODY: none | RESPONSE: grouped tours | ROLE: `ADMIN`
- `GET /api/v1/driver/activate/{id}` | BODY: none | RESPONSE: activation view | ROLE: `PUBLIC`
- `POST /api/v1/driver/activate/{id}` | BODY: activation payload | RESPONSE: activation status | ROLE: `PUBLIC`
- `POST /api/v1/driver/login` | BODY: credentials | RESPONSE: `{ token, driver }` | ROLE: `PUBLIC`
- `POST /api/v1/driver/forgot-password` | BODY: `{ email }` | RESPONSE: reset workflow status | ROLE: `PUBLIC`
- `POST /api/v1/driver/reset-password` | BODY: reset payload | RESPONSE: reset status | ROLE: `PUBLIC`
- `POST /api/v1/driver/logout` | BODY: none | RESPONSE: logout status | ROLE: `DELIVERY`
- `GET /api/v1/driver/me` | BODY: none | RESPONSE: current driver | ROLE: `DELIVERY`
- `GET /api/v1/driver/deliveries` | BODY: none | RESPONSE: deliveries list | ROLE: `DELIVERY`
- `GET /api/v1/driver/deliveries/{id}` | BODY: none | RESPONSE: delivery detail | ROLE: `DELIVERY`
- `POST /api/v1/driver/deliveries/{id}/accept` | BODY: none | RESPONSE: accept status | ROLE: `DELIVERY`
- `POST /api/v1/driver/deliveries/{id}/pickup` | BODY: none | RESPONSE: pickup status | ROLE: `DELIVERY`
- `POST /api/v1/driver/deliveries/{id}/complete` | BODY: proof payload | RESPONSE: completion status | ROLE: `DELIVERY`
- `POST /api/v1/driver/deliveries/{id}/fail` | BODY: failure reason payload | RESPONSE: failure status | ROLE: `DELIVERY`
- `POST /api/v1/driver/deliveries/bulk-update` | BODY: bulk status payload | RESPONSE: bulk update status | ROLE: `DELIVERY`
- `GET /api/v1/driver/stats` | BODY: none | RESPONSE: stats payload | ROLE: `DELIVERY`
- `GET /api/v1/driver/stats/weekly` | BODY: none | RESPONSE: weekly stats | ROLE: `DELIVERY`
- `GET /api/v1/driver/profile` | BODY: none | RESPONSE: profile payload | ROLE: `DELIVERY`
- `PUT /api/v1/driver/profile` | BODY: profile payload | RESPONSE: update status | ROLE: `DELIVERY`
- `PUT /api/v1/driver/change-password` | BODY: password payload | RESPONSE: update status | ROLE: `DELIVERY`

## Vendors API
- `POST /api/suppliers` | BODY: supplier signup payload | RESPONSE: registration status | ROLE: `PUBLIC`
- `POST /api/supplier/register` | BODY: full supplier registration payload | RESPONSE: onboarding status | ROLE: `PUBLIC`
- `GET /api/supplier/register/status/{token}` | BODY: none | RESPONSE: status payload | ROLE: `PUBLIC`
- `POST /api/supplier/resend-activation` | BODY: resend payload | RESPONSE: resend status | ROLE: `PUBLIC`
- `GET /api/supplier/requirements` | BODY: none | RESPONSE: required docs/fields | ROLE: `PUBLIC`
- `GET /api/suppliers` | BODY: none | RESPONSE: public supplier list | ROLE: `PUBLIC`
- `GET /api/suppliers/{slug}` | BODY: none | RESPONSE: supplier detail | ROLE: `PUBLIC`
- `GET /api/suppliers/{id}/products` | BODY: none | RESPONSE: supplier products | ROLE: `PUBLIC`
- `GET /api/admin/suppliers` | BODY: none | RESPONSE: suppliers list | ROLE: `ADMIN`
- `POST /api/admin/suppliers` | BODY: supplier payload | RESPONSE: created supplier | ROLE: `ADMIN`
- `POST /api/admin/suppliers/bulk-status` | BODY: `{ supplier_ids, is_active }` | RESPONSE: bulk status | ROLE: `ADMIN`
- `PUT /api/admin/suppliers/{id}` | BODY: partial supplier payload | RESPONSE: update status | ROLE: `ADMIN`
- `DELETE /api/admin/suppliers/{id}` | BODY: none | RESPONSE: delete status | ROLE: `ADMIN`
- `GET /api/v1/admin/suppliers` | BODY: none | RESPONSE: filtered suppliers list | ROLE: `ADMIN`
- `POST /api/v1/admin/suppliers` | BODY: supplier payload | RESPONSE: created supplier + invitation | ROLE: `ADMIN`
- `GET /api/v1/admin/suppliers/{id}` | BODY: none | RESPONSE: supplier details | ROLE: `ADMIN`
- `PUT /api/v1/admin/suppliers/{id}` | BODY: partial supplier payload | RESPONSE: update status | ROLE: `ADMIN`
- `DELETE /api/v1/admin/suppliers/{id}` | BODY: none | RESPONSE: delete status | ROLE: `ADMIN`
- `POST /api/v1/admin/suppliers/{id}/block` | BODY: none | RESPONSE: toggled status | ROLE: `ADMIN`
- `POST /api/v1/admin/suppliers/{id}/reset-password` | BODY: none | RESPONSE: reset url | ROLE: `ADMIN`
- `POST /api/v1/admin/suppliers/invite` | BODY: `{ name, email, phone? }` | RESPONSE: invitation payload | ROLE: `ADMIN`
- `POST /api/v1/admin/suppliers/bulk-action` | BODY: `{ supplier_ids, action }` | RESPONSE: bulk result | ROLE: `ADMIN`
- `GET /api/v1/admin/suppliers-overview` | BODY: none | RESPONSE: supplier overview | ROLE: `ADMIN`
- `GET /api/v1/admin/suppliers/{id}/activity` | BODY: none | RESPONSE: activity feed | ROLE: `ADMIN`
- `GET /api/v1/admin/suppliers/{id}/ai-usage` | BODY: none | RESPONSE: ai usage metrics | ROLE: `ADMIN`
- `GET /api/v1/admin/suppliers/{id}/campaign-clicks` | BODY: none | RESPONSE: campaign metrics | ROLE: `ADMIN`
- `GET /api/v1/admin/suppliers/{id}/metrics` | BODY: none | RESPONSE: supplier metrics | ROLE: `ADMIN`
- `GET /api/v1/admin/suppliers/{id}/export` | BODY: none | RESPONSE: export payload/file | ROLE: `ADMIN`
- `GET /api/v1/admin/suppliers/threshold-alert` | BODY: none | RESPONSE: threshold alerts | ROLE: `ADMIN`

## Marketing API
- `GET /api/v1/admin/campaigns` | BODY: none | RESPONSE: campaigns list + pagination | ROLE: `ADMIN`
- `POST /api/v1/admin/campaigns` | BODY: `{ product_id, product_name, supplier_id, supplier_name, budget, cpc }` | RESPONSE: created campaign | ROLE: `ADMIN`
- `GET /api/v1/admin/campaigns/{id}` | BODY: none | RESPONSE: campaign detail + ctr/acos | ROLE: `ADMIN`
- `PUT /api/v1/admin/campaigns/{id}` | BODY: editable campaign fields | RESPONSE: update status | ROLE: `ADMIN`
- `PUT /api/v1/admin/campaigns/{id}/approve` | BODY: none | RESPONSE: approval status | ROLE: `ADMIN`
- `PUT /api/v1/admin/campaigns/{id}/reject` | BODY: `{ reason }` | RESPONSE: rejection status | ROLE: `ADMIN`
- `DELETE /api/v1/admin/campaigns/{id}` | BODY: none | RESPONSE: delete status | ROLE: `ADMIN`
- `GET /api/v1/admin/campaigns/{id}/stats` | BODY: none | RESPONSE: detailed campaign KPIs | ROLE: `ADMIN`
- `GET /api/v1/supplier/campaigns` | BODY: none | RESPONSE: supplier campaigns list | ROLE: `SUPPLIER`
- `POST /api/v1/supplier/campaigns` | BODY: campaign payload | RESPONSE: created campaign | ROLE: `SUPPLIER`
- `GET /api/v1/supplier/campaigns/{id}` | BODY: none | RESPONSE: campaign detail | ROLE: `SUPPLIER`
- `PUT /api/v1/supplier/campaigns/{id}` | BODY: partial campaign | RESPONSE: update status | ROLE: `SUPPLIER`
- `PUT /api/v1/supplier/campaigns/{id}/toggle` | BODY: none | RESPONSE: toggled status | ROLE: `SUPPLIER`
- `DELETE /api/v1/supplier/campaigns/{id}` | BODY: none | RESPONSE: delete status | ROLE: `SUPPLIER`
- `GET /api/v1/supplier/campaigns/{id}/stats` | BODY: none | RESPONSE: campaign stats | ROLE: `SUPPLIER`
- `GET /api/v1/supplier/advertising/balance` | BODY: none | RESPONSE: ad balance payload | ROLE: `SUPPLIER`
- `POST /api/v1/supplier/advertising/deposit` | BODY: `{ amount }` | RESPONSE: deposit status | ROLE: `SUPPLIER`

## Statistics API
- `GET /api/admin/analytics/dashboard` | BODY: none | RESPONSE: dashboard KPIs | ROLE: `ADMIN`
- `GET /api/admin/analytics/sales` | BODY: none | RESPONSE: sales series | ROLE: `ADMIN`
- `GET /api/admin/analytics/category-sales` | BODY: none | RESPONSE: category sales | ROLE: `ADMIN`
- `GET /api/admin/analytics/top-products` | BODY: none | RESPONSE: top products | ROLE: `ADMIN`
- `GET /api/admin/analytics/orders-by-status` | BODY: none | RESPONSE: statuses distribution | ROLE: `ADMIN`
- `GET /api/admin/analytics/delivery-persons` | BODY: none | RESPONSE: delivery persons stats | ROLE: `ADMIN`
- `GET /api/v1/admin/stats` | BODY: none | RESPONSE: full dashboard payload | ROLE: `ADMIN`
- `GET /api/v1/admin/stats/kpis` | BODY: none | RESPONSE: lightweight KPIs | ROLE: `ADMIN`
- `GET /api/v1/admin/reports/orders` | BODY: none | RESPONSE: orders report by day | ROLE: `ADMIN`
- `GET /api/v1/admin/reports/suppliers` | BODY: none | RESPONSE: suppliers report | ROLE: `ADMIN`
- `GET /api/v1/admin/reports/deliveries` | BODY: none | RESPONSE: deliveries report | ROLE: `ADMIN`
- `GET /api/v1/admin/reports/top-products` | BODY: none | RESPONSE: top products report | ROLE: `ADMIN`
- `GET /api/v1/admin/reports/export/csv` | BODY: none | RESPONSE: CSV file stream | ROLE: `ADMIN`
- `GET /api/v1/admin/reports/export/pdf` | BODY: none | RESPONSE: PDF file stream | ROLE: `ADMIN`

## Notifications API
- `GET /api/testimonials` | BODY: none | RESPONSE: public testimonials | ROLE: `PUBLIC`
- `GET /api/admin/testimonials` | BODY: none | RESPONSE: testimonials list | ROLE: `ADMIN`
- `POST /api/admin/testimonials` | BODY: testimonial payload | RESPONSE: created testimonial | ROLE: `ADMIN`
- `PUT /api/admin/testimonials/{id}` | BODY: testimonial payload | RESPONSE: update status | ROLE: `ADMIN`
- `DELETE /api/admin/testimonials/{id}` | BODY: none | RESPONSE: delete status | ROLE: `ADMIN`
- `GET /api/v1/admin/notifications` | BODY: none | RESPONSE: notifications + unread count | ROLE: `ADMIN`
- `GET /api/v1/admin/notifications/unread-count` | BODY: none | RESPONSE: `{ count }` | ROLE: `ADMIN`
- `GET /api/v1/admin/notifications/stats` | BODY: none | RESPONSE: notification stats | ROLE: `ADMIN`
- `PUT /api/v1/admin/notifications/{id}/read` | BODY: none | RESPONSE: mark-read status | ROLE: `ADMIN`
- `PUT /api/v1/admin/notifications/read-all` | BODY: none | RESPONSE: mark-all-read status | ROLE: `ADMIN`
- `DELETE /api/v1/admin/notifications/{id}` | BODY: none | RESPONSE: delete status | ROLE: `ADMIN`

## Settings API
- `GET /api/settings` | BODY: none | RESPONSE: public settings | ROLE: `PUBLIC`
- `GET /api/settings/{key}` | BODY: none | RESPONSE: setting value | ROLE: `PUBLIC`
- `GET /api/landing` | BODY: none | RESPONSE: landing settings | ROLE: `PUBLIC`
- `PUT /api/admin/settings` | BODY: settings payload | RESPONSE: update status | ROLE: `ADMIN`
- `PUT /api/admin/settings/bulk` | BODY: bulk settings payload | RESPONSE: update status | ROLE: `ADMIN`
- `GET /api/admin/settings/{key}` | BODY: none | RESPONSE: setting value | ROLE: `ADMIN`
- `GET /api/v1/admin/settings` | BODY: none | RESPONSE: all settings key/value | ROLE: `ADMIN`
- `PUT /api/v1/admin/settings` | BODY: key/value object | RESPONSE: update status | ROLE: `ADMIN`
- `GET /api/v1/admin/settings/landing` | BODY: none | RESPONSE: landing settings | ROLE: `ADMIN`
- `PUT /api/v1/admin/settings/landing` | BODY: landing payload | RESPONSE: update status | ROLE: `ADMIN`
- `GET /api/v1/admin/settings/commissions` | BODY: none | RESPONSE: global + supplier commissions | ROLE: `ADMIN`
- `PUT /api/v1/admin/settings/commissions/global` | BODY: `{ rate }` | RESPONSE: update status | ROLE: `ADMIN`
- `PUT /api/v1/admin/settings/commissions/supplier` | BODY: `{ supplier_id, rate }` | RESPONSE: update status | ROLE: `ADMIN`
- `GET /api/v1/admin/settings/categories` | BODY: none | RESPONSE: categories list | ROLE: `ADMIN`
- `POST /api/v1/admin/settings/categories` | BODY: category payload | RESPONSE: created category id | ROLE: `ADMIN`
- `PUT /api/v1/admin/settings/categories/{id}` | BODY: category payload | RESPONSE: update status | ROLE: `ADMIN`
- `DELETE /api/v1/admin/settings/categories/{id}` | BODY: none | RESPONSE: delete status | ROLE: `ADMIN`
- `PUT /api/v1/admin/settings/categories/reorder` | BODY: `{ categories: [{id,order}] }` | RESPONSE: reorder status | ROLE: `ADMIN`
- `GET /api/v1/admin/settings/delivery-zones` | BODY: none | RESPONSE: zones list | ROLE: `ADMIN`
- `POST /api/v1/admin/settings/delivery-zones` | BODY: `{ name, price, estimated_time? }` | RESPONSE: created id | ROLE: `ADMIN`
- `PUT /api/v1/admin/settings/delivery-zones/{id}` | BODY: partial zone payload | RESPONSE: update status | ROLE: `ADMIN`
- `DELETE /api/v1/admin/settings/delivery-zones/{id}` | BODY: none | RESPONSE: delete status | ROLE: `ADMIN`
- `GET /api/v1/admin/settings/notifications` | BODY: none | RESPONSE: notification templates | ROLE: `ADMIN`
- `PUT /api/v1/admin/settings/notifications/{id}` | BODY: template payload | RESPONSE: update status | ROLE: `ADMIN`
- `GET /api/v1/supplier/settings` | BODY: none | RESPONSE: supplier settings | ROLE: `SUPPLIER`
- `GET /api/v1/supplier/settings/profile` | BODY: none | RESPONSE: supplier profile settings | ROLE: `SUPPLIER`
- `PUT /api/v1/supplier/settings/profile` | BODY: profile payload | RESPONSE: update status | ROLE: `SUPPLIER`
- `GET /api/v1/supplier/settings/notifications` | BODY: none | RESPONSE: notification settings | ROLE: `SUPPLIER`
- `PUT /api/v1/supplier/settings/notifications` | BODY: notification payload | RESPONSE: update status | ROLE: `SUPPLIER`
- `GET /api/v1/supplier/settings/billing` | BODY: none | RESPONSE: billing settings | ROLE: `SUPPLIER`
- `GET /api/v1/supplier/settings/delivery` | BODY: none | RESPONSE: delivery settings | ROLE: `SUPPLIER`
- `PUT /api/v1/supplier/settings/delivery` | BODY: delivery payload | RESPONSE: update status | ROLE: `SUPPLIER`
- `GET /api/v1/supplier/settings/api` | BODY: none | RESPONSE: api keys list | ROLE: `SUPPLIER`
- `POST /api/v1/supplier/settings/api/generate` | BODY: key payload | RESPONSE: new key | ROLE: `SUPPLIER`
- `DELETE /api/v1/supplier/settings/api/{id}` | BODY: none | RESPONSE: delete status | ROLE: `SUPPLIER`

## AI API
- `POST /api/v1/supplier/ai/generate-description` | BODY: generation payload | RESPONSE: generated description | ROLE: `SUPPLIER`
- `POST /api/v1/supplier/ai/generate-variations` | BODY: generation payload | RESPONSE: generated variants | ROLE: `SUPPLIER`
- `POST /api/v1/supplier/ai/translate` | BODY: translation payload | RESPONSE: translated text | ROLE: `SUPPLIER`
- `POST /api/v1/supplier/ai/improve` | BODY: improvement payload | RESPONSE: improved description | ROLE: `SUPPLIER`
- `GET /api/v1/supplier/ai/stats` | BODY: none | RESPONSE: ai usage stats | ROLE: `SUPPLIER`

## Risk API
- `GET /api/v1/admin/risk/dashboard` | BODY: none | RESPONSE: risk dashboard | ROLE: `ADMIN`
- `GET /api/v1/admin/risk/clients` | BODY: none | RESPONSE: at-risk clients list | ROLE: `ADMIN`
- `GET /api/v1/admin/risk/suppliers` | BODY: none | RESPONSE: at-risk suppliers list | ROLE: `ADMIN`
- `POST /api/v1/admin/risk/clients/{id}/ban` | BODY: `{ reason }` | RESPONSE: ban status | ROLE: `ADMIN`
- `POST /api/v1/admin/risk/clients/{id}/suspend` | BODY: `{ reason }` | RESPONSE: suspend/toggle status | ROLE: `ADMIN`
- `POST /api/v1/admin/risk/suppliers/{id}/suspend` | BODY: `{ reason, permanent? }` | RESPONSE: suspend status | ROLE: `ADMIN`
- `GET /api/v1/admin/risk/security-events` | BODY: none | RESPONSE: security events list | ROLE: `ADMIN`
- `GET /api/v1/admin/risk/blacklist` | BODY: none | RESPONSE: blacklist entries | ROLE: `ADMIN`
- `POST /api/v1/admin/risk/blacklist/add` | BODY: `{ type, value, reason }` | RESPONSE: add status | ROLE: `ADMIN`

## Invoices API
- `GET /api/admin/invoices` | BODY: none | RESPONSE: invoices list | ROLE: `ADMIN`
- `GET /api/admin/invoices/{id}` | BODY: none | RESPONSE: invoice detail | ROLE: `ADMIN`
- `PUT /api/admin/invoices/{id}/status` | BODY: `{ status }` | RESPONSE: update status | ROLE: `ADMIN`
- `GET /api/admin/delivery-fees` | BODY: none | RESPONSE: fees list | ROLE: `ADMIN`
- `POST /api/admin/delivery-fees` | BODY: fee payload | RESPONSE: create status | ROLE: `ADMIN`

