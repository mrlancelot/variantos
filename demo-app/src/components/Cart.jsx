import React from 'react'

export default function Cart({ items, onRemove }) {
  if (items.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
        <p>Your cart is empty</p>
      </div>
    )
  }

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  return (
    <div>
      <h2 style={{ fontSize: '20px', marginBottom: '20px' }}>Shopping Cart</h2>
      {items.map(item => (
        <div key={item.id} style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '15px',
          borderBottom: '1px solid #eee'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <span style={{ fontSize: '32px' }}>{item.image}</span>
            <div>
              <p style={{ fontWeight: '600' }}>{item.name}</p>
              <p style={{ color: '#666', fontSize: '14px' }}>Qty: {item.quantity}</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <p style={{ fontWeight: 'bold' }}>${(item.price * item.quantity).toFixed(2)}</p>
            <button
              onClick={() => onRemove(item.id)}
              style={{ background: 'none', border: '1px solid #e0e0e0', borderRadius: '4px', padding: '5px 10px', cursor: 'pointer' }}
            >
              Remove
            </button>
          </div>
        </div>
      ))}
      <div style={{ textAlign: 'right', padding: '20px 0', fontSize: '20px', fontWeight: 'bold' }}>
        Total: ${total.toFixed(2)}
      </div>
    </div>
  )
}
