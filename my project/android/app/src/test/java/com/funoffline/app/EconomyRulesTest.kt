package com.funoffline.app

import com.funoffline.app.data.model.GameId
import com.funoffline.app.data.model.MatchSession
import org.junit.Assert.assertEquals
import org.junit.Assert.assertThrows
import org.junit.Test

class EconomyRulesTest {

    @Test
    fun catalogContainsExactlyNineGamesAndThreeMatchEligibleTitles() {
        assertEquals(9, GameId.ALL_NINE.size)
        assertEquals(
            listOf(GameId.CARROM, GameId.POOL, GameId.LUDO_STAR),
            GameId.MATCH_ELIGIBLE
        )
    }

    @Test
    fun matchSessionRejectsTeenPattiAndNonEligibleGames() {
        assertThrows(IllegalArgumentException::class.java) {
            MatchSession(
                id = "bad_match",
                gameId = GameId.TEEN_PATTI,
                hostUserId = "u1"
            )
        }
        assertThrows(IllegalArgumentException::class.java) {
            MatchSession(
                id = "bad_match_2",
                gameId = GameId.LEVEL_DEVIL,
                hostUserId = "u1"
            )
        }
    }
}
