import React from 'react'
import ProductCard from './ProductCard'

export default function ProductGrid({ products, onAddToCart }) {
  return (
    <div>
      <h2 style={{ fontSize: '20px', marginBottom: '20px' }}>All Products</h2>
      {/* BUG: No search or filter UI — just a flat list */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
        gap: '20px'
      }}>
        {products.map(product => (
          <ProductCard key={product.id} product={product} onAddToCart={onAddToCart} />
        ))}
      </div>
    </div>
  )
}
