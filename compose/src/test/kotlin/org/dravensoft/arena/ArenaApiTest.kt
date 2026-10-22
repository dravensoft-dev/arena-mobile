/* The one piece of logic this emit writes that no compiler supplies is Kotlin's from(value).
 * Swift is handed a failable init?(rawValue:) by declaring a raw type at all, and Kotlin is
 * handed name, ordinal and a valueOf that throws, so the lookup over the contract's own literal
 * is emitted rather than given. The literal is the other half and is why it can be: a mangled
 * case name cannot be walked back to the value that produced it, and a case carrying its
 * literal can. */

package org.dravensoft.arena

import org.dravensoft.arena.api.ArenaAlertTone
import org.dravensoft.arena.api.ArenaBreakpoint
import org.dravensoft.arena.api.ArenaCatSlot
import org.dravensoft.arena.api.ArenaInputType
import org.dravensoft.arena.api.ArenaLocale
import org.dravensoft.arena.api.ArenaMenuItem
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNull

class ArenaApiTest {
    @Test
    fun aCaseCarriesTheContractsOwnLiteralAndNotItsMangledName() {
        assertEquals("danger", ArenaAlertTone.Danger.value)
        assertEquals("datetime-local", ArenaInputType.DatetimeLocal.value)
        assertEquals(1, ArenaCatSlot.Slot1.value)
        assertEquals(8, ArenaCatSlot.Slot8.value)
    }

    @Test
    fun fromWalksBackToTheEntry() {
        assertEquals(ArenaAlertTone.Danger, ArenaAlertTone.from("danger"))
        assertEquals(ArenaInputType.DatetimeLocal, ArenaInputType.from("datetime-local"))
        assertEquals(ArenaCatSlot.Slot8, ArenaCatSlot.from(8))
    }

    @Test
    fun aValueTheContractDoesNotDeclareAnswersNullRatherThanThrowing() {
        assertNull(ArenaAlertTone.from("chartreuse"))
        assertNull(ArenaInputType.from("datetimeLocal"))
        assertNull(ArenaCatSlot.from(9))
        assertNull(ArenaCatSlot.from(0))
    }

    @Test
    fun everyCaseIsReachedByItsOwnLiteral() {
        for (entry in ArenaAlertTone.entries) assertEquals(entry, ArenaAlertTone.from(entry.value))
        for (entry in ArenaInputType.entries) assertEquals(entry, ArenaInputType.from(entry.value))
        for (entry in ArenaCatSlot.entries) assertEquals(entry, ArenaCatSlot.from(entry.value))
    }

    @Test
    fun aFieldTheContractDefaultsIsAnsweredByThatDefaultWhenTheCallerSaysNothing() {
        assertEquals("en-GB", ArenaLocale().locale)
        assertEquals("Today", ArenaLocale().calendarToday)
        assertEquals("Hoy", ArenaLocale(calendarToday = "Hoy").calendarToday)
        assertEquals(false, ArenaMenuItem(label = "Delete").destructive)
    }

    @Test
    fun aBreakpointIsOneOfTheThreeTheContractNames() {
        assertEquals(listOf("sm", "md", "lg"), ArenaBreakpoint.entries.map { it.value })
    }
}
