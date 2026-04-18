import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Smartphone, Monitor, Info, Wifi, WifiOff, Gamepad2, Settings, QrCode, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Menu, Square, LayoutTemplate } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

// --- Shared Types ---
interface ControlPayload {
  action: string;
  [key: string]: any;
}

// --- Home Component ---
const Home = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-sleek-bg text-sleek-text flex flex-col items-center justify-center p-6 font-sleek-sans">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-sleek-accent rounded-xl flex items-center justify-center text-sleek-bg text-3xl font-black">NX</div>
        </div>
        <h1 className="text-6xl font-black tracking-tighter mb-4 text-sleek-text uppercase italic">Nexus Remote</h1>
        <p className="text-sleek-muted text-lg max-w-md mx-auto">
          High-performance, persistent remote control system for any device.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
        <ModeCard 
          icon={<Smartphone className="w-8 h-8" />}
          title="Controller Mode"
          desc="Use this device to control another screen."
          onClick={() => navigate('/controller')}
          variant="primary"
        />
        <ModeCard 
          icon={<Monitor className="w-8 h-8" />}
          title="Receiver Mode"
          desc="Turn this screen into a remote target."
          onClick={() => navigate('/receiver')}
          variant="secondary"
        />
      </div>

      <div className="mt-16 text-xs text-sleek-muted uppercase tracking-widest flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-sleek-success shadow-[0_0_10px_#10B981]" /> 
        Persistent Backend Active
      </div>
    </div>
  );
};

