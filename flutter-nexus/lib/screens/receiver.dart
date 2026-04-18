import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../services/socket_service.dart';

class ReceiverScreen extends StatefulWidget {
  const ReceiverScreen({super.key});

  @override
  State<ReceiverScreen> createState() => _ReceiverScreenState();
}

class _ReceiverScreenState extends State<ReceiverScreen> {
  late String _roomCode;

  @override
  void initState() {
    super.initState();
    _roomCode = (DateTime.now().millisecondsSinceEpoch % 1000000).toString().padLeft(6, '0');
    WidgetsBinding.instance.addPostFrameCallback((_) {
       // Replace with your server URL
       Provider.of<SocketService>(context, listen: false).connect('ws://YOUR_SERVER_URL', _roomCode, 'receiver');
    });
  }

  @override
  Widget build(BuildContext context) {
    final service = Provider.of<SocketService>(context);

    return Scaffold(
      body: Row(
        children: [
          // Sidebar
          Container(
            width: 300,
            color: const Color(0xFF1A1D23),
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('NEXUS RECEIVER', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, italic: true)),
                const SizedBox(height: 32),
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(color: Colors.blue.withOpacity(0.1), borderRadius: BorderRadius.circular(16), border: Border.all(color: Colors.blue.withOpacity(0.3))),
                  child: Column(
                    children: [
                      const Text('PAIRING CODE', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.blueGrey)),
                      Text(_roomCode, style: const TextStyle(fontSize: 42, fontWeight: FontWeight.black, letterSpacing: 4, color: Colors.blue)),
                    ],
                  ),
                ),
                const SizedBox(height: 24),
                Center(
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)),
                    child: QrImageView(data: _roomCode, size: 160),
                  ),
                ),
                const Spacer(),
                const Text('SYSTEM ACTIVE', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.green)),
              ],
            ),
          ),
          
          // Log Area
          Expanded(
            child: Column(
              children: [
                Container(
                  height: 60,
                  padding: const EdgeInsets.symmetric(horizontal: 24),
                  decoration: const BoxDecoration(border: Border(bottom: BorderSide(color: Colors.white10))),
                  child: const Row(
                    children: [
                      Icon(LucideIcons.monitor, size: 16, color: Colors.blueGrey),
                      SizedBox(width: 12),
                      Text('INPUT STREAM', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                    ],
                  ),
                ),
                Expanded(
                  child: ListView.builder(
                    padding: const EdgeInsets.all(24),
                    itemCount: service.logs.length,
                    itemBuilder: (context, index) {
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 8),
                        child: Text(service.logs[index], style: const TextStyle(fontFamily: 'Courier', fontSize: 12, color: Colors.greenAccent)),
                      );
                    },
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
