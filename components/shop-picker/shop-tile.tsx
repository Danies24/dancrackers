"use client";

import Link from "next/link";
import Image from "next/image";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { tileMetaLine, type ShopTile as ShopTileData } from "@/lib/shop-picker";

type Size = "lg" | "sm";

const BOX: Record<Size, string> = {
  lg: "h-[132px] w-[132px] rounded-[28px] text-5xl",
  sm: "h-[74px] w-[74px] rounded-[20px] text-2xl",
};

function TileFace({ tile, size, ring, here }: { tile: ShopTileData; size: Size; ring: boolean; here: boolean }) {
  const soon = tile.state === "coming_soon";
  return (
    <span
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden font-display font-bold text-on-fill",
        BOX[size],
        soon && "opacity-50",
        ring && "ring-[3px] ring-gold ring-offset-2",
        ring && (size === "lg" ? "ring-offset-shop-header-bg" : "ring-offset-cream"),
      )}
      style={tile.logoUrl ? undefined : { backgroundImage: `linear-gradient(135deg, ${tile.accent.from}, ${tile.accent.to})` }}
    >
      {tile.logoUrl ? (
        <Image
          src={tile.logoUrl}
          alt=""
          width={size === "lg" ? 132 : 74}
          height={size === "lg" ? 132 : 74}
          className="h-full w-full object-cover"
        />
      ) : (
        <span aria-hidden>{tile.nameEn.charAt(0).toUpperCase()}</span>
      )}
      {soon && (
        <span className="absolute inset-x-0 bottom-2 mx-auto w-fit rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white">
          Opening soon
        </span>
      )}
      {here && (
        <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-teal text-shop-header-bg">
          <Check size={12} aria-hidden />
        </span>
      )}
    </span>
  );
}

/**
 * One shop in the picker. `lg` (132px) on /shops with name + meta underneath;
 * `sm` (74px) on the home row and in the switch sheet with just the name.
 * A coming_soon shop is a button (never navigates); everything else a Link.
 */
export function ShopTile({
  tile,
  size,
  ring = false,
  here = false,
  onSelect,
  onSoonTap,
}: {
  tile: ShopTileData;
  size: Size;
  ring?: boolean;
  here?: boolean;
  onSelect?: () => void;
  onSoonTap?: () => void;
}) {
  const lg = size === "lg";
  const label = (
    <span className={cn("mt-2 block text-center", lg ? "w-[132px]" : "w-[74px]")}>
      <span className={cn("block truncate font-semibold", lg ? "text-sm" : "text-[11px]", "text-inherit")}>{tile.nameEn}</span>
      {lg && tile.nameTa && <span className="block truncate text-xs opacity-70">{tile.nameTa}</span>}
      {lg && <span className="mt-0.5 block text-[11px] opacity-70">{tileMetaLine(tile)}</span>}
      {here && <span className="block text-[10px] font-bold text-teal">You&apos;re here</span>}
    </span>
  );

  if (tile.state === "coming_soon") {
    return (
      <button type="button" onClick={onSoonTap} className="flex flex-col items-center text-inherit" aria-label={`${tile.nameEn} — opening soon`}>
        <TileFace tile={tile} size={size} ring={ring} here={here} />
        {label}
      </button>
    );
  }
  return (
    <Link href={tile.href} onClick={onSelect} className="flex flex-col items-center text-inherit" aria-current={here ? "page" : undefined}>
      <TileFace tile={tile} size={size} ring={ring} here={here} />
      {label}
    </Link>
  );
}

export function AllShopsTile({ size, onSelect }: { size: Size; onSelect?: () => void }) {
  const lg = size === "lg";
  return (
    <Link href="/" onClick={onSelect} className="flex flex-col items-center text-inherit">
      <span
        className={cn(
          "flex items-center justify-center border-2 border-dashed border-white/30 font-bold",
          BOX[size],
        )}
        aria-hidden
      >
        ⊞
      </span>
      <span className={cn("mt-2 block truncate text-center font-semibold", lg ? "w-[132px] text-sm" : "w-[74px] text-[11px]")}>
        All shops
      </span>
    </Link>
  );
}
