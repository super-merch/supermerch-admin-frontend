import { createContext, useEffect, useState, useCallback } from "react";
import axios from "axios";

const MenuContext = createContext();

const MenuProvider = ({ children }) => {
    const [menuData, setMenuData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isSuperAdmin, setIsSuperAdmin] = useState(false);
    const [employeeRoles, setEmployeeRoles] = useState(null);
    const [isStatusFetched, setIsStatusFetched] = useState(false);
    const [currentPagePermissions, setCurrentPagePermissions] = useState({
        menuId: null,
        read: true,
        write: true,
        delete: true,
        edit: true,
        print: true,
        mail: true,
    });

    // Build parent-child tree from flat menus returned by API
    // Note: _id → id normalization is handled by the axios response interceptor
    const buildMenuTree = (data) => {
        if (!Array.isArray(data)) return data;
        return data.map((group) => {
            const flatMenus = Array.isArray(group.menus) ? group.menus : [];

            // Build parent-child tree
            const menuMap = {};
            flatMenus.forEach((menu) => {
                menuMap[menu.id] = { ...menu, children: [] };
            });

            const rootMenus = [];
            flatMenus.forEach((menu) => {
                const parentId = menu.parentMenuId
                    ? (typeof menu.parentMenuId === "object" ? menu.parentMenuId.id || menu.parentMenuId._id : menu.parentMenuId).toString()
                    : null;
                if (parentId && menuMap[parentId]) {
                    menuMap[parentId].children.push(menuMap[menu.id]);
                } else {
                    rootMenus.push(menuMap[menu.id]);
                }
            });

            return {
                ...group,
                menus: rootMenus,
            };
        });
    };

    // Fetch menu groups and user roles from API
    const fetchMenus = useCallback(async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("aToken");
            if (!token) {
                setLoading(false);
                return;
            }

            const headers = { atoken: token };

            // Fetch all active menu groups with nested menus
            const menuResponse = await axios.get("/api/menugroups/all", { headers });

            if (menuResponse.data.success) {
                const apiMenus = menuResponse.data.data;
                if (Array.isArray(apiMenus) && apiMenus.length > 0) {
                    const normalized = buildMenuTree(apiMenus);
                    setMenuData(normalized);
                } else {
                    // DB-driven menus only: no static fallback
                    setMenuData([]);
                }
            } else {
                // DB-driven menus only: no static fallback
                setMenuData([]);
            }

            // Fetch admin status and role info
            const adminResponse = await axios.get("/api/admin/me", { headers });

            if (adminResponse.data.success) {
                const role = adminResponse.data.role;
                setIsSuperAdmin(adminResponse.data.data.isSuperAdmin || false);
                // If role is "ADMIN", set isAdmin true — full permissions
                if (role === "ADMIN") {
                    setIsAdmin(true);
                    setEmployeeRoles(null);
                } else if (adminResponse.data.data.roleId) {
                    // For non-admin roles, fetch user role permissions
                    setIsAdmin(false);
                    try {
                        const rolesResponse = await axios.get(
                            `/api/user-roles/${adminResponse.data.data.roleId}`,
                            { headers }
                        );
                        if (rolesResponse.data.isOk) {
                            setEmployeeRoles(rolesResponse.data.data);
                        }
                    } catch (err) {
                        console.error("Error fetching user roles:", err);
                        setEmployeeRoles(null);
                    }
                }
            }

            setIsStatusFetched(true);
            setError(null);
        } catch (err) {
            console.error("Error fetching menus:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    // Update current page permissions based on menuId
    const updateCurrentPagePermissions = (menuId) => {
        if (isAdmin) {
            // Admin has all permissions
            setCurrentPagePermissions({
                menuId,
                read: true,
                write: true,
                delete: true,
                edit: true,
                print: true,
                mail: true,
            });
            return;
        }

        if (!employeeRoles || !Array.isArray(employeeRoles)) {
            setCurrentPagePermissions({
                menuId,
                read: false,
                write: false,
                delete: false,
                edit: false,
                print: false,
                mail: false,
            });
            return;
        }

        // Find matching role entry for this menuId
        const roleEntry = employeeRoles.find(
            (r) =>
                (r.menuId && (r.menuId._id || r.menuId) === menuId) ||
                (r.menuGroupId && (r.menuGroupId._id || r.menuGroupId) === menuId)
        );

        if (roleEntry) {
            setCurrentPagePermissions({
                menuId,
                read: roleEntry.read || false,
                write: roleEntry.write || false,
                delete: roleEntry.delete || false,
                edit: roleEntry.edit || false,
                print: true,
                mail: true,
            });
        } else {
            setCurrentPagePermissions({
                menuId,
                read: false,
                write: false,
                delete: false,
                edit: false,
                print: false,
                mail: false,
            });
        }
    };

    const getPermissionsForMenu = (menuId) => {
        if (isAdmin) {
            return {
                menuId,
                read: true,
                write: true,
                delete: true,
                edit: true,
                print: true,
                mail: true,
            };
        }

        if (!employeeRoles || !Array.isArray(employeeRoles)) {
            return {
                menuId,
                read: false,
                write: false,
                delete: false,
                edit: false,
                print: false,
                mail: false,
            };
        }

        const roleEntry = employeeRoles.find(
            (r) =>
                (r.menuId && (r.menuId._id || r.menuId) === menuId) ||
                (r.menuGroupId && (r.menuGroupId._id || r.menuGroupId) === menuId)
        );

        return {
            menuId,
            read: roleEntry?.read || false,
            write: roleEntry?.write || false,
            delete: roleEntry?.delete || false,
            edit: roleEntry?.edit || false,
            print: true,
            mail: true,
        };
    };

    const findMenuIdByUrl = (url) => {
        if (!url || !Array.isArray(menuData)) return null;

        const cleanUrl = url.split("?")[0].replace(/\/+$/, "");

        // Check direct link menu groups
        const directLinkGroup = menuData.find(
            (group) =>
                group.isLink &&
                group.url &&
                (group.url === cleanUrl || cleanUrl.endsWith(group.url))
        );
        if (directLinkGroup) return directLinkGroup.id;

        // Search through all menu groups
        let foundMenuId = null;
        const searchMenus = (menus) => {
            if (!Array.isArray(menus) || foundMenuId) return;
            for (const menu of menus) {
                if (
                    menu.url &&
                    (menu.url === cleanUrl || cleanUrl.endsWith(menu.url))
                ) {
                    foundMenuId = menu.id;
                    return;
                }
                if (menu.children && menu.children.length > 0) {
                    searchMenus(menu.children);
                }
            }
        };

        for (const group of menuData) {
            if (group.menus && group.menus.length > 0) {
                searchMenus(group.menus);
                if (foundMenuId) break;
            }
        }
        return foundMenuId;
    };

    const updatePermissionsByCurrentUrl = () => {
        const currentPath = window.location.pathname;
        const menuId = findMenuIdByUrl(currentPath);
        if (menuId) updateCurrentPagePermissions(menuId);
    };

    const invalidateMenuCache = useCallback(() => {
        setIsStatusFetched(false);
        fetchMenus();
    }, [fetchMenus]);

    // Initialize on mount if token exists
    useEffect(() => {
        if (localStorage.getItem("aToken")) {
            fetchMenus();
        }
    }, [fetchMenus]);

    // Listen for token changes
    useEffect(() => {
        const handleStorageChange = (e) => {
            if (e.key === "aToken") {
                if (e.newValue) {
                    fetchMenus();
                } else {
                    setMenuData([]);
                    setIsStatusFetched(false);
                }
            }
        };

        window.addEventListener("storage", handleStorageChange);
        return () => window.removeEventListener("storage", handleStorageChange);
    }, [fetchMenus]);

    // Check token on interval for same-tab login
    useEffect(() => {
        const checkTokenChange = () => {
            const token = localStorage.getItem("aToken");
            if (token && !isStatusFetched) {
                fetchMenus();
            }
        };

        checkTokenChange();
        const interval = setInterval(checkTokenChange, 1000);
        return () => clearInterval(interval);
    }, [isStatusFetched, fetchMenus]);

    // Update permissions when URL changes
    useEffect(() => {
        if (!loading && menuData.length > 0) {
            updatePermissionsByCurrentUrl();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loading, menuData]);

    return (
        <MenuContext.Provider
            value={{
                menuData,
                loading,
                error,
                fetchMenus,
                isAdmin,
                isSuperAdmin,
                employeeRoles,
                invalidateMenuCache,
                currentPagePermissions,
                updateCurrentPagePermissions,
                getPermissionsForMenu,
                findMenuIdByUrl,
                updatePermissionsByCurrentUrl,
            }}
        >
            {children}
        </MenuContext.Provider>
    );
};

export { MenuContext, MenuProvider };
