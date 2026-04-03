import React, { useState, useEffect } from "react";
import {
    Card,
    CardBody,
    CardHeader,
    Label,
    Input,
    Button,
    Table,
    FormFeedback,
    Alert,
    Badge,
    Row,
    Col,
} from "reactstrap";
import axios from "axios";
import { toast } from "react-toastify";

/**
 * ProductPricingCalculator Component
 * 
 * Integrates with brand price tier templates to auto-calculate product pricing.
 * Features:
 * - Fetches brand template when brand is selected
 * - Auto-calculates tiers from first tier price using brand discounts
 * - Allows manual override of calculated prices
 * - Supports cost price + first tier margin calculation
 * - Visual indicators for brand template vs manual pricing
 */
const ProductPricingCalculator = ({
    brandId,
    priceTiers,
    onChange,
    isSubmit,
    formErrors,
}) => {
    // Local state
    const [brandTemplate, setBrandTemplate] = useState(null);
    const [loadingTemplate, setLoadingTemplate] = useState(false);
    const [costPrice, setCostPrice] = useState("");
    const [firstTierPrice, setFirstTierPrice] = useState("");
    const [calculatedTiers, setCalculatedTiers] = useState([]);
    const [manualMode, setManualMode] = useState(false);
    const [localPriceTiers, setLocalPriceTiers] = useState([]);

    // Fetch brand template when brand changes
    useEffect(() => {
        if (brandId && brandId !== "") {
            fetchBrandTemplate(brandId);
        } else {
            setBrandTemplate(null);
            setCalculatedTiers([]);
        }
    }, [brandId]);

    // Sync with parent component
    useEffect(() => {
        setLocalPriceTiers(Array.isArray(priceTiers) ? priceTiers : []);
    }, [priceTiers]);

    const fetchBrandTemplate = async (brandId) => {
        setLoadingTemplate(true);
        try {
            const response = await axios.get(
                `/api/brands/${brandId}/price-tiers`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                }
            );

            if (response.data.success) {
                setBrandTemplate(response.data.data);
                toast.success("Brand pricing template loaded");
            } else {
                toast.warning("No pricing template found for this brand");
                setBrandTemplate(null);
            }
        } catch (error) {
            console.error("Error fetching brand template:", error);
            if (error.response?.status === 404) {
                toast.info("No pricing template configured for this brand");
            } else {
                toast.error("Failed to load brand pricing template");
            }
            setBrandTemplate(null);
        } finally {
            setLoadingTemplate(false);
        }
    };

    // Calculate first tier price from cost price using brand margin
    const handleCalculateFromCost = () => {
        if (!costPrice || !brandTemplate) {
            toast.error("Please enter cost price");
            return;
        }

        const margin = brandTemplate.firstTierMargin || 0;
        const calculatedPrice = parseFloat(costPrice) * (1 + margin / 100);
        setFirstTierPrice(calculatedPrice.toFixed(2));
        toast.success(
            `First tier price calculated with ${margin}% margin: A$${calculatedPrice.toFixed(2)}`
        );
    };

    // Calculate all tiers from first tier price using brand template
    const handleCalculateTiers = async () => {
        if (!firstTierPrice || !brandTemplate) {
            toast.error("Please enter first tier price");
            return;
        }

        try {
            const response = await axios.post(
                "/api/brands/calculate-price-tiers",
                {
                    brandId: brandId,
                    firstTierPrice: parseFloat(firstTierPrice),
                },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                }
            );

            if (response.data.success) {
                const calculated = response.data.data.calculatedTiers;
                setCalculatedTiers(calculated);
                
                // Update parent component with calculated tiers
                onChange(calculated);
                
                toast.success(
                    `${calculated.length} price tiers calculated from brand template`
                );
            }
        } catch (error) {
            console.error("Error calculating tiers:", error);
            toast.error("Failed to calculate price tiers");
        }
    };

    // Apply brand template tiers
    const handleApplyTemplate = () => {
        if (!brandTemplate || !brandTemplate.priceTiers || brandTemplate.priceTiers.length === 0) {
            toast.error("No brand template available");
            return;
        }

        // Copy template structure with empty prices (user will fill first tier)
        const templateTiers = brandTemplate.priceTiers.map((tier) => ({
            minQuantity: tier.minQuantity,
            maxQuantity: tier.maxQuantity,
            tierLabel: tier.tierLabel || `${tier.minQuantity}-${tier.maxQuantity || "∞"}`,
            discountPercent: tier.discountPercent || 0,
            unitPrice: 0, // User needs to calculate - set to 0 instead of empty string
        }));

        setLocalPriceTiers(templateTiers);
        onChange(templateTiers);
        toast.success("Brand template structure applied");
    };

    // Switch to manual mode
    const handleManualMode = () => {
        setManualMode(true);
        setCalculatedTiers([]);
        setCostPrice("");
        setFirstTierPrice("");
        toast.info("Switched to manual pricing mode");
    };

    // Add a new tier manually
    const handleAddTier = () => {
        const newTier = {
            minQuantity: "",
            maxQuantity: "",
            unitPrice: "",
            discountPercent: "",
            tierLabel: "",
        };
        const updated = [...localPriceTiers, newTier];
        setLocalPriceTiers(updated);
        onChange(updated);
    };

    // Remove a tier
    const handleRemoveTier = (index) => {
        const updated = localPriceTiers.filter((_, i) => i !== index);
        setLocalPriceTiers(updated);
        onChange(updated);
    };

    // Update tier values
    const handleTierChange = (index, field, value) => {
        const updated = [...localPriceTiers];
        updated[index] = {
            ...updated[index],
            [field]: value,
        };

        // Auto-calculate unitPrice if first tier and discountPercent changes
        if (field === "discountPercent" && index > 0 && localPriceTiers[0]?.unitPrice) {
            const firstPrice = parseFloat(localPriceTiers[0].unitPrice);
            const discount = parseFloat(value) || 0;
            updated[index].unitPrice = (firstPrice * (1 - discount / 100)).toFixed(2);
        }

        setLocalPriceTiers(updated);
        onChange(updated);
    };

    // Reset to brand template mode
    const handleResetToTemplate = () => {
        setManualMode(false);
        setCalculatedTiers([]);
        setCostPrice("");
        setFirstTierPrice("");
        setLocalPriceTiers([]);
        onChange([]);
        toast.info("Reset to brand template mode");
    };

    return (
        <Card className="border">
            <CardHeader className="bg-soft-primary">
                <h5 className="card-title mb-0">
                    <i className="ri-price-tag-3-line align-middle me-2"></i>
                    Product Pricing Calculator
                </h5>
            </CardHeader>
            <CardBody>
                {/* Brand Template Info */}
                {brandTemplate && !manualMode && (
                    <Alert color="info" className="mb-3">
                        <div className="d-flex align-items-center justify-content-between">
                            <div>
                                <strong>Brand Template: {brandTemplate.brandName}</strong>
                                <br />
                                <small>
                                    {brandTemplate.priceTiers?.length || 0} tier(s) configured
                                    {brandTemplate.firstTierMargin > 0 && (
                                        <> | First Tier Margin: {brandTemplate.firstTierMargin}%</>
                                    )}
                                </small>
                            </div>
                            <Button
                                color="warning"
                                size="sm"
                                outline
                                onClick={handleManualMode}
                            >
                                <i className="ri-edit-line align-middle me-1"></i>
                                Manual Mode
                            </Button>
                        </div>
                    </Alert>
                )}

                {!brandId && (
                    <Alert color="warning">
                        Please select a brand to use pricing templates
                    </Alert>
                )}

                {loadingTemplate && (
                    <Alert color="secondary">
                        Loading brand pricing template...
                    </Alert>
                )}

                {/* Calculation Section - Only if brand template exists */}
                {brandTemplate && !manualMode && brandTemplate.priceTiers?.length > 0 && (
                    <div className="border rounded p-3 mb-3 bg-light">
                        <h6 className="mb-3">Calculate from Brand Template</h6>

                        <Row>
                            {/* Cost Price + Margin Calculator */}
                            {brandTemplate.firstTierMargin > 0 && (
                                <Col lg={12}>
                                    <div className="mb-3">
                                        <Label>
                                            Cost Price (Optional)
                                            <Badge color="info" className="ms-2" pill>
                                                {brandTemplate.firstTierMargin}% margin
                                            </Badge>
                                        </Label>
                                        <div className="d-flex gap-2">
                                            <Input
                                                type="number"
                                                step="0.01"
                                                placeholder="Enter cost price"
                                                value={costPrice}
                                                onChange={(e) => setCostPrice(e.target.value)}
                                            />
                                            <Button
                                                color="primary"
                                                outline
                                                onClick={handleCalculateFromCost}
                                                disabled={!costPrice}
                                            >
                                                Calculate
                                            </Button>
                                        </div>
                                    </div>
                                </Col>
                            )}

                            {/* First Tier Price */}
                            <Col lg={12}>
                                <div className="mb-3">
                                    <Label>
                                        First Tier Price <span className="text-danger">*</span>
                                    </Label>
                                    <div className="d-flex gap-2">
                                        <Input
                                            type="number"
                                            step="0.01"
                                            placeholder="Enter first tier price"
                                            value={firstTierPrice}
                                            onChange={(e) => setFirstTierPrice(e.target.value)}
                                            invalid={isSubmit && !firstTierPrice && localPriceTiers.length === 0}
                                        />
                                        <Button
                                            color="success"
                                            onClick={handleCalculateTiers}
                                            disabled={!firstTierPrice}
                                        >
                                            <i className="ri-calculator-line align-middle me-1"></i>
                                            Calculate All Tiers
                                        </Button>
                                    </div>
                                    {isSubmit && !firstTierPrice && localPriceTiers.length === 0 && (
                                        <FormFeedback type="invalid" className="d-block">
                                            Please calculate price tiers or enter manually
                                        </FormFeedback>
                                    )}
                                </div>
                            </Col>
                        </Row>

                        {/* Template Structure Button */}
                        <div className="text-center">
                            <Button
                                color="secondary"
                                outline
                                size="sm"
                                onClick={handleApplyTemplate}
                            >
                                <i className="ri-file-copy-line align-middle me-1"></i>
                                Copy Template Structure
                            </Button>
                        </div>
                    </div>
                )}

                {/* Manual Mode or No Template */}
                {(!brandTemplate || manualMode) && brandId && (
                    <div className="border rounded p-3 mb-3">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h6 className="mb-0">Manual Pricing</h6>
                            {manualMode && (
                                <Button
                                    color="info"
                                    size="sm"
                                    outline
                                    onClick={handleResetToTemplate}
                                >
                                    <i className="ri-refresh-line align-middle me-1"></i>
                                    Back to Template
                                </Button>
                            )}
                        </div>
                        <Button color="primary" size="sm" onClick={handleAddTier}>
                            <i className="ri-add-line align-middle me-1"></i>
                            Add Price Tier
                        </Button>
                    </div>
                )}

                {/* Price Tiers Table */}
                {localPriceTiers.length > 0 && (
                    <div className="table-responsive">
                        <Table bordered hover className="mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th style={{ width: "15%" }}>Min Qty</th>
                                    <th style={{ width: "15%" }}>Max Qty</th>
                                    <th style={{ width: "20%" }}>Unit Price (A$)</th>
                                    <th style={{ width: "15%" }}>Discount %</th>
                                    <th style={{ width: "25%" }}>Tier Label</th>
                                    <th style={{ width: "10%" }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {localPriceTiers.map((tier, index) => (
                                    <tr key={index}>
                                        <td>
                                            <Input
                                                type="number"
                                                min="1"
                                                placeholder="Min"
                                                value={tier.minQuantity}
                                                onChange={(e) =>
                                                    handleTierChange(
                                                        index,
                                                        "minQuantity",
                                                        e.target.value
                                                    )
                                                }
                                                bsSize="sm"
                                                invalid={
                                                    isSubmit && !tier.minQuantity
                                                }
                                            />
                                        </td>
                                        <td>
                                            <Input
                                                type="number"
                                                min="1"
                                                placeholder="Max (optional)"
                                                value={tier.maxQuantity || ""}
                                                onChange={(e) =>
                                                    handleTierChange(
                                                        index,
                                                        "maxQuantity",
                                                        e.target.value
                                                    )
                                                }
                                                bsSize="sm"
                                            />
                                        </td>
                                        <td>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                placeholder="Price"
                                                value={tier.unitPrice}
                                                onChange={(e) =>
                                                    handleTierChange(
                                                        index,
                                                        "unitPrice",
                                                        e.target.value
                                                    )
                                                }
                                                bsSize="sm"
                                                invalid={
                                                    isSubmit && !tier.unitPrice
                                                }
                                            />
                                        </td>
                                        <td>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                placeholder="Discount"
                                                value={tier.discountPercent || ""}
                                                onChange={(e) =>
                                                    handleTierChange(
                                                        index,
                                                        "discountPercent",
                                                        e.target.value
                                                    )
                                                }
                                                bsSize="sm"
                                                disabled={index === 0}
                                            />
                                        </td>
                                        <td>
                                            <Input
                                                type="text"
                                                placeholder="Label"
                                                value={tier.tierLabel || ""}
                                                onChange={(e) =>
                                                    handleTierChange(
                                                        index,
                                                        "tierLabel",
                                                        e.target.value
                                                    )
                                                }
                                                bsSize="sm"
                                            />
                                        </td>
                                        <td>
                                            <Button
                                                color="danger"
                                                size="sm"
                                                outline
                                                onClick={() => handleRemoveTier(index)}
                                            >
                                                <i className="ri-delete-bin-line"></i>
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </div>
                )}

                {/* Calculated Preview */}
                {calculatedTiers.length > 0 && (
                    <Alert color="success" className="mt-3 mb-0">
                        <strong>
                            <i className="ri-check-line me-1"></i>
                            {calculatedTiers.length} tiers calculated successfully
                        </strong>
                        <div className="mt-2">
                            <small>
                                Price Range: A${calculatedTiers[0]?.unitPrice} - A$
                                {calculatedTiers[calculatedTiers.length - 1]?.unitPrice}
                            </small>
                        </div>
                    </Alert>
                )}

                {/* Error Messages */}
                {isSubmit && formErrors?.priceTiers && (
                    <Alert color="danger" className="mt-3 mb-0">
                        {formErrors.priceTiers}
                    </Alert>
                )}
            </CardBody>
        </Card>
    );
};

export default ProductPricingCalculator;
