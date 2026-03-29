
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Product } from '@/entities/Product';
import { User } from '@/entities/User';
import ProductForm from '@/components/market/ProductForm';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ShoppingBag } from 'lucide-react';
import { createPageUrl } from '@/utils';

export default function EditProduct() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const pathParts = window.location.pathname.split('/');
    const idFromPath = pathParts[pathParts.length - 1];

    const fetchProduct = async () => {
      try {
        const [p, u] = await Promise.all([
          Product.get(idFromPath),
          User.me().catch(() => null)
        ]);

        if (p.created_by !== u?.email) {
          navigate(createPageUrl('Marketplace'));
          return;
        }
        setProduct(p);
      } catch (error) {
        console.error("Failed to fetch product for editing:", error);
        navigate(createPageUrl('Marketplace'));
      } finally {
        setIsLoading(false);
      }
    };
    fetchProduct();
  }, [navigate]);

  const handleSubmit = async (productData) => {
    setIsSubmitting(true);
    try {
      await Product.update(product.id, productData);
      navigate(createPageUrl(`ProductDetail?id=${product.id}`));
    } catch (error) {
      console.error("Error updating product:", error);
      setIsSubmitting(false);
    }
  };

  if (isLoading || !product) {
    return <div className="p-8 text-white">Lade Produkt zum Bearbeiten...</div>;
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="bg-gray-900/50 border-green-800/20 backdrop-blur-xl">
          <CardHeader>
            <div className="flex items-center gap-4">
               <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                    <ArrowLeft className="text-white" />
                </Button>
                <div className="flex items-center gap-3">
                    <ShoppingBag className="w-6 h-6 text-green-400" />
                    <CardTitle className="text-white">Produkt bearbeiten</CardTitle>
                </div>
            </div>
          </CardHeader>
        </Card>
        <ProductForm initialData={product} onSubmit={handleSubmit} isSubmitting={isSubmitting} />
      </div>
    </div>
  );
}
