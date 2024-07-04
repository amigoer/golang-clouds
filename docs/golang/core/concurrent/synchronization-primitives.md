---
order : 4
---

# 4. 同步原语

控制原语（Control Primitives）是并发编程中用于管理和协调多个线程或协程的基本构建块。它们帮助程序确保资源的正确使用和状态的一致性。以下是一些常见的控制原语：

## 1. 锁（Locks）

锁用于确保在任何时刻，只有一个线程可以访问某个资源，从而避免数据竞争和不一致性。常见的锁类型有：
- **互斥锁（Mutex）**：用于保护临界区，确保一次只有一个线程执行。
- **读写锁（RWMutex）**：允许多个线程同时读取资源，但在写入时独占资源。

Go 语言中的互斥锁和读写锁使用示例：

```go
package main

import (
    "fmt"
    "sync"
)

var (
    mu sync.Mutex // 互斥锁，用于保护共享资源
    count int     // 共享资源
)

// increment 函数使用互斥锁来确保对共享资源的安全访问
func increment() {
    mu.Lock()   // 加锁，进入临界区
    defer mu.Unlock() // 函数结束时解锁
    count++    // 修改共享资源
}

func main() {
    var wg sync.WaitGroup // WaitGroup 用于等待所有 Goroutine 完成

    // 启动 1000 个 Goroutine，每个 Goroutine 调用 increment 函数
    for i := 0; i < 1000; i++ {
        wg.Add(1) // 增加 WaitGroup 计数
        go func() {
            defer wg.Done() // 函数结束时减少 WaitGroup 计数
            increment()
        }()
    }

    wg.Wait() // 等待所有 Goroutine 完成
    fmt.Println("Final count:", count) // 打印最终结果
}
```

## 2. 条件变量（Condition Variables）
条件变量用于阻塞线程，直到某个特定条件为真。它们通常与互斥锁结合使用，用于实现更复杂的同步场景。

Go 语言中使用条件变量：

```go
package main

import (
    "fmt"
    "sync"
)

var (
    mu sync.Mutex         // 互斥锁，用于保护共享资源
    cond = sync.NewCond(&mu) // 条件变量
    ready = false        // 条件变量的条件
)

// waitCondition 函数等待条件变量满足条件
func waitCondition() {
    mu.Lock() // 加锁，进入临界区
    for !ready {
        cond.Wait() // 等待条件变量满足条件
    }
    fmt.Println("Condition met, proceeding")
    mu.Unlock() // 解锁，离开临界区
}

// signalCondition 函数设置条件变量，并通知等待的 Goroutine
func signalCondition() {
    mu.Lock()   // 加锁，进入临界区
    ready = true // 修改条件
    cond.Signal() // 通知等待的 Goroutine
    mu.Unlock() // 解锁，离开临界区
}

func main() {
    var wg sync.WaitGroup // WaitGroup 用于等待所有 Goroutine 完成
    wg.Add(1)
    go func() {
        defer wg.Done()
        waitCondition()
    }()

    signalCondition()
    wg.Wait()
}
```

## 3. 信号量（Semaphores）
信号量是一个计数器，用于限制对资源的访问次数。它可以控制同时访问某个资源的线程数。

Go 语言中没有直接的信号量实现，可以使用带缓冲的通道来模拟：

```go
package main

import (
    "fmt"
    "time"
)

// worker 函数模拟工作，通过信号量控制并发数
func worker(sem chan struct{}, id int) {
    sem <- struct{}{} // 获取信号量，进入临界区
    fmt.Printf("Worker %d is working\n", id)
    time.Sleep(time.Second) // 模拟工作
    fmt.Printf("Worker %d is done\n", id)
    <-sem // 释放信号量，离开临界区
}

func main() {
    const maxWorkers = 3     // 最大并发数
    sem := make(chan struct{}, maxWorkers) // 带缓冲通道作为信号量

    // 启动 10 个 Goroutine，每个 Goroutine 调用 worker 函数
    for i := 0; i < 10; i++ {
        go worker(sem, i)
    }

    time.Sleep(5 * time.Second) // 等待所有 worker 完成
}
```

## 4. 事件（Events）
事件用于通知线程某个条件已经发生，可以继续执行。通常在等待某个操作完成时使用。

Go 语言中可以使用通道来实现事件机制：

```go
package main

import "fmt"

// worker 函数完成后通过通道通知 main 函数
func worker(done chan bool) {
    fmt.Println("Worker is working")
    done <- true // 发送完成信号
}

func main() {
    done := make(chan bool) // 创建通道
    go worker(done)         // 启动 worker Goroutine
    <-done                  // 等待 worker 完成
    fmt.Println("Worker is done")
}
```

## 5. 栅栏（Barriers）
栅栏用于使一组线程在某个点上同步，只有当所有线程都到达这个点时，它们才会继续执行。

Go 语言中没有直接的栅栏实现，但可以通过 `sync.WaitGroup` 模拟：

```go
package main

import (
    "fmt"
    "sync"
)

// worker 函数模拟工作
func worker(id int, wg *sync.WaitGroup) {
    defer wg.Done() // 函数结束时减少 WaitGroup 计数
    fmt.Printf("Worker %d is working\n", id)
}

func main() {
    var wg sync.WaitGroup // WaitGroup 用于等待所有 Goroutine 完成
    numWorkers := 5

    // 启动 numWorkers 个 Goroutine，每个 Goroutine 调用 worker 函数
    for i := 0; i < numWorkers; i++ {
        wg.Add(1) // 增加 WaitGroup 计数
        go worker(i, &wg)
    }

    wg.Wait() // 等待所有 Goroutine 完成
    fmt.Println("All workers are done")
}
```

## 6. 原子操作（Atomic Operations）
原子操作是不可分割的操作，用于确保在多线程环境下变量的操作是安全的。

Go 语言中的原子操作：

```go
package main

import (
    "fmt"
    "sync/atomic"
)

func main() {
    var count int32 = 0 // 使用 int32 类型的计数器

    // 启动 1000 个 Goroutine，每个 Goroutine 执行原子加操作
    for i := 0; i < 1000; i++ {
        go func() {
            atomic.AddInt32(&count, 1) // 原子加操作
        }()
    }

    // 在实际使用中，可以使用 sync.WaitGroup 等待所有 Goroutine 完成
    // 这里为了简单，直接打印结果
    fmt.Println("Final count:", atomic.LoadInt32(&count)) // 读取计数器值
}
```

控制原语是并发编程的基础，通过合理使用这些原语，可以有效地管理并发程序的复杂性，确保数据一致性和程序的正确性。