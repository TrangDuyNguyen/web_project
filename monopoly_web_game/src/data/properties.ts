import type { Property } from '@/types/game';

export const PROPERTIES: Property[] = [
  { id: 'mediterranean', name: 'Địa Trung Hải', position: 1, price: 60, rent: 2, colorGroup: 'brown' },
  { id: 'baltic', name: 'Ban-tic', position: 3, price: 60, rent: 4, colorGroup: 'brown' },
  { id: 'oriental', name: 'Phương Đông', position: 6, price: 100, rent: 6, colorGroup: 'light_blue' },
  { id: 'vermont', name: 'Vermont', position: 8, price: 100, rent: 6, colorGroup: 'light_blue' },
  { id: 'connecticut', name: 'Connecticut', position: 9, price: 120, rent: 8, colorGroup: 'light_blue' },
  { id: 'reading_rr', name: 'Đường sắt Reading', position: 5, price: 200, rent: 25, colorGroup: 'railroad' },
  { id: 'pennsylvania_rr', name: 'Đường sắt Pennsylvania', position: 15, price: 200, rent: 25, colorGroup: 'railroad' },
  { id: 'b_and_o_rr', name: 'Đường sắt B&O', position: 25, price: 200, rent: 25, colorGroup: 'railroad' },
  { id: 'short_line', name: 'Đường sắt Short Line', position: 35, price: 200, rent: 25, colorGroup: 'railroad' },
  { id: 'electric', name: 'Điện lực', position: 12, price: 150, rent: 40, colorGroup: 'utility' },
  { id: 'water', name: 'Cấp nước', position: 28, price: 150, rent: 40, colorGroup: 'utility' },
  { id: 'st_charles', name: 'St. Charles', position: 11, price: 140, rent: 10, colorGroup: 'pink' },
  { id: 'states', name: 'Bang', position: 13, price: 140, rent: 10, colorGroup: 'pink' },
  { id: 'virginia', name: 'Virginia', position: 14, price: 160, rent: 12, colorGroup: 'pink' },
  { id: 'st_james', name: 'St. James', position: 16, price: 180, rent: 14, colorGroup: 'orange' },
  { id: 'tennessee', name: 'Tennessee', position: 18, price: 180, rent: 14, colorGroup: 'orange' },
  { id: 'new_york', name: 'New York', position: 19, price: 200, rent: 16, colorGroup: 'orange' },
  { id: 'kentucky', name: 'Kentucky', position: 21, price: 220, rent: 18, colorGroup: 'red' },
  { id: 'indiana', name: 'Indiana', position: 23, price: 220, rent: 18, colorGroup: 'red' },
  { id: 'illinois', name: 'Illinois', position: 24, price: 240, rent: 20, colorGroup: 'red' },
  { id: 'atlantic', name: 'Đại Tây Dương', position: 26, price: 260, rent: 22, colorGroup: 'yellow' },
  { id: 'ventnor', name: 'Ventnor', position: 27, price: 260, rent: 22, colorGroup: 'yellow' },
  { id: 'marvin', name: 'Marvin Gardens', position: 29, price: 280, rent: 24, colorGroup: 'yellow' },
  { id: 'pacific', name: 'Thái Bình Dương', position: 31, price: 300, rent: 26, colorGroup: 'green' },
  { id: 'nc_avenue', name: 'Bắc Carolina', position: 32, price: 300, rent: 26, colorGroup: 'green' },
  { id: 'pennsylvania', name: 'Pennsylvania Ave', position: 34, price: 320, rent: 28, colorGroup: 'green' },
  { id: 'park_place', name: 'Park Place', position: 37, price: 350, rent: 35, colorGroup: 'dark_blue' },
  { id: 'boardwalk', name: 'Boardwalk', position: 39, price: 400, rent: 50, colorGroup: 'dark_blue' },
];

export const PROPERTY_BY_ID = Object.fromEntries(PROPERTIES.map((p) => [p.id, p]));
export const PROPERTY_BY_POSITION = Object.fromEntries(PROPERTIES.map((p) => [p.position, p]));
