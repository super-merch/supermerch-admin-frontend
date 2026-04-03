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
import CurrencyMaster from "../pages/Master/CurrencyMaster";
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
// Original Workwear Product.js kept for reference — ProductMaster.js is the active page
import Deal from "../pages/Master/Deal";
import HomePageBanner from "../pages/CMS/HomePageBanner";
import AboutUsBanner from "../pages/CMS/AboutUsBanner";
import GeneralCMS from "../pages/CMS/GeneralCMS";
import CMSPage from "../pages/CMS/CMSPage";
import Material from "../pages/Master/Material";
import DeliveryType from "../pages/Master/DeliveryType";
import BankHolidays from "../pages/Master/BankHolidays";
import WebsiteUsers from "../pages/Master/WebsiteUsers";
import Orders from "../pages/Master/Orders";
import OrderDetail from "../pages/Master/OrderDetail";
import VatMaster from "../pages/Master/VatMaster";
import LogisticMaster from "../pages/Master/LogisticMaster";
import CouponMaster from "../pages/Master/CouponMaster";
import CouponBannerMaster from "../pages/Master/CouponBannerMaster";
import SupportTickets from "../pages/Master/SupportTickets";

// ── SuperMerch-specific pages ──────────────────────────────
// Product Master (read-only PromoData viewer)
import ProductMaster from "../pages/Master/ProductMaster";

// Pricing & Margins
import GlobalMargin from "../pages/Pricing/GlobalMargin";
import SupplierMargin from "../pages/Pricing/SupplierMargin";
import CategoryMargin from "../pages/Pricing/CategoryMargin";
import ProductMargin from "../pages/Pricing/ProductMargin";
import GlobalDiscount from "../pages/Pricing/GlobalDiscount";
import SupplierDiscount from "../pages/Pricing/SupplierDiscount";
import ProductDiscount from "../pages/Pricing/ProductDiscount";

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

// Shipping & Settings
import ShippingConfig from "../pages/Shipping/ShippingConfig";
import GSTConfig from "../pages/Shipping/GSTConfig";

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
    { path: "/currency-master", component: <CurrencyMaster /> },
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
    { path: "/delivery-type", component: <DeliveryType /> },
    { path: "/bank-holidays", component: <BankHolidays /> },
    { path: "/website-users", component: <WebsiteUsers /> },
    { path: "/orders", component: <Orders /> },
    { path: "/orders/:id", component: <OrderDetail /> },
    { path: "/vat", component: <VatMaster /> },
    { path: "/logistic-master", component: <LogisticMaster /> },
    { path: "/coupon-master", component: <CouponMaster /> },
    { path: "/coupon-banners", component: <CouponBannerMaster /> },
    { path: "/support-tickets", component: <SupportTickets /> },

    // ── SuperMerch-specific routes ────────────────────────────
    // Pricing & Margins
    { path: "/pricing/global-margin", component: <GlobalMargin /> },
    { path: "/pricing/supplier-margin", component: <SupplierMargin /> },
    { path: "/pricing/category-margin", component: <CategoryMargin /> },
    { path: "/pricing/product-margin", component: <ProductMargin /> },
    { path: "/pricing/global-discount", component: <GlobalDiscount /> },
    { path: "/pricing/supplier-discount", component: <SupplierDiscount /> },
    { path: "/pricing/product-discount", component: <ProductDiscount /> },

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

    // Settings
    { path: "/shipping-config", component: <ShippingConfig /> },
    { path: "/gst-config", component: <GSTConfig /> },

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
