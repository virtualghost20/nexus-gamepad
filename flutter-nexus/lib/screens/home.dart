import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 80, height: 80,
              decoration: BoxDecoration(color: const Color(0xFF38BDF8), borderRadius: BorderRadius.circular(20)),
              child: const Center(child: Text('NX', style: TextStyle(color: Colors.black, fontSize: 40, fontWeight: FontWeight.black))),
            ),
            const SizedBox(height: 24),
            const Text('NEXUS REMOTE', style: TextStyle(fontSize: 48, fontWeight: FontWeight.bold, letterSpacing: -2)),
            const Text('PERSISTENT CONTROL ARCHITECTURE', style: TextStyle(fontSize: 10, color: Colors.blueGrey, fontWeight: FontWeight.bold, letterSpacing: 2)),
            const SizedBox(height: 48),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                _buildModeCard(context, LucideIcons.smartphone, 'Controller', '/controller'),
                const SizedBox(width: 24),
                _buildModeCard(context, LucideIcons.monitor, 'Receiver', '/receiver', isSecondary: true),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildModeCard(BuildContext context, IconData icon, String title, String route, {bool isSecondary = false}) {
    return GestureDetector(
      onTap: () => Navigator.pushNamed(context, route),
      child: Container(
        width: 180, height: 180,
        decoration: BoxDecoration(
          color: const Color(0xFF1A1D23),
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: Colors.blue.withOpacity(0.2)),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 48, color: Colors.blue),
            const SizedBox(height: 16),
            Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
          ],
        ),
      ),
    );
  }
}
