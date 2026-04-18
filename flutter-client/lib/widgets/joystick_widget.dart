import 'package:flutter/material.dart';

class JoystickWidget extends StatefulWidget {
  final Function(double x, double y) onMove;
  final String label;

  const JoystickWidget({
    super.key, 
    required this.onMove,
    this.label = '',
  });

  @override
  State<JoystickWidget> createState() => _JoystickWidgetState();
}

class _JoystickWidgetState extends State<JoystickWidget> {
  Offset _pointerOffset = Offset.zero;
  final double _baseSize = 130.0;
  final double _knobSize = 65.0;

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        if (widget.label.isNotEmpty)
          Padding(
            padding: const EdgeInsets.bottom(8.0),
            child: Text(
              widget.label.toUpperCase(),
              style: const TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.black,
                color: Color(0xFF94A3B8),
                letterSpacing: 1.5,
              ),
            ),
          ),
        GestureDetector(
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
              color: const Color(0xFF1E293B),
              border: Border.all(color: Colors.blue.withOpacity(0.3), width: 3),
              boxShadow: const [
                BoxShadow(color: Colors.black45, blurRadius: 10, spreadRadius: 2)
              ],
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
                          blurRadius: 15,
                          spreadRadius: 2,
                        )
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
