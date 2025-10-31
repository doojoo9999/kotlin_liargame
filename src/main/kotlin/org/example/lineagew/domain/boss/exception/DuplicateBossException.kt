package org.example.lineagew.domain.boss.exception

/**
 * Thrown when attempting to create or rename a boss to a name that already exists.
 */
class DuplicateBossException(val bossName: String) : RuntimeException("Boss already exists: $bossName")
