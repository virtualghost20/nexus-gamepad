import 'package:flutter/material.dart';

class JoystickWidget extends StatefulWidget {
  final Function(double x, double y) onMove;

  const JoystickWidget({super.key, required this.onMove});

  @override
  State<JoystickWidget> createState() => _JoystickWidgetState();
}

class _JoystickWidgetState extends State<JoystickWidget> {
  Offset _pointerOffset = Offset.zero;
  final double _baseSize = 130.0;
  final double _knobSize = 65.0;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onPanUpdate: (details) {
        setState(() {
          final center = Offset(_baseSize / 2, _baseSize / 2);
          final touchPos = details.localPosition;
          final diff = touchPos - center;
          final distance = diff.distance;
          final maxDistance = _baseSize / 2;

          if (distance <= maxDistance) {
            _pointerOffset = diff;
          } else {
            _pointerOffset = diff * (maxDistance / distance);
          }
          
          final x = _pointerOffset.dx / maxDistance;
          final y = _pointerOffset.dy / maxDistance;
          widget.onMove(x, y);
        });
      },
      onPanEnd: (_) {
        setState(() {
          _pointerOffset = Offset.zero;
          widget.onMove(0, 0);
        });
      },
      child: Container(
        width: _baseSize,
        height: _baseSize,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: const Color(0xFF1E3A8A).withOpacity(0.3),
          border: Border.all(color: const Color(0xFF2563EB), width: 6),
          boxShadow: const [
            BoxShadow(
              color: Colors.black26,
              blurRadius: 10,
              spreadRadius: 2,
              offset: Offset(0, 4),
            )
          ],
        ),
        child: Stack(
          children: [
            // Center Detail
            Center(
              child: Container(
                width: 10,
                height: 10,
                decoration: BoxDecoration(
                  color: const Color(0xFF38BDF8).withOpacity(0.2),
                  shape: BoxShape.circle,
                ),
              ),
            ),
            // Knob
            Positioned(
              left: (_baseSize / 2 - _knobSize / 2) + _pointerOffset.dx,
              top: (_baseSize / 2 - _knobSize / 2) + _pointerOffset.dy,
              child: Container(
                width: _knobSize,
                height: _knobSize,
                decoration: const BoxDecoration(
                  shape: BoxShape.circle,
                  color: Colors.white,
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black45,
                      blurRadius: 15,
                      spreadRadius: 2,
                      offset: Offset(0, 8),
                    )
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
