import React, { useState, useEffect, useContext, useCallback } from "react";
import axios from "axios";
import {
  Container,
  Row,
  Col,
  Card,
  CardHeader,
  CardBody,
  Input,
  Label,
  Table,
  Button,
  FormGroup,
  Spinner,
  Badge,
  UncontrolledTooltip,
  Alert
} from "reactstrap";
import Select from "react-select";
import AsyncSelect from "react-select/async";
import { toast } from "react-toastify";
import BreadCrumb from "../../Components/Common/BreadCrumb";
import LoadingOverlay from "../../Components/Common/LoadingOverlay";
import { MenuContext } from "../../context/MenuContext";
import { AuthContext } from "../../context/AuthContext";

const EmployeeRoles = () => {
  // States
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [menuData, setMenuData] = useState([]);
  const [employeeRoles, setEmployeeRoles] = useState([]);
  const [rolesChanged, setRolesChanged] = useState(false);
  const [hoveredRow, setHoveredRow] = useState(null);

  const {menuData: contextMenuData, loading: menuLoading} = useContext(MenuContext);
  const {adminData} = useContext(AuthContext);

  // API Calls
  const loadRoleOptions = useCallback(
    async (inputValue, callback) => {
      try {
        const response = await axios.get('/api/roles', {
          params: {
            search: inputValue,
            isActive: true,
            limit: 50
          },
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        if (response.data.success) {
          const options = response.data.data.map(role => ({
            value: role.id,
            label: role.roleName,
          }));
          callback(options);
        } else {
          callback([]);
        }
      } catch (error) {
        console.error('Error loading roles:', error);
        callback([]);
      }
    },
    []
  );

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `/api/roles`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`
          }
        }
      );
      
      if (response.data.success) {
        // Format for react-select
        const formattedRoles = response.data.data.map(role => ({
          value: role.id,
          label: role.roleName,
        }));
        setRoles(formattedRoles);
      }
    } catch (error) {
      console.error("Error fetching roles:", error);
      toast.error("Failed to load roles");
    } finally {
      setLoading(false);
    }
  }, []);

  // Load default options for roles (called on mount)
  const loadDefaultRoleOptions = useCallback(
    () => loadRoleOptions('', (options) => setRoles(options)),
    [loadRoleOptions]
  );

  // Fetch all menu data using the same API as MenuContext
  const fetchAllMenuData = useCallback(async () => {
    setLoading(true);
    try {
      console.log("Fetching menus from MenuContext API...");
      const response = await axios.get(
        `/api/menugroups/all`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`
          }
        }
      );

      if (response.data.success) {
        const menuGroupsData = response.data.data;
        console.log("Menu groups data:", menuGroupsData);
        
        // Log detailed structure for debugging
        menuGroupsData.forEach((group, index) => {
          console.log(`Group ${index}:`, {
            id: group.id,
            name: group.menugroupName,
            isLink: group.isLink,
            menusCount: group.menus ? group.menus.length : 0,
            menus: group.menus
          });
        });
        
        if (Array.isArray(menuGroupsData)) {
          setMenuData(menuGroupsData);
        } else {
          console.error("Menu data is not an array");
          toast.error("Menu data is in an unexpected format");
        }
      } else {
        console.error("No data in API response or success is false");
        toast.error("Failed to load menu data");
        
        // If context data is available, use it as a fallback
        if (contextMenuData && contextMenuData.length > 0) {
          console.log("Using MenuContext data as fallback");
          setMenuData(contextMenuData);
        }
      }
    } catch (error) {
      console.error("Error fetching menu data:", error);
      toast.error("Failed to load menus and menu groups");
      
      // If context data is available, use it as a fallback
      if (contextMenuData && contextMenuData.length > 0) {
        console.log("Using MenuContext data as fallback");
        setMenuData(contextMenuData);
      }
    } finally {
      setLoading(false);
    }
  }, [contextMenuData]);

  // Fetch all roles and menu data
  useEffect(() => {
    loadDefaultRoleOptions();
    fetchAllMenuData();
  }, [loadDefaultRoleOptions, fetchAllMenuData]);
  
  // Fetch employee roles when an employee is selected
  useEffect(() => {
    if (selectedRole) {
      fetchEmployeeRoles(selectedRole.value);
    } else {
      setEmployeeRoles([]);
    }
  }, [selectedRole]);
  
  const fetchEmployeeRoles = async (roleId) => {
    setLoading(true);
    try {
      const response = await axios.get(
        `/api/user-roles/${roleId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`
          }
        }
      );

      if (response.data.isOk && response.data.data && response.data.data.length > 0) {
        console.log("Employee roles:", response.data.data);
        
        // Store the raw user roles data directly - no need for complex transformation
        setEmployeeRoles(response.data.data);
      } else {
        // If no roles found, set to empty array
        setEmployeeRoles([]);
        if (response.data.message) {
          toast.info(response.data.message);
        }
      }
    } catch (error) {
      console.error("Error fetching employee roles:", error);
      if (error.response && error.response.status === 404) {
        // No roles assigned yet, that's fine
        setEmployeeRoles([]);
      } else {
        toast.error("Failed to load employee roles");
        setEmployeeRoles([]);
      }
    } finally {
      setLoading(false);
      setRolesChanged(false);
    }
  };
  
  // Handle permission checkboxes
  const handlePermissionChange = (id, isGroup, permission, isChecked) => {
    setRolesChanged(true);
    
    if (!employeeRoles) {
      setEmployeeRoles([]);
    }
    
    const updatedRoles = [...(employeeRoles || [])];
    
    // Find existing role entry
    const existingRoleIndex = updatedRoles.findIndex(role => 
      isGroup ? role.menuGroupId === id : role.menuId === id
    );
    
    if (existingRoleIndex !== -1) {
      // Update existing role
      updatedRoles[existingRoleIndex] = {
        ...updatedRoles[existingRoleIndex],
        [permission]: isChecked
      };
    } else {
      // Create new role entry
      const newRole = {
        roleId: selectedRole.value,
        menuId: isGroup ? null : id,
        menuGroupId: isGroup ? id : null,
        read: permission === "read" ? isChecked : false,
        write: permission === "write" ? isChecked : false,
        edit: permission === "edit" ? isChecked : false,
        delete: permission === "delete" ? isChecked : false,
      };
      updatedRoles.push(newRole);
    }
    
    setEmployeeRoles(updatedRoles);
  };
  
  // Handle all permissions for a menu
  const handleAllPermissions = (id, isGroup, isChecked) => {
    setRolesChanged(true);
    
    if (!employeeRoles) {
      setEmployeeRoles([]);
    }
    
    const updatedRoles = [...(employeeRoles || [])];
    
    // Find existing role entry
    const existingRoleIndex = updatedRoles.findIndex(role => 
      isGroup ? role.menuGroupId === id : role.menuId === id
    );
    
    if (existingRoleIndex !== -1) {
      // Update existing role - set all permissions
      updatedRoles[existingRoleIndex] = {
        ...updatedRoles[existingRoleIndex],
        read: isChecked,
        write: isChecked,
        edit: isChecked,
        delete: isChecked
      };
    } else {
      // Create new role entry with all permissions
      const newRole = {
        roleId: selectedRole.value,
        menuId: isGroup ? null : id,
        menuGroupId: isGroup ? id : null,
        read: isChecked,
        write: isChecked,
        edit: isChecked,
        delete: isChecked,
      };
      updatedRoles.push(newRole);
    }
    
    setEmployeeRoles(updatedRoles);
  };

  // Handle column-wide permission changes
  const handleColumnPermissionChange = (permission, isChecked) => {
    setRolesChanged(true);
    
    if (!employeeRoles) {
      setEmployeeRoles([]);
    }
    
    const updatedRoles = [...(employeeRoles || [])];
    
    // Collect all menu and group IDs
    const allItems = [];
    menuData.forEach(group => {
      if (group.isLink) {
        allItems.push({ id: group.id, isGroup: true });
      } else if (group.menus) {
        const collectItems = (menus) => {
          menus.forEach(menu => {
            allItems.push({ id: menu.id, isGroup: false });
            if (menu.children && menu.children.length > 0) {
              collectItems(menu.children);
            }
          });
        };
        collectItems(group.menus);
      }
    });
    
    // Update or create roles for all items
    allItems.forEach(({ id, isGroup }) => {
      const existingRoleIndex = updatedRoles.findIndex(role => 
        isGroup ? role.menuGroupId === id : role.menuId === id
      );
      
      if (existingRoleIndex !== -1) {
        // Update existing role
        updatedRoles[existingRoleIndex] = {
          ...updatedRoles[existingRoleIndex],
          [permission]: isChecked
        };
      } else {
        // Create new role entry
        const newRole = {
          roleId: selectedRole.value,
          menuId: isGroup ? null : id,
          menuGroupId: isGroup ? id : null,
          read: permission === "read" ? isChecked : false,
          write: permission === "write" ? isChecked : false,
          edit: permission === "edit" ? isChecked : false,
          delete: permission === "delete" ? isChecked : false,
        };
        updatedRoles.push(newRole);
      }
    });
    
    setEmployeeRoles(updatedRoles);
  };

  // Handle all permissions for a group
  const handleAllGroupPermissions = (groupId, isChecked) => {
    setRolesChanged(true);
    
    if (!employeeRoles) {
      setEmployeeRoles([]);
    }
    
    const updatedRoles = [...(employeeRoles || [])];
    const group = menuData.find(g => g.id === groupId);
    if (!group) return;
    
    if (group.isLink) {
      // Handle group permissions
      const existingRoleIndex = updatedRoles.findIndex(role => role.menuGroupId === groupId);
      
      if (existingRoleIndex !== -1) {
        // Update existing group role
        updatedRoles[existingRoleIndex] = {
          ...updatedRoles[existingRoleIndex],
          read: isChecked,
          write: isChecked,
          edit: isChecked,
          delete: isChecked
        };
      } else {
        // Create new group role
        const newRole = {
          roleId: selectedRole.value,
          menuId: null,
          menuGroupId: groupId,
          read: isChecked,
          write: isChecked,
          edit: isChecked,
          delete: isChecked,
        };
        updatedRoles.push(newRole);
      }
    } else if (group.menus) {
      // Handle all menu permissions in this group
      const updateMenuPermissions = (menus) => {
        menus.forEach(menu => {
          const existingRoleIndex = updatedRoles.findIndex(role => role.menuId === menu.id);
          
          if (existingRoleIndex !== -1) {
            // Update existing menu role
            updatedRoles[existingRoleIndex] = {
              ...updatedRoles[existingRoleIndex],
              read: isChecked,
              write: isChecked,
              edit: isChecked,
              delete: isChecked
            };
          } else {
            // Create new menu role
            const newRole = {
              roleId: selectedRole.value,
              menuId: menu.id,
              menuGroupId: null,
              read: isChecked,
              write: isChecked,
              edit: isChecked,
              delete: isChecked,
            };
            updatedRoles.push(newRole);
          }
          
          if (menu.children && menu.children.length > 0) {
            updateMenuPermissions(menu.children);
          }
        });
      };
      updateMenuPermissions(group.menus);
    }
    
    setEmployeeRoles(updatedRoles);
  };

  // Check if a menu has a particular permission
  const hasPermission = (id, isGroup, permission) => {
    if (!employeeRoles || !Array.isArray(employeeRoles)) return false;
    
    const role = employeeRoles.find(r => 
      isGroup ? r.menuGroupId === id : r.menuId === id
    );
    
    return role ? role[permission] : false;
  };
  
  // Check if all permissions are granted
  const hasAllPermissions = (id, isGroup) => {
    if (!employeeRoles || !Array.isArray(employeeRoles)) return false;
    
    const role = employeeRoles.find(r => 
      isGroup ? r.menuGroupId === id : r.menuId === id
    );
    
    if (!role) return false;
    
    return (
      role.read &&
      role.write &&
      role.delete &&
      role.edit
    );
  };
  
  // Check if any permissions are granted
  const hasAnyPermissions = (id, isGroup) => {
    if (!employeeRoles || !Array.isArray(employeeRoles)) return false;
    
    const role = employeeRoles.find(r => 
      isGroup ? r.menuGroupId === id : r.menuId === id
    );
    
    if (!role) return false;
    
    return (
      role.read ||
      role.write ||
      role.delete ||
      role.edit
    );
  };

  // Check if a column has all permissions
  const hasColumnAllPermissions = (permission) => {
    if (!employeeRoles || !Array.isArray(employeeRoles)) return false;
    
    // Get all menu and group IDs from menuData
    const allIds = [];
    menuData.forEach(group => {
      if (group.isLink) {
        allIds.push({ id: group.id, isGroup: true });
      } else if (group.menus) {
        const collectIds = (menus) => {
          menus.forEach(menu => {
            allIds.push({ id: menu.id, isGroup: false });
            if (menu.children && menu.children.length > 0) {
              collectIds(menu.children);
            }
          });
        };
        collectIds(group.menus);
      }
    });
    
    // Check if all IDs have the specified permission
    return allIds.every(({ id, isGroup }) => {
      const role = employeeRoles.find(r => 
        isGroup ? r.menuGroupId === id : r.menuId === id
      );
      return role && role[permission];
    });
  };

  // Check if a group has all permissions
  const hasGroupAllPermissions = (groupId) => {
    if (!employeeRoles || !Array.isArray(employeeRoles)) return false;
    
    const group = menuData.find(g => g.id === groupId);
    if (!group) return false;
    
    if (group.isLink) {
      const role = employeeRoles.find(r => r.menuGroupId === groupId);
      return role && role.read && role.write && role.delete && role.edit;
    } else if (group.menus) {
      const checkAllMenus = (menus) => {
        return menus.every(menu => {
          const role = employeeRoles.find(r => r.menuId === menu.id);
          const hasAll = role && role.read && role.write && role.delete && role.edit;
          if (menu.children && menu.children.length > 0) {
            return hasAll && checkAllMenus(menu.children);
          }
          return hasAll;
        });
      };
      return checkAllMenus(group.menus);
    }
    
    return false;
  };

  // Check if a group has any permissions
  const hasGroupAnyPermissions = (groupId) => {
    if (!employeeRoles || !Array.isArray(employeeRoles)) return false;
    
    const group = menuData.find(g => g.id === groupId);
    if (!group) return false;
    
    if (group.isLink) {
      const role = employeeRoles.find(r => r.menuGroupId === groupId);
      return role && (role.read || role.write || role.delete || role.edit);
    } else if (group.menus) {
      const checkAnyMenus = (menus) => {
        return menus.some(menu => {
          const role = employeeRoles.find(r => r.menuId === menu.id);
          const hasAny = role && (role.read || role.write || role.delete || role.edit);
          if (menu.children && menu.children.length > 0) {
            return hasAny || checkAnyMenus(menu.children);
          }
          return hasAny;
        });
      };
      return checkAnyMenus(group.menus);
    }
    
    return false;
  };
  
  // Save employee roles
  const saveEmployeeRoles = async () => {
    if (!selectedRole || !employeeRoles || !Array.isArray(employeeRoles)) return;

    setSaveLoading(true);
    try {
      // Filter out empty roles (roles with no permissions)
      const validRoles = employeeRoles.filter(role => 
        role.read || role.write || role.edit || role.delete
      );

      // Check if any existing roles exist by looking for roles with IDs
      const hasExistingRoles = employeeRoles.some(role => role.id);

      if (hasExistingRoles) {
        // Update existing roles
        await axios.put(
          `/api/user-roles/${selectedRole.value}`,
          {
            roleId: selectedRole.value,
            roles: validRoles
          },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`
            }
          }
        );
        toast.success("Employee roles updated successfully");
      } else {
        // Create new roles
        await axios.post(
          `/api/user-roles`,
          {
            roleId: selectedRole.value,
            roles: validRoles
          },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`
            }
          }
        );
        toast.success("Employee roles created successfully");
      }
      
      // Refresh employee roles
      fetchEmployeeRoles(selectedRole.value);
      // Update the roles list to reflect that this employee now has roles
      setRoles(roles.map(role => 
        role.value === selectedRole.value ? { ...role } : role
      ));
    } catch (error) {
      console.error("Error saving employee roles:", error);
      toast.error("Failed to save employee roles");
    } finally {
      setSaveLoading(false);
    }
  };
  
  // Get appropriate styles based on hover state and permissions
  const getRowStyles = (id, isGroup) => {
    const hasAny = hasAnyPermissions(id, isGroup);
    const isHovered = hoveredRow === id;
    
    let bgColor = '';
    
    if (isHovered) {
      bgColor = 'rgba(0, 123, 255, 0.05)';
    } else if (hasAny) {
      bgColor = 'rgba(40, 167, 69, 0.05)';
    }
    
    return {
      backgroundColor: bgColor,
      transition: 'background-color 0.2s'
    };
  };
  
  // Recursive function to render menu items and their checkboxes
  const renderMenuItems = (menuItems, depth = 0) => {
    console.log("renderMenuItems called with:", { menuItems, depth, count: menuItems?.length });
    
    if (!menuItems || menuItems.length === 0) {
      console.log("No menu items to render");
      return null;
    }
    
    return menuItems.map(menu => {
      console.log("Rendering menu:", { id: menu.id, name: menu.menuName, isParent: menu.isParent });
      
      // Generate a unique, safe ID for the menu item
      const menuBadgeId = `menu-badge-${menu.id.toString().replace(/[^a-zA-Z0-9]/g, '-')}`;
      const toggleBtnId = `toggle-btn-${menu.id.toString().replace(/[^a-zA-Z0-9]/g, '-')}`;
      const isParentMenu = menu.isParent;
      
      return (
        <React.Fragment key={menu.id}>
          <tr 
            style={getRowStyles(menu.id, false)} 
            onMouseEnter={() => setHoveredRow(menu.id)}
            onMouseLeave={() => setHoveredRow(null)}
          >
            <td style={{ paddingLeft: `${depth * 2}rem` }} className="menu-name-cell">
              {depth > 0 && (
                <i className="bx bx-subdirectory-right me-2 text-muted"></i>
              )}
              <span className={depth === 0 && menu.isParent ? "fw-bold" : ""}>
                {menu.isParent ? (
                  <i className="bx bx-folder me-1 text-primary"></i>
                ) : (
                  <i className="bx bx-file me-1 text-info"></i>
                )}
                {menu.menuName}
              </span>
              
              {hasAllPermissions(menu.id, false) && (
                <>
                  <Badge color="success" className="ms-2" pill id={menuBadgeId}>
                    All
                  </Badge>
                  <UncontrolledTooltip placement="top" target={menuBadgeId}>
                    Full access granted
                  </UncontrolledTooltip>
                </>
              )}
              
              <div className="float-end">
                <Button
                  color="light"
                  size="sm"
                  className="btn-sm py-0 px-1"
                  onClick={() => handleAllPermissions(menu.id, false, !hasAllPermissions(menu.id, false))}
                  id={toggleBtnId}
                >
                  {hasAllPermissions(menu.id, false) ? (
                    <i className="bx bx-x text-danger"></i>
                  ) : (
                    <i className="bx bx-check text-success"></i>
                  )}
                </Button>
                <UncontrolledTooltip placement="top" target={toggleBtnId}>
                  {hasAllPermissions(menu.id, false) ? "Revoke all permissions" : "Grant all permissions"}
                </UncontrolledTooltip>
              </div>
            </td>
            <td className="text-center permission-cell">
              <Input
                type="checkbox"
                checked={hasPermission(menu.id, false, "read")}
                onChange={(e) => handlePermissionChange(menu.id, false, "read", e.target.checked)}
                className="permission-checkbox"
              />
            </td>
            <td className="text-center permission-cell">
              <Input
                type="checkbox"
                checked={hasPermission(menu.id, false, "write")}
                onChange={(e) => handlePermissionChange(menu.id, false, "write", e.target.checked)}
                className="permission-checkbox"
              />
            </td>
            <td className="text-center permission-cell">
              <Input
                type="checkbox"
                checked={hasPermission(menu.id, false, "delete")}
                onChange={(e) => handlePermissionChange(menu.id, false, "delete", e.target.checked)}
                className="permission-checkbox"
              />
            </td>
            <td className="text-center permission-cell">
              <Input
                type="checkbox"
                checked={hasPermission(menu.id, false, "edit")}
                onChange={(e) => handlePermissionChange(menu.id, false, "edit", e.target.checked)}
                className="permission-checkbox"
              />
            </td>
          </tr>
          {/* Note: Children handling would go here if API provided nested structure */}
        </React.Fragment>
      );
    });
  };

  document.title = `Employee Roles | ${adminData.companyName}`;

  return (
    <React.Fragment>
      <div className="page-content">
        {loading && <LoadingOverlay fullScreen />}
        <Container fluid>
          <BreadCrumb
            maintitle="Setup"
            title="Employee Roles"
            pageTitle="Setup"
          />
          
          <Card className="shadow-sm">
            <CardHeader className="bg-light d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <i className="bx bx-user-circle me-2 text-primary"></i>
                Role Management
              </h5>
              {(!menuData || menuData.length === 0) && (
                <Button 
                  color="secondary" 
                  size="sm" 
                  onClick={fetchAllMenuData}
                >
                  <i className="bx bx-refresh me-1"></i>
                  Reload Menus
                </Button>
              )}
            </CardHeader>
            <CardBody>
              <Row className="mb-4">
                <Col md={3}>
                  <FormGroup>
                    <Label htmlFor="employeeSelect" className="fw-bold">
                      <i className="bx bx-user me-1"></i> Select Role
                    </Label>
                    <AsyncSelect
                      id="employeeSelect"
                      loadOptions={loadRoleOptions}
                      defaultOptions={roles}
                      value={selectedRole}
                      onChange={(selectedOption) => {
                        setSelectedRole(selectedOption);
                      }}
                      placeholder="Search and select a role..."
                      isClearable
                      isSearchable
                      cacheOptions
                      debounceTimeout={300}
                      noOptionsMessage={({ inputValue }) => 
                        inputValue ? `No roles found matching "${inputValue}"` : "Start typing to search roles"
                      }
                      loadingMessage={() => "Searching roles..."}
                      styles={{
                        control: (base) => ({
                          ...base,
                          minHeight: "38px",
                        }),
                      }}
                    />
                  </FormGroup>
                </Col>
                <Col md={9} className="d-flex align-items-end justify-content-end">
                  {selectedRole && (
                    <Button
                      color="primary"
                      className="mt-md-0 mt-2"
                      onClick={saveEmployeeRoles}
                      disabled={saveLoading || !rolesChanged}
                    >
                      {saveLoading ? (
                        <>
                          <Spinner size="sm" className="me-1" /> Saving...
                        </>
                      ) : (
                        <>
                          <i className="bx bx-save me-1"></i> Save Roles
                        </>
                      )}
                    </Button>
                  )}
                </Col>
              </Row>

              {rolesChanged && selectedRole && (
                <Alert color="warning" className="d-flex align-items-center mb-3">
                  <i className="bx bx-info-circle me-2 fs-5"></i>
                  <div>
                    You have unsaved changes to the permissions. Click "Save Roles" to apply the changes.
                  </div>
                </Alert>
              )}
              {selectedRole ? (
                <div className="mt-4 menu-roles-table-container">
                  <div className="table-responsive">
                    <Table bordered hover className="menu-roles-table">
                      <thead>
                        <tr className="bg-light">
                          <th style={{ width: "40%" }}>Menu</th>
                          <th style={{ width: "10%" }} className="text-center">
                            <div className="d-flex flex-column align-items-center">
                              <span>Read</span>
                              <Input
                                type="checkbox"
                                checked={hasColumnAllPermissions("read")}
                                onChange={(e) => handleColumnPermissionChange("read", e.target.checked)}
                                className="permission-checkbox mt-1"
                                style={{ width: "16px", height: "16px" }}
                              />
                            </div>
                          </th>
                          <th style={{ width: "10%" }} className="text-center">
                            <div className="d-flex flex-column align-items-center">
                              <span>Write</span>
                              <Input
                                type="checkbox"
                                checked={hasColumnAllPermissions("write")}
                                onChange={(e) => handleColumnPermissionChange("write", e.target.checked)}
                                className="permission-checkbox mt-1"
                                style={{ width: "16px", height: "16px" }}
                              />
                            </div>
                          </th>
                          <th style={{ width: "10%" }} className="text-center">
                            <div className="d-flex flex-column align-items-center">
                              <span>Delete</span>
                              <Input
                                type="checkbox"
                                checked={hasColumnAllPermissions("delete")}
                                onChange={(e) => handleColumnPermissionChange("delete", e.target.checked)}
                                className="permission-checkbox mt-1"
                                style={{ width: "16px", height: "16px" }}
                              />
                            </div>
                          </th>
                          <th style={{ width: "10%" }} className="text-center">
                            <div className="d-flex flex-column align-items-center">
                              <span>Edit</span>
                              <Input
                                type="checkbox"
                                checked={hasColumnAllPermissions("edit")}
                                onChange={(e) => handleColumnPermissionChange("edit", e.target.checked)}
                                className="permission-checkbox mt-1"
                                style={{ width: "16px", height: "16px" }}
                              />
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {menuData && menuData.length > 0 ? (
                          menuData.map((group, index) => {
                            // Generate safe IDs for group elements
                            const groupBadgeId = `group-badge-${group.id.toString().replace(/[^a-zA-Z0-9]/g, '-')}`;
                            const groupToggleId = `group-toggle-${group.id.toString().replace(/[^a-zA-Z0-9]/g, '-')}`;
                            
                            return (
                              <React.Fragment key={group.id}>
                                {/* Menu Group Header */}
                                <tr className="table-primary">
                                  <td colSpan={5} className="fw-bold">
                                    <div className="d-flex align-items-center justify-content-between">
                                      <div className="d-flex align-items-center">
                                        <Input
                                          type="checkbox"
                                          checked={hasGroupAllPermissions(group.id)}
                                          onChange={(e) => handleAllGroupPermissions(group.id, e.target.checked)}
                                          className="permission-checkbox me-2"
                                          style={{ width: "16px", height: "16px" }}
                                        />
                                        <i className="bx bx-category me-2"></i>
                                        {group.menugroupName}
                                      </div>
                                      {hasGroupAnyPermissions(group.id) && (
                                        <Badge color="info" className="ms-2" pill>
                                          <i className="bx bx-check me-1"></i>
                                          Permissions Set
                                        </Badge>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                                
                                {/* Direct Link Group */}
                                {group.isLink && (
                                  <tr 
                                    style={getRowStyles(group.id, true)}
                                    onMouseEnter={() => setHoveredRow(group.id)}
                                    onMouseLeave={() => setHoveredRow(null)}
                                  >
                                    <td className="menu-name-cell">
                                      <i className="bx bx-link me-1 text-success"></i>
                                      {group.menugroupName}
                                      
                                      {hasAllPermissions(group.id, true) && (
                                        <>
                                          <Badge color="success" className="ms-2" pill id={groupBadgeId}>
                                            All
                                          </Badge>
                                          <UncontrolledTooltip placement="top" target={groupBadgeId}>
                                            Full access granted
                                          </UncontrolledTooltip>
                                        </>
                                      )}
                                      
                                      <div className="float-end">
                                        <Button
                                          color="light"
                                          size="sm"
                                          className="btn-sm py-0 px-1"
                                          onClick={() => handleAllPermissions(group.id, true, !hasAllPermissions(group.id, true))}
                                          id={groupToggleId}
                                        >
                                          {hasAllPermissions(group.id, true) ? (
                                            <i className="bx bx-x text-danger"></i>
                                          ) : (
                                            <i className="bx bx-check text-success"></i>
                                          )}
                                        </Button>
                                        <UncontrolledTooltip placement="top" target={groupToggleId}>
                                          {hasAllPermissions(group.id, true) ? "Revoke all permissions" : "Grant all permissions"}
                                        </UncontrolledTooltip>
                                      </div>
                                    </td>
                                    <td className="text-center permission-cell">
                                      <Input
                                        type="checkbox"
                                        checked={hasPermission(group.id, true, "read")}
                                        onChange={(e) => 
                                          handlePermissionChange(group.id, true, "read", e.target.checked)
                                        }
                                        className="permission-checkbox"
                                      />
                                    </td>
                                    <td className="text-center permission-cell">
                                      <Input
                                        type="checkbox"
                                        checked={hasPermission(group.id, true, "write")}
                                        onChange={(e) => 
                                          handlePermissionChange(group.id, true, "write", e.target.checked)
                                        }
                                        className="permission-checkbox"
                                      />
                                    </td>
                                    <td className="text-center permission-cell">
                                      <Input
                                        type="checkbox"
                                        checked={hasPermission(group.id, true, "delete")}
                                        onChange={(e) => 
                                          handlePermissionChange(group.id, true, "delete", e.target.checked)
                                        }
                                        className="permission-checkbox"
                                      />
                                    </td>
                                    <td className="text-center permission-cell">
                                      <Input
                                        type="checkbox"
                                        checked={hasPermission(group.id, true, "edit")}
                                        onChange={(e) => 
                                          handlePermissionChange(group.id, true, "edit", e.target.checked)
                                        }
                                        className="permission-checkbox"
                                      />
                                    </td>
                                  </tr>
                                )}
                                
                                {/* Group's menus with their nested children */}
                                {!group.isLink && group.menus && group.menus.length > 0 && renderMenuItems(group.menus)}
                                
                                {/* Empty group message */}
                                {!group.isLink && (!group.menus || group.menus.length === 0) && (
                                  <tr>
                                    <td colSpan={5} className="text-center text-muted">
                                      <i className="bx bx-info-circle me-1"></i>
                                      <i>No menus in this group</i>
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={7} className="text-center py-5">
                              <div className="text-muted">
                                <i className="bx bx-menu fs-1 d-block mb-2"></i>
                                No menu data available
                              </div>
                              <Button 
                                color="primary" 
                                size="sm" 
                                className="mt-2"
                                onClick={fetchAllMenuData}
                              >
                                <i className="bx bx-refresh me-1"></i>
                                Reload Menus
                              </Button>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </Table>
                  </div>
                  
                  {menuData && menuData.length > 0 && (
                    <div className="text-center text-muted small mt-3">
                      <i className="bx bx-bulb me-1"></i>
                      Tip: Use the checkboxes in column headers to select entire columns, group headers to select all menus in a group, or individual checkboxes for specific permissions.
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-5 my-4 border rounded bg-light">
                  <div className="avatar-lg mx-auto mb-4">
                    <div className="avatar-title bg-white text-primary display-5 rounded-circle shadow-sm">
                      <i className="bx bx-user-circle"></i>
                    </div>
                  </div>
                  <h5>Select a Role</h5>
                  <p className="text-muted">
                    Please select a role from the dropdown above to manage its permissions
                  </p>
                </div>
              )}
            </CardBody>
          </Card>
        </Container>
      </div>
      
      <style jsx>{`
        .menu-roles-table th, .menu-roles-table td {
          vertical-align: middle;
        }
        
        .menu-name-cell {
          position: relative;
        }
        
        .permission-cell {
          width: 80px;
          text-align: center;
        }
        
        .permission-checkbox {
          cursor: pointer;
          width: 18px;
          height: 18px;
        }
        
        .table-responsive {
          max-height: calc(100vh - 300px);
          overflow-y: auto;
        }
        
        .table-primary td {
          background-color: rgba(13, 110, 253, 0.15) !important;
        }
      `}</style>
    </React.Fragment>
  );
};

export default EmployeeRoles;