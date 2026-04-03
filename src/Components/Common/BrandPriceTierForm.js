import React, { useState, useEffect } from "react";
import { Row, Col, Label, Input, Button, Card, CardBody, Table } from "reactstrap";
import { toast } from "react-toastify";

/**
 * BrandPriceTierForm Component
 * 
 * Manages brand-level price tier templates
 * - First Tier Margin input
 * - Dynamic tier table with add/remove functionality
 * - Validation and error handling
 */
const BrandPriceTierForm = ({ values, onChange, isSubmit, formErrors }) => {
    const [priceTiers, setPriceTiers] = useState([
        { minQuantity: 1, maxQuantity: 9, discountPercent: 0, tierLabel: "1-9 units" },
        { minQuantity: 10, maxQuantity: 49, discountPercent: 10, tierLabel: "10-49 units" },
        { minQuantity: 50, maxQuantity: 99, discountPercent: 20, tierLabel: "50-99 units" },
        { minQuantity: 100, maxQuantity: null, discountPercent: 30, tierLabel: "100+ units" }
    ]);

    // Initialize from existing values
    useEffect(() => {
        if (values.priceTiers && values.priceTiers.length > 0) {
            setPriceTiers(values.priceTiers);
        }
    }, [values.priceTiers]);

    // Notify parent component of changes
    useEffect(() => {
        onChange({ priceTiers });
    }, [priceTiers]);

    const handleTierChange = (index, field, value) => {
        const updated = [...priceTiers];
        
        if (field === 'minQuantity' || field === 'maxQuantity') {
            updated[index][field] = value === '' ? '' : parseInt(value) || 0;
        } else if (field === 'discountPercent') {
            const discount = parseFloat(value) || 0;
            if (discount < 0 || discount > 100) {
                toast.error("Discount must be between 0 and 100");
                return;
            }
            updated[index][field] = discount;
        } else {
            updated[index][field] = value;
        }
        
        setPriceTiers(updated);
    };

    const addTier = () => {
        const lastTier = priceTiers[priceTiers.length - 1];
        const newMinQuantity = lastTier?.maxQuantity ? lastTier.maxQuantity + 1 : 1;
        
        setPriceTiers([
            ...priceTiers,
            {
                minQuantity: newMinQuantity,
                maxQuantity: null,
                discountPercent: 0,
                tierLabel: `${newMinQuantity}+ units`
            }
        ]);
    };

    const removeTier = (index) => {
        if (priceTiers.length <= 1) {
            toast.warning("At least one price tier is required");
            return;
        }
        const updated = priceTiers.filter((_, i) => i !== index);
        setPriceTiers(updated);
    };

    const validateTiers = () => {
        const errors = [];
        
        // Check for overlapping or gaps
        const sorted = [...priceTiers].sort((a, b) => a.minQuantity - b.minQuantity);
        
        for (let i = 0; i < sorted.length - 1; i++) {
            const current = sorted[i];
            const next = sorted[i + 1];
            
            if (current.maxQuantity === null) {
                errors.push(`Tier ${i + 1} has no maximum quantity but isn't the last tier`);
            }
            
            if (current.maxQuantity && current.maxQuantity >= next.minQuantity) {
                errors.push(`Overlap between tier ${i + 1} and tier ${i + 2}`);
            }
        }
        
        return errors;
    };

    return (
        <Card className="border">
            <CardBody>
                <h5 className="card-title mb-3">Price Tier Configuration</h5>
                <p className="text-muted small mb-3">
                    Configure brand-level pricing templates that will be applied to new products
                </p>

                {/* First Tier Margin */}
                <Row className="mb-4">
                    <Col lg={6}>
                        <div className="form-floating">
                            <Input
                                type="number"
                                className="form-control"
                                name="firstTierMargin"
                                value={values.firstTierMargin || 0}
                                onChange={(e) => onChange({ firstTierMargin: parseFloat(e.target.value) || 0 })}
                                step="0.01"
                                min="0"
                            />
                            <Label className="form-label">
                                First Tier Margin (%)
                            </Label>
                            <small className="text-muted">
                                Markup percentage applied to cost price for first tier pricing
                            </small>
                        </div>
                        {isSubmit && formErrors?.firstTierMargin && (
                            <p className="text-danger">{formErrors.firstTierMargin}</p>
                        )}
                    </Col>
                    <Col lg={6}>
                        <div className="alert alert-info mb-0">
                            <small>
                                <strong>Example:</strong> Cost Price A$60 + 15% margin = A$69 (First Tier Price)
                            </small>
                        </div>
                    </Col>
                </Row>

                {/* Price Tiers Table */}
                <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                        <Label className="mb-0">Price Tier Discounts</Label>
                        <Button
                            color="success"
                            size="sm"
                            onClick={addTier}
                        >
                            <i className="ri-add-line me-1"></i>
                            Add Tier
                        </Button>
                    </div>
                    <small className="text-muted d-block mb-2">
                        Define discount percentages for different quantity ranges. Discounts are applied from the first tier price.
                    </small>

                    <div className="table-responsive">
                        <Table className="table table-bordered table-sm">
                            <thead className="table-light">
                                <tr>
                                    <th style={{ width: '20%' }}>Min Qty</th>
                                    <th style={{ width: '20%' }}>Max Qty</th>
                                    <th style={{ width: '20%' }}>Discount %</th>
                                    <th style={{ width: '30%' }}>Label</th>
                                    <th style={{ width: '10%' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {priceTiers.map((tier, index) => (
                                    <tr key={index}>
                                        <td>
                                            <Input
                                                type="number"
                                                value={tier.minQuantity}
                                                onChange={(e) => handleTierChange(index, 'minQuantity', e.target.value)}
                                                min="1"
                                                className="form-control-sm"
                                            />
                                        </td>
                                        <td>
                                            <Input
                                                type="number"
                                                value={tier.maxQuantity || ''}
                                                onChange={(e) => handleTierChange(index, 'maxQuantity', e.target.value)}
                                                placeholder="Unlimited"
                                                className="form-control-sm"
                                            />
                                        </td>
                                        <td>
                                            <div className="input-group input-group-sm">
                                                <Input
                                                    type="number"
                                                    value={tier.discountPercent}
                                                    onChange={(e) => handleTierChange(index, 'discountPercent', e.target.value)}
                                                    min="0"
                                                    max="100"
                                                    step="0.01"
                                                    className="form-control-sm"
                                                />
                                                <span className="input-group-text">%</span>
                                            </div>
                                        </td>
                                        <td>
                                            <Input
                                                type="text"
                                                value={tier.tierLabel || ''}
                                                onChange={(e) => handleTierChange(index, 'tierLabel', e.target.value)}
                                                placeholder="e.g., Bulk discount"
                                                className="form-control-sm"
                                            />
                                        </td>
                                        <td className="text-center">
                                            <Button
                                                color="danger"
                                                size="sm"
                                                onClick={() => removeTier(index)}
                                                disabled={priceTiers.length === 1}
                                            >
                                                <i className="ri-delete-bin-line"></i>
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </div>

                    {/* Preview Calculation Example */}
                    {values.firstTierMargin > 0 && priceTiers.length > 0 && (
                        <div className="alert alert-light mt-3">
                            <small>
                                <strong>Example with A$100 cost price and {values.firstTierMargin}% margin:</strong>
                                <ul className="mb-0 mt-2">
                                    {priceTiers.map((tier, index) => {
                                        const basePrice = 100 * (1 + values.firstTierMargin / 100);
                                        const tierPrice = basePrice * (1 - tier.discountPercent / 100);
                                        const qtyRange = tier.maxQuantity 
                                            ? `${tier.minQuantity}-${tier.maxQuantity}`
                                            : `${tier.minQuantity}+`;
                                        return (
                                            <li key={index}>
                                                {qtyRange} units: A${tierPrice.toFixed(2)} 
                                                {tier.discountPercent > 0 && ` (${tier.discountPercent}% off A$${basePrice.toFixed(2)})`}
                                            </li>
                                        );
                                    })}
                                </ul>
                            </small>
                        </div>
                    )}
                </div>

                {/* Validation Errors */}
                {isSubmit && priceTiers.length > 0 && validateTiers().length > 0 && (
                    <div className="alert alert-danger">
                        <strong>Price Tier Errors:</strong>
                        <ul className="mb-0">
                            {validateTiers().map((error, index) => (
                                <li key={index}>{error}</li>
                            ))}
                        </ul>
                    </div>
                )}

                <div className="alert alert-info mb-0">
                    <small>
                        <i className="ri-information-line me-1"></i>
                        <strong>How it works:</strong> These discount percentages will be used as a template when creating new products. 
                        Products can override these values if needed.
                    </small>
                </div>
            </CardBody>
        </Card>
    );
};

export default BrandPriceTierForm;
