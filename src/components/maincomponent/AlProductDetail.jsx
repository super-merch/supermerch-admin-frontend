import React, { useState, useEffect, useContext, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { addDiscount } from '../apis/UserApi';
import { addMargin as addMarginApi } from '../apis/UserApi';
import axios from 'axios';
import { AdminContext } from '../context/AdminContext';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const AlProductDetail = () => {
  const { state: product } = useLocation();

  // track initial page loading only
  const [initialLoading, setInitialLoading] = useState(true);

  // button-level loading states
  const [isDiscountLoading, setIsDiscountLoading] = useState(false);
  const [isMarginLoading, setIsMarginLoading] = useState(false);

  const [discountPercent, setDiscountPercent] = useState('');
  const [marginPercent, setMarginPercent] = useState('');
  const [discountMessage, setDiscountMessage] = useState('');
  const [marginMessage, setMarginMessage] = useState('');
  const [discountPrice, setDiscountPrice] = useState(null);
  const [marginPrice, setMarginPrice] = useState(null);

  const { aToken, backednUrl } = useContext(AdminContext);

  // derive base price once
  const price = useMemo(() => {
    const priceGroups = product?.product?.prices?.price_groups || [];
    const baseGroup = priceGroups.find((g) => g?.base_price) || {};
    const priceBreaks = baseGroup.base_price?.price_breaks || [];
    return priceBreaks[0]?.price ? parseFloat(priceBreaks[0].price) : 0;
  }, [product]);

  const batchPromises = async (promises, batchSize = 10) => {
    const results = [];
    
    for (let i = 0; i < promises.length; i += batchSize) {
      const batch = promises.slice(i, i + batchSize);
      const batchResults = await Promise.all(batch);
      results.push(...batchResults);
    }
    
    return results;
  };

  useEffect(() => {
    if (product?.meta?.id) {
      // initial fetch without interfering with button loaders
      fetchDiscount(product.meta.id, true);
      fetchMargin(product.meta.id, true);
    }
  }, [product]);
  

  // Enhanced fetchDiscount function to handle both single IDs and arrays
  const fetchDiscount = async (id, isInitial = false) => {
    try {
      // If it's a single ID, process normally
      if (typeof id === 'string' || typeof id === 'number') {
        const res = await axios.get(
          `${backednUrl}/api/add-discount/discounts/${id}`,
          { headers: { Authorization: `Bearer ${aToken}` } }
        );
        const { discount, discountPrice } = res.data.data;
        
        setDiscountPercent(discount);
        setDiscountPrice(discountPrice);
        return { discount, discountPrice };
      } else if (Array.isArray(id)) {
        // If it's an array of IDs, process in batches
        const discountPromises = id.map((productId) =>
          axios.get(
            `${backednUrl}/api/add-discount/discounts/${productId}`,
            { headers: { Authorization: `Bearer ${aToken}` } }
          ).catch(e => {
            if (e.response?.status === 404) {
              return { data: { data: { discount: 0, discountPrice: 0 } } };
            }
            throw e;
          })
        );
        
        // Process in batches of 10 concurrent requests
        const discountResults = await batchPromises(discountPromises, 10);
        
        // Return results for further processing if needed
        return discountResults.map(result => result.data.data);
      }
    } catch (e) {
      if (e.response?.status === 404) {
        setDiscountPercent('');
        setDiscountPrice(null);
      } else {
        console.error('Error fetching discount:', e);
      }
    } finally {
      if (isInitial) setInitialLoading(false);
    }
  };

  // Enhanced fetchMargin function to handle both single IDs and arrays
  const fetchMargin = async (id, isInitial = false) => {
    try {
      // If it's a single ID, process normally
      if (typeof id === 'string' || typeof id === 'number') {
        const res = await axios.get(
          `${backednUrl}/api/product-margin/margin/${id}`,
          { headers: { Authorization: `Bearer ${aToken}` } }
        );
        const { margin, marginPrice } = res.data.data;
        setMarginPercent(margin);
        setMarginPrice(marginPrice);
        return { margin, marginPrice };
      } else if (Array.isArray(id)) {
        // If it's an array of IDs, process in batches
        const marginPromises = id.map((productId) =>
          axios.get(
            `${backednUrl}/api/product-margin/margin/${productId}`,
            { headers: { Authorization: `Bearer ${aToken}` } }
          ).catch(e => {
            if (e.response?.status === 404) {
              return { data: { data: { margin: 0, marginPrice: 0 } } };
            }
            throw e;
          })
        );
        
        // Process in batches of 10 concurrent requests
        const marginResults = await batchPromises(marginPromises, 10);
        
        // Return results for further processing if needed
        return marginResults.map(result => result.data.data);
      }
    } catch (e) {
      if (e.response?.status === 404) {
        setMarginPercent('');
        setMarginPrice(null);
      } else {
        console.error('Error fetching margin:', e);
      }
    } finally {
      if (isInitial) setInitialLoading(false);
    }
  };

  // Enhanced batch processing function for discounts
  const processBatchDiscounts = async (productIds, discountPercent, prices) => {
    const batchSize = 10;
    const results = [];
    
    for (let i = 0; i < productIds.length; i += batchSize) {
      const batch = productIds.slice(i, i + batchSize);
      const batchPromises = batch.map((productId, index) => 
        addDiscount(productId, discountPercent, prices[i + index])
      );
      
      try {
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
      } catch (error) {
        console.error('Error in batch discount processing:', error);
      }
    }
    
    return results;
  };

  // Enhanced batch processing function for margins
  const processBatchMargins = async (productIds, marginPercent, prices) => {
    const batchSize = 10;
    const results = [];
    
    for (let i = 0; i < productIds.length; i += batchSize) {
      const batch = productIds.slice(i, i + batchSize);
      const batchPromises = batch.map((productId, index) => 
        addMarginApi(productId, marginPercent, prices[i + index])
      );
      
      try {
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
      } catch (error) {
        console.error('Error in batch margin processing:', error);
      }
    }
    
    return results;
  };

  const handleAddDiscount = async (e, triggered = false) => {
    if (!triggered && e?.preventDefault) e.preventDefault();
    const p = parseFloat(discountPercent);
    if (isNaN(p) || p < 0 || p > 100) {
      const msg = 'Enter a valid discount (0–100%).';
      setDiscountMessage(msg);
      toast.error(msg);
      return;
    }

    try {
      setIsDiscountLoading(true);
      const res = await addDiscount(product.meta.id, p, price);
      setDiscountMessage(res.data.message);
      
      toast.success(res.data.message || 'Discount applied successfully!');
      handleAddMargin(null, true);
      // re-fetch without triggering full-page loader
      await fetchDiscount(product.meta.id);
    } catch (error) {
      const errorMsg = 'Failed to add discount.';
      setDiscountMessage(errorMsg);
      toast.error(errorMsg);
      console.error('Error adding discount:', error);
    } finally {
      setIsDiscountLoading(false);
    }
  };

  const handleAddMargin = async (e, triggered = false) => {
    if (!triggered && e?.preventDefault) e.preventDefault();
    const m = parseFloat(marginPercent);
    if (isNaN(m) || m < 0 || m > 100) {
      const msg = 'Enter a valid margin (0–100%).';
      setMarginMessage(msg);
      toast.error(msg);
      return;
    }

    try {
      setIsMarginLoading(true);
      const res = await addMarginApi(product.meta.id, m, price);
      console.log("product:", product);
      setMarginMessage(res.data.message);
      toast.success(res.data.message || 'Margin applied successfully!');
      // re-fetch only margin data
      await fetchMargin(product.meta.id);
    } catch (error) {
      const errorMsg = 'Failed to add margin.';
      setMarginMessage(errorMsg);
      toast.error(errorMsg);
      console.error('Error adding margin:', error);
    } finally {
      setIsMarginLoading(false);
    }
  };

  // Function to handle supplier margin changes (this would be called from a supplier management component)
  const handleSupplierMarginChange = async (supplierId, newMargin) => {
    try {
      // Call the supplier margin API
      const response = await axios.post(
        `${backednUrl}/api/supplier-margin/add-margin`,
        { supplierId, margin: newMargin },
        { headers: { Authorization: `Bearer ${aToken}` } }
      );
      
      if (response.data.reapplicationResult) {
        const { successful, failed } = response.data.reapplicationResult.results;
        toast.success(`Supplier margin updated. Reapplied to ${successful} products. ${failed} failed.`);
      }
    } catch (error) {
      console.error('Error updating supplier margin:', error);
      toast.error('Failed to update supplier margin');
    }
  };
  
  if (initialLoading) {
    return (
      <p className='pt-32 text-5xl text-center text-red-500'>Loading...</p>
    );
  }
  
  return (
    <div className='mx-2 mt-20 mb-12 space-y-12 lg:mx-6 md:mx-6 sm:mx-6'>
      <ToastContainer position='top-right' autoClose={3000} />

      {/* Product Info */}
      <div className='max-w-2xl p-6 m-auto border shadow-xl'>
        <h1 className='mb-4 text-2xl font-bold'>Product Details</h1>
        <p>
          <strong>ID:</strong> {product?.meta?.id || 'N/A'}
        </p>
        <p>
          <strong>Code:</strong> {product?.overview?.code || 'N/A'}
        </p>
        <p>
          <strong>Base Price:</strong> ${price.toFixed(2)}
        </p>
        {discountPercent !== '' && (
          <p>
            <strong>Discount:</strong> {discountPercent}%
          </p>
        )}
        {discountPrice !== null && (
          <p>
            <strong>Discounted Price:</strong> ${discountPrice.toFixed(2)}
          </p>
        )}
        <p>
          <strong>Supplier:</strong> {product.supplier?.supplier || 'Unknown'}
        </p>

        {/* Discount Form */}
        <form
          onSubmit={handleAddDiscount}
          className='flex flex-col items-end mt-4 space-y-2 text-end'
        >
          <input
            type='number'
            placeholder='Discount %'
            value={discountPercent}
            onChange={(e) => setDiscountPercent(e.target.value)}
            className='w-full p-2 border rounded'
            disabled={isDiscountLoading}
          />
          <button
            type='submit'
            className='px-4 py-2 text-white bg-blue-600 rounded disabled:opacity-50'
            disabled={isDiscountLoading}
          >
            {isDiscountLoading ? 'Applying...' : 'Apply Discount'}
          </button>
          {discountMessage && (
            <p className='mt-2 text-sm text-gray-700'>{discountMessage}</p>
          )}
        </form>
      </div>

      {/* Margin Section */}
      <div className='max-w-2xl p-6 pb-10 m-auto border shadow-xl'>
        <h2 className='mb-4 text-xl font-bold'>Margin</h2>
        {marginPercent !== '' && (
          <p>
            <strong>Margin:</strong> {marginPercent}%
          </p>
        )}
        {marginPrice !== null && (
          <p>
            <strong>Price with Margin:</strong> ${marginPrice.toFixed(2)}
          </p>
        )}

        {/* Margin Form */}
        <form
          onSubmit={handleAddMargin}
          className='flex flex-col items-end mt-4 space-y-2 text-end'
        >
          <input
            type='number'
            placeholder='Margin %'
            value={marginPercent}
            onChange={(e) => setMarginPercent(e.target.value)}
            className='w-full p-2 border rounded'
            disabled={isMarginLoading}
          />
          <button
            type='submit'
            className='px-4 py-2 text-white bg-green-600 rounded disabled:opacity-50'
            disabled={isMarginLoading}
          >
            {isMarginLoading ? 'Applying...' : 'Apply Margin'}
          </button>
          {marginMessage && (
            <p className='mt-2 text-sm text-gray-700'>{marginMessage}</p>
          )}
        </form>
      </div>
    </div>
  );
};

export default AlProductDetail;