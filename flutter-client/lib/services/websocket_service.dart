import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:web_socket_channel/web_socket_channel.dart';
import '../models/control_event.dart';

class WebSocketService extends ChangeNotifier {
  WebSocketChannel? _channel;
  bool _isConnected = false;
  String? _roomCode;
  
  bool get isConnected => _isConnected;
  String? get roomCode => _roomCode;

  void connect(String url, String room) {
    _roomCode = room;
    final uri = Uri.parse(url);
    
    try {
      _channel = WebSocketChannel.connect(uri);
      
      _channel!.stream.listen(
        (data) => _handleMessage(data),
        onDone: () => _handleDisconnect(url),
        onError: (err) => _handleDisconnect(url),
      );

      _joinRoom(room);
    } catch (e) {
      debugPrint('[WS ERROR] $e');
      _handleDisconnect(url);
    }
  }

  void _joinRoom(String room) {
    final joinMsg = {
      'type': 'join',
      'room': room,
      'clientType': 'controller'
    };
    sendJson(joinMsg);
    _isConnected = true;
    notifyListeners();
  }

  void _handleMessage(dynamic data) {
    final msg = jsonDecode(data.toString());
    if (msg['type'] == 'ping') {
      sendJson({'type': 'pong'});
    }
  }

  void sendControl(String action, [Map<String, dynamic>? payload]) {
    if (!_isConnected) return;
    
    final event = {
      'type': 'control',
      'payload': {
        'action': action,
        if (payload != null) ...payload,
      }
    };
    sendJson(event);
  }

  void sendJson(Map<String, dynamic> json) {
    _channel?.sink.add(jsonEncode(json));
  }

  void _handleDisconnect(String url) {
    _isConnected = false;
    notifyListeners();
    // Auto-reconnect
    Timer(const Duration(seconds: 3), () {
      if (!_isConnected && _roomCode != null) {
        connect(url, _roomCode!);
      }
    });
  }

  void disconnect() {
    _roomCode = null;
    _channel?.sink.close();
    _isConnected = false;
    notifyListeners();
  }
}
