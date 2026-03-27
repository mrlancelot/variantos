import React, { useState } from 'react'

export default function Checkout({ cart }) {
  const [submitted, setSubmitted] = useState(false)

  // BUG: No form validation — submits with empty fields
  const handleSubmit = (e) => {
    e.preventDefault()
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <h2>Order Placed!</h2>
        <p>Thank you for your purchase.</p>
      </div>
    )
  }

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)

  return (
    <div style={{ maxWidth: '500px' }}>
      <h2 style={{ fontSize: '20px', marginBottom: '20px' }}>Checkout</h2>

      {cart.length === 0 && (
        <p style={{ color: '#666', marginBottom: '20px' }}>Your cart is empty. Add some items first.</p>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '600' }}>Full Name</label>
            <input
              type="text"
              placeholder="John Doe"
              style={{ width: '100%', padding: '10px', border: '1px solid #e0e0e0', borderRadius: '6px', fontSize: '14px' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '600' }}>Email</label>
            <input
              type="text"
              placeholder="john@example.com"
              style={{ width: '100%', padding: '10px', border: '1px solid #e0e0e0', borderRadius: '6px', fontSize: '14px' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '600' }}>Address</label>
            <input
              type="text"
              placeholder="123 Main St"
              style={{ width: '100%', padding: '10px', border: '1px solid #e0e0e0', borderRadius: '6px', fontSize: '14px' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '600' }}>Card Number</label>
            <input
              type="text"
              placeholder="4242 4242 4242 4242"
              style={{ width: '100%', padding: '10px', border: '1px solid #e0e0e0', borderRadius: '6px', fontSize: '14px' }}
            />
          </div>
        </div>

        <div style={{ marginTop: '20px', padding: '15px', background: '#f9f9f9', borderRadius: '8px' }}>
          <p style={{ fontWeight: 'bold', fontSize: '18px' }}>Total: ${total.toFixed(2)}</p>
        </div>

        <button
          type="submit"
          style={{
            marginTop: '20px',
            width: '100%',
            backgroundColor: '#000',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            padding: '12px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: '600'
          }}
        >
          Place Order
        </button>
      </form>
    </div>
  )
}
