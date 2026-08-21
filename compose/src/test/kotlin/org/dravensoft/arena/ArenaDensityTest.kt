/* Arena states no cap on user text scale and this repository must, because both platforms
 * scale text several times over at their accessibility sizes and a control that grows without
 * bound stops fitting a phone before an auditor ever sees it. ArenaScale.CAP is 2, measured
 * against Android's own largest accessibility font scale, and it bounds the geometry derived
 * from a control floor while the text itself stays uncapped: dz-ctl-h is a floor the content
 * grows past, never a height text is fitted into. Comfortable is the touch density and every
 * rung of it clears the 44dp Apple asks; dz-ctl-h clears the 48dp Android asks. Compact
 * clears neither and is the expert density, for a reader pointing with a mouse. */

package org.dravensoft.arena

import androidx.compose.ui.unit.dp
import org.dravensoft.arena.tokens.ArenaComfortableDensity
import org.dravensoft.arena.tokens.ArenaCompactDensity
import org.dravensoft.arena.tokens.ArenaScale
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

class ArenaDensityTest {
    @Test
    fun comfortableClearsBothTouchFloors() {
        assertTrue(ArenaComfortableDensity.ctlH >= 48.dp)
        for (rung in listOf(ArenaComfortableDensity.ctlHSm, ArenaComfortableDensity.ctlH, ArenaComfortableDensity.ctlHLg)) {
            assertTrue(rung >= 44.dp)
        }
    }

    @Test
    fun compactIsNotOfferableToAThumb() {
        assertTrue(ArenaCompactDensity.ctlHSm < 44.dp)
    }

    @Test
    fun controlGeometryIsCappedAndTextIsNot() {
        assertEquals(2f, ArenaScale.CAP)
        assertEquals(48.dp, ArenaScale.control(48.dp, fontScale = 1f))
        assertEquals(96.dp, ArenaScale.control(48.dp, fontScale = 3.2f))
        assertEquals(3.2f, ArenaScale.textScale(3.2f))
    }
}
