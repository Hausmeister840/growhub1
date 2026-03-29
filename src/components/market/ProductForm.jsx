import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Image as ImageIcon, XCircle, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function ProductForm({ initialData = {}, onSubmit, isSubmitting }) {
  const [product, setProduct] = useState({
    title: initialData.title || '',
    description: initialData.description || '',
    price: initialData.price || '',
    category: initialData.category || 'other',
    condition: initialData.condition || 'new',
    location: initialData.location || '',
    image_urls: initialData.image_urls || [],
  });
  const [isUploading, setIsUploading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProduct(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setProduct(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast.error('Nur Bilder erlaubt');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Bild zu groß (max 10MB)');
      return;
    }

    if (product.image_urls.length >= 10) {
      toast.error('Maximal 10 Bilder erlaubt');
      return;
    }

    setIsUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setProduct(prev => ({ ...prev, image_urls: [...prev.image_urls, file_url] }));
      toast.success('Bild hochgeladen');
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error('Upload fehlgeschlagen');
    } finally {
      setIsUploading(false);
    }
  };
  
  const removeImage = (urlToRemove) => {
      setProduct(prev => ({...prev, image_urls: prev.image_urls.filter(url => url !== urlToRemove)}));
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(product);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="bg-gray-900/50 border-green-800/20">
        <CardContent className="p-6 grid gap-6">
          <div>
            <Label htmlFor="title" className="text-white">Titel</Label>
            <Input id="title" name="title" value={product.title} onChange={handleChange} required className="bg-gray-800/50 border-green-800/20 text-white" />
          </div>
          <div>
            <Label htmlFor="description" className="text-white">Beschreibung</Label>
            <Textarea id="description" name="description" value={product.description} onChange={handleChange} required className="bg-gray-800/50 border-green-800/20 text-white" />
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="price" className="text-white">Preis (€)</Label>
              <Input id="price" name="price" type="number" value={product.price} onChange={handleChange} required className="bg-gray-800/50 border-green-800/20 text-white" />
            </div>
            <div>
              <Label htmlFor="location" className="text-white">Standort</Label>
              <Input id="location" name="location" value={product.location} onChange={handleChange} required className="bg-gray-800/50 border-green-800/20 text-white" />
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <Label className="text-white">Kategorie</Label>
              <Select value={product.category} onValueChange={(v) => handleSelectChange('category', v)}>
                <SelectTrigger className="bg-gray-800/50 border-green-800/20 text-white"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-gray-800 border-green-800/20">
                  <SelectItem value="seeds">Samen</SelectItem>
                  <SelectItem value="equipment">Equipment</SelectItem>
                  <SelectItem value="nutrients">Nährstoffe</SelectItem>
                  <SelectItem value="accessories">Zubehör</SelectItem>
                  <SelectItem value="books">Bücher</SelectItem>
                  <SelectItem value="other">Sonstiges</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-white">Zustand</Label>
              <Select value={product.condition} onValueChange={(v) => handleSelectChange('condition', v)}>
                <SelectTrigger className="bg-gray-800/50 border-green-800/20 text-white"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-gray-800 border-green-800/20">
                  <SelectItem value="new">Neu</SelectItem>
                  <SelectItem value="like_new">Wie neu</SelectItem>
                  <SelectItem value="good">Gut</SelectItem>
                  <SelectItem value="fair">Akzeptabel</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-900/50 border-green-800/20">
        <CardContent className="p-6">
            <Label className="text-white mb-4 block">Bilder</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                {product.image_urls.map((url, i) => (
                    <div key={i} className="relative group">
                        <img src={url} className="w-full h-32 object-cover rounded-lg" />
                        <Button type="button" size="icon" variant="destructive" className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeImage(url)}>
                            <XCircle className="w-4 h-4"/>
                        </Button>
                    </div>
                ))}
                 <Button asChild variant="outline" className="w-full h-32 border-dashed border-green-800/50 text-green-400 hover:bg-green-500/10 hover:text-green-300">
                    <label htmlFor="image-upload" className="cursor-pointer flex flex-col items-center justify-center">
                        {isUploading ? <Loader2 className="w-6 h-6 animate-spin"/> : <ImageIcon className="w-6 h-6"/>}
                    </label>
                </Button>
                <input id="image-upload" type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isUploading} />
            </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-end">
        <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-8 py-6 text-base" disabled={isSubmitting || isUploading}>
          {isSubmitting && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
          {initialData.id ? 'Änderungen speichern' : 'Produkt einstellen'}
        </Button>
      </div>
    </form>
  );
}