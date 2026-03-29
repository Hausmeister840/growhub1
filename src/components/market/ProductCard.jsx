import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function ProductCard({ product }) {
  const formatPrice = (price) => {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(price);
  };

  return (
    <Link to={createPageUrl(`ProductDetail?id=${product.id}`)}>
      <Card className="glass-effect rounded-xl overflow-hidden hover:border-green-500/50 transition-all duration-300 h-full flex flex-col">
        <div className="aspect-square w-full overflow-hidden">
          <img 
            src={product.image_urls?.[0] || 'https://images.unsplash.com/photo-1542396601-dca920ea2807?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wzOTAzN3wwfDF8c2VhcmNofDIyfHxjYW5uYWJpc3xlbnwwfHx8fDE3MTc1Mjc0Njd8MA&ixlib=rb-4.0.3&q=80&w=1080'} 
            alt={product.title} 
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
        <CardContent className="p-4 flex-grow flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-lg text-white truncate">{product.title}</h3>
            <p className="text-sm text-zinc-400 capitalize">{product.category}</p>
          </div>
          <div className="mt-4">
            <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-none text-base">
              {formatPrice(product.price)}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}