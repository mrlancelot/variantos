import React, { useState } from 'react'
import ProductGrid from './components/ProductGrid'
import Cart from './components/Cart'
import Checkout from './components/Checkout'

const products = [
  { id: 1, name: 'Wireless Headphones', price: 79.99, image: '🎧', category: 'Electronics' },
  { id: 2, name: 'Running Shoes', price: 129.99, image: '👟', category: 'Sports' },
  { id: 3, name: 'Coffee Maker', price: 49.99, image: '☕', category: 'Kitchen' },
  { id: 4, name: 'Backpack', price: 59.99, image: '🎒', category: 'Accessories' },
  { id: 5, name: 'Desk Lamp', price: 34.99, image: '💡', category: 'Home' },
  { id: 6, name: 'Yoga Mat', price: 24.99, image: '🧘', category: 'Sports' },
  { id: 7, name: 'Water Bottle', price: 14.99, image: '🍶', category: 'Accessories' },
  { id: 8, name: 'Bluetooth Speaker', price: 44.99, image: '🔊', category: 'Electronics' },
]

export default function App() {
  const [cart, setCart] = useState([])
  const [page, setPage] = useState('shop')

  // BUG: addToCart does nothing — empty function body, cart never updates
  const addToCart = (product) => {
    // TODO: implement add to cart
    console.log('Add to cart clicked for', product.name)
  }

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.id !== productId))
  }

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '1px solid #eee', paddingBottom: '15px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>ShopDemo</h1>
        <nav style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <button
            onClick={() => setPage('shop')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: page === 'shop' ? '#000' : '#666' }}
          >
            Shop
          </button>
          <button
            onClick={() => setPage('cart')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: page === 'cart' ? '#000' : '#666' }}
          >
            Cart ({cart.reduce((sum, item) => sum + item.quantity, 0)})
          </button>
          <button
            onClick={() => setPage('checkout')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: page === 'checkout' ? '#000' : '#666' }}
          >
            Checkout
          </button>
        </nav>
      </header>

      {/* BUG: No way to filter or search products */}
      {page === 'shop' && <ProductGrid products={products} onAddToCart={addToCart} />}
      {page === 'cart' && <Cart items={cart} onRemove={removeFromCart} />}
      {page === 'checkout' && <Checkout cart={cart} />}
    </div>
  )
}
