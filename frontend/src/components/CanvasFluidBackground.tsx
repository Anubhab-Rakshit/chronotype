import { useEffect, useRef } from 'react';

export function CanvasFluidBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;
    let animationFrameId: number;
    
    interface IParticle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      maxSpeed: number;
      friction: number;
      update: () => void;
      draw: (c: CanvasRenderingContext2D) => void;
    }

    let particles: IParticle[] = [];
    const numParticles = window.innerWidth > 768 ? 1000 : 350;
    
    let mouse = { x: -1000, y: -1000, vx: 0, vy: 0 };
    let lastMouse = { x: -1000, y: -1000 };
    let zoff = 0;

    const resize = () => {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles();
    };

    class Particle implements IParticle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      maxSpeed: number;
      friction: number;

      constructor() {
        this.x = Math.random() * (canvas?.width || window.innerWidth);
        this.y = Math.random() * (canvas?.height || window.innerHeight);
        this.vx = 0;
        this.vy = 0;
        this.size = Math.random() * 2 + 1;
        this.maxSpeed = Math.random() * 1.5 + 0.5;
        this.friction = 0.95;
      }

      update() {
        const scale = 0.003;
        const angle = Math.sin(this.x * scale + zoff) * Math.cos(this.y * scale + zoff) * Math.PI * 2;
        
        this.vx += Math.cos(angle) * 0.1;
        this.vy += Math.sin(angle) * 0.1;

        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 250) {
          const force = (250 - distance) / 250;
          this.vx += (mouse.vx * force * 0.1) - (dx / distance) * force * 0.5;
          this.vy += (mouse.vy * force * 0.1) - (dy / distance) * force * 0.5;
        }

        this.vx *= this.friction;
        this.vy *= this.friction;
        
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (speed > this.maxSpeed) {
          this.vx = (this.vx / speed) * this.maxSpeed;
          this.vy = (this.vy / speed) * this.maxSpeed;
        }

        this.x += this.vx;
        this.y += this.vy;

        if (canvas) {
          if (this.x > canvas.width) this.x = 0;
          if (this.x < 0) this.x = canvas.width;
          if (this.y > canvas.height) this.y = 0;
          if (this.y < 0) this.y = canvas.height;
        }
      }

      draw(c: CanvasRenderingContext2D) {
        c.fillStyle = 'rgba(255, 255, 255, 0.035)';
        c.beginPath();
        c.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        c.fill();
      }
    }

    const initParticles = () => {
      particles = [];
      for (let i = 0; i < numParticles; i++) {
        particles.push(new Particle());
      }
    };

    const animate = () => {
      // Liquid smoke trailing effect
      ctx.fillStyle = 'rgba(5, 5, 5, 0.12)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      zoff += 0.001;

      mouse.vx = mouse.x - lastMouse.x;
      mouse.vy = mouse.y - lastMouse.y;
      lastMouse.x = mouse.x;
      lastMouse.y = mouse.y;

      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw(ctx);
      }
      
      animationFrameId = requestAnimationFrame(animate);
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', handleMouseMove);

    resize();
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full opacity-80 mix-blend-lighten"
        style={{ filter: 'blur(1px)' }}
      />
      {/* Subtle vignette / depth overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_rgba(0,0,0,0.7)_100%)]" />
    </div>
  );
}

export default CanvasFluidBackground;
