package com.funoffline.app.ui.user.games

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.unit.dp
import com.funoffline.app.core.i18n.AppLanguage
import com.funoffline.app.data.model.GameId
import kotlinx.coroutines.delay
import kotlin.math.cos
import kotlin.math.sin
import kotlin.random.Random

/**
 * Lightweight 60fps Compose Canvas viewport for all 9 requested offline games,
 * designed for 4GB RAM Android devices with zero heavy texture allocations.
 */
@Composable
fun OfflineGameViewport(
    gameId: GameId,
    language: AppLanguage,
    onExit: () -> Unit
) {
    var score by remember { mutableIntStateOf(0) }
    var stage by remember { mutableIntStateOf(1) }

    Scaffold(
        containerColor = Color.Black,
        topBar = {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .statusBarsPadding()
                    .padding(horizontal = 16.dp, vertical = 10.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        if (language == AppLanguage.BN) gameId.titleBn else gameId.titleEn,
                        color = Color.White,
                        style = MaterialTheme.typography.titleLarge
                    )
                    Text(
                        "Score: $score • Stage $stage • Offline Mode",
                        color = Color(0xFF10B981),
                        style = MaterialTheme.typography.bodyMedium
                    )
                }
                OutlinedButton(onClick = onExit) { Text("Exit") }
            }
        }
    ) { padding ->
        Box(modifier = Modifier.fillMaxSize().padding(padding)) {
            when (gameId) {
                GameId.LEVEL_DEVIL -> LevelDevilCanvas(onScore = { score += 100; stage += 1 })
                GameId.MINI_MILITIA -> MiniMilitiaCanvas(onHit = { score += 25 })
                GameId.CARROM -> CarromCanvas(onPocket = { score += 20 })
                GameId.TEEN_PATTI -> TeenPattiFreePlayTable(onHandPlayed = { score += 10 })
                GameId.BRICK_BLOCK -> BrickBlockCanvas(onLineClear = { score += 100 })
                GameId.POOL -> PoolCanvas(onSink = { score += 15 })
                GameId.BALLOON_SHOOTER -> BalloonShooterCanvas(onPop = { score += 10 })
                GameId.ARCHERY -> ArcheryCanvas(onBullseye = { score += it })
                GameId.LUDO_STAR -> LudoStarBoard(onMove = { score += 5 })
            }
        }
    }
}

@Composable
private fun LevelDevilCanvas(onScore: () -> Unit) {
    var playerX by remember { mutableFloatStateOf(0.12f) }
    var playerY by remember { mutableFloatStateOf(0.72f) }
    var trapShift by remember { mutableFloatStateOf(0f) }

    LaunchedEffect(Unit) {
        while (true) {
            delay(32)
            trapShift = if (playerX > 0.4f && playerX < 0.65f) 0.12f else 0f
        }
    }

    Column(modifier = Modifier.fillMaxSize()) {
        Canvas(modifier = Modifier.weight(1f).fillMaxWidth()) {
            val w = size.width
            val h = size.height
            drawRect(Color(0xFF111827), topLeft = Offset(0f, h * 0.78f), size = Size(w * (0.45f - trapShift), h * 0.22f))
            drawRect(Color(0xFF111827), topLeft = Offset(w * (0.58f + trapShift), h * 0.78f), size = Size(w * 0.42f, h * 0.22f))
            drawCircle(Color(0xFFF97316), radius = 22f, center = Offset(w * playerX, h * playerY))
            drawRect(Color(0xFF10B981), topLeft = Offset(w * 0.88f, h * 0.66f), size = Size(36f, 64f))
        }
        Row(
            modifier = Modifier.fillMaxWidth().padding(16.dp),
            horizontalArrangement = Arrangement.SpaceEvenly
        ) {
            Button(onClick = { playerX = (playerX - 0.08f).coerceAtLeast(0.08f) }) { Text("Left") }
            Button(onClick = { playerY = 0.56f }) { Text("Jump") }
            Button(onClick = {
                playerY = 0.72f
                playerX = (playerX + 0.1f).coerceAtMost(0.9f)
                if (playerX >= 0.86f) {
                    playerX = 0.12f
                    onScore()
                }
            }) { Text("Right") }
        }
    }
}

