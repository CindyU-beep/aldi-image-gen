import { useState } from 'react';
import { toast } from 'react-toastify';

export interface Product {
    url: string;
    name: string;
    mainImage: {
        url: string;
    };
    price?: string;
    currency?: string;
}

export const useShopbop = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);

    const handleSearch = async () => {
        if (!searchTerm.trim()) {
            toast.error('Please enter a search term');
            return;
        }

        setLoading(true);
        let attempts = 0;
        const maxAttempts = 3;

        while (attempts < maxAttempts) {
            try {
                const response = await fetch('/api/amazon', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        searchTerm,
                    }),
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch products');
                }

                const result = await response.json();
                const fetchedProducts = result.productList?.products || [];

                if (fetchedProducts.length === 0) {
                    attempts++;
                    if (attempts < maxAttempts) {
                        // Wait a short delay before retrying
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        continue;
                    } else {
                        toast.info('No products found. Try a different search term or try again.');
                    }
                } else {
                    // Success! We have products
                    console.log('Fetched products:', fetchedProducts);
                    setProducts(fetchedProducts);
                    break;
                }

                setProducts(fetchedProducts);
            } catch (error) {
                console.error(`Error searching products (attempt ${attempts + 1}/${maxAttempts}):`, error);
                attempts++;

                if (attempts >= maxAttempts) {
                    toast.error('Failed to search products after multiple attempts');
                } else {
                    // Wait before retrying
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
        }

        setLoading(false);
    };

    const openProductInNewTab = (url: string) => {
        window.open(url, '_blank');
    };

    return {
        searchTerm,
        setSearchTerm,
        products,
        loading,
        handleSearch,
        openProductInNewTab
    };
};

export default useShopbop;