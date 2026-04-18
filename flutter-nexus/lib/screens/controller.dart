import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../services/socket_service.dart';
import '../widgets/joystick.dart';

class ControllerScreen extends StatefulWidget {
  const ControllerScreen({super.key});

  @override
  State<ControllerScreen> createState() => _ControllerScreenState();
}

class _ControllerScreenState extends State<ControllerScreen> {
  bool _isEditing = false;
  Map<String, Offset> _layout = {};

  @override
  void initState() {
    super.initState();
    SystemChrome.setPreferredOrientations([
      DeviceOrientation.landscapeLeft,
      DeviceOrientation.landscapeRight,
    ]);
    _loadLayout();
  }

  Future<void> _loadLayout() async {
    final prefs = await SharedPreferences.getInstance();
    final saved = prefs.getString('nexus_layout');
    if (saved != null) {
      final Map<String, dynamic> decoded = jsonDecode(saved);
      setState(() {
        _layout = decoded.map((k, v) => MapEntry(k, Offset(v['x'], v['y'])));
      });
    }
  }

  Future<void> _saveLayout() async {
    final prefs = await SharedPreferences.getInstance();
    final encoded = _layout.map((k, v) => MapEntry(k, {'x': v.dx, 'y': v.dy}));
    await prefs.setString('nexus_layout', jsonEncode(encoded));
  }

  @override
  void dispose() {
    SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final service = Provider.of<SocketService>(context);

    return Scaffold(
      body: Container(
        padding: const EdgeInsets.all(16),
        child: Stack(
          children: [
            // Top Bar
            Positioned(
              top: 0, left: 16, right: 16,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('NEXUS CONSOLE', style: TextStyle(fontSize: 10, fontWeight: FontWeight.black, color: Colors.blueGrey)),
                      Text('ROOM: ${service.room ?? "---"}', style: const TextStyle(fontSize: 12, fontFamily: 'Courier', color: Color(0xFF38BDF8))),
                    ],
                  ),
                  Row(
                    children: [
                      TextButton.icon(
                        onPressed: () {
                          setState(() => _isEditing = !_isEditing);
                          if (!_isEditing) _saveLayout();
                        },
                        icon: const Icon(LucideIcons.settings, size: 16),
                        label: Text(_isEditing ? 'SAVE' : 'CUSTOMIZE'),
                        style: TextButton.styleFrom(
                          foregroundColor: _isEditing ? Colors.black : Colors.blue,
                          backgroundColor: _isEditing ? Colors.blue : Colors.white10,
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                        ),
                      ),
                      const SizedBox(width: 16),
                      const Icon(LucideIcons.wifi, size: 12, color: Colors.green),
                      const SizedBox(width: 4),
                      const Text('LIVE', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.green)),
                    ],
                  ),
                ],
              ),
            ),

            // Movable Elements
            _buildMovable('dpad', 40, 40, _buildDPad(service)),
            _buildMovable('left_stick', 200, 40, Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text('L3', style: TextStyle(fontSize: 10, color: Colors.blueGrey)),
                JoystickWidget(onMove: (x, y) => service.sendControl('L_STICK', {'x': x, 'y': y})),
              ],
            )),
            _buildMovable('right_stick', 200, 400, Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text('R3', style: TextStyle(fontSize: 10, color: Colors.blueGrey)),
                JoystickWidget(onMove: (x, y) => service.sendControl('R_STICK', {'x': x, 'y': y})),
              ],
            ), isRight: true),
            _buildMovable('abxy', 40, 40, _buildABXY(service), isRight: true),
            _buildMovable('system', 20, MediaQuery.of(context).size.width / 2 - 80, _buildSystemButtons(service)),

            if (_isEditing)
              const Center(child: Text("DRAG ELEMENTS TO POSITION", style: TextStyle(color: Colors.white24, fontWeight: FontWeight.black, fontSize: 10))),
          ],
        ),
      ),
    );
  }

  Widget _buildMovable(String id, double top, double side, Widget child, {bool isRight = false}) {
    final offset = _layout[id] ?? Offset.zero;
    return Positioned(
      top: top + offset.dy,
      left: isRight ? null : side + offset.dx,
      right: isRight ? side - offset.dx : null,
      child: GestureDetector(
        onPanUpdate: _isEditing ? (details) {
          setState(() {
            _layout[id] = offset + details.delta;
          });
        } : null,
        child: Container(
          decoration: _isEditing ? BoxDecoration(
            border: Border.all(color: Colors.blue, width: 2),
            borderRadius: BorderRadius.circular(8),
          ) : null,
          child: child,
        ),
      ),
    );
  }

  Widget _buildDPad(SocketService service) {
    return Container(
      width: 100, height: 100,
      decoration: const BoxDecoration(shape: BoxShape.circle, color: Color(0xFF1A1D23)),
      child: Stack(
        children: [
          Align(alignment: Alignment.topCenter, child: IconButton(onPressed: () => service.sendControl('DPAD_UP'), icon: const Icon(LucideIcons.chevronUp))),
          Align(alignment: Alignment.bottomCenter, child: IconButton(onPressed: () => service.sendControl('DPAD_DOWN'), icon: const Icon(LucideIcons.chevronDown))),
          Align(alignment: Alignment.centerLeft, child: IconButton(onPressed: () => service.sendControl('DPAD_LEFT'), icon: const Icon(LucideIcons.chevronLeft))),
          Align(alignment: Alignment.centerRight, child: IconButton(onPressed: () => service.sendControl('DPAD_RIGHT'), icon: const Icon(LucideIcons.chevronRight))),
        ],
      ),
    );
  }

  Widget _buildABXY(SocketService service) {
    return SizedBox(
      width: 120, height: 120,
      child: Stack(
        children: [
          _padBtn('Y', Alignment.topCenter, () => service.sendControl('BTN_Y')),
          _padBtn('A', Alignment.bottomCenter, () => service.sendControl('BTN_A')),
          _padBtn('X', Alignment.centerLeft, () => service.sendControl('BTN_X')),
          _padBtn('B', Alignment.centerRight, () => service.sendControl('BTN_B')),
        ],
      ),
    );
  }

  Widget _padBtn(String label, Alignment align, VoidCallback tap) {
    return Align(
      alignment: align,
      child: GestureDetector(
        onTapDown: (_) => tap(),
        child: Container(
          width: 40, height: 40,
          decoration: BoxDecoration(shape: BoxShape.circle, color: Colors.blue.withOpacity(0.2), border: Border.all(color: Colors.blueGrey)),
          child: Center(child: Text(label, style: const TextStyle(fontWeight: FontWeight.bold))),
        ),
      ),
    );
  }

  Widget _buildSystemButtons(SocketService service) {
    return Row(
      children: [
        IconButton(onPressed: () => service.sendControl('BTN_VIEW'), icon: const Icon(LucideIcons.layoutTemplate)),
        const SizedBox(width: 8),
        IconButton(onPressed: () => service.sendControl('BTN_HOME'), icon: const Icon(LucideIcons.gamepad2, color: Colors.blue, size: 32)),
        const SizedBox(width: 8),
        IconButton(onPressed: () => service.sendControl('BTN_MENU'), icon: const Icon(LucideIcons.menu)),
      ],
    );
  }
}
