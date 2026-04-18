package com.nexus.remote.ui

import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.util.AttributeSet
import android.view.MotionEvent
import android.view.View
import kotlin.math.atan2
import kotlin.math.cos
import kotlin.math.min
import kotlin.math.sin
import kotlin.math.sqrt

class JoystickView @JvmOverloads constructor(
    context: Context, attrs: AttributeSet? = null, defStyleAttr: Int = 0
) : View(context, attrs, defStyleAttr) {

    private var centerX = 0f
    private var centerY = 0f
    private var baseRadius = 0f
    private var hatRadius = 0f
    private var joystickX = 0f
    private var joystickY = 0f

    private val basePaint = Paint().apply {
        color = Color.LTGRAY
        style = Paint.Style.FILL
        alpha = 100
    }
    
    private val hatPaint = Paint().apply {
        color = Color.DKGRAY
        style = Paint.Style.FILL
        isAntiAlias = true
    }

    var onMoveListener: ((x: Float, y: Float) -> Unit)? = null

    override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
        centerX = w / 2f
        centerY = h / 2f
        baseRadius = min(w, h) / 3f
        hatRadius = baseRadius / 2.5f
        joystickX = centerX
        joystickY = centerY
    }

    override fun onDraw(canvas: Canvas) {
        canvas.drawCircle(centerX, centerY, baseRadius, basePaint)
        canvas.drawCircle(joystickX, joystickY, hatRadius, hatPaint)
    }

    override fun onTouchEvent(event: MotionEvent): Boolean {
        when (event.action) {
            MotionEvent.ACTION_DOWN, MotionEvent.ACTION_MOVE -> {
                val displacement = sqrt((event.x - centerX).let { it * it } + (event.y - centerY).let { it * it })
                if (displacement < baseRadius) {
                    joystickX = event.x
                    joystickY = event.y
                } else {
                    val ratio = baseRadius / displacement
                    joystickX = centerX + (event.x - centerX) * ratio
                    joystickY = centerY + (event.y - centerY) * ratio
                }
                
                // Normalized coordinates (-1 to 1)
                val normX = (joystickX - centerX) / baseRadius
                val normY = (joystickY - centerY) / baseRadius
                onMoveListener?.invoke(normX, normY)
                invalidate()
            }
            MotionEvent.ACTION_UP -> {
                joystickX = centerX
                joystickY = centerY
                onMoveListener?.invoke(0f, 0f)
                invalidate()
            }
        }
        return true
    }
}
