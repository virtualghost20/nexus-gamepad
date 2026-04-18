import 'dart:convert';
import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:web_socket_channel/web_socket_channel.dart';

class SocketService extends ChangeNotifier {
  WebSocketChannel? _channel;
  bool _connected = false;
  String? _room;
  String? _clientType;
  final List<String> _logs = [];

  bool get isConnected => _connected;
  String? get room => _room;
  List<String> get logs => _logs;

  void connect(String url, String roomCode, String type) {
    _room = roomCode;
    _clientType = type;
    final uri = Uri.parse(url);
    
    _channel = WebSocketChannel.connect(uri);
    
    _channel!.stream.listen((data) {
      final message = jsonDecode(data);
      _handleMessage(message);
    }, onDone: () {
      _connected = false;
      notifyListeners();
      // Reconnect logic
      Future.delayed(const Duration(seconds: 3), () {
        if (!_connected) connect(url, roomCode, type);
      });
    });

    _joinRoom(roomCode, type);
  }

  void _joinRoom(String room, String type) {
    final msg = {
      'type': 'join',
      'room': room,
      'clientType': type,
    };
    sendJson(msg);
    _connected = true;
    notifyListeners();
  }

  void _handleMessage(Map<String, dynamic> message) {
    if (message['type'] == 'ping') {
      sendJson({'type': 'pong'});
    } else if (message['type'] == 'control') {
      final payload = jsonEncode(message['payload']);
      final time = DateTime.now().toString().split(' ')[1].split('.')[0];
      _logs.insert(0, "[$time] ACTION: ${message['payload']['action']} DATA: $payload");
      if (_logs.length > 50) _logs.removeLast();
      notifyListeners();
    }
  }

  void sendJson(Map<String, dynamic> data) {
    _channel?.sink.add(jsonEncode(data));
  }

  void sendControl(String action, [Map<String, dynamic>? data]) {
    final msg = {
      'type': 'control',
      'payload': {
        'action': action,
        if (data != null) ...data,
      }
    };
    sendJson(msg);
  }

  void disconnect() {
    _channel?.sink.close();
    _connected = false;
    notifyListeners();
  }
}
