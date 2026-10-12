import Image from "next/image";
import Link from "next/link";
import { Play } from "lucide-react";
import { isGalleryVideo } from "@/lib/gallery-items";
import { cn } from "@/lib/utils";

const tileClassName =
  "group relative block w-full aspect-[4/5] overflow-hidden rounded-2xl border border-line bg-accent-soft transition-[transform,box-shadow,border-color] duration-300 ease-out motion-safe:hover:-translate-y-1 motion-safe:hover:scale-[1.02] motion-safe:hover:border-accent/30 motion-safe:hover:shadow-soft md:aspect-square";

export function VignetteTile({ item, onSelect, className }) {
  const video = isGalleryVideo(item);
  const image = (
    <>
      {video ? (
        <video
          src={item.src}
          muted
          playsInline
          preload="metadata"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          aria-hidden
        />
      ) : (
        <Image
          src={item.src}
          alt={item.alt}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-105"
          sizes="(max-width: 768px) 50vw, 280px"
        />
      )}
      {video ? (
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="flex size-11 items-center justify-center rounded-full bg-ink/55 text-white backdrop-blur-sm">
            <Play className="size-5 fill-current" />
          </span>
        </span>
      ) : null}
      {item.caption ? (
        <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 to-transparent px-3 py-3 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
          {item.caption}
        </span>
      ) : null}
    </>
  );

  const classes = cn(tileClassName, className);

  if (onSelect) {
    return (
      <button type="button" className={classes} onClick={() => onSelect(item)}>
        {image}
      </button>
    );
  }

  return (
    <Link href={item.href || "/gallery"} className={classes}>
      {image}
    </Link>
  );
}

function Tile({ item, onSelect }) {
  return <VignetteTile item={item} onSelect={onSelect} />;
}

export default function GalleryPreviewGrid({ items = [], onSelect }) {
  if (!items.length) return null;

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
      {items.map((item) => (
        <Tile key={item.id} item={item} onSelect={onSelect} />
      ))}
    </div>
  );
}
