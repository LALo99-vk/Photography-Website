# Elite Photography Platform

A comprehensive photography service platform built with React, Node.js, Firebase, and MySQL. This platform provides a complete solution for photography businesses to manage bookings, client interactions, photo galleries, and automated reporting.

## Features

### Client Features
- **Beautiful Portfolio Gallery** - Responsive photo galleries with lightbox functionality
- **Online Booking System** - Multi-step booking form with package selection
- **Photo Selection Interface** - Clients can select favorite photos for printing
- **User Dashboard** - View bookings, photos, and account information
- **Secure Authentication** - Firebase-based authentication system

### Photographer/Admin Features
- **Admin Panel** - Comprehensive management dashboard
- **Photo Upload & Management** - Bulk photo uploads with organization tools
- **Booking Management** - View, update, and manage all client bookings
- **Client Photo Selections** - Track which photos clients have selected
- **Automated Excel Reports** - Scheduled exports of booking and selection data
- **Payment Integration** - Stripe integration for secure payments

### Technical Features
- **Responsive Design** - Mobile-first design with elegant UI/UX
- **Role-Based Access Control** - Client, photographer, and admin roles
- **Real-time Updates** - Live data synchronization
- **File Storage** - Secure photo storage and management
- **Database Integration** - MySQL database with optimized queries
- **Automated Scheduling** - CRON jobs for regular data exports

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **React Router** for navigation
- **Firebase SDK** for authentication
- **Axios** for API calls

### Backend
- **Node.js** with Express
- **MySQL** database
- **Firebase Admin SDK**
- **Multer** for file uploads
- **ExcelJS** for report generation
- **Stripe** for payments
- **CRON** for scheduled tasks

### Design System
- **Fonts**: Playfair Display (headings), Inter (body)
- **Colors**: Black & white theme with copper/gold accents (#D4AF37)
- **Components**: Reusable, accessible components
- **Responsive**: Mobile-first approach with breakpoints

## Installation

### Prerequisites
- Node.js 18+ 
- MySQL 8.0+
- Firebase project
- Stripe account (for payments)

### Frontend Setup

1. Install dependencies:
```bash
npm install
```

2. Configure Firebase:
   - Create a Firebase project
   - Enable Authentication (Email/Password)
   - Enable Firestore
   - Enable Storage
   - Update `src/firebase/config.ts` with your config

3. Start development server:
```bash
npm run dev
```

### Backend Setup

1. Navigate to server directory:
```bash
cd server
npm install
```

2. Database setup:
```bash
# Create MySQL database
mysql -u root -p
CREATE DATABASE photography_platform;

# Import schema
mysql -u root -p photography_platform < database/schema.sql
```

3. Environment configuration:
```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your configuration
```

4. Start server:
```bash
npm run dev
```

## Database Schema

### Core Tables
- **users** - User profiles and roles
- **bookings** - Photography session bookings
- **photos** - Uploaded photo metadata
- **photo_selections** - Client photo selections
- **payments** - Payment transactions
- **albums** - Photo album management

### Key Features
- Foreign key constraints for data integrity
- Indexes for optimized queries
- JSON fields for flexible data storage
- Automatic timestamps
- Cascade deletes for cleanup

## API Endpoints

### Authentication
- `POST /api/auth/profile` - Create/update user profile
- `GET /api/auth/profile/:uid` - Get user profile
- `PATCH /api/auth/role/:uid` - Update user role (admin only)

### Bookings
- `POST /api/bookings` - Create new booking
- `GET /api/bookings` - Get all bookings (admin/photographer)
- `GET /api/bookings/user/:userId` - Get user bookings
- `GET /api/bookings/:id` - Get specific booking
- `PATCH /api/bookings/:id/status` - Update booking status

### Photos
- `POST /api/photos/upload/:bookingId` - Upload photos
- `GET /api/photos/booking/:bookingId` - Get booking photos
- `POST /api/photos/:photoId/select` - Select/deselect photo
- `GET /api/photos/selections/:bookingId` - Get selected photos
- `DELETE /api/photos/:photoId` - Delete photo

### Excel Reports
- `GET /api/excel/export` - Generate Excel report
- `GET /api/excel/stats` - Get export statistics

## Deployment

### Frontend (Vercel/Netlify)
1. Build the project:
```bash
npm run build
```

2. Deploy to your preferred platform
3. Configure environment variables

### Backend (Railway/Heroku)
1. Set up production database
2. Configure environment variables
3. Deploy server code
4. Run database migrations

### Database (PlanetScale/AWS RDS)
1. Create production MySQL instance
2. Import schema
3. Configure connection strings
4. Set up backups

## Configuration

### Firebase Setup
1. Create Firebase project
2. Enable Authentication with Email/Password
3. Create Firestore database
4. Enable Storage
5. Generate service account key for backend

### Stripe Integration
1. Create Stripe account
2. Get API keys (test/live)
3. Configure webhooks
4. Set up payment methods

### Email Configuration
1. Configure SMTP settings
2. Set up email templates
3. Configure notification triggers

## Excel Export Features

### Automated Reports
- **Daily exports** at 2 AM (configurable)
- **Comprehensive data** including bookings, selections, payments
- **Automatic cleanup** of old exports (30-day retention)
- **Multiple worksheets** for different data types

### Manual Exports
- **On-demand generation** via admin panel
- **Date range filtering** for specific periods
- **Export type selection** (all data, bookings only, etc.)
- **Statistics dashboard** with key metrics

## Security Features

- **Firebase Authentication** with secure token verification
- **Role-based access control** for different user types
- **Input validation** and sanitization
- **File upload restrictions** with type and size limits
- **SQL injection prevention** with parameterized queries
- **CORS configuration** for secure API access

## Performance Optimizations

- **Database indexing** for fast queries
- **Image optimization** and compression
- **Lazy loading** for photo galleries
- **Pagination** for large datasets
- **Caching strategies** for frequently accessed data
- **CDN integration** for static assets

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue on GitHub
- Email: support@elitephotography.com
- Documentation: [Link to docs]

## Roadmap

### Upcoming Features
- **Mobile app** (React Native)
- **Advanced photo editing** tools
- **Client review system** with ratings
- **Social media integration**
- **Multi-language support**
- **Advanced analytics** dashboard
- **Automated backup** system
- **API rate limiting**
- **Advanced search** and filtering
- **Integration with** popular photography tools

---

Built with ❤️ for photographers who want to focus on their craft while technology handles the business.