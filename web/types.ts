export interface Menu {
  id: number;
  date: string;
  type: 'breakfast' | 'lunch' | 'dinner' | 'takeaway';
  category: string;
  name: string;
  is_featured: boolean;
  price: number;
}
