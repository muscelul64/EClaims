package com.deactech.drivesafeandroid.data

import com.deactech.drivesafeandroid.ClaimStatement
import com.deactech.drivesafeandroid.StatementApiService
import com.deactech.drivesafeandroid.SubmitStatementResponse
import okhttp3.MultipartBody
import okhttp3.OkHttpClient
import retrofit2.Response
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

object NetworkModule {

    private const val BASE_URL = "http://drivesafewabapi.deactec.com/" // Production URL from documentation

    private val okHttpClient = OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .writeTimeout(30, TimeUnit.SECONDS)
        .build()

    private val retrofit = Retrofit.Builder()
        .baseUrl(BASE_URL)
        .client(okHttpClient)
        .addConverterFactory(GsonConverterFactory.create())
        .build()

    // Real API Service
    val apiService: StatementApiService = retrofit.create(StatementApiService::class.java)

    // Mock API Service (for testing without backend)
    val mockApiService = object : StatementApiService {
        override suspend fun submitStatement(statement: ClaimStatement): Response<SubmitStatementResponse> {
            kotlinx.coroutines.delay(1000) // Simulate network
            return Response.success(
                SubmitStatementResponse(
                    statementId = "mock_id_${System.currentTimeMillis()}",
                    status = "received",
                    confirmationNumber = "CONF-${System.currentTimeMillis()}",
                    message = "Mock submission successful",
                    estimatedProcessingTime = "24h",
                    nextSteps = listOf("Wait for review", "Photos processed within 24h")
                )
            )
        }

        override suspend fun uploadPhotos(id: String, d: List<MultipartBody.Part>, p: List<MultipartBody.Part>): Response<Unit> {
            kotlinx.coroutines.delay(500)
            return Response.success(Unit)
        }
    }
}
