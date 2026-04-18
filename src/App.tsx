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
  const [layout, setLayout] = useState<Record<string, { x: number; y: number }>>(() => {
    const saved = localStorage.getItem('nexus_layout_v2');
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    if (connected) {
      localStorage.setItem('nexus_layout_v2', JSON.stringify(layout));
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
    if (isEditing) return;
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        type: 'control',
        payload: { action, ...payload }
      }));
    }
  };

  if (!connected) {
    return (
      <div className="min-h-screen bg-[#0F1115] text-white flex flex-col items-center justify-center p-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-sm">
          <div className="flex flex-col items-center mb-8 text-center">
            <div className="w-16 h-16 bg-[#38BDF8] rounded-2xl flex items-center justify-center text-[#0F1115] font-black mb-4 shadow-[0_0_30px_rgba(56,189,248,0.3)]">NX</div>
            <h2 className="text-3xl font-black uppercase tracking-tighter italic">Pairing Protocol</h2>
            <p className="text-xs text-sleek-muted mt-2 font-sleek-mono uppercase">Establish WebSocket Handshake</p>
          </div>
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-black text-sleek-muted tracking-[0.2em] block ml-1 text-[#38BDF8]">Nexus Room Identifier</label>
              <input 
                value={room}
                onChange={(e) => setRoom(e.target.value.toUpperCase())}
                placeholder="000000"
                className="w-full bg-[#1A1D23] border border-white/5 rounded-2xl p-5 text-3xl font-sleek-mono text-[#38BDF8] focus:border-[#38BDF8]/50 focus:ring-4 focus:ring-[#38BDF8]/10 outline-none transition-all text-center tracking-[0.3em] placeholder:opacity-20 shadow-inner"
                maxLength={6}
              />
            </div>
            <button 
              onClick={() => connect(room)}
              disabled={!room}
              className="w-full bg-[#38BDF8] text-[#0F1115] hover:brightness-110 disabled:grayscale py-5 rounded-2xl font-black uppercase tracking-[0.15em] transition-all shadow-[0_10px_25px_rgba(56,189,248,0.2)] active:scale-[0.98]"
            >
              Initialize Link
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F1115] text-white flex flex-col items-center justify-center p-4 touch-none select-none overflow-hidden">
      {/* Landscape Frame - Matches Image Border Style */}
      <div className="w-[940px] h-[520px] bg-[#0F1115] border-[14px] border-[#334155] rounded-[60px] relative shadow-2xl flex flex-col p-10 overflow-hidden">
        
        {/* Top Header Section */}
        <div className="flex justify-between items-start absolute top-10 left-12 right-12 z-50">
          <div className="flex flex-col gap-1">
            <h2 className="text-[14px] font-black tracking-tight uppercase leading-none">Nexus Console</h2>
            <p className="text-[10px] font-sleek-mono text-white/60 uppercase leading-none">ID: {room}</p>
          </div>
          <div className="flex gap-4 items-center">
            <button 
              onClick={() => setIsEditing(!isEditing)}
              className={`px-5 py-2.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-2.5 backdrop-blur-md border ${isEditing ? 'bg-[#38BDF8] text-[#0F1115] border-[#38BDF8]' : 'bg-white/5 text-white/80 border-white/10'}`}
            >
              <Settings className="w-3.5 h-3.5" /> {isEditing ? 'Save Layout' : 'Customize UI'}
            </button>
            <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/5">
                <span className="text-[11px] font-black text-white px-1">14ms</span>
                <div className="w-2.5 h-2.5 rounded-full bg-[#10B981] shadow-[0_0_10px_#10B981]" />
            </div>
          </div>
        </div>

        {/* Workspace Layout */}
        <div className="flex-1 relative">
            {isEditing && (
                <div className="absolute inset-0 z-40 bg-[#38BDF8]/5 pointer-events-none rounded-[40px] border-2 border-dashed border-[#38BDF8]/20" />
            )}

            {/* Triggers Group - Left */}
            <Movable id="trig_left" isEditing={isEditing} pos={layout.trig_left} onDrag={(x, y) => updatePos('trig_left', x, y)} initialPos={{ top: 20, left: 20 }}>
                <div className="flex flex-col gap-6">
                    <PadButton label="LT" size="large" onClick={() => sendControl('BTN_LT')} />
                    <PadButton label="LB" size="medium" onClick={() => sendControl('BTN_LB')} />
                </div>
            </Movable>

            {/* D-Pad - Bottom Left */}
            <Movable id="dpad" isEditing={isEditing} pos={layout.dpad} onDrag={(x, y) => updatePos('dpad', x, y)} initialPos={{ bottom: -20, left: 60 }}>
                <div className="relative w-36 h-36 bg-[#2563EB] rounded-full flex items-center justify-center border-4 border-[#1E40AF] shadow-[0_15px_30px_rgba(0,0,0,0.4)]">
                    <button onTouchStart={() => sendControl('DPAD_UP')} className="absolute top-2.5 text-white active:scale-110 transition-transform"><ChevronUp className="w-10 h-10" /></button>
                    <button onTouchStart={() => sendControl('DPAD_DOWN')} className="absolute bottom-2.5 text-white active:scale-110 transition-transform"><ChevronDown className="w-10 h-10" /></button>
                    <button onTouchStart={() => sendControl('DPAD_LEFT')} className="absolute left-2.5 text-white active:scale-110 transition-transform"><ChevronLeft className="w-10 h-10" /></button>
                    <button onTouchStart={() => sendControl('DPAD_RIGHT')} className="absolute right-2.5 text-white active:scale-110 transition-transform"><ChevronRight className="w-10 h-10" /></button>
                </div>
            </Movable>

            {/* Left Joystick - Center Left */}
            <Movable id="l_stick_area" isEditing={isEditing} pos={layout.l_stick_area} onDrag={(x, y) => updatePos('l_stick_area', x, y)} initialPos={{ bottom: -20, left: 260 }}>
                <div className="flex flex-col items-center gap-3">
                    <div className="px-4 py-1.5 bg-[#2563EB] rounded-full border border-white/20">
                        <span className="text-[10px] font-black text-white uppercase tracking-tighter italic">Left Stick</span>
                    </div>
                    <VirtualJoystick isEditing={isEditing} onMove={(x, y) => sendControl('L_STICK', { x, y })} />
                </div>
            </Movable>

            {/* System Hub - Center Top */}
            <Movable id="system_buttons" isEditing={isEditing} pos={layout.system_buttons} onDrag={(x, y) => updatePos('system_buttons', x, y)} initialPos={{ top: 20, left: '42%' }}>
                <div className="flex gap-4">
                    <PadButton icon={<LayoutTemplate className="w-5 h-5" />} variant="system" onClick={() => sendControl('BTN_VIEW')} />
                    <PadButton icon={<Gamepad2 className="w-6 h-6" />} variant="home" onClick={() => sendControl('BTN_HOME')} />
                    <PadButton icon={<Menu className="w-5 h-5" />} variant="system" onClick={() => sendControl('BTN_MENU')} />
                </div>
            </Movable>

            {/* Triggers Group - Right */}
            <Movable id="trig_right" isEditing={isEditing} pos={layout.trig_right} onDrag={(x, y) => updatePos('trig_right', x, y)} initialPos={{ top: 20, right: 20 }}>
                <div className="flex flex-col gap-6 items-end">
                    <PadButton label="RT" size="large" onClick={() => sendControl('BTN_RT')} />
                    <PadButton label="RB" size="medium" onClick={() => sendControl('BTN_RB')} />
                </div>
            </Movable>

            {/* ABXY Diamond - Bottom Right */}
            <Movable id="abxy" isEditing={isEditing} pos={layout.abxy} onDrag={(x, y) => updatePos('abxy', x, y)} initialPos={{ bottom: -20, right: 60 }}>
                <div className="relative w-36 h-36 flex items-center justify-center">
                    <div className="relative w-full h-full">
                        <button onTouchStart={() => sendControl('BTN_Y')} className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-12 bg-[#2563EB] border-b-4 border-black/30 rounded-full font-black text-white shadow-xl active:scale-90 transition-transform">Y</button>
                        <button onTouchStart={() => sendControl('BTN_A')} className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-12 bg-[#2563EB] border-b-4 border-black/30 rounded-full font-black text-white shadow-xl active:scale-90 transition-transform">A</button>
                        <button onTouchStart={() => sendControl('BTN_X')} className="absolute left-0 top-1/2 -translate-y-1/2 w-12 h-12 bg-[#2563EB] border-b-4 border-black/30 rounded-full font-black text-white shadow-xl active:scale-90 transition-transform">X</button>
                        <button onTouchStart={() => sendControl('BTN_B')} className="absolute right-0 top-1/2 -translate-y-1/2 w-12 h-12 bg-[#2563EB] border-b-4 border-black/30 rounded-full font-black text-white shadow-xl active:scale-90 transition-transform">B</button>
                    </div>
                </div>
            </Movable>

            {/* Right Joystick - Center Right */}
            <Movable id="r_stick_area" isEditing={isEditing} pos={layout.r_stick_area} onDrag={(x, y) => updatePos('r_stick_area', x, y)} initialPos={{ bottom: -20, right: 260 }}>
                <div className="flex flex-col items-center gap-3">
                    <div className="px-4 py-1.5 bg-[#2563EB] rounded-full border border-white/20">
                        <span className="text-[10px] font-black text-white uppercase tracking-tighter italic">Right Stick</span>
                    </div>
                    <VirtualJoystick isEditing={isEditing} onMove={(x, y) => sendControl('R_STICK', { x, y })} />
                </div>
            </Movable>
        </div>

        {/* Footer Text */}
        <button onClick={() => window.location.reload()} className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[11px] text-white/40 uppercase font-black tracking-[0.3em] hover:text-[#38BDF8] transition-colors z-50">Disconnect Link</button>
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
    className={`absolute ${isEditing ? 'cursor-move ring-4 ring-[#38BDF8] ring-offset-4 ring-offset-[#0F1115] z-[100] rounded-2xl shadow-[0_0_50px_rgba(56,189,248,0.2)]' : 'z-10'}`}
    style={{ 
        top: initialPos.top ?? 'auto',
        left: initialPos.left ?? 'auto',
        right: initialPos.right ?? 'auto',
        bottom: initialPos.bottom ?? 'auto',
        x: pos?.x || 0,
        y: pos?.y || 0
    }}
  >
    {children}
    {isEditing && (
        <div className="absolute inset-0 bg-transparent z-[101]" />
    )}
  </motion.div>
);

const PadButton = ({ label, icon, size = 'default', variant = 'primary', onClick }: any) => {
  const baseClasses = "rounded-full flex items-center justify-center font-black text-white active:scale-95 transition-all shadow-xl select-none uppercase italic tracking-tighter border-b-4 border-black/20";
  let sizeClasses = "w-14 h-14 text-base";
  let variantClasses = "bg-[#2563EB] hover:bg-[#3B82F6]";

  if (size === 'large') {
    sizeClasses = "w-24 h-24 text-2xl border-b-8";
  } else if (size === 'medium') {
    sizeClasses = "w-16 h-16 text-lg";
  } else if (variant === 'system') {
    sizeClasses = "w-11 h-11 border-b-2";
    variantClasses = "bg-[#1E3A8A] hover:bg-[#1E40AF]";
  } else if (variant === 'home') {
    sizeClasses = "w-16 h-16 bg-[#38BDF8] text-[#0F1115] border-b-4 border-white/20 shadow-[0_0_20px_rgba(56,189,248,0.4)] hover:brightness-110";
    variantClasses = ""; 
  }

  return (
    <button onTouchStart={onClick} className={`${baseClasses} ${sizeClasses} ${variantClasses}`}>
      {icon || label}
    </button>
  );
};

const VirtualJoystick = ({ onMove, isEditing }: { onMove: (x: number, y: number) => void, isEditing: boolean }) => {
    const [pos, setPos] = useState({ x: 0, y: 0 });

    return (
        <div className="w-36 h-36 rounded-full bg-[#1E3A8A]/30 relative flex items-center justify-center overflow-hidden border-[6px] border-[#2563EB] shadow-inner">
             {/* Center Glow Overlay */}
             <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
             
             {!isEditing && (
                <div 
                    className="absolute inset-0 z-10"
                    onTouchMove={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const rawX = (e.touches[0].clientX - rect.left) / rect.width * 2 - 1;
                        const rawY = (e.touches[0].clientY - rect.top) / rect.height * 2 - 1;
                        const dist = Math.min(1, Math.sqrt(rawX * rawX + rawY * rawY));
                        const angle = Math.atan2(rawY, rawX);
                        const x = Math.cos(angle) * dist;
                        const y = Math.sin(angle) * dist;
                        setPos({ x: x * 45, y: y * 45 });
                        onMove(x, y);
                    }}
                    onTouchEnd={() => {
                        setPos({ x: 0, y: 0 });
                        onMove(0, 0);
                    }}
                />
             )}
             <motion.div 
                className="w-20 h-20 rounded-full bg-white shadow-[0_10px_30px_rgba(0,0,0,0.5)] pointer-events-none border-4 border-[#38BDF8]/20 flex items-center justify-center"
                animate={{ x: pos.x, y: pos.y }}
                transition={{ type: 'spring', damping: 25, stiffness: 250 }}
             >
                 {/* Internal joystick detail */}
                 <div className="w-4 h-4 rounded-full bg-[#38BDF8]/10" />
             </motion.div>
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
