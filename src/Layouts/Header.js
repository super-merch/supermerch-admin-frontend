import React, { useContext, useState, useMemo, useRef, useEffect } from "react";
import Select from "react-select";
import { useNavigate } from "react-router-dom";
import ProfileDropdown from "../Components/Common/ProfileDropdown";
import { MenuContext } from "../context/MenuContext";

const Header = ({ onChangeLayoutMode, layoutModeType, headerClass }) => {
    const { menuData, isAdmin, employeeRoles } = useContext(MenuContext);
    const navigate = useNavigate();
    const [selectedOption, setSelectedOption] = useState(null);
    const selectRef = useRef(null);

    // Build search options from menu data
    const searchOptions = useMemo(() => {
        if (!Array.isArray(menuData)) return [];
        
        const options = [];
        
        // Function to recursively extract menus
        const extractMenus = (menus, groupName = '') => {
            if (!Array.isArray(menus)) return;
            
            menus.forEach(menu => {
                // Only add menu to options if it's not a parent menu
                if (!menu.isParent) {
                    options.push({
                        value: menu.url,
                        label: groupName ? `${groupName} > ${menu.menuName}` : menu.menuName,
                        type: 'menu',
                        menuId: menu.id
                    });
                }
                
                // Recursively add child menus
                if (menu.children && menu.children.length > 0) {
                    extractMenus(menu.children, groupName ? `${groupName} > ${menu.menuName}` : menu.menuName);
                }
            });
        };
        
        // Process each menu group
        menuData.forEach(group => {
            // If group is a direct link, add it as an option
            if (group.isLink && group.url) {
                options.push({
                    value: group.url,
                    label: group.menugroupName,
                    type: 'group',
                    menuId: group.id
                });
            }
            
            // Extract menus from the group
            if (group.menus && group.menus.length > 0) {
                extractMenus(group.menus, group.menugroupName);
            }
        });
        
        // Filter based on permissions
        const filteredOptions = options.filter(option => {
            if (isAdmin) return true; // Admin can see all
            
            if (!employeeRoles || !employeeRoles.roles) return false;
            
            // Check if user has read permission for this menu/group
            const hasPermission = employeeRoles.roles.some(role => 
                role.menuId === option.menuId && role.read
            );
            
            return hasPermission;
        });
        
        return filteredOptions.sort((a, b) => a.label.localeCompare(b.label));
    }, [menuData, isAdmin, employeeRoles]);

    // Handle search selection
    const handleSearchSelect = (selectedOption) => {
        if (selectedOption && selectedOption.value) {
            navigate(selectedOption.value);
            setSelectedOption(null); // Clear selection after navigation
        }
    };

    // Handle keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (event) => {
            // Check for Ctrl+S (or Cmd+S on Mac)
            if ((event.ctrlKey || event.metaKey) && event.key === 's') {
                event.preventDefault(); // Prevent default save behavior
                if (selectRef.current) {
                    selectRef.current.focus();
                    // Small delay to ensure focus is set before opening
                    setTimeout(() => {
                        if (selectRef.current) {
                            selectRef.current.openMenu();
                        }
                    }, 100);
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    // Custom styles for react-select
    const selectStyles = {
        control: (provided, state) => ({
            ...provided,
            minHeight: '38px',
            height: '38px',
            fontSize: '14px',
            borderColor: state.isFocused ? '#405189' : '#ced4da',
            boxShadow: state.isFocused ? '0 0 0 0.2rem rgba(13, 110, 253, 0.25)' : 'none',
            '&:hover': {
                borderColor: '#405189'
            },
            backgroundColor: '#fff',
            cursor: 'text'
        }),
        valueContainer: (provided) => ({
            ...provided,
            height: '36px',
            padding: '0 8px'
        }),
        input: (provided) => ({
            ...provided,
            margin: '0px'
        }),
        indicatorSeparator: () => ({
            display: 'none'
        }),
        indicatorsContainer: (provided) => ({
            ...provided,
            height: '36px'
        }),
        menu: (provided) => ({
            ...provided,
            zIndex: 9999,
            fontSize: '14px'
        }),
        option: (provided, state) => ({
            ...provided,
            fontSize: '14px',
            backgroundColor: state.isSelected 
                ? '#405189' 
                : state.isFocused 
                ? '#f8f9fa' 
                : 'white',
            color: state.isSelected ? 'white' : '#495057',
            '&:hover': {
                backgroundColor: state.isSelected ? '#405189' : '#f8f9fa'
            }
        }),
        placeholder: (provided) => ({
            ...provided,
            fontSize: '14px',
            color: '#6c757d'
        }),
        noOptionsMessage: (provided) => ({
            ...provided,
            fontSize: '14px'
        })
    };

    const toogleMenuBtn = () => {
        var windowSize = document.documentElement.clientWidth;

        if (windowSize > 767)
            document.querySelector(".hamburger-icon").classList.toggle("open");

        //For collapse horizontal menu
        if (
            document.documentElement.getAttribute("data-layout") ===
            "horizontal"
        ) {
            document.body.classList.contains("menu")
                ? document.body.classList.remove("menu")
                : document.body.classList.add("menu");
        }

        //For collapse vertical menu
        if (
            document.documentElement.getAttribute("data-layout") === "vertical"
        ) {
            if (windowSize < 1025 && windowSize > 767) {
                document.body.classList.remove("vertical-sidebar-enable");
                document.documentElement.getAttribute("data-sidebar-size") ===
                "sm"
                    ? document.documentElement.setAttribute(
                          "data-sidebar-size",
                          ""
                      )
                    : document.documentElement.setAttribute(
                          "data-sidebar-size",
                          "sm"
                      );
            } else if (windowSize > 1025) {
                document.body.classList.remove("vertical-sidebar-enable");
                document.documentElement.getAttribute("data-sidebar-size") ===
                "lg"
                    ? document.documentElement.setAttribute(
                          "data-sidebar-size",
                          "sm"
                      )
                    : document.documentElement.setAttribute(
                          "data-sidebar-size",
                          "lg"
                      );
            } else if (windowSize <= 767) {
                document.body.classList.add("vertical-sidebar-enable");
                document.documentElement.setAttribute(
                    "data-sidebar-size",
                    "lg"
                );
            }
        }

        //Two column menu
        if (
            document.documentElement.getAttribute("data-layout") === "twocolumn"
        ) {
            document.body.classList.contains("twocolumn-panel")
                ? document.body.classList.remove("twocolumn-panel")
                : document.body.classList.add("twocolumn-panel");
        }
    };
    return (
        <React.Fragment>
            <header id="page-topbar" className="shadow-lg">
                <div className="">
                    <div className="d-flex align-items-center justify-content-between" 
                    // style={{height: "50px"}}
                    > 
                        <div className="d-flex">

                            <button
                                onClick={toogleMenuBtn}
                                type="button"
                                className="btn btn-sm px-3 fs-16 header-item vertical-menu-btn topnav-hamburger"
                                id="topnav-hamburger-icon"
                            >
                                <span className="hamburger-icon">
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </span>
                            </button>
                        </div>

                        <div className="d-flex align-items-center flex-grow-1 justify-content-center">
                            <div style={{ width: '400px', maxWidth: '50vw' }}>
                                <Select
                                    ref={selectRef}
                                    value={selectedOption}
                                    onChange={handleSearchSelect}
                                    options={searchOptions}
                                    styles={selectStyles}
                                    placeholder="Search menus... (Ctrl+S)"
                                    isSearchable
                                    isClearable
                                    noOptionsMessage={() => "No menus found"}
                                    filterOption={(option, searchText) => {
                                        if (!searchText) return true;
                                        return option.label.toLowerCase().includes(searchText.toLowerCase());
                                    }}
                                />
                            </div>
                        </div>

                        <div className="d-flex align-items-center">
                            <ProfileDropdown />
                        </div>
                    </div>
                </div>
            </header>
        </React.Fragment>
    );
};

export default Header;
