// Build: nvcc -O3 -arch=sm_120 vector-add.cu -o vector-add.exe
// Use the architecture of your GPU if it differs from the RTX 5060's sm_120.
#include <cuda_runtime.h>

#include <algorithm>
#include <chrono>
#include <cstdlib>
#include <iomanip>
#include <iostream>
#include <vector>

using Clock = std::chrono::steady_clock;
constexpr int block_size = 256;
constexpr int samples = 21;
constexpr int warmups = 5;

void check(cudaError_t result) {
    if (result != cudaSuccess) {
        std::cerr << cudaGetErrorString(result) << '\n';
        std::exit(EXIT_FAILURE);
    }
}

__global__ void add_gpu(const float* a, const float* b, float* c, int count) {
    int index = blockIdx.x * blockDim.x + threadIdx.x;
    if (index < count) c[index] = a[index] + b[index];
}

double milliseconds(Clock::time_point start) {
    return std::chrono::duration<double, std::milli>(Clock::now() - start).count();
}

double median(std::vector<double>& values) {
    std::sort(values.begin(), values.end());
    return values[values.size() / 2];
}

void benchmark(int count) {
    const auto bytes = count * sizeof(float);
    float *a, *b, *gpu_result, *device_a, *device_b, *device_c;
    check(cudaMallocHost(&a, bytes));
    check(cudaMallocHost(&b, bytes));
    check(cudaMallocHost(&gpu_result, bytes));
    check(cudaMalloc(&device_a, bytes));
    check(cudaMalloc(&device_b, bytes));
    check(cudaMalloc(&device_c, bytes));
    std::vector<float> cpu_result(count);
    for (int i = 0; i < count; ++i) {
        a[i] = (i % 997) * 0.125f;
        b[i] = (i % 251) * 0.25f;
    }

    cudaEvent_t kernel_start, kernel_end;
    check(cudaEventCreate(&kernel_start));
    check(cudaEventCreate(&kernel_end));
    std::vector<double> cpu, kernel, transfers;
    for (int run = -warmups; run < samples; ++run) {
        auto start = Clock::now();
        for (int i = 0; i < count; ++i) cpu_result[i] = a[i] + b[i];
        const double cpu_time = milliseconds(start);

        start = Clock::now();
        check(cudaMemcpy(device_a, a, bytes, cudaMemcpyHostToDevice));
        check(cudaMemcpy(device_b, b, bytes, cudaMemcpyHostToDevice));
        const double upload_time = milliseconds(start);

        check(cudaEventRecord(kernel_start));
        add_gpu<<<(count + block_size - 1) / block_size, block_size>>>(device_a, device_b, device_c, count);
        check(cudaGetLastError());
        check(cudaEventRecord(kernel_end));
        check(cudaEventSynchronize(kernel_end));
        float kernel_time;
        check(cudaEventElapsedTime(&kernel_time, kernel_start, kernel_end));

        start = Clock::now();
        check(cudaMemcpy(gpu_result, device_c, bytes, cudaMemcpyDeviceToHost));
        const double download_time = milliseconds(start);
        if (run >= 0) {
            cpu.push_back(cpu_time);
            kernel.push_back(kernel_time);
            transfers.push_back(upload_time + download_time);
        }
    }

    if (!std::equal(cpu_result.begin(), cpu_result.end(), gpu_result)) {
        std::cerr << "CPU/GPU results differ at size " << count << '\n';
        std::exit(EXIT_FAILURE);
    }
    std::cout << count << ',' << median(cpu) << ',' << median(kernel) << ',' << median(transfers) << '\n';

    check(cudaEventDestroy(kernel_end));
    check(cudaEventDestroy(kernel_start));
    check(cudaFree(device_c));
    check(cudaFree(device_b));
    check(cudaFree(device_a));
    check(cudaFreeHost(gpu_result));
    check(cudaFreeHost(b));
    check(cudaFreeHost(a));
}

int main() {
    cudaDeviceProp gpu{};
    check(cudaGetDeviceProperties(&gpu, 0));
    check(cudaSetDevice(0));
    std::cout << "GPU: " << gpu.name << '\n';
    std::cout << "elements,cpu_ms,kernel_ms,transfers_ms\n" << std::fixed << std::setprecision(4);
    for (int count : {65'536, 1'048'576, 16'777'216}) benchmark(count);
    std::cout << "All output elements matched the CPU result at every size.\n";
}
