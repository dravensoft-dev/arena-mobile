/* The seam takes a resolved FontFamily because Android offers no path from a family name to a
 * face a package bundles: a name reaches a system face or nothing. The default is not chosen
 * here, it is the CSS generic tail the emit drops, so mono falls back to the platform's
 * monospaced face and the other two to its default one. */

package org.dravensoft.arena

import androidx.compose.ui.text.font.FontFamily
import org.dravensoft.arena.tokens.ArenaFonts
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNotEquals

class ArenaFontsTest {
    @Test
    fun theSystemDefaultIsTheGenericTheContractedTailNames() {
        assertEquals(FontFamily.Default, ArenaFonts.System.display)
        assertEquals(FontFamily.Default, ArenaFonts.System.body)
        assertEquals(FontFamily.Monospace, ArenaFonts.System.mono)
    }

    @Test
    fun aConsumerHandsOverAFaceAndTheSeamCarriesItRatherThanTheDefault() {
        val provided = FontFamily.Cursive
        val fonts = ArenaFonts(display = provided, body = provided, mono = provided)
        assertEquals(provided, fonts.display)
        assertEquals(provided, fonts.body)
        assertNotEquals(ArenaFonts.System.mono, fonts.mono)
    }
}
