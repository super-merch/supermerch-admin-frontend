# PG Admin - Feature Documentation

## Overview
PG Admin is a comprehensive e-commerce administration dashboard built with React, providing complete management capabilities for orders, products, suppliers, users, quotes, and more.

## Table of Contents
1. [Authentication & Security](#authentication--security)
2. [Dashboard & Analytics](#dashboard--analytics)
3. [Orders Management](#orders-management)
4. [Products Management](#products-management)
5. [Suppliers Management](#suppliers-management)
6. [Categories Management](#categories-management)
7. [Users Management](#users-management)
8. [Quotes Management](#quotes-management)
9. [User Queries Management](#user-queries-management)
10. [Blogs Management](#blogs-management)
11. [Reports & Analytics](#reports--analytics)
12. [Configuration & Settings](#configuration--settings)
13. [Notifications](#notifications)

---

## Authentication & Security

### Login System
- **Admin Authentication**: Secure login for admin users
- **Token-based Session Management**: JWT token-based authentication stored in localStorage
- **Protected Routes**: All dashboard routes require authentication
- **Auto-redirect**: Unauthenticated users redirected to login page

### Password Management
- **Change Password**: Admin can change their password from dedicated settings page
- **Secure Password Update**: Password changes require current password verification

---

## Dashboard & Analytics

### Overview Dashboard (`/`)
- **Key Metrics Cards**:
  - Total Users count
  - Total Orders count
  - Total Products count
  - Total Quotes count
  - Total Suppliers count
  - Total Blogs count
  - Total User Queries count
  - Active/Inactive Suppliers breakdown

### Visual Analytics
- **Bar Charts**: Order and user statistics visualization
- **Pie/Donut Charts**: Distribution analysis (order status, user segments, etc.)
- **Trending Products**: Products trending in the marketplace
- **Recent Activity Lists**:
  - Recent users (last 5)
  - Recent orders (last 5)
  - Recent suppliers (last 5)

### Dashboard Features
- **Real-time Data**: Live updates from backend API
- **Quick Navigation**: Clickable cards linking to detailed pages
- **Loading States**: Elegant loading indicators during data fetch
- **Responsive Design**: Optimized for all screen sizes

---

## Orders Management

### Orders List (`/orders`)
- **Order Listing**: Comprehensive table view of all orders
- **Order Filtering**:
  - Filter by status (All, Pending, Processing, Shipped, Delivered, Cancelled)
  - Filter by date range
  - Search by order ID, customer name, or email
  - Sort by order date, amount, status
- **Status Management**: Update order status (Pending → Processing → Shipped → Delivered)
- **Order Details**: View complete order information
- **Order Deletion**: Delete orders with confirmation modal
- **Pagination**: Efficient pagination with configurable items per page (default: 20)

### Order Details (`/order-details/:id`)
- **Complete Order Information**: 
  - Customer details
  - Order items and quantities
  - Pricing breakdown
  - Shipping information
  - Order timeline
  - Payment status

### User Orders (`/user-orders/:id`)
- **Customer-centric View**: All orders for a specific user
- **Tabbed Interface**:
  - **Customer Tab**: User profile, contact info, order statistics
  - **Orders Tab**: Order history table with status management
  - **Queries Tab**: User-specific queries
  - **Attachments Tab**: Order-related attachments
  - **Notes Tab**: Internal notes for the user/orders
- **User Statistics**:
  - Total orders count
  - Total amount spent
  - Pending orders count
  - Completed orders count
- **Order Status Updates**: Direct status updates from user orders page

### All Users View (`/all-users`)
- **User Orders Overview**: List all users with their order counts
- **Quick Navigation**: Direct links to individual user order pages

### Email Templates (`/orders` - Templates button)
- **Email Template Management**: Create and manage email templates for order communications
- **Template Editor**: Rich text editor for email content
- **Template Categories**: Organize templates by order status or purpose

---

## Products Management

### Products List (`/products`)
- **Product Listing**: Comprehensive product catalog view
- **Product Filtering**:
  - Filter by supplier
  - Filter by category
  - Filter by status (Active, Inactive, Trending)
  - Search by product name or code
  - Filter by source (Australia, Production, etc.)
- **Product Actions**:
  - View product details
  - Edit product names (inline editing)
  - Mark as trending
  - Ignore/Unignore products
  - Toggle product visibility/status
- **Product Customization**: Custom product name override functionality
- **Bulk Operations**: Select and perform actions on multiple products
- **Pagination**: Efficient pagination for large product catalogs

### Product Details (`/product/:id`)
- **Complete Product Information**:
  - Product images gallery
  - Product specifications
  - Pricing information (with price breaks)
  - Category information
  - Supplier details
  - Product description and details
- **Product Editing**: Edit product details, pricing, images
- **Inventory Management**: View and manage stock levels

### Add Product (`/add-product`)
- **Product Creation Wizard**:
  - Product overview (name, code, hero image, min quantity)
  - Product details (description, images, specifications)
  - Pricing structure (price groups, price breaks, quantity tiers)
  - Currency options
  - Color options
  - Category assignment (with searchable dropdown)
  - Product type categorization
- **Image Upload**: Multiple image upload support
- **Price Break Configuration**: Set pricing for different quantity tiers
- **Form Validation**: Comprehensive validation before submission

---

## Suppliers Management

### Suppliers List (`/suppliers`)
- **Supplier Directory**: List of all suppliers
- **Supplier Information**:
  - Supplier name and details
  - Contact information
  - Status (Active/Inactive)
  - Product count per supplier
- **Supplier Actions**:
  - View supplier details
  - Activate/Deactivate suppliers
  - View supplier products
- **Supplier Statistics**: Active vs inactive supplier counts

### Supplier Categories (`/supplier-categories`)
- **Category Management**: Organize suppliers by categories
- **Category Assignment**: Assign suppliers to specific categories
- **Category Structure**: Hierarchical category organization

---

## Categories Management

### Categories List (`/categories`)
- **Category Directory**: Complete category listing
- **Category Hierarchy**: Tree structure for nested categories
- **Category Actions**:
  - Create new categories
  - Edit existing categories
  - Delete categories
  - View category details

### Category Details (`/category-detail`)
- **Detailed Category View**:
  - Category information
  - Associated products
  - Sub-categories
  - Category statistics
- **Category Management**: Edit category properties and associations

---

## Users Management

### Users List (`/users`)
- **User Directory**: Complete user listing
- **User Information**:
  - User name and email
  - Registration date
  - Order count
  - Account status
- **User Actions**:
  - View user details
  - View user orders
  - View user queries
  - Manage user status
- **User Search**: Search users by name or email
- **Pagination**: Efficient pagination for user lists

### User Profile Management
- **User Details View**: Comprehensive user information
- **Order History**: All orders placed by the user
- **Contact Information**: User contact details management

---

## Quotes Management

### User Quotes (`/quote`)
- **Quote Requests**: List of all quote requests from users
- **Quote Details** (`/quote-detail/:id`):
  - Complete quote information
  - Customer details
  - Requested items
  - Quote status tracking
  - Response management
- **Quote Actions**:
  - View quote details
  - Update quote status
  - Generate quote responses
  - Delete quotes

### Admin Quotes (`/admin-quotes`)
- **Admin-Generated Quotes**: Quotes created by admin
- **Quote Creation** (`/add-admin-quote`):
  - Create quotes for customers
  - Add products to quotes
  - Set pricing
  - Configure quote details
- **Quote Details** (`/admin-quote-detail/:id`):
  - View complete quote information
  - Edit quote items
  - Send quotes to customers
  - Track quote status
- **Quote Management**:
  - Edit quotes
  - Duplicate quotes
  - Send quotes via email
  - Convert quotes to orders

---

## User Queries Management

### User Queries List (`/user-queries`)
- **Contact Form Submissions**: List of all user queries/contact form submissions
- **Query Information**:
  - User name, email, phone
  - Query title and message
  - Query type/category
  - Submission date
- **Query Actions**:
  - View query details
  - Delete queries
  - Search and filter queries
- **Search & Filter**:
  - Search by name, email, or title
  - Filter by type
  - Filter by date
- **Pagination**: Efficient pagination with 10 queries per page

### Query Details (`/user-query/:id`)
- **Detailed Query View**:
  - Complete query information
  - Customer contact details
  - Query message
  - Submission timeline
  - Query metadata
- **Query Dashboard**:
  - User profile summary
  - Message content display
  - Timeline visualization
  - Contact information panel

---

## Blogs Management

### Blogs List (`/blogs`)
- **Blog Posts**: List of all blog posts
- **Blog Information**:
  - Blog title and excerpt
  - Author information
  - Publication date
  - Status (Published/Draft)
- **Blog Actions**:
  - View blog post
  - Edit blog post
  - Delete blog post
  - Publish/Unpublish

### Create Blog (`/add-blog`)
- **Blog Editor**:
  - Rich text editor (React Quill)
  - Title and slug management
  - Featured image upload
  - SEO metadata
  - Content formatting
  - Category assignment
  - Tags management
- **Blog Publishing**: Save as draft or publish immediately

### Edit Blog (`/edit-blog/:id`)
- **Blog Editing**: Edit existing blog posts
- **Content Management**: Update content, images, metadata
- **Version Control**: Track changes and updates

---

## Reports & Analytics

### Reports Dashboard (`/reports`)
- **Analytics Reports**: Comprehensive reporting dashboard
- **Report Types**:
  - Sales reports
  - Order reports
  - User reports
  - Product reports
  - Revenue analytics
- **Export Functionality**: Export reports in various formats
- **Date Range Filtering**: Filter reports by custom date ranges
- **Visual Charts**: Charts and graphs for data visualization

---

## Configuration & Settings

### Global Discount (`/global-discount`)
- **Store-wide Discounts**: Configure global discount settings
- **Discount Rules**: Set discount percentages or fixed amounts
- **Discount Conditions**: Configure when discounts apply
- **Discount Management**: Enable/disable global discounts

### Global Margin (`/global-margin`)
- **Profit Margin Control**: Configure global profit margins
- **Margin Settings**: Set default margin percentages
- **Margin Rules**: Define margin calculation rules
- **Price Adjustment**: Automatic price adjustments based on margins

### Coupon Management (`/add-coupen`)
- **Coupon Creation**: Create discount coupons
- **Coupon Configuration**:
  - Coupon code
  - Discount type (percentage or fixed)
  - Discount value
  - Usage limits
  - Expiry date
  - Minimum purchase requirements
- **Coupon Management**:
  - Active/Inactive status
  - Usage tracking
  - Edit and delete coupons

### Shipping Charges (`/shipping`)
- **Shipping Configuration**: Manage shipping charges
- **Shipping Rules**:
  - Flat rate shipping
  - Weight-based shipping
  - Distance-based shipping
  - Free shipping thresholds
- **Zone Management**: Configure shipping zones and rates
- **Shipping Options**: Multiple shipping method configuration

### Settings (`/settings`)
- **Notification Preferences**: Configure notification settings
- **Email Notifications**: Toggle email notifications for:
  - User Quotes
  - Admin Quotes
  - Orders
  - Users
  - User Queries
- **System Settings**: General system configuration
- **Preferences**: User preferences and display settings

---

## Notifications

### Notification System (`/notifications`)
- **Notification Center**: Centralized notification management
- **Notification Types**:
  - Order notifications
  - Quote notifications
  - User query notifications
  - System alerts
- **Notification Settings**: Configure which notifications to receive
- **Notification History**: View past notifications
- **Real-time Updates**: Live notification updates

---

## UI/UX Features

### Navigation
- **Collapsible Sidebar**: Expandable/collapsible navigation sidebar
- **Breadcrumb Navigation**: Clear navigation paths
- **Responsive Design**: Mobile-friendly interface
- **Active State Indicators**: Visual feedback for current page

### User Interface Components
- **Action Buttons**: Reusable action button component with loading states
- **Data Tables**: Sortable, filterable data tables
- **Modal Dialogs**: Confirmation modals for destructive actions
- **Toast Notifications**: Success/error notifications
- **Loading States**: Elegant loading indicators
- **Empty States**: Helpful messages when no data available
- **Search Functionality**: Global and context-specific search
- **Pagination**: Consistent pagination across all list views
- **Filters**: Advanced filtering options
- **Bulk Actions**: Perform actions on multiple items

### Theme & Styling
- **Modern Design**: Clean, modern UI with Tailwind CSS
- **Color Scheme**: Consistent color palette throughout
- **Icons**: Lucide React icons for visual consistency
- **Responsive Layout**: Optimized for desktop, tablet, and mobile
- **Accessibility**: Keyboard navigation and screen reader support

---

## Technical Stack

- **Frontend Framework**: React 18.3.1
- **Routing**: React Router DOM 7.1.1
- **Styling**: Tailwind CSS 3.4.17
- **State Management**: React Context API
- **HTTP Client**: Axios 1.7.9
- **Charts**: React ApexCharts 1.7.0
- **Rich Text Editor**: React Quill 2.0.0
- **Icons**: Lucide React 0.475.0, React Icons 5.4.0
- **Notifications**: React Toastify 11.0.2
- **Build Tool**: Vite 6.0.5
- **Animations**: Motion 12.4.3

---

## API Integration

- **Backend Communication**: RESTful API integration
- **Authentication**: JWT token-based authentication
- **Error Handling**: Comprehensive error handling and user feedback
- **Loading States**: Loading indicators during API calls
- **Data Fetching**: Efficient data fetching with caching strategies

---

## Key Features Summary

✅ **Complete Order Management** - Full order lifecycle management  
✅ **Comprehensive Product Catalog** - Product CRUD operations with advanced filtering  
✅ **Supplier Management** - Supplier directory and relationship management  
✅ **Category Organization** - Hierarchical category management  
✅ **User Management** - User profiles and order tracking  
✅ **Quote System** - Both user-initiated and admin-generated quotes  
✅ **Customer Support** - User queries/contact form management  
✅ **Content Management** - Blog post creation and management  
✅ **Analytics & Reports** - Comprehensive reporting dashboard  
✅ **Configuration Tools** - Discounts, margins, coupons, shipping  
✅ **Notification System** - Configurable notification preferences  
✅ **Modern UI/UX** - Responsive, intuitive interface  
✅ **Security** - Authentication and protected routes  

---

## Future Enhancements (Potential)

- Advanced analytics with custom date ranges
- Export functionality for all data tables
- Email integration for order communications
- Multi-language support
- Role-based access control
- Advanced reporting with custom reports
- Inventory management system
- Payment gateway integration
- Order tracking with shipping APIs
- Customer review management
- Product review system
- Advanced search with filters
- Data import/export tools
- Backup and restore functionality

---

*Last Updated: 2024*  
*Document Version: 1.0*
