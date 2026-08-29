/* The device reports the inset and Arena states the floor, so the composition is a max and never
 * a replacement: a member returning either half alone compiles, draws, and is wrong on one of
 * the two devices. The floor is what applies when the device reports nothing, which is every
 * device with no cutout and every Android app that has not gone edge to edge. */

package org.dravensoft.arena

import org.dravensoft.arena.tokens.ArenaSafeArea
import org.dravensoft.arena.tokens.ArenaTokens
import kotlin.test.Test
import kotlin.test.assertEquals

class ArenaSafeAreaTest {
    @Test
    fun aDeviceReportingNothingGetsTheFloorTheContractNames() {
        assertEquals(ArenaTokens.sp3, ArenaSafeArea.bottom(ArenaTokens.sp0))
        assertEquals(ArenaTokens.sp0, ArenaSafeArea.top(ArenaTokens.sp0))
        assertEquals(ArenaTokens.sp0, ArenaSafeArea.start(ArenaTokens.sp0))
        assertEquals(ArenaTokens.sp0, ArenaSafeArea.end(ArenaTokens.sp0))
    }

    @Test
    fun anInsetDeeperThanTheFloorIsWhatApplies() {
        assertEquals(ArenaTokens.sp8, ArenaSafeArea.bottom(ArenaTokens.sp8))
        assertEquals(ArenaTokens.sp8, ArenaSafeArea.top(ArenaTokens.sp8))
        assertEquals(ArenaTokens.sp8, ArenaSafeArea.start(ArenaTokens.sp8))
        assertEquals(ArenaTokens.sp8, ArenaSafeArea.end(ArenaTokens.sp8))
    }

    @Test
    fun anInsetShallowerThanTheFloorDoesNotLowerIt() {
        assertEquals(ArenaTokens.sp3, ArenaSafeArea.bottom(ArenaTokens.sp1))
    }

    @Test
    fun aCallerRaisesTheFloorAndTheCompositionIsUnchanged() {
        assertEquals(ArenaTokens.sp4, ArenaSafeArea.top(ArenaTokens.sp0, floor = ArenaTokens.sp4))
        assertEquals(ArenaTokens.sp8, ArenaSafeArea.top(ArenaTokens.sp8, floor = ArenaTokens.sp4))
    }
}