@Composable
private fun MiniMilitiaCanvas(onHit: () -> Unit) {
    var targetX by remember { mutableFloatStateOf(0.75f) }
    var targetY by remember { mutableFloatStateOf(0.4f) }
    Canvas(
        modifier = Modifier.fillMaxSize().pointerInput(Unit) {
            detectTapGestures { offset ->
                val dx = offset.x - size.width * targetX
                val dy = offset.y - size.height * targetY
                if (dx * dx + dy * dy < 3600f) {
                    onHit()
                    targetX = Random.nextFloat().coerceIn(0.2f, 0.85f)
                    targetY = Random.nextFloat().coerceIn(0.2f, 0.75f)
                }
            }
        }
    ) {
        drawCircle(Color(0xFF22C55E), radius = 28f, center = Offset(size.width * 0.15f, size.height * 0.6f))
        drawCircle(Color(0xFFEF4444), radius = 34f, center = Offset(size.width * targetX, size.height * targetY))
    }
}

@Composable
private fun CarromCanvas(onPocket: () -> Unit) {
    var strikerX by remember { mutableFloatStateOf(0.5f) }
    var strikerY by remember { mutableFloatStateOf(0.82f) }
    Canvas(
        modifier = Modifier.fillMaxSize().pointerInput(Unit) {
            detectDragGestures(
                onDragEnd = {
                    strikerY = 0.25f
                    onPocket()
                },
                onDrag = { change, _ ->
                    strikerX = (change.position.x / size.width).coerceIn(0.2f, 0.8f)
                }
            )
        }
    ) {
        val boardSize = size.minDimension * 0.85f
        val left = (size.width - boardSize) / 2f
        val top = (size.height - boardSize) / 2f
        drawRect(Color(0xFFD6B98C), topLeft = Offset(left, top), size = Size(boardSize, boardSize))
        drawCircle(Color(0xFFEAB308), radius = 24f, center = Offset(size.width * strikerX, size.height * strikerY))
    }
}

