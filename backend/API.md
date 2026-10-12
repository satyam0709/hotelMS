# HotelMS Backend API Reference

Base URL (local): `http://localhost:5000`

Import Postman collection: [`postman.json`](./postman.json)  
Regenerate collection: `node scripts/generate-postman.js`

---

## Conventions

| Item | Detail |
|------|--------|
| Content type | `application/json` |
| Success | `{ "success": true, "data": … }` |
| Error | `{ "success": false, "message": "…", "errorCode": "…" }` |
| Auth (admin) | HttpOnly cookie (default name `hotel_admin_access`) set by `POST /api/admin/auth/login` |
| Permissions | Admin routes require cookie **and** a permission key (e.g. `bookings.read`). Super-admin bypasses checks. |
| IDs | CUID strings |
| Dates | `YYYY-MM-DD` for stay/date filters |
| List query | Common: `page`, `limit`, `search` (or `q`) |

---

## 0. Health

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/health` | No | Liveness: `{ status: "ok" }` |

---

## 1. Admin Auth (`/api/admin/auth`)

Rate limit: **10 requests / 15 minutes**.

| Method | Path | Auth | Permission | Body / query | Description |
|--------|------|------|------------|--------------|-------------|
| POST | `/login` | No | — | `{ email, password }` | Sets cookie; returns admin profile |
| POST | `/logout` | Cookie | — | — | Clears cookie |
| GET | `/me` | Cookie | — | — | Current admin, roles, permissions |
| POST | `/forgot-password` | No | — | `{ email }` | Sends reset email (if SMTP configured) |
| POST | `/reset-password` | No | — | `{ token, password }` | Completes password reset (`token` is 64 hex chars; `password` min 12) |
| PATCH | `/password` | Cookie | — | `{ currentPassword, newPassword }` | Signed-in admin changes password (`newPassword` min 12) |

---

## 2. Public Content (`/api`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/settings` | Public website settings |
| GET | `/navigation` | Header + footer menu items |
| GET | `/pages/:slug` | Published CMS page + sections |
| GET | `/banners` | Active banners / offers |
| GET | `/packages` | Active packages (`?featured=true`) |
| GET | `/packages/:slug` | Package detail |
| GET | `/gallery` | Public gallery categories + items |
| GET | `/policies/:slug` | Published policy |
| GET | `/facilities` | Active facilities (`page`, `limit`, `category`) |
| GET | `/facilities/:slug` | Facility detail |
| GET | `/restaurant` | Restaurant profile + menu |
| GET | `/events` | Active event venues |
| GET | `/events/:slug` | Event venue detail |
| GET | `/attractions` | Nearby attractions |
| GET | `/attractions/:slug` | Attraction detail |
| GET | `/faqs` | FAQ categories + questions |
| GET | `/testimonials` | Approved testimonials |
| GET | `/blogs` | Published blog posts (`limit`) |
| GET | `/blogs/:slug` | Blog post detail |
| POST | `/newsletter/subscribe` | Body: `{ email }` |
| POST | `/inquiries` | Body: `{ type, name, email?, phone?, subject?, message, … }` — email **or** phone required. `type`: `CONTACT` \| `BOOKING` \| `PACKAGE` \| `EVENT` \| `RESTAURANT` \| `GENERAL` |

---

## 3. Public Accommodation (`/api`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/room-categories` | Public room categories |
| GET | `/room-categories/:slug` | Category detail |
| GET | `/amenities` | Amenities list |
| GET | `/rooms` | Rooms (`isFeatured`, pagination, filters) |
| GET | `/rooms/:slug` | Room detail |

---

## 4. Availability & Guest Booking (`/api`)

| Method | Path | Body / query | Description |
|--------|------|--------------|-------------|
| GET | `/availability` | `checkIn`, `checkOut`, `adults`, `children`, `rooms` | Search available inventory |
| POST | `/bookings` | See below | Create guest booking |
| GET | `/bookings/:bookingRef` | `email` **and** `phone` (required) | Guest lookup |
| GET | `/bookings/:bookingRef/invoice` | `email` **and** `phone` (required) | Guest invoice |
| POST | `/bookings/:bookingRef/cancel-request` | `{ email, phone, reason? }` | Guest cancel: unpaid `PENDING` / `PENDING_PAYMENT` cancels immediately; **paid/confirmed** opens a staff cancel-request inquiry (no inventory release until admin cancels) |

