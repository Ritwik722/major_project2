// components/SignatureVerification.js
import { useEffect, useRef } from 'react';
import SignaturePad from 'signature_pad';

const SignatureVerification = ({ studentId, onSave }) => {
  const canvasRef = useRef(null);
  const signaturePad = useRef(null);

  useEffect(() => {
    signaturePad.current = new SignaturePad(canvasRef.current, {
      backgroundColor: 'rgba(255, 255, 255, 0)',
      penColor: 'rgb(0, 0, 0)'
    });

    return () => signaturePad.current.off();
  }, []);

  const handleSave = async () => {
    if (!signaturePad.current.isEmpty()) {
      const dataURL = signaturePad.current.toDataURL();
      try {
        const response = await fetch('http://localhost:5000/api/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studentId,
            signatureData: dataURL.split(',')[1]
          })
        });
        
        const result = await response.json();
        onSave(result);
        
      } catch (error) {
        console.error('Verification error:', error);
      }
    }
  };

  return (
    <div className="signature-verification">
      <canvas ref={canvasRef} width={500} height={200} />
      <button onClick={handleSave}>Verify Signature</button>
    </div>
  );
};
