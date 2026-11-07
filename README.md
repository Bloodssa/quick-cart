# QuickCart Frontend

QuickCart is a React-based e-commerce frontend for browsing products, managing a shopping cart, completing orders, and administering catalog and order operations. It is built as a Vite single-page application and communicates with an ASP.NET Web API backend through a versioned REST API.

## Purpose

The frontend provides two role-oriented experiences:

- A customer storefront for discovering products and completing purchases.
- An administrator workspace for managing products, inventory, orders, customers, categories, promotions, reviews, and sales reporting.

## Main customer features

- Home page with hero content, product collections, categories, featured products, trending products, and new arrivals.
- Product browsing with:
  - Search
  - Category filtering
  - Sorting
  - Deals, new-arrival, and best-seller views
  - Pagination
- Product detail pages with image galleries, descriptions, related products, pricing, stock information, and customer reviews.
- Shopping cart management:
  - Add products
  - Change quantities
  - Remove individual items
  - Remove cart items
  - Guest-cart prompt for unauthenticated users
- Checkout with:
  - Delivery-address selection
  - Address creation and editing
  - Payment-method selection
  - Shipping quotes
  - Voucher-code handling
  - Order preview
- Customer account pages with:
  - Profile details
  - Password changes
  - Saved delivery addresses
  - Default-address selection
  - Orders in progress
  - Order history
- Order detail pages and order cancellation.
- Product reviews with ratings, comments, and optional photos.
- Responsive navigation and toast notifications for user feedback.

## Main administrator features

The administrator area is protected by an admin-role route guard and uses a dedicated responsive layout with a sidebar and header.

- Dashboard with:
  - Summary statistics
  - Paid revenue by day
  - Orders grouped by status
  - Orders requiring attention
  - Reviews requiring replies
  - Top products
  - Restock information
- Product management:
  - Product search and pagination
  - Create and edit products
  - Product descriptions, prices, categories, stock, and featured status
  - Product image upload, deletion, and default-image selection
  - Product deletion
- Inventory management:
  - Stock summary
  - Low-stock and out-of-stock filters
  - Incremental stock adjustments
- Category creation, editing, and deletion.
- Order management:
  - Order filtering and pagination
  - Order details
  - Order and payment-status updates
- Customer lookup with customer order history. The customer page is read-only in the frontend.
- Deals and promotions:
  - Time-limited product deals
  - Ending active deals
  - Voucher creation and activation management
- Review moderation:
  - Search and filters
  - Low-rated and photo-based review views
  - Reply creation, editing, and deletion
  - Review deletion by an administrator
- Sales reports:
  - Date-range filtering
  - Revenue and transaction summaries
  - Paginated transactions
  - PDF sales-report download
- Administrator profile and password-management screens.

## Technology stack

### Runtime and application

- React 19
- React DOM
- React Router DOM
- Vite
- JavaScript and JSX

### Data and HTTP

- TanStack React Query
- Axios
- `sonner` for toast notifications

### UI and styling

- Tailwind CSS 4 through `@tailwindcss/vite`
- Material UI
- Material UI X Charts
- Emotion
- Lucide React icons
- Plus Jakarta Sans loaded through Google Fonts

### Testing and development

- Vitest
- Testing Library for React
- Testing Library DOM matchers
- Testing Library User Event
- MSW
- ESLint
- TanStack React Query Devtools in development mode

## Frontend architecture

The application follows a feature-oriented React structure:

1. `src/main.jsx` creates the React root and composes the global providers.
2. `QueryClientProvider` supplies the TanStack Query client.
3. `BrowserRouter` supplies client-side routing.
4. `AuthProvider` restores and exposes the current session.
5. `App.jsx` defines public, authenticated, and administrator routes.
6. Pages compose reusable components and query hooks.
7. Query modules connect UI state to API modules.
8. API modules use the shared Axios client for backend communication.

The application uses React Context for authentication state and TanStack React Query for server state, caching, loading states, mutations, and invalidation. Local component state and URL search parameters handle view-specific interaction such as filters, pagination, open modals, and selected tabs.

## Project structure

