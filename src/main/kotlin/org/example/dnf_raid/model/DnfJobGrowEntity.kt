package org.example.dnf_raid.model

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.IdClass
import jakarta.persistence.Table
import java.io.Serializable

@Entity
@Table(name = "dnf_raw_job_grows")
@IdClass(DnfJobGrowId::class)
data class DnfJobGrowEntity(
    @Id
    @Column(name = "job_id", length = 64, nullable = false)
    val jobId: String,

    @Id
    @Column(name = "job_grow_id", length = 64, nullable = false)
    val jobGrowId: String,

    @Column(name = "job_name", length = 128, nullable = false)
    val jobName: String,

    @Column(name = "job_grow_name", length = 128, nullable = false)
    val jobGrowName: String
)

data class DnfJobGrowId(
    val jobId: String = "",
    val jobGrowId: String = ""
) : Serializable
