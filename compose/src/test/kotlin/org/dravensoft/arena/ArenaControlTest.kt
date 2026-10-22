/* The activation box takes its floor as an argument and carries no default. The floor a platform
 * asks for is a constant of that platform, 48dp here and 44pt on iOS, and every other length in
 * this library is read from the emit; a default would be the one value written by hand. Which
 * rungs stand above those floors is ArenaDensityTest's claim and not this file's. */

package org.dravensoft.arena

import androidx.compose.ui.unit.dp
import org.dravensoft.arena.tokens.ArenaBaseDensity
import org.dravensoft.arena.tokens.ArenaComfortableDensity
import org.dravensoft.arena.tokens.ArenaCompactDensity
import org.dravensoft.arena.tokens.ArenaControl
import org.dravensoft.arena.tokens.ArenaTokens
import kotlin.test.Test
import kotlin.test.assertEquals

class ArenaControlTest {
    @Test
    fun aControlReDensifiesWithTheScale() {
        for (density in listOf(ArenaBaseDensity, ArenaCompactDensity, ArenaComfortableDensity)) {
            assertEquals(density.ctlH, ArenaControl.height(density))
            assertEquals(density.text, ArenaControl.text(density))
        }
    }

    @Test
    fun theRoomAControlGivesItsContentIsContractedAndNotPerRung() {
        assertEquals(ArenaTokens.sp3, ArenaControl.padding)
        assertEquals(ArenaTokens.sp2, ArenaControl.gap)
        assertEquals(ArenaTokens.rSm, ArenaControl.radius)
        assertEquals(ArenaTokens.fwSemibold, ArenaControl.weight)
    }

    @Test
    fun theActivationBoxIsTheFloorWhereThePaintIsSmallerAndThePaintWhereItIsNot() {
        val floor = 48.dp
        assertEquals(floor, ArenaControl.target(ArenaCompactDensity.ctlH, floor))
        assertEquals(ArenaComfortableDensity.ctlH, ArenaControl.target(ArenaComfortableDensity.ctlH, floor))
    }
}
