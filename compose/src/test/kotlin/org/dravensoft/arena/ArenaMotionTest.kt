/* The policy states what each KIND of motion does rather than listing animations, which is why it
 * survives a toolkit with no media query, and the three classes answer three different ways. The
 * slowed step is a default and not a constant: the rotor passes its own, three times slower again,
 * and a member fixed to loopReduced would freeze that decision at the wrong call site. */

package org.dravensoft.arena

import org.dravensoft.arena.tokens.ArenaMotion
import org.dravensoft.arena.tokens.ArenaTokens
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertTrue

class ArenaMotionTest {
    @Test
    fun aWorkingLoopSlowsAndIsNeverFrozen() {
        assertEquals(ArenaTokens.loopSpin, ArenaMotion.working(ArenaTokens.loopSpin, false))
        assertEquals(ArenaTokens.loopReduced, ArenaMotion.working(ArenaTokens.loopSpin, true))
    }

    @Test
    fun theRotorPassesItsOwnSlowedStepAtTheCallSite() {
        assertEquals(
            ArenaTokens.loopBrandReduced,
            ArenaMotion.working(ArenaTokens.loopBrand, true, slowed = ArenaTokens.loopBrandReduced),
        )
        assertEquals(
            ArenaTokens.loopBrand,
            ArenaMotion.working(ArenaTokens.loopBrand, false, slowed = ArenaTokens.loopBrandReduced),
        )
    }

    @Test
    fun decorativeMotionStopsOutright() {
        assertTrue(ArenaMotion.decorative(false))
        assertFalse(ArenaMotion.decorative(true))
    }

    @Test
    fun anEntranceDropsItsTravelOntoTheContractedZero() {
        assertEquals(ArenaTokens.sp4, ArenaMotion.travel(ArenaTokens.sp4, false))
        assertEquals(ArenaTokens.sp0, ArenaMotion.travel(ArenaTokens.sp4, true))
    }
}
