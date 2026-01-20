import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';

export interface ConfettiRef {
    fire: () => void;
}

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    color: string;
    alpha: number;
    size: number;
    decay: number;
}

const COLORS = ['#14b8a6', '#f43f5e', '#fbbf24', '#818cf8', '#34d399', '#ffffff'];

export const Confetti = forwardRef<ConfettiRef>((props, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particles = useRef<Particle[]>([]);
    const animationId = useRef<number | null>(null);

    const createParticle = (x: number, y: number): Particle => {
        const angle = Math.random() * Math.PI * 2;
        const velocity = 5 + Math.random() * 8; // Burst speed
        return {
            x,
            y,
            vx: Math.cos(angle) * velocity,
            vy: Math.sin(angle) * velocity,
            color: COLORS[Math.floor(Math.random() * COLORS.length)],
            alpha: 1,
            size: 4 + Math.random() * 4,
            decay: 0.005 + Math.random() * 0.01 // Slow fade for "seamless" feel
        };
    };

    const animate = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Update and draw particles
        for (let i = particles.current.length - 1; i >= 0; i--) {
            const p = particles.current[i];
            
            p.x += p.vx;
            p.y += p.vy;
            
            p.vy += 0.15; // Gravity
            p.vx *= 0.96; // Air resistance (drag)
            p.vy *= 0.96; 

            p.alpha -= p.decay;

            if (p.alpha <= 0) {
                particles.current.splice(i, 1);
            } else {
                ctx.globalAlpha = p.alpha;
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        if (particles.current.length > 0) {
            animationId.current = requestAnimationFrame(animate);
        } else {
            animationId.current = null;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    };

    const fire = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Resize canvas to full screen just in case
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        // Spawn particles from center
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        for (let i = 0; i < 120; i++) {
            particles.current.push(createParticle(centerX, centerY));
        }

        if (!animationId.current) {
            animate();
        }
    };

    useImperativeHandle(ref, () => ({
        fire
    }));

    // Handle window resize
    useEffect(() => {
        const handleResize = () => {
            if (canvasRef.current) {
                canvasRef.current.width = window.innerWidth;
                canvasRef.current.height = window.innerHeight;
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <canvas 
            ref={canvasRef} 
            className="fixed inset-0 pointer-events-none z-[100]"
            style={{ width: '100%', height: '100%' }}
        />
    );
});