import 'dart:convert';

class ControlEvent {
  final String type;
  final String action;
  final Map<String, dynamic> data;

  ControlEvent({
    required this.type,
    required this.action,
    required this.data,
  });

  Map<String, dynamic> toJson() {
    return {
      'type': type,
      'action': action,
      ...data,
    };
  }

  String toJsonString() => jsonEncode(toJson());
}
