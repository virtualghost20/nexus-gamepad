package com.nexus.remote.network

import okhttp3.*
import okio.ByteString
import org.json.JSONObject
import java.util.concurrent.TimeUnit

class WebSocketClient(private val listener: WebSocketListener) {
    private var client: OkHttpClient = OkHttpClient.Builder()
        .readTimeout(0, TimeUnit.MILLISECONDS) // Persistent
        .build()
    private var webSocket: WebSocket? = null

    interface WebSocketListener {
        fun onConnected()
        fun onDisconnected()
        fun onMessage(message: String)
        fun onError(error: String)
    }

    fun connect(url: String, roomCode: String) {
        val request = Request.Builder().url(url).build()
        webSocket = client.newWebSocket(request, object : okhttp3.WebSocketListener() {
            override fun onOpen(webSocket: WebSocket, response: Response) {
                // Join room immediately
                val joinMsg = JSONObject().apply {
                    put("type", "join")
                    put("room", roomCode)
                    put("clientType", "controller")
                }
                webSocket.send(joinMsg.toString())
                listener.onConnected()
            }

            override fun onMessage(webSocket: WebSocket, text: String) {
                val json = JSONObject(text)
                if (json.getString("type") == "ping") {
                    webSocket.send(JSONObject().apply { put("type", "pong") }.toString())
                } else {
                    listener.onMessage(text)
                }
            }

            override fun onClosing(webSocket: WebSocket, code: Int, reason: String) {
                listener.onDisconnected()
            }

            override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
                listener.onError(t.message ?: "Unknown error")
            }
        })
    }

    fun sendControl(action: String, data: Map<String, Any>) {
        val msg = JSONObject().apply {
            put("type", "control")
            val payload = JSONObject().apply {
                put("action", action)
                data.forEach { (k, v) -> put(k, v) }
            }
            put("payload", payload)
        }
        webSocket?.send(msg.toString())
    }

    fun disconnect() {
        webSocket?.close(1000, "User disconnected")
    }
}
