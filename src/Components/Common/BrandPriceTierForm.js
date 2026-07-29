import React, { useState, useEffect, useRef } from "react";
import { Row, Col, Label, Input, Button, Card, CardBody, Table } from "reactstrap";
import { toast } from "react-toastify";

const SAMPLE_TIERS = [
    { minQuantity: 1, maxQuantity: 9, discountPercent: 0, tierLabel: "1-9 units" },
    { minQuantity: 10, maxQuantity: 49, discountPercent: 10, tierLabel: "10-49 units" },
    { minQuantity: 50, maxQuantity: 99, discountPercent: 20, tierLabel: "50-99 units" },
    { minQuantity: 100, maxQuantity: null, discountPercent: 30, tierLabel: "100+ units" },
];

/**
 * Discount price-tier template editor (brand / category / subcategory).
 * Empty priceTiers = not configured (falls through to lower-priority source).
 */
const BrandPriceTierForm = ({
    values,
    onChange,
    isSubmit,
    formErrors,
    entityLabel = "brand",
}) => {
    const [priceTiers, setPriceTiers] = useState(() =>
        Array.isArray(values?.priceTiers) ? values.priceTiers : []
    );
    const skipNotifyRef = useRef(true);

    useEffect(() => {
        if (Array.isArray(values.priceTiers)) {
            skipNotifyRef.current = true;
            setPriceTiers(values.priceTiers);
        }
    }, [values.priceTiers]);

    useEffect(() => {
        if (skipNotifyRef.current) {
            skipNotifyRef.current = false;
            return;
        }
        onChange({ priceTiers });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [priceTiers]);

    const handleTierChange = (index, field, value) => {
        const updated = [...priceTiers];

        if (field === "minQuantity" || field === "maxQuantity") {
            updated[index][field] = value === "" ? "" : parseInt(value) || 0;
        } else if (field === "discountPercent") {
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
                tierLabel: `${newMinQuantity}+ units`,
            },
        ]);
    };

    const loadSampleTiers = () => {
        setPriceTiers(SAMPLE_TIERS.map((tier) => ({ ...tier })));
    };

    const clearTiers = () => {
        setPriceTiers([]);
        toast.info("Price tiers cleared — this source will not apply");
    };

    const removeTier = (index) => {
        setPriceTiers(priceTiers.filter((_, i) => i !== index));
    };

    const validateTiers = () => {
        const errors = [];
        if (priceTiers.length === 0) return errors;

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

    const label = entityLabel || "brand";

    return (
        <Card className="border">
            <CardBody>
                <h5 className="card-title mb-3">Price Tier Configuration</h5>
                <p className="text-muted small mb-3">
                    Configure {label}-level quantity discount templates for apparel products.
                    Priority when applying: brand → subcategory → category → product master.
                    Leave empty to skip this source.
                </p>

                <Row className="mb-4">
                    <Col lg={6}>
                        <div className="form-floating">
                            <Input
                                type="number"
                                className="form-control"
                                name="firstTierMargin"
                                value={values.firstTierMargin || 0}
                                onChange={(e) =>
                                    onChange({ firstTierMargin: parseFloat(e.target.value) || 0 })
                                }
                                step="0.01"
                                min="0"
                            />
                            <Label className="form-label">First Tier Margin (%)</Label>
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
                                <strong>Example:</strong> Cost Price A$60 + 15% margin = A$69
                                (First Tier Price)
                            </small>
                        </div>
                    </Col>
                </Row>

                <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
                        <Label className="mb-0">Price Tier Discounts</Label>
                        <div className="d-flex gap-2">
                            {priceTiers.length === 0 && (
                                <Button color="soft-primary" size="sm" onClick={loadSampleTiers}>
                                    Load sample tiers
                                </Button>
                            )}
                            {priceTiers.length > 0 && (
                                <Button color="soft-danger" size="sm" onClick={clearTiers}>
                                    Clear tiers
                                </Button>
                            )}
                            <Button color="success" size="sm" onClick={addTier}>
                                <i className="ri-add-line me-1"></i>
                                Add Tier
                            </Button>
                        </div>
                    </div>
                    <small className="text-muted d-block mb-2">
                        Define discount percentages for different quantity ranges. Discounts are
                        applied from the first tier price.
                    </small>

                    {priceTiers.length === 0 ? (
                        <div className="alert alert-warning mb-0">
                            <small>
                                No tiers configured for this {label}. Apparel pricing will fall
                                through to the next source in priority order.
                            </small>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <Table className="table table-bordered table-sm">
                                <thead className="table-light">
                                    <tr>
                                        <th style={{ width: "20%" }}>Min Qty</th>
                                        <th style={{ width: "20%" }}>Max Qty</th>
                                        <th style={{ width: "20%" }}>Discount %</th>
                                        <th style={{ width: "30%" }}>Label</th>
                                        <th style={{ width: "10%" }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {priceTiers.map((tier, index) => (
                                        <tr key={index}>
                                            <td>
                                                <Input
                                                    type="number"
                                                    value={tier.minQuantity}
                                                    onChange={(e) =>
                                                        handleTierChange(
                                                            index,
                                                            "minQuantity",
                                                            e.target.value
                                                        )
                                                    }
                                                    min="1"
                                                    className="form-control-sm"
                                                />
                                            </td>
                                            <td>
                                                <Input
                                                    type="number"
                                                    value={tier.maxQuantity || ""}
                                                    onChange={(e) =>
                                                        handleTierChange(
                                                            index,
                                                            "maxQuantity",
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder="Unlimited"
                                                    className="form-control-sm"
                                                />
                                            </td>
                                            <td>
                                                <div className="input-group input-group-sm">
                                                    <Input
                                                        type="number"
                                                        value={tier.discountPercent}
                                                        onChange={(e) =>
                                                            handleTierChange(
                                                                index,
                                                                "discountPercent",
                                                                e.target.value
                                                            )
                                                        }
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
                                                    value={tier.tierLabel || ""}
                                                    onChange={(e) =>
                                                        handleTierChange(
                                                            index,
                                                            "tierLabel",
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder="e.g., Bulk discount"
                                                    className="form-control-sm"
                                                />
                                            </td>
                                            <td className="text-center">
                                                <Button
                                                    color="danger"
                                                    size="sm"
                                                    onClick={() => removeTier(index)}
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

                    {values.firstTierMargin > 0 && priceTiers.length > 0 && (
                        <div className="alert alert-light mt-3">
                            <small>
                                <strong>
                                    Example with A$100 cost price and {values.firstTierMargin}%
                                    margin:
                                </strong>
                                <ul className="mb-0 mt-2">
                                    {priceTiers.map((tier, index) => {
                                        const basePrice =
                                            100 * (1 + values.firstTierMargin / 100);
                                        const tierPrice =
                                            basePrice * (1 - tier.discountPercent / 100);
                                        const qtyRange = tier.maxQuantity
                                            ? `${tier.minQuantity}-${tier.maxQuantity}`
                                            : `${tier.minQuantity}+`;
                                        return (
                                            <li key={index}>
                                                {qtyRange} units: A${tierPrice.toFixed(2)}
                                                {tier.discountPercent > 0 &&
                                                    ` (${tier.discountPercent}% off A$${basePrice.toFixed(2)})`}
                                            </li>
                                        );
                                    })}
                                </ul>
                            </small>
                        </div>
                    )}
                </div>

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
                        <strong>How it works:</strong> For apparel products, supplier cost is
                        marked up with First Tier Margin, then quantity discounts are applied.
                        Leave tiers empty to fall through to a lower-priority source.
                    </small>
                </div>
            </CardBody>
        </Card>
    );
};

export default BrandPriceTierForm;
