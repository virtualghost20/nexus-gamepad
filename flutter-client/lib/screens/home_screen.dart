import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../services/websocket_service.dart';
import '../widgets/joystick_widget.dart';
import '../widgets/control_button.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final TextEditingController _roomController = TextEditingController();

  @override
  Widget build(BuildContext context) {
    final ws = Provider.of<WebSocketService>(context);

    if (!ws.isConnected) {
      return _buildPairingScreen(ws);
    }

    return _buildGamepadScreen(ws);
  }

  Widget _buildPairingScreen(WebSocketService ws) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F1115),
      body: Center(
        child: Container(
          maxWidth: 400,
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 64,
                height: 64,
                decoration: BoxDecoration(
                  color: const Color(0xFF38BDF8),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: const Icon(LucideIcons.gamepad2, color: Color(0xFF0F1115), size: 32),
              ),
              const SizedBox(height: 24),
              const Text(
                'NEXUS REMOTE',
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.black,
                  letterSpacing: -1,
                ),
              ),
              const SizedBox(height: 48),
              TextField(
                controller: _roomController,
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 24, letterSpacing: 8, fontFamily: 'monospace'),
                decoration: InputDecoration(
                  labelText: 'ROOM CODE',
                  labelStyle: const TextStyle(fontSize: 10, color: Color(0xFF94A3B8)),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: Color(0xFF334155)),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: Color(0xFF38BDF8)),
                  ),
                ),
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                height: 56,
                child: ElevatedButton(
                  onPressed: () {
                    // Replace with your local IP or domain
                    ws.connect('ws://localhost:3000', _roomController.text);
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF38BDF8),
                    foregroundColor: const Color(0xFF0F1115),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: const Text('INITIALIZE LINK', style: TextStyle(fontWeight: FontWeight.bold)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildGamepadScreen(WebSocketService ws) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F1115),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
          child: Column(
            children: [
              _buildHeader(ws),
              Expanded(
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    // Left Side: D-PAD & Joystick
                    Column(
                      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                      children: [
                        _buildDPad(ws),
                        JoystickWidget(
                          label: 'L-STICK',
                          onMove: (x, y) => ws.sendControl('MOVE', {'x': x, 'y': y}),
                        ),
                      ],
                    ),

                    // Center: System Buttons
                    Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        ControlButton(
                          label: 'S',
                          size: 40,
                          onTap: () => ws.sendControl('START'),
                        ),
                        const SizedBox(height: 24),
                        ControlButton(
                          label: 'H',
                          color: const Color(0xFF38BDF8).withOpacity(0.2),
                          onTap: () => ws.sendControl('HOME'),
                        ),
                        const SizedBox(height: 24),
                        ControlButton(
                          label: 'M',
                          size: 40,
                          onTap: () => ws.sendControl('MENU'),
                        ),
                      ],
                    ),

                    // Right Side: ABXY & Right Stick
                    Column(
                      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                      children: [
                        _buildABXY(ws),
                        JoystickWidget(
                          label: 'R-STICK',
                          onMove: (x, y) => ws.sendControl('R_STICK', {'x': x, 'y': y}),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              TextButton(
                onPressed: () => ws.disconnect(),
                child: const Text('TERMINATE LINK', style: TextStyle(color: Color(0xFF64748B), fontSize: 10)),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader(WebSocketService ws) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('NEXUS COMMAND', style: TextStyle(fontSize: 10, fontWeight: FontWeight.black, color: Color(0xFF64748B))),
            Text('ID: ${ws.roomCode}', style: const TextStyle(fontSize: 12, color: Color(0xFF38BDF8))),
          ],
        ),
        Row(
          children: [
            const Text('LIVE', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF10B981))),
            const SizedBox(width: 8),
            Container(width: 8, height: 8, decoration: const BoxDecoration(shape: BoxShape.circle, color: Color(0xFF10B981))),
          ],
        ),
      ],
    );
  }

  Widget _buildDPad(WebSocketService ws) {
    return const Column(
      children: [
        // D-pad visualization
        Text('D-PAD', style: TextStyle(fontSize: 10, color: Color(0xFF94A3B8))),
        SizedBox(height: 8),
        Icon(LucideIcons.arrowUpCircle, size: 48, color: Color(0xFF334155)),
      ],
    );
  }

  Widget _buildABXY(WebSocketService ws) {
    return Column(
      children: [
        Row(
          children: [
            ControlButton(label: 'Y', onTap: () => ws.sendControl('BTN_Y')),
          ],
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            ControlButton(label: 'X', onTap: () => ws.sendControl('BTN_X')),
            const SizedBox(width: 16),
            ControlButton(label: 'B', onTap: () => ws.sendControl('BTN_B')),
          ],
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            ControlButton(label: 'A', onTap: () => ws.sendControl('BTN_A')),
          ],
        ),
      ],
    );
  }
}
