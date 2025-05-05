import React, { useRef, useEffect, useState } from 'react';

const SPRITE_SIZE = 256;
const IDLE_FRAMES = 6;
const WALK_FRAMES = 8;
const RUN_FRAMES = 8;
const ATTACK_FRAMES = 8;

const ANIMATION_ROWS = {
  idle: 0,
  walk: 1,
  run: 2,
  attack: 3,
};

// Character list for selector
const CHARACTERS = [
  { name: 'Samurai 1', file: '/assets/ui/characters/samurai1.png' },
  { name: 'Samurai 2', file: '/assets/ui/characters/samurai2.png' },
  { name: 'Orc 1', file: '/assets/ui/characters/orc1.png' },
  { name: 'Samurai 3', file: '/assets/ui/characters/samurai3.png' },
  { name: 'Dragon 1', file: '/assets/ui/characters/dragon1.png' },
  // Add more characters here
];

const BeatEmUpQTE: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const spriteRef = useRef<HTMLImageElement | null>(null);
  const frame = useRef(0);
  const animation = useRef<'idle' | 'walk' | 'run' | 'attack'>('idle');
  const [selectedCharacter, setSelectedCharacter] = useState(CHARACTERS[0].file);

  useEffect(() => {
    const sprite = new window.Image();
    sprite.src = selectedCharacter;
    sprite.onload = () => {
      spriteRef.current = sprite;
      drawFrame();
    };
  }, [selectedCharacter]);

  function drawFrame() {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx || !spriteRef.current) return;
    console.log('Drawing frame', frame.current, 'animation', animation.current, 'image', spriteRef.current.src);
    ctx.clearRect(0, 0, SPRITE_SIZE, SPRITE_SIZE);
    const row = ANIMATION_ROWS[animation.current];
    ctx.drawImage(
      spriteRef.current,
      frame.current * SPRITE_SIZE,
      row * SPRITE_SIZE,
      SPRITE_SIZE,
      SPRITE_SIZE,
      0,
      0,
      SPRITE_SIZE,
      SPRITE_SIZE
    );
  }

  // Animation per Tastendruck wechseln
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === '1') animation.current = 'idle';
      if (e.key === '2') animation.current = 'walk';
      if (e.key === '3') animation.current = 'run';
      if (e.key === '4') animation.current = 'attack';
      frame.current = 0;
      drawFrame();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  // Frame-Loop (mit variabler Geschwindigkeit)
  useEffect(() => {
    let timeoutId: number;
    let running = true;

    function getFrameDuration() {
      if (animation.current === 'walk') return 80; // 0.08s
      if (animation.current === 'run') return 50; // 0.05s
      return 120; // 0.12s for idle/attack
    }

    function getMaxFrames() {
      if (animation.current === 'idle') return IDLE_FRAMES;
      if (animation.current === 'walk') return WALK_FRAMES;
      if (animation.current === 'run') return RUN_FRAMES;
      if (animation.current === 'attack') return ATTACK_FRAMES;
      return IDLE_FRAMES;
    }

    function loop() {
      if (!running) return;
      drawFrame();
      const maxFrames = getMaxFrames();
      frame.current = (frame.current + 1) % maxFrames;
      timeoutId = window.setTimeout(loop, getFrameDuration());
    }
    loop();
    return () => {
      running = false;
      clearTimeout(timeoutId);
    };
  }, []);

  return (
    <div className="qte-test-area">
      <div style={{ marginBottom: 16 }}>
        <label>
          Charakter wählen:{' '}
          <select
            value={selectedCharacter}
            onChange={e => setSelectedCharacter(e.target.value)}
            style={{ fontSize: '1rem', padding: '0.3rem', fontFamily: 'inherit' }}
          >
            {CHARACTERS.map(char => (
              <option key={char.file} value={char.file}>{char.name}</option>
            ))}
          </select>
        </label>
      </div>
      <canvas ref={canvasRef} width={SPRITE_SIZE} height={SPRITE_SIZE} style={{ border: '1px solid #333' }} />
      <div>Drücke 1=Idle, 2=Walk, 3=Run, 4=Attack</div>
      <div style={{ marginTop: 40 }}>
        <h3>Alle Spritesheets (Galerie)</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, justifyContent: 'center' }}>
          {CHARACTERS.map(char => (
            <div key={char.file} style={{ textAlign: 'center' }}>
              <SpritePreview file={char.file} animation={animation.current} />
              <div style={{ color: '#00ffff', fontSize: '0.9rem' }}>{char.name}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// SpritePreview component for gallery animation
const SpritePreview: React.FC<{ file: string; animation: 'idle' | 'walk' | 'run' | 'attack'; }> = ({ file, animation }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const spriteRef = useRef<HTMLImageElement | null>(null);
  const frame = useRef(0);

  // Frame counts per animation
  const FRAMES = {
    idle: 6,
    walk: 8,
    run: 8,
    attack: 8,
  };

  useEffect(() => {
    const sprite = new window.Image();
    sprite.src = file;
    sprite.onload = () => {
      spriteRef.current = sprite;
      drawFrame();
    };
    // eslint-disable-next-line
  }, [file, animation]);

  function drawFrame() {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx || !spriteRef.current) return;
    ctx.clearRect(0, 0, SPRITE_SIZE, SPRITE_SIZE);
    const row = ANIMATION_ROWS[animation];
    ctx.drawImage(
      spriteRef.current,
      frame.current * SPRITE_SIZE,
      row * SPRITE_SIZE,
      SPRITE_SIZE,
      SPRITE_SIZE,
      0,
      0,
      SPRITE_SIZE,
      SPRITE_SIZE
    );
  }

  useEffect(() => {
    let timeoutId: number;
    let running = true;
    function getFrameDuration() {
      if (animation === 'walk') return 80;
      if (animation === 'run') return 50;
      return 120;
    }
    function loop() {
      if (!running) return;
      drawFrame();
      const maxFrames = FRAMES[animation];
      frame.current = (frame.current + 1) % maxFrames;
      timeoutId = window.setTimeout(loop, getFrameDuration());
    }
    loop();
    return () => {
      running = false;
      clearTimeout(timeoutId);
    };
    // eslint-disable-next-line
  }, [animation, file]);

  return <canvas ref={canvasRef} width={SPRITE_SIZE} height={SPRITE_SIZE} style={{ border: '1px solid #333', background: '#222', display: 'block', margin: '0 auto 8px auto' }} />;
};

export default BeatEmUpQTE;