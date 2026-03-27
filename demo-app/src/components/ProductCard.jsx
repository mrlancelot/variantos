import React from 'react'

export default function ProductCard({ product, onAddToCart }) {
  return (
    <div style={{
      border: '1px solid #e0e0e0',
      borderRadius: '8px',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '10px'
    }}>
      <div style={{ fontSize: '48px' }}>{product.image}</div>
      <h3 style={{ fontSize: '16px', fontWeight: '600' }}>{product.name}</h3>
      <p style={{ color: '#666', fontSize: '14px' }}>{product.category}</p>
      <p style={{ fontSize: '18px', fontWeight: 'bold' }}>${product.price.toFixed(2)}</p>
      <button
        onClick={() => onAddToCart(product)}
        style={{
          backgroundColor: '#000',
          color: '#fff',
          border: 'none',
          borderRadius: '6px',
          padding: '10px 20px',
          cursor: 'pointer',
          fontSize: '14px',
          width: '100%'
        }}
      >
        Add to Cart
      </button>
    </div>
  )
}