### Create booking body

```json
{
  "checkIn": "2026-11-01",
  "checkOut": "2026-11-03",
  "guest": {
    "fullName": "Guest Name",
    "email": "guest@example.com",
    "phone": "+911234567890",
    "notes": null
  },
  "rooms": [
    { "roomId": "cuid", "quantity": 1, "adults": 2, "children": 0, "extraBeds": 0 }
  ],
  "specialRequests": null,
  "paymentMethod": "PAY_AT_HOTEL",
  "couponCode": "OPTIONAL"
}
```

`paymentMethod`: `PAY_AT_HOTEL` | `ONLINE`  
Stay: max 30 nights; check-in must be today or future (public).  
Guest `email` and `phone` are both required (lookup / cancel / pay use the same dual-factor identity).

Public booking/payment/inquiry/availability endpoints are **rate-limited**.

---

## 5. Public Payments (`/api`)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/payments/razorpay/order` | Body: `{ bookingRef, email, phone }` — create or reuse PENDING Razorpay order |
| POST | `/payments/razorpay/verify` | Body: `{ bookingRef, email, phone, razorpayOrderId, razorpayPaymentId, razorpaySignature }` |
| POST | `/payments/razorpay/webhook` | Razorpay webhook (**raw body Buffer only** + signature; events are idempotent by `event.id`) |

---

## 6. Admin Users / Roles / Permissions (`/api/admin`)

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/permissions` | `roles.read` | Flat list of permission keys grouped by `module` / `action` |
| GET | `/roles` | `roles.read` | List roles + permissions |
| POST | `/roles` | `roles.create` | `{ name, slug, description?, permissionIds: [] }` |
| PATCH | `/roles/:id` | `roles.update` | Partial role update, including `permissionIds` |
| DELETE | `/roles/:id` | `roles.delete` | Soft-delete non-system role not assigned to users |
| GET | `/users` | `users.read` | List admin users (`page`, `limit`, `search`, `status`) |
| POST | `/users` | `users.create` | `{ name, email, username, password, status, roleIds }` |
| PATCH | `/users/:id` | `users.update` | Partial user update; optional password reset and role assignment |
| DELETE | `/users/:id` | `users.delete` | Soft-delete user (cannot delete yourself) |

---

## 7. Admin Activity (`/api/admin`)

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/activity` | `activity.read` | Audit log (`page`, `limit`, `module`, `action`, `entityType`, `userId`, `from`, `to`, `search`) |

---

## 8. Admin Settings & Navigation (`/api/admin`)

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/settings` | `settings.read` | Full settings |
| PATCH | `/settings` | `settings.update` | Partial update |
| GET | `/navigation` | `navigation.read` | List (`location=HEADER\|FOOTER`) |
| POST | `/navigation` | `navigation.create` | `{ label, href, location, displayOrder?, isActive? }` |
| PATCH | `/navigation/reorder` | `navigation.update` | `{ items: [{ id, displayOrder }] }` |
| PATCH | `/navigation/:id` | `navigation.update` | Update item |
| DELETE | `/navigation/:id` | `navigation.delete` | Soft-delete |

---

## 7. Admin CMS Pages (`/api/admin`)

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/pages` | `pages.read` | List |
| POST | `/pages` | `pages.create` | `{ title, slug, … }` |
| GET | `/pages/:id` | `pages.read` | Detail + sections |
| PATCH | `/pages/:id` | `pages.update` | Update meta |
| PATCH | `/pages/:id/publish` | `pages.update` | Set PUBLISHED |
| PATCH | `/pages/:id/sections` | `sections.update` | `{ sections: […] }` |
| DELETE | `/pages/:id` | `pages.delete` | Soft-delete |

---

## 8. Admin Banners / Packages / Gallery / Media / Policies

### Banners — permission prefix `banners.*`

| Method | Path | Notes |
|--------|------|-------|
| GET/POST | `/banners` | List / create (`title` required) |
| GET/PATCH/DELETE | `/banners/:id` | CRUD |
| PATCH | `/banners/reorder` | Reorder |

Fields: `title`, `subtitle`, `ctaText`, `ctaLink`, `desktopMediaId`, `mobileMediaId`, `videoMediaId`, dates, `displayOrder`, `isActive`

### Packages — `packages.*`

