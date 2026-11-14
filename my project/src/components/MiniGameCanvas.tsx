import React, { useEffect, useRef, useState } from 'react';
import { GameSpec } from '../domain/catalog';
import { Language } from '../domain/i18n';

interface MiniGameCanvasProps {
  game: GameSpec;
  language: Language;
}

export const MiniGameCanvas: React.FC<MiniGameCanvasProps> = ({ game, language }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [score, setScore] = useState(0);
  const [note, setNote] = useState('');
  const [playerX, setPlayerX] = useState(40);
  const [dice, setDice] = useState(6);
  const [cards, setCards] = useState<string[]>(['A♠', 'K♠', 'Q♠']);

  useEffect(() => {
    setScore(0);
    setNote('');
    setPlayerX(40);
  }, [game.id]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Background
    ctx.fillStyle = '#090B10';
    ctx.fillRect(0, 0, w, h);

    if (game.id === 'carrom') {
      ctx.fillStyle = '#D6B98C';
      ctx.fillRect(36, 16, w - 72, h - 32);
      ctx.strokeStyle = '#78350F';
      ctx.lineWidth = 4;
      ctx.strokeRect(36, 16, w - 72, h - 32);
      ctx.fillStyle = '#EAB308';
      ctx.beginPath();
      ctx.arc(Math.max(60, Math.min(w - 60, playerX * 2.5)), h - 42, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#DC2626';
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, 10, 0, Math.PI * 2);
      ctx.fill();
    } else if (game.id === 'pool') {
      ctx.fillStyle = '#065F46';
      ctx.fillRect(24, 24, w - 48, h - 48);
      ctx.strokeStyle = '#78350F';
      ctx.lineWidth = 6;
      ctx.strokeRect(24, 24, w - 48, h - 48);
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(80, h / 2, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#EF4444';
      ctx.beginPath();
      ctx.arc(w - 95, h / 2 - 14, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FACC15';
      ctx.beginPath();
      ctx.arc(w - 95, h / 2 + 14, 10, 0, Math.PI * 2);
      ctx.fill();
    } else if (game.id === 'brick_block') {
      const cols = 8;
      const rows = 5;
      const cell = 24;
      const startX = (w - cols * cell) / 2;
      const startY = 24;
      const filled = Math.min(40, Math.floor(score / 20) + 10);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const idx = r * cols + c;
          ctx.fillStyle = idx < filled ? '#38BDF8' : '#1F2937';
          ctx.fillRect(startX + c * cell + 2, startY + r * cell + 2, cell - 4, cell - 4);
        }
      }
    } else if (game.id === 'archery') {
      const cx = w / 2;
      const cy = h / 2;
      const rings = [
        { r: 58, color: '#F8FAFC' },
        { r: 42, color: '#3B82F6' },
        { r: 26, color: '#EF4444' },
        { r: 10, color: '#FACC15' },
      ];
      for (const ring of rings) {
        ctx.fillStyle = ring.color;
        ctx.beginPath();
        ctx.arc(cx, cy, ring.r, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (game.id === 'balloon_shooter') {
      const bx = 70 + ((score * 7) % (w - 140));
      ctx.fillStyle = '#F43F5E';
      ctx.beginPath();
      ctx.arc(bx, 72, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#94A3B8';
      ctx.beginPath();
      ctx.moveTo(bx, 94);
      ctx.lineTo(bx, 132);
      ctx.stroke();
    } else if (game.id === 'level_devil') {
      ctx.fillStyle = '#1E293B';
      ctx.fillRect(16, h - 38, w * 0.42, 22);
      ctx.fillRect(w * 0.58, h - 38, w * 0.36, 22);
      ctx.fillStyle = '#F97316';
      ctx.fillRect(Math.min(w - 40, playerX * 2), h - 62, 22, 24);
      ctx.fillStyle = '#10B981';
      ctx.fillRect(w - 42, h - 78, 22, 40);
    } else if (game.id === 'mini_militia') {
      ctx.fillStyle = '#22C55E';
      ctx.beginPath();
      ctx.arc(64, h - 55, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#EF4444';
      ctx.beginPath();
      ctx.arc(w - 72, 58, 18, 0, Math.PI * 2);
      ctx.fill();
    } else if (game.id === 'ludo_star') {
      const box = 112;
      const sx = (w - box) / 2;
      const sy = (h - box) / 2;
      ctx.fillStyle = '#1E3A8A';
      ctx.fillRect(sx, sy, box / 2, box / 2);
      ctx.fillStyle = '#065F46';
      ctx.fillRect(sx + box / 2, sy, box / 2, box / 2);
      ctx.fillStyle = '#991B1B';
      ctx.fillRect(sx, sy + box / 2, box / 2, box / 2);
      ctx.fillStyle = '#92400E';
      ctx.fillRect(sx + box / 2, sy + box / 2, box / 2, box / 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 16px JetBrains Mono, monospace';
      ctx.fillText(`DICE ${dice}`, sx + 22, sy + box / 2 + 6);
    } else if (game.id === 'teen_patti') {
      ctx.fillStyle = '#064E3B';
      ctx.fillRect(20, 18, w - 40, h - 36);
      cards.forEach((c, idx) => {
        const cx = 62 + idx * 66;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(cx, 44, 48, 72);
        ctx.fillStyle = '#111827';
        ctx.font = 'bold 14px JetBrains Mono, monospace';
        ctx.fillText(c, cx + 10, 84);
      });
    }
  }, [game.id, playerX, score, dice, cards]);

  const handleAction = () => {
    if (game.id === 'teen_patti') {
      const deck = ['A♠', 'K♠', 'Q♠', 'J♥', '10♦', '9♣', '8♥', '7♠'];
      const next = [...deck].sort(() => Math.random() - 0.5).slice(0, 3);
      setCards(next);
      setScore((s) => s + 10);
      setNote(language === 'bn' ? 'ফ্রি প্র্যাকটিস হ্যান্ড — কোনো বাজি নেই' : 'Free practice hand — zero wagering');
      return;
    }
    if (game.id === 'ludo_star') {
      const rolled = Math.floor(Math.random() * 6) + 1;
      setDice(rolled);
      setScore((s) => s + rolled * 5);
      setNote(`Dice rolled: ${rolled}`);
      return;
    }
    setPlayerX((x) => (x >= 120 ? 32 : x + 22));
    setScore((s) => s + 25);
    setNote(language === 'bn' ? 'অফলাইন প্র্যাকটিস সেশন চলছে' : 'Offline practice action recorded');
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
        <span>{language === 'bn' ? game.titleBn : game.titleEn}</span>
        <span className="font-mono-tabular">Score: {score}</span>
      </div>
      <canvas
        ref={canvasRef}
        width={310}
        height={165}
        data-testid="game-preview-canvas"
        className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-[#090B10]"
      />
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={handleAction}
          className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 transition-colors whitespace-nowrap shrink-0"
        >
          {game.id === 'teen_patti'
            ? language === 'bn'
              ? 'ফ্রি কার্ড ডিল'
              : 'Deal Free Hand'
            : game.id === 'ludo_star'
              ? language === 'bn'
                ? 'ডাইস চালুন'
                : 'Roll Dice'
              : language === 'bn'
                ? 'প্র্যাকটিস অ্যাকশন'
                : 'Practice Move'}
        </button>
        <span className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
          {note || (game.supports1v1Match ? 'Offline + 1v1 Eligible' : 'Offline Practice')}
        </span>
      </div>
    </div>
  );
};
