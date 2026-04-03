import React, {useEffect, useState, useContext } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { Collapse } from "reactstrap";
import { withTranslation } from "react-i18next";
import withRouter from "../../Components/Common/withRouter";
import { MenuContext } from "../../context/MenuContext";

const VerticalLayout = (props) => {
    const { menuData, loading, updateCurrentPagePermissions } = useContext(MenuContext);
    const [expandedItems, setExpandedItems] = useState({});
    
    const path = props.router.location.pathname;

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
        const initMenu = () => {
            const pathName = process.env.REACT_APP_API_URL_COFFEE + path;
            const ul = document.getElementById("navbar-nav");
            const items = ul.getElementsByTagName("a");
            let itemsArray = [...items];
            removeActivation(itemsArray);
            let matchingMenuItem = itemsArray.find((x) => {
                return x.pathname === pathName;
            });
            if (matchingMenuItem) {
                activateParentDropdown(matchingMenuItem);
            }
        };
        if (props.layoutType === "vertical") {
            initMenu();
        }
    }, [path, props.layoutType]);

    // Toggle expanded state for any menu item
    const toggleItem = (itemId) => {
        setExpandedItems(prev => ({
            ...prev,
            [itemId]: !prev[itemId]
        }));
    };

    function activateParentDropdown(item) {
        item.classList.add("active");
        let parentCollapseDiv = item.closest(".collapse.menu-dropdown");

        if (parentCollapseDiv) {
            // to set aria expand true remaining
            parentCollapseDiv.classList.add("show");
            parentCollapseDiv.parentElement.children[0].classList.add("active");
            parentCollapseDiv.parentElement.children[0].setAttribute(
                "aria-expanded",
                "true"
            );
            if (
                parentCollapseDiv.parentElement.closest(
                    ".collapse.menu-dropdown"
                )
            ) {
                parentCollapseDiv.parentElement
                    .closest(".collapse")
                    .classList.add("show");
                if (
                    parentCollapseDiv.parentElement.closest(".collapse")
                        .previousElementSibling
                )
                    parentCollapseDiv.parentElement
                        .closest(".collapse")
                        .previousElementSibling.classList.add("active");
                if (
                    parentCollapseDiv.parentElement
                        .closest(".collapse")
                        .previousElementSibling.closest(".collapse")
                ) {
                    parentCollapseDiv.parentElement
                        .closest(".collapse")
                        .previousElementSibling.closest(".collapse")
                        .classList.add("show");
                    parentCollapseDiv.parentElement
                        .closest(".collapse")
                        .previousElementSibling.closest(".collapse")
                        .previousElementSibling.classList.add("active");
                }
            }
            return false;
        }
        return false;
    }

    const removeActivation = (items) => {
        let actiItems = items.filter((x) => x.classList.contains("active"));

        actiItems.forEach((item) => {
            if (item.classList.contains("menu-link")) {
                if (!item.classList.contains("active")) {
                    item.setAttribute("aria-expanded", false);
                }
                if (item.nextElementSibling) {
                    item.nextElementSibling.classList.remove("show");
                }
            }
            if (item.classList.contains("nav-link")) {
                if (item.nextElementSibling) {
                    item.nextElementSibling.classList.remove("show");
                }
                item.setAttribute("aria-expanded", false);
            }
            item.classList.remove("active");
        });
    };

    // Handle menu item click to update current page permissions
    const handleMenuItemClick = (menuId) => {
        if (menuId) {
            updateCurrentPagePermissions(menuId);
        }
    };

    // Recursive function to render menu items at any nesting level
    const renderMenuItem = (item) => {
        // Handle edge cases
        if (!item || !item.menuName) {
            return null;
        }

        // If this item has children, render a collapsible menu
        if (item.isParent && item.children && item.children.length > 0) {
            return (
                <li className="nav-item" key={item.id}>
                    <Link
                        className="nav-link menu-link"
                        to="#"
                        data-bs-toggle="collapse"
                        onClick={() => toggleItem(item.id)}
                    >
                        <span>{item.menuName}</span>
                    </Link>
                    <Collapse className="menu-dropdown" isOpen={expandedItems[item.id]}>
                        <ul className="nav nav-sm flex-column">
                            {/* Recursively render child items */}
                            {item.children.map(child => renderMenuItem(child))}
                        </ul>
                    </Collapse>
                </li>
            );
        } 
        // Otherwise, render a regular link
        else {
            return (
                <li className="nav-item" key={item.id}>
                    <Link 
                        className="nav-link" 
                        to={item.url}
                        onClick={() => handleMenuItemClick(item.id)}
                    >
                        <span>{item.menuName}</span>
                    </Link>
                </li>
            );
        }
    };

    // Function to render a direct link menu group
    const renderDirectLinkMenuGroup = (group) => {
        // Validate the group object has the necessary properties
        if (!group || !group.menugroupName || !group.url) {
            return null;
        }
        
        return (
            <li className="nav-item" key={group.id}>
                <Link 
                    className="nav-link menu-link" 
                    to={group.url}
                    onClick={() => handleMenuItemClick(group.id)}
                >
                    <span>{group.menugroupName}</span>
                </Link>
            </li>
        );
    };

    // Function to render a menu group with its menu items
    const renderMenuGroup = (group) => {
        // Check if this is a direct link menu group
        if (group.isLink) {
            return renderDirectLinkMenuGroup(group);
        }
        
        // Validate the group object has the necessary properties
        if (!group || !group.menugroupName) {
            return null;
        }
        
        return (
            <li className="nav-item" key={group.id}>
                <Link
                    className="nav-link menu-link"
                    to="#"
                    data-bs-toggle="collapse"
                    onClick={() => toggleItem(group.id)}
                >
                    <span>{group.menugroupName}</span>
                </Link>

                <Collapse className="menu-dropdown" isOpen={expandedItems[group.id]}>
                    <ul className="nav nav-sm flex-column">
                        {group.menus && group.menus.length > 0 ? (
                            group.menus.map(menu => renderMenuItem(menu))
                        ) : (
                            <li className="nav-item">
                                <span className="nav-link">No items in this group</span>
                            </li>
                        )}
                    </ul>
                </Collapse>
            </li>
        );
    };

    return (
        <React.Fragment>
            <div className="mb-5">

            {/* menu Items */}
            <li className="menu-title">
                <span data-key="t-menu">Menu</span>
            </li>

            {loading ? (
                <li className="nav-item">
                    <span className="nav-link">Loading menus...</span>
                </li>
            ) : (
                Array.isArray(menuData) && menuData.length > 0 ? (
                    menuData.map(group => renderMenuGroup(group))
                ) : (
                    <li className="nav-item">
                        <span className="nav-link">No menu items available.</span>
                    </li>
                )
            )}
            </div>
        </React.Fragment>
    );
};

VerticalLayout.propTypes = {
    location: PropTypes.object,
    t: PropTypes.any,
};

export default withRouter(withTranslation()(VerticalLayout));
