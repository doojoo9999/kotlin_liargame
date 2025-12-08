package org.example.dnf_raid.repository

import org.example.dnf_raid.model.DnfParticipantEntity
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import java.util.UUID

interface DnfParticipantRepository : JpaRepository<DnfParticipantEntity, UUID> {
    fun findByRaidIdOrderByCreatedAtAsc(raidId: UUID): List<DnfParticipantEntity>

    fun findByRaidIdOrderByCreatedAtDesc(raidId: UUID): List<DnfParticipantEntity>

    @Query("select p.raid.id as raidId, count(p) as count from DnfParticipantEntity p where p.raid.id in :raidIds group by p.raid.id")
    fun countByRaidIds(raidIds: Collection<UUID>): List<ParticipantCountProjection>

    @Modifying
    @Query(
        """
        delete from DnfParticipantEntity p
        where p.raid.id = :raidId
          and (
            (:adventureName is null and (p.character.adventureName is null or p.character.adventureName = ''))
            or lower(p.character.adventureName) = lower(:adventureName)
          )
        """
    )
    fun deleteByRaidIdAndAdventureName(raidId: UUID, adventureName: String?): Int

    @Modifying
    @Query("delete from DnfParticipantEntity p where p.raid.id = :raidId and p.character.characterId = :characterId")
    fun deleteByRaidIdAndCharacterId(raidId: UUID, characterId: String): Int
}

interface ParticipantCountProjection {
    val raidId: UUID
    val count: Long
}