```text
.
├── public/                 Static public assets and SVG icons
├── src/
│   ├── api/                Axios-backed API functions
│   ├── assets/             Product, category, and hero images
│   ├── components/         Reusable storefront, customer, admin, form, and UI components
│   ├── context/             Authentication context and provider
│   ├── hooks/               Reusable React hooks
│   ├── layouts/             Home/storefront and administrator layouts
│   ├── lib/                 Formatting, dates, downloads, redirects, and other utilities
│   ├── pages/               Route-level customer, authentication, product, and admin pages
│   ├── queries/             TanStack React Query hooks and query keys
│   ├── test/                Vitest, Testing Library, and MSW test setup
│   ├── App.jsx              Route definitions
│   ├── index.css            Tailwind import and global theme styles
│   └── main.jsx             Application bootstrap and providers
├── .env.example             Example Vite environment variables
├── eslint.config.js         ESLint configuration
├── index.html               Vite HTML entry point
├── package.json              Scripts and dependencies
├── package-lock.json         Locked npm dependency versions
└── vite.config.js           Vite and Vitest configuration
```

## State management and data fetching

TanStack React Query is configured in `src/queries/queryClient.js` with:

- A one-minute query `staleTime`
- Ten-minute unused-query garbage-collection time
- Refetching on reconnect disabled
- Retry behavior limited to server errors, with a maximum of two retries

Query modules in `src/queries/` define stable query keys, queries, mutations, and cache invalidation for products, categories, carts, orders, addresses, reviews, deals, vouchers, customers, dashboard data, users, and administrative orders and reviews.

Mutations invalidate related query keys after successful changes. For example, placing or cancelling an order refreshes order, cart, and product data so that stock and cart contents stay synchronized.

## Authentication and session handling

Authentication is implemented by `AuthProvider` and the API/session modules:

- Login and registration call the backend authentication endpoints.
- The current user is loaded through `/auth/me`.
- Access tokens are kept in `sessionStorage`.
- A session flag and refresh-cookie relationship are tracked through `localStorage`.
- The refresh token is expected to be an HTTP-only cookie managed by the backend.
- Axios sends credentials with requests using `withCredentials: true`.
- A request interceptor adds the current access token to the authorization header.
- A response interceptor retries an unauthorized request once after attempting `/auth/refresh`.
- If refresh fails, the session is cleared and an authentication logout event resets the UI and React Query cache.
- Logout calls the backend, clears browser session state, and returns the user to the home page.

`ProtectedRoute` restricts customer account, checkout, and order-detail pages to authenticated users. `AdminRoute` additionally requires the authenticated user to have the `Admin` role. `GuestRoute` prevents authenticated users from opening login and registration pages.

## API communication

The shared Axios client is defined in `src/api/client.js`:

```text
<VITE_API_URL>/api/v1
```

It uses a 15-second request timeout, sends credentials, unwraps response data where appropriate, and provides helpers for displaying backend, network, rate-limit, and ASP.NET validation errors.

API modules are grouped by domain, including:

- Authentication and session operations
- Products and product images
- Categories
- Cart
- Orders and checkout previews
- Addresses
- Reviews
- Deals and vouchers
- Administrative orders and reviews
- Customers
- Dashboard and sales reports
- User profile and password changes

Product and review image operations use `FormData`. Sales-report PDF downloads request a blob and save it locally through the download utility. Philippine location data for address forms is retrieved from the PSGC API configured by `VITE_PSGC_URL`.

## Routing

Routes are declared in `src/App.jsx`.

### Public routes

- `/`
- `/products`
- `/products/:id`
- `/cart`

### Guest-only routes

- `/login`
- `/register`

### Authenticated customer routes

- `/profile`
- `/checkout`
- `/orders/:id`

### Administrator routes

- `/admin`
- `/admin/orders`
- `/admin/orders/:id`
- `/admin/deals`
- `/admin/reviews`
- `/admin/products`
- `/admin/products/new`
- `/admin/products/:id/edit`
- `/admin/categories`
- `/admin/inventory`
- `/admin/customers`
- `/admin/reports`
- `/admin/profile`

Unknown routes render the not-found page. The administrator layout and dashboard are lazy-loaded, and route rendering is wrapped in a suspense boundary with a page loader.

## UI and styling

Tailwind CSS is imported through the Vite Tailwind plugin. Global theme tokens and typography are defined in `src/index.css`, including the Plus Jakarta Sans font, QuickCart accent colors, heading color, background color, and dashboard countdown animations.

