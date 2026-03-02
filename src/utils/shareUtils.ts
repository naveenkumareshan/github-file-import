import { getPublicAppUrl } from "./appUrl";

export interface CabinShareData {
  id: string;
  name: string;
  price?: number;
  fullAddress?: string;
  averageRating?: number;
  serialNumber?: string;
}

export interface HostelShareData {
  id: string;
  name: string;
  gender?: string;
  stay_type?: string;
  food_enabled?: boolean;
  food_policy_type?: string;
  location?: string;
  serial_number?: string;
}

const buildUrl = (path: string, userId?: string) => {
  const base = `${getPublicAppUrl()}${path}`;
  return userId ? `${base}?ref=${userId}` : base;
};

export const generateCabinShareText = (cabin: CabinShareData, userId?: string) => {
  const slug = cabin.serialNumber || cabin.id;
  const url = buildUrl(`/book-seat/${slug}`, userId);
  const lines = [
    `Check out this Reading Room on InhaleStays!`,
    `📚 ${cabin.name}`,
  ];
  if (cabin.fullAddress) lines.push(`📍 Location: ${cabin.fullAddress}`);
  if (cabin.price) lines.push(`💰 Price: ₹${cabin.price}/month`);
  if (cabin.averageRating && cabin.averageRating > 0) lines.push(`⭐ Rating: ${cabin.averageRating.toFixed(1)}`);
  lines.push(`🔗 Book here: ${url}`);
  return { text: lines.join("\n"), url, title: cabin.name };
};

export const generateHostelShareText = (hostel: HostelShareData, lowestPrice?: number, userId?: string) => {
  const slug = hostel.serial_number || hostel.id;
  const url = buildUrl(`/hostels/${slug}`, userId);
  const lines = [
    `Check out this Hostel on InhaleStays!`,
    `🏠 ${hostel.name}`,
  ];
  const meta: string[] = [];
  if (hostel.gender) meta.push(hostel.gender);
  if (hostel.stay_type) meta.push(hostel.stay_type === "long_term" ? "Long-term" : hostel.stay_type === "short_term" ? "Short-term" : "Both");
  if (meta.length) lines.push(meta.join(" | "));
  if (hostel.food_policy_type === 'mandatory') lines.push(`🍽 Food Included`);
  else if (hostel.food_policy_type === 'optional') lines.push(`🍽 Food Available`);
  else if (hostel.food_enabled) lines.push(`🍽 Food Available`);
  if (hostel.location) lines.push(`📍 ${hostel.location}`);
  if (lowestPrice && lowestPrice < Infinity) lines.push(`💰 Starting from ₹${lowestPrice}`);
  lines.push(`🔗 View details: ${url}`);
  return { text: lines.join("\n"), url, title: hostel.name };
};
