# Brewster Console App

A desktop-optimized Vue 3 SPA for brewery management that shares the same backend API as the mobile web app.

## Overview

The Brewster Console App is a desktop-optimized interface for managing brewery operations. It provides enhanced features for desktop use while sharing the same backend API (`brewster-api`) as the mobile-first web application.

## Architecture

### Shared Backend Architecture
- **Single Backend**: Both mobile app and console app use `brewster-api` (port 3000)
- **Shared Authentication**: Single sign-on across both platforms
- **Consistent Data**: Real-time sync between mobile and desktop interfaces
- **Unified Business Logic**: Same API endpoints and data models

### Console App Specifics
- **Technology**: Vue 3 + Vite + Tailwind CSS
- **Port**: 5174 (mobile app uses 5173)
- **UI Framework**: Desktop-optimized with sidebar navigation
- **Build System**: Separate Vite configuration

## Project Structure

```
apps/console/
├── src/
│   ├── components/     # Desktop-optimized Vue components
│   ├── views/         # Page views (Dashboard, Inventory, etc.)
│   ├── router/        # Vue Router configuration
│   ├── services/      # API service layer (to be implemented)
│   ├── composables/   # Vue composables (to be implemented)
│   ├── config.js      # Shared API configuration
│   ├── main.js        # Application entry point
│   └── style.css      # Global styles
├── index.html         # HTML template
├── vite.config.js     # Vite configuration
├── tailwind.config.js # Tailwind CSS configuration
├── postcss.config.js  # PostCSS configuration
└── package.json       # Dependencies and scripts
```

## Features

### Current Placeholder Features
- **Dashboard**: Overview with key metrics and quick actions
- **Inventory Management**: Data table interface for stock management
- **Analytics**: Placeholder for data visualization and insights
- **Reports**: Report generation and management interface
- **Settings**: Configuration and user management

### Planned Integration Features
- **Real API Integration**: Connect to brewster-api backend
- **Authentication**: Shared login with mobile app
- **Data Sync**: Real-time inventory and batch updates
- **Advanced Reporting**: Desktop-optimized report generation
- **Bulk Operations**: Mass updates and batch processing

## Development

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Running `brewster-api` backend (port 3000)

### Installation
```bash
cd apps/console
npm install
```

### Development Server
```bash
npm run dev
```
App will be available at `http://localhost:5174`

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

## Configuration

### API Configuration
The app is configured to connect to the shared backend API:
```javascript
// src/config.js
export const API_BASE_URL = 'http://localhost:3000/api';
```

### Environment Variables
Create a `.env` file for environment-specific configuration:
```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_APP_ENV=development
```

## Integration with Mobile App

### Shared Components
- **Authentication**: Same login system and user sessions
- **Data Models**: Consistent inventory, batch, and recipe models
- **API Layer**: Identical API endpoints and request/response formats
- **Business Logic**: Shared validation rules and workflows

### Console-Specific Enhancements
- **Desktop UI**: Sidebar navigation, data tables, multi-column layouts
- **Advanced Features**: Bulk operations, custom reports, data export
- **Performance**: Optimized for larger datasets and complex operations
- **User Experience**: Keyboard shortcuts, right-click menus, drag-and-drop

## Migration Status

### Completed
- ✅ Project structure created
- ✅ Vue 3 SPA setup with Vite
- ✅ Tailwind CSS configuration
- ✅ Desktop-optimized layout components
- ✅ Placeholder views and navigation
- ✅ API configuration pointing to brewster-api

### In Progress
- 🔄 Backend API integration
- 🔄 Authentication implementation
- 🔄 Real data synchronization
- 🔄 Shared state management

### Planned
- 📋 Pinia store for shared state
- 📋 API service layer implementation
- 📋 Error handling and user feedback
- 📋 Advanced desktop features
- 📋 Cross-platform sync enhancements

## API Integration Notes

### Authentication Flow
1. User logs in via console app
2. Token stored in localStorage
3. All API requests include Authorization header
4. Session shared with mobile app (same token)

### Data Synchronization
- Console app will use same sync protocol as mobile app
- Real-time updates via WebSocket (planned)
- Conflict resolution through server-authoritative sync
- Offline capability with pending changes queue

### Feature Parity
While sharing the backend, the console app will provide:
- Enhanced desktop UI for existing features
- Additional desktop-only features
- Improved performance for large datasets
- Advanced reporting and analytics

## Contributing

1. Ensure brewster-api backend is running on port 3000
2. Follow existing code patterns and structure
3. Maintain consistency with mobile app API usage
4. Test both mobile and console interfaces
5. Update documentation for new features

## License

Part of the Brewster brewery management system.