import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/socket_service.dart';
import '../widgets/joystick.dart';

class ControllerScreen extends StatefulWidget {
  const ControllerScreen({super.key});

  @override
  State<ControllerScreen> createState() => _ControllerScreenState();
}

class _ControllerScreenState extends State<ControllerScreen> {
  bool isEditing = false;
  Map<String, Offset> layoutPositions = {};

  @override
  void initState() {
    super.initState();
    _loadLayout();
  }

  Future<void> _loadLayout() async {
    final prefs = await SharedPreferences.getInstance();
    final String? saved = prefs.getString('nexus_flutter_layout_v2');
    if (saved != null) {
      final Map<String, dynamic> decoded = jsonDecode(saved);
      setState(() {
        layoutPositions = decoded.map((key, value) => 
          MapEntry(key, Offset(value['x'].toDouble(), value['y'].toDouble()))
        );
      });
    }
  }

  Future<void> _saveLayout() async {
    final prefs = await SharedPreferences.getInstance();
    final Map<String, dynamic> toSave = layoutPositions.map((key, value) => 
      MapEntry(key, {'x': value.dx, 'y': value.dy})
    );
    await prefs.setString('nexus_flutter_layout_v2', jsonEncode(toSave));
  }

  @override
  Widget build(BuildContext context) {
    final socket = Provider.of<SocketService>(context);

    return Scaffold(
      backgroundColor: const Color(0xFF0F1115),
      body: Center(
        child: AspectRatio(
          aspectRatio: 16 / 9,
          child: Container(
            margin: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFF0F1115),
              borderRadius: BorderRadius.circular(50),
              border: Border.all(color: const Color(0xFF334155), width: 12),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.5),
                  blurRadius: 40,
                  spreadRadius: 10,
                )
              ],
            ),
            child: Stack(
              children: [
                // Header
                Positioned(
                  top: 30,
                  left: 40,
                  right: 40,
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'NEXUS CONSOLE',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 14,
                              fontWeight: FontWeight.w900,
                              letterSpacing: -0.5,
                            ),
                          ),
                          Text(
                            'ID: ${socket.roomCode ?? "DISCONNECTED"}',
                            style: const TextStyle(
                              color: Color(0xFF38BDF8),
                              fontSize: 10,
                              letterSpacing: 2,
                            ),
                          ),
                        ],
                      ),
                      Row(
                        children: [
                          GestureDetector(
                            onTap: () {
                              setState(() => isEditing = !isEditing);
                              if (!isEditing) _saveLayout();
                            },
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                              decoration: BoxDecoration(
                                color: isEditing ? const Color(0xFF38BDF8) : Colors.white.withOpacity(0.05),
                                borderRadius: BorderRadius.circular(20),
                                border: Border.all(
                                  color: isEditing ? const Color(0xFF38BDF8) : Colors.white.withOpacity(0.1),
                                ),
                              ),
                              child: Row(
                                children: [
                                  Icon(
                                    LucideIcons.settings,
                                    size: 14,
                                    color: isEditing ? Colors.black : Colors.white,
                                  ),
                                  const SizedBox(width: 8),
                                  Text(
                                    isEditing ? 'SAVE LAYOUT' : 'CUSTOMIZE UI',
                                    style: TextStyle(
                                      color: isEditing ? Colors.black : Colors.white,
                                      fontSize: 10,
                                      fontWeight: FontWeight.w900,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                          const SizedBox(width: 16),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                            decoration: BoxDecoration(
                              color: Colors.white.withOpacity(0.05),
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: const Row(
                              children: [
                                Text('14MS', style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
                                SizedBox(width: 6),
                                CircleAvatar(radius: 4, backgroundColor: Color(0xFF10B981)),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),

                // Controls
                _buildMovable(
                  id: 'trig_left',
                  initial: const Offset(40, 100),
                  child: Column(
                    children: [
                      _PadButton(label: 'LT', size: 90, onTap: () => socket.sendControl('BTN_LT')),
                      const SizedBox(height: 20),
                      _PadButton(label: 'LB', size: 60, onTap: () => socket.sendControl('BTN_LB')),
                    ],
                  ),
                ),

                _buildMovable(
                  id: 'trig_right',
                  initial: const Offset(740, 100),
                  child: Column(
                    children: [
                      _PadButton(label: 'RT', size: 90, onTap: () => socket.sendControl('BTN_RT')),
                      const SizedBox(height: 20),
                      _PadButton(label: 'RB', size: 60, onTap: () => socket.sendControl('BTN_RB')),
                    ],
                  ),
                ),

                _buildMovable(
                  id: 'dpad',
                  initial: const Offset(80, 250),
                  child: Container(
                    width: 140,
                    height: 140,
                    decoration: const BoxDecoration(
                      color: Color(0xFF2563EB),
                      shape: BoxShape.circle,
                      boxShadow: [BoxShadow(color: Colors.black45, blurRadius: 20)],
                    ),
                    child: Stack(
                      children: [
                        Center(child: Icon(LucideIcons.arrowUp, color: Colors.white.withOpacity(0.2), size: 100)),
                        Positioned(top: 10, left: 0, right: 0, child: IconButton(icon: const Icon(LucideIcons.chevronUp, size: 40), onPressed: () => socket.sendControl('DPAD_UP'))),
                        Positioned(bottom: 10, left: 0, right: 0, child: IconButton(icon: const Icon(LucideIcons.chevronDown, size: 40), onPressed: () => socket.sendControl('DPAD_DOWN'))),
                        Positioned(left: 10, top: 0, bottom: 0, child: IconButton(icon: const Icon(LucideIcons.chevronLeft, size: 40), onPressed: () => socket.sendControl('DPAD_LEFT'))),
                        Positioned(right: 10, top: 0, bottom: 0, child: IconButton(icon: const Icon(LucideIcons.chevronRight, size: 40), onPressed: () => socket.sendControl('DPAD_RIGHT'))),
                      ],
                    ),
                  ),
                ),

                _buildMovable(
                  id: 'l_stick',
                  initial: const Offset(260, 250),
                  child: Column(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                        decoration: BoxDecoration(color: const Color(0xFF2563EB), borderRadius: BorderRadius.circular(20)),
                        child: const Text('LEFT STICK', style: TextStyle(color: Colors.white, fontSize: 8, fontWeight: FontWeight.w900, italic: true)),
                      ),
                      const SizedBox(height: 12),
                      JoystickWidget(
                        onMove: (x, y) => socket.sendControl('L_STICK', {'x': x, 'y': y}),
                      ),
                    ],
                  ),
                ),

                _buildMovable(
                  id: 'r_stick',
                  initial: const Offset(520, 250),
                  child: Column(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                        decoration: BoxDecoration(color: const Color(0xFF2563EB), borderRadius: BorderRadius.circular(20)),
                        child: const Text('RIGHT STICK', style: TextStyle(color: Colors.white, fontSize: 8, fontWeight: FontWeight.w900, italic: true)),
                      ),
                      const SizedBox(height: 12),
                      JoystickWidget(
                        onMove: (x, y) => socket.sendControl('R_STICK', {'x': x, 'y': y}),
                      ),
                    ],
                  ),
                ),

                _buildMovable(
                  id: 'abxy',
                  initial: const Offset(740, 250),
                  child: SizedBox(
                    width: 140,
                    height: 140,
                    child: Stack(
                      children: [
                        Positioned(top: 0, left: 45, child: _PadButton(label: 'Y', size: 50, onTap: () => socket.sendControl('BTN_Y'))),
                        Positioned(bottom: 0, left: 45, child: _PadButton(label: 'A', size: 50, onTap: () => socket.sendControl('BTN_A'))),
                        Positioned(left: 0, top: 45, child: _PadButton(label: 'X', size: 50, onTap: () => socket.sendControl('BTN_X'))),
                        Positioned(right: 0, top: 45, child: _PadButton(label: 'B', size: 50, onTap: () => socket.sendControl('BTN_B'))),
                      ],
                    ),
                  ),
                ),

                // Disconnect Label
                Positioned(
                  bottom: 30,
                  left: 0,
                  right: 0,
                  child: Center(
                    child: TextButton(
                      onPressed: () => socket.disconnect(),
                      child: Text(
                        'DISCONNECT LINK',
                        style: TextStyle(
                          color: Colors.white.withOpacity(0.4),
                          fontSize: 10,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 4,
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildMovable({required String id, required Offset initial, required Widget child}) {
    final Offset pos = layoutPositions[id] ?? initial;

    return Positioned(
      left: pos.dx,
      top: pos.dy,
      child: GestureDetector(
        onPanUpdate: isEditing ? (details) {
          setState(() {
            layoutPositions[id] = pos + details.delta;
          });
        } : null,
        child: Container(
          decoration: BoxDecoration(
            border: isEditing ? Border.all(color: const Color(0xFF38BDF8), width: 2) : null,
            borderRadius: BorderRadius.circular(16),
          ),
          child: IgnorePointer(
            ignoring: isEditing,
            child: child,
          ),
        ),
      ),
    );
  }
}

class _PadButton extends StatelessWidget {
  final String label;
  final double size;
  final VoidCallback onTap;

  const _PadButton({required this.label, required this.size, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: (_) => onTap(),
      child: Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          color: const Color(0xFF2563EB),
          shape: BoxShape.circle,
          border: const Border(bottom: BorderSide(color: Colors.black26, width: 6)),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFF2563EB).withOpacity(0.3),
              blurRadius: 10,
              spreadRadius: 2,
            )
          ],
        ),
        child: Center(
          child: Text(
            label,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 20,
              fontWeight: FontWeight.w900,
              fontStyle: FontStyle.italic,
            ),
          ),
        ),
      ),
    );
  }
}
