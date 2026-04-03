/* eslint-disable default-case */
import React, { useContext, useEffect, useRef, useState, useCallback } from "react";
import { 
  Card, 
  CardBody, 
  Col, 
  Container, 
  Form, 
  Input, 
  Row, 
  Label
} from "reactstrap";
import AsyncSelect from "react-select/async";
import { debounce } from "lodash";
import BreadCrumb from "../../Components/Common/BreadCrumb";
import { AuthContext } from "../../context/AuthContext";
import { ToastContainer, toast } from "react-toastify";
import UiContent from "../../Components/Common/UiContent";
import LoadingOverlay from "../../Components/Common/LoadingOverlay";
import { searchCountries, searchStatesByCountry, searchCitiesByState } from "../../functions/Location/LocationNew";
import { updateCompanyNew } from "../../functions/Admin/adminFuncNew";

// CSS styles for React Select
const selectStyles = {
  control: (provided) => ({
    ...provided,
    minHeight: '48px',
    fontSize: '14px',
    borderColor: '#ced4da',
    '&:hover': {
      borderColor: '#adb5bd'
    }
  }),
  menu: (provided) => ({
    ...provided,
    zIndex: 9999
  }),
  option: (provided) => ({
    ...provided,
    fontSize: '14px'
  }),
  placeholder: (provided) => ({
    ...provided,
    fontSize: '14px',
    color: '#6c757d'
  })
};

