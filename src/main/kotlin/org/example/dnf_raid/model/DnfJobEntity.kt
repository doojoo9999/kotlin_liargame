package org.example.dnf_raid.model

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table

@Entity
@Table(name = "dnf_raw_jobs")
data class DnfJobEntity(
    @Id
    @Column(name = "job_id", nullable = false, length = 64)
    val jobId: String,

    @Column(name = "job_name", nullable = false, length = 128)
    val jobName: String
)
