import { Navigate } from "react-router-dom";
import Login from "../pages/Authentication/Login";
import UserProfile from "../pages/Authentication/user-profile";
import CompanyDetails from "../pages/Setup/CompanyDetails";
import Department from "../pages/Setup/Department";
import Employee from "../pages/Setup/Employee";
import Country from "../pages/Master/Country";
import State from "../pages/Master/State";
import City from "../pages/Master/City";
import EmailSetup from "../pages/CMS/EmailSetup";
import EmailFor from "../pages/CMS/EmailFor";
import EmailTemplate from "../pages/CMS/EmailTemplate";
import Inquiry from "../pages/CMS/Inquiry";
import Dashboard from "../pages/Dashboard/Dashboard";
import MenuGroup from "../pages/Master/MenuGroup";
import MenuMaster from "../pages/Master/MenuMaster";
import EmployeeRoles from "../pages/Setup/EmployeeRoles";
import RoleMaster from "../pages/Master/RoleMaster";
// CurrencyMaster removed (dead weight)
import Supplier from "../pages/Master/Supplier";
import Brand from "../pages/Master/Brand";
import Gender from "../pages/Master/Gender";
import SizeCategory from "../pages/Master/SizeCategory";
import Size from "../pages/Master/Size";
import MainCategory from "../pages/Master/MainCategory";
import SubCategory from "../pages/Master/SubCategory";
import Color from "../pages/Master/Color";
import Collection from "../pages/Master/Collection";
import CustomizationMethod from "../pages/Master/CustomizationMethod";
import CustomizationPosition from "../pages/Master/CustomizationPosition";
import Deal from "../pages/Master/Deal";
import HomePageBanner from "../pages/CMS/HomePageBanner";
import AboutUsBanner from "../pages/CMS/AboutUsBanner";
import GeneralCMS from "../pages/CMS/GeneralCMS";
import CMSPage from "../pages/CMS/CMSPage";
import Material from "../pages/Master/Material";
// DeliveryType removed
import BankHolidays from "../pages/Master/BankHolidays";
import WebsiteUsers from "../pages/Master/WebsiteUsers";
import Orders from "../pages/Master/Orders";
import OrderDetail from "../pages/Master/OrderDetail";
import CreateOrder from "../pages/Master/CreateOrder";
// VatMaster removed (dead weight)
// LogisticMaster removed
import CouponMaster from "../pages/Master/CouponMaster";
import CouponBannerMaster from "../pages/Master/CouponBannerMaster";
import SupportTickets from "../pages/Master/SupportTickets";

// ── SuperMerch-specific pages ──────────────────────────────
// Product Master (read-only PromoData viewer)
import ProductMaster from "../pages/Master/ProductMaster";

// Pricing & Margins
import GlobalPricing from "../pages/Pricing/GlobalPricing";
import CategoryMargin from "../pages/Pricing/CategoryMargin";

// Curation
import Trending from "../pages/Curation/Trending";
import NewArrivals from "../pages/Curation/NewArrivals";
import BestSellers from "../pages/Curation/BestSellers";
import HourProduction from "../pages/Curation/HourProduction";
import AustraliaMade from "../pages/Curation/AustraliaMade";
import CategoryOrder from "../pages/Curation/CategoryOrder";
import SupplierPriority from "../pages/Curation/SupplierPriority";

// Quotation
import UserQuotes from "../pages/Quotation/UserQuotes";
import AdminQuotes from "../pages/Quotation/AdminQuotes";

// CMS
import Blog from "../pages/CMS/Blog";

// Product
import CustomProducts from "../pages/Product/CustomProducts";
import CustomNames from "../pages/Product/CustomNames";

// Users
import EmailSubscriptions from "../pages/Users/EmailSubscriptions";

// Reviews & Notifications (orphaned pages — now wired)
import ProductReviews from "../pages/Master/ProductReviews";
import PushNotificationSettings from "../pages/Setup/PushNotificationSettings";
import XeroIntegration from "../pages/Setup/XeroIntegration";
import Notifications from "../pages/Master/Notifications";

// Section 3 — CMS, Tags, Reports
import SeoManagement from "../pages/CMS/SeoManagement";
import ProductTags from "../pages/Master/ProductTags";
import PopUpManagement from "../pages/CMS/PopUpManagement";
import PartnerBrands from "../pages/CMS/PartnerBrands";
import SalesReports from "../pages/Reports/SalesReports";
import CustomerInsights from "../pages/Reports/CustomerInsights";
import SupplierPerformance from "../pages/Reports/SupplierPerformance";
import MarginAnalysis from "../pages/Reports/MarginAnalysis";

// Shipping & Settings removed (delivery modules)

