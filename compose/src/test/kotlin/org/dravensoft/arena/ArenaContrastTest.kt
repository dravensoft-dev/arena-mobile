/* Nobody can set an accessibility setting from a test and everybody can pass the parameter, which
 * is the whole reason the seam takes one. Every value here is read out of ArenaTokens rather than
 * written as a number: a literal would pass while the contract moved underneath it. */

package org.dravensoft.arena

import org.dravensoft.arena.tokens.ArenaContrast
import org.dravensoft.arena.tokens.ArenaTokens
import kotlin.test.Test
import kotlin.test.assertEquals

class ArenaContrastTest {
    @Test
    fun aBoundaryTakesTheStrongStepOnlyWhenTheReaderAskedForOne() {
        assertEquals(ArenaTokens.bw, ArenaContrast.border(false))
        assertEquals(ArenaTokens.bwStrong, ArenaContrast.border(true))
    }

    @Test
    fun theRingWidensOntoTheSpacingGridAndNotOntoAWidthOfItsOwn() {
        assertEquals(ArenaTokens.focusWidth, ArenaContrast.focusWidth(false))
        assertEquals(ArenaTokens.sp1, ArenaContrast.focusWidth(true))
    }

    @Test
    fun theScrimStopsBeingTranslucentOnItsOwnAxis() {
        assertEquals(ArenaTokens.scrimBlur, ArenaContrast.scrimBlur(false))
        assertEquals(ArenaTokens.sp0, ArenaContrast.scrimBlur(true))
    }
}