| Method | Path |
|--------|------|
| GET/POST | `/packages` |
| GET/PATCH/DELETE | `/packages/:id` |
| PATCH | `/packages/reorder` |

### Gallery — `gallery.*`

| Method | Path |
|--------|------|
| GET/POST/PATCH/DELETE | `/gallery/categories`, `/gallery/categories/:id` |
| PATCH | `/gallery/categories/reorder` |
| GET/POST/PATCH/DELETE | `/gallery/items`, `/gallery/items/:id` |
| PATCH | `/gallery/items/reorder` |

Create item requires `categoryId` + `mediaId`.

### Media — `media.*`

| Method | Path | Auth / body | Description |
|--------|------|-------------|-------------|
| GET | `/media` | Cookie + `media.read` | List assets (`page`, `limit`, `search`) |
| POST | `/media/register` | Cookie + `media.upload` · JSON `{ url, altText?, caption?, folder?, category?, resourceType? }` | Register an external URL (no Cloudinary) |
| POST | `/media/upload` | Cookie + `media.upload` · **multipart** field `file` (+ optional `altText`, `caption`, `folder`, `category`) | Upload to Cloudinary and create `MediaAsset` |
| DELETE | `/media/:id` | Cookie + `media.delete` | Soft-delete asset |

**Upload requirements**

- Env: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` (optional `CLOUDINARY_FOLDER`, default `hotelms`)
- Allowed types: JPEG, PNG, WebP, GIF, AVIF, MP4, WebM, QuickTime
- Max size: **15 MB**
- Without Cloudinary credentials, `/media/upload` returns `503 CLOUDINARY_NOT_CONFIGURED` (URL register still works)

### Policies — `policies.*`

| Method | Path |
|--------|------|
| GET/POST | `/policies` |
| PATCH/DELETE | `/policies/:id` |

Create requires `type`, `title`, `slug`, `content`. Note: `type` is unique.

---

## 9. Admin Facilities / Events / Attractions / Restaurant

| Resource | Base path | Permission | Create requires |
|----------|-----------|------------|-----------------|
| Facilities | `/facilities` | `facilities.*` | `name`, `slug` |
| Events | `/events` | `events.*` | `name`, `slug` |
| Attractions | `/attractions` | `attractions.*` | `name`, `slug` |

Restaurant (`restaurant.*`):

| Method | Path | Description |
|--------|------|-------------|
| GET | `/restaurant` | Profile + categories/items |
| PATCH | `/restaurant` | Upsert profile (`name`+`slug` needed on first create) |
| GET/POST | `/restaurant/menu-categories` | Menu categories |
| PATCH/DELETE | `/restaurant/menu-categories/:id` | |
| GET/POST | `/restaurant/menu-items` | Menu items (`categoryId`, `name`) |
| PATCH/DELETE | `/restaurant/menu-items/:id` | |

---

## 10. Admin FAQs / Testimonials / Blogs

### FAQs — `faqs.*`

| Path | Notes |
|------|-------|
| `/faq/categories` | CRUD + reorder |
| `/faqs` | CRUD + reorder; create needs `categoryId`, `question`, `answer` |

### Testimonials — `testimonials.*`

| Path | Notes |
|------|-------|
| `/testimonials` | CRUD + reorder |
| `/testimonials/:id/approval` | `{ approvalStatus: PENDING\|APPROVED\|REJECTED }` — needs `testimonials.approve` |

### Blogs — `blogs.*`

| Method | Path | Permission | Notes |
|--------|------|------------|-------|
| GET | `/blogs` | `blogs.read` | List |
| POST | `/blogs` | `blogs.create` | `title`, `slug`, `content` |
| GET | `/blogs/:id` | `blogs.read` | Detail |
| PATCH | `/blogs/:id` | `blogs.update` | Update |
| PATCH | `/blogs/:id/publish` | `blogs.publish` | Sets PUBLISHED + `publishedAt` |
| DELETE | `/blogs/:id` | `blogs.delete` | Soft-delete |

---

## 11. Admin Inquiries & Newsletter

| Method | Path | Permission | Body |
|--------|------|------------|------|
| GET | `/inquiries` | `inquiries.read` | List |
| GET | `/inquiries/:id` | `inquiries.read` | Detail |
| PATCH | `/inquiries/:id` | `inquiries.update` | `status?`, `adminRemarks?`, `followUpDate?` |
| PATCH | `/inquiries/:id/status` | `inquiries.update` | `{ status }` — `NEW` \| `IN_PROGRESS` \| `CONTACTED` \| `CONVERTED` \| `CLOSED` |
| PATCH | `/inquiries/:id/assign` | `inquiries.assign` | `{ assignedToId }` (nullable) |
| GET | `/newsletter` | `newsletter.read` | Subscribers (`page`, `limit`, `status`, `search` email) |
| PATCH | `/newsletter/:id` | `newsletter.update` | `{ status: SUBSCRIBED\|UNSUBSCRIBED }` |

---

## 12. Admin Rooms (`/api/admin`)

Permissions: `room_categories.*`, `amenities.*`, `rooms.*`

| Method | Path | Description |
|--------|------|-------------|
| CRUD | `/room-categories` | Categories + reorder |
| CRUD | `/amenities` | Amenities + reorder |
| GET/POST | `/rooms` | List / create room |
| GET/PATCH/DELETE | `/rooms/:id` | Room CRUD |
| PUT | `/rooms/:id/amenities` | `{ amenityIds: [] }` |
| PUT | `/rooms/:id/media` | `{ media: [{ mediaId, usage, displayOrder }] }` |
| PATCH | `/rooms/:id/status` | Activate / deactivate |
| GET/PUT | `/rooms/:roomId/availability` | Calendar inventory |
| GET/POST | `/rooms/:roomId/blocks` | Blocks |
| PATCH/DELETE | `/rooms/:roomId/blocks/:id` | |
| GET/POST | `/rooms/:roomId/rates` | Seasonal rates |
| PATCH/DELETE | `/rooms/:roomId/rates/:id` | |

---

## 13. Admin Bookings (`/api/admin`)

Permission: `bookings.*`

| Method | Path | Query / body | Description |
|--------|------|--------------|-------------|
| GET | `/bookings` | `page`, `limit`, `search`, `status`, `paymentStatus`, `checkInFrom`, `checkInTo`, `checkOutFrom`, `checkOutTo`, `guestId` | List |
| POST | `/bookings` | Same as public + `confirmImmediately?` | Desk booking |
| GET | `/bookings/:id` | — | Detail |
| PATCH | `/bookings/:id/status` | `{ status, note? }` | Status change |
| POST | `/bookings/:id/cancel` | `{ reason? }` | Cancel (`bookings.cancel`) |
| GET | `/bookings/:id/invoice` | — | Admin invoice (`bookings.read`) |

Booking statuses: `PENDING`, `PENDING_PAYMENT`, `CONFIRMED`, `CHECKED_IN`, `CHECKED_OUT`, `CANCELLED`, `NO_SHOW`, `REFUNDED`, `EXPIRED`

---

## 14. Admin Payments (`/api/admin`)

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/payments` | `payments.read` | List (`page`, `limit`, `status`, `bookingId`, `search` by booking ref / provider ids) |
| GET | `/payments/:id` | `payments.read` | Detail + refund history |
| POST | `/payments/:id/refund` | `payments.refund` | `{ amount?, reason? }` — omit `amount` for full remaining balance |

