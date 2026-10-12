import { Check } from "lucide-react";
import { demoRoomAmenities } from "@/lib/demo-content";
import { roomAmenities } from "@/lib/utils";

export default function RoomAmenitiesList({ room }) {
  const fromRoom = roomAmenities(room);
  const amenities = fromRoom.length
    ? fromRoom
    : demoRoomAmenities.map((name) => ({ id: name, name }));

  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {amenities.map((amenity) => (
        <li
          key={amenity.id || amenity.slug || amenity.name}
          className="flex items-start gap-3 rounded-2xl border border-line bg-elevated/70 px-4 py-3"
        >
          <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
            <Check className="size-3.5" strokeWidth={2.5} />
          </span>
          <span className="text-sm font-medium text-ink">{amenity.name}</span>
        </li>
      ))}
    </ul>
  );
}
