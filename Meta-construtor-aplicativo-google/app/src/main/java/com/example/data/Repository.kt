package com.example.data

import kotlinx.coroutines.flow.Flow

class AppRepository(
    private val obraDao: ObraDao,
    private val rdoDao: RdoDao
) {
    // Flow getters
    val allObras: Flow<List<Obra>> = obraDao.getAllObrasFlow()
    val allReports: Flow<List<RdoReport>> = rdoDao.getAllReportsFlow()

    fun getReportsForObra(obraId: Long): Flow<List<RdoReport>> = rdoDao.getReportsForObraFlow(obraId)

    // Suspend operations for Obras
    suspend fun getObraById(id: Long): Obra? = obraDao.getObraById(id)

    suspend fun insertObra(obra: Obra): Long = obraDao.insertObra(obra)

    suspend fun updateObra(obra: Obra) = obraDao.updateObra(obra)

    suspend fun deleteObra(obra: Obra) = obraDao.deleteObra(obra)

    // Suspend operations for RDO
    suspend fun getReportById(id: Long): RdoReport? = rdoDao.getReportById(id)

    suspend fun insertReport(report: RdoReport): Long = rdoDao.insertReport(report)

    suspend fun updateReport(report: RdoReport) = rdoDao.updateReport(report)

    suspend fun deleteReport(report: RdoReport) = rdoDao.deleteReport(report)
}