const CompanyDetails = () => {
  const { adminData, getAdmin } = useContext(AuthContext);

  const [formErrors, setFormErrors] = useState({});
  const [isSubmit, setIsSubmit] = useState(false);
  const imageRef = useRef(null);

  const initialState = {
    companyName: adminData.companyName || "",
    email: adminData.email || "",
    emailSupport: adminData.supportEmail || "",
    mobile: adminData.mobile || "",
    countryId: adminData.countryId && typeof adminData.countryId === 'object' ? adminData.countryId.id : adminData.countryId || "",
    stateId: adminData.stateId && typeof adminData.stateId === 'object' ? adminData.stateId.id : adminData.stateId || "",
    cityId: adminData.cityId && typeof adminData.cityId === 'object' ? adminData.cityId.id : adminData.cityId || "",
    address: adminData.address || "",
    pincode: adminData.pincode || "",
    logo: adminData.logo || "",
    favicon: adminData.favicon || "",
    website: adminData.website || "",
    instagram: adminData.instagram || "",
    facebook: adminData.facebook || "",
    twitter: adminData.twitter || "",
    youtube: adminData.youtube || "",
  };

  const [values, setValues] = useState(initialState);
  
  // React Select state for dropdowns
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedState, setSelectedState] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [showFileInput, setShowFileInput] = useState(true);

  // favicon file upload states
  const [faviconFile, setFaviconFile] = useState(null);
  const [faviconPreview, setFaviconPreview] = useState("");
  const [showFaviconInput, setShowFaviconInput] = useState(true);
  const faviconRef = useRef(null);

  // Debounced search functions for AsyncSelect
  const loadCountryOptions = useCallback((inputValue, callback) => {
    const debouncedSearch = debounce(async () => {
      try {
        // If inputValue is empty or undefined, load default countries (first 10 countries)
        const searchTerm = inputValue || "";
        const response = await searchCountries(searchTerm, 1, 10);
        if (response.success) {
          const options = response.data.map(country => ({
            value: country.id,
            label: country.countryName,
            data: country
          }));
          callback(options);
        } else {
          callback([]);
        }
      } catch (error) {
        console.error("Error loading countries:", error);
        callback([]);
      }
    }, inputValue ? 300 : 0); // No delay for default options
    
    debouncedSearch();
  }, []);

  const loadStateOptions = useCallback((inputValue, callback) => {
    if (!selectedCountry) {
      callback([]);
      return;
    }
    
    const debouncedSearch = debounce(async () => {
      try {
        // If inputValue is empty or undefined, load default states (first 10 states)
        const searchTerm = inputValue || "";
        const response = await searchStatesByCountry(selectedCountry.value, searchTerm, 1, 10);
        if (response.success) {
          const options = response.data.map(state => ({
            value: state.id,
            label: state.stateName,
            data: state
          }));
          callback(options);
        } else {
          callback([]);
        }
      } catch (error) {
        console.error("Error loading states:", error);
        callback([]);
      }
    }, inputValue ? 300 : 0); // No delay for default options
    
    debouncedSearch();
  }, [selectedCountry]);

  const loadCityOptions = useCallback((inputValue, callback) => {
    if (!selectedState) {
      callback([]);
      return;
    }
    
    const debouncedSearch = debounce(async () => {
      try {
        // If inputValue is empty or undefined, load default cities (first 10 cities)
        const searchTerm = inputValue || "";
        const response = await searchCitiesByState(selectedState.value, searchTerm, 1, 10);
        if (response.success) {
          const options = response.data.map(city => ({
            value: city.id,
            label: city.cityName,
            data: city
          }));
          callback(options);
        } else {
          callback([]);
        }
      } catch (error) {
        console.error("Error loading cities:", error);
        callback([]);
      }
    }, inputValue ? 300 : 0); // No delay for default options
    
    debouncedSearch();
  }, [selectedState]);

  // Load initial options for existing data
  const loadInitialCountryOptions = useCallback(async () => {
    if (adminData?.country) {
      // If we have the full country object
      setSelectedCountry({
        value: adminData.country.id,
        label: adminData.country.countryName,
        data: adminData.country
      });
    } else if (adminData?.countryId) {
      // If we only have countryId, fetch the country details
      try {
        let countryOption = null;
        let currentPage = 1;
        const limit = 50;
        
        // Search through all pages to find the country
        while (!countryOption && currentPage <= 5) { // Limit to 5 pages for countries
          const response = await searchCountries("", currentPage, limit);
          
          if (response.success && response.data.length > 0) {
            countryOption = response.data.find(c => c.id === parseInt(adminData.countryId));
            
            if (countryOption) {
              setSelectedCountry({
                value: countryOption.id,
                label: countryOption.countryName,
                data: countryOption
              });
              break;
            }
            
            // If we've reached the last page, stop searching
            if (currentPage >= response.lastPage) {
              break;
            }
            
            currentPage++;
          } else {
            break;
          }
        }
      } catch (error) {
        console.error("Error loading initial country:", error);
      }
    }
  }, [adminData?.country, adminData?.countryId]);

  const loadInitialStateOptions = useCallback(async () => {
    console.log("loadInitialStateOptions called", { 
      hasState: !!adminData?.state, 
      hasStateId: !!adminData?.stateId, 
      hasSelectedCountry: !!selectedCountry,
      selectedCountryValue: selectedCountry?.value
    });
    
    if (adminData?.state && selectedCountry) {
      // If we have the full state object
      console.log("Setting state from full object:", adminData.state);
      setSelectedState({
        value: adminData.state.id,
        label: adminData.state.stateName,
        data: adminData.state
      });
    } else if (adminData?.stateId && selectedCountry) {
      // If we only have stateId, fetch the state details
      console.log("Fetching state by ID:", adminData.stateId, "for country:", selectedCountry.value);
      try {
        let stateOption = null;
        let currentPage = 1;
        const limit = 50;
        
        // Search through all pages to find the state
        while (!stateOption && currentPage <= 5) { // Limit to 5 pages for states
          const response = await searchStatesByCountry(selectedCountry.value, "", currentPage, limit);
          console.log(`States response page ${currentPage}:`, response);
          
          if (response.success && response.data.length > 0) {
            stateOption = response.data.find(s => s.id === parseInt(adminData.stateId));
            
            if (stateOption) {
              console.log("Found state option on page", currentPage, ":", stateOption);
              setSelectedState({
                value: stateOption.id,
                label: stateOption.stateName,
                data: stateOption
              });
              break;
            }
            
            // If we've reached the last page, stop searching
            if (currentPage >= response.lastPage) {
              break;
            }
            
            currentPage++;
          } else {
            break;
          }
        }
        
        if (!stateOption) {
          console.log("State not found in any page. Total pages searched:", currentPage - 1);
        }
      } catch (error) {
        console.error("Error loading initial state:", error);
      }
    }
  }, [adminData?.state, adminData?.stateId, selectedCountry]);

  const loadInitialCityOptions = useCallback(async () => {
    console.log("loadInitialCityOptions called", { 
      hasCity: !!adminData?.city, 
      hasCityId: !!adminData?.cityId, 
      hasSelectedState: !!selectedState,
      selectedStateValue: selectedState?.value
    });
    
    if (adminData?.city && selectedState) {
      // If we have the full city object
      console.log("Setting city from full object:", adminData.city);
      setSelectedCity({
        value: adminData.city.id,
        label: adminData.city.cityName,
        data: adminData.city
      });
    } else if (adminData?.cityId && selectedState) {
      // If we only have cityId, fetch the city details
      console.log("Fetching city by ID:", adminData.cityId, "for state:", selectedState.value);
      try {
        let cityOption = null;
        let currentPage = 1;
        const limit = 50;
        
        // Search through all pages to find the city
        while (!cityOption && currentPage <= 10) { // Limit to 10 pages to avoid infinite loop
          const response = await searchCitiesByState(selectedState.value, "", currentPage, limit);
          console.log(`Cities response page ${currentPage}:`, response);
          
          if (response.success && response.data.length > 0) {
            cityOption = response.data.find(c => c.id === parseInt(adminData.cityId));
            
            if (cityOption) {
              console.log("Found city option on page", currentPage, ":", cityOption);
              setSelectedCity({
                value: cityOption.id,
                label: cityOption.cityName,
                data: cityOption
              });
              break;
            }
            
            // If we've reached the last page, stop searching
            if (currentPage >= response.lastPage) {
              break;
            }
            
            currentPage++;
          } else {
            break;
          }
        }
        
        if (!cityOption) {
          console.log("City not found in any page. Total pages searched:", currentPage - 1);
        }
      } catch (error) {
        console.error("Error loading initial city:", error);
      }
    }
  }, [adminData?.city, adminData?.cityId, selectedState]);

  // Set initial selected values from adminData
  useEffect(() => {
    if (adminData) {
      
      // Update values when adminData changes
      setValues({
        companyName: adminData.companyName || "",
        email: adminData.email || "",
        supportEmail: adminData.supportEmail || "",
        mobile: adminData.mobile || "",
        countryId: adminData.countryId && typeof adminData.countryId === 'object' ? adminData.countryId.id : adminData.countryId || "",
        stateId: adminData.stateId && typeof adminData.stateId === 'object' ? adminData.stateId.id : adminData.stateId || "",
        cityId: adminData.cityId && typeof adminData.cityId === 'object' ? adminData.cityId.id : adminData.cityId || "",
        address: adminData.address || "",
        pincode: adminData.pincode || "",
        logo: adminData.logo || "",
        favicon: adminData.favicon || "",
        website: adminData.website || "",
      });

      // Load initial dropdown selections if data exists
      loadInitialCountryOptions();
    }
  }, [adminData, loadInitialCountryOptions]);

  // Load initial state when country is loaded
  useEffect(() => {
    if (selectedCountry && (adminData?.state || adminData?.stateId)) {
      loadInitialStateOptions();
    }
  }, [selectedCountry, adminData?.state, adminData?.stateId, loadInitialStateOptions]);

  // Load initial city when state is loaded
  useEffect(() => {
    if (selectedState && (adminData?.city || adminData?.cityId)) {
      // Add a small delay to ensure the state is properly set
      const timer = setTimeout(() => {
        loadInitialCityOptions();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [selectedState, adminData?.city, adminData?.cityId, loadInitialCityOptions]);

  useEffect(() => {
    if (adminData.logo) {
      setLogoPreview(adminData.logo);
      setShowFileInput(false); // Hide file input when logo exists
    }
  }, [adminData.logo]);

  useEffect(() => {
    if (adminData.favicon) {
      setFaviconPreview(adminData.favicon);
      setShowFaviconInput(false); // Hide file input when favicon exists
    }
  }, [adminData.favicon]);

  // Validate every field and specific validations for mobile and pincode
  const validate = (values) => {
    let errors = {};
    const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
    
    if (!values.companyName.trim()) {
      errors.companyName = "Company name is required";
    }
    if (!values.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(values.email)) {
      errors.email = "Invalid email address";
    }
    if (!values.mobile.trim()) {
      errors.mobile = "Mobile number is required";
    } else if (values.mobile.length !== 10) {
      errors.mobile = "Mobile number must be 10 digits";
    }
    // GST Number is optional, but if provided, it should have a valid format
    if (values.gstNumber && values.gstNumber.trim() && values.gstNumber.length !== 15) {
      errors.gstNumber = "GST number must be 15 characters";
    }
    if (!values.countryId) {
      errors.countryId = "Country is required";
    }
    if (!values.stateId) {
      errors.stateId = "State is required";
    }
    if (!values.address.trim()) {
      errors.address = "Address is required";
    }
    if (!values.pincode.trim()) {
      errors.pincode = "Pincode is required";
    } else if (values.pincode.length !== 6) {
      errors.pincode = "Pincode must be 6 digits";
    }
    if (!values.website.trim()) {
      errors.website = "Website is required";
    } else if (!urlPattern.test(values.website)) {
      errors.website = "Please enter a valid website URL";
    }
    
    // Validate social media URLs (optional fields)
    if (values.instagram && values.instagram.trim() && !urlPattern.test(values.instagram)) {
      errors.instagram = "Please enter a valid Instagram URL";
    }
    if (values.facebook && values.facebook.trim() && !urlPattern.test(values.facebook)) {
      errors.facebook = "Please enter a valid Facebook URL";
    }
    if (values.twitter && values.twitter.trim() && !urlPattern.test(values.twitter)) {
      errors.twitter = "Please enter a valid Twitter URL";
    }
    if (values.youtube && values.youtube.trim() && !urlPattern.test(values.youtube)) {
      errors.youtube = "Please enter a valid YouTube URL";
    }
    
    return errors;
  };

  const hasChanges = () => {
    const currentValues = { ...values };
    const originalValues = { ...adminData };
    return JSON.stringify(currentValues) !== JSON.stringify(originalValues) || selectedFile !== null || faviconFile !== null;
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setLogoPreview(URL.createObjectURL(file));
      setShowFileInput(false); // Hide file input after selection
    }
  };

  // favicon file handling functions
  const handleFaviconChange = (e) => {
    const file = e.target.files[0];
    
    if (file) {
      // Check file size (1MB = 1 * 1024 * 1024 bytes)
      if (file.size > 1 * 1024 * 1024) {
        toast.error("File size should not exceed 1MB");
        e.target.value = "";
        return;
      }

      // Check if it's an image file
      if (!file.type.startsWith('image/')) {
        toast.error("Only image files are allowed for favicon");
        e.target.value = "";
        return;
      }

      setFaviconFile(file);
      setFaviconPreview(URL.createObjectURL(file));
      setShowFaviconInput(false); // Hide file input after selection
    }
  };

  const resetFaviconStates = () => {
    setFaviconFile(null);
    setFaviconPreview("");
    setShowFaviconInput(true);
    if (faviconRef.current) {
      faviconRef.current.value = ""; // Clears the file input
    }
  };

  const handleRemoveFavicon = () => {
    setFaviconPreview("");
    setFaviconFile(null);
    setValues({ ...values, favicon: "" });
    setShowFaviconInput(true); // Show file input when favicon is removed
    if (faviconRef.current) {
      faviconRef.current.value = ""; // Clears the file input
    }
  };

  useEffect(() => {
    if (!selectedFile && values.logo) {
      setLogoPreview(values.logo);
      setShowFileInput(false);
    }
  }, [values.logo, selectedFile]);  

  const handleUpdate = async (e) => {
    e.preventDefault();
    const errors = validate(values);
    setFormErrors(errors);
    setIsSubmit(true);
    if (Object.keys(errors).length !== 0) {
      return;
    }
    const formData = new FormData();
    for (let key in values) {
      if (key === "countryId" || key === "stateId" || key === "cityId") {
        // If it's an object with _id, use the _id, otherwise use the value directly
        const idValue = values[key] && typeof values[key] === 'object' ? values[key]._id : values[key];
        formData.append(key, idValue);
      } else {
        formData.append(key, values[key]);
      }
    }
    if (selectedFile) {
      formData.append("logo", selectedFile);
    }
    if (faviconFile) {
      formData.append("favicon", faviconFile);
    }
    setIsLoading(true);
    
    try {
      const response = await updateCompanyNew(adminData.companyId || adminData.id, formData);
      if (response.success) {
        toast.success("Company details updated successfully");
        getAdmin();
        // Reset file states after successful update
        setSelectedFile(null);
        resetFaviconStates();
      } else {
        toast.error(response.message || "Failed to update company details");
      }
    } catch (error) {
      console.error("Error updating company details:", error);
      toast.error("Failed to update company details");
    } finally {
      setIsLoading(false);
    }
  };

  // Allow only numeric input for mobile and pincode
  const handleChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;
    
    if (name === "mobile" || name === "pincode") {
      newValue = value.replace(/\D/g, "");
    }
    
    setValues({ ...values, [name]: newValue });
  };

  // Handle country selection from AsyncSelect
  const handleCountryChange = (selectedOption) => {
    setSelectedCountry(selectedOption);
    // Clear state and city when country changes
    setSelectedState(null);
    setSelectedCity(null);
    setValues({ 
      ...values, 
      countryId: selectedOption?.value || "",
      stateId: "",
      cityId: ""
    });
  };

  // Handle state selection from AsyncSelect
  const handleStateChange = (selectedOption) => {
    setSelectedState(selectedOption);
    // Clear city when state changes
    setSelectedCity(null);
    setValues({ 
      ...values, 
      stateId: selectedOption?.value || "",
      cityId: ""
    });
  };

  // Handle city selection from AsyncSelect
  const handleCityChange = (selectedOption) => {
    setSelectedCity(selectedOption);
    setValues({ ...values, cityId: selectedOption?.value || "" });
  };

  // Key for forcing React Select to recreate components when dependencies change
  const stateSelectKey = selectedCountry ? `state-${selectedCountry.value}` : 'state-empty';
  const citySelectKey = selectedState ? `city-${selectedState.value}` : 'city-empty';

  const handleRemoveLogo = () => {
    setLogoPreview("");
    setSelectedFile(null);
    setValues({ ...values, logo: "" });
    setShowFileInput(true); // Show file input when logo is removed
    if (imageRef.current) {
      imageRef.current.value = ""; // Clears the file input
    }
  };

  document.title = `Company Details | Shree Balaji Trade-Wing`;

  return (
    <React.Fragment>
      <UiContent />
      <ToastContainer />
      <div className="page-content">
        {isLoading && <LoadingOverlay />}
        <Container fluid>
          <BreadCrumb maintitle="Setup" title="Company Details" pageTitle="Setup" />
          <Row>
            <Col lg={12}>
              <Card>
                <div>
                  <CardBody>
                    <React.Fragment>
                      <Col xxl={12}>
                        <Card className="">
                          <CardBody>
                            <div className="live-preview">
                              <Row>
                                <Col lg={3}>
                                  <Row>
                                    <Col lg={12}>
                                    <Card>
                                      <CardBody>
                                          <label>Logo</label>
                                      <div className="form-floating mb-3">
                                          {showFileInput ? (
                                            <input
                                              type="file"
                                              name="logo"
                                              className="form-control mt-2"
                                              accept=".jpg, .jpeg, .png"
                                              onChange={handleFileChange}
                                              ref={imageRef}
                                            />
                                          ) : null}
                                          
                                          {isSubmit && formErrors.logo && <p className="text-danger">{formErrors.logo}</p>}
                                          
                                          {logoPreview && (
                                            <div style={{ position: "relative", display: "inline-block", marginTop: "10px" }}>
                                              <img
                                                src={logoPreview}
                                                alt="Logo Preview"
                                                style={{
                                                  width: "100px",
                                                  height: "100px",
                                                  objectFit: "cover",
                                                  border: "1px solid #ccc",
                                                }}
                                              />
                                              <button
                                                type="button"
                                                onClick={handleRemoveLogo}
                                                style={{
                                                  position: "absolute",
                                                  top: "-5px",
                                                  right: "-5px",
                                                  background: "red",
                                                  color: "white",
                                                  border: "none",
                                                  borderRadius: "50%",
                                                  width: "20px",
                                                  height: "20px",
                                                  cursor: "pointer",
                                                }}
                                              >
                                                &times;
                                              </button>
                                            </div>
                                          )}
                                          
                                          {!showFileInput && (
                                            <div className="mt-2">
                                              <button
                                                type="button"
                                                className="btn btn-sm btn-primary"
                                                onClick={() => setShowFileInput(true)}
                                              >
                                                Change Logo
                                              </button>
                                            </div>
                                          )}
                                        </div>
                                      </CardBody>
                                    </Card>
                                    </Col>
                                  </Row>
                                <Row>
                                  <Col lg={12}>
                                    <Card>
                                      <CardBody>
                                        <Label className="form-label">
                                          Favicon <span className="text-muted">(Max 1MB)</span>
                                        </Label>
                                        {showFaviconInput ? (
                                          <input
                                            type="file"
                                            name="favicon"
                                            className="form-control mt-2"
                                            accept=".jpg, .jpeg, .png, .ico"
                                            onChange={handleFaviconChange}
                                            ref={faviconRef}
                                          />
                                        ) : null}
                                        
                                        {faviconPreview && (
                                          <div style={{ position: "relative", display: "inline-block", marginTop: "10px" }}>
                                            <img
                                              src={faviconPreview}
                                              alt="Favicon Preview"
                                              style={{
                                                width: "32px",
                                                height: "32px",
                                                objectFit: "cover",
                                                border: "1px solid #ccc",
                                              }}
                                            />
                                            <button
                                              type="button"
                                              onClick={handleRemoveFavicon}
                                              style={{
                                                position: "absolute",
                                                top: "-5px",
                                                right: "-5px",
                                                background: "red",
                                                color: "white",
                                                border: "none",
                                                borderRadius: "50%",
                                                width: "20px",
                                                height: "20px",
                                                cursor: "pointer",
                                                fontSize: "12px",
                                              }}
                                            >
                                              ×
                                            </button>
                                          </div>
                                        )}
                                      </CardBody>
                                    </Card>
                                  </Col>
                                </Row>
                                </Col>
                                <Col lg={9}>
                                  <Card>
                                    <CardBody>
                                      <div className="live-preview">
                                        <Form>
                                          <Row>
                                            <Col lg={3}>
                                              <div className="form-floating mb-3">
                                                <input
                                                  type="text"
                                                  className="form-control"
                                                  placeholder="Enter Company name"
                                                  required
                                                  name="companyName"
                                                  value={values.companyName}
                                                  onChange={handleChange}
                                                />
                                                <label className="form-label">
                                                  Company name
                                                  <span className="text-danger"> *</span>
                                                </label>
                                                {isSubmit && formErrors.companyName && (
                                                  <p className="text-danger">
                                                    {formErrors.companyName}
                                                  </p>
                                                )}
                                              </div>
                                            </Col>
                                            <Col lg={3}>
                                              <div className="form-floating mb-3">
                                                <input
                                                  type="text"
                                                  className="form-control"
                                                  placeholder="Enter Email"
                                                  required
                                                  name="email"
                                                  value={values.email}
                                                  onChange={handleChange}
                                                />
                                                <label className="form-label">
                                                  Email
                                                  <span className="text-danger"> *</span>
                                                </label>
                                                {isSubmit && formErrors.email && (
                                                  <p className="text-danger">
                                                    {formErrors.email}
                                                  </p>
                                                )}
                                              </div>
                                            </Col>
                                            <Col lg={3}>
                                              <div className="form-floating mb-3">
                                                <input
                                                  type="text"
                                                  className="form-control"
                                                  placeholder="Website"
                                                  required
                                                  name="website"
                                                  value={values.website}
                                                  onChange={handleChange}
                                                  maxLength={100}
                                                />
                                                <label className="form-label">
                                                  Website
                                                  <span className="text-danger"> *</span>
                                                </label>
                                                {isSubmit && formErrors.website && (
                                                  <p className="text-danger">
                                                    {formErrors.website}
                                                  </p>
                                                )}
                                              </div>
                                            </Col>
                                            <Col lg={3}>
                                              <div className="form-floating mb-3">
                                                <input
                                                  type="text"
                                                  className="form-control"
                                                  placeholder="Mobile Number"
                                                  required
                                                  name="mobile"
                                                  value={values.mobile}
                                                  onChange={handleChange}
                                                  maxLength={10}
                                                />
                                                <label className="form-label">
                                                  Mobile Number
                                                  <span className="text-danger"> *</span>
                                                </label>
                                                {isSubmit && formErrors.mobile && (
                                                  <p className="text-danger">
                                                    {formErrors.mobile}
                                                  </p>
                                                )}
                                              </div>
                                            </Col>
                                            <Col lg={3}>
                                              <div className="form-floating mb-3">
                                                <input
                                                  type="text"
                                                  className="form-control"
                                                  placeholder="Support Email"
                                                  required
                                                  name="supportEmail"
                                                  value={values.supportEmail}
                                                  onChange={handleChange}
                                                  maxLength={100}
                                                />
                                                <label className="form-label">
                                                  Support Email
                                                  <span className="text-danger"> *</span>
                                                </label>
                                                {isSubmit && formErrors.supportEmail && (
                                                  <p className="text-danger">
                                                    {formErrors.supportEmail}
                                                  </p>
                                                )}
                                              </div>
                                            </Col>
                                          </Row>
                                          <Row>
                                            <Col lg={3}>
                                              <div className="mb-3">
                                                <label className="form-label">
                                                  Country
                                                  <span className="text-danger"> *</span>
                                                </label>
                                                <AsyncSelect
                                                  loadOptions={loadCountryOptions}
                                                  value={selectedCountry}
                                                  onChange={handleCountryChange}
                                                  placeholder="Search and select country..."
                                                  isClearable
                                                  isSearchable
                                                  defaultOptions
                                                  cacheOptions
                                                  loadingMessage={() => "Loading countries..."}
                                                  noOptionsMessage={() => "No countries found"}
                                                  styles={selectStyles}
                                                  className="react-select-container"
                                                  classNamePrefix="react-select"
                                                />
                                                {isSubmit && formErrors.countryId && (
                                                  <p className="text-danger">
                                                    {formErrors.countryId}
                                                  </p>
                                                )}
                                              </div>
                                            </Col>
                                            <Col lg={3}>
                                              <div className="mb-3">
                                                <label className="form-label">
                                                  State
                                                  <span className="text-danger"> *</span>
                                                </label>
                                                <AsyncSelect
                                                  key={stateSelectKey}
                                                  loadOptions={loadStateOptions}
                                                  value={selectedState}
                                                  onChange={handleStateChange}
                                                  placeholder={!selectedCountry ? "Select country first..." : "Search and select state..."}
                                                  isClearable
                                                  isSearchable
                                                  isDisabled={!selectedCountry}
                                                  defaultOptions={selectedCountry ? true : false}
                                                  cacheOptions
                                                  loadingMessage={() => "Loading states..."}
                                                  noOptionsMessage={() => !selectedCountry ? "Please select a country first" : "No states found"}
                                                  styles={selectStyles}
                                                  className="react-select-container"
                                                  classNamePrefix="react-select"
                                                />
                                                {isSubmit && formErrors.stateId && (
                                                  <p className="text-danger">
                                                    {formErrors.stateId}
                                                  </p>
                                                )}
                                              </div>
                                            </Col>
                                            <Col lg={3}>
                                              <div className="mb-3">
                                                <label className="form-label">
                                                  City
                                                </label>
                                                <AsyncSelect
                                                  key={citySelectKey}
                                                  loadOptions={loadCityOptions}
                                                  value={selectedCity}
                                                  onChange={handleCityChange}
                                                  placeholder={!selectedState ? "Select state first..." : "Search and select city..."}
                                                  isClearable
                                                  isSearchable
                                                  isDisabled={!selectedState}
                                                  defaultOptions={selectedState ? true : false}
                                                  cacheOptions
                                                  loadingMessage={() => "Loading cities..."}
                                                  noOptionsMessage={() => !selectedState ? "Please select a state first" : "No cities found"}
                                                  styles={selectStyles}
                                                  className="react-select-container"
                                                  classNamePrefix="react-select"
                                                />
                                                {isSubmit && formErrors.cityId && (
                                                  <p className="text-danger">
                                                    {formErrors.cityId}
                                                  </p>
                                                )}
                                              </div>
                                            </Col>
                                            <Col lg={3}>
                                              <div className="mb-3">
                                                <label className="form-label">
                                                  Pincode
                                                  <span className="text-danger"> *</span>
                                                </label>
                                                <Input
                                                  type="text"
                                                  className="form-control"
                                                  placeholder="Enter Pincode"
                                                  required
                                                  name="pincode"
                                                  value={values.pincode}
                                                  onChange={handleChange}
                                                  maxLength={6}
                                                />
                                                {isSubmit && formErrors.pincode && (
                                                  <p className="text-danger">
                                                    {formErrors.pincode}
                                                  </p>
                                                )}
                                              </div>
                                            </Col>
                                          </Row>
                                          <Row>
                                            <Col lg={12}>
                                              <div className="form-floating mb-3">
                                                <Input
                                                  type="textarea"
                                                  className="form-control"
                                                  placeholder="Enter Address"
                                                  required
                                                  name="address"
                                                  style={{ height: "100px" }}
                                                  value={values.address}
                                                  onChange={handleChange}
                                                />
                                                <label htmlFor="role-field" className="form-label">
                                                  Address
                                                  <span className="text-danger"> *</span>
                                                </label>
                                                {isSubmit && formErrors.address && (
                                                  <p className="text-danger">
                                                    {formErrors.address}
                                                  </p>
                                                )}
                                              </div>
                                            </Col>
                                          </Row>
                                          <Row>
                                            <Col lg={12}>
                                              <h6 className="mb-3 text-muted">Social Media Links <small>(Optional)</small></h6>
                                            </Col>
                                          </Row>
                                          <Row>
                                            <Col lg={3}>
                                              <div className="form-floating mb-3">
                                                <input
                                                  type="url"
                                                  className="form-control"
                                                  placeholder="Instagram URL"
                                                  name="instagram"
                                                  value={values.instagram}
                                                  onChange={handleChange}
                                                />
                                                <label className="form-label">
                                                  Instagram URL
                                                </label>
                                                {isSubmit && formErrors.instagram && (
                                                  <p className="text-danger">
                                                    {formErrors.instagram}
                                                  </p>
                                                )}
                                              </div>
                                            </Col>
                                            <Col lg={3}>
                                              <div className="form-floating mb-3">
                                                <input
                                                  type="url"
                                                  className="form-control"
                                                  placeholder="Facebook URL"
                                                  name="facebook"
                                                  value={values.facebook}
                                                  onChange={handleChange}
                                                />
                                                <label className="form-label">
                                                  Facebook URL
                                                </label>
                                                {isSubmit && formErrors.facebook && (
                                                  <p className="text-danger">
                                                    {formErrors.facebook}
                                                  </p>
                                                )}
                                              </div>
                                            </Col>
                                            <Col lg={3}>
                                              <div className="form-floating mb-3">
                                                <input
                                                  type="url"
                                                  className="form-control"
                                                  placeholder="Twitter URL"
                                                  name="twitter"
                                                  value={values.twitter}
                                                  onChange={handleChange}
                                                />
                                                <label className="form-label">
                                                  Twitter URL
                                                </label>
                                                {isSubmit && formErrors.twitter && (
                                                  <p className="text-danger">
                                                    {formErrors.twitter}
                                                  </p>
                                                )}
                                              </div>
                                            </Col>
                                            <Col lg={3}>
                                              <div className="form-floating mb-3">
                                                <input
                                                  type="url"
                                                  className="form-control"
                                                  placeholder="YouTube URL"
                                                  name="youtube"
                                                  value={values.youtube}
                                                  onChange={handleChange}
                                                />
                                                <label className="form-label">
                                                  YouTube URL
                                                </label>
                                                {isSubmit && formErrors.youtube && (
                                                  <p className="text-danger">
                                                    {formErrors.youtube}
                                                  </p>
                                                )}
                                              </div>
                                            </Col>
                                          </Row>
                                        </Form>
                                      </div>
                                    </CardBody>
                                  </Card>
                                </Col>
                              </Row>
                              <Row></Row>
                              <Col lg={12}>
                                <div className="text-end">
                                  <button
                                    type="submit"
                                    className="btn btn-success m-1"
                                    id="add-btn"
                                    onClick={handleUpdate}
                                    disabled={!hasChanges()}
                                  >
                                    Update
                                  </button>
                                </div>
                              </Col>
                            </div>
                          </CardBody>
                        </Card>
                      </Col>
                    </React.Fragment>
                  </CardBody>
                </div>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>

    </React.Fragment>
  );
};

export default CompanyDetails;
