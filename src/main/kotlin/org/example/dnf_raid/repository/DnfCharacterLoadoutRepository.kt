package org.example.dnf_raid.repository

import org.example.dnf_raid.model.DnfCharacterLoadoutEntity
import org.springframework.data.jpa.repository.JpaRepository

interface DnfCharacterLoadoutRepository : JpaRepository<DnfCharacterLoadoutEntity, String>