---

## 15. Admin Reports (`/api/admin`)

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/reports/overview` | `reports.read` | Date range overview (`from`, `to`) for bookings, arrivals/departures, occupancy series, revenue series, refunds, inquiries, and newsletter subscribers |
| GET | `/reports/export` | `reports.export` | CSV download (`type=bookings\|bookings-stay\|payments\|inquiries\|summary`, `from`, `to`). `bookings` filters by created date; `bookings-stay` by stay overlap. Detail exports capped at 5,000 rows. |

---

## 16. Admin Guests (`/api/admin`)

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/guests` | `guests.read` | List/search (`page`, `limit`, `search`, `guestType`) |
| GET | `/guests/:id` | `guests.read` | Guest detail + recent bookings |
| PATCH | `/guests/:id` | `guests.update` | Update profile (`fullName`, `email`, `phone`, `guestType`, `notes`) |
| DELETE | `/guests/:id` | `guests.delete` | Soft-delete only when guest has zero bookings |

Guests are created automatically from public/desk bookings.

---

## 17. Admin Coupons & Tax Rates (`/api/admin`)

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| CRUD | `/coupons` | `coupons.*` | Promo codes for booking `couponCode` |
| CRUD | `/tax-rates` | `tax_rates.*` | Tax percentages assignable to rooms via `taxRateId` |