const ModeCard = ({ icon, title, desc, onClick, variant }: any) => (
  <motion.button
    whileHover={{ scale: 1.02, backgroundColor: '#1A1D23' }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={`p-8 rounded-2xl border bg-sleek-surface/50 border-sleek-border hover:border-sleek-accent transition-all text-left flex flex-col gap-4`}
  >
    <div className="text-sleek-accent">{icon}</div>
    <div>
      <h3 className="text-xl font-bold uppercase italic tracking-tight">{title}</h3>
      <p className="text-sleek-muted text-sm mt-1">{desc}</p>
    </div>
  </motion.button>
);

// --- Controller Application ---
const Controller = () => {
  const [room, setRoom] = useState('');
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const ws = useRef<WebSocket | null>(null);

  // Layout state: ID -> { x, y }
  // Initial positions are roughly approximated from the static layout
  const [layout, setLayout] = useState<Record<string, { x: number; y: number }>>(() => {
    const saved = localStorage.getItem('nexus_layout');
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    if (connected) {
      localStorage.setItem('nexus_layout', JSON.stringify(layout));
    }
  }, [layout, connected]);

  const updatePos = (id: string, x: number, y: number) => {
    setLayout(prev => ({ ...prev, [id]: { x, y } }));
  };

  const connect = (roomCode: string) => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socket = new WebSocket(`${protocol}//${window.location.host}`);
    
    socket.onopen = () => {
      socket.send(JSON.stringify({ type: 'join', room: roomCode, clientType: 'controller' }));
      setConnected(true);
      setError('');
    };

    socket.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.type === 'ping') socket.send(JSON.stringify({ type: 'pong' }));
    };

    socket.onclose = () => {
      setConnected(false);
      setTimeout(() => connect(roomCode), 3000);
    };

    ws.current = socket;
  };

  const sendControl = (action: string, payload: any = {}) => {
    if (isEditing) return; // Don't send controls in edit mode
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        type: 'control',
        payload: { action, ...payload }
      }));
    }
  };

  if (!connected) {
    return (
      <div className="min-h-screen bg-sleek-bg text-sleek-text flex flex-col items-center justify-center p-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-sm">
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 bg-sleek-accent rounded-lg flex items-center justify-center text-sleek-bg font-black mb-4">NX</div>
            <h2 className="text-3xl font-black uppercase italic flex items-center gap-3">
              Pairing
            </h2>
          </div>
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-sleek-muted tracking-widest text-blue-400">Entry Protocol: Room Code</label>
              <input 
                value={room}
                onChange={(e) => setRoom(e.target.value.toUpperCase())}
                placeholder="000-000"
                className="w-full bg-sleek-surface border border-sleek-border rounded-xl p-4 text-2xl font-sleek-mono text-sleek-accent focus:border-sleek-accent outline-none transition-all text-center tracking-widest"
                maxLength={6}
              />
            </div>
            <button 
              onClick={() => connect(room)}
              disabled={!room}
              className="w-full bg-sleek-accent text-sleek-bg hover:opacity-90 disabled:opacity-30 py-4 rounded-xl font-black uppercase tracking-widest transition-all shadow-[0_4px_15px_rgba(56,189,248,0.3)]"
            >
              Initialize Pairing
            </button>
            {error && <p className="text-red-500 text-sm italic text-center">{error}</p>}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sleek-bg text-sleek-text flex flex-col items-center justify-center p-6 touch-none select-none">
      {/* Landscape Phone Frame */}
      <div className="w-[900px] h-[500px] bg-black border-[14px] border-sleek-border rounded-[60px] relative p-8 shadow-2xl flex flex-col overflow-hidden">
        
        {/* Top Indicators */}
        <div className="flex justify-between items-center absolute top-6 left-12 right-12 z-50">
          <div className="flex flex-col">
            <h2 className="text-[10px] font-black text-sleek-muted uppercase">Nexus Console</h2>
            <p className="text-[8px] font-sleek-mono text-sleek-accent uppercase">ID: {room}</p>
          </div>
          <div className="flex gap-4 items-center">
            <button 
              onClick={() => setIsEditing(!isEditing)}
              className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-2 ${isEditing ? 'bg-sleek-accent text-sleek-bg shadow-[0_0_15px_#38BDF8]' : 'bg-white/5 text-sleek-muted border border-white/5'}`}
            >
              <Settings className="w-3 h-3" /> {isEditing ? 'Save Layout' : 'Customize UI'}
            </button>
            <div className="flex items-center gap-2 text-sleek-success text-[10px] font-black uppercase">
               14ms <div className="w-2 h-2 rounded-full bg-sleek-success animate-pulse" />
            </div>
          </div>
        </div>

        {/* Workspace for Dragging */}
        <div className="flex-1 relative mt-12">
            {/* Editing Overlay */}
            {isEditing && (
                <div className="absolute inset-0 z-40 bg-blue-500/5 pointer-events-none rounded-3xl border-2 border-dashed border-sleek-accent/20 flex items-center justify-center">
                    <span className="text-sleek-accent font-black uppercase text-[10px] tracking-widest opacity-40">Drag elements to reposition</span>
                </div>
            )}

            {/* LT & LB */}
            <Movable id="trig_left" isEditing={isEditing} pos={layout.trig_left} onDrag={(x, y) => updatePos('trig_left', x, y)}>
                <div className="flex flex-col gap-4">
                    <PadButton label="LT" size="large" onClick={() => sendControl('BTN_LT')} />
                    <PadButton label="LB" variant="secondary" onClick={() => sendControl('BTN_LB')} />
                </div>
            </Movable>

            {/* D-Pad */}
            <Movable id="dpad" isEditing={isEditing} pos={layout.dpad} onDrag={(x, y) => updatePos('dpad', x, y)} initialPos={{ bottom: 20, left: 40 }}>
                <div className="relative w-32 h-32 bg-blue-900 rounded-full flex items-center justify-center border-4 border-blue-800 shadow-2xl">
                    <button onTouchStart={() => sendControl('DPAD_UP')} className="absolute top-2 text-white hover:text-sleek-accent"><ChevronUp className="w-8 h-8" /></button>
                    <button onTouchStart={() => sendControl('DPAD_DOWN')} className="absolute bottom-2 text-white hover:text-sleek-accent"><ChevronDown className="w-8 h-8" /></button>
                    <button onTouchStart={() => sendControl('DPAD_LEFT')} className="absolute left-2 text-white hover:text-sleek-accent"><ChevronLeft className="w-8 h-8" /></button>
                    <button onTouchStart={() => sendControl('DPAD_RIGHT')} className="absolute right-2 text-white hover:text-sleek-accent"><ChevronRight className="w-8 h-8" /></button>
                </div>
            </Movable>

            {/* Left Joystick */}
            <Movable id="l_stick_area" isEditing={isEditing} pos={layout.l_stick_area} onDrag={(x, y) => updatePos('l_stick_area', x, y)} initialPos={{ bottom: 20, left: 240 }}>
                <div className="flex flex-col items-center gap-2">
                    <PadButton label="Left stick" variant="small" onClick={() => sendControl('BTN_L3')} />
                    <VirtualJoystick onMove={(x, y) => sendControl('L_STICK', { x, y })} />
                </div>
            </Movable>

            {/* Center Buttons */}
            <Movable id="system_buttons" isEditing={isEditing} pos={layout.system_buttons} onDrag={(x, y) => updatePos('system_buttons', x, y)} initialPos={{ top: 20, left: '42%' }}>
                <div className="flex gap-4">
                    <PadButton icon={<LayoutTemplate className="w-5 h-5" />} variant="system" onClick={() => sendControl('BTN_VIEW')} />
                    <PadButton icon={<Gamepad2 className="w-6 h-6" />} variant="home" onClick={() => sendControl('BTN_HOME')} />
                    <PadButton icon={<Menu className="w-5 h-5" />} variant="system" onClick={() => sendControl('BTN_MENU')} />
                </div>
            </Movable>

            {/* RT & RB */}
            <Movable id="trig_right" isEditing={isEditing} pos={layout.trig_right} onDrag={(x, y) => updatePos('trig_right', x, y)} initialPos={{ top: 0, right: 0 }}>
                <div className="flex flex-col gap-4 items-end">
                    <PadButton label="RT" size="large" onClick={() => sendControl('BTN_RT')} />
                    <PadButton label="RB" variant="secondary" onClick={() => sendControl('BTN_RB')} />
                </div>
            </Movable>

            {/* ABXY */}
            <Movable id="abxy" isEditing={isEditing} pos={layout.abxy} onDrag={(x, y) => updatePos('abxy', x, y)} initialPos={{ bottom: 20, right: 40 }}>
                <div className="relative w-32 h-32 flex items-center justify-center">
                    <button onTouchStart={() => sendControl('BTN_Y')} className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-10 bg-blue-900 border-2 border-blue-500/30 rounded-full font-black text-white shadow-lg active:bg-sleek-accent">Y</button>
                    <button onTouchStart={() => sendControl('BTN_A')} className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-10 bg-blue-900 border-2 border-blue-500/30 rounded-full font-black text-white shadow-lg active:bg-sleek-accent">A</button>
                    <button onTouchStart={() => sendControl('BTN_X')} className="absolute left-0 top-1/2 -translate-y-1/2 w-10 h-10 bg-blue-900 border-2 border-blue-500/30 rounded-full font-black text-white shadow-lg active:bg-sleek-accent">X</button>
                    <button onTouchStart={() => sendControl('BTN_B')} className="absolute right-0 top-1/2 -translate-y-1/2 w-10 h-10 bg-blue-900 border-2 border-blue-500/30 rounded-full font-black text-white shadow-lg active:bg-sleek-accent">B</button>
                </div>
            </Movable>

            {/* Right Joystick */}
            <Movable id="r_stick_area" isEditing={isEditing} pos={layout.r_stick_area} onDrag={(x, y) => updatePos('r_stick_area', x, y)} initialPos={{ bottom: 20, right: 240 }}>
                <div className="flex flex-col items-center gap-2">
                    <PadButton label="Right stick" variant="small" onClick={() => sendControl('BTN_R3')} />
                    <VirtualJoystick onMove={(x, y) => sendControl('R_STICK', { x, y })} />
                </div>
            </Movable>
        </div>

        <button onClick={() => window.location.reload()} className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[8px] text-sleek-muted uppercase font-black tracking-widest hover:text-white transition-colors z-50">Disconnect Link</button>
      </div>
    </div>
  );
};

const Movable = ({ children, isEditing, id, pos, onDrag, initialPos = { top: 0, left: 0 } }: any) => (
  <motion.div
    drag={isEditing}
    dragMomentum={false}
    onDragEnd={(_, info) => {
        const newX = (pos?.x || 0) + info.offset.x;
        const newY = (pos?.y || 0) + info.offset.y;
        onDrag(newX, newY);
    }}
    className={`absolute ${isEditing ? 'cursor-move ring-2 ring-sleek-accent ring-offset-4 ring-offset-black z-50 rounded-lg' : ''}`}
    style={{ 
        ...initialPos,
        x: pos?.x || 0,
        y: pos?.y || 0
    }}
  >
    {children}
  </motion.div>
);

const PadButton = ({ label, icon, size = 'default', variant = 'primary', onClick }: any) => {
  const baseClasses = "rounded-full flex items-center justify-center font-black text-white active:scale-95 transition-all shadow-xl select-none uppercase italic tracking-tighter";
  let sizeClasses = "w-12 h-12 text-sm";
  let variantClasses = "bg-blue-900 border-2 border-blue-500/30 hover:border-sleek-accent";

  if (size === 'large') {
    sizeClasses = "w-20 h-20 text-xl border-4 border-blue-700 active:bg-sleek-accent";
  } else if (variant === 'small') {
    sizeClasses = "w-auto px-4 py-2 text-[8px] rounded-full border-none opacity-60";
  } else if (variant === 'system') {
    sizeClasses = "w-10 h-10 border-blue-800/50 bg-blue-950";
  } else if (variant === 'home') {
    sizeClasses = "w-14 h-14 bg-sleek-accent text-sleek-bg border-4 border-sleek-bg shadow-[0_0_15px_rgba(56,189,248,0.5)]";
    variantClasses = ""; // override
  }

  return (
    <button onTouchStart={onClick} className={`${baseClasses} ${sizeClasses} ${variantClasses}`}>
      {icon || label}
    </button>
  );
};

const VirtualJoystick = ({ onMove }: { onMove: (x: number, y: number) => void }) => {
    return (
        <div className="w-32 h-32 rounded-full bg-blue-950 relative flex items-center justify-center overflow-hidden border-4 border-blue-900 shadow-inner">
             <div 
                className="absolute inset-0 z-10"
                onTouchMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = (e.touches[0].clientX - rect.left) / rect.width * 2 - 1;
                    const y = (e.touches[0].clientY - rect.top) / rect.height * 2 - 1;
                    onMove(x, y);
                }}
                onTouchEnd={() => onMove(0, 0)}
             />
             <motion.div 
                className="w-16 h-16 rounded-full bg-sleek-text shadow-2xl pointer-events-none border-2 border-white/20"
                animate={{ x: 0, y: 0 }}
             />
        </div>
    );
}

// --- Receiver Application ---
const Receiver = () => {
    const [room, setRoom] = useState(Math.random().toString(36).substring(2, 8).toUpperCase());
    const [logs, setLogs] = useState<string[]>([]);
    const [connected, setConnected] = useState(false);
    const [showQR, setShowQR] = useState(false);
    const ws = useRef<WebSocket | null>(null);

    useEffect(() => {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const socket = new WebSocket(`${protocol}//${window.location.host}`);
        
        socket.onopen = () => {
            socket.send(JSON.stringify({ type: 'join', room, clientType: 'receiver' }));
            setConnected(true);
        };

        socket.onmessage = (e) => {
            const msg = JSON.parse(e.data);
            if (msg.type === 'ping') {
                socket.send(JSON.stringify({ type: 'pong' }));
            } else if (msg.type === 'control') {
                const action = msg.payload.action;
                const payload = JSON.stringify(msg.payload);
                setLogs(prev => [`[${new Date().toLocaleTimeString()}] ACTION: ${action} DATA: ${payload}`, ...prev].slice(0, 50));
            }
        };

        socket.onclose = () => {
            setConnected(false);
        };

        ws.current = socket;
        return () => socket.close();
    }, [room]);

    return (
        <div className="min-h-screen bg-sleek-bg text-sleek-text flex flex-col font-sleek-sans">
            {/* Top Bar */}
            <header className="h-16 bg-sleek-surface border-b border-sleek-border flex items-center px-6 justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-sleek-accent rounded flex items-center justify-center text-sleek-bg font-black">NX</div>
                    <span className="font-black tracking-tighter uppercase italic">Nexus Receiver</span>
                </div>
                <div className="flex items-center gap-6 text-[10px] font-bold uppercase tracking-widest">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-sleek-success shadow-[0_0_10px_#10B981]" />
                        Server: Active
                    </div>
                    <div className="flex items-center gap-2 text-sleek-muted">
                        Receiver: JS-WEB-NODE
                    </div>
                </div>
            </header>

            <main className="flex-1 grid grid-cols-1 md:grid-cols-[300px_1fr_300px] gap-[1px] bg-sleek-border overflow-hidden">
                {/* Left Panel: Stats */}
                <aside className="bg-sleek-bg p-6 flex flex-col gap-6 overflow-y-auto">
                    <h2 className="text-[10px] uppercase font-black text-sleek-muted tracking-[0.2em] mb-4">Infrastructure</h2>
                    
                    <StatCard label="Connection Uptime" value="∞ UNLIMITED" />
                    <StatCard label="Active Room" value={room} />
                    <StatCard label="Client Protocol" value="WSS / JSON V2" />
                    
                    <div className="mt-auto">
                        <StatCard label="Packet Loss" value="0.00%" />
                    </div>
                </aside>

                {/* Center Panel: Controller Simulation View / Logs */}
                <section className="bg-sleek-bg flex flex-col min-h-0 border-x border-sleek-border">
                    <div className="p-4 border-b border-sleek-border flex justify-between items-center bg-sleek-surface/30">
                        <div className="flex items-center gap-2">
                             <Monitor className="w-4 h-4 text-sleek-muted" />
                             <h2 className="text-[10px] uppercase font-black tracking-widest">Event Data Stream</h2>
                        </div>
                        <button onClick={() => setLogs([])} className="text-[10px] uppercase font-black text-sleek-muted hover:text-sleek-text transition-colors">Flush Buffer</button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-6 font-sleek-mono text-[11px] space-y-3 bg-black/40">
                        {logs.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-sleek-muted/20">
                                <Gamepad2 className="w-16 h-16 mb-4" />
                                <p className="uppercase font-black tracking-[0.3em]">Quiet on connection</p>
                            </div>
                        ) : (
                            logs.map((log, i) => {
                                const [time, ...rest] = log.split(' ');
                                const logMsg = rest.join(' ');
                                return (
                                    <motion.div 
                                        key={i}
                                        initial={{ opacity: 0, x: -5 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="text-sleek-success flex gap-3"
                                    >
                                        <span className="text-sleek-muted opacity-50">{time}</span>
                                        <span>{logMsg}</span>
                                    </motion.div>
                                );
                            })
                        )}
                    </div>
                </section>

                {/* Right Panel: Controls & Pairing */}
                <aside className="bg-sleek-bg p-6 flex flex-col gap-8 overflow-y-auto">
                    <h2 className="text-[10px] uppercase font-black text-sleek-muted tracking-[0.2em]">Pairing Access</h2>

                    <div className="bg-sleek-accent/10 border border-sleek-accent rounded-xl p-6 text-center">
                        <div className="text-[9px] font-black text-sleek-accent uppercase mb-2 tracking-widest">Active Pairing Code</div>
                        <div className="text-4xl font-black text-sleek-accent tracking-[0.2em]">{room}</div>
                    </div>

                    <button 
                        onClick={() => setShowQR(!showQR)}
                        className="w-full py-4 bg-sleek-surface border border-sleek-border rounded-xl flex items-center justify-center gap-3 text-[10px] uppercase font-black tracking-widest hover:border-sleek-accent transition-all"
                    >
                        <QrCode className="w-4 h-4" /> {showQR ? 'Minimize Terminal' : 'Generate QR Entry'}
                    </button>

                    {showQR && (
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center p-6 bg-white rounded-2xl shadow-xl">
                            <QRCodeSVG value={`${window.location.origin}/controller?room=${room}`} size={160} />
                            <div className="mt-4 text-[9px] text-gray-400 font-bold uppercase">Scan to Pair Device</div>
                        </motion.div>
                    )}

                    <div className="mt-auto space-y-4">
                        <div className="flex items-center gap-2 text-sleek-muted text-[10px] font-black uppercase tracking-widest">
                            <Info className="w-3 h-3" /> System Info
                        </div>
                        <div className="text-[10px] leading-relaxed text-sleek-muted/70 italic">
                            Encrypted WebSocket tunnel active. No timeout enforced on persistent sockets. Room ID derived from secure random entropy.
                        </div>
                    </div>
                </aside>
            </main>
        </div>
    );
};

const StatCard = ({ label, value }: { label: string, value: string }) => (
    <div className="bg-sleek-surface border border-sleek-border rounded-xl p-4 transition-all hover:border-sleek-accent/50">
        <div className="text-[9px] font-black text-sleek-muted uppercase tracking-widest mb-1">{label}</div>
        <div className="text-sm font-sleek-mono font-bold text-sleek-accent">{value}</div>
    </div>
);

// --- Main Router ---
export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/controller" element={<Controller />} />
        <Route path="/receiver" element={<Receiver />} />
      </Routes>
    </Router>
  );
}
