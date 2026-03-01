import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const REFERRER_KEY = "inhale_referrer";
const REFERRER_PROPERTY_KEY = "inhale_referrer_property";

export const useReferralCapture = () => {
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const ref = params.get("ref");
    if (ref) {
      localStorage.setItem(REFERRER_KEY, ref);
      // Try to extract property info from path
      const path = location.pathname;
      if (path.includes("/book-seat/")) {
        const slug = path.split("/book-seat/")[1];
        localStorage.setItem(REFERRER_PROPERTY_KEY, JSON.stringify({ type: "cabin", slug }));
      } else if (path.includes("/hostels/")) {
        const slug = path.split("/hostels/")[1];
        localStorage.setItem(REFERRER_PROPERTY_KEY, JSON.stringify({ type: "hostel", slug }));
      }
    }
  }, [location.search, location.pathname]);
};

export const getReferrer = () => localStorage.getItem(REFERRER_KEY);
export const getReferrerProperty = () => {
  const val = localStorage.getItem(REFERRER_PROPERTY_KEY);
  return val ? JSON.parse(val) : null;
};
export const clearReferrer = () => {
  localStorage.removeItem(REFERRER_KEY);
  localStorage.removeItem(REFERRER_PROPERTY_KEY);
};
