# Mobile POS - Expo React Native App

A comprehensive Point of Sale (POS) system built with Expo React Native, featuring barcode scanning capabilities for all operations including sales, purchases, inventory management, and customer management.

## Features

### 🔍 Barcode Scanning
- **Universal Barcode Support**: Scan barcodes for products, inventory, and customer identification
- **Camera Integration**: Real-time barcode scanning with camera overlay
- **Manual Entry**: Fallback option to manually enter barcodes
- **Flash Support**: Toggle camera flash for better scanning in low light

### 📱 Core POS Features
- **Sales Management**: Complete POS interface with cart, payment processing, and receipt generation
- **Inventory Management**: Add, edit, and track products with barcode integration
- **Customer Management**: Customer database with purchase history and contact management
- **Analytics Dashboard**: Real-time business insights with charts and metrics

### 💾 Data Management
- **SQLite Database**: Local data storage with offline support
- **Secure Authentication**: User login with role-based access control
- **Data Persistence**: Automatic data backup and recovery

### 🎨 Modern UI/UX
- **Material Design 3**: Clean, modern interface following Material Design principles
- **Responsive Design**: Optimized for various screen sizes and orientations
- **Dark/Light Theme**: Automatic theme switching based on system preferences
- **Smooth Animations**: Fluid transitions and micro-interactions

## Installation

1. **Prerequisites**
   ```bash
   npm install -g expo-cli
   npm install -g @expo/cli
   ```

2. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd mobile-pos-expo
   npm install
   ```

3. **Start Development Server**
   ```bash
   npm start
   ```

4. **Run on Device/Simulator**
   - **iOS**: `npm run ios` (requires Xcode)
   - **Android**: `npm run android` (requires Android Studio)
   - **Web**: `npm run web`

## Barcode Scanning Integration

### Product Management
- Scan barcodes to quickly add products to inventory
- Automatic product lookup during sales
- Bulk inventory updates via barcode scanning

### Sales Process
1. Scan product barcodes to add items to cart
2. Automatic price and inventory lookup
3. Real-time stock updates
4. Receipt generation with barcode references

### Inventory Operations
- Quick stock checks via barcode scanning
- Batch product updates
- Low stock alerts with barcode identification

## Database Schema

The app uses SQLite with the following main tables:
- `products`: Product information with barcode mapping
- `customers`: Customer database with contact details
- `sales`: Transaction records with itemized details
- `sale_items`: Individual sale line items

## Authentication

Demo credentials:
- **Admin**: admin@mobilepos.com / admin123
- **Manager**: manager@mobilepos.com / manager123

## Permissions

The app requires the following permissions:
- **Camera**: For barcode scanning functionality
- **Storage**: For local database and file operations

## Technology Stack

- **Framework**: Expo React Native
- **UI Library**: React Native Paper (Material Design 3)
- **Database**: Expo SQLite
- **Barcode Scanning**: Expo Barcode Scanner
- **Charts**: React Native Chart Kit
- **Navigation**: Expo Router
- **Authentication**: Expo Secure Store

## Project Structure

```
mobile-pos-expo/
├── app/                    # App screens and navigation
│   ├── (tabs)/            # Tab-based navigation screens
│   ├── login.tsx          # Authentication screen
│   └── _layout.tsx        # Root layout
├── components/            # Reusable UI components
│   └── BarcodeScanner.tsx # Barcode scanning component
├── contexts/              # React contexts for state management
│   ├── AuthContext.tsx    # Authentication context
│   └── DatabaseContext.tsx # Database operations context
├── constants/             # App constants and themes
└── assets/               # Static assets (icons, images)
```

## Key Features Implementation

### Barcode Scanner Component
- Real-time camera preview with scanning overlay
- Customizable scanning area with visual indicators
- Flash toggle and manual entry options
- Error handling and permission management

### Database Integration
- Automatic database initialization with sample data
- CRUD operations for all entities
- Relationship management between tables
- Data validation and error handling

### Offline Support
- Local SQLite database for offline operations
- Data synchronization capabilities
- Automatic conflict resolution

## Development

### Adding New Features
1. Create new screens in the `app/` directory
2. Add database operations in `DatabaseContext.tsx`
3. Create reusable components in `components/`
4. Update navigation in `_layout.tsx` files

### Customizing Barcode Scanner
The `BarcodeScanner` component can be customized for different use cases:
- Modify scanning overlay design
- Add custom validation logic
- Integrate with specific barcode formats
- Add audio/haptic feedback

## Building for Production

### Android
```bash
expo build:android
```

### iOS
```bash
expo build:ios
```

### Web
```bash
expo build:web
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions, please open an issue in the repository or contact the development team.