---

## 18. Admin Notifications (`/api/admin`)

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/notifications/settings` | `notifications.read` | SMTP + alert toggles including `checkInReminderEnabled` (password never returned; `hasSmtpPassword` flag only) |
| PATCH | `/notifications/settings` | `notifications.update` | Update SMTP/admin email/toggles (`bookingEnabled`, `inquiryEnabled`, `cancellationEnabled`, `checkInReminderEnabled`). Send `smtpPassword` to set, or `clearSmtpPassword: true` to remove. Password stored encrypted. |
| GET | `/notifications/logs` | `notifications.read` | Recent email delivery log (`page`, `limit`, `status`) |
| GET | `/notifications/templates` | `notifications.read` | List email templates (defaults auto-seeded) |
| GET | `/notifications/templates/:id` | `notifications.read` | Template detail |
| PATCH | `/notifications/templates/:id` | `notifications.update` | Update subject/body/isActive (`{{variable}}` placeholders) |

Runtime email delivery prefers DB notification settings + active templates, then falls back to env SMTP / code templates.

Website settings also include `onlinePaymentEnabled`, `payAtHotelEnabled`, and optional SEO defaults (`metaTitle`, `metaDescription`, `metaKeywords`). Pages support the same meta overrides. Booking rejects disabled payment methods.

Background jobs (registered in `server.js`): expire unpaid holds every 2 minutes; retry failed emails every 10 minutes; send check-in reminders hourly when `checkInReminderEnabled` is true.

Ops runbooks: [`docs/SMOKE_CHECKLIST.md`](../docs/SMOKE_CHECKLIST.md), [`docs/DEPLOY.md`](../docs/DEPLOY.md).

---

## 18b. Admin Realtime SSE (`/api/admin`)

| Method | Path | Auth | Permission | Description |
|--------|------|------|------------|-------------|
| GET | `/realtime/stream` | Cookie | `dashboard.read` **or** `bookings.read` | Server-Sent Events stream |

Events (SSE `event:` name = payload `type`):

- `connected` — stream ready
- `booking.created` / `booking.updated` / `booking.cancelled` / `booking.expired`
- `payment.updated`
- `inquiry.created` / `inquiry.updated`
- `inventory.updated`

Payload is a small JSON signal (`bookingId`, `bookingRef`, `inquiryId`, `roomId`, `status`, `at`). Clients should refetch REST (dashboard / bookings / inquiries / payments / inventory). Heartbeat comments every ~25s. Max ~200 concurrent connections.

---

## 19. Admin Dashboard (`/api/admin`)

Auth: admin session required. Sections are returned only when the signed-in user has the matching module permission (super-admin receives all).

| Method | Path | Description |
|--------|------|-------------|
| GET | `/dashboard/overview` | Operations HQ payload (`from`, `to` optional). Includes KPIs, booking summary, room inventory snapshot, category demand matrix, traffic/trend series, recent bookings, inquiries, and activity feed. |

---

## Permission modules (seed)

`settings`, `pages`, `sections`, `banners`, `navigation`, `policies`, `media`, `room_categories`, `rooms`, `amenities`, `facilities`, `restaurant`, `events`, `attractions`, `packages`, `gallery`, `testimonials`, `faqs`, `blogs`, `inquiries`, `newsletter`, `guests`, `inventory`, `bookings`, `payments`, `reports`, `notifications`, `coupons`, `tax_rates`, `users`, `roles`, `activity`

Re-seed permissions: `node prisma/seed.js` (from `backend/`).

---

## Postman setup

1. Import `backend/postman.json`.
2. Set `baseUrl` (default `http://localhost:5000`).
3. Run `node prisma/seed.js` once to create roles/permissions and the default Super Admin.
4. Run **Admin Auth → Login** with a real admin email/password.
   - Development fallback: `admin@example.com` / `ChangeMe123!`
   - Override with `DEFAULT_ADMIN_EMAIL` and `DEFAULT_ADMIN_PASSWORD` before seeding.
   - Existing admin passwords are not overwritten unless `DEFAULT_ADMIN_UPDATE_PASSWORD="true"`.
5. From browser DevTools / Postman Cookies, copy `hotel_admin_access` value into variable `adminToken`, **or** turn on Postman cookie handling for the host.
6. Replace `{{id}}`, `{{slug}}`, `{{bookingRef}}` as you create resources.