const authProtectedRoutes = [
    { path: "/profile", component: <UserProfile /> },
    { path: "/company-details", component: <CompanyDetails /> },
    { path: "/department", component: <Department /> },
    { path: "/employee", component: <Employee /> },
    { path: "/employee-roles", component: <EmployeeRoles /> },
    { path: "/country", component: <Country /> },
    { path: "/state", component: <State /> },
    { path: "/city", component: <City /> },
    { path: "/email-setup", component: <EmailSetup /> },
    { path: "/email-for", component: <EmailFor /> },
    { path: "/email-template", component: <EmailTemplate /> },
    { path: "/inquiries", component: <Inquiry /> },
    { path: "/dashboard", component: <Dashboard /> },
    { path: "/menu-group", component: <MenuGroup /> },
    { path: "/menu-master", component: <MenuMaster /> },
    { path: "/role-master", component: <RoleMaster /> },
    { path: "/supplier-master", component: <Supplier /> },
    { path: "/brand-master", component: <Brand /> },
    { path: "/gender-master", component: <Gender /> },
    { path: "/size-category", component: <SizeCategory /> },
    { path: "/size", component: <Size /> },
    { path: "/main-category", component: <MainCategory /> },
    { path: "/sub-category", component: <SubCategory /> },
    { path: "/collection", component: <Collection /> },
    { path: "/customization-method", component: <CustomizationMethod /> },
    { path: "/customization-position", component: <CustomizationPosition /> },
    { path: "/color", component: <Color /> },
    { path: "/product-master", component: <ProductMaster /> },
    { path: "/deals", component: <Deal /> },
    { path: "/home-page-banner", component: <HomePageBanner /> },
    { path: "/about-us-banner", component: <AboutUsBanner /> },
    { path: "/general-cms", component: <GeneralCMS /> },
    { path: "/cms-pages", component: <CMSPage /> },
    { path: "/material", component: <Material /> },
    // delivery-type route removed
    { path: "/bank-holidays", component: <BankHolidays /> },
    { path: "/website-users", component: <WebsiteUsers /> },
    { path: "/orders", component: <Orders /> },
    { path: "/orders/create", component: <CreateOrder /> },
    { path: "/orders/:id", component: <OrderDetail /> },
    // logistic-master route removed
    { path: "/coupon-master", component: <CouponMaster /> },
    { path: "/coupon-banners", component: <CouponBannerMaster /> },
    { path: "/support-tickets", component: <SupportTickets /> },

    // ── SuperMerch-specific routes ────────────────────────────
    // Pricing & Margins
    { path: "/pricing/global", component: <GlobalPricing /> },
    { path: "/pricing/category-margin", component: <CategoryMargin /> },

    // Curation
    { path: "/curation/trending", component: <Trending /> },
    { path: "/curation/new-arrivals", component: <NewArrivals /> },
    { path: "/curation/best-sellers", component: <BestSellers /> },
    { path: "/curation/24hour-production", component: <HourProduction /> },
    { path: "/curation/australia-made", component: <AustraliaMade /> },
    { path: "/curation/category-order", component: <CategoryOrder /> },
    { path: "/curation/supplier-priority", component: <SupplierPriority /> },

    // Quotation
    { path: "/quotation/user-requests", component: <UserQuotes /> },
    { path: "/quotation/admin-quotes", component: <AdminQuotes /> },

    // CMS
    { path: "/blog", component: <Blog /> },

    // Product
    { path: "/custom-products", component: <CustomProducts /> },
    { path: "/custom-names", component: <CustomNames /> },

    // Users
    { path: "/email-subscriptions", component: <EmailSubscriptions /> },

    // Reviews & Notifications
    { path: "/product-reviews", component: <ProductReviews /> },
    { path: "/push-notification-settings", component: <PushNotificationSettings /> },
    { path: "/notifications", component: <Notifications /> },
    { path: "/xero-integration", component: <XeroIntegration /> },

    // Section 3 — CMS, Tags, Reports
    { path: "/seo-management", component: <SeoManagement /> },
    { path: "/product-tags", component: <ProductTags /> },
    { path: "/popup-management", component: <PopUpManagement /> },
    { path: "/partner-brands", component: <PartnerBrands /> },
    { path: "/reports/sales", component: <SalesReports /> },
    { path: "/reports/customers", component: <CustomerInsights /> },
    { path: "/reports/suppliers", component: <SupplierPerformance /> },
    { path: "/reports/margins", component: <MarginAnalysis /> },

    // Settings — shipping/gst routes removed

    {
        path: "/",
        exact: true,
        component: <Navigate to="/dashboard" />,
    },
    { path: "*", component: <Navigate to="/dashboard" /> },
];

const publicRoutes = [
    { path: "/", component: <Login /> },
    // { path: "*", component: <Navigate to="/" /> },
];

export { authProtectedRoutes, publicRoutes };