The UI combines Tailwind utility classes with Material UI components and charts. Lucide React supplies icons, while shared components provide product cards, forms, modals, loading states, pagination, status badges, profile sections, and administrator controls.

The administrator layout changes sidebar behavior at the 1024px breakpoint. The storefront and customer pages use responsive layouts and mobile-friendly navigation.

## Testing

The repository is configured for Vitest with a `jsdom` environment:

- Test setup: `src/test/setup.js`
- MSW server: `src/test/server.js`
- Provider-aware render helper: `src/test/renderWithProviders.jsx`
- Example unit test: `src/lib/format.test.js`

The test setup cleans up rendered components, resets MSW handlers, and clears local and session storage after each test. The repository currently contains a focused unit test for price formatting; broader component and integration test coverage is not present in the checked-in source.

Run the available test commands with:

```bash
npm test
npm run test:run
```

## Environment variables

Copy `.env.example` to a local environment file and set values appropriate for the development environment.

| Variable | Purpose | Repository evidence |
| --- | --- | --- |
| `VITE_API_URL` | Origin of the ASP.NET Web API backend. The client appends `/api/v1`. | Used by `src/api/client.js`; the Vitest configuration supplies `http://localhost:3000` for tests. |
| `VITE_PSGC_URL` | Base URL for PSGC province, city, and barangay lookups. | Used by `src/api/psgc.js`; defaults to `https://psgc.gitlab.io/api`. |
| `VITE_APP_NAME` | Declared in `.env.example`. | No runtime usage was found in the checked-in frontend source. |
| `VITE_SHOW_DEVTOOLS` | Declared in `.env.example`. | No runtime usage was found; React Query Devtools are enabled from Vite development mode in `src/main.jsx`. |
| `VITE_USE_MOCK` | Declared in `.env.example`. | No runtime usage or mock-data switch was found in the checked-in frontend source. |

Do not commit local `.env` files. They are excluded by `.gitignore`.

## Prerequisites

- Node.js and npm installed.
- Access to a running QuickCart ASP.NET Web API backend.
- A backend URL that can be supplied through `VITE_API_URL`.
- Network access to the configured PSGC service unless a different `VITE_PSGC_URL` is provided.

The exact supported Node.js version is not declared in the repository. Use a current Node.js version compatible with the listed Vite, React, and npm dependencies.

## Installation and setup

```bash
git clone https://github.com/Bloodssa/quick-cart.git
cd quick-cart
npm install
cp .env.example .env
```

Set at least `VITE_API_URL` in `.env` to the origin of the running backend. Keep the `/api/v1` suffix out of this variable because the frontend adds that path itself.

## Development

Start the Vite development server with:

```bash
npm run dev
```

The development build enables React Query Devtools through `import.meta.env.DEV`. The actual local URL and port are assigned by Vite unless overridden through Vite's normal command-line options or configuration.

## Production build

Create a production bundle with:

```bash
npm run build
```

Vite writes the generated static assets to `dist/`. To test that bundle locally, run:

```bash
npm run preview
```

## Deployment

The repository does not contain a deployment workflow, hosting configuration, Docker configuration, or platform-specific deployment files. The frontend is a Vite single-page application, so deployment requires:

1. Installing dependencies.
2. Providing the required Vite environment values at build time.
3. Running `npm run build`.
4. Hosting the generated `dist/` directory on a static web server or supported static hosting service.
5. Configuring the host to fall back to `index.html` for client-side routes.
6. Allowing the deployed origin to communicate with the backend, including the credentialed refresh-cookie flow used by Axios.

The backend URL and browser credential/CORS behavior must be configured consistently between the deployed frontend and the ASP.NET Web API.

## Relationship to the ASP.NET Web API backend

QuickCart’s frontend is a client of a separate ASP.NET Web API service. It does not contain backend business logic or persistence. The frontend:

- Calls REST endpoints under `/api/v1`.
- Sends access-token authorization headers and refresh-cookie credentials.
- Uses backend responses for products, categories, inventory, carts, orders, addresses, reviews, promotions, customers, dashboard data, and reports.
- Displays backend error messages and ASP.NET-style validation dictionaries through shared error helpers.
- Requests product and review image uploads as multipart form data.
- Uses backend-calculated shipping quotes and order previews rather than calculating final checkout totals entirely in the browser.
- Downloads administrator sales reports generated by the backend as PDF blobs.
