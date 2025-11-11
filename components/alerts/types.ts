export type AlertFormData = {
  name: string;
  areas: string;
  minPrice: number | null;
  maxPrice: number | null;
  bedrooms: 'studio' | '1' | '2' | '3' | '4+' | null;
  minBaths: number | null;
  noFee: boolean;
  filterRentStabilized: boolean;
  preferredFrequency: '15min' | '30min' | '1hour';
  enablePhoneNotifications: boolean;
  enableEmailNotifications: boolean;
};
