/* The two composite types the emit constructs, held for what they carry rather than for what
 * they hold: the values themselves are check:emit's, against a fresh emit. An easing is a cubic
 * bezier pinned at both ends whatever its control points, so a curve that leaves either end is a
 * timing nobody authored; a shadow compares on all four of its fields, because a copy that agrees
 * on three is the emit going out of step in the one field nobody looked at. */

package org.dravensoft.arena

import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import org.dravensoft.arena.tokens.ArenaEasing
import org.dravensoft.arena.tokens.ArenaShadow
import org.dravensoft.arena.tokens.ArenaTokens
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNotEquals

class ArenaSupportTest {
    @Test
    fun anEasingIsPinnedAtBothEndsWhateverItsControlPoints() {
        for (easing in listOf(ArenaTokens.easeOut, ArenaTokens.easeInOut, ArenaTokens.easeEmphatic)) {
            assertEquals(0f, easing.asEasing().transform(0f), 0.0001f)
            assertEquals(1f, easing.asEasing().transform(1f), 0.0001f)
        }
    }

    @Test
    fun theFourControlPointsReachTheCurveInOrder() {
        assertEquals(0.5f, ArenaEasing(0f, 0f, 1f, 1f).asEasing().transform(0.5f), 0.0001f)
    }

    @Test
    fun aShadowComparesOnAllFourFieldsAndNotOnThree() {
        val one = ArenaShadow(offsetX = 0.dp, offsetY = 4.dp, blur = 8.dp, color = Color.Black)
        assertEquals(one, ArenaShadow(offsetX = 0.dp, offsetY = 4.dp, blur = 8.dp, color = Color.Black))
        assertNotEquals(one, one.copy(blur = 12.dp))
        assertNotEquals(one, one.copy(color = Color.White))
    }
}
