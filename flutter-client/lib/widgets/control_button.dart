import 'package:flutter/material.dart';

class ControlButton extends StatelessWidget {
  final String label;
  final VoidCallback onTap;
  final Color? color;
  final double size;

  const ControlButton({
    super.key,
    required this.label,
    required this.onTap,
    this.color,
    this.size = 60,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: (_) => onTap(),
      child: Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: color ?? const Color(0xFF1E293B),
          border: Border.all(color: (color ?? Colors.blue).withOpacity(0.5), width: 2),
          boxShadow: [
            BoxShadow(
              color: (color ?? Colors.blue).withOpacity(0.2),
              blurRadius: 8,
              spreadRadius: 1,
            )
          ],
        ),
        child: Center(
          child: Text(
            label,
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.black,
              color: Colors.white,
            ),
          ),
        ),
      ),
    );
  }
}
