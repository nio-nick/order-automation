import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import React from 'react';
import { ShoppingCart, CheckCircle, Truck, Package } from 'lucide-react';

const COLORS = {
  indigo: '#4f46e5',
  slate: '#f8fafc',
  slateDark: '#1e293b',
  emerald: '#10b981',
  amber: '#f59e0b',
};

const MockUI = ({ children, title }) => (
  <div style={{
    width: '360px',
    height: '640px',
    backgroundColor: 'white',
    borderRadius: '40px',
    border: '8px solid #334155',
    overflow: 'hidden',
    position: 'relative',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    margin: '0 auto'
  }}>
    <div style={{ height: '24px', backgroundColor: '#334155', width: '100%' }}></div>
    <div style={{ padding: '20px', height: '100%', fontFamily: 'Inter, sans-serif' }}>
      {title && <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px', color: COLORS.slateDark }}>{title}</h2>}
      {children}
    </div>
  </div>
);

export const OrderFlow = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const spring1 = spring({ frame, fps, config: { damping: 20 } });
  const spring2 = spring({ frame: frame - 60, fps, config: { damping: 20 } });
  const spring3 = spring({ frame: frame - 120, fps, config: { damping: 20 } });

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.slate, justifyContent: 'center', alignItems: 'center' }}>
      {/* Scene 1: Customer Order */}
      {frame < 60 && (
        <div style={{ transform: `scale(${spring1})`, opacity: interpolate(frame, [0, 10, 50, 60], [0, 1, 1, 0]) }}>
          <MockUI title="Place Order">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ height: '40px', backgroundColor: '#f1f5f9', borderRadius: '8px', border: '1px solid #e2e8f0' }}></div>
              <div style={{ height: '40px', backgroundColor: '#f1f5f9', borderRadius: '8px', border: '1px solid #e2e8f0' }}></div>
              <div style={{ height: '80px', backgroundColor: '#f1f5f9', borderRadius: '8px', border: '1px solid #e2e8f0' }}></div>
              <button style={{
                backgroundColor: COLORS.indigo,
                color: 'white',
                padding: '12px',
                borderRadius: '8px',
                fontWeight: 'bold',
                marginTop: '20px',
                border: 'none'
              }}>Order Now</button>
            </div>
            <div style={{ position: 'absolute', bottom: '40px', left: '50%', transform: 'translateX(-50%)', textAlign: 'center', width: '100%' }}>
               <p style={{ fontWeight: 'bold', color: COLORS.slateDark }}>Step 1: Customer places order</p>
            </div>
          </MockUI>
        </div>
      )}

      {/* Scene 2: Merchant Dashboard */}
      {frame >= 60 && frame < 120 && (
        <div style={{ transform: `scale(${spring2})`, opacity: interpolate(frame, [60, 70, 110, 120], [0, 1, 1, 0]) }}>
          <MockUI title="Admin Dashboard">
            <div style={{ backgroundColor: '#fef3c7', padding: '10px', borderRadius: '8px', border: '1px solid #fde68a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#92400e' }}>Pending Order</span>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: COLORS.amber }}></div>
            </div>
            <div style={{ marginTop: '20px', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
              <p style={{ fontSize: '14px', fontWeight: 'bold' }}>John Doe</p>
              <p style={{ fontSize: '10px', color: '#64748b' }}>Dhaka, Bangladesh</p>
            </div>
            <button style={{
              backgroundColor: COLORS.indigo,
              color: 'white',
              padding: '12px',
              borderRadius: '8px',
              fontWeight: 'bold',
              marginTop: '20px',
              width: '100%',
              border: 'none'
            }}>Approve & Dispatch</button>
            <div style={{ position: 'absolute', bottom: '40px', left: '50%', transform: 'translateX(-50%)', textAlign: 'center', width: '100%' }}>
               <p style={{ fontWeight: 'bold', color: COLORS.slateDark }}>Step 2: Merchant Approves</p>
            </div>
          </MockUI>
        </div>
      )}

      {/* Scene 3: Dispatch Successful */}
      {frame >= 120 && (
        <div style={{ transform: `scale(${spring3})`, opacity: interpolate(frame, [120, 130, 170, 180], [0, 1, 1, 0]) }}>
          <MockUI>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80%', textAlign: 'center' }}>
              <div style={{ backgroundColor: COLORS.emerald, color: 'white', padding: '20px', borderRadius: '50%', marginBottom: '20px' }}>
                <CheckCircle size={48} />
              </div>
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: COLORS.slateDark }}>Dispatched!</h2>
              <p style={{ color: '#64748b', margin: '10px 0' }}>Order sent to Steadfast Courier</p>
              <div style={{ backgroundColor: '#f1f5f9', padding: '10px 20px', borderRadius: '8px', fontFamily: 'monospace', fontWeight: 'bold', color: COLORS.indigo, border: '1px dashed #cbd5e1' }}>
                STF-992834712
              </div>
            </div>
            <div style={{ position: 'absolute', bottom: '40px', left: '50%', transform: 'translateX(-50%)', textAlign: 'center', width: '100%' }}>
               <p style={{ fontWeight: 'bold', color: COLORS.slateDark }}>Step 3: Auto-Tracking Generated</p>
            </div>
          </MockUI>
        </div>
      )}
    </AbsoluteFill>
  );
};
