import { MapPin } from "lucide-react";
import ImageWithFallback from "@/components/ui/ImageWithFallback";

export default function ProductDetailModal({ data }) {
  const images = Array.isArray(data?.image_urls) && data.image_urls.length > 0 ? data.image_urls : [data?.cover_image_url].filter(Boolean);

  return (
    <div className="p-4 sm:p-6">
      {/* Simple carousel (first image visible) */}
      {images?.[0] && (
        <div className="w-full aspect-video rounded-xl overflow-hidden bg-black mb-4">
          <ImageWithFallback src={images[0]} alt={data?.title} className="w-full h-full object-cover" />
        </div>
      )}
      <h3 className="text-white text-xl font-bold">{data?.title}</h3>
      <div className="text-green-400 text-lg font-semibold mt-1">{typeof data?.price === "number" ? `${data.price.toFixed(2)} €` : ""}</div>
      <div className="text-zinc-400 text-sm mt-2 flex items-center gap-2">
        <MapPin className="w-4 h-4" /> {data?.location || "—"}
      </div>
      {data?.description && <p className="text-zinc-300 mt-3">{data.description}</p>}
      <div className="mt-4">
        <button className="px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-sm">Kontaktieren</button>
      </div>
    </div>
  );
}