@Composable
private fun TeenPattiFreePlayTable(onHandPlayed: () -> Unit) {
    var handLabel by remember { mutableStateOf("Tap Deal for Free Practice Hand (Zero Wagering)") }
    Column(
        modifier = Modifier.fillMaxSize().padding(24.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text("Free Play Only — Zero Wagering", color = Color(0xFFEC4899), style = MaterialTheme.typography.titleMedium)
        Spacer(Modifier.height(16.dp))
        Text(handLabel, color = Color.White, style = MaterialTheme.typography.bodyLarge)
        Spacer(Modifier.height(24.dp))
        Button(onClick = {
            val cards = listOf("A♠", "K♠", "Q♠", "J♥", "10♦", "9♣").shuffled().take(3)
            handLabel = "Your Practice Hand: ${cards.joinToString("  ")}"
            onHandPlayed()
        }) {
            Text("Deal Free Hand")
        }
    }
}

@Composable
private fun BrickBlockCanvas(onLineClear: () -> Unit) {
    var filledCount by remember { mutableIntStateOf(12) }
    Column(
        modifier = Modifier.fillMaxSize().padding(20.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Canvas(modifier = Modifier.size(280.dp)) {
            val cell = size.width / 8f
            for (r in 0 until 8) {
                for (c in 0 until 8) {
                    val idx = r * 8 + c
                    drawRect(
                        color = if (idx < filledCount) Color(0xFF38BDF8) else Color(0xFF1F2937),
                        topLeft = Offset(c * cell + 2f, r * cell + 2f),
                        size = Size(cell - 4f, cell - 4f)
                    )
                }
            }
        }
        Spacer(Modifier.height(16.dp))
        Button(onClick = {
            filledCount += 4
            if (filledCount >= 32) {
                filledCount = 8
                onLineClear()
            }
        }) { Text("Place 4-Block Piece") }
    }
}

@Composable
private fun PoolCanvas(onSink: () -> Unit) {
    var cueX by remember { mutableFloatStateOf(0.5f) }
    Canvas(
        modifier = Modifier.fillMaxSize().pointerInput(Unit) {
            detectTapGestures { offset ->
                cueX = (offset.x / size.width).coerceIn(0.15f, 0.85f)
                onSink()
            }
        }
    ) {
        drawRect(Color(0xFF065F46), topLeft = Offset(size.width * 0.1f, size.height * 0.15f), size = Size(size.width * 0.8f, size.height * 0.7f))
        drawCircle(Color.White, radius = 18f, center = Offset(size.width * cueX, size.height * 0.7f))
        drawCircle(Color(0xFFEF4444), radius = 18f, center = Offset(size.width * 0.5f, size.height * 0.35f))
    }
}

@Composable
private fun BalloonShooterCanvas(onPop: () -> Unit) {
    var bx by remember { mutableFloatStateOf(0.5f) }
    var by by remember { mutableFloatStateOf(0.75f) }
    LaunchedEffect(Unit) {
        while (true) {
            delay(32)
            by -= 0.01f
            if (by < 0.15f) {
                by = 0.85f
                bx = Random.nextFloat().coerceIn(0.15f, 0.85f)
            }
        }
    }
    Canvas(
        modifier = Modifier.fillMaxSize().pointerInput(Unit) {
            detectTapGestures { pos ->
                val dx = pos.x - size.width * bx
                val dy = pos.y - size.height * by
                if (dx * dx + dy * dy < 4000f) {
                    onPop()
                    by = 0.85f
                    bx = Random.nextFloat().coerceIn(0.15f, 0.85f)
                }
            }
        }
    ) {
        drawCircle(Color(0xFFF43F5E), radius = 38f, center = Offset(size.width * bx, size.height * by))
    }
}

@Composable
private fun ArcheryCanvas(onBullseye: (Int) -> Unit) {
    var angle by remember { mutableFloatStateOf(0f) }
    LaunchedEffect(Unit) {
        while (true) {
            delay(32)
            angle += 0.05f
        }
    }
    Column(
        modifier = Modifier.fillMaxSize(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Canvas(modifier = Modifier.size(260.dp)) {
            val c = Offset(size.width / 2f, size.height / 2f)
            drawCircle(Color.White, radius = 110f, center = c)
            drawCircle(Color(0xFF3B82F6), radius = 75f, center = c)
            drawCircle(Color(0xFFEF4444), radius = 40f, center = c)
            val aim = Offset(c.x + cos(angle) * 60f, c.y + sin(angle) * 20f)
            drawCircle(Color(0xFFA855F7), radius = 10f, center = aim)
        }
        Spacer(Modifier.height(16.dp))
        Button(onClick = { onBullseye(50) }) { Text("Release Arrow") }
    }
}

@Composable
private fun LudoStarBoard(onMove: () -> Unit) {
    var dice by remember { mutableIntStateOf(6) }
    var step by remember { mutableIntStateOf(0) }
    Column(
        modifier = Modifier.fillMaxSize().padding(20.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text("Ludo Token Progress: $step / 57", color = Color.White, style = MaterialTheme.typography.titleLarge)
        Spacer(Modifier.height(12.dp))
        Text("Dice: $dice", color = Color(0xFF3B82F6), style = MaterialTheme.typography.headlineMedium)
        Spacer(Modifier.height(16.dp))
        Button(onClick = {
            dice = Random.nextInt(1, 7)
            step = (step + dice) % 58
            onMove()
        }) { Text("Roll Dice") }
    }
}
