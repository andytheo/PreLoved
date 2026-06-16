export const CATEGORIES = [
  { id: 'furniture', name: 'Furniture', icon: '🪑', color: 'bg-amber-100 text-amber-800' },
  { id: 'clothing', name: 'Clothing', icon: '👕', color: 'bg-blue-100 text-blue-800' },
  { id: 'electronics', name: 'Electronics', icon: '📱', color: 'bg-purple-100 text-purple-800' },
  { id: 'books', name: 'Books', icon: '📚', color: 'bg-green-100 text-green-800' },
  { id: 'toys', name: 'Toys & Games', icon: '🎮', color: 'bg-pink-100 text-pink-800' },
  { id: 'sports', name: 'Sports', icon: '⚽', color: 'bg-orange-100 text-orange-800' },
  { id: 'kitchen', name: 'Kitchen', icon: '🍳', color: 'bg-red-100 text-red-800' },
  { id: 'decor', name: 'Home Decor', icon: '🏠', color: 'bg-teal-100 text-teal-800' },
  { id: 'baby', name: 'Baby Items', icon: '🍼', color: 'bg-yellow-100 text-yellow-800' },
  { id: 'tools', name: 'Tools', icon: '🔧', color: 'bg-gray-100 text-gray-800' },
  { id: 'garden', name: 'Garden', icon: '🌱', color: 'bg-lime-100 text-lime-800' },
  { id: 'other', name: 'Other', icon: '📦', color: 'bg-slate-100 text-slate-800' },
]

export const CONDITIONS = [
  { id: 'new', name: 'New', description: 'Never used, with tags' },
  { id: 'like-new', name: 'Like New', description: 'Used once or twice, no signs of wear' },
  { id: 'good', name: 'Good', description: 'Gently used, minor wear' },
  { id: 'fair', name: 'Fair', description: 'Visible wear but fully functional' },
  { id: 'for-parts', name: 'For Parts', description: 'Not fully functional' },
]

export function getCategoryById(id: string) {
  return CATEGORIES.find(c => c.id === id)
}

export function getConditionById(id: string) {
  return CONDITIONS.find(c => c.id === id)
}
