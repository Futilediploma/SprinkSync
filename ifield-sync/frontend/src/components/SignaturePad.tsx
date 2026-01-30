import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import SignatureCanvas from 'signature_pad';

interface SignaturePadProps {
  width?: number;
  height?: number;
  className?: string;
}

export interface SignaturePadRef {
  clear: () => void;
  isEmpty: () => boolean;
  toDataURL: () => string;
}

const SignaturePad = forwardRef<SignaturePadRef, SignaturePadProps>(

  ({ height = 200, className = '' }, ref) => {

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const signaturePadRef = useRef<SignatureCanvas | null>(null);

    useEffect(() => {
      if (canvasRef.current) {
        signaturePadRef.current = new SignatureCanvas(canvasRef.current, {
          backgroundColor: 'rgb(255, 255, 255)',
          penColor: 'rgb(0, 0, 0)',
        });

        // Handle window resize
        const resizeCanvas = () => {
          if (canvasRef.current && signaturePadRef.current) {
            const ratio = Math.max(window.devicePixelRatio || 1, 1);
            const canvas = canvasRef.current;
            canvas.width = canvas.offsetWidth * ratio;
            canvas.height = canvas.offsetHeight * ratio;
            canvas.getContext('2d')?.scale(ratio, ratio);
            signaturePadRef.current.clear();
          }
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        return () => {
          window.removeEventListener('resize', resizeCanvas);
          signaturePadRef.current?.off();
        };
      }
    }, []);

    useImperativeHandle(ref, () => ({
      clear: () => {
        signaturePadRef.current?.clear();
      },
      isEmpty: () => {
        return signaturePadRef.current?.isEmpty() ?? true;
      },
      toDataURL: () => {
        return signaturePadRef.current?.toDataURL() ?? '';
      },
    }));

    return (
      <canvas
        ref={canvasRef}
        className={`signature-canvas ${className}`}
        style={{ width: '100%', height: `${height}px` }}
      />
    );
  }
);

SignaturePad.displayName = 'SignaturePad';

export default SignaturePad;
