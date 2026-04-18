import 'package:flutter/material.dart';
import 'dart:math' as math;

class JoystickWidget extends StatefulWidget {
  final Function(double x, double y) onMove;
  const JoystickWidget({super.key, required this.onMove});

  @override
  State<JoystickWidget> createState() => _JoystickWidgetState();
}

class _JoystickWidgetState extends State<JoystickWidget> {
  Offset _pointerOffset = Offset.zero;
  final double _baseSize = 120.0;
  final double _knobSize = 60.0;

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
          
          final normalizedX = _pointerOffset.dx / maxDistance;
          final normalizedY = _pointerOffset.dy / maxDistance;
          widget.onMove(normalizedX, normalizedY);
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
          color: const Color(0xFF1A1D23),
          border: Border.all(color: Colors.blue.withOpacity(0.3), width: 4),
        ),
        child: Stack(
          children: [
            Positioned(
              left: (_baseSize / 2 - _knobSize / 2) + _pointerOffset.dx,
              top: (_baseSize / 2 - _knobSize / 2) + _pointerOffset.dy,
              child: Container(
                width: _knobSize,
                height: _knobSize,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: Colors.white,
                  boxShadow: [
                    BoxShadow(
                      color: Colors.blue.withOpacity(0.5),
                      blurRadius: 10,
                      spreadRadius: 2,
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
