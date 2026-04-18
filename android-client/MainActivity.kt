package com.nexus.remote

import android.os.Bundle
import android.widget.Button
import android.widget.EditText
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import com.nexus.remote.network.WebSocketClient
import com.nexus.remote.ui.JoystickView

class MainActivity : AppCompatActivity(), WebSocketClient.WebSocketListener {

    private lateinit var wsClient: WebSocketClient
    private lateinit var statusText: TextView
    private lateinit var roomInput: EditText
    private lateinit var connectBtn: Button

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        statusText = findViewById(R.id.statusText)
        roomInput = findViewById(R.id.roomInput)
        connectBtn = findViewById(R.id.connectBtn)
        val joystick = findViewById<JoystickView>(R.id.joystick)

        wsClient = WebSocketClient(this)

        connectBtn.setOnClickListener {
            val room = roomInput.text.toString()
            if (room.isNotEmpty()) {
                // Replace with your server URL
                wsClient.connect("ws://YOUR_SERVER_IP:3000", room)
            }
        }

        joystick.onMoveListener = { x, y ->
            wsClient.sendControl("MOVE", mapOf("x" to x, "y" to y))
        }

        // Action Buttons
        findViewById<Button>(R.id.btnA).setOnClickListener { wsClient.sendControl("BUTTON_A", emptyMap()) }
        findViewById<Button>(R.id.btnB).setOnClickListener { wsClient.sendControl("BUTTON_B", emptyMap()) }
    }

    override fun onConnected() {
        runOnUiThread { statusText.text = "Connected" }
    }

    override fun onDisconnected() {
        runOnUiThread { statusText.text = "Disconnected" }
    }

    override fun onMessage(message: String) {}

    override fun onError(error: String) {
        runOnUiThread { statusText.text = "Error: $error" }
    }

    override fun onDestroy() {
        super.onDestroy()
        wsClient.disconnect()
    }
}
