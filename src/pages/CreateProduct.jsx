import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import ProductForm from '@/components/market/ProductForm';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ShoppingBag } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';

export default function CreateProduct() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => navigate(createPageUrl('Marketplace')));
  }, [navigate]);

  const handleSubmit = async (productData) => {
    if (!currentUser) {
      toast.error('Bitte melde dich an');
      return;
    }

    setIsSubmitting(true);
    try {
      await base44.entities.Product.create({
        ...productData,
        seller_email: currentUser.email,
        status: 'available'
      });
      toast.success('Produkt erstellt!');
      navigate(createPageUrl('Marketplace'));
    } catch (error) {
      console.error("Error creating product:", error);
      toast.error('Fehler beim Erstellen');
      setIsSubmitting(false);
    }
  };

  if (!currentUser) {
    return <div className="p-8 text-white">Lade...</div>;
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="bg-gray-900/50 border-green-800/20 backdrop-blur-xl">
          <CardHeader>
            <div className="flex items-center gap-4">
               <Button variant="ghost" size="icon" onClick={() => navigate(createPageUrl('Marketplace'))}>
                    <ArrowLeft className="text-white" />
                </Button>
                <div className="flex items-center gap-3">
                    <ShoppingBag className="w-6 h-6 text-green-400" />
                    <CardTitle className="text-white">Neues Produkt verkaufen</CardTitle>
                </div>
            </div>
          </CardHeader>
        </Card>
        <ProductForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
      </div>
    </div>
  );